// js/tools-en/horas-trabalhadas.js — Worked Hours Calculator (English version).
// Loaded ONLY on en/tools/horas-trabalhadas/index.html, after js/main.js.
// Mirrors js/tools/horas-trabalhadas.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access checks if (el).
// Anti-XSS: output via .textContent — never innerHTML.
//
// Calculates lunch break time and total hours worked from 4
// times (clock in, lunch start, lunch end, clock out), compared
// against an expected work schedule (default 08:00). Supports overnight
// shifts (crossing midnight): when a time is chronologically "earlier"
// than the previous one in the sequence, adds 24h to it before calculating —
// the same technique already used by this project's time zone converter.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE
  // ================================================================

  var CARGA_PADRAO_MIN = 8 * 60; // 08:00

  /** Converts "HH:MM" to minutes since midnight, or null if invalid. */
  function parseHHMM(value) {
    if (typeof value !== "string") { return null; }
    var m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!m) { return null; }
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) { return null; }
    return h * 60 + min;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /** Formats minutes (>= 0) as "HH:MM". */
  function formatMinutos(totalMin) {
    var abs = Math.round(Math.abs(totalMin));
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    return pad2(h) + ":" + pad2(m);
  }

  /** Formats a balance (can be negative) as "+HH:MM" / "-HH:MM". */
  function formatSaldo(saldoMin) {
    var sign = saldoMin < 0 ? "-" : "+";
    return sign + formatMinutos(saldoMin);
  }

  /**
   * "Unwraps" a sequence of times (minutes 0-1439) assuming it is
   * chronologically increasing, allowing AT MOST one midnight
   * rollover: whenever a time is smaller than the previous one, adds 24h
   * (1440 min) to it (and to all following ones that also need it).
   * Returns { adjusted: number[], wrapCount: number }.
   */
  function unwrapSequence(rawMins) {
    var dayOffset = 0;
    var wrapCount = 0;
    var adjusted = [rawMins[0]];
    for (var i = 1; i < rawMins.length; i++) {
      if (rawMins[i] < rawMins[i - 1]) {
        dayOffset++;
        wrapCount++;
      }
      adjusted.push(rawMins[i] + dayOffset * 1440);
    }
    return { adjusted: adjusted, wrapCount: wrapCount };
  }

  /**
   * Calculates the lunch break time, the total worked and the balance
   * against the expected work schedule.
   *
   * @param {string} entrada "HH:MM" — clock in
   * @param {string} saidaAlmoco "HH:MM" — lunch start
   * @param {string} retornoAlmoco "HH:MM" — lunch end
   * @param {string} saida "HH:MM" — clock out
   * @param {string} [cargaEsperada] "HH:MM" — defaults to 08:00 if empty/omitted
   * @returns {{tempoAlmoco:(number|null), totalTrabalhado:(number|null), saldo:(number|null), erro:(string|null)}}
   *          All times in MINUTES (convert to "HH:MM" only when displaying).
   */
  function calcularHoras(entrada, saidaAlmoco, retornoAlmoco, saida, cargaEsperada) {
    var vazio = { tempoAlmoco: null, totalTrabalhado: null, saldo: null, erro: null };

    var entradaMin = parseHHMM(entrada);
    var saidaAlmocoMin = parseHHMM(saidaAlmoco);
    var retornoAlmocoMin = parseHHMM(retornoAlmoco);
    var saidaMin = parseHHMM(saida);

    if (entradaMin === null || saidaAlmocoMin === null || retornoAlmocoMin === null || saidaMin === null) {
      return {
        tempoAlmoco: null,
        totalTrabalhado: null,
        saldo: null,
        erro: "Fill in all four times (clock in, lunch start, lunch end and clock out) in HH:MM format.",
      };
    }

    var cargaMin = CARGA_PADRAO_MIN;
    if (cargaEsperada !== undefined && cargaEsperada !== null && String(cargaEsperada).trim() !== "") {
      var parsedCarga = parseHHMM(cargaEsperada);
      if (parsedCarga === null) {
        return {
          tempoAlmoco: null,
          totalTrabalhado: null,
          saldo: null,
          erro: "Invalid expected work schedule. Use the HH:MM format.",
        };
      }
      cargaMin = parsedCarga;
    }

    var unwrapped = unwrapSequence([entradaMin, saidaAlmocoMin, retornoAlmocoMin, saidaMin]);

    if (unwrapped.wrapCount > 1) {
      return {
        tempoAlmoco: null,
        totalTrabalhado: null,
        saldo: null,
        erro:
          "Times are out of order and don't correspond to a single shift that crosses midnight. " +
          "Check the sequence: clock in → lunch start → lunch end → clock out.",
      };
    }

    var adj = unwrapped.adjusted;
    var totalSpan = adj[3] - adj[0];
    if (totalSpan > 24 * 60) {
      return {
        tempoAlmoco: null,
        totalTrabalhado: null,
        saldo: null,
        erro: "The interval between clock in and clock out exceeds 24 hours — check the times entered.",
      };
    }

    var tempoAlmoco = adj[2] - adj[1]; // lunch end - lunch start
    var periodoManha = adj[1] - adj[0]; // lunch start - clock in
    var periodoTarde = adj[3] - adj[2]; // clock out - lunch end
    var totalTrabalhado = periodoManha + periodoTarde;
    var saldo = totalTrabalhado - cargaMin;

    return { tempoAlmoco: tempoAlmoco, totalTrabalhado: totalTrabalhado, saldo: saldo, erro: null };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseHHMM: parseHHMM,
      formatMinutos: formatMinutos,
      formatSaldo: formatSaldo,
      unwrapSequence: unwrapSequence,
      calcularHoras: calcularHoras,
      CARGA_PADRAO_MIN: CARGA_PADRAO_MIN,
    };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var entradaEl = document.getElementById("hs-entrada");
  var saidaAlmocoEl = document.getElementById("hs-saida-almoco");
  var retornoAlmocoEl = document.getElementById("hs-retorno-almoco");
  var saidaEl = document.getElementById("hs-saida");
  var cargaEl = document.getElementById("hs-carga");
  var errorEl = document.getElementById("hs-error");
  var resultEl = document.getElementById("hs-resultado");
  var outAlmocoEl = document.getElementById("hs-out-almoco");
  var outTotalEl = document.getElementById("hs-out-total");
  var outSaldoEl = document.getElementById("hs-out-saldo");
  var btnLimpar = document.getElementById("btn-limpar");

  if (
    !entradaEl || !saidaAlmocoEl || !retornoAlmocoEl || !saidaEl || !cargaEl ||
    !errorEl || !resultEl || !outAlmocoEl || !outTotalEl || !outSaldoEl
  ) {
    return;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    resultEl.hidden = true;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function calcular() {
    var entrada = entradaEl.value;
    var saidaAlmoco = saidaAlmocoEl.value;
    var retornoAlmoco = retornoAlmocoEl.value;
    var saida = saidaEl.value;
    var carga = cargaEl.value;

    // While the user hasn't yet filled in the 4 required fields,
    // shows neither an error nor a result — just waits.
    if (!entrada || !saidaAlmoco || !retornoAlmoco || !saida) {
      clearError();
      resultEl.hidden = true;
      return;
    }

    var resultado = calcularHoras(entrada, saidaAlmoco, retornoAlmoco, saida, carga);

    if (resultado.erro) {
      showError(resultado.erro);
      return;
    }

    clearError();
    outAlmocoEl.textContent = formatMinutos(resultado.tempoAlmoco);
    outTotalEl.textContent = formatMinutos(resultado.totalTrabalhado);
    outSaldoEl.textContent = formatSaldo(resultado.saldo);
    outSaldoEl.classList.remove("horas-saldo--positivo", "horas-saldo--negativo");
    outSaldoEl.classList.add(resultado.saldo < 0 ? "horas-saldo--negativo" : "horas-saldo--positivo");
    resultEl.hidden = false;
  }

  function limpar() {
    entradaEl.value = "";
    saidaAlmocoEl.value = "";
    retornoAlmocoEl.value = "";
    saidaEl.value = "";
    cargaEl.value = "08:00";
    clearError();
    resultEl.hidden = true;
  }

  entradaEl.addEventListener("input", calcular);
  saidaAlmocoEl.addEventListener("input", calcular);
  retornoAlmocoEl.addEventListener("input", calcular);
  saidaEl.addEventListener("input", calcular);
  cargaEl.addEventListener("input", calcular);
  if (btnLimpar) { btnLimpar.addEventListener("click", limpar); }

  // Initial state: calculates in case the fields already came filled (autofill).
  calcular();
})();
