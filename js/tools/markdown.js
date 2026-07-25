// js/tools/markdown.js — Editor/preview de Markdown com preview ao vivo.
// Carregado APENAS em tools/markdown/index.html, apos js/main.js.
// Padrao defensivo: todo acesso ao DOM checa if (el).
//
// SEGURANCA (CRITICO): o preview e HTML de verdade renderizado na pagina, entao
// e a ferramenta de MAIOR risco de XSS do catalogo. Por isso NUNCA construimos
// string de HTML: o Markdown e convertido para uma AST pura (parseMarkdown) e
// renderizada exclusivamente via document.createElement + textContent. Todo
// texto vindo do usuario -- inclusive dentro de negrito/italico e o texto e a
// URL de um link -- e tratado como DADO, nunca como HTML. A URL de um link so
// vira href se passar por isSafeUrl (http/https/mailto/relativo); esquemas como
// javascript: sao rejeitados (o link vira texto puro).
//
// UMD-lite: parser puro exportado p/ Node (sanidade); DOM so no navegador.

(function () {
  "use strict";

  // ================================================================
  // NUCLEO PURO -- parser Markdown -> AST (sem tocar no DOM)
  // ================================================================

  // Aceita apenas URLs seguras: http:, https:, mailto: e relativas (sem esquema).
  // Rejeita javascript:, data:, vbscript: e afins. Remove espacos/tab/CR/LF que
  // navegadores ignoram dentro de URLs (evita "java\tscript:").
  function isSafeUrl(url) {
    var u = String(url == null ? "" : url).replace(/[\t\n\r ]+/g, "").toLowerCase();
    var m = /^([a-z][a-z0-9+.-]*):/.exec(u);
    if (!m) { return true; }
    var scheme = m[1];
    return scheme === "http" || scheme === "https" || scheme === "mailto";
  }

  // Parse inline: retorna array de tokens
  // {type:"text"|"bold"|"italic"|"code"|"link", value?, children?, href?}
  function parseInline(text) {
    var tokens = [];
    var rest = text;

    function findFirst(str) {
      var patterns = [
        { type: "code", re: /`([^`]+)`/ },
        { type: "link", re: /\[([^\]]*)\]\(([^)\s]+)\)/ },
        { type: "bold", re: /\*\*([\s\S]+?)\*\*/ },
        { type: "italic", re: /\*([^*]+)\*/ }
      ];
      var best = null;
      for (var i = 0; i < patterns.length; i++) {
        var m = patterns[i].re.exec(str);
        if (m && (best === null || m.index < best.index)) {
          best = { type: patterns[i].type, index: m.index, match: m };
        }
      }
      return best;
    }

    while (rest.length > 0) {
      var found = findFirst(rest);
      if (!found) {
        tokens.push({ type: "text", value: rest });
        break;
      }
      if (found.index > 0) {
        tokens.push({ type: "text", value: rest.slice(0, found.index) });
      }
      var m = found.match;
      if (found.type === "code") {
        tokens.push({ type: "code", value: m[1] });
      } else if (found.type === "link") {
        tokens.push({ type: "link", children: parseInline(m[1]), href: m[2] });
      } else if (found.type === "bold") {
        tokens.push({ type: "bold", children: parseInline(m[1]) });
      } else if (found.type === "italic") {
        tokens.push({ type: "italic", children: parseInline(m[1]) });
      }
      rest = rest.slice(found.index + m[0].length);
    }
    return tokens;
  }

  // Parse de blocos: retorna array de blocos
  // {type:"heading",level,children} | {type:"paragraph",children} |
  // {type:"code",value} | {type:"blockquote",children} | {type:"hr"} |
  // {type:"list",ordered,items:[[tokens],...]}
  function parseMarkdown(md) {
    var lines = String(md == null ? "" : md).replace(/\r\n?/g, "\n").split("\n");
    var blocks = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*```/.test(line)) {
        var codeLines = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) {
          codeLines.push(lines[i]);
          i++;
        }
        i++;
        blocks.push({ type: "code", value: codeLines.join("\n") });
        continue;
      }

      if (/^\s*$/.test(line)) { i++; continue; }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        blocks.push({ type: "hr" });
        i++;
        continue;
      }

      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        blocks.push({ type: "heading", level: h[1].length, children: parseInline(h[2]) });
        i++;
        continue;
      }

      if (/^\s*>/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        blocks.push({ type: "blockquote", children: parseInline(quoteLines.join("\n")) });
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var uItems = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          uItems.push(parseInline(lines[i].replace(/^\s*[-*]\s+/, "")));
          i++;
        }
        blocks.push({ type: "list", ordered: false, items: uItems });
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var oItems = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          oItems.push(parseInline(lines[i].replace(/^\s*\d+\.\s+/, "")));
          i++;
        }
        blocks.push({ type: "list", ordered: true, items: oItems });
        continue;
      }

      var paraLines = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
             !/^(#{1,6})\s+/.test(lines[i]) &&
             !/^\s*```/.test(lines[i]) &&
             !/^\s*>/.test(lines[i]) &&
             !/^\s*[-*]\s+/.test(lines[i]) &&
             !/^\s*\d+\.\s+/.test(lines[i]) &&
             !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) {
        blocks.push({ type: "paragraph", children: parseInline(paraLines.join("\n")) });
      }
    }
    return blocks;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      isSafeUrl: isSafeUrl,
      parseInline: parseInline,
      parseMarkdown: parseMarkdown
    };
  }

  // ================================================================
  // FIACAO DE DOM -- apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputEl = document.getElementById("md-input");
  var previewEl = document.getElementById("md-preview");
  if (!inputEl || !previewEl) { return; }

  function renderInline(tokens, parent) {
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === "text") {
        parent.appendChild(document.createTextNode(t.value));
      } else if (t.type === "code") {
        var codeEl = document.createElement("code");
        codeEl.textContent = t.value;
        parent.appendChild(codeEl);
      } else if (t.type === "bold") {
        var strong = document.createElement("strong");
        renderInline(t.children, strong);
        parent.appendChild(strong);
      } else if (t.type === "italic") {
        var em = document.createElement("em");
        renderInline(t.children, em);
        parent.appendChild(em);
      } else if (t.type === "link") {
        if (isSafeUrl(t.href)) {
          var a = document.createElement("a");
          a.href = t.href;
          a.rel = "nofollow noopener noreferrer";
          a.target = "_blank";
          renderInline(t.children, a);
          parent.appendChild(a);
        } else {
          renderInline(t.children, parent);
        }
      }
    }
  }

  function renderBlocks(blocks, container) {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var el;
      if (b.type === "heading") {
        el = document.createElement("h" + b.level);
        renderInline(b.children, el);
      } else if (b.type === "paragraph") {
        el = document.createElement("p");
        renderInline(b.children, el);
      } else if (b.type === "code") {
        var pre = document.createElement("pre");
        var code = document.createElement("code");
        code.textContent = b.value;
        pre.appendChild(code);
        el = pre;
      } else if (b.type === "blockquote") {
        el = document.createElement("blockquote");
        renderInline(b.children, el);
      } else if (b.type === "hr") {
        el = document.createElement("hr");
      } else if (b.type === "list") {
        el = document.createElement(b.ordered ? "ol" : "ul");
        for (var j = 0; j < b.items.length; j++) {
          var li = document.createElement("li");
          renderInline(b.items[j], li);
          el.appendChild(li);
        }
      }
      if (el) { container.appendChild(el); }
    }
  }

  function render() {
    var ast = parseMarkdown(inputEl.value);
    while (previewEl.firstChild) { previewEl.removeChild(previewEl.firstChild); }
    renderBlocks(ast, previewEl);
  }

  inputEl.addEventListener("input", render);
  render();
})();
