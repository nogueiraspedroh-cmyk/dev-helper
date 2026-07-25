// js/tools/base-numerica.js — conversor de base numérica (bin/oct/dec/hex).
// Carregado APENAS em tools/base-numerica/index.html, após js/main.js.
// Anti-XSS: saída via .value / .textContent — nunca innerHTML.
//
// Usa BigInt para não perder precisão com números grandes.
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — parsing/formatação com BigInt
  // ================================================================

  var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

  function digitValue(ch) {
    var idx = DIGITS.indexOf(ch.toLowerCase());
    return idx;
  }

  /**
   * Faz o parse de uma string numa dada base (2..36) para BigInt.
   * Lança Error legível se houver dígito inválido para a base.
   * @param {string} str
   * @param {number} base
   * @returns {bigint}
   */
  function parseInBase(str, base) {
    if (typeof str !== "string") { throw new Error("Entrada inválida."); }
    var s = str.trim();
    if (s === "") { throw new Error("Informe um número."); }
    var neg = false;
    if (s.charAt(0) === "-") { neg = true; s = s.slice(1); }
    else if (s.charAt(0) === "+") { s = s.slice(1); }
    if (s === "") { throw new Error("Número incompleto."); }
    var b = BigInt(base);
    var val = 0n;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "_" || ch === " ") { continue; } // separadores de grupo tolerados
      var d = digitValue(ch);
      if (d < 0 || d >= base) {
        throw new Error("Dígito inválido \"" + ch + "\" para base " + base + ".");
      }
      val = val * b + BigInt(d);
    }
    return neg ? -val : val;
  }

  /**
   * Formata um BigInt numa base (2..36).
   * @param {bigint} value
   * @param {number} base
   * @returns {string}
   */
  function toBase(value, base) {
    if (typeof value !== "bigint") { throw new Error("Valor deve ser BigInt."); }
    return value.toString(base);
  }

  /**
   * Converte de uma base para as quatro bases usuais (2, 8, 10, 16).
   * @returns {{bin,oct,dec,hex}}
   */
  function convertAll(str, fromBase) {
    var value = parseInBase(str, fromBase);
    return {
      bin: toBase(value, 2),
      oct: toBase(value, 8),
      dec: toBase(value, 10),
      hex: toBase(value, 16)
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseInBase: parseInBase,
      toBase: toBase,
      convertAll: convertAll
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var FIELDS = [
    { id: "bn-bin", base: 2, key: "bin" },
    { id: "bn-oct", base: 8, key: "oct" },
    { id: "bn-dec", base: 10, key: "dec" },
    { id: "bn-hex", base: 16, key: "hex" }
  ];

  var errorEl = document.getElementById("bn-error");
  var els = {};
  var missing = false;
  for (var i = 0; i < FIELDS.length; i++) {
    var el = document.getElementById(FIELDS[i].id);
    if (!el) { missing = true; }
    els[FIELDS[i].id] = el;
  }
  if (missing || !errorEl) { return; }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function clearOthers(exceptId) {
    for (var j = 0; j < FIELDS.length; j++) {
      if (FIELDS[j].id !== exceptId) { els[FIELDS[j].id].value = ""; }
    }
  }

  function onInput(sourceId, base) {
    return function () {
      clearError();
      var raw = els[sourceId].value;
      if (raw.trim() === "") { clearOthers(sourceId); return; }
      var result;
      try {
        result = convertAll(raw, base);
      } catch (e) {
        clearOthers(sourceId);
        showError(e.message || "Entrada inválida.");
        return;
      }
      for (var j = 0; j < FIELDS.length; j++) {
        var f = FIELDS[j];
        if (f.id !== sourceId) { els[f.id].value = result[f.key]; }
      }
    };
  }

  for (var k = 0; k < FIELDS.length; k++) {
    els[FIELDS[k].id].addEventListener("input", onInput(FIELDS[k].id, FIELDS[k].base));
  }

  var btnClear = document.getElementById("bn-clear");
  if (btnClear) {
    btnClear.addEventListener("click", function () {
      for (var j = 0; j < FIELDS.length; j++) { els[FIELDS[j].id].value = ""; }
      clearError();
      els["bn-dec"].focus();
    });
  }
})();
