// js/tools/conversor-case.js — Conversor de case (camelCase, snake_case, etc.).
// Carregado APENAS em tools/conversor-case/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value nos inputs readonly
// (linhas de resultado são estáticas no HTML) — NUNCA innerHTML.
// DECISÃO DE PRODUTO: mostramos TODOS os formatos de uma vez (6 linhas fixas),
// atualizados ao vivo conforme o usuário digita — mais útil que exigir seleção.

(function () {
  "use strict";

  var inputEl = document.getElementById("case-input");

  if (!inputEl) {
    return;
  }

  // Cada formato → { out: <input readonly>, btn: <botão copiar>, fn: conversor }
  // As linhas de resultado são estáticas no HTML (ids fixos), então não há
  // criação de markup a partir de dado do usuário.
  var FORMATOS = [
    { id: "camel",    fn: toCamel },
    { id: "pascal",   fn: toPascal },
    { id: "snake",    fn: toSnake },
    { id: "kebab",    fn: toKebab },
    { id: "constant", fn: toConstant },
    { id: "title",    fn: toTitle }
  ];

  // --- Tokenização ---

  /**
   * Quebra a entrada em tokens de palavra, lidando com camelCase/PascalCase,
   * espaços e separadores comuns (_ - . / etc.). Retorna tokens em minúsculo.
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

  // --- Conversores ---
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

  // --- Resolve elementos de cada formato ---
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

  // --- Atualização ao vivo ---
  function atualizar() {
    var tokens = tokenize(inputEl.value);
    linhas.forEach(function (linha) {
      linha.out.value = linha.fn(tokens); // .value — sem risco de XSS
    });
  }

  // --- Cópia com fallback ---
  function copyText(text, btn) {
    if (text === "") return;
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
      // Silencia
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  inputEl.addEventListener("input", atualizar);
  linhas.forEach(function (linha) {
    linha.btn.addEventListener("click", function () {
      copyText(linha.out.value, linha.btn);
    });
  });

  // Estado inicial (campo pode vir preenchido via autofill)
  atualizar();

})();
