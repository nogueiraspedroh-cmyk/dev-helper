// js/tools/json.js — lógica do Formatador/Verificador de JSON.
// Carregado APENAS em tools/json/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value (textarea) — nunca innerHTML.

(function () {
  "use strict";

  // --- Referências ao DOM ---
  var inputEl  = document.getElementById("json-input");
  var outputEl = document.getElementById("json-output");
  var errorEl  = document.getElementById("json-error");
  var selectEl = document.getElementById("indent-select");
  var btnFormat = document.getElementById("btn-format");
  var btnMinify = document.getElementById("btn-minify");
  var btnClear  = document.getElementById("btn-clear");
  var btnCopy   = document.getElementById("btn-copy");

  // Interrompe silenciosamente se os elementos não existirem na página.
  if (
    !inputEl || !outputEl || !errorEl || !selectEl ||
    !btnFormat || !btnMinify || !btnClear || !btnCopy
  ) {
    return;
  }

  // --- Utilitários internos ---

  /**
   * Retorna o valor de indentação selecionado: 2, 4 (number) ou "\t" (string).
   */
  function getIndent() {
    var val = selectEl.value;
    if (val === "tab") return "\t";
    return parseInt(val, 10) || 2;
  }

  /**
   * Exibe uma mensagem de erro legível na área de erro.
   * Tenta extrair informação de posição/linha da mensagem do parser.
   *
   * @param {unknown} err — o erro capturado no catch.
   */
  function showError(err) {
    if (!errorEl) return;

    var raw = (err instanceof Error) ? err.message : String(err);

    // A maioria dos engines inclui "position X" ou "line X column Y" na mensagem.
    // Exibimos a mensagem original, que já traz essa informação na maior parte dos casos.
    var friendly = "Erro de sintaxe: " + raw;

    // Tentativa adicional de extrair posição numérica para contexto extra.
    var posMatch = raw.match(/position\s+(\d+)/i);
    if (posMatch) {
      var pos = parseInt(posMatch[1], 10);
      var inputValue = inputEl ? inputEl.value : "";
      var before = inputValue.slice(0, pos);
      var line = (before.match(/\n/g) || []).length + 1;
      var col  = pos - before.lastIndexOf("\n");
      friendly += "\n(aprox. linha " + line + ", coluna " + col + ")";
    }

    errorEl.textContent = friendly; // textContent — sem risco de XSS
    errorEl.hidden = false;
  }

  /** Limpa a área de erro. */
  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /**
   * Tenta fazer parse do JSON de entrada.
   * Retorna { ok: true, value } ou { ok: false, error }.
   */
  function tryParse(text) {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  // --- Handlers dos botões ---

  /** Formatar: pretty-print com a indentação escolhida. */
  function handleFormat() {
    if (!inputEl || !outputEl) return;
    clearError();

    var text = inputEl.value.trim();
    if (text === "") {
      outputEl.value = "";
      return;
    }

    var result = tryParse(text);
    if (!result.ok) {
      outputEl.value = "";
      showError(result.error);
      return;
    }

    try {
      outputEl.value = JSON.stringify(result.value, null, getIndent());
    } catch (e) {
      // JSON.stringify raramente lança, mas tratamos por robustez.
      showError(e);
    }
  }

  /** Minificar: JSON em uma única linha, sem espaços extras. */
  function handleMinify() {
    if (!inputEl || !outputEl) return;
    clearError();

    var text = inputEl.value.trim();
    if (text === "") {
      outputEl.value = "";
      return;
    }

    var result = tryParse(text);
    if (!result.ok) {
      outputEl.value = "";
      showError(result.error);
      return;
    }

    try {
      outputEl.value = JSON.stringify(result.value);
    } catch (e) {
      showError(e);
    }
  }

  /** Limpar: zera entrada, saída e qualquer mensagem de erro. */
  function handleClear() {
    if (inputEl)  inputEl.value  = "";
    if (outputEl) outputEl.value = "";
    clearError();
  }

  /**
   * Copiar: copia o conteúdo da área de saída para o clipboard.
   * Usa a Clipboard API moderna com fallback para execCommand (browsers legados).
   */
  function handleCopy() {
    if (!outputEl) return;

    var text = outputEl.value;
    if (text === "") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btnCopy, "Copiado!");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  /**
   * Fallback de cópia via elemento temporário + execCommand.
   * Usado em contextos sem Clipboard API (HTTP não-seguro, browsers antigos).
   */
  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopy, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  // --- Registro de eventos ---
  btnFormat.addEventListener("click", handleFormat);
  btnMinify.addEventListener("click", handleMinify);
  btnClear.addEventListener("click",  handleClear);
  btnCopy.addEventListener("click",   handleCopy);

})();
