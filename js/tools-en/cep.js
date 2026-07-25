// js/tools-en/cep.js — logic for the CEP (Brazilian ZIP Code) Generator and Validator (English version).
// Loaded ONLY on en/tools/cep/index.html, after js/main.js.
// Mirrors js/tools/cep.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent — never innerHTML.
//
// IMPORTANT: the Brazilian CEP does NOT have a check digit.
// This tool's "validation" only checks FORMAT (8 numeric digits),
// it does not confirm the CEP exists in the Correios' database.

(function () {
  "use strict";

  // ─── Region map ─────────────────────────────────────────────────────────────
  //
  // Key: first digit of the CEP (string "0".."9").
  // Value: human-readable name of the corresponding region.
  // Source: official Correios rule for CEP ranges.

  var REGIOES = {
    "0": "Greater São Paulo",
    "1": "SP countryside",
    "2": "RJ and ES",
    "3": "MG",
    "4": "BA and SE",
    "5": "PE, AL, PB and RN",
    "6": "CE, PI, MA, PA, AM, AC, AP and RR",
    "7": "DF, GO, TO, MT, MS and RO",
    "8": "PR and SC",
    "9": "RS"
  };

  // Array of valid initial digits (for random generation)
  var DIGITOS_INICIAIS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // ─── Numeric utilities ───────────────────────────────────────────────────────

  /** Returns a random integer in [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Returns a random digit (0–9) as a string. */
  function randDigit() {
    return String(randInt(0, 10));
  }

  // ─── CEP logic ───────────────────────────────────────────────────────────────

  /**
   * Generates an 8-digit numeric CEP.
   *
   * @param {string|null} primeiroDigito — fixed initial digit ("0".."9")
   *   or null for random.
   * @returns {string} — string with exactly 8 digits.
   */
  function gerarCEP(primeiroDigito) {
    var d0;

    if (primeiroDigito !== null &&
        primeiroDigito !== undefined &&
        REGIOES[primeiroDigito] !== undefined) {
      d0 = primeiroDigito;
    } else {
      // Random: picks one of the 10 initial digits
      d0 = DIGITOS_INICIAIS[randInt(0, DIGITOS_INICIAIS.length)];
    }

    var digits = d0;
    for (var i = 1; i < 8; i++) {
      digits += randDigit();
    }
    return digits;
  }

  /**
   * Applies the NNNNN-NNN mask to an 8-digit string.
   *
   * @param {string} digits — 8 numeric digits.
   * @returns {string} — e.g., "01310-100"
   */
  function formatarCEP(digits) {
    return digits.slice(0, 5) + "-" + digits.slice(5);
  }

  /**
   * Removes hyphen and spaces from a CEP to obtain only digits.
   *
   * @param {string} raw — user input (with or without mask).
   * @returns {string} — digits only.
   */
  function removerMascara(raw) {
    return raw.replace(/[\s\-]/g, "");
  }

  /**
   * Validates the format of a CEP (format only — does not confirm existence).
   *
   * Valid format criteria:
   *   - Exactly 8 numeric digits (after removing the mask).
   *   - First digit between 0 and 9 (any sequence is accepted — no check digit).
   *
   * @param {string} raw — CEP entered by the user (with or without mask).
   * @returns {{ valido: boolean, mensagem: string }}
   */
  function validarCEP(raw) {
    var limpo = removerMascara(raw.trim());

    if (limpo.length === 0) {
      return {
        valido: false,
        mensagem: "Enter a CEP to validate."
      };
    }

    // Checks whether it contains only digits
    if (!/^\d+$/.test(limpo)) {
      return {
        valido: false,
        mensagem: "INVALID CEP — contains non-numeric characters."
      };
    }

    // Checks the exact length of 8 digits
    if (limpo.length !== 8) {
      return {
        valido: false,
        mensagem: "INVALID CEP — must have 8 digits (found: " + limpo.length + ")."
      };
    }

    // Valid format — identifies the region by the first digit
    var primeiroDigito = limpo[0];
    var regiao = REGIOES[primeiroDigito] || "unknown";

    return {
      valido: true,
      mensagem: "VALID CEP — Region: " + regiao + " (1st digit: " + primeiroDigito + ")."
    };
  }

  // ─── DOM references ──────────────────────────────────────────────────────────

  var regiaoSelect      = document.getElementById("regiao-select");
  var chkFormatar       = document.getElementById("chk-formatar-cep");
  var btnGerar          = document.getElementById("btn-gerar-cep");
  var outputGerado      = document.getElementById("output-cep-gerado");
  var btnCopiar         = document.getElementById("btn-copiar-cep");

  var inputValidar      = document.getElementById("input-validar-cep");
  var btnValidar        = document.getElementById("btn-validar-cep");
  var btnLimparValidar  = document.getElementById("btn-limpar-validar-cep");
  var resultValidar     = document.getElementById("result-validar-cep");

  // Guard — silently stops if the essential elements don't exist.
  if (
    !regiaoSelect || !chkFormatar || !btnGerar || !outputGerado || !btnCopiar ||
    !inputValidar || !btnValidar || !resultValidar
  ) {
    return;
  }

  // ─── UI helpers ──────────────────────────────────────────────────────────────

  /**
   * Copies text to the clipboard with fallback to execCommand.
   */
  function copiarTexto(text, btn) {
    if (!text) { return; }
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
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silence — user can copy manually
    } finally {
      document.body.removeChild(tmp);
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    if (!regiaoSelect || !chkFormatar || !outputGerado) { return; }

    var escolha = regiaoSelect.value;
    // "aleatorio" → passes null; digit "0".."9" → passes the digit
    var primeiroDigito = (escolha === "aleatorio") ? null : escolha;

    var cep     = gerarCEP(primeiroDigito);
    var formatar = chkFormatar.checked;

    // Output via .value — no XSS risk
    outputGerado.value = formatar ? formatarCEP(cep) : cep;
  }

  function handleCopiar() {
    if (!outputGerado) { return; }
    copiarTexto(outputGerado.value, btnCopiar);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) { return; }

    var raw = inputValidar.value;

    if (raw.trim() === "") {
      resultValidar.textContent = "Enter a CEP to validate.";
      resultValidar.className   = "result-validar result-validar--neutro";
      return;
    }

    var resultado = validarCEP(raw);

    // Displayed via textContent — no XSS risk
    resultValidar.textContent = resultado.mensagem;
    resultValidar.className   = resultado.valido
      ? "result-validar result-validar--valido"
      : "result-validar result-validar--invalido";
  }

  function handleLimparValidar() {
    if (inputValidar) { inputValidar.value = ""; }
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className   = "result-validar";
    }
  }

  // ─── Event registration ──────────────────────────────────────────────────────

  btnGerar.addEventListener("click",  handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click", handleValidar);

  // Allow validating by pressing Enter in the validation field
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { handleValidar(); }
  });

  if (btnLimparValidar) {
    btnLimparValidar.addEventListener("click", handleLimparValidar);
  }

})();
