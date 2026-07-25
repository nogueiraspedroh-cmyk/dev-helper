// js/tools-en/cartao.js — logic for the Credit/Debit Card Generator and Validator (English version).
// Loaded ONLY on en/tools/cartao/index.html, after js/main.js.
// Mirrors js/tools/cartao.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .textContent/.value — never innerHTML.
//
// The generated numbers are FICTITIOUS and intended EXCLUSIVELY for software testing.
// They are valid by the Luhn algorithm but do not belong to any issued card.

(function () {
  "use strict";

  // ─── Brand definitions ───────────────────────────────────────────────────────
  //
  // Each entry defines:
  //   name     — readable brand name.
  //   length   — total number length (in digits).
  //   cvvLen   — CVV length (3 for most; 4 for Amex).
  //   prefixes — array of prefixes (strings) that identify the brand.
  //              For ranges (e.g., MC 51-55), we list each prefix explicitly.
  //   genPrefix — function that returns ONE random valid prefix for generation.

  var BANDEIRAS = {
    visa: {
      name: "Visa",
      length: 16,
      cvvLen: 3,
      prefixes: ["4"],
      genPrefix: function () { return "4"; }
    },

    mastercard: {
      name: "Mastercard",
      length: 16,
      cvvLen: 3,
      // Mastercard prefix ranges:
      //   51–55 (2-digit prefixes)
      //   2221–2720 (4-digit prefixes — expanded Mastercard IIN)
      // For detection we keep the ranges; for generation we randomly choose
      // between the two ranges.
      prefixes: [
        "51", "52", "53", "54", "55"
        // The 2221-2720 range is checked via luhnDetectBandeira with a range check
      ],
      genPrefix: function () {
        // 50% chance of using the classic range (51-55), 50% expanded range (2221-2720)
        if (Math.random() < 0.5) {
          // Classic range: 51-55
          var n = randInt(51, 56); // [51, 55]
          return String(n);
        } else {
          // Expanded range: 2221-2720
          var m = randInt(2221, 2721); // [2221, 2720]
          return String(m);
        }
      }
    },

    amex: {
      name: "American Express",
      length: 15,
      cvvLen: 4,
      prefixes: ["34", "37"],
      genPrefix: function () {
        return Math.random() < 0.5 ? "34" : "37";
      }
    },

    elo: {
      name: "Elo",
      length: 16,
      cvvLen: 3,
      // Representative Elo prefixes. Detection is done by checking whether
      // the number starts with one of these prefixes.
      prefixes: [
        "4011", "4312", "4389",
        "5041", "5066", "5067",
        "6277", "6362", "6363",
        "6500", "6501", "6502", "6503", "6504",
        "6505", "6506", "6507", "6508", "6509",
        "6510", "6511", "6512", "6513", "6514",
        "6515", "6516", "6517", "6518", "6519",
        "6550", "6551", "6552", "6553", "6554",
        "6555", "6556", "6557", "6558", "6559"
      ],
      genPrefix: function () {
        // Representative prefixes for generation
        var opts = [
          "4011", "4312", "4389",
          "5041", "5066", "5067",
          "6277", "6362", "6363",
          "6501", "6511", "6550"
        ];
        return opts[randInt(0, opts.length)];
      }
    },

    hipercard: {
      name: "Hipercard",
      length: 16,
      cvvLen: 3,
      prefixes: ["6062"],
      genPrefix: function () { return "6062"; }
    }
  };

  // Detection order: most specific (longest prefixes) first.
  // Elo (4 digits) before Visa (1 digit), so 4011 doesn't fall into Visa.
  var DETECCAO_ORDER = ["amex", "elo", "hipercard", "mastercard", "visa"];

  // ─── Numeric utilities ───────────────────────────────────────────────────────

  /** Returns a random integer in [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Returns a random digit (0–9). */
  function randDigit() {
    return randInt(0, 10);
  }

  // ─── Luhn algorithm ─────────────────────────────────────────────────────────

  /**
   * Checks whether a string of digits passes the Luhn algorithm.
   *
   * Algorithm (source of truth):
   *   - From right to left, double every second digit.
   *   - If the doubled value > 9, subtract 9.
   *   - Sum all digits (original + doubled/adjusted).
   *   - Valid if sum % 10 === 0.
   *
   * @param {string} digits — string with only numeric digits.
   * @returns {boolean}
   */
  function luhnValido(digits) {
    var sum = 0;
    var shouldDouble = false;
    // Walk from right to left
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) { d -= 9; }
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Calculates the Luhn check digit for a number with n-1 digits already defined.
   *
   * Idea: find the digit X (0–9) such that (prefix + X) is Luhn-valid.
   * Efficient approach: computes the partial sum of the n-1 digits as if they
   * were the complete number and derives the check digit using the modulo-10 property.
   *
   * @param {string} prefix — string with the first n-1 digits.
   * @returns {number} — the check digit (0–9).
   */
  function luhnCheckDigit(prefix) {
    // Adds a "0" placeholder for the check digit and computes the Luhn sum
    // treating that 0 as the rightmost digit.
    var digits = prefix + "0";
    var sum = 0;
    var shouldDouble = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) { d -= 9; }
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    // The check digit is the complement to 10 of the current sum, mod 10
    return (10 - (sum % 10)) % 10;
  }

  // ─── Brand detection ─────────────────────────────────────────────────────────

  /**
   * Detects the brand of a card number by prefixes and length.
   * Returns the brand key (e.g., "visa") or null if unknown.
   *
   * @param {string} digits — string with only numeric digits.
   * @returns {string|null}
   */
  function detectarBandeira(digits) {
    for (var i = 0; i < DETECCAO_ORDER.length; i++) {
      var key = DETECCAO_ORDER[i];
      var bandeira = BANDEIRAS[key];

      // Checks length
      if (digits.length !== bandeira.length) {
        // Mastercard has 16 digits and Amex 15 — only skip if truly different.
        // But some brands share the same length, so we can't filter only by
        // length here — we check prefix + length together.
        // To simplify: check the prefix first, length second.
      }

      // Checks declared prefixes
      var prefixes = bandeira.prefixes;
      for (var j = 0; j < prefixes.length; j++) {
        if (digits.indexOf(prefixes[j]) === 0) {
          // Prefix matches — checks length
          if (digits.length === bandeira.length) {
            return key;
          }
        }
      }

      // Mastercard expanded range 2221–2720 (4-digit prefixes)
      if (key === "mastercard" && digits.length === 16) {
        var pref4 = parseInt(digits.slice(0, 4), 10);
        if (!isNaN(pref4) && pref4 >= 2221 && pref4 <= 2720) {
          return "mastercard";
        }
      }

      // Elo 650x, 651x, 655x ranges: checked by range on the first 4 digits
      if (key === "elo" && digits.length === 16) {
        var pref4Elo = parseInt(digits.slice(0, 4), 10);
        if (!isNaN(pref4Elo)) {
          if ((pref4Elo >= 6500 && pref4Elo <= 6519) ||
              (pref4Elo >= 6550 && pref4Elo <= 6559)) {
            return "elo";
          }
        }
      }
    }

    return null;
  }

  // ─── Card number generator ──────────────────────────────────────────────────

  /**
   * Generates a Luhn-valid card number for the given brand.
   *
   * @param {string} bandeiraKey — key in BANDEIRAS (e.g., "visa").
   * @returns {string} — card number (digits only).
   */
  function gerarNumero(bandeiraKey) {
    var bandeira = BANDEIRAS[bandeiraKey];
    var prefix = bandeira.genPrefix();
    var totalLen = bandeira.length;

    // Fills the intermediate digits randomly
    // (the first ones are the prefix; the last one will be the check digit)
    var base = prefix;
    while (base.length < totalLen - 1) {
      base += String(randDigit());
    }

    // Calculates and appends the check digit
    var check = luhnCheckDigit(base);
    return base + String(check);
  }

  /**
   * Generates a future expiration date in MM/YY format.
   * Uses a random month and year, ensuring the card is valid
   * for at least 1 year and at most 5 years from today.
   *
   * @returns {string} — e.g., "08/28"
   */
  function gerarValidade() {
    var agora = new Date();
    var anoAtual = agora.getFullYear();
    var mesAtual = agora.getMonth() + 1; // 1–12

    // Year between currentYear+1 and currentYear+5
    var anoFuturo = randInt(anoAtual + 1, anoAtual + 6);
    var mes = randInt(1, 13); // 01–12

    // If it's the same year (not the case here, but for robustness), ensure a future month
    if (anoFuturo === anoAtual && mes <= mesAtual) {
      mes = mesAtual + 1;
      if (mes > 12) { mes = 1; anoFuturo++; }
    }

    var mm = mes < 10 ? "0" + mes : String(mes);
    var aa = String(anoFuturo).slice(-2);
    return mm + "/" + aa;
  }

  /**
   * Generates a random CVV with the correct number of digits for the brand.
   *
   * @param {number} len — CVV length (3 or 4).
   * @returns {string}
   */
  function gerarCVV(len) {
    var cvv = "";
    for (var i = 0; i < len; i++) {
      cvv += String(randDigit());
    }
    return cvv;
  }

  // ─── Number formatting ────────────────────────────────────────────────────────

  /**
   * Formats the card number with spaces.
   * Amex: 4-6-5 pattern (15 digits: 4 + 6 + 5).
   * Others: 4-4-4-4 pattern (16 digits: 4 + 4 + 4 + 4).
   *
   * @param {string} digits — unmasked number.
   * @param {string} bandeiraKey — brand key.
   * @returns {string}
   */
  function formatarNumero(digits, bandeiraKey) {
    if (bandeiraKey === "amex") {
      // Amex: 4-6-5
      return digits.slice(0, 4) + " " +
             digits.slice(4, 10) + " " +
             digits.slice(10, 15);
    }
    // Default: groups of 4
    var grupos = [];
    for (var i = 0; i < digits.length; i += 4) {
      grupos.push(digits.slice(i, i + 4));
    }
    return grupos.join(" ");
  }

  // ─── Mask cleanup ─────────────────────────────────────────────────────────────

  /**
   * Removes spaces, hyphens and other common card-number separators.
   * Keeps only digits.
   *
   * @param {string} raw
   * @returns {string}
   */
  function removerMascara(raw) {
    return raw.replace(/[\s\-]/g, "");
  }

  // ─── DOM references ──────────────────────────────────────────────────────────

  var bandeiraSelect    = document.getElementById("bandeira-select");
  var chkFormatar       = document.getElementById("chk-formatar-cartao");
  var btnGerar          = document.getElementById("btn-gerar-cartao");
  var cartaoResultado   = document.getElementById("cartao-resultado");
  var outBandeira       = document.getElementById("out-bandeira");
  var outNumero         = document.getElementById("out-numero");
  var outValidade       = document.getElementById("out-validade");
  var outCVV            = document.getElementById("out-cvv");
  var btnCopiarNumero   = document.getElementById("btn-copiar-numero");

  var inputValidar      = document.getElementById("input-validar-cartao");
  var btnValidar        = document.getElementById("btn-validar-cartao");
  var btnLimparValidar  = document.getElementById("btn-limpar-validar-cartao");
  var resultValidar     = document.getElementById("result-validar-cartao");

  // Guard — silently stops if the essential elements don't exist.
  if (
    !bandeiraSelect || !chkFormatar || !btnGerar ||
    !cartaoResultado || !outBandeira || !outNumero ||
    !outValidade || !outCVV || !btnCopiarNumero ||
    !inputValidar || !btnValidar || !resultValidar
  ) {
    return;
  }

  // ─── Internal state ──────────────────────────────────────────────────────────

  // Holds the generated number without mask for the "Copy number" button
  var ultimoNumeroGerado = "";

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
    // Determines the brand to use
    var escolha = bandeiraSelect ? bandeiraSelect.value : "aleatoria";
    var bandeiraKey;

    if (escolha === "aleatoria") {
      var keys = Object.keys(BANDEIRAS);
      bandeiraKey = keys[randInt(0, keys.length)];
    } else if (BANDEIRAS[escolha]) {
      bandeiraKey = escolha;
    } else {
      bandeiraKey = "visa"; // safety fallback
    }

    var bandeira = BANDEIRAS[bandeiraKey];
    var numero   = gerarNumero(bandeiraKey);
    var validade = gerarValidade();
    var cvv      = gerarCVV(bandeira.cvvLen);
    var formatar = chkFormatar && chkFormatar.checked;

    // Stores the unmasked number for the clipboard
    ultimoNumeroGerado = numero;

    // Displays the results via textContent — no XSS risk
    if (outBandeira)  { outBandeira.textContent  = bandeira.name; }
    if (outNumero)    { outNumero.textContent     = formatar ? formatarNumero(numero, bandeiraKey) : numero; }
    if (outValidade)  { outValidade.textContent   = validade; }
    if (outCVV)       { outCVV.textContent        = cvv; }

    // Shows the result area (was hidden on initial load)
    if (cartaoResultado) { cartaoResultado.hidden = false; }
  }

  function handleCopiarNumero() {
    if (!ultimoNumeroGerado) { return; }
    // Always copies the unmasked number
    copiarTexto(ultimoNumeroGerado, btnCopiarNumero);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) { return; }

    var raw = inputValidar.value.trim();
    if (raw === "") {
      resultValidar.textContent = "Enter a card number to validate.";
      resultValidar.className   = "result-validar result-validar--neutro";
      return;
    }

    var digits = removerMascara(raw);

    // Checks whether it contains only digits after removing separators
    if (!/^\d+$/.test(digits)) {
      resultValidar.textContent = "Invalid number — contains non-numeric characters.";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    // Checks reasonable min/max length for cards
    if (digits.length < 13 || digits.length > 19) {
      resultValidar.textContent = "Invalid number — length outside the expected range for cards (13 to 19 digits).";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    var valido      = luhnValido(digits);
    var bandeiraKey = detectarBandeira(digits);
    var nomeBandeira = bandeiraKey ? BANDEIRAS[bandeiraKey].name : "unknown";

    if (valido) {
      resultValidar.textContent = "VALID by Luhn — Detected brand: " + nomeBandeira;
      resultValidar.className   = "result-validar result-validar--valido";
    } else {
      resultValidar.textContent = "INVALID — does not pass the Luhn algorithm. Detected brand: " + nomeBandeira;
      resultValidar.className   = "result-validar result-validar--invalido";
    }
  }

  function handleLimparValidar() {
    if (inputValidar)  { inputValidar.value  = ""; }
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className   = "result-validar";
    }
  }

  // ─── Event registration ──────────────────────────────────────────────────────

  btnGerar.addEventListener("click",        handleGerar);
  btnCopiarNumero.addEventListener("click", handleCopiarNumero);
  btnValidar.addEventListener("click",      handleValidar);

  // Allow validating by pressing Enter in the validation field
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { handleValidar(); }
  });

  if (btnLimparValidar) {
    btnLimparValidar.addEventListener("click", handleLimparValidar);
  }

})();
