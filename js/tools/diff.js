// js/tools/diff.js — lógica do Diff de texto.
// Carregado APENAS em tools/diff/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: a saída (que contém o texto comparado do usuário) é construída
// SEMPRE via createElement + textContent — NUNCA innerHTML.
//
// Algoritmo: LCS (maior subsequência comum) clássico, sem lib externa.
// Granularidade selecionável: por linha ou por palavra.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — diff via LCS
  // ================================================================

  // Limite de segurança para a tabela DP (n*m). Acima disso, retornamos erro
  // em vez de tentar alocar uma matriz gigante e travar a aba.
  var MAX_CELLS = 4000000;

  /**
   * Diff genérico entre dois arrays de tokens via LCS.
   * @returns {Array<{type:'eq'|'add'|'del', token:string}>}
   */
  function diffTokens(a, b) {
    var n = a.length;
    var m = b.length;

    // dp[i][j] = comprimento da LCS de a[i..] e b[j..]
    var dp = [];
    for (var i = 0; i <= n; i++) {
      dp.push(new Int32Array(m + 1));
    }
    for (var ii = n - 1; ii >= 0; ii--) {
      for (var jj = m - 1; jj >= 0; jj--) {
        if (a[ii] === b[jj]) {
          dp[ii][jj] = dp[ii + 1][jj + 1] + 1;
        } else {
          dp[ii][jj] = dp[ii + 1][jj] >= dp[ii][jj + 1] ? dp[ii + 1][jj] : dp[ii][jj + 1];
        }
      }
    }

    var ops = [];
    var x = 0;
    var y = 0;
    while (x < n && y < m) {
      if (a[x] === b[y]) {
        ops.push({ type: "eq", token: a[x] });
        x++;
        y++;
      } else if (dp[x + 1][y] >= dp[x][y + 1]) {
        ops.push({ type: "del", token: a[x] });
        x++;
      } else {
        ops.push({ type: "add", token: b[y] });
        y++;
      }
    }
    while (x < n) {
      ops.push({ type: "del", token: a[x] });
      x++;
    }
    while (y < m) {
      ops.push({ type: "add", token: b[y] });
      y++;
    }
    return ops;
  }

  /** Tokeniza para o modo palavra, preservando os espaços como tokens. */
  function tokenizeWords(text) {
    if (text === "") {
      return [];
    }
    // Mantém separadores (espaços/quebras) como tokens próprios para
    // reconstruir o texto fielmente.
    return text.split(/(\s+)/).filter(function (t) {
      return t !== "";
    });
  }

  /** Divide em linhas (sem o \n, tratado na renderização). */
  function tokenizeLines(text) {
    return text.split("\n");
  }

  /**
   * Calcula o diff entre dois textos.
   * @param {string} textA
   * @param {string} textB
   * @param {'line'|'word'} mode
   * @returns {{error:(string|null), ops:Array,
   *            stats:{added:number, removed:number, equal:number}}}
   */
  function diffText(textA, textB, mode) {
    var a = mode === "word" ? tokenizeWords(textA) : tokenizeLines(textA);
    var b = mode === "word" ? tokenizeWords(textB) : tokenizeLines(textB);

    if ((a.length + 1) * (b.length + 1) > MAX_CELLS) {
      return {
        error: "Os textos são grandes demais para comparar neste modo. " +
          "Tente o modo por linha ou reduza o conteúdo.",
        ops: [],
        stats: { added: 0, removed: 0, equal: 0 }
      };
    }

    var ops = diffTokens(a, b);
    var stats = { added: 0, removed: 0, equal: 0 };
    ops.forEach(function (op) {
      if (op.type === "add") { stats.added++; }
      else if (op.type === "del") { stats.removed++; }
      else { stats.equal++; }
    });
    return { error: null, ops: ops, stats: stats };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { diffTokens: diffTokens, diffText: diffText, tokenizeWords: tokenizeWords };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputA = document.getElementById("diff-a");
  var inputB = document.getElementById("diff-b");
  var btnCompare = document.getElementById("btn-diff-compare");
  var btnClear = document.getElementById("btn-diff-clear");
  var errorEl = document.getElementById("diff-error");
  var outputEl = document.getElementById("diff-output");
  var statsEl = document.getElementById("diff-stats");
  var modeEls = document.getElementsByName("diff-mode");

  if (!inputA || !inputB || !btnCompare || !btnClear || !errorEl || !outputEl || !statsEl) {
    return;
  }

  function readMode() {
    for (var i = 0; i < modeEls.length; i++) {
      if (modeEls[i].checked) {
        return modeEls[i].value;
      }
    }
    return "line";
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function renderLineMode(ops) {
    ops.forEach(function (op) {
      var line = document.createElement("div");
      line.className = "diff-line diff-line--" + op.type;

      var sign = document.createElement("span");
      sign.className = "diff-line__sign";
      sign.textContent = op.type === "add" ? "+" : op.type === "del" ? "-" : " ";
      line.appendChild(sign);

      var content = document.createElement("span");
      content.className = "diff-line__text";
      // textContent — o texto do usuário nunca vira HTML
      content.textContent = op.token === "" ? " " : op.token;
      line.appendChild(content);

      outputEl.appendChild(line);
    });
  }

  function renderWordMode(ops) {
    var wrap = document.createElement("div");
    wrap.className = "diff-inline";
    ops.forEach(function (op) {
      if (op.type === "eq") {
        wrap.appendChild(document.createTextNode(op.token));
      } else {
        var span = document.createElement("span");
        span.className = "diff-word diff-word--" + op.type;
        span.textContent = op.token;
        wrap.appendChild(span);
      }
    });
    outputEl.appendChild(wrap);
  }

  function compare() {
    clearNode(outputEl);
    errorEl.hidden = true;
    errorEl.textContent = "";

    var mode = readMode();
    var result = diffText(inputA.value, inputB.value, mode);

    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      statsEl.textContent = "";
      return;
    }

    if (mode === "word") {
      renderWordMode(result.ops);
    } else {
      renderLineMode(result.ops);
    }

    var unit = mode === "word" ? "palavra(s)" : "linha(s)";
    statsEl.textContent =
      result.stats.added + " adicionada(s), " +
      result.stats.removed + " removida(s) " + unit +
      (result.stats.added === 0 && result.stats.removed === 0 ? " — os textos são idênticos." : ".");
  }

  function handleClear() {
    inputA.value = "";
    inputB.value = "";
    clearNode(outputEl);
    statsEl.textContent = "";
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  // --- Eventos ---
  btnCompare.addEventListener("click", compare);
  btnClear.addEventListener("click", handleClear);
  for (var i = 0; i < modeEls.length; i++) {
    modeEls[i].addEventListener("change", function () {
      if (outputEl.firstChild) {
        compare(); // recompara ao trocar o modo, se já houver resultado
      }
    });
  }
})();
