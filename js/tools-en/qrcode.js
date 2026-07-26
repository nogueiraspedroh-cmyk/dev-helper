// js/tools-en/qrcode.js — 100% client-side QR Code generator (no CDN/lib) (English version).
// Loaded ONLY on en/tools/qrcode/index.html, AFTER js/lib/qrcode-core.js
// and js/main.js. Defensive pattern: every DOM access checks if (el).
// Mirrors js/tools/qrcode.js — same logic, only user-visible strings translated.
//
// The pure core (encodeText, Reed-Solomon, version/mask selection, ECL) was
// extracted to js/lib/qrcode-core.js (UMD-lite) and is reused here and in
// tools/pix. This file only holds the canvas/DOM/PNG wiring.

(function () {
  "use strict";

  // Pure core: in Node via require (sanity check); in the browser via window.QRCore
  // (js/lib/qrcode-core.js must be loaded BEFORE this script).
  var QRCore = (typeof module !== "undefined" && module.exports)
    ? require("../lib/qrcode-core.js")
    : (typeof window !== "undefined" ? window.QRCore : null);

  var encodeText = QRCore ? QRCore.encodeText : null;
  var ECL = QRCore ? QRCore.ECL : null;
  var getNumDataCodewords = QRCore ? QRCore.getNumDataCodewords : null;

  // Re-exports the core to keep the Node sanity check compatible
  // (require("js/tools-en/qrcode.js") still exposes encodeText/ECL/...).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { encodeText: encodeText, getNumDataCodewords: getNumDataCodewords, ECL: ECL };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputEl = document.getElementById("qr-input");
  var canvasEl = document.getElementById("qr-canvas");
  var errorEl = document.getElementById("qr-error");
  var infoEl = document.getElementById("qr-info");
  var btnDownload = document.getElementById("btn-qr-download");
  var eclEls = document.getElementsByName("qr-ecl");

  if (!inputEl || !canvasEl || !errorEl || !infoEl || !btnDownload) {
    return;
  }

  var QUIET = 4;      // quiet zone border, in modules
  var SCALE = 8;      // pixels per module
  var hasRendered = false;

  function readEcl() {
    for (var i = 0; i < eclEls.length; i++) {
      if (eclEls[i].checked) {
        return eclEls[i].value;
      }
    }
    return "M";
  }

  function render() {
    errorEl.hidden = true;
    errorEl.textContent = "";
    var text = inputEl.value;

    if (text === "") {
      clearCanvas();
      infoEl.textContent = "Enter text or a URL to generate the QR Code.";
      btnDownload.disabled = true;
      hasRendered = false;
      return;
    }

    var result;
    try {
      result = encodeText(text, readEcl());
    } catch (e) {
      clearCanvas();
      infoEl.textContent = "";
      errorEl.textContent = e.message;
      errorEl.hidden = false;
      btnDownload.disabled = true;
      hasRendered = false;
      return;
    }

    drawToCanvas(result);
    infoEl.textContent =
      "Version " + result.version + " • correction " + result.ecl +
      " • " + result.size + "×" + result.size + " modules";
    btnDownload.disabled = false;
    hasRendered = true;
  }

  function clearCanvas() {
    var ctx = canvasEl.getContext("2d");
    if (!ctx) { return; }
    canvasEl.width = 1;
    canvasEl.height = 1;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }

  function drawToCanvas(result) {
    var ctx = canvasEl.getContext("2d");
    if (!ctx) { return; }
    var dim = result.size + QUIET * 2;
    var px = dim * SCALE;
    canvasEl.width = px;
    canvasEl.height = px;

    // White background (includes quiet zone).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);

    // Dark modules.
    ctx.fillStyle = "#000000";
    for (var y = 0; y < result.size; y++) {
      for (var x = 0; x < result.size; x++) {
        if (result.modules[y][x]) {
          ctx.fillRect((x + QUIET) * SCALE, (y + QUIET) * SCALE, SCALE, SCALE);
        }
      }
    }
  }

  function download() {
    if (!hasRendered) { return; }
    var name = "qrcode.png";
    if (canvasEl.toBlob) {
      canvasEl.toBlob(function (blob) {
        if (!blob) { return; }
        var url = URL.createObjectURL(blob);
        triggerDownload(url, name, true);
      }, "image/png");
    } else {
      // Fallback: data URL.
      try {
        triggerDownload(canvasEl.toDataURL("image/png"), name, false);
      } catch (e) {
        errorEl.textContent = "Could not export the image in this browser.";
        errorEl.hidden = false;
      }
    }
  }

  function triggerDownload(url, name, revoke) {
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) {
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  }

  // --- Events ---
  inputEl.addEventListener("input", render);
  for (var i = 0; i < eclEls.length; i++) {
    eclEls[i].addEventListener("change", render);
  }
  btnDownload.addEventListener("click", download);

  // Initial state.
  render();
})();
