// js/tools/qrcode.js — Gerador de QR Code 100% client-side (sem CDN/lib).
// Carregado APENAS em tools/qrcode/index.html, DEPOIS de js/lib/qrcode-core.js
// e de js/main.js. Padrão defensivo: todo acesso ao DOM checa if (el).
//
// O núcleo puro (encodeText, Reed-Solomon, seleção de versão/máscara, ECL) foi
// extraído para js/lib/qrcode-core.js (UMD-lite) e é reutilizado aqui e em
// tools/pix. Este arquivo mantém apenas a fiação de canvas/DOM/PNG.

(function () {
  "use strict";

  // Núcleo puro: em Node via require (sanidade); no navegador via window.QRCore
  // (js/lib/qrcode-core.js precisa ser carregado ANTES deste script).
  var QRCore = (typeof module !== "undefined" && module.exports)
    ? require("../lib/qrcode-core.js")
    : (typeof window !== "undefined" ? window.QRCore : null);

  var encodeText = QRCore ? QRCore.encodeText : null;
  var ECL = QRCore ? QRCore.ECL : null;
  var getNumDataCodewords = QRCore ? QRCore.getNumDataCodewords : null;

  // Reexporta o núcleo para manter compatibilidade com o sanity em Node
  // (require("js/tools/qrcode.js") continua expondo encodeText/ECL/...).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { encodeText: encodeText, getNumDataCodewords: getNumDataCodewords, ECL: ECL };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
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

  var QUIET = 4;      // borda clara (quiet zone), em módulos
  var SCALE = 8;      // pixels por módulo
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
      infoEl.textContent = "Digite um texto ou URL para gerar o QR Code.";
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
      "Versão " + result.version + " • correção " + result.ecl +
      " • " + result.size + "×" + result.size + " módulos";
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

    // Fundo branco (inclui quiet zone).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);

    // Módulos escuros.
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
        errorEl.textContent = "Não foi possível exportar a imagem neste navegador.";
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

  // --- Eventos ---
  inputEl.addEventListener("input", render);
  for (var i = 0; i < eclEls.length; i++) {
    eclEls[i].addEventListener("change", render);
  }
  btnDownload.addEventListener("click", download);

  // Estado inicial.
  render();
})();
