// js/tools/hash.js — lógica do Gerador de Hash.
// Carregado APENAS em tools/hash/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent — NUNCA
// innerHTML com dado do usuário.
//
// SHA-1/256/384/512: Web Crypto nativa (crypto.subtle.digest) — sem lib.
// MD5: crypto.subtle NÃO suporta MD5 (algoritmo legado/quebrado), então
// implementamos MD5 puro em JS (RFC 1321) para oferecê-lo mesmo assim, com
// aviso na página de que MD5 (e SHA-1) NÃO servem para segurança — apenas
// checksums/compatibilidade com sistemas legados.
//
// O arquivo é carregável tanto no navegador quanto em Node (para testes de
// sanidade): a lógica pura é exportada via module.exports e a fiação de DOM
// só roda quando `document` existe.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — codificação e algoritmos de hash
  // ================================================================

  /** Converte uma string para bytes UTF-8 (Uint8Array). */
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

  /** Converte um ArrayBuffer/Uint8Array em string hexadecimal minúscula. */
  function bytesToHex(buf) {
    var view = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var out = "";
    for (var i = 0; i < view.length; i++) {
      out += ("0" + view[i].toString(16)).slice(-2);
    }
    return out;
  }

  // --- MD5 puro (RFC 1321), operando sobre bytes UTF-8 ---

  // Tabela de deslocamentos por rodada.
  var MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  // Constantes K[i] = floor(2^32 * abs(sin(i+1))).
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

  /** Calcula o MD5 de um Uint8Array e devolve o digest em hex. */
  function md5(bytes) {
    var origLen = bytes.length;
    // Pré-processamento: append 0x80, padding até ≡ 56 (mod 64), + comprimento.
    var withOne = origLen + 1;
    var padLen = ((withOne + 8 + 63) & ~63) - (withOne + 8);
    var totalLen = origLen + 1 + padLen + 8;
    var msg = new Uint8Array(totalLen);
    msg.set(bytes, 0);
    msg[origLen] = 0x80;
    // Comprimento em bits, little-endian 64 bits.
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

    // Digest: a0,b0,c0,d0 em little-endian.
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

  // Provedor de crypto.subtle compatível com browser e Node.
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
   * Calcula um digest SHA (SHA-1/256/384/512) via Web Crypto.
   * Retorna uma Promise que resolve em string hex, ou rejeita se indisponível.
   */
  function shaHex(algo, bytes) {
    var subtle = getSubtle();
    if (!subtle) {
      return Promise.reject(new Error("Web Crypto API indisponível"));
    }
    // Passa uma cópia de ArrayBuffer "limpo" (evita SharedArrayBuffer/offset).
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
   * Calcula todos os hashes de uma string. Retorna Promise<{key:hex}>.
   * MD5 é síncrono (JS puro); os SHA usam crypto.subtle (assíncrono).
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

  // Exporta o núcleo para testes de sanidade em Node.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { md5: md5, shaHex: shaHex, hashAll: hashAll, utf8Bytes: utf8Bytes, bytesToHex: bytesToHex };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
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

  // Token para descartar resultados de execuções obsoletas (o usuário pode
  // digitar mais rápido do que os digests SHA assíncronos resolvem).
  var runToken = 0;

  function recompute() {
    var myToken = ++runToken;
    clearError();
    var texto = inputEl.value;

    // MD5 é síncrono — mostra imediatamente.
    try {
      var bytes = utf8Bytes(texto);
      outputs.md5.value = md5(bytes);
    } catch (e) {
      showError("Falha ao calcular MD5: " + e.message);
    }

    hashAll(texto).then(function (res) {
      if (myToken !== runToken) {
        return; // resultado obsoleto
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
        "Não foi possível calcular os hashes SHA: " + e.message +
        ". Seu navegador pode não suportar a Web Crypto API (necessária para SHA)."
      );
    });
  }

  // --- Cópia com fallback ---
  function copyText(text, btn) {
    if (text === "") {
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copiado!");
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
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  inputEl.addEventListener("input", recompute);
  ALGOS.forEach(function (a) {
    copyBtns[a.key].addEventListener("click", function () {
      copyText(outputs[a.key].value, copyBtns[a.key]);
    });
  });

  // Cálculo inicial (campo pode vir preenchido via autofill).
  recompute();
})();
