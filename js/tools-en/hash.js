// js/tools-en/hash.js — logic for the Hash Generator (English version).
// Loaded ONLY on en/tools/hash/index.html, after js/main.js.
// Mirrors js/tools/hash.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent — NEVER
// innerHTML with user data.
//
// SHA-1/256/384/512: native Web Crypto (crypto.subtle.digest) — no library.
// MD5: crypto.subtle does NOT support MD5 (legacy/broken algorithm), so we
// implement pure MD5 in JS (RFC 1321) to offer it anyway, with a warning on
// the page that MD5 (and SHA-1) do NOT serve security purposes — only
// checksums/compatibility with legacy systems.
//
// The file is loadable both in the browser and in Node (for sanity tests):
// the pure logic is exported via module.exports and the DOM wiring only
// runs when `document` exists.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — encoding and hash algorithms
  // ================================================================

  /** Converts a string to UTF-8 bytes (Uint8Array). */
  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(str);
    }
    // Fallback: escape/encodeURIComponent → latin1
    var enc = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(enc.length);
    for (var i = 0; i < enc.length; i++) {
      bytes[i] = enc.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  /** Converts an ArrayBuffer/Uint8Array into a lowercase hexadecimal string. */
  function bytesToHex(buf) {
    var view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var out = "";
    for (var i = 0; i < view.length; i++) {
      out += ("0" + view[i].toString(16)).slice(-2);
    }
    return out;
  }

  // --- Pure MD5 (RFC 1321), operating on UTF-8 bytes ---

  // Per-round shift table.
  var MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  // Constants K[i] = floor(2^32 * abs(sin(i+1))).
  var MD5_K = (function () {
    var k = new Array(64);
    for (var i = 0; i < 64; i++) {
      k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    }
    return k;
  })();

  function md5RotL(x, c) {
    return ((x << c) | (x >>> (32 - c))) >>> 0;
  }

  /** Computes the MD5 of a Uint8Array and returns the digest in hex. */
  function md5(bytes) {
    var origLen = bytes.length;
    // Pre-processing: append 0x80, padding until ≡ 56 (mod 64), + length.
    var withOne = origLen + 1;
    var padLen = ((withOne + 8 + 63) & ~63) - (withOne + 8);
    var totalLen = origLen + 1 + padLen + 8;
    var msg = new Uint8Array(totalLen);
    msg.set(bytes, 0);
    msg[origLen] = 0x80;
    // Length in bits, little-endian 64 bits.
    var bitLenLo = (origLen * 8) >>> 0;
    var bitLenHi = Math.floor(origLen / 536870912) >>> 0; // origLen*8 / 2^32
    msg[totalLen - 8] = bitLenLo & 0xff;
    msg[totalLen - 7] = (bitLenLo >>> 8) & 0xff;
    msg[totalLen - 6] = (bitLenLo >>> 16) & 0xff;
    msg[totalLen - 5] = (bitLenLo >>> 24) & 0xff;
    msg[totalLen - 4] = bitLenHi & 0xff;
    msg[totalLen - 3] = (bitLenHi >>> 8) & 0xff;
    msg[totalLen - 2] = (bitLenHi >>> 16) & 0xff;
    msg[totalLen - 1] = (bitLenHi >>> 24) & 0xff;

    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var M = new Array(16);

    for (var chunk = 0; chunk < totalLen; chunk += 64) {
      for (var j = 0; j < 16; j++) {
        var p = chunk + j * 4;
        M[j] = (msg[p] | (msg[p + 1] << 8) | (msg[p + 2] << 16) | (msg[p + 3] << 24)) >>> 0;
      }
      var A = a0, B = b0, C = c0, D = d0;
      for (var i = 0; i < 64; i++) {
        var F, g;
        if (i < 16) {
          F = (B & C) | (~B & D);
          g = i;
        } else if (i < 32) {
          F = (D & B) | (~D & C);
          g = (5 * i + 1) % 16;
        } else if (i < 48) {
          F = B ^ C ^ D;
          g = (3 * i + 5) % 16;
        } else {
          F = C ^ (B | ~D);
          g = (7 * i) % 16;
        }
        F = (F + A + MD5_K[i] + M[g]) >>> 0;
        A = D;
        D = C;
        C = B;
        B = (B + md5RotL(F, MD5_S[i])) >>> 0;
      }
      a0 = (a0 + A) >>> 0;
      b0 = (b0 + B) >>> 0;
      c0 = (c0 + C) >>> 0;
      d0 = (d0 + D) >>> 0;
    }

    // Digest: a0,b0,c0,d0 in little-endian.
    var out = new Uint8Array(16);
    var words = [a0, b0, c0, d0];
    for (var w = 0; w < 4; w++) {
      out[w * 4] = words[w] & 0xff;
      out[w * 4 + 1] = (words[w] >>> 8) & 0xff;
      out[w * 4 + 2] = (words[w] >>> 16) & 0xff;
      out[w * 4 + 3] = (words[w] >>> 24) & 0xff;
    }
    return bytesToHex(out);
  }

  // Provider for crypto.subtle compatible with browser and Node.
  function getSubtle() {
    if (typeof crypto !== "undefined" && crypto && crypto.subtle) {
      return crypto.subtle;
    }
    if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
      return globalThis.crypto.subtle;
    }
    return null;
  }

  /**
   * Computes a SHA digest (SHA-1/256/384/512) via Web Crypto.
   * Returns a Promise that resolves to a hex string, or rejects if unavailable.
   */
  function shaHex(algo, bytes) {
    var subtle = getSubtle();
    if (!subtle) {
      return Promise.reject(new Error("Web Crypto API unavailable"));
    }
    // Passes a "clean" ArrayBuffer copy (avoids SharedArrayBuffer/offset issues).
    var copy = bytes.slice ? bytes.slice() : new Uint8Array(bytes);
    return subtle.digest(algo, copy.buffer).then(function (digest) {
      return bytesToHex(digest);
    });
  }

  var ALGOS = [
    { key: "md5", label: "MD5" },
    { key: "sha1", label: "SHA-1", subtle: "SHA-1" },
    { key: "sha256", label: "SHA-256", subtle: "SHA-256" },
    { key: "sha384", label: "SHA-384", subtle: "SHA-384" },
    { key: "sha512", label: "SHA-512", subtle: "SHA-512" }
  ];

  /**
   * Computes all hashes of a string. Returns Promise<{key:hex}>.
   * MD5 is synchronous (pure JS); the SHAs use crypto.subtle (asynchronous).
   */
  function hashAll(str) {
    var bytes = utf8Bytes(str);
    var result = { md5: md5(bytes) };
    var jobs = ALGOS.filter(function (a) {
      return a.subtle;
    }).map(function (a) {
      return shaHex(a.subtle, bytes).then(function (hex) {
        result[a.key] = hex;
      });
    });
    return Promise.all(jobs).then(function () {
      return result;
    });
  }

  // Exports the core for sanity tests in Node.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { md5: md5, shaHex: shaHex, hashAll: hashAll, utf8Bytes: utf8Bytes, bytesToHex: bytesToHex };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputEl = document.getElementById("hash-input");
  var errorEl = document.getElementById("hash-error");
  var outputs = {};
  var copyBtns = {};
  var missing = false;

  ALGOS.forEach(function (a) {
    outputs[a.key] = document.getElementById("hash-out-" + a.key);
    copyBtns[a.key] = document.getElementById("btn-hash-copy-" + a.key);
    if (!outputs[a.key] || !copyBtns[a.key]) {
      missing = true;
    }
  });

  if (!inputEl || !errorEl || missing) {
    return;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  // Token to discard results from stale runs (the user may type faster than
  // the asynchronous SHA digests resolve).
  var runToken = 0;

  function recompute() {
    var myToken = ++runToken;
    clearError();
    var texto = inputEl.value;

    // MD5 is synchronous — shows immediately.
    try {
      var bytes = utf8Bytes(texto);
      outputs.md5.value = md5(bytes);
    } catch (e) {
      showError("Failed to compute MD5: " + e.message);
    }

    hashAll(texto).then(function (res) {
      if (myToken !== runToken) {
        return; // stale result
      }
      ALGOS.forEach(function (a) {
        if (typeof res[a.key] !== "undefined") {
          outputs[a.key].value = res[a.key];
        }
      });
    }).catch(function (e) {
      if (myToken !== runToken) {
        return;
      }
      showError(
        "Could not compute the SHA hashes: " + e.message +
        ". Your browser may not support the Web Crypto API (required for SHA)."
      );
    });
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") {
      return;
    }
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
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silences — the user can copy manually
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  inputEl.addEventListener("input", recompute);
  ALGOS.forEach(function (a) {
    copyBtns[a.key].addEventListener("click", function () {
      copyText(outputs[a.key].value, copyBtns[a.key]);
    });
  });

  // Initial calculation (field may come pre-filled via autofill).
  recompute();
})();
