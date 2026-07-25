// js/tools/timestamp.js — lógica do conversor Timestamp/Unix.
// Carregado APENAS em tools/timestamp/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída via .value / .textContent / createElement — nunca innerHTML.
//
// Converte nos dois sentidos: data legível -> timestamp Unix e
// timestamp Unix -> data legível, com opção de fuso (local vs UTC) e
// granularidade (segundos vs milissegundos).
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — conversões
  // ================================================================

  /**
   * Converte componentes de data em epoch (ms).
   * @param {number} y ano
   * @param {number} mo mês 1-12
   * @param {number} d dia
   * @param {number} h hora
   * @param {number} mi minuto
   * @param {number} s segundo
   * @param {boolean} asUTC  interpreta os componentes como UTC (true) ou como
   *                         horário local (false)
   * @returns {number} epoch em milissegundos (NaN se inválido)
   */
  function partsToEpochMs(y, mo, d, h, mi, s, asUTC) {
    if ([y, mo, d, h, mi, s].some(function (v) { return typeof v !== "number" || isNaN(v); })) {
      return NaN;
    }
    if (asUTC) {
      return Date.UTC(y, mo - 1, d, h, mi, s);
    }
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }

  /**
   * Faz o parse de um valor de <input type="datetime-local">
   * ("YYYY-MM-DDTHH:mm" ou "...:ss") em componentes.
   * @returns {{y,mo,d,h,mi,s}|null}
   */
  function parseDatetimeLocal(value) {
    if (typeof value !== "string") {
      return null;
    }
    var m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) {
      return null;
    }
    return {
      y: parseInt(m[1], 10),
      mo: parseInt(m[2], 10),
      d: parseInt(m[3], 10),
      h: parseInt(m[4], 10),
      mi: parseInt(m[5], 10),
      s: m[6] ? parseInt(m[6], 10) : 0
    };
  }

  /**
   * Converte um epoch (ms) para uma descrição textual em várias formas.
   * @returns {{valid:boolean, iso:string, utc:string, local:string, relative:string}}
   */
  function epochMsToDescription(epochMs, nowMs) {
    var date = new Date(epochMs);
    if (isNaN(date.getTime())) {
      return { valid: false, iso: "", utc: "", local: "", relative: "" };
    }
    return {
      valid: true,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: relativeFrom(epochMs, typeof nowMs === "number" ? nowMs : Date.now())
    };
  }

  /** Descrição relativa simples ("há 3 min", "em 2 dias"). */
  function relativeFrom(epochMs, nowMs) {
    var diff = epochMs - nowMs; // >0 futuro, <0 passado
    var abs = Math.abs(diff);
    var sec = Math.round(abs / 1000);
    var future = diff >= 0;
    var unit, value;
    if (sec < 60) { value = sec; unit = "segundo"; }
    else if (sec < 3600) { value = Math.round(sec / 60); unit = "minuto"; }
    else if (sec < 86400) { value = Math.round(sec / 3600); unit = "hora"; }
    else if (sec < 2592000) { value = Math.round(sec / 86400); unit = "dia"; }
    else if (sec < 31536000) { value = Math.round(sec / 2592000); unit = "mês"; }
    else { value = Math.round(sec / 31536000); unit = "ano"; }
    var plural = value === 1 ? "" : (unit === "mês" ? "es" : "s");
    if (value === 0) { return "agora mesmo"; }
    return future ? "em " + value + " " + unit + plural : "há " + value + " " + unit + plural;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      partsToEpochMs: partsToEpochMs,
      parseDatetimeLocal: parseDatetimeLocal,
      epochMsToDescription: epochMsToDescription,
      relativeFrom: relativeFrom
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  // --- Seção A: data legível -> timestamp ---
  var dateInput = document.getElementById("ts-date-input");
  var aOutput = document.getElementById("ts-a-output");
  var aCopy = document.getElementById("btn-ts-a-copy");
  var aError = document.getElementById("ts-a-error");
  var aTzEls = document.getElementsByName("ts-a-tz");
  var aGranEls = document.getElementsByName("ts-a-gran");

  // --- Seção B: timestamp -> data legível ---
  var tsInput = document.getElementById("ts-ts-input");
  var bError = document.getElementById("ts-b-error");
  var bGranEls = document.getElementsByName("ts-b-gran");
  var bLocal = document.getElementById("ts-b-local");
  var bUtc = document.getElementById("ts-b-utc");
  var bIso = document.getElementById("ts-b-iso");
  var bRel = document.getElementById("ts-b-rel");

  var btnNow = document.getElementById("btn-ts-now");

  if (
    !dateInput || !aOutput || !aCopy || !aError ||
    !tsInput || !bError || !bLocal || !bUtc || !bIso || !bRel || !btnNow
  ) {
    return;
  }

  function radioValue(nodeList, fallback) {
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].checked) {
        return nodeList[i].value;
      }
    }
    return fallback;
  }

  // --- Seção A ---
  function updateA() {
    aError.hidden = true;
    aError.textContent = "";
    var parts = parseDatetimeLocal(dateInput.value);
    if (!parts) {
      aOutput.value = "";
      if (dateInput.value !== "") {
        aError.textContent = "Data/hora inválida. Selecione uma data completa.";
        aError.hidden = false;
      }
      return;
    }
    var asUTC = radioValue(aTzEls, "local") === "utc";
    var epochMs = partsToEpochMs(parts.y, parts.mo, parts.d, parts.h, parts.mi, parts.s, asUTC);
    if (isNaN(epochMs)) {
      aOutput.value = "";
      aError.textContent = "Não foi possível converter a data informada.";
      aError.hidden = false;
      return;
    }
    var ms = radioValue(aGranEls, "sec") === "ms";
    aOutput.value = ms ? String(epochMs) : String(Math.floor(epochMs / 1000));
  }

  // --- Seção B ---
  function updateB() {
    bError.hidden = true;
    bError.textContent = "";
    var raw = tsInput.value.trim();
    if (raw === "") {
      bLocal.textContent = "";
      bUtc.textContent = "";
      bIso.textContent = "";
      bRel.textContent = "";
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      setBEmpty();
      bError.textContent = "Informe um número inteiro (o timestamp).";
      bError.hidden = false;
      return;
    }
    var num = parseInt(raw, 10);
    var ms = radioValue(bGranEls, "sec") === "ms";
    var epochMs = ms ? num : num * 1000;
    var desc = epochMsToDescription(epochMs);
    if (!desc.valid) {
      setBEmpty();
      bError.textContent = "Timestamp fora do intervalo representável.";
      bError.hidden = false;
      return;
    }
    bLocal.textContent = desc.local;
    bUtc.textContent = desc.utc;
    bIso.textContent = desc.iso;
    bRel.textContent = desc.relative;
  }

  function setBEmpty() {
    bLocal.textContent = "";
    bUtc.textContent = "";
    bIso.textContent = "";
    bRel.textContent = "";
  }

  // --- "Agora" ---
  function fillNow() {
    var now = new Date();
    // Preenche o datetime-local no fuso LOCAL (o input é sempre local).
    var pad = function (n) { return ("0" + n).slice(-2); };
    var localValue =
      now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
      "T" + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    dateInput.value = localValue;
    // Como o valor preenchido é local, ajusta o rádio da seção A para "local".
    for (var i = 0; i < aTzEls.length; i++) {
      aTzEls[i].checked = aTzEls[i].value === "local";
    }
    updateA();

    // Preenche a seção B com o timestamp de agora, respeitando a granularidade.
    var ms = radioValue(bGranEls, "sec") === "ms";
    tsInput.value = ms ? String(now.getTime()) : String(Math.floor(now.getTime() / 1000));
    updateB();
  }

  // --- Cópia com fallback ---
  function copyText(text, btn) {
    if (text === "") { return; }
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
      // silencia
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  dateInput.addEventListener("input", updateA);
  for (var i = 0; i < aTzEls.length; i++) { aTzEls[i].addEventListener("change", updateA); }
  for (var j = 0; j < aGranEls.length; j++) { aGranEls[j].addEventListener("change", updateA); }
  aCopy.addEventListener("click", function () { copyText(aOutput.value, aCopy); });

  tsInput.addEventListener("input", updateB);
  for (var k = 0; k < bGranEls.length; k++) { bGranEls[k].addEventListener("change", updateB); }

  btnNow.addEventListener("click", fillNow);

  // Estado inicial: mostra "agora" para dar contexto imediato.
  fillNow();
})();
