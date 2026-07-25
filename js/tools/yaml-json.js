// js/tools/yaml-json.js — conversor YAML <-> JSON com parser/serializer
// YAML SIMPLIFICADO escrito à mão (sem lib externa).
// Carregado APENAS em tools/yaml-json/index.html, após js/main.js.
// Anti-XSS: saída via .value / .textContent — nunca innerHTML.
//
// Recursos SUPORTADOS: mapas (chave: valor), listas (- item), aninhamento por
// indentação (espaços), escalares string/número/bool/null, aspas simples e
// duplas, comentários (#), forma compacta "- chave: valor", coleções vazias
// [] e {}. NÃO suportados: âncoras/alias (&, *), tags (!!), multi-documento,
// blocos literais/dobrados (| e >), fluxo inline não-vazio ([a,b] / {a: b}),
// chaves complexas. Tabs na indentação são rejeitados.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — parser YAML -> valor JS
  // ================================================================

  function stripComment(line) {
    var inS = false, inD = false;
    for (var j = 0; j < line.length; j++) {
      var c = line.charAt(j);
      if (c === "'" && !inD) { inS = !inS; }
      else if (c === '"' && !inS) { inD = !inD; }
      else if (c === "#" && !inS && !inD) {
        if (j === 0 || line.charAt(j - 1) === " " || line.charAt(j - 1) === "\t") {
          return line.slice(0, j).replace(/\s+$/, "");
        }
      }
    }
    return line.replace(/\s+$/, "");
  }

  function countIndent(line, lineNum) {
    var i = 0;
    while (i < line.length && line.charAt(i) === " ") { i++; }
    if (line.charAt(i) === "\t") {
      throw new Error("Linha " + lineNum + ": tabs não são permitidos na indentação YAML. Use espaços.");
    }
    return i;
  }

  function tokenize(text) {
    if (typeof text !== "string") { throw new Error("Entrada YAML inválida."); }
    var raw = text.split(/\r?\n/);
    var lines = [];
    for (var i = 0; i < raw.length; i++) {
      var stripped = stripComment(raw[i]);
      if (stripped.trim() === "") { continue; }
      var trimmedFull = stripped.trim();
      if (trimmedFull === "---" || trimmedFull === "...") { continue; }
      var indent = countIndent(stripped, i + 1);
      lines.push({ indent: indent, content: stripped.slice(indent), line: i + 1 });
    }
    return lines;
  }

  function unescapeDouble(s) {
    return s.replace(/\\(["\\/ntr])/g, function (m, ch) {
      if (ch === "n") { return "\n"; }
      if (ch === "t") { return "\t"; }
      if (ch === "r") { return "\r"; }
      return ch;
    });
  }

  function parseScalar(s) {
    s = s.trim();
    if (s === "" || s === "~" || s === "null" || s === "Null" || s === "NULL") { return null; }
    if (s === "true" || s === "True" || s === "TRUE") { return true; }
    if (s === "false" || s === "False" || s === "FALSE") { return false; }
    if (s === "[]") { return []; }
    if (s === "{}") { return {}; }
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
      return unescapeDouble(s.slice(1, -1));
    }
    if (s.length >= 2 && s.charAt(0) === "'" && s.charAt(s.length - 1) === "'") {
      return s.slice(1, -1).replace(/''/g, "'");
    }
    if (/^-?\d+$/.test(s)) { return parseInt(s, 10); }
    if (/^-?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?$/.test(s) && /[.eE]/.test(s)) {
      return parseFloat(s);
    }
    if ((s.charAt(0) === "[" && s.charAt(s.length - 1) === "]") ||
        (s.charAt(0) === "{" && s.charAt(s.length - 1) === "}")) {
      throw new Error("Coleções inline não-vazias ([a, b] / {a: b}) não são suportadas por este conversor simplificado. Use a forma em bloco (indentada).");
    }
    return s;
  }

  function parseKey(raw) {
    raw = raw.trim();
    if (raw.length >= 2 && raw.charAt(0) === '"' && raw.charAt(raw.length - 1) === '"') {
      return unescapeDouble(raw.slice(1, -1));
    }
    if (raw.length >= 2 && raw.charAt(0) === "'" && raw.charAt(raw.length - 1) === "'") {
      return raw.slice(1, -1).replace(/''/g, "'");
    }
    return raw;
  }

  function splitKeyValue(content, lineNum) {
    var inS = false, inD = false;
    for (var j = 0; j < content.length; j++) {
      var c = content.charAt(j);
      if (c === "'" && !inD) { inS = !inS; }
      else if (c === '"' && !inS) { inD = !inD; }
      else if (c === ":" && !inS && !inD) {
        if (j === content.length - 1 || content.charAt(j + 1) === " ") {
          return { key: parseKey(content.slice(0, j)), value: content.slice(j + 1).trim() };
        }
      }
    }
    throw new Error("Linha " + lineNum + ": esperado 'chave: valor'. Recebido: " + content);
  }

  function isKeyValue(content) {
    try { splitKeyValue(content, 0); return true; } catch (e) { return false; }
  }

  function isListItem(content) {
    return content.charAt(0) === "-" && (content.length === 1 || content.charAt(1) === " ");
  }

  function parseNodes(lines, i, indent) {
    if (isListItem(lines[i].content)) { return parseList(lines, i, indent); }
    return parseMap(lines, i, indent);
  }

  function parseMap(lines, i, indent) {
    var obj = {};
    while (i < lines.length) {
      var ln = lines[i];
      if (ln.indent < indent) { break; }
      if (ln.indent > indent) {
        throw new Error("Linha " + ln.line + ": indentação inesperada.");
      }
      var kv = splitKeyValue(ln.content, ln.line);
      if (kv.value === "") {
        if (i + 1 < lines.length && lines[i + 1].indent > indent) {
          var child = parseNodes(lines, i + 1, lines[i + 1].indent);
          obj[kv.key] = child.value;
          i = child.i;
        } else if (i + 1 < lines.length && lines[i + 1].indent === indent && isListItem(lines[i + 1].content)) {
          // lista com marcadores alinhados à chave (mesma indentação)
          var listChild = parseList(lines, i + 1, indent);
          obj[kv.key] = listChild.value;
          i = listChild.i;
        } else {
          obj[kv.key] = null;
          i++;
        }
      } else {
        obj[kv.key] = parseScalar(kv.value);
        i++;
      }
    }
    return { value: obj, i: i };
  }

  function parseList(lines, i, indent) {
    var arr = [];
    while (i < lines.length) {
      var ln = lines[i];
      if (ln.indent < indent) { break; }
      if (ln.indent > indent) {
        throw new Error("Linha " + ln.line + ": indentação inesperada em lista.");
      }
      if (!isListItem(ln.content)) { break; }
      var dashRest = ln.content.slice(1);
      var lead = dashRest.length - dashRest.replace(/^\s+/, "").length;
      var after = dashRest.replace(/^\s+/, "");
      if (after === "") {
        if (i + 1 < lines.length && lines[i + 1].indent > indent) {
          var child = parseNodes(lines, i + 1, lines[i + 1].indent);
          arr.push(child.value);
          i = child.i;
        } else {
          arr.push(null);
          i++;
        }
      } else if (isKeyValue(after)) {
        // forma compacta "- chave: valor" (mapa que começa na mesma linha do traço)
        var innerIndent = indent + 1 + lead;
        lines[i] = { indent: innerIndent, content: after, line: ln.line };
        var m = parseMap(lines, i, innerIndent);
        arr.push(m.value);
        i = m.i;
      } else {
        arr.push(parseScalar(after));
        i++;
      }
    }
    return { value: arr, i: i };
  }

  function parseYAML(text) {
    var lines = tokenize(text);
    if (lines.length === 0) { return null; }
    var baseIndent = lines[0].indent;
    var result = parseNodes(lines, 0, baseIndent);
    return result.value;
  }

  function yamlToJson(text) {
    return JSON.stringify(parseYAML(text), null, 2);
  }

  // ================================================================
  // NÚCLEO PURO — serializer valor JS -> YAML
  // ================================================================

  function repeat(str, n) { return n <= 0 ? "" : new Array(n + 1).join(str); }

  function isScalar(v) { return v === null || typeof v !== "object"; }

  function yamlQuote(s) {
    return '"' + s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")
      .replace(/\r/g, "\\r") + '"';
  }

  function needsQuote(s) {
    if (s === "") { return true; }
    if (/[:#\n\t\r"']/.test(s)) { return true; }
    if (/^\s|\s$/.test(s)) { return true; }
    if (/^[\[\]{}&*!|>%@`,?-]/.test(s)) { return true; }
    if (/^(true|false|null|~|True|False|Null|NULL|TRUE|FALSE|yes|no|Yes|No)$/.test(s)) { return true; }
    if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) { return true; }
    return false;
  }

  function scalarToYaml(v) {
    if (v === null || v === undefined) { return "null"; }
    if (typeof v === "boolean") { return v ? "true" : "false"; }
    if (typeof v === "number") { return String(v); }
    var s = String(v);
    return needsQuote(s) ? yamlQuote(s) : s;
  }

  function keyToYaml(k) {
    return needsQuote(k) ? yamlQuote(k) : k;
  }

  function serializeObject(obj, indent) {
    var pad = repeat("  ", indent);
    var keys = Object.keys(obj);
    if (keys.length === 0) { return [pad + "{}"]; }
    var lines = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = obj[k];
      var ks = keyToYaml(k);
      if (isScalar(v)) {
        lines.push(pad + ks + ": " + scalarToYaml(v));
      } else if (Array.isArray(v) && v.length === 0) {
        lines.push(pad + ks + ": []");
      } else if (!Array.isArray(v) && Object.keys(v).length === 0) {
        lines.push(pad + ks + ": {}");
      } else {
        lines.push(pad + ks + ":");
        lines = lines.concat(serialize(v, indent + 1));
      }
    }
    return lines;
  }

  function serialize(value, indent) {
    var pad = repeat("  ", indent);
    if (isScalar(value)) { return [pad + scalarToYaml(value)]; }
    if (Array.isArray(value)) {
      if (value.length === 0) { return [pad + "[]"]; }
      var lines = [];
      for (var i = 0; i < value.length; i++) {
        var item = value[i];
        if (isScalar(item)) {
          lines.push(pad + "- " + scalarToYaml(item));
        } else if (Array.isArray(item)) {
          if (item.length === 0) { lines.push(pad + "- []"); }
          else { lines.push(pad + "-"); lines = lines.concat(serialize(item, indent + 1)); }
        } else {
          var keys = Object.keys(item);
          if (keys.length === 0) { lines.push(pad + "- {}"); }
          else {
            var childLines = serializeObject(item, indent + 1);
            var firstPad = repeat("  ", indent + 1);
            childLines[0] = pad + "- " + childLines[0].slice(firstPad.length);
            lines = lines.concat(childLines);
          }
        }
      }
      return lines;
    }
    return serializeObject(value, indent);
  }

  function jsonValueToYaml(value) {
    if (value === undefined) { return "null\n"; }
    return serialize(value, 0).join("\n") + "\n";
  }

  function jsonToYaml(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("JSON inválido: " + e.message);
    }
    return jsonValueToYaml(data);
  }

  /**
   * Detecção automática: tenta JSON.parse; se for JSON válido, converte para
   * YAML. Caso contrário, trata como YAML e converte para JSON.
   */
  function autoConvert(text) {
    var trimmed = (text || "").trim();
    if (trimmed === "") { return { mode: "yaml2json", output: "null" }; }
    var isJson = false;
    try { JSON.parse(text); isJson = true; } catch (e) { isJson = false; }
    if (isJson) { return { mode: "json2yaml", output: jsonToYaml(text) }; }
    return { mode: "yaml2json", output: yamlToJson(text) };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseYAML: parseYAML,
      yamlToJson: yamlToJson,
      jsonValueToYaml: jsonValueToYaml,
      jsonToYaml: jsonToYaml,
      autoConvert: autoConvert
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var input = document.getElementById("yj-input");
  var output = document.getElementById("yj-output");
  var errorEl = document.getElementById("yj-error");
  var modeEls = document.getElementsByName("yj-mode");
  var btnConvert = document.getElementById("yj-convert");
  var btnClear = document.getElementById("yj-clear");
  var btnCopy = document.getElementById("yj-copy");
  var modeInfo = document.getElementById("yj-mode-info");

  if (!input || !output || !errorEl || !btnConvert || !btnClear || !btnCopy) { return; }

  function radioValue(nodeList, fallback) {
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].checked) { return nodeList[i].value; }
    }
    return fallback;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    output.value = "";
    if (modeInfo) { modeInfo.textContent = ""; }
  }

  function clearError() { errorEl.textContent = ""; errorEl.hidden = true; }

  function convert() {
    clearError();
    var mode = radioValue(modeEls, "auto");
    try {
      var result;
      if (mode === "yaml2json") { result = { mode: "yaml2json", output: yamlToJson(input.value) }; }
      else if (mode === "json2yaml") { result = { mode: "json2yaml", output: jsonToYaml(input.value) }; }
      else { result = autoConvert(input.value); }
      output.value = result.output;
      if (modeInfo) {
        modeInfo.textContent = result.mode === "json2yaml" ? "Detectado: JSON → YAML" : "Detectado: YAML → JSON";
      }
    } catch (e) {
      showError(e.message || "Não foi possível converter a entrada.");
    }
  }

  function copyOutput() {
    var text = output.value;
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { window.DevHelper.flashButton(btnCopy, "Copiado!"); })
        .catch(function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }

  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try { document.execCommand("copy"); window.DevHelper.flashButton(btnCopy, "Copiado!"); } catch (e) { /* silencia */ }
    document.body.removeChild(tmp);
  }

  btnConvert.addEventListener("click", convert);
  btnCopy.addEventListener("click", copyOutput);
  btnClear.addEventListener("click", function () {
    input.value = "";
    output.value = "";
    clearError();
    if (modeInfo) { modeInfo.textContent = ""; }
    input.focus();
  });
})();
