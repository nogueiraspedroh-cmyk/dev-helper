// js/tools-en/json-para-typescript.js — infers TypeScript interfaces from a JSON (English version).
// Loaded ONLY on en/tools/json-para-typescript/index.html, after js/main.js.
// Mirrors js/tools/json-para-typescript.js — same logic, only user-visible strings translated.
// Anti-XSS: saída via .value (textarea) — nunca innerHTML.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — inferência de tipos TS a partir de valor JS
  // ================================================================

  /** Converte uma chave qualquer para PascalCase seguro de identificador. */
  function pascalCase(str) {
    if (str === undefined || str === null) { str = ""; }
    var tokens = String(str)
      // separa fronteiras camelCase e não-alfanuméricos
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[^A-Za-z0-9]+/)
      .filter(function (t) { return t.length > 0; });
    var out = tokens.map(function (t) {
      return t.charAt(0).toUpperCase() + t.slice(1);
    }).join("");
    if (out === "" || /^[0-9]/.test(out)) { out = "Field" + out; }
    return out;
  }

  /** Nome de elemento singular a partir de uma chave de array (remove "s" final). */
  function singularName(keyHint) {
    var base = pascalCase(keyHint);
    if (/s$/.test(base) && base.length > 1) { base = base.slice(0, -1); }
    return base || "Item";
  }

  /** Verifica se a chave é um identificador JS válido (senão precisa de aspas). */
  function isValidIdentifier(key) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
  }

  /**
   * Gera as interfaces/tipos TypeScript para o valor já parseado.
   * @param {*} data  valor JS (resultado de JSON.parse)
   * @param {string} rootName  nome da interface/tipo raiz
   * @returns {string}
   */
  function generateFromValue(data, rootName) {
    var root = pascalCase(rootName || "Root") || "Root";
    var interfaces = [];      // strings de interface, na ordem de emissão
    var usedNames = {};
    var shapeRegistry = {};   // assinatura de forma -> nome (dedup de objetos iguais)

    function uniqueName(base) {
      base = base || "Object";
      var name = base;
      var i = 2;
      while (usedNames[name]) { name = base + i; i++; }
      usedNames[name] = true;
      return name;
    }

    function wrapArrayElement(elemType) {
      // Une parênteses quando é union, para virar (A | B)[].
      if (elemType.indexOf(" | ") !== -1) { return "(" + elemType + ")[]"; }
      return elemType + "[]";
    }

    function inferArray(arr, keyHint) {
      if (arr.length === 0) { return "unknown[]"; }
      var seen = {};
      var order = [];
      for (var i = 0; i < arr.length; i++) {
        var t = infer(arr[i], singularName(keyHint));
        if (!seen[t]) { seen[t] = true; order.push(t); }
      }
      if (order.length === 1) { return wrapArrayElement(order[0]); }
      return wrapArrayElement(order.join(" | "));
    }

    // Constrói os pares "chave: tipo" de um objeto (recursão já resolvida).
    function objectPairs(obj) {
      var keys = Object.keys(obj);
      var pairs = [];
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var t = infer(obj[key], key);
        var keyOut = isValidIdentifier(key) ? key : JSON.stringify(key);
        pairs.push(keyOut + ": " + t + ";");
      }
      return pairs;
    }

    function renderInterface(name, pairs) {
      var body = pairs.length ? "\n  " + pairs.join("\n  ") + "\n" : "";
      return "export interface " + name + " {" + body + "}";
    }

    function inferObject(obj, nameHint) {
      var pairs = objectPairs(obj);
      var sig = JSON.stringify(pairs);
      // Reaproveita interface de forma idêntica já emitida (evita duplicatas).
      if (shapeRegistry[sig]) { return shapeRegistry[sig]; }
      var name = uniqueName(pascalCase(nameHint) || "Object");
      interfaces.push(renderInterface(name, pairs));
      shapeRegistry[sig] = name;
      return name;
    }

    function infer(value, keyHint) {
      if (value === null) { return "null"; }
      if (Array.isArray(value)) { return inferArray(value, keyHint); }
      var ty = typeof value;
      if (ty === "string") { return "string"; }
      if (ty === "number") { return "number"; }
      if (ty === "boolean") { return "boolean"; }
      if (ty === "object") { return inferObject(value, keyHint); }
      return "any";
    }

    // Raiz array: reserva o nome da raiz ANTES de inferir os elementos, para
    // que a interface de elemento nunca colida com o type alias da raiz.
    if (Array.isArray(data)) {
      usedNames[root] = true;
      var elemType = inferArray(data, singularName(root));
      return interfaces.concat(["export type " + root + " = " + elemType + ";"]).join("\n\n");
    }
    // Raiz objeto: reserva o nome e emite a raiz primeiro, aninhadas depois.
    if (data !== null && typeof data === "object") {
      usedNames[root] = true;
      var rootPairs = objectPairs(data);
      var rootIface = renderInterface(root, rootPairs);
      return [rootIface].concat(interfaces).join("\n\n");
    }
    // Primitivo puro no topo.
    return "export type " + root + " = " + infer(data, root) + ";";
  }

  /**
   * Entrada: texto JSON. Faz o parse (lança em JSON inválido) e gera o TS.
   * @param {string} jsonText
   * @param {string} rootName
   * @returns {string}
   */
  function generate(jsonText, rootName) {
    var data = JSON.parse(jsonText);
    return generateFromValue(data, rootName);
  }

  var core = {
    pascalCase: pascalCase,
    singularName: singularName,
    generateFromValue: generateFromValue,
    generate: generate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var elInput = document.getElementById("jts-input");
  var elRoot = document.getElementById("jts-root");
  var elOutput = document.getElementById("jts-output");
  var elError = document.getElementById("jts-error");
  var btnGen = document.getElementById("jts-generate");
  var btnCopy = document.getElementById("jts-copy");
  var btnClear = document.getElementById("jts-clear");

  if (!elInput || !elOutput) { return; }

  function showError(msg) {
    if (!elError) { return; }
    elError.textContent = msg;
    elError.hidden = false;
  }
  function clearError() {
    if (!elError) { return; }
    elError.textContent = "";
    elError.hidden = true;
  }

  function run() {
    clearError();
    var text = elInput.value.trim();
    if (text === "") { elOutput.value = ""; return; }
    var rootName = elRoot ? elRoot.value.trim() : "Root";
    if (rootName === "") { rootName = "Root"; }
    try {
      elOutput.value = generate(text, rootName);
    } catch (e) {
      elOutput.value = "";
      showError("Invalid JSON: " + (e && e.message ? e.message : "could not parse it."));
    }
  }

  btnGen && btnGen.addEventListener("click", run);
  elInput.addEventListener("input", run);
  elRoot && elRoot.addEventListener("input", run);


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

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var text = elOutput.value;
      if (text === "") { return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { window.DevHelper.flashButton(btnCopy, "Copied!"); })
          .catch(function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      elInput.value = "";
      elOutput.value = "";
      clearError();
      elInput.focus();
    });
  }

  run();
})();
