// js/tools-en/uuid.js — logic for the UUID Generator (v4) (English version).
// Loaded ONLY on en/tools/uuid/index.html, after js/main.js.
// Mirrors js/tools/uuid.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent and
// createElement — NEVER innerHTML with user data.
// Randomness: crypto.randomUUID when available; fallback via
// crypto.getRandomValues (both CSPRNG). No Math.random.

(function () {
  "use strict";

  // --- DOM references ---
  var qtdEl        = document.getElementById("uuid-quantidade");
  var chkHifens    = document.getElementById("uuid-hifens");
  var chkMaiusculo = document.getElementById("uuid-maiusculo");
  var btnGerar     = document.getElementById("btn-uuid-gerar");
  var btnCopiarTodos = document.getElementById("btn-uuid-copiar-todos");
  var listaEl      = document.getElementById("uuid-lista");
  var errorEl      = document.getElementById("uuid-error");

  if (
    !qtdEl || !chkHifens || !chkMaiusculo ||
    !btnGerar || !btnCopiarTodos || !listaEl || !errorEl
  ) {
    return;
  }

  var MAX_QTD = 100;

  var cryptoOk = (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.getRandomValues === "function"
  );

  // --- Generation ---

  /**
   * Generates a UUID v4. Uses crypto.randomUUID if available; otherwise,
   * builds it from getRandomValues (16 bytes, with version/variant bits).
   */
  function gerarUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    // Fallback: 16 cryptographically random bytes
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    // Version 4 (bits 12-15 of time_hi_and_version)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // RFC 4122 variant (bits 6-7 of clock_seq_hi_and_reserved)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var i = 0; i < 16; i++) {
      hex.push(("0" + bytes[i].toString(16)).slice(-2));
    }
    return (
      hex.slice(0, 4).join("") + "-" +
      hex.slice(4, 6).join("") + "-" +
      hex.slice(6, 8).join("") + "-" +
      hex.slice(8, 10).join("") + "-" +
      hex.slice(10, 16).join("")
    );
  }

  /** Applies the formatting options (hyphens, case) to the UUID. */
  function formatar(uuid) {
    var out = uuid;
    if (!chkHifens.checked) {
      out = out.replace(/-/g, "");
    }
    if (chkMaiusculo.checked) {
      out = out.toUpperCase();
    } else {
      out = out.toLowerCase();
    }
    return out;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /** Reads and validates the quantity, clamping it between 1 and MAX_QTD. */
  function lerQuantidade() {
    var val = parseInt(qtdEl.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > MAX_QTD) val = MAX_QTD;
    return val;
  }

  /**
   * Builds a list row (readonly input + copy button) via createElement.
   * @param {string} valor
   */
  function criarLinha(valor) {
    var linha = document.createElement("div");
    linha.className = "uuid-item";

    var campo = document.createElement("input");
    campo.type = "text";
    campo.readOnly = true;
    campo.className = "tool__result-input uuid-item__input";
    campo.value = valor; // .value — no XSS risk
    campo.setAttribute("spellcheck", "false");
    linha.appendChild(campo);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button--secondary uuid-item__copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      copyText(valor, btn);
    });
    linha.appendChild(btn);

    return linha;
  }

  function handleGerar() {
    clearError();

    if (!cryptoOk) {
      showError("Your browser does not support the Web Crypto API. Use a modern browser.");
      return;
    }

    var qtd = lerQuantidade();
    qtdEl.value = qtd; // syncs the field with the validated value

    // Clears the current list without innerHTML
    while (listaEl.firstChild) {
      listaEl.removeChild(listaEl.firstChild);
    }

    for (var i = 0; i < qtd; i++) {
      var valor = formatar(gerarUuid());
      listaEl.appendChild(criarLinha(valor));
    }

    btnCopiarTodos.hidden = qtd < 2;
  }

  /** Collects all UUIDs from the list, one per line. */
  function coletarTodos() {
    var inputs = listaEl.querySelectorAll(".uuid-item__input");
    var vals = [];
    Array.prototype.forEach.call(inputs, function (el) {
      vals.push(el.value);
    });
    return vals.join("\n");
  }

  function handleCopiarTodos() {
    var texto = coletarTodos();
    copyText(texto, btnCopiarTodos);
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copied!");
      }).catch(function () {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silences
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  btnGerar.addEventListener("click", handleGerar);
  btnCopiarTodos.addEventListener("click", handleCopiarTodos);
  // Regenerates when formatting options change (if something has already been generated)
  chkHifens.addEventListener("change", function () {
    if (listaEl.firstChild) handleGerar();
  });
  chkMaiusculo.addEventListener("change", function () {
    if (listaEl.firstChild) handleGerar();
  });

  // Generates an initial UUID on load
  handleGerar();

})();
