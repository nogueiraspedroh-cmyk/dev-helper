// js/tools-en/senha.js — logic for the Password Generator (English version).
// Loaded ONLY on en/tools/senha/index.html, after js/main.js.
// Mirrors js/tools/senha.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent — never innerHTML.
// Randomness: window.crypto.getRandomValues (CSPRNG), no Math.random for the password.

(function () {
  "use strict";

  // ─── Base character sets ───────────────────────────────────────────

  var CHARS_MAIUSCULAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var CHARS_MINUSCULAS = "abcdefghijklmnopqrstuvwxyz";
  var CHARS_NUMEROS    = "0123456789";
  var CHARS_SIMBOLOS   = "!@#$%^&*()-_=+[]{};:,.<>?";

  // Ambiguous characters to remove when the option is checked
  var CHARS_AMBIGUOS   = "0Oo1lI";

  // ─── DOM references ─────────────────────────────────────────────────

  var comprimentoEl   = document.getElementById("senha-comprimento");
  var rangeEl         = document.getElementById("senha-range");
  var quantidadeEl    = document.getElementById("senha-quantidade");
  var chkMaiusculas   = document.getElementById("chk-maiusculas");
  var chkMinusculas   = document.getElementById("chk-minusculas");
  var chkNumeros      = document.getElementById("chk-numeros");
  var chkSimbolos     = document.getElementById("chk-simbolos");
  var chkAmbiguos     = document.getElementById("chk-ambiguos");
  var btnGerar        = document.getElementById("btn-gerar-senha");
  var btnCopiar       = document.getElementById("btn-copiar-senha");
  var outputEl        = document.getElementById("output-senha");
  var errorEl         = document.getElementById("senha-error");
  var forcaWrapper    = document.getElementById("senha-forca-wrapper");
  var forcaLabel      = document.getElementById("senha-forca-label");
  var forcaBits       = document.getElementById("senha-forca-bits");
  var forcaBarra      = document.getElementById("senha-forca-barra");
  var loteWrapper     = document.getElementById("senha-lote-wrapper");
  var outputLote      = document.getElementById("output-senha-lote");
  var btnCopiarLote   = document.getElementById("btn-copiar-lote");

  // Stops silently if any essential element does not exist
  // (quantity/batch are optional — degrade to single generation if absent)
  if (
    !comprimentoEl || !rangeEl ||
    !chkMaiusculas || !chkMinusculas || !chkNumeros || !chkSimbolos || !chkAmbiguos ||
    !btnGerar || !btnCopiar ||
    !outputEl || !errorEl ||
    !forcaWrapper || !forcaLabel || !forcaBits || !forcaBarra
  ) {
    return;
  }

  // ─── CSPRNG support check ───────────────────────────────────────────

  var cryptoOk = (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.getRandomValues === "function"
  );

  // ─── Utilities ─────────────────────────────────────────────────────────────

  /**
   * Removes from the string the characters present in 'toRemove'.
   * Returns the resulting string (may be empty).
   */
  function removeChars(str, toRemove) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      if (toRemove.indexOf(str[i]) === -1) {
        result += str[i];
      }
    }
    return result;
  }

  /**
   * Returns a cryptographically secure integer in [0, max) with no modulo bias.
   * Rejects values outside the largest multiple of 'max' that fits in Uint32.
   *
   * @param {number} max - exclusive limit; must be <= 2^32
   * @returns {number}
   */
  function cryptoRandBelow(max) {
    if (!cryptoOk) {
      // Degraded (non-secure) fallback — warned in the support error
      return Math.floor(Math.random() * max);
    }
    // Smallest multiple of max that is <= 2^32
    var limit = Math.floor(4294967296 / max) * max; // 2^32 = 4294967296
    var buf = new Uint32Array(1);
    var val;
    do {
      window.crypto.getRandomValues(buf);
      val = buf[0];
    } while (val >= limit);
    return val % max;
  }

  /**
   * Shuffles an array IN-PLACE using Fisher-Yates with CSPRNG.
   * @param {string[]} arr
   */
  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = cryptoRandBelow(i + 1);
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  /**
   * Builds the final alphabet based on the checked checkboxes.
   * Returns { alfabeto: string, grupos: string[] } where 'grupos' lists
   * the individual sets to guarantee at least 1 character from each.
   * Returns null if no set is selected.
   */
  function montarAlfabeto() {
    var grupos = [];
    var evitar = chkAmbiguos.checked ? CHARS_AMBIGUOS : "";

    if (chkMaiusculas.checked) {
      var g = evitar ? removeChars(CHARS_MAIUSCULAS, evitar) : CHARS_MAIUSCULAS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkMinusculas.checked) {
      var g = evitar ? removeChars(CHARS_MINUSCULAS, evitar) : CHARS_MINUSCULAS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkNumeros.checked) {
      var g = evitar ? removeChars(CHARS_NUMEROS, evitar) : CHARS_NUMEROS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkSimbolos.checked) {
      // Symbols contain no ambiguous characters, but removed for consistency
      var g = evitar ? removeChars(CHARS_SIMBOLOS, evitar) : CHARS_SIMBOLOS;
      if (g.length > 0) grupos.push(g);
    }

    if (grupos.length === 0) return null;

    // Full alphabet (concatenation of all sets)
    var alfabeto = grupos.join("");
    return { alfabeto: alfabeto, grupos: grupos };
  }

  /**
   * Generates a password with the given length, using the selected groups.
   * Guarantees at least 1 character from each group (when length allows).
   *
   * @param {number} comprimento
   * @param {{ alfabeto: string, grupos: string[] }} config
   * @returns {string}
   */
  function gerarSenha(comprimento, config) {
    var alfabeto = config.alfabeto;
    var grupos   = config.grupos;
    var chars    = [];

    // Guarantees at least 1 of each group (if length >= number of groups)
    var garantidos = [];
    if (comprimento >= grupos.length) {
      for (var g = 0; g < grupos.length; g++) {
        var grupo = grupos[g];
        garantidos.push(grupo[cryptoRandBelow(grupo.length)]);
      }
    }

    // Fills the rest with random characters from the full alphabet
    var restante = comprimento - garantidos.length;
    for (var i = 0; i < restante; i++) {
      chars.push(alfabeto[cryptoRandBelow(alfabeto.length)]);
    }

    // Joins guaranteed + random and shuffles
    var todos = garantidos.concat(chars);
    shuffleArray(todos);
    return todos.join("");
  }

  /**
   * Calculates entropy in bits: length × log2(alphabet size).
   * @param {number} comprimento
   * @param {number} tamanhoAlfabeto
   * @returns {number}
   */
  function calcularEntropia(comprimento, tamanhoAlfabeto) {
    if (tamanhoAlfabeto <= 1) return 0;
    return comprimento * (Math.log(tamanhoAlfabeto) / Math.log(2));
  }

  /**
   * Returns the strength label based on entropy in bits.
   * @param {number} bits
   * @returns {{ label: string, classe: string, pct: number }}
   */
  function classificarForca(bits) {
    if (bits < 40)  return { label: "Weak",       classe: "senha-forca--fraca",       pct: 15  };
    if (bits < 60)  return { label: "Medium",     classe: "senha-forca--media",       pct: 40  };
    if (bits < 128) return { label: "Strong",     classe: "senha-forca--forte",       pct: 70  };
    return              { label: "Very strong",   classe: "senha-forca--muito-forte", pct: 100 };
  }

  // ─── Feedback display ────────────────────────────────────────────────

  /** Displays an error message in the error area. */
  function mostrarErro(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg; // textContent — no XSS risk
    errorEl.hidden = false;
    if (forcaWrapper) forcaWrapper.style.display = "none";
  }

  /** Clears the error area. */
  function limparErro() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /**
   * Updates the strength indicator in the UI.
   * @param {number} bits
   */
  function atualizarForca(bits) {
    if (!forcaWrapper || !forcaLabel || !forcaBits || !forcaBarra) return;

    var info = classificarForca(bits);

    // Removes previous color classes
    forcaLabel.className = "senha-forca-badge " + info.classe;
    forcaLabel.textContent = info.label;

    forcaBits.textContent = bits.toFixed(1) + " bits of entropy";

    forcaBarra.className = "senha-forca-barra " + info.classe;
    forcaBarra.style.width = info.pct + "%";

    forcaWrapper.style.display = "block";
  }

  // ─── Length control synchronization ──────────────────────────────

  /** Reads and validates the current length, clamping it between 4 and 64. */
  function lerComprimento() {
    var val = parseInt(comprimentoEl.value, 10);
    if (isNaN(val) || val < 4)  val = 4;
    if (val > 64)               val = 64;
    return val;
  }

  comprimentoEl.addEventListener("input", function () {
    var val = lerComprimento();
    if (rangeEl) rangeEl.value = val;
  });

  comprimentoEl.addEventListener("change", function () {
    var val = lerComprimento();
    comprimentoEl.value = val;
    if (rangeEl) rangeEl.value = val;
  });

  if (rangeEl) {
    rangeEl.addEventListener("input", function () {
      var val = parseInt(rangeEl.value, 10);
      if (comprimentoEl) comprimentoEl.value = val;
    });
  }

  /** Reads and validates the number of passwords to generate, clamping it between 1 and 50. */
  function lerQuantidade() {
    if (!quantidadeEl) return 1;
    var val = parseInt(quantidadeEl.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 50)              val = 50;
    return val;
  }

  // ─── Main handler: Generate ────────────────────────────────────────────────

  function handleGerar() {
    limparErro();

    if (!cryptoOk) {
      mostrarErro("Your browser does not support window.crypto.getRandomValues. Use a modern browser.");
      return;
    }

    var comprimento = lerComprimento();
    // Syncs UI fields with the validated value
    comprimentoEl.value = comprimento;
    if (rangeEl) rangeEl.value = comprimento;

    var quantidade = lerQuantidade();
    if (quantidadeEl) quantidadeEl.value = quantidade;

    var config = montarAlfabeto();
    if (!config) {
      mostrarErro("Select at least one character set (uppercase, lowercase, numbers or symbols).");
      if (outputEl) outputEl.value = "";
      if (loteWrapper) loteWrapper.hidden = true;
      return;
    }

    if (quantidade > 1 && outputLote && loteWrapper) {
      var senhas = [];
      for (var i = 0; i < quantidade; i++) {
        senhas.push(gerarSenha(comprimento, config));
      }
      outputLote.value = senhas.join("\n");
      loteWrapper.hidden = false;
      if (outputEl) outputEl.value = senhas[0];
    } else {
      if (loteWrapper) loteWrapper.hidden = true;
      var senha = gerarSenha(comprimento, config);
      if (outputEl) outputEl.value = senha;
    }

    var entropia = calcularEntropia(comprimento, config.alfabeto.length);
    atualizarForca(entropia);
  }

  // ─── Handler: Copy ─────────────────────────────────────────────────────────

  function handleCopiar() {
    if (!outputEl) return;
    var texto = outputEl.value;
    if (texto === "") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        window.DevHelper.flashButton(btnCopiar, "Copied!");
      }).catch(function () {
        fallbackCopy(texto);
      });
    } else {
      fallbackCopy(texto);
    }
  }

  /**
   * Copy fallback via temporary element + execCommand.
   * Used in contexts without Clipboard API (non-secure HTTP, legacy browsers).
   */
  function fallbackCopy(texto) {
    var tmp = document.createElement("textarea");
    tmp.value = texto;
    tmp.style.position = "fixed";
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopiar, "Copied!");
    } catch (e) {
      // Silences — the user can copy manually
    } finally {
      document.body.removeChild(tmp);
    }
  }

  /** Copies all passwords from the batch, one per line. */
  function handleCopiarLote() {
    if (!outputLote) return;
    var texto = outputLote.value;
    if (texto === "") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        window.DevHelper.flashButton(btnCopiarLote, "Copied!");
      }).catch(function () {
        fallbackCopyEl(outputLote, btnCopiarLote);
      });
    } else {
      fallbackCopyEl(outputLote, btnCopiarLote);
    }
  }

  /** Copy fallback selecting the element itself (avoids duplicating text in a temporary textarea). */
  function fallbackCopyEl(el, btn) {
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silences — the user can copy manually
    }
  }

  // ─── Event registration ──────────────────────────────────────────────────────

  btnGerar.addEventListener("click", handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  if (btnCopiarLote) btnCopiarLote.addEventListener("click", handleCopiarLote);

  // Generates automatically on load so the user has a password right away
  handleGerar();

})();
