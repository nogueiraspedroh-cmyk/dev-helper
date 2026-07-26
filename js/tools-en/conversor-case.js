// js/tools-en/conversor-case.js — Case converter (camelCase, snake_case, etc.) — English version.
// Loaded ONLY on en/tools/conversor-case/index.html, after js/main.js.
// Mirrors js/tools/conversor-case.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value on readonly inputs
// (result rows are static in the HTML) — NEVER innerHTML.
// PRODUCT DECISION: we show ALL formats at once (6 fixed rows),
// updated live as the user types — more useful than requiring a selection.

(function () {
  "use strict";

  var inputEl = document.getElementById("case-input");

  if (!inputEl) {
    return;
  }

  // Each format → { out: <readonly input>, btn: <copy button>, fn: converter }
  // The result rows are static in the HTML (fixed ids), so there is no
  // markup created from user data.
  var FORMATOS = [
    { id: "camel",    fn: toCamel },
    { id: "pascal",   fn: toPascal },
    { id: "snake",    fn: toSnake },
    { id: "kebab",    fn: toKebab },
    { id: "constant", fn: toConstant },
    { id: "title",    fn: toTitle }
  ];

  // --- Tokenization ---

  /**
   * Splits the input into word tokens, handling camelCase/PascalCase,
   * spaces and common separators (_ - . / etc.). Returns lowercase tokens.
   */
  function tokenize(str) {
    if (!str) return [];
    var s = str
      // fooBar -> foo Bar
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // XMLHttp -> XML Http
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    var tokens = s.split(/[^a-zA-Z0-9]+/);
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i] !== "") out.push(tokens[i].toLowerCase());
    }
    return out;
  }

  function capitalize(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // --- Converters ---
  function toCamel(tokens) {
    if (tokens.length === 0) return "";
    return tokens.map(function (t, i) {
      return i === 0 ? t : capitalize(t);
    }).join("");
  }

  function toPascal(tokens) {
    return tokens.map(capitalize).join("");
  }

  function toSnake(tokens) {
    return tokens.join("_");
  }

  function toKebab(tokens) {
    return tokens.join("-");
  }

  function toConstant(tokens) {
    return tokens.join("_").toUpperCase();
  }

  function toTitle(tokens) {
    return tokens.map(capitalize).join(" ");
  }

  // --- Resolve elements for each format ---
  var linhas = [];
  FORMATOS.forEach(function (fmt) {
    var out = document.getElementById("case-out-" + fmt.id);
    var btn = document.getElementById("btn-case-copy-" + fmt.id);
    if (out && btn) {
      linhas.push({ out: out, btn: btn, fn: fmt.fn });
    }
  });

  if (linhas.length === 0) {
    return;
  }

  // --- Live update ---
  function atualizar() {
    var tokens = tokenize(inputEl.value);
    linhas.forEach(function (linha) {
      linha.out.value = linha.fn(tokens); // .value — no XSS risk
    });
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") return;
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
      // Silences
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  inputEl.addEventListener("input", atualizar);
  linhas.forEach(function (linha) {
    linha.btn.addEventListener("click", function () {
      copyText(linha.out.value, linha.btn);
    });
  });

  // Initial state (field may come pre-filled via autofill)
  atualizar();

})();
