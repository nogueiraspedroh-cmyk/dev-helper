// js/tools/xml.js — Formatador/Ajustador de XML.
// Carregado APENAS em tools/xml/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM checa if (el).
// Anti-XSS: saída via .value (textarea) — nunca innerHTML.
//
// Parser de XML PRÓPRIO, recursivo-descendente, escrito à mão (sem
// DOMParser) — mesmo motivo documentado para js/tools/yaml-json.js: reusar
// a MESMA lógica no navegador e no Node (sanity check via require()), sem
// depender do comportamento de parser de XML específico de cada navegador.
//
// Suportado: declaração XML (<?xml ...?>), elementos aninhados, atributos
// (aspas simples ou duplas), tags self-closing (<a/>), texto, comentários
// (<!-- -->), CDATA (<![CDATA[ ]]>), entidades básicas (&lt; &gt; &amp;
// &quot; &apos; e numéricas &#NN;/&#xNN;), namespaces tratados como parte
// literal do nome (sem resolver URIs).
//
// FORA DE ESCOPO (documentado também na página): DOCTYPE com subconjunto
// interno / entidades customizadas — a declaração <!DOCTYPE ...> é
// preservada como texto OPACO (nunca processada — evita expansão de
// entidade estilo XXE); validação contra XSD/DTD; resolução de namespace;
// XPath.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — parser XML -> AST e serializador AST -> string
  // ================================================================

  var NAME_RE = /^[^\s=\/>]+/;

  /** Calcula linha/coluna (1-based) de uma posição no texto — só para mensagens de erro. */
  function posInfo(text, pos) {
    var before = text.slice(0, pos);
    var line = (before.match(/\n/g) || []).length + 1;
    var col = pos - before.lastIndexOf("\n");
    return "linha " + line + ", coluna " + col;
  }

  function isWhitespace(ch) {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  }

  function skipWs(text, state) {
    while (state.pos < text.length && isWhitespace(text.charAt(state.pos))) {
      state.pos++;
    }
  }

  function startsWith(text, state, str) {
    return text.substr(state.pos, str.length) === str;
  }

  function readName(text, state) {
    var m = NAME_RE.exec(text.slice(state.pos));
    if (!m) {
      return "";
    }
    state.pos += m[0].length;
    return m[0];
  }

  /** Resolve uma entidade nomeada/numérica (sem DOCTYPE). Retorna null se desconhecida. */
  function resolveEntity(ent) {
    if (ent === "lt") return "<";
    if (ent === "gt") return ">";
    if (ent === "amp") return "&";
    if (ent === "quot") return '"';
    if (ent === "apos") return "'";
    if (/^#[0-9]+$/.test(ent)) return String.fromCodePoint(parseInt(ent.slice(1), 10));
    if (/^#x[0-9a-fA-F]+$/.test(ent)) return String.fromCodePoint(parseInt(ent.slice(2), 16));
    return null;
  }

  function decodeEntities(raw, text, basePos) {
    var out = "";
    var i = 0;
    while (i < raw.length) {
      var ch = raw.charAt(i);
      if (ch === "&") {
        var semi = raw.indexOf(";", i);
        if (semi === -1) {
          throw new Error(
            "Entidade não terminada (falta ';') próximo a " + posInfo(text, basePos + i) + "."
          );
        }
        var ent = raw.slice(i + 1, semi);
        var replaced = resolveEntity(ent);
        if (replaced === null) {
          throw new Error(
            "Entidade desconhecida '&" + ent + ";' em " + posInfo(text, basePos + i) + "."
          );
        }
        out += replaced;
        i = semi + 1;
      } else {
        out += ch;
        i++;
      }
    }
    return out;
  }

  function escapeText(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Consome uma declaração <!DOCTYPE ...> a partir de state.pos, preservando-a
   * como texto OPACO (não processa o subconjunto interno). Rastreia
   * profundidade de "[" "]" e strings entre aspas para achar o "]>" correto.
   */
  function consumeDoctype(text, state) {
    var start = state.pos;
    var i = start + "<!DOCTYPE".length;
    var depth = 0;
    var quote = null;
    while (i < text.length) {
      var c = text.charAt(i);
      if (quote) {
        if (c === quote) { quote = null; }
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === "[") {
        depth++;
      } else if (c === "]") {
        depth--;
      } else if (c === ">" && depth <= 0) {
        var raw = text.slice(start, i + 1);
        state.pos = i + 1;
        return raw;
      }
      i++;
    }
    throw new Error("Declaração <!DOCTYPE ...> não fechada (" + posInfo(text, start) + ").");
  }

  function parseComment(text, state) {
    var start = state.pos;
    state.pos += 4; // "<!--"
    var end = text.indexOf("-->", state.pos);
    if (end === -1) {
      throw new Error("Comentário não fechado (iniciado em " + posInfo(text, start) + ").");
    }
    var value = text.slice(state.pos, end);
    state.pos = end + 3;
    return { type: "comment", value: value };
  }

  function parseCData(text, state) {
    var start = state.pos;
    state.pos += 9; // "<![CDATA["
    var end = text.indexOf("]]>", state.pos);
    if (end === -1) {
      throw new Error("Seção CDATA não fechada (iniciada em " + posInfo(text, start) + ").");
    }
    var value = text.slice(state.pos, end);
    state.pos = end + 3;
    return { type: "cdata", value: value };
  }

  function parseAttributes(text, state, tagName) {
    var attrs = [];
    var seen = {};
    while (true) {
      skipWs(text, state);
      var c = text.charAt(state.pos);
      if (c === "/" || c === ">" || state.pos >= text.length) {
        break;
      }
      var attrName = readName(text, state);
      if (attrName === "") {
        throw new Error(
          "Caractere inesperado na tag <" + tagName + "> em " + posInfo(text, state.pos) + "."
        );
      }
      skipWs(text, state);
      if (text.charAt(state.pos) !== "=") {
        throw new Error(
          "Atributo '" + attrName + "' sem valor (esperado '=') em " + posInfo(text, state.pos) + "."
        );
      }
      state.pos++; // "="
      skipWs(text, state);
      var quote = text.charAt(state.pos);
      if (quote !== '"' && quote !== "'") {
        throw new Error(
          "Atributo '" + attrName + "' sem aspas (use aspas simples ou duplas) em " +
            posInfo(text, state.pos) + "."
        );
      }
      state.pos++;
      var valStart = state.pos;
      var closeIdx = text.indexOf(quote, valStart);
      if (closeIdx === -1) {
        throw new Error("Aspas não fechadas no atributo '" + attrName + "' da tag <" + tagName + ">.");
      }
      var rawVal = text.slice(valStart, closeIdx);
      state.pos = closeIdx + 1;
      var value = decodeEntities(rawVal, text, valStart);
      if (seen[attrName]) {
        throw new Error("Atributo '" + attrName + "' duplicado na tag <" + tagName + ">.");
      }
      seen[attrName] = true;
      attrs.push({ name: attrName, value: value });
    }
    return attrs;
  }

  function parseText(text, state) {
    var start = state.pos;
    var next = text.indexOf("<", state.pos);
    var end = next === -1 ? text.length : next;
    var raw = text.slice(start, end);
    state.pos = end;
    return { type: "text", value: decodeEntities(raw, text, start) };
  }

  function parseElement(text, state) {
    var tagStart = state.pos;
    state.pos++; // "<"
    var name = readName(text, state);
    if (name === "") {
      throw new Error("Nome de tag vazio em " + posInfo(text, tagStart) + ".");
    }
    var attrs = parseAttributes(text, state, name);
    skipWs(text, state);

    if (startsWith(text, state, "/>")) {
      state.pos += 2;
      return { type: "element", name: name, attrs: attrs, children: [], selfClosing: true };
    }
    if (text.charAt(state.pos) !== ">") {
      throw new Error("Tag <" + name + "> mal formada em " + posInfo(text, state.pos) + " (esperado '>').");
    }
    state.pos++; // ">"

    var children = [];
    while (true) {
      if (state.pos >= text.length) {
        throw new Error("Tag não fechada: <" + name + "> (aberta em " + posInfo(text, tagStart) + ").");
      }
      if (startsWith(text, state, "</")) {
        var closeStart = state.pos;
        state.pos += 2;
        var closeName = readName(text, state);
        skipWs(text, state);
        if (text.charAt(state.pos) !== ">") {
          throw new Error("Tag de fechamento </" + closeName + "> mal formada em " + posInfo(text, closeStart) + ".");
        }
        state.pos++;
        if (closeName !== name) {
          throw new Error(
            "Tag não fechada corretamente: esperado </" + name + "> mas encontrado </" + closeName +
              "> em " + posInfo(text, closeStart) + "."
          );
        }
        break;
      } else if (startsWith(text, state, "<!--")) {
        children.push(parseComment(text, state));
      } else if (startsWith(text, state, "<![CDATA[")) {
        children.push(parseCData(text, state));
      } else if (startsWith(text, state, "<?")) {
        var piEnd = text.indexOf("?>", state.pos);
        if (piEnd === -1) {
          throw new Error("Instrução de processamento não fechada em " + posInfo(text, state.pos) + ".");
        }
        state.pos = piEnd + 2; // instruções de processamento são ignoradas (fora de escopo)
      } else if (startsWith(text, state, "<!")) {
        throw new Error("Declaração não suportada dentro de <" + name + "> em " + posInfo(text, state.pos) + ".");
      } else if (text.charAt(state.pos) === "<") {
        children.push(parseElement(text, state));
      } else {
        children.push(parseText(text, state));
      }
    }

    return { type: "element", name: name, attrs: attrs, children: children, selfClosing: false };
  }

  /**
   * Faz o parse de um documento XML completo.
   * @returns {{declaration:(string|null), doctype:(string|null), root:Object}}
   */
  function parseXML(text) {
    if (typeof text !== "string") {
      throw new Error("Entrada XML inválida.");
    }
    var state = { pos: 0 };
    var declaration = null;
    var doctype = null;

    skipWs(text, state);
    if (startsWith(text, state, "<?xml")) {
      var declEnd = text.indexOf("?>", state.pos);
      if (declEnd === -1) {
        throw new Error("Declaração XML (<?xml ...?>) não fechada.");
      }
      declaration = text.slice(state.pos, declEnd + 2);
      state.pos = declEnd + 2;
    }

    while (true) {
      skipWs(text, state);
      if (startsWith(text, state, "<!--")) {
        parseComment(text, state); // comentários no prólogo são ignorados na reserialização
        continue;
      }
      if (startsWith(text, state, "<!DOCTYPE")) {
        if (doctype !== null) {
          throw new Error("Mais de uma declaração <!DOCTYPE ...> encontrada.");
        }
        doctype = consumeDoctype(text, state);
        continue;
      }
      if (startsWith(text, state, "<?")) {
        var piEnd2 = text.indexOf("?>", state.pos);
        if (piEnd2 === -1) {
          throw new Error("Instrução de processamento não fechada em " + posInfo(text, state.pos) + ".");
        }
        state.pos = piEnd2 + 2;
        continue;
      }
      break;
    }

    if (text.charAt(state.pos) !== "<") {
      if (state.pos >= text.length) {
        throw new Error("Documento XML vazio: nenhum elemento raiz encontrado.");
      }
      throw new Error("Texto fora de qualquer elemento em " + posInfo(text, state.pos) + " (esperado '<').");
    }

    var root = parseElement(text, state);

    while (state.pos < text.length) {
      var ch = text.charAt(state.pos);
      if (isWhitespace(ch)) {
        state.pos++;
        continue;
      }
      if (startsWith(text, state, "<!--")) {
        parseComment(text, state);
        continue;
      }
      if (startsWith(text, state, "<?")) {
        var piEnd3 = text.indexOf("?>", state.pos);
        if (piEnd3 === -1) {
          throw new Error("Instrução de processamento não fechada em " + posInfo(text, state.pos) + ".");
        }
        state.pos = piEnd3 + 2;
        continue;
      }
      if (ch === "<") {
        throw new Error("Mais de um elemento raiz encontrado em " + posInfo(text, state.pos) + ".");
      }
      throw new Error("Texto fora do elemento raiz em " + posInfo(text, state.pos) + ".");
    }

    return { declaration: declaration, doctype: doctype, root: root };
  }

  // ----------------------------------------------------------------
  // Serialização
  // ----------------------------------------------------------------

  function repeatStr(unit, n) {
    var s = "";
    for (var i = 0; i < n; i++) { s += unit; }
    return s;
  }

  function serializeAttrs(attrs) {
    return attrs
      .map(function (a) { return " " + a.name + '="' + escapeAttr(a.value) + '"'; })
      .join("");
  }

  /**
   * Serializa um nó SEM adicionar/remover nenhum espaço em branco — usado
   * para o conteúdo de elementos com "conteúdo misto" (texto não-whitespace
   * convivendo com QUALQUER outro nó — elemento, comentário ou CDATA — no
   * mesmo elemento pai), onde reindentar mudaria o dado do usuário.
   */
  function serializeFlat(node) {
    if (node.type === "text") { return escapeText(node.value); }
    if (node.type === "comment") { return "<!--" + node.value + "-->"; }
    if (node.type === "cdata") { return "<![CDATA[" + node.value + "]]>"; }
    var open = "<" + node.name + serializeAttrs(node.attrs);
    if (node.selfClosing && node.children.length === 0) { return open + "/>"; }
    var inner = node.children.map(serializeFlat).join("");
    return open + ">" + inner + "</" + node.name + ">";
  }

  function isMixedElement(node) {
    var hasNonWsText = node.children.some(function (c) {
      return c.type === "text" && c.value.trim() !== "";
    });
    var hasOtherNode = node.children.some(function (c) { return c.type !== "text"; });
    return hasNonWsText && hasOtherNode;
  }

  function significantChildren(children) {
    return children.filter(function (c) {
      if (c.type === "text") { return c.value.trim() !== ""; }
      return true;
    });
  }

  function serializeElement(node, indentUnit, level) {
    var pretty = indentUnit !== "";
    var pad = pretty ? repeatStr(indentUnit, level) : "";
    var open = "<" + node.name + serializeAttrs(node.attrs);

    if (node.selfClosing && node.children.length === 0) {
      return pad + open + "/>";
    }

    if (isMixedElement(node)) {
      // Conteúdo misto: preserva o miolo exatamente como está (sem reindentar).
      var flatInner = node.children.map(serializeFlat).join("");
      return pad + open + ">" + flatInner + "</" + node.name + ">";
    }

    var sig = significantChildren(node.children);

    if (sig.length === 0) {
      return pad + open + "></" + node.name + ">";
    }

    if (sig.length === 1 && sig[0].type === "text") {
      return pad + open + ">" + escapeText(sig[0].value) + "</" + node.name + ">";
    }

    if (!pretty) {
      var innerMin = sig
        .map(function (c) {
          if (c.type === "element") { return serializeElement(c, "", 0); }
          if (c.type === "comment") { return "<!--" + c.value + "-->"; }
          if (c.type === "cdata") { return "<![CDATA[" + c.value + "]]>"; }
          return escapeText(c.value);
        })
        .join("");
      return open + ">" + innerMin + "</" + node.name + ">";
    }

    var childLines = sig.map(function (c) {
      if (c.type === "element") { return serializeElement(c, indentUnit, level + 1); }
      if (c.type === "comment") { return repeatStr(indentUnit, level + 1) + "<!--" + c.value + "-->"; }
      if (c.type === "cdata") { return repeatStr(indentUnit, level + 1) + "<![CDATA[" + c.value + "]]>"; }
      return repeatStr(indentUnit, level + 1) + escapeText(c.value);
    });

    return pad + open + ">\n" + childLines.join("\n") + "\n" + pad + "</" + node.name + ">";
  }

  /**
   * Formata (pretty-print) um XML de entrada com a indentação escolhida.
   * @param {string} text
   * @param {string} indentUnit — "  " (2 espaços), "    " (4) ou "\t"
   */
  function formatXML(text, indentUnit) {
    var ast = parseXML(text);
    var parts = [];
    if (ast.declaration) { parts.push(ast.declaration); }
    if (ast.doctype) { parts.push(ast.doctype); }
    parts.push(serializeElement(ast.root, indentUnit, 0));
    return parts.join("\n");
  }

  /** Minifica um XML de entrada (remove espaços/quebras de linha desnecessários). */
  function minifyXML(text) {
    var ast = parseXML(text);
    var parts = [];
    if (ast.declaration) { parts.push(ast.declaration); }
    if (ast.doctype) { parts.push(ast.doctype); }
    parts.push(serializeElement(ast.root, "", 0));
    return parts.join("");
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseXML: parseXML,
      formatXML: formatXML,
      minifyXML: minifyXML,
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputEl = document.getElementById("xml-input");
  var outputEl = document.getElementById("xml-output");
  var errorEl = document.getElementById("xml-error");
  var selectEl = document.getElementById("indent-select");
  var btnFormat = document.getElementById("btn-format");
  var btnMinify = document.getElementById("btn-minify");
  var btnClear = document.getElementById("btn-clear");
  var btnCopy = document.getElementById("btn-copy");

  if (
    !inputEl || !outputEl || !errorEl || !selectEl ||
    !btnFormat || !btnMinify || !btnClear || !btnCopy
  ) {
    return;
  }

  function getIndentUnit() {
    var val = selectEl.value;
    if (val === "tab") { return "\t"; }
    if (val === "4") { return "    "; }
    return "  ";
  }

  function showError(err) {
    var msg = (err instanceof Error) ? err.message : String(err);
    errorEl.textContent = "Erro de sintaxe: " + msg; // textContent — sem risco de XSS
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function handleFormat() {
    clearError();
    var text = inputEl.value.trim();
    if (text === "") { outputEl.value = ""; return; }
    try {
      outputEl.value = formatXML(text, getIndentUnit());
    } catch (e) {
      outputEl.value = "";
      showError(e);
    }
  }

  function handleMinify() {
    clearError();
    var text = inputEl.value.trim();
    if (text === "") { outputEl.value = ""; return; }
    try {
      outputEl.value = minifyXML(text);
    } catch (e) {
      outputEl.value = "";
      showError(e);
    }
  }

  function handleClear() {
    inputEl.value = "";
    outputEl.value = "";
    clearError();
  }

  function handleCopy() {
    var text = outputEl.value;
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btnCopy, "Copiado!");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopy, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  btnFormat.addEventListener("click", handleFormat);
  btnMinify.addEventListener("click", handleMinify);
  btnClear.addEventListener("click", handleClear);
  btnCopy.addEventListener("click", handleCopy);
})();
