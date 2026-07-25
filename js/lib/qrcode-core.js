// js/lib/qrcode-core.js — NÚCLEO PURO de geração de QR Code (sem DOM).
// Extraído de js/tools/qrcode.js para ser compartilhado (ex.: tools/pix).
//
// Algoritmo adaptado (ES5) do "QR Code generator library" de Project Nayuki
// (MIT) — https://www.nayuki.io/page/qr-code-generator-library. Modo BYTE
// (UTF-8), correção Reed-Solomon L/M/Q/H, versões 1..40 com seleção automática
// do menor tamanho e da melhor máscara.
//
// UMD-lite: exporta via module.exports (Node) E via window.QRCore (navegador).

(function () {
  "use strict";

  var MIN_VERSION = 1;
  var MAX_VERSION = 40;

  var PENALTY_N1 = 3;
  var PENALTY_N2 = 3;
  var PENALTY_N3 = 40;
  var PENALTY_N4 = 10;

  // Tabelas de correção de erro (Nayuki). Índice [ecl.ordinal][version].
  var ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Low
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // Medium
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Quartile
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]  // High
  ];
  var NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // Low
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // Medium
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Quartile
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]  // High
  ];

  // Nível de correção -> {ordinal, formatBits}
  var ECL = {
    L: { ordinal: 0, formatBits: 1 },
    M: { ordinal: 1, formatBits: 0 },
    Q: { ordinal: 2, formatBits: 3 },
    H: { ordinal: 3, formatBits: 2 }
  };

  function getBit(x, i) {
    return ((x >>> i) & 1) !== 0;
  }

  // --- Reed-Solomon em GF(256) com polinômio 0x11D ---

  function reedSolomonMultiply(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }

  function reedSolomonComputeDivisor(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) {
      result.push(0);
    }
    result.push(1);
    var root = 1;
    for (var d = 0; d < degree; d++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = reedSolomonMultiply(result[j], root);
        if (j + 1 < result.length) {
          result[j] ^= result[j + 1];
        }
      }
      root = reedSolomonMultiply(root, 0x02);
    }
    return result;
  }

  function reedSolomonComputeRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ result.shift();
      result.push(0);
      divisor.forEach(function (coef, i) {
        result[i] ^= reedSolomonMultiply(coef, factor);
      });
    });
    return result;
  }

  // --- Contagem de módulos ---

  function getNumRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) {
        result -= 36;
      }
    }
    return result;
  }

  function getNumDataCodewords(ver, ecl) {
    return (
      Math.floor(getNumRawDataModules(ver) / 8) -
      ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
    );
  }

  // --- Encoding do texto em modo byte (UTF-8) ---

  function utf8Bytes(str) {
    if (typeof TextEncoder !== "undefined") {
      return Array.prototype.slice.call(new TextEncoder().encode(str));
    }
    var enc = unescape(encodeURIComponent(str));
    var out = [];
    for (var i = 0; i < enc.length; i++) {
      out.push(enc.charCodeAt(i) & 0xff);
    }
    return out;
  }

  function numCharCountBits(ver) {
    // Modo BYTE: 8 bits (v1-9) ou 16 bits (v10-40).
    return ver <= 9 ? 8 : 16;
  }

  // --- Construção da matriz do QR ---

  function QrMatrix(version, ecl, dataCodewords) {
    this.version = version;
    this.ecl = ecl;
    this.size = version * 4 + 17;
    this.modules = [];
    this.isFunction = [];
    for (var y = 0; y < this.size; y++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
    this.drawFunctionPatterns();
    var allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);
    // Escolhe automaticamente a melhor máscara.
    var minPenalty = Infinity;
    var bestMask = 0;
    for (var m = 0; m < 8; m++) {
      this.applyMask(m);
      this.drawFormatBits(m);
      var penalty = this.getPenaltyScore();
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestMask = m;
      }
      this.applyMask(m); // desfaz (XOR é seu próprio inverso)
    }
    this.applyMask(bestMask);
    this.drawFormatBits(bestMask);
    this.mask = bestMask;
  }

  QrMatrix.prototype.setFunctionModule = function (x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  };

  QrMatrix.prototype.drawFunctionPatterns = function () {
    var size = this.size;
    var i;
    for (i = 0; i < size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);

    var alignPatPos = this.getAlignmentPatternPositions();
    var numAlign = alignPatPos.length;
    for (i = 0; i < numAlign; i++) {
      for (var j = 0; j < numAlign; j++) {
        if (!((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))) {
          this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
        }
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  };

  QrMatrix.prototype.drawFinderPattern = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx;
        var yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };

  QrMatrix.prototype.drawAlignmentPattern = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };

  QrMatrix.prototype.drawFormatBits = function (mask) {
    var data = (this.ecl.formatBits << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    var bits = ((data << 10) | rem) ^ 0x5412;
    bits = bits & 0x7fff;

    for (i = 0; i <= 5; i++) {
      this.setFunctionModule(8, i, getBit(bits, i));
    }
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (i = 9; i < 15; i++) {
      this.setFunctionModule(14 - i, 8, getBit(bits, i));
    }
    for (i = 0; i < 8; i++) {
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    }
    for (i = 8; i < 15; i++) {
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    }
    this.setFunctionModule(8, this.size - 8, true);
  };

  QrMatrix.prototype.drawVersion = function () {
    if (this.version < 7) {
      return;
    }
    var rem = this.version;
    for (var i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    var bits = (this.version << 12) | rem;
    for (i = 0; i < 18; i++) {
      var color = getBit(bits, i);
      var a = this.size - 11 + (i % 3);
      var b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  };

  QrMatrix.prototype.getAlignmentPatternPositions = function () {
    if (this.version === 1) {
      return [];
    }
    var numAlign = Math.floor(this.version / 7) + 2;
    var step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    var result = [6];
    for (var pos = this.size - 7; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  };

  QrMatrix.prototype.addEccAndInterleave = function (data) {
    var ver = this.version;
    var ecl = this.ecl;
    var numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    var blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    var rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);

    var blocks = [];
    var rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (var i = 0, k = 0; i < numBlocks; i++) {
      var datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      var dat = data.slice(k, k + datLen);
      k += dat.length;
      var ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) {
        dat.push(0);
      }
      blocks.push(dat.concat(ecc));
    }

    var result = [];
    for (var idx = 0; idx < blocks[0].length; idx++) {
      for (var j = 0; j < blocks.length; j++) {
        if (idx !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          result.push(blocks[j][idx]);
        }
      }
    }
    return result;
  };

  QrMatrix.prototype.drawCodewords = function (data) {
    var i = 0;
    for (var right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }
      for (var vert = 0; vert < this.size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var x = right - jj;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  };

  QrMatrix.prototype.applyMask = function (mask) {
    for (var y = 0; y < this.size; y++) {
      for (var x = 0; x < this.size; x++) {
        var invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = false;
        }
        if (!this.isFunction[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  };

  QrMatrix.prototype.finderPenaltyCountPatterns = function (runHistory) {
    var n = runHistory[1];
    var core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  };

  QrMatrix.prototype.finderPenaltyTerminateAndCount = function (currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  };

  QrMatrix.prototype.finderPenaltyAddHistory = function (currentRunLength, runHistory) {
    if (runHistory[0] === 0) {
      currentRunLength += this.size;
    }
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  };

  QrMatrix.prototype.getPenaltyScore = function () {
    var result = 0;
    var size = this.size;
    var x, y, runColor, runLen, runHistory;

    // Linhas
    for (y = 0; y < size; y++) {
      runColor = false;
      runLen = 0;
      runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (x = 0; x < size; x++) {
        if (this.modules[y][x] === runColor) {
          runLen++;
          if (runLen === 5) { result += PENALTY_N1; }
          else if (runLen > 5) { result++; }
        } else {
          this.finderPenaltyAddHistory(runLen, runHistory);
          if (!runColor) { result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3; }
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runLen, runHistory) * PENALTY_N3;
    }
    // Colunas
    for (x = 0; x < size; x++) {
      runColor = false;
      runLen = 0;
      runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (y = 0; y < size; y++) {
        if (this.modules[y][x] === runColor) {
          runLen++;
          if (runLen === 5) { result += PENALTY_N1; }
          else if (runLen > 5) { result++; }
        } else {
          this.finderPenaltyAddHistory(runLen, runHistory);
          if (!runColor) { result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3; }
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runLen, runHistory) * PENALTY_N3;
    }
    // Blocos 2x2
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var color = this.modules[y][x];
        if (color === this.modules[y][x + 1] && color === this.modules[y + 1][x] && color === this.modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    // Proporção escuro/claro
    var dark = 0;
    for (y = 0; y < size; y++) {
      for (x = 0; x < size; x++) {
        if (this.modules[y][x]) { dark++; }
      }
    }
    var total = size * size;
    var kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += kk * PENALTY_N4;
    return result;
  };

  /**
   * Gera a matriz de um QR Code a partir de texto (modo byte/UTF-8).
   * @param {string} text
   * @param {string} eclName  "L" | "M" | "Q" | "H"
   * @returns {{size:number, modules:Array<Array<boolean>>, version:number,
   *            ecl:string, mask:number}}
   * @throws {Error} se o texto for grande demais até a versão 40.
   */
  function encodeText(text, eclName) {
    var ecl = ECL[eclName] || ECL.M;
    var data = utf8Bytes(text);

    // Escolhe a menor versão que comporta os dados no nível de correção dado.
    var version = -1;
    var dataUsedBits = 0;
    for (var ver = MIN_VERSION; ver <= MAX_VERSION; ver++) {
      var capacityBits = getNumDataCodewords(ver, ecl) * 8;
      var usedBits = 4 + numCharCountBits(ver) + data.length * 8;
      if (usedBits <= capacityBits) {
        version = ver;
        dataUsedBits = usedBits;
        break;
      }
    }
    if (version === -1) {
      throw new Error(
        "O texto é longo demais para caber em um QR Code (máx. versão 40) neste nível de correção. " +
        "Reduza o texto ou use um nível de correção menor (L)."
      );
    }

    // Monta o buffer de bits: indicador de modo + contagem + dados.
    var bb = [];
    function appendBits(val, len) {
      for (var i = len - 1; i >= 0; i--) {
        bb.push((val >>> i) & 1);
      }
    }
    appendBits(0x4, 4); // modo byte
    appendBits(data.length, numCharCountBits(version));
    data.forEach(function (b) {
      appendBits(b, 8);
    });

    var capacityBits2 = getNumDataCodewords(version, ecl) * 8;
    // Terminador (até 4 zeros).
    appendBits(0, Math.min(4, capacityBits2 - bb.length));
    // Alinha ao byte.
    appendBits(0, (8 - (bb.length % 8)) % 8);
    // Bytes de padding 0xEC / 0x11 alternados.
    for (var pad = 0xec; bb.length < capacityBits2; pad ^= 0xec ^ 0x11) {
      appendBits(pad, 8);
    }

    // Bits -> codewords (bytes).
    var dataCodewords = [];
    for (var i = 0; i < bb.length; i += 8) {
      var byteVal = 0;
      for (var j = 0; j < 8; j++) {
        byteVal = (byteVal << 1) | bb[i + j];
      }
      dataCodewords.push(byteVal);
    }
    void dataUsedBits;

    var qr = new QrMatrix(version, ecl, dataCodewords);
    return {
      size: qr.size,
      modules: qr.modules,
      version: qr.version,
      ecl: eclName,
      mask: qr.mask
    };
  }

  var api = { encodeText: encodeText, getNumDataCodewords: getNumDataCodewords, ECL: ECL };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.QRCore = api;
  }
})();
