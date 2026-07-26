// js/tools-en/cor.js — color converter (HEX/RGB/HSL) + WCAG contrast — English version.
// Loaded ONLY on en/tools/cor/index.html, after js/main.js.
// Mirrors js/tools/cor.js — same logic, only user-visible strings translated.
// Anti-XSS: output via .value / .textContent and colors applied via
// element.style with values GENERATED/VALIDATED by the code — never innerHTML
// nor CSS built from free-form user text.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in the browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — color conversions and WCAG 2.x contrast
  // ================================================================

  /** Normalizes "#rgb"/"rgb"/"#rrggbb"/"rrggbb" -> lowercase "#rrggbb", or null. */
  function normalizeHex(hex) {
    if (typeof hex !== "string") { return null; }
    var h = hex.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(h)) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    if (/^[0-9a-fA-F]{6}$/.test(h)) { return "#" + h.toLowerCase(); }
    return null;
  }

  /** "#rrggbb" (or short form) -> {r,g,b} 0..255, or null if invalid. */
  function hexToRgb(hex) {
    var h = normalizeHex(hex);
    if (!h) { return null; }
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16)
    };
  }

  function clamp255(n) {
    n = Math.round(Number(n));
    if (isNaN(n)) { return null; }
    if (n < 0) { n = 0; }
    if (n > 255) { n = 255; }
    return n;
  }

  /** {r,g,b} -> "#rrggbb". Clamps/rounds channels outside 0..255. */
  function rgbToHex(r, g, b) {
    function h2(n) {
      var v = clamp255(n);
      if (v === null) { v = 0; }
      var s = v.toString(16);
      return s.length === 1 ? "0" + s : s;
    }
    return "#" + h2(r) + h2(g) + h2(b);
  }

  /** {r,g,b} 0..255 -> {h:0..360, s:0..100, l:0..100} (integers). */
  function rgbToHsl(r, g, b) {
    r = clamp255(r) / 255; g = clamp255(g) / 255; b = clamp255(b) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) { h = (g - b) / d + (g < b ? 6 : 0); }
      else if (max === g) { h = (b - r) / d + 2; }
      else { h = (r - g) / d + 4; }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  /** {h,s,l} (h 0..360, s/l 0..100) -> {r,g,b} 0..255. */
  function hslToRgb(h, s, l) {
    h = ((Number(h) % 360) + 360) % 360 / 360;
    s = Math.min(100, Math.max(0, Number(s))) / 100;
    l = Math.min(100, Math.max(0, Number(l))) / 100;
    function hue2rgb(p, q, t) {
      if (t < 0) { t += 1; }
      if (t > 1) { t -= 1; }
      if (t < 1 / 6) { return p + (q - p) * 6 * t; }
      if (t < 1 / 2) { return q; }
      if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
      return p;
    }
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // --- WCAG 2.x contrast ---
  // sRGB -> linear -> relative luminance -> (L1+0.05)/(L2+0.05).

  function channelLinear(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /** Relative luminance (0..1) of {r,g,b} 0..255, per WCAG. */
  function relativeLuminance(r, g, b) {
    return 0.2126 * channelLinear(clamp255(r)) +
           0.7152 * channelLinear(clamp255(g)) +
           0.0722 * channelLinear(clamp255(b));
  }

  /** Contrast ratio between two colors {r,g,b} — always >= 1. */
  function contrastRatio(rgb1, rgb2) {
    var l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    var l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  /**
   * Evaluates the ratio against the WCAG 2.x thresholds.
   * AA normal >= 4.5, AAA normal >= 7, AA large >= 3, AAA large >= 4.5.
   */
  function wcagLevels(ratio) {
    return {
      aaNormal: ratio >= 4.5,
      aaaNormal: ratio >= 7,
      aaLarge: ratio >= 3,
      aaaLarge: ratio >= 4.5
    };
  }

  var core = {
    normalizeHex: normalizeHex,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    wcagLevels: wcagLevels
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") { return; }

  // ---- Converter ----
  var elHex = document.getElementById("cor-hex");
  var elPicker = document.getElementById("cor-picker");
  var elR = document.getElementById("cor-r");
  var elG = document.getElementById("cor-g");
  var elB = document.getElementById("cor-b");
  var elH = document.getElementById("cor-h");
  var elS = document.getElementById("cor-s");
  var elL = document.getElementById("cor-l");
  var elSwatch = document.getElementById("cor-swatch");
  var elError = document.getElementById("cor-error");

  function showError(msg) {
    if (!elError) { return; }
    elError.textContent = msg;
    elError.hidden = false;
  }
  function clearError() {
    if (!elError) { return; }
    elError.textContent = "";
    elError.hidden = true;
  }

  // Applies an {r,g,b} to all output fields (except the source field).
  function applyRgb(rgb, source) {
    var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    if (source !== "hex" && elHex) { elHex.value = hex; }
    if (elPicker) { elPicker.value = hex; }
    if (source !== "rgb") {
      if (elR) { elR.value = rgb.r; }
      if (elG) { elG.value = rgb.g; }
      if (elB) { elB.value = rgb.b; }
    }
    if (source !== "hsl") {
      if (elH) { elH.value = hsl.h; }
      if (elS) { elS.value = hsl.s; }
      if (elL) { elL.value = hsl.l; }
    }
    if (elSwatch) { elSwatch.style.background = hex; }
    clearError();
  }

  if (elHex) {
    elHex.addEventListener("input", function () {
      var rgb = hexToRgb(elHex.value);
      if (!rgb) {
        if (elHex.value.trim() !== "") { showError("Invalid HEX. Use #rgb or #rrggbb."); }
        return;
      }
      applyRgb(rgb, "hex");
    });
  }

  if (elPicker) {
    elPicker.addEventListener("input", function () {
      var rgb = hexToRgb(elPicker.value);
      if (rgb) {
        if (elHex) { elHex.value = rgbToHex(rgb.r, rgb.g, rgb.b); }
        applyRgb(rgb, "picker");
      }
    });
  }

  function readRgbFields() {
    var r = clamp255(elR ? elR.value : 0);
    var g = clamp255(elG ? elG.value : 0);
    var b = clamp255(elB ? elB.value : 0);
    if (r === null || g === null || b === null) { return null; }
    return { r: r, g: g, b: b };
  }

  [elR, elG, elB].forEach(function (el) {
    if (!el) { return; }
    el.addEventListener("input", function () {
      var rgb = readRgbFields();
      if (!rgb) { showError("RGB values must be numbers from 0 to 255."); return; }
      applyRgb(rgb, "rgb");
    });
  });

  [elH, elS, elL].forEach(function (el) {
    if (!el) { return; }
    el.addEventListener("input", function () {
      var h = Number(elH ? elH.value : 0);
      var s = Number(elS ? elS.value : 0);
      var l = Number(elL ? elL.value : 0);
      if (isNaN(h) || isNaN(s) || isNaN(l)) { showError("Invalid HSL values."); return; }
      var rgb = hslToRgb(h, s, l);
      applyRgb(rgb, "hsl");
    });
  });

  // ---- Contrast checker ----
  var elTxtPicker = document.getElementById("cor-ct-text");
  var elTxtHex = document.getElementById("cor-ct-text-hex");
  var elBgPicker = document.getElementById("cor-ct-bg");
  var elBgHex = document.getElementById("cor-ct-bg-hex");
  var elCtPreview = document.getElementById("cor-ct-preview");
  var elCtRatio = document.getElementById("cor-ct-ratio");
  var elCtBadges = document.getElementById("cor-ct-badges");

  function makeBadge(label, pass) {
    var span = document.createElement("span");
    span.className = "result-validar " + (pass ? "result-validar--valido" : "result-validar--invalido");
    span.style.minHeight = "auto";
    span.style.padding = "0.35rem 0.7rem";
    span.textContent = label + ": " + (pass ? "Pass" : "Fail");
    return span;
  }

  function updateContrast() {
    if (!elCtRatio || !elCtBadges) { return; }
    var textRgb = hexToRgb(elTxtHex ? elTxtHex.value : (elTxtPicker ? elTxtPicker.value : "#000000"));
    var bgRgb = hexToRgb(elBgHex ? elBgHex.value : (elBgPicker ? elBgPicker.value : "#ffffff"));
    if (!textRgb || !bgRgb) {
      elCtRatio.textContent = "—";
      while (elCtBadges.firstChild) { elCtBadges.removeChild(elCtBadges.firstChild); }
      return;
    }
    var ratio = contrastRatio(textRgb, bgRgb);
    var levels = wcagLevels(ratio);
    elCtRatio.textContent = ratio.toFixed(2) + ":1";
    if (elCtPreview) {
      elCtPreview.style.background = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
      elCtPreview.style.color = rgbToHex(textRgb.r, textRgb.g, textRgb.b);
    }
    while (elCtBadges.firstChild) { elCtBadges.removeChild(elCtBadges.firstChild); }
    elCtBadges.appendChild(makeBadge("AA normal text", levels.aaNormal));
    elCtBadges.appendChild(makeBadge("AAA normal text", levels.aaaNormal));
    elCtBadges.appendChild(makeBadge("AA large text", levels.aaLarge));
    elCtBadges.appendChild(makeBadge("AAA large text", levels.aaaLarge));
  }

  // Syncs picker <-> hex field for text/background, then recalculates.
  function bindColorPair(picker, hexField, onChange) {
    if (picker) {
      picker.addEventListener("input", function () {
        if (hexField) { hexField.value = picker.value; }
        onChange();
      });
    }
    if (hexField) {
      hexField.addEventListener("input", function () {
        var rgb = hexToRgb(hexField.value);
        if (rgb && picker) { picker.value = rgbToHex(rgb.r, rgb.g, rgb.b); }
        onChange();
      });
    }
  }

  bindColorPair(elTxtPicker, elTxtHex, updateContrast);
  bindColorPair(elBgPicker, elBgHex, updateContrast);

  // Initial state.
  if (elHex && elHex.value) {
    var initRgb = hexToRgb(elHex.value);
    if (initRgb) { applyRgb(initRgb, "hex"); }
  }
  updateContrast();
})();
