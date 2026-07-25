// js/tools-en/pix.js — PIX Copy-and-Paste + QR Code Generator (BR Code / EMV) (English version).
// Loaded ONLY on en/tools/pix/index.html, AFTER js/lib/qrcode-core.js and
// js/main.js. Mirrors js/tools/pix.js — same logic, only user-visible strings
// translated. Defensive pattern: every DOM access checks if (el).
// Anti-XSS: output via .value / .textContent — never innerHTML with user data.
//
// Builds the PIX static payload (EMV BR Code) and calculates the CRC16-CCITT
// (poly 0x1021, init 0xFFFF, no reflection). The QR is generated with the pure
// core shared in js/lib/qrcode-core.js (window.QRCore).
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in the browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — CRC16 + EMV payload assembly
  // ================================================================

  // CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, xorout 0x0000.
  // Canonical documented test vector: crc16("123456789") === 0x29B1.
  function crc16(str) {
    var crc = 0xffff;
    for (var i = 0; i < str.length; i++) {
      crc ^= (str.charCodeAt(i) & 0xff) << 8;
      for (var j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc & 0xffff;
  }

  function hex4(n) {
    var h = n.toString(16).toUpperCase();
    while (h.length < 4) { h = "0" + h; }
    return h;
  }

  // EMV field: ID (2) + length (2, zero-padded) + value.
  function emv(id, value) {
    var v = String(value);
    var len = String(v.length);
    if (len.length < 2) { len = "0" + len; }
    return id + len + v;
  }

  // Normalizes text for the name/city fields: uppercase, no accents,
  // safe characters only, truncated to the max length.
  function sanitizeText(str, maxLen) {
    var s = String(str == null ? "" : str)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (typeof maxLen === "number" && s.length > maxLen) {
      s = s.slice(0, maxLen).trim();
    }
    return s;
  }

  // Amount: accepts "10", "10,50" or "10.50" -> "10.50". Empty/0 -> "".
  function formatAmount(raw) {
    if (raw == null) { return ""; }
    var s = String(raw).trim().replace(",", ".");
    if (s === "") { return ""; }
    var n = Number(s);
    if (!isFinite(n) || n <= 0) { return ""; }
    return n.toFixed(2);
  }

  // txid for field 62/05: alphanumeric only, max 25; "***" when absent.
  function sanitizeTxid(raw) {
    var s = String(raw == null ? "" : raw).replace(/[^A-Za-z0-9]/g, "");
    if (s === "") { return "***"; }
    return s.slice(0, 25);
  }

  /**
   * Builds the BR Code (Copy-and-Paste) payload for a static PIX.
   * @param {{key:string,name:string,city:string,amount?:string,
   *          txid?:string,description?:string}} opts
   * @returns {string} complete EMV payload, already with CRC16.
   * @throws {Error} if the key, name or city are empty.
   */
  function buildPixPayload(opts) {
    opts = opts || {};
    var key = String(opts.key == null ? "" : opts.key).trim();
    var name = sanitizeText(opts.name, 25);
    var city = sanitizeText(opts.city, 15);
    var amount = formatAmount(opts.amount);
    var txid = sanitizeTxid(opts.txid);
    var description = opts.description
      ? String(opts.description).normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 40)
      : "";

    if (key === "") { throw new Error("Enter the PIX key."); }
    if (name === "") { throw new Error("Enter the recipient's name."); }
    if (city === "") { throw new Error("Enter the recipient's city."); }

    var f00 = emv("00", "01");                 // Payload Format Indicator
    var f01 = emv("01", "11");                 // Point of Initiation (reusable)

    var mai = emv("00", "br.gov.bcb.pix") + emv("01", key);
    if (description !== "") { mai += emv("02", description); }
    var f26 = emv("26", mai);                  // Merchant Account Information

    var f52 = emv("52", "0000");               // Merchant Category Code
    var f53 = emv("53", "986");                // Currency (BRL)
    var f54 = amount !== "" ? emv("54", amount) : "";
    var f58 = emv("58", "BR");                 // Country
    var f59 = emv("59", name);                 // Recipient name
    var f60 = emv("60", city);                 // City
    var f62 = emv("62", emv("05", txid));      // Additional Data (txid)

    var partial =
      f00 + f01 + f26 + f52 + f53 + f54 + f58 + f59 + f60 + f62 + "6304";
    return partial + hex4(crc16(partial));
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      crc16: crc16,
      hex4: hex4,
      emv: emv,
      sanitizeText: sanitizeText,
      formatAmount: formatAmount,
      sanitizeTxid: sanitizeTxid,
      buildPixPayload: buildPixPayload
    };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var QRCore = typeof window !== "undefined" ? window.QRCore : null;

  var keyEl = document.getElementById("pix-key");
  var nameEl = document.getElementById("pix-name");
  var cityEl = document.getElementById("pix-city");
  var amountEl = document.getElementById("pix-amount");
  var txidEl = document.getElementById("pix-txid");
  var descEl = document.getElementById("pix-desc");
  var btnGen = document.getElementById("pix-generate");
  var errorEl = document.getElementById("pix-error");
  var outputWrap = document.getElementById("pix-output");
  var payloadEl = document.getElementById("pix-payload");
  var btnCopy = document.getElementById("pix-copy");
  var canvasEl = document.getElementById("pix-canvas");
  var btnDownload = document.getElementById("pix-download");

  if (!keyEl || !nameEl || !cityEl || !btnGen || !errorEl || !outputWrap || !payloadEl) {
    return;
  }

  var QUIET = 4;
  var SCALE = 6;
  var hasQr = false;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    outputWrap.hidden = true;
    hasQr = false;
  }

  function drawQr(text) {
    if (!canvasEl || !QRCore || !QRCore.encodeText) { return false; }
    var ctx = canvasEl.getContext("2d");
    if (!ctx) { return false; }
    var result;
    try {
      result = QRCore.encodeText(text, "M");
    } catch (e) {
      return false;
    }
    var dim = result.size + QUIET * 2;
    var px = dim * SCALE;
    canvasEl.width = px;
    canvasEl.height = px;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = "#000000";
    for (var y = 0; y < result.size; y++) {
      for (var x = 0; x < result.size; x++) {
        if (result.modules[y][x]) {
          ctx.fillRect((x + QUIET) * SCALE, (y + QUIET) * SCALE, SCALE, SCALE);
        }
      }
    }
    return true;
  }

  function generate() {
    errorEl.hidden = true;
    errorEl.textContent = "";
    var payload;
    try {
      payload = buildPixPayload({
        key: keyEl.value,
        name: nameEl.value,
        city: cityEl.value,
        amount: amountEl ? amountEl.value : "",
        txid: txidEl ? txidEl.value : "",
        description: descEl ? descEl.value : ""
      });
    } catch (e) {
      showError(e.message);
      return;
    }
    payloadEl.value = payload;
    outputWrap.hidden = false;
    hasQr = drawQr(payload);
    if (btnDownload) { btnDownload.disabled = !hasQr; }
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copied!", 1200);
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
      window.DevHelper.flashButton(btn, "Copied!", 1200);
    } catch (e) {
      // silence
    } finally {
      document.body.removeChild(tmp);
    }
  }

  function download() {
    if (!hasQr || !canvasEl) { return; }
    var name = "pix-qrcode.png";
    if (canvasEl.toBlob) {
      canvasEl.toBlob(function (blob) {
        if (!blob) { return; }
        var url = URL.createObjectURL(blob);
        triggerDownload(url, name, true);
      }, "image/png");
    } else {
      try {
        triggerDownload(canvasEl.toDataURL("image/png"), name, false);
      } catch (e) { /* silence */ }
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

  btnGen.addEventListener("click", generate);
  if (btnCopy) {
    btnCopy.addEventListener("click", function () { copyText(payloadEl.value, btnCopy); });
  }
  if (btnDownload) {
    btnDownload.addEventListener("click", download);
  }
})();
