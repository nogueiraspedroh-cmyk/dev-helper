// js/tools/mock-data.js — gerador de dados fake/mock em JSON.
// Carregado APENAS em tools/mock-data/index.html, após js/main.js.
// Anti-XSS: saída via .value (textarea) — nunca innerHTML com dado gerado.
//
// Tudo gerado localmente (Math.random / crypto) — sem chamadas de rede.
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — geração de registros mock
  // ================================================================

  var FIRST_NAMES = [
    "Ana", "Bruno", "Carla", "Daniel", "Elisa", "Felipe", "Gabriela", "Hugo",
    "Isabela", "João", "Karina", "Lucas", "Marina", "Nathan", "Olívia", "Paulo",
    "Queila", "Rafael", "Sofia", "Thiago", "Úrsula", "Vitor", "Yara", "Zeca"
  ];
  var LAST_NAMES = [
    "Silva", "Souza", "Costa", "Santos", "Oliveira", "Pereira", "Lima", "Carvalho",
    "Almeida", "Ferreira", "Rodrigues", "Gomes", "Martins", "Araújo", "Barbosa", "Ribeiro"
  ];
  var LOREM_WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "labore", "magna", "aliqua",
    "enim", "minim", "veniam", "quis", "nostrud", "exercitation"
  ];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function makeUuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    // Fallback RFC-4122 v4 via getRandomValues, ou Math.random em último caso.
    var bytes = new Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      var buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      for (var i = 0; i < 16; i++) { bytes[i] = buf[i]; }
    } else {
      for (var j = 0; j < 16; j++) { bytes[j] = Math.floor(Math.random() * 256); }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = bytes.map(function (b) { return (b + 0x100).toString(16).slice(1); });
    return hex[0] + hex[1] + hex[2] + hex[3] + "-" + hex[4] + hex[5] + "-" +
           hex[6] + hex[7] + "-" + hex[8] + hex[9] + "-" +
           hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15];
  }

  function stripAccents(str) {
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function randomDateIso() {
    // Data aleatória entre 2000-01-01 e "hoje".
    var start = Date.UTC(2000, 0, 1);
    var end = Date.now();
    var t = start + Math.floor(Math.random() * (end - start));
    var d = new Date(t);
    var mm = ("0" + (d.getUTCMonth() + 1)).slice(-2);
    var dd = ("0" + d.getUTCDate()).slice(-2);
    return d.getUTCFullYear() + "-" + mm + "-" + dd;
  }

  function loremText(wordCount) {
    var out = [];
    for (var i = 0; i < wordCount; i++) { out.push(pick(LOREM_WORDS)); }
    var s = out.join(" ");
    return s.charAt(0).toUpperCase() + s.slice(1) + ".";
  }

  /**
   * Gera um array de registros mock.
   * @param {number} count  quantidade (1..1000)
   * @param {object} opts   { id, nome, email, uuid, data, boolean, texto,
   *                          inteiro:boolean, intMin, intMax }
   * @returns {Array<object>}
   */
  function generate(count, opts) {
    opts = opts || {};
    count = Math.max(0, Math.min(1000, Math.floor(Number(count) || 0)));
    var intMin = Number(opts.intMin);
    var intMax = Number(opts.intMax);
    if (isNaN(intMin)) { intMin = 0; }
    if (isNaN(intMax)) { intMax = 100; }
    if (intMax < intMin) { var tmp = intMin; intMin = intMax; intMax = tmp; }

    var rows = [];
    for (var i = 0; i < count; i++) {
      var first = pick(FIRST_NAMES);
      var last = pick(LAST_NAMES);
      var fullName = first + " " + last;
      var rec = {};
      if (opts.id) { rec.id = i + 1; }
      if (opts.uuid) { rec.uuid = makeUuid(); }
      if (opts.nome) { rec.nome = fullName; }
      if (opts.email) {
        rec.email = stripAccents((first + "." + last).toLowerCase()) + (i + 1) + "@example.com";
      }
      if (opts.inteiro) { rec.numero = randInt(intMin, intMax); }
      if (opts.boolean) { rec.ativo = Math.random() < 0.5; }
      if (opts.data) { rec.data = randomDateIso(); }
      if (opts.texto) { rec.texto = loremText(randInt(4, 10)); }
      rows.push(rec);
    }
    return rows;
  }

  /** Gera o JSON pretty-printed (indentação 2). */
  function generateJson(count, opts) {
    return JSON.stringify(generate(count, opts), null, 2);
  }

  var core = {
    generate: generate,
    generateJson: generateJson,
    makeUuid: makeUuid,
    FIRST_NAMES: FIRST_NAMES,
    LAST_NAMES: LAST_NAMES
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var elCount = document.getElementById("md-count");
  var elIntMin = document.getElementById("md-int-min");
  var elIntMax = document.getElementById("md-int-max");
  var elOutput = document.getElementById("md-output");
  var elError = document.getElementById("md-error");
  var btnGen = document.getElementById("md-generate");
  var btnCopy = document.getElementById("md-copy");
  var btnDownload = document.getElementById("md-download");

  if (!elOutput || !btnGen) { return; }

  var FIELD_IDS = ["id", "uuid", "nome", "email", "inteiro", "boolean", "data", "texto"];

  function readOpts() {
    var opts = {};
    for (var i = 0; i < FIELD_IDS.length; i++) {
      var cb = document.getElementById("md-f-" + FIELD_IDS[i]);
      opts[FIELD_IDS[i]] = !!(cb && cb.checked);
    }
    opts.intMin = elIntMin ? elIntMin.value : 0;
    opts.intMax = elIntMax ? elIntMax.value : 100;
    return opts;
  }

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

  btnGen.addEventListener("click", function () {
    clearError();
    var count = Math.floor(Number(elCount ? elCount.value : 0));
    if (!count || count < 1) { showError("Informe uma quantidade de 1 a 1000."); return; }
    if (count > 1000) { showError("Máximo de 1000 registros por geração."); return; }
    var opts = readOpts();
    var anyField = FIELD_IDS.some(function (k) { return opts[k]; });
    if (!anyField) { showError("Selecione ao menos um campo."); return; }
    elOutput.value = generateJson(count, opts);
  });


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

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var text = elOutput.value;
      if (text === "") { return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { window.DevHelper.flashButton(btnCopy, "Copiado!"); })
          .catch(function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", function () {
      var text = elOutput.value;
      if (text === "") { return; }
      var blob = new Blob([text], { type: "application/json;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "mock-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }
})();
