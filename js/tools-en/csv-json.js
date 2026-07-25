// js/tools-en/csv-json.js — logic for the CSV <-> JSON converter (English version).
// Loaded ONLY on en/tools/csv-json/index.html, after js/main.js.
// Mirrors js/tools/csv-json.js — same logic, only user-visible strings translated.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída via .value / .textContent — nunca innerHTML.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — parsing/serialização CSV e JSON
  // ================================================================

  /**
   * Parser CSV RFC 4180 básico: trata aspas duplas, escape de aspas ("")
   * e delimitadores/quebras de linha dentro de campos citados.
   * @param {string} text
   * @param {string} delimiter  "," ";" ou "\t"
   * @returns {string[][]} matriz de linhas x campos (todos string)
   */
  function parseCSV(text, delimiter) {
    delimiter = delimiter || ",";
    if (typeof text !== "string") {
      throw new Error("Invalid CSV input.");
    }
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;
    var n = text.length;
    while (i < n) {
      var ch = text.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === delimiter) { row.push(field); field = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += ch; i++;
    }
    if (inQuotes) {
      throw new Error("Malformed CSV: unclosed quotes (quoted field is missing a closing \").");
    }
    if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  /**
   * Converte CSV em estrutura JS.
   * @param {string} text
   * @param {{delimiter?:string, header?:boolean}} opts
   * @returns {Array} array de objetos (header=true) ou array de arrays.
   */
  function csvToStructure(text, opts) {
    opts = opts || {};
    var delimiter = opts.delimiter || ",";
    var header = opts.header !== false;
    var rows = parseCSV(text, delimiter);
    if (rows.length === 0) { return []; }
    if (!header) { return rows; }
    var headers = rows[0];
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = rows[r][c] !== undefined ? rows[r][c] : "";
      }
      out.push(obj);
    }
    return out;
  }

  function csvToJson(text, opts) {
    return JSON.stringify(csvToStructure(text, opts), null, 2);
  }

  function formatValue(v) {
    if (v === null || v === undefined) { return ""; }
    if (typeof v === "object") { return JSON.stringify(v); }
    return String(v);
  }

  function escapeField(s, delimiter) {
    if (
      s.indexOf('"') !== -1 || s.indexOf(delimiter) !== -1 ||
      s.indexOf("\n") !== -1 || s.indexOf("\r") !== -1
    ) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  /**
   * Converte estrutura JS (array de objetos OU array de arrays) em CSV.
   * @param {Array} data
   * @param {{delimiter?:string, header?:boolean}} opts
   * @returns {string}
   */
  function structureToCsv(data, opts) {
    opts = opts || {};
    var delimiter = opts.delimiter || ",";
    var header = opts.header !== false;
    if (!Array.isArray(data)) {
      throw new Error("The JSON needs to be an array (a list of objects or of arrays) to become CSV.");
    }
    if (data.length === 0) { return ""; }
    var lines = [];
    var i;
    if (Array.isArray(data[0])) {
      for (i = 0; i < data.length; i++) {
        if (!Array.isArray(data[i])) {
          throw new Error("Mixed array: if the first item is an array, all items must be arrays.");
        }
        lines.push(data[i].map(function (v) { return escapeField(formatValue(v), delimiter); }).join(delimiter));
      }
      return lines.join("\n");
    }
    // array de objetos — coleta a união das chaves preservando a ordem de aparição
    var keys = [];
    var seen = {};
    for (i = 0; i < data.length; i++) {
      var obj = data[i];
      if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        throw new Error("Mixed array: to generate a header, all items must be objects.");
      }
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k) && !seen[k]) { seen[k] = true; keys.push(k); }
      }
    }
    if (header) {
      lines.push(keys.map(function (k) { return escapeField(k, delimiter); }).join(delimiter));
    }
    for (i = 0; i < data.length; i++) {
      var rowObj = data[i];
      lines.push(keys.map(function (key) {
        return escapeField(formatValue(rowObj[key]), delimiter);
      }).join(delimiter));
    }
    return lines.join("\n");
  }

  function jsonToCsv(text, opts) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON: " + e.message);
    }
    return structureToCsv(data, opts);
  }

  /**
   * Detecção automática: entrada que começa com { ou [ é tratada como JSON
   * (saída CSV); caso contrário, tratada como CSV (saída JSON).
   * @returns {{mode:string, output:string}}
   */
  function autoConvert(text, opts) {
    var trimmed = (text || "").replace(/^\s+/, "");
    var first = trimmed.charAt(0);
    if (first === "{" || first === "[") {
      return { mode: "json2csv", output: jsonToCsv(text, opts) };
    }
    return { mode: "csv2json", output: csvToJson(text, opts) };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseCSV: parseCSV,
      csvToStructure: csvToStructure,
      csvToJson: csvToJson,
      structureToCsv: structureToCsv,
      jsonToCsv: jsonToCsv,
      autoConvert: autoConvert
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var input = document.getElementById("cj-input");
  var output = document.getElementById("cj-output");
  var errorEl = document.getElementById("cj-error");
  var modeEls = document.getElementsByName("cj-mode");
  var delimEl = document.getElementById("cj-delim");
  var headerEl = document.getElementById("cj-header");
  var btnConvert = document.getElementById("cj-convert");
  var btnClear = document.getElementById("cj-clear");
  var btnCopy = document.getElementById("cj-copy");
  var modeInfo = document.getElementById("cj-mode-info");

  if (!input || !output || !errorEl || !delimEl || !headerEl || !btnConvert || !btnClear || !btnCopy) {
    return;
  }

  function radioValue(nodeList, fallback) {
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].checked) { return nodeList[i].value; }
    }
    return fallback;
  }

  function currentDelimiter() {
    var v = delimEl.value;
    if (v === "tab") { return "\t"; }
    if (v === "semicolon") { return ";"; }
    return ",";
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    output.value = "";
    if (modeInfo) { modeInfo.textContent = ""; }
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function convert() {
    clearError();
    var opts = { delimiter: currentDelimiter(), header: headerEl.checked };
    var mode = radioValue(modeEls, "auto");
    try {
      var result;
      if (mode === "csv2json") {
        result = { mode: "csv2json", output: csvToJson(input.value, opts) };
      } else if (mode === "json2csv") {
        result = { mode: "json2csv", output: jsonToCsv(input.value, opts) };
      } else {
        result = autoConvert(input.value, opts);
      }
      output.value = result.output;
      if (modeInfo) {
        modeInfo.textContent = result.mode === "json2csv"
          ? "Detected: JSON → CSV"
          : "Detected: CSV → JSON";
      }
    } catch (e) {
      showError(e.message || "Could not convert the input.");
    }
  }

  function copyOutput() {
    var text = output.value;
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btnCopy, "Copied!");
      }).catch(function () { fallbackCopy(text); });
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
    try { document.execCommand("copy"); window.DevHelper.flashButton(btnCopy, "Copied!"); } catch (e) { /* silencia */ }
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
