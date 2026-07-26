// js/tools-en/base-numerica.js — number base converter (bin/oct/dec/hex) — English version.
// Loaded ONLY on en/tools/base-numerica/index.html, after js/main.js.
// Mirrors js/tools/base-numerica.js — same logic, only user-visible strings translated.
// Anti-XSS: output via .value / .textContent — never innerHTML.
//
// Uses BigInt to avoid losing precision with large numbers.
// UMD-lite: pure core exported for Node (sanity checks); DOM only in the browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — parsing/formatting with BigInt
  // ================================================================

  var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

  function digitValue(ch) {
    var idx = DIGITS.indexOf(ch.toLowerCase());
    return idx;
  }

  /**
   * Parses a string in a given base (2..36) into a BigInt.
   * Throws a readable Error if there is an invalid digit for the base.
   * @param {string} str
   * @param {number} base
   * @returns {bigint}
   */
  function parseInBase(str, base) {
    if (typeof str !== "string") { throw new Error("Invalid input."); }
    var s = str.trim();
    if (s === "") { throw new Error("Enter a number."); }
    var neg = false;
    if (s.charAt(0) === "-") { neg = true; s = s.slice(1); }
    else if (s.charAt(0) === "+") { s = s.slice(1); }
    if (s === "") { throw new Error("Incomplete number."); }
    var b = BigInt(base);
    var val = 0n;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "_" || ch === " ") { continue; } // group separators tolerated
      var d = digitValue(ch);
      if (d < 0 || d >= base) {
        throw new Error("Invalid digit \"" + ch + "\" for base " + base + ".");
      }
      val = val * b + BigInt(d);
    }
    return neg ? -val : val;
  }

  /**
   * Formats a BigInt in a base (2..36).
   * @param {bigint} value
   * @param {number} base
   * @returns {string}
   */
  function toBase(value, base) {
    if (typeof value !== "bigint") { throw new Error("Value must be a BigInt."); }
    return value.toString(base);
  }

  /**
   * Converts from one base to the four usual bases (2, 8, 10, 16).
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
  // DOM WIRING — browser only
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
        showError(e.message || "Invalid input.");
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
