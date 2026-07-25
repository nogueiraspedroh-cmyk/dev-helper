// js/tools-en/regex.js — logic for the Regex Tester (English version).
// Loaded ONLY on en/tools/regex/index.html, after js/main.js.
// Mirrors js/tools/regex.js — same logic, only user-visible strings translated.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS CRÍTICO: o texto de teste é do usuário e é reinserido no DOM para
// destacar os matches. Ele NUNCA é escrito via innerHTML — cada segmento
// (match / não-match) vira um nó de texto ou um <mark> montado por
// createElement + textContent. A regex inválida é tratada com try/catch.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — análise de regex
  // ================================================================

  /**
   * Aplica a regex ao texto e devolve a estrutura de resultado.
   * @param {string} pattern
   * @param {string} flags   ex.: "gim"
   * @param {string} text
   * @returns {{error:(string|null), matchCount:number,
   *            matches:Array, segments:Array<{text:string,match:boolean}>}}
   */
  function analyze(pattern, flags, text) {
    if (pattern === "") {
      return { error: null, matchCount: 0, matches: [], segments: [{ text: text, match: false }] };
    }

    var re;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      return { error: e.message, matchCount: 0, matches: [], segments: [{ text: text, match: false }] };
    }

    var matches = [];
    var segments = [];
    var lastIndex = 0;
    var global = flags.indexOf("g") !== -1;

    // Regex sem "g": encontra no máximo 1 match (mas coletamos grupos).
    if (!global) {
      var m = re.exec(text);
      if (m) {
        pushMatch(m, matches);
        segments = buildSegments(text, matches);
      } else {
        segments = [{ text: text, match: false }];
      }
      return { error: null, matchCount: matches.length, matches: matches, segments: segments };
    }

    // Regex com "g": itera todos os matches, protegendo contra loops de
    // matches de largura zero (ex.: /a*/g ou /(?=x)/g).
    var guard = 0;
    var MAX = 100000;
    re.lastIndex = 0;
    var res;
    while ((res = re.exec(text)) !== null) {
      pushMatch(res, matches);
      if (res.index === re.lastIndex) {
        re.lastIndex++; // avança em match vazio para não travar
      }
      if (++guard > MAX) {
        break;
      }
    }
    segments = buildSegments(text, matches);
    void lastIndex;
    return { error: null, matchCount: matches.length, matches: matches, segments: segments };
  }

  function pushMatch(m, out) {
    var groups = [];
    for (var i = 1; i < m.length; i++) {
      groups.push(m[i]);
    }
    out.push({
      index: m.index,
      match: m[0],
      groups: groups,
      named: m.groups ? shallowNamed(m.groups) : null
    });
  }

  function shallowNamed(obj) {
    var out = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        out[k] = obj[k];
      }
    }
    return out;
  }

  /** Divide o texto em segmentos alternando não-match / match, em ordem. */
  function buildSegments(text, matches) {
    var segments = [];
    var cursor = 0;
    matches.forEach(function (mt) {
      // Ignora matches vazios no destaque (não há o que pintar).
      if (mt.match === "") {
        return;
      }
      if (mt.index > cursor) {
        segments.push({ text: text.slice(cursor, mt.index), match: false });
      }
      segments.push({ text: mt.match, match: true });
      cursor = mt.index + mt.match.length;
    });
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), match: false });
    }
    if (segments.length === 0) {
      segments.push({ text: text, match: false });
    }
    return segments;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { analyze: analyze };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var patternEl = document.getElementById("regex-pattern");
  var textEl = document.getElementById("regex-text");
  var errorEl = document.getElementById("regex-error");
  var highlightEl = document.getElementById("regex-highlight");
  var countEl = document.getElementById("regex-count");
  var groupsWrapper = document.getElementById("regex-groups-wrapper");
  var groupsBody = document.getElementById("regex-groups-body");
  var flagEls = {
    g: document.getElementById("regex-flag-g"),
    i: document.getElementById("regex-flag-i"),
    m: document.getElementById("regex-flag-m"),
    s: document.getElementById("regex-flag-s")
  };

  if (
    !patternEl || !textEl || !errorEl || !highlightEl || !countEl ||
    !groupsWrapper || !groupsBody ||
    !flagEls.g || !flagEls.i || !flagEls.m || !flagEls.s
  ) {
    return;
  }

  function readFlags() {
    var f = "";
    if (flagEls.g.checked) { f += "g"; }
    if (flagEls.i.checked) { f += "i"; }
    if (flagEls.m.checked) { f += "m"; }
    if (flagEls.s.checked) { f += "s"; }
    return f;
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  /** Renderiza os segmentos destacando os matches — SEM innerHTML. */
  function renderHighlight(segments) {
    clearNode(highlightEl);
    segments.forEach(function (seg) {
      if (seg.match) {
        var mark = document.createElement("mark");
        mark.className = "regex-match";
        mark.textContent = seg.text; // textContent — sem risco de XSS
        highlightEl.appendChild(mark);
      } else {
        highlightEl.appendChild(document.createTextNode(seg.text));
      }
    });
  }

  /** Monta a tabela de grupos capturados via createElement. */
  function renderGroups(matches) {
    clearNode(groupsBody);
    var anyRow = false;

    matches.forEach(function (mt, mi) {
      // Linha do match inteiro
      addRow("#" + (mi + 1), "full match", mt.match);
      anyRow = true;

      mt.groups.forEach(function (g, gi) {
        addRow("#" + (mi + 1), "group " + (gi + 1), typeof g === "undefined" ? "(no capture)" : g);
      });

      if (mt.named) {
        Object.keys(mt.named).forEach(function (name) {
          var v = mt.named[name];
          addRow("#" + (mi + 1), "group <" + name + ">", typeof v === "undefined" ? "(no capture)" : v);
        });
      }
    });

    groupsWrapper.hidden = !anyRow;
  }

  function addRow(matchLabel, groupLabel, value) {
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    td1.textContent = matchLabel;
    var td2 = document.createElement("td");
    td2.textContent = groupLabel;
    var td3 = document.createElement("td");
    td3.textContent = String(value);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    groupsBody.appendChild(tr);
  }

  function update() {
    var result = analyze(patternEl.value, readFlags(), textEl.value);

    if (result.error) {
      errorEl.textContent = "Invalid regex: " + result.error;
      errorEl.hidden = false;
    } else {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    renderHighlight(result.segments);

    if (patternEl.value === "") {
      countEl.textContent = "Type a pattern to test.";
    } else if (result.error) {
      countEl.textContent = "";
    } else {
      countEl.textContent =
        result.matchCount === 0
          ? "No matches found."
          : result.matchCount + (result.matchCount === 1 ? " match." : " matches.");
    }

    renderGroups(result.matches);
  }

  // --- Eventos ---
  patternEl.addEventListener("input", update);
  textEl.addEventListener("input", update);
  Object.keys(flagEls).forEach(function (k) {
    flagEls[k].addEventListener("change", update);
  });

  // Estado inicial.
  update();
})();
