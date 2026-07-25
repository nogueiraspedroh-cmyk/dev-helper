// js/tools/contador-caracteres.js — contador de caracteres/palavras ao vivo.
// Carregado APENAS em tools/contador-caracteres/index.html, após js/main.js.
// Anti-XSS: saída via .textContent — nunca innerHTML com dado do usuário.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — análise de texto
  // ================================================================

  /**
   * Analisa o texto e devolve as contagens.
   * - charsWith: total de caracteres (com espaços), usando code points
   *   (Array.from lida com emoji/pares surrogate como 1 caractere).
   * - charsWithout: caracteres desconsiderando qualquer espaço em branco.
   * - words: sequências separadas por espaço em branco.
   * - lines: número de linhas (0 se vazio).
   * - paragraphs: blocos separados por uma ou mais linhas em branco.
   */
  function analyze(text) {
    if (typeof text !== "string") { text = ""; }
    var chars = Array.from(text);
    var charsWith = chars.length;
    var charsWithout = chars.filter(function (c) { return !/\s/.test(c); }).length;
    var trimmed = text.trim();
    var words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    var lines = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
    var paragraphs = trimmed === "" ? 0 : trimmed.split(/(?:\r\n|\r|\n)\s*(?:\r\n|\r|\n)+/)
      .filter(function (p) { return p.trim() !== ""; }).length;
    return {
      charsWith: charsWith,
      charsWithout: charsWithout,
      words: words,
      lines: lines,
      paragraphs: paragraphs
    };
  }

  // Limites comuns em plataformas (contam caracteres COM espaços).
  var LIMITS = [
    { id: "tweet", label: "Post no X (Twitter)", limit: 280 },
    { id: "meta", label: "Meta description", limit: 160 },
    { id: "title", label: "Title tag (SEO)", limit: 60 }
  ];

  /**
   * Para um total de caracteres, calcula o status de cada limite:
   * remaining > 0 -> quantos faltam; <= 0 -> quanto excedeu (valor absoluto).
   */
  function limitStatus(charsWith) {
    return LIMITS.map(function (l) {
      var remaining = l.limit - charsWith;
      return {
        id: l.id,
        label: l.label,
        limit: l.limit,
        remaining: remaining,
        exceeded: remaining < 0
      };
    });
  }

  var core = { analyze: analyze, limitStatus: limitStatus, LIMITS: LIMITS };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var input = document.getElementById("cc-input");
  var elCharsWith = document.getElementById("cc-chars-with");
  var elCharsWithout = document.getElementById("cc-chars-without");
  var elWords = document.getElementById("cc-words");
  var elLines = document.getElementById("cc-lines");
  var elParagraphs = document.getElementById("cc-paragraphs");
  var limitsEl = document.getElementById("cc-limits");
  var btnClear = document.getElementById("cc-clear");

  if (!input) { return; }

  function setNum(el, n) { if (el) { el.textContent = String(n); } }

  function renderLimits(charsWith) {
    if (!limitsEl) { return; }
    var statuses = limitStatus(charsWith);
    while (limitsEl.firstChild) { limitsEl.removeChild(limitsEl.firstChild); }
    statuses.forEach(function (s) {
      var row = document.createElement("div");
      row.className = "cc-limit" + (s.exceeded ? " cc-limit--over" : "");

      var name = document.createElement("span");
      name.className = "cc-limit__label";
      name.textContent = s.label + " (" + s.limit + ")";

      var status = document.createElement("span");
      status.className = "cc-limit__status";
      if (s.exceeded) {
        status.textContent = "excedeu " + Math.abs(s.remaining);
      } else {
        status.textContent = "faltam " + s.remaining;
      }

      row.appendChild(name);
      row.appendChild(status);
      limitsEl.appendChild(row);
    });
  }

  function update() {
    var r = analyze(input.value);
    setNum(elCharsWith, r.charsWith);
    setNum(elCharsWithout, r.charsWithout);
    setNum(elWords, r.words);
    setNum(elLines, r.lines);
    setNum(elParagraphs, r.paragraphs);
    renderLimits(r.charsWith);
  }

  input.addEventListener("input", update);

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      input.value = "";
      update();
      input.focus();
    });
  }

  update();
})();
