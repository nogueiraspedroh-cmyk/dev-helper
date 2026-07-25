// js/tools/base64.js — Base64 / URL encode-decode.
// Carregado APENAS em tools/base64/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: entrada/saída via .value (textarea) — NUNCA innerHTML.
// UTF-8 seguro: encode/decode passam por encodeURIComponent para não corromper
// caracteres acentuados/emoji (btoa/atob operam sobre latin1).

(function () {
  "use strict";

  // --- Referências ao DOM ---
  var inputEl   = document.getElementById("b64-input");
  var outputEl  = document.getElementById("b64-output");
  var errorEl   = document.getElementById("b64-error");
  var btnEncode = document.getElementById("btn-b64-encode");
  var btnDecode = document.getElementById("btn-b64-decode");
  var btnClear  = document.getElementById("btn-b64-clear");
  var btnCopy   = document.getElementById("btn-b64-copy");
  var radiosModo = document.querySelectorAll('input[name="b64-modo"]');

  if (
    !inputEl || !outputEl || !errorEl ||
    !btnEncode || !btnDecode || !btnClear || !btnCopy ||
    !radiosModo || radiosModo.length === 0
  ) {
    return;
  }

  // --- Modo atual ---
  function modoAtual() {
    for (var i = 0; i < radiosModo.length; i++) {
      if (radiosModo[i].checked) return radiosModo[i].value; // "base64" | "url"
    }
    return "base64";
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    outputEl.value = "";
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  // --- Base64 UTF-8 seguro ---
  function base64Encode(str) {
    // encodeURIComponent → escapa multibyte; unescape reconstrói latin1 p/ btoa
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64Decode(str) {
    var binary;
    try {
      binary = atob(str.trim());
    } catch (e) {
      throw new Error("entrada não é Base64 válida (caracteres inválidos ou comprimento incorreto).");
    }
    try {
      return decodeURIComponent(escape(binary));
    } catch (e) {
      // Não era UTF-8 — devolve o binário cru
      return binary;
    }
  }

  // --- URL encode/decode ---
  function urlDecode(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      throw new Error("entrada não é uma sequência URL-encoded válida (sequência % malformada).");
    }
  }

  // --- Handlers ---
  function handleEncode() {
    clearError();
    var text = inputEl.value;
    if (text === "") { outputEl.value = ""; return; }
    try {
      if (modoAtual() === "base64") {
        outputEl.value = base64Encode(text);
      } else {
        outputEl.value = encodeURIComponent(text);
      }
    } catch (e) {
      showError("Erro ao codificar: " + e.message);
    }
  }

  function handleDecode() {
    clearError();
    var text = inputEl.value;
    if (text === "") { outputEl.value = ""; return; }
    try {
      if (modoAtual() === "base64") {
        outputEl.value = base64Decode(text);
      } else {
        outputEl.value = urlDecode(text);
      }
    } catch (e) {
      showError("Erro ao decodificar: " + e.message);
    }
  }

  function handleClear() {
    inputEl.value = "";
    outputEl.value = "";
    clearError();
  }

  // --- Cópia com fallback ---
  function handleCopy() {
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

  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopy, "Copiado!");
    } catch (e) {
      // Silencia
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  btnEncode.addEventListener("click", handleEncode);
  btnDecode.addEventListener("click", handleDecode);
  btnClear.addEventListener("click", handleClear);
  btnCopy.addEventListener("click", handleCopy);
  // Ao trocar de modo, limpa a saída/erro para evitar confusão
  Array.prototype.forEach.call(radiosModo, function (r) {
    r.addEventListener("change", function () {
      outputEl.value = "";
      clearError();
    });
  });

})();
