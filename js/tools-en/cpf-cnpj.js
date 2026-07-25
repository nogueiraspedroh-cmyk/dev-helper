// js/tools-en/cpf-cnpj.js — logic for the CPF/CNPJ Generator and Validator (English version).
// Loaded ONLY on en/tools/cpf-cnpj/index.html, after js/main.js.
// Mirrors js/tools/cpf-cnpj.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent — never innerHTML.

(function () {
  "use strict";

  // ─── Weight constants ────────────────────────────────────────────────────────

  // CPF: weights for the 1st check digit (over 9 base digits) and the 2nd (over 10 digits)
  var CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  var CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  // CNPJ: weights for the 1st check digit (over 12 base characters)
  var CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  // CNPJ: weights for the 2nd check digit (over 13 characters = base + 1st DV)
  var CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Invalid CPF sequences (all digits equal)
  var CPF_INVALID_SEQS = [
    "00000000000", "11111111111", "22222222222", "33333333333",
    "44444444444", "55555555555", "66666666666", "77777777777",
    "88888888888", "99999999999"
  ];

  // Valid alphanumeric characters for the alphanumeric CNPJ (0-9, A-Z)
  var ALNUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // ─── Numeric utilities ───────────────────────────────────────────────────────

  /** Returns a random integer in [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Calculates a check digit from an array of numeric values
   * and an array of weights of the same length.
   * Rule: sum of products → remainder = sum % 11 → DV = remainder < 2 ? 0 : 11 - remainder
   */
  function calcDV(values, weights) {
    var sum = 0;
    for (var i = 0; i < weights.length; i++) {
      sum += values[i] * weights[i];
    }
    var resto = sum % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  // ─── CPF ────────────────────────────────────────────────────────────────────

  /**
   * Generates 9 random base digits that don't form an invalid sequence,
   * calculates the 2 check digits and returns the 11-digit string.
   */
  function gerarCPF() {
    var base;
    do {
      base = [];
      for (var i = 0; i < 9; i++) {
        base.push(randInt(0, 10));
      }
    } while (CPF_INVALID_SEQS.indexOf(base.join("")) !== -1);

    var dv1 = calcDV(base, CPF_WEIGHTS_1);
    var dv2 = calcDV(base.concat([dv1]), CPF_WEIGHTS_2);
    return base.join("") + dv1 + dv2;
  }

  /**
   * Validates a CPF (digits only, 11 characters).
   * Returns true if valid.
   */
  function validarCPF(digits) {
    if (digits.length !== 11) return false;
    if (CPF_INVALID_SEQS.indexOf(digits) !== -1) return false;

    var nums = digits.split("").map(Number);
    var dv1 = calcDV(nums.slice(0, 9), CPF_WEIGHTS_1);
    var dv2 = calcDV(nums.slice(0, 10), CPF_WEIGHTS_2);
    return nums[9] === dv1 && nums[10] === dv2;
  }

  /** Formats 11 digits as CPF: 000.000.000-00 */
  function formatarCPF(digits) {
    return digits.slice(0, 3) + "." +
           digits.slice(3, 6) + "." +
           digits.slice(6, 9) + "-" +
           digits.slice(9);
  }

  // ─── Numeric CNPJ ───────────────────────────────────────────────────────────

  /**
   * Generates 12 random base digits, calculates the 2 check digits and returns
   * the 14-digit string (traditional numeric CNPJ).
   */
  function gerarCNPJNumerico() {
    var base = [];
    for (var i = 0; i < 12; i++) {
      base.push(randInt(0, 10));
    }

    var dv1 = calcDV(base, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(base.concat([dv1]), CNPJ_WEIGHTS_2);
    return base.join("") + dv1 + dv2;
  }

  /**
   * Validates a numeric CNPJ (digits only, 14 characters).
   * Returns true if valid.
   */
  function validarCNPJNumerico(digits) {
    if (digits.length !== 14) return false;
    // Rejects sequences of equal digits (e.g., 00000000000000)
    if (/^(\d)\1{13}$/.test(digits)) return false;

    var nums = digits.split("").map(Number);
    var dv1 = calcDV(nums.slice(0, 12), CNPJ_WEIGHTS_1);
    var dv2 = calcDV(nums.slice(0, 13), CNPJ_WEIGHTS_2);
    return nums[12] === dv1 && nums[13] === dv2;
  }

  /** Formats 14 digits as CNPJ: 00.000.000/0000-00 */
  function formatarCNPJNumerico(digits) {
    return digits.slice(0, 2) + "." +
           digits.slice(2, 5) + "." +
           digits.slice(5, 8) + "/" +
           digits.slice(8, 12) + "-" +
           digits.slice(12);
  }

  // ─── Alphanumeric CNPJ ──────────────────────────────────────────────────────

  /**
   * Converts an alphanumeric character to the numeric value used in the check-digit calc.
   * Rule: value = charCode - 48
   * '0'..'9' → 0..9 (charCodes 48..57, result 0..9)
   * 'A'..'Z' → 17..42 (charCodes 65..90, result 17..42)
   */
  function charParaValor(ch) {
    return ch.charCodeAt(0) - 48;
  }

  /**
   * Generates 12 random alphanumeric base characters (0-9, A-Z),
   * calculates the 2 check digits (always numeric) and returns the 14-character string.
   */
  function gerarCNPJAlfanumerico() {
    var base = [];
    for (var i = 0; i < 12; i++) {
      base.push(ALNUM_CHARS[randInt(0, ALNUM_CHARS.length)]);
    }

    // Converts each character to its numeric value for the DV calculation
    var baseVals = base.map(charParaValor);

    var dv1 = calcDV(baseVals, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(baseVals.concat([dv1]), CNPJ_WEIGHTS_2);

    return base.join("") + dv1 + dv2;
  }

  /**
   * Validates an alphanumeric CNPJ (14 characters: 12 alphanum + 2 numeric DVs).
   * Returns true if valid.
   */
  function validarCNPJAlfanumerico(str) {
    if (str.length !== 14) return false;

    // The last 2 characters (DVs) must be digits
    var dvPart = str.slice(12);
    if (!/^\d{2}$/.test(dvPart)) return false;

    // The first 12 must be 0-9 or A-Z
    var basePart = str.slice(0, 12);
    if (!/^[0-9A-Z]{12}$/.test(basePart)) return false;

    var baseVals = basePart.split("").map(charParaValor);
    var dvs = dvPart.split("").map(Number);

    var dv1 = calcDV(baseVals, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(baseVals.concat([dv1]), CNPJ_WEIGHTS_2);

    return dvs[0] === dv1 && dvs[1] === dv2;
  }

  /**
   * Detects whether a CNPJ (already unmasked, 14 characters) is alphanumeric.
   * Considers it alphanumeric if it has at least one letter in the first 12 characters.
   */
  function isCNPJAlfanumerico(str) {
    return /[A-Z]/.test(str.slice(0, 12));
  }

  // ─── Unified validator (CPF or CNPJ) ────────────────────────────────────────

  /**
   * Removes all characters that are not digits or uppercase A-Z letters.
   * Used to ignore masks (dots, dashes, slashes).
   */
  function removerMascara(str) {
    return str.toUpperCase().replace(/[^0-9A-Z]/g, "");
  }

  /**
   * Detects the type and validates CPF or CNPJ.
   * Returns an object { tipo, valido, mensagem }.
   */
  function validarDocumento(raw) {
    var limpo = removerMascara(raw);

    if (limpo.length === 11) {
      // CPF: digits only
      if (/^\d{11}$/.test(limpo)) {
        var ok = validarCPF(limpo);
        return {
          tipo: "CPF",
          valido: ok,
          mensagem: ok ? "VALID CPF" : "INVALID CPF"
        };
      }
      return { tipo: "CPF", valido: false, mensagem: "INVALID CPF — incorrect format" };
    }

    if (limpo.length === 14) {
      // Numeric CNPJ (digits only)
      if (/^\d{14}$/.test(limpo)) {
        var okN = validarCNPJNumerico(limpo);
        return {
          tipo: "CNPJ",
          valido: okN,
          mensagem: okN ? "VALID CNPJ" : "INVALID CNPJ"
        };
      }
      // Alphanumeric CNPJ (12 alphanum base + 2 numeric DVs)
      if (/^[0-9A-Z]{12}\d{2}$/.test(limpo)) {
        var okA = validarCNPJAlfanumerico(limpo);
        return {
          tipo: "CNPJ alfanumerico",
          valido: okA,
          mensagem: okA ? "VALID ALPHANUMERIC CNPJ" : "INVALID ALPHANUMERIC CNPJ"
        };
      }
      return { tipo: "CNPJ", valido: false, mensagem: "INVALID CNPJ — incorrect format" };
    }

    return {
      tipo: "desconhecido",
      valido: false,
      mensagem: "Invalid document — incorrect length (expected 11 digits for CPF or 14 for CNPJ)"
    };
  }

  // ─── DOM references ──────────────────────────────────────────────────────────

  var btnGerarCPF     = document.getElementById("btn-gerar-cpf");
  var btnGerarCNPJ    = document.getElementById("btn-gerar-cnpj");
  var btnCopiarGerado = document.getElementById("btn-copiar-gerado");
  var btnValidar      = document.getElementById("btn-validar");
  var btnLimparVal    = document.getElementById("btn-limpar-validar");

  var chkFormatar     = document.getElementById("chk-formatar");
  var outputGerado    = document.getElementById("output-gerado");

  var inputValidar    = document.getElementById("input-validar");
  var resultValidar   = document.getElementById("result-validar");

  // Silently stops if the essential elements don't exist.
  if (
    !btnGerarCPF || !btnGerarCNPJ || !btnCopiarGerado || !btnValidar ||
    !chkFormatar || !outputGerado || !inputValidar || !resultValidar
  ) {
    return;
  }

  // ─── UI helpers ──────────────────────────────────────────────────────────────

  /**
   * Returns the selected CNPJ format: "numerico" or "alfanumerico".
   */
  function getFormatoCNPJ() {
    var radios = document.getElementsByName("cnpj-formato");
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return "numerico";
  }

  /**
   * Copies text to the clipboard (with fallback to execCommand).
   */
  function copiarTexto(text, btn) {
    if (!text) return;
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

  function handleGerarCPF() {
    var cpf = gerarCPF();
    var formatar = chkFormatar && chkFormatar.checked;
    outputGerado.value = formatar ? formatarCPF(cpf) : cpf;
  }

  function handleGerarCNPJ() {
    var formato = getFormatoCNPJ();
    var cnpj;
    var formatar = chkFormatar && chkFormatar.checked;

    if (formato === "alfanumerico") {
      cnpj = gerarCNPJAlfanumerico();
      // The alphanumeric CNPJ has no official mask defined yet — show it unmasked
      // (the Receita Federal has not published a mask for the alphanumeric format)
      outputGerado.value = cnpj;
    } else {
      cnpj = gerarCNPJNumerico();
      outputGerado.value = formatar ? formatarCNPJNumerico(cnpj) : cnpj;
    }
  }

  function handleCopiar() {
    if (!outputGerado) return;
    copiarTexto(outputGerado.value, btnCopiarGerado);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) return;

    var raw = inputValidar.value.trim();
    if (raw === "") {
      resultValidar.textContent = "Enter a CPF or CNPJ to validate.";
      resultValidar.className = "result-validar result-validar--neutro";
      return;
    }

    var resultado = validarDocumento(raw);

    // Displayed via textContent — no XSS risk
    resultValidar.textContent = resultado.mensagem;
    resultValidar.className = resultado.valido
      ? "result-validar result-validar--valido"
      : "result-validar result-validar--invalido";
  }

  function handleLimparValidar() {
    if (inputValidar)  inputValidar.value  = "";
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className = "result-validar";
    }
  }

  // ─── Event registration ──────────────────────────────────────────────────────

  btnGerarCPF.addEventListener("click",     handleGerarCPF);
  btnGerarCNPJ.addEventListener("click",    handleGerarCNPJ);
  btnCopiarGerado.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click",      handleValidar);

  // Allow validating with Enter in the validation field
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleValidar();
  });

  if (btnLimparVal) {
    btnLimparVal.addEventListener("click", handleLimparValidar);
  }

})();
