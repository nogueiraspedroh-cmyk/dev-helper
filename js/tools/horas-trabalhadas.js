// js/tools/horas-trabalhadas.js — Calculadora de Horas Trabalhadas.
// Carregado APENAS em tools/horas-trabalhadas/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM checa if (el).
// Anti-XSS: saída via .textContent — nunca innerHTML.
//
// Calcula tempo de almoço e total de horas trabalhadas a partir de 4
// horários (entrada, saída para almoço, retorno do almoço, saída), com
// comparação a uma carga horária esperada (padrão 08:00). Suporta turno
// noturno (que cruza a meia-noite): quando um horário é cronologicamente
// "menor" que o anterior na sequência, soma 24h a ele antes de calcular —
// mesma técnica já usada pelo conversor de fuso horário deste projeto.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO
  // ================================================================

  var CARGA_PADRAO_MIN = 8 * 60; // 08:00

  /** Converte "HH:MM" em minutos desde a meia-noite, ou null se inválido. */
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

  /** Formata minutos (>= 0) como "HH:MM". */
  function formatMinutos(totalMin) {
    var abs = Math.round(Math.abs(totalMin));
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    return pad2(h) + ":" + pad2(m);
  }

  /** Formata um saldo (pode ser negativo) como "+HH:MM" / "-HH:MM". */
  function formatSaldo(saldoMin) {
    var sign = saldoMin < 0 ? "-" : "+";
    return sign + formatMinutos(saldoMin);
  }

  /**
   * "Desenrola" uma sequência de horários (minutos 0-1439) assumindo que ela
   * é cronologicamente crescente, permitindo NO MÁXIMO uma virada de
   * meia-noite: sempre que um horário é menor que o anterior, soma 24h
   * (1440 min) a ele (e a todos os seguintes que também precisarem).
   * Retorna { adjusted: number[], wrapCount: number }.
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
   * Calcula o tempo de almoço, o total trabalhado e o saldo em relação à
   * carga horária esperada.
   *
   * @param {string} entrada "HH:MM"
   * @param {string} saidaAlmoco "HH:MM"
   * @param {string} retornoAlmoco "HH:MM"
   * @param {string} saida "HH:MM"
   * @param {string} [cargaEsperada] "HH:MM" — padrão 08:00 se vazio/omitido
   * @returns {{tempoAlmoco:(number|null), totalTrabalhado:(number|null), saldo:(number|null), erro:(string|null)}}
   *          Todos os tempos em MINUTOS (converta para "HH:MM" só ao exibir).
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
        erro: "Preencha os quatro horários (entrada, saída para almoço, retorno do almoço e saída) no formato HH:MM.",
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
          erro: "Carga horária esperada inválida. Use o formato HH:MM.",
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
          "Horários fora de ordem e que não correspondem a um único turno que cruza a meia-noite. " +
          "Confira a sequência: entrada → saída para almoço → retorno do almoço → saída.",
      };
    }

    var adj = unwrapped.adjusted;
    var totalSpan = adj[3] - adj[0];
    if (totalSpan > 24 * 60) {
      return {
        tempoAlmoco: null,
        totalTrabalhado: null,
        saldo: null,
        erro: "O intervalo entre entrada e saída ultrapassa 24 horas — confira os horários informados.",
      };
    }

    var tempoAlmoco = adj[2] - adj[1]; // retorno - saída para almoço
    var periodoManha = adj[1] - adj[0]; // saída para almoço - entrada
    var periodoTarde = adj[3] - adj[2]; // saída - retorno do almoço
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
  // FIAÇÃO DE DOM — apenas no navegador
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

    // Enquanto o usuário ainda não preencheu os 4 campos obrigatórios,
    // não mostra erro nem resultado — apenas aguarda.
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

  // Estado inicial: calcula caso os campos já venham preenchidos (autofill).
  calcular();
})();
