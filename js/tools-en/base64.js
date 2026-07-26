// js/tools-en/base64.js — Base64 / URL encode-decode (English version).
// Loaded ONLY on en/tools/base64/index.html, after js/main.js.
// Mirrors js/tools/base64.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: input/output via .value (textarea) — NEVER innerHTML.
// Safe UTF-8: encode/decode go through encodeURIComponent to avoid corrupting
// accented characters/emoji (btoa/atob operate on latin1).

(function () {
  "use strict";

  // --- DOM references ---
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

  // --- Current mode ---
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

  // --- Safe UTF-8 Base64 ---
  function base64Encode(str) {
    // encodeURIComponent → escapes multibyte; unescape rebuilds latin1 for btoa
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64Decode(str) {
    var binary;
    try {
      binary = atob(str.trim());
    } catch (e) {
      throw new Error("input is not valid Base64 (invalid characters or incorrect length).");
    }
    try {
      return decodeURIComponent(escape(binary));
    } catch (e) {
      // Was not UTF-8 — returns the raw binary
      return binary;
    }
  }

  // --- URL encode/decode ---
  function urlDecode(str) {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      throw new Error("input is not a valid URL-encoded sequence (malformed % sequence).");
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
      showError("Error encoding: " + e.message);
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
      showError("Error decoding: " + e.message);
    }
  }

  function handleClear() {
    inputEl.value = "";
    outputEl.value = "";
    clearError();
  }

  // --- Copy with fallback ---
  function handleCopy() {
    var text = outputEl.value;
    if (text === "") return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btnCopy, "Copied!");
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
      window.DevHelper.flashButton(btnCopy, "Copied!");
    } catch (e) {
      // Silences
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  btnEncode.addEventListener("click", handleEncode);
  btnDecode.addEventListener("click", handleDecode);
  btnClear.addEventListener("click", handleClear);
  btnCopy.addEventListener("click", handleCopy);
  // When switching modes, clears output/error to avoid confusion
  Array.prototype.forEach.call(radiosModo, function (r) {
    r.addEventListener("change", function () {
      outputEl.value = "";
      clearError();
    });
  });

})();
