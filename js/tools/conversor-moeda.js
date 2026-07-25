// js/tools/conversor-moeda.js — Conversor de Moeda com taxas manuais/editáveis.
// Carregado APENAS em tools/conversor-moeda/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .textContent/.value — nunca innerHTML.
//
// AVISO:
//   As taxas padrão são ILUSTRATIVAS e não refletem cotações de mercado reais.
//   Esta ferramenta destina-se EXCLUSIVAMENTE a fins de estimativa, teste de
//   software e aprendizado. Não use os resultados para transações financeiras.
//
// Modelagem: abordagem de moeda-base única (USD = 1).
//   Para converter A → B: resultado = valor × (taxaB / taxaA)
//   Onde taxaX = quantas unidades de X equivalem a 1 USD.

(function () {
  "use strict";

  // ─── Dados das moedas ────────────────────────────────────────────────────────
  //
  // Cada entrada: { codigo, nome, taxaPadrao }
  //   taxaPadrao = quantas unidades desta moeda equivalem a 1 USD (taxa mid ilustrativa).
  //   USD tem taxa fixa = 1 (é a moeda-base).
  //
  // AVISO: estes valores são aproximações históricas grosseiras, usadas apenas
  // como ponto de partida ilustrativo. Atualize-os conforme sua necessidade.

  var MOEDAS_PADRAO = [
    { codigo: "BRL", nome: "Real Brasileiro",   taxaPadrao: 5.00  },
    { codigo: "USD", nome: "Dólar Americano",   taxaPadrao: 1.0   },
    { codigo: "EUR", nome: "Euro",              taxaPadrao: 0.92  },
    { codigo: "GBP", nome: "Libra Esterlina",   taxaPadrao: 0.79  },
    { codigo: "JPY", nome: "Iene Japonês",      taxaPadrao: 149.0 },
    { codigo: "ARS", nome: "Peso Argentino",    taxaPadrao: 900.0 },
    { codigo: "CAD", nome: "Dólar Canadense",   taxaPadrao: 1.36  },
    { codigo: "CHF", nome: "Franco Suíço",      taxaPadrao: 0.90  },
    { codigo: "CNY", nome: "Yuan Renminbi",     taxaPadrao: 7.24  },
    { codigo: "MXN", nome: "Peso Mexicano",     taxaPadrao: 17.15 }
  ];

  // ─── Estado da sessão ────────────────────────────────────────────────────────

  /**
   * Valores padrão usados exclusivamente por "Restaurar taxas padrão".
   * O cálculo NÃO lê deste objeto — lê sempre do input no DOM (lerTaxa).
   * Formato: { "BRL": 5.00, "USD": 1.0, ... }
   */
  var taxasAtivas = {};

  function inicializarTaxas() {
    taxasAtivas = {};
    for (var i = 0; i < MOEDAS_PADRAO.length; i++) {
      var m = MOEDAS_PADRAO[i];
      taxasAtivas[m.codigo] = m.taxaPadrao;
    }
  }

  /**
   * Lê a taxa de uma moeda diretamente do input do DOM, garantindo que o
   * cálculo sempre reflita o que está na tela — sem cache que pode divergir.
   *
   * USD é a moeda-base e retorna sempre 1 (input é readonly).
   * Para as demais, retorna o parseFloat do input correspondente.
   * Retorna NaN se o input não for encontrado, estiver vazio ou o valor
   * for <= 0, para que converter() possa exibir a mensagem de erro adequada.
   *
   * @param {string} codigo - código ISO da moeda (ex.: "BRL")
   * @returns {number} taxa válida > 0, ou NaN em caso de entrada inválida
   */
  function lerTaxa(codigo) {
    if (codigo === "USD") { return 1; }
    var inp = tabelaTaxas.querySelector("[data-moeda=\"" + codigo + "\"]");
    if (!inp) { return NaN; }
    var v = parseFloat(inp.value);
    if (isNaN(v) || v <= 0) { return NaN; }
    return v;
  }

  // ─── Referências ao DOM ─────────────────────────────────────────────────────

  var inputValor        = document.getElementById("moeda-valor");
  var selectOrigem      = document.getElementById("moeda-origem");
  var selectDestino     = document.getElementById("moeda-destino");
  var btnInverter       = document.getElementById("btn-inverter");
  var btnConverter      = document.getElementById("btn-converter");

  var divResultado      = document.getElementById("conversor-resultado");
  var outValorOriginal  = document.getElementById("out-valor-original");
  var outTaxa           = document.getElementById("out-taxa");
  var outResultado      = document.getElementById("out-resultado");
  var outAvisoTaxa      = document.getElementById("out-aviso-taxa");
  var btnCopiar         = document.getElementById("btn-copiar-resultado");

  var erroEl            = document.getElementById("conversor-erro");
  var tabelaTaxas       = document.getElementById("tabela-taxas");
  var btnRestaurar      = document.getElementById("btn-restaurar-taxas");

  // Guard — interrompe silenciosamente se elementos essenciais não existirem
  if (
    !inputValor || !selectOrigem || !selectDestino || !btnInverter ||
    !btnConverter || !divResultado || !outValorOriginal || !outTaxa ||
    !outResultado || !btnCopiar || !erroEl || !tabelaTaxas || !btnRestaurar
  ) {
    return;
  }

  // ─── Formatação numérica ─────────────────────────────────────────────────────

  /**
   * Formata um número com separadores pt-BR e número fixo de casas decimais.
   * Usa Intl.NumberFormat quando disponível, com fallback para toFixed.
   *
   * @param {number} valor
   * @param {number} casas - número de casas decimais
   * @returns {string}
   */
  function formatarNumero(valor, casas) {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      try {
        return new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: casas,
          maximumFractionDigits: casas
        }).format(valor);
      } catch (e) {
        // fallback abaixo
      }
    }
    return valor.toFixed(casas).replace(".", ",");
  }

  // ─── Construção dos selects ──────────────────────────────────────────────────

  /**
   * Popula os elementos <select> de origem e destino com as moedas disponíveis.
   * Seleciona BRL como origem padrão e USD como destino padrão.
   */
  function popularSelects() {
    // Limpa as opções existentes
    while (selectOrigem.firstChild) { selectOrigem.removeChild(selectOrigem.firstChild); }
    while (selectDestino.firstChild) { selectDestino.removeChild(selectDestino.firstChild); }

    for (var i = 0; i < MOEDAS_PADRAO.length; i++) {
      var m = MOEDAS_PADRAO[i];
      var label = m.codigo + " — " + m.nome;

      var optO = document.createElement("option");
      optO.value = m.codigo;
      optO.textContent = label;
      selectOrigem.appendChild(optO);

      var optD = document.createElement("option");
      optD.value = m.codigo;
      optD.textContent = label;
      selectDestino.appendChild(optD);
    }

    // Padrões: BRL → USD
    selectOrigem.value  = "BRL";
    selectDestino.value = "USD";
  }

  // ─── Construção da tabela de taxas editáveis ─────────────────────────────────

  /**
   * Renderiza a grade de inputs de taxa para cada moeda.
   * Reutiliza o padrão de layout .conta-resultado-grid + .cartao-campo.
   * Os inputs de taxa são atualizados via evento 'input'.
   * O USD (moeda-base) é exibido como readonly.
   */
  function renderizarTabelaTaxas() {
    // Remove filhos existentes de forma segura (anti-XSS: sem innerHTML)
    while (tabelaTaxas.firstChild) {
      tabelaTaxas.removeChild(tabelaTaxas.firstChild);
    }

    var grid = document.createElement("div");
    grid.className = "conta-resultado-grid conversor-taxa-grid";

    for (var i = 0; i < MOEDAS_PADRAO.length; i++) {
      var m = MOEDAS_PADRAO[i];
      var isBase = (m.codigo === "USD");

      var campo = document.createElement("div");
      campo.className = "cartao-campo";

      var labelEl = document.createElement("span");
      labelEl.className = "cartao-campo__label";
      labelEl.textContent = m.codigo + " — " + m.nome;
      campo.appendChild(labelEl);

      var input = document.createElement("input");
      input.type = "number";
      input.className = "tool__input-inline conversor-taxa-input";
      input.value = taxasAtivas[m.codigo];
      input.step = "any";
      input.min = "0.000001";
      // Identificador para leitura posterior
      input.setAttribute("data-moeda", m.codigo);

      if (isBase) {
        input.readOnly = true;
        input.title = "USD é a moeda-base (sempre 1,000000)";
        input.className += " conversor-taxa-input--base";
      }
      // Sem listener de 'input' gravando em taxasAtivas: converter() lê
      // sempre do DOM via lerTaxa(), eliminando divergência entre cache e tela.

      campo.appendChild(input);
      grid.appendChild(campo);
    }

    tabelaTaxas.appendChild(grid);
  }

  /**
   * Atualiza os valores exibidos nos inputs da tabela de taxas
   * (usado após restaurar os valores padrão).
   */
  function atualizarInputsTaxas() {
    var inputs = tabelaTaxas.querySelectorAll("[data-moeda]");
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var codigo = inp.getAttribute("data-moeda");
      if (codigo && taxasAtivas[codigo] !== undefined) {
        inp.value = taxasAtivas[codigo];
      }
    }
  }

  // ─── Lógica de conversão ─────────────────────────────────────────────────────

  /**
   * Realiza a conversão usando taxas ativas e atualiza o DOM de resultado.
   * Fórmula: resultado = valor × (taxaDestino / taxaOrigem)
   */
  function converter() {
    ocultarErro();

    var valorStr = inputValor.value.trim();
    var origem   = selectOrigem.value;
    var destino  = selectDestino.value;

    // Validação do valor
    if (valorStr === "" || valorStr === null) {
      mostrarErro("Informe um valor para converter.");
      esconderResultado();
      return;
    }

    var valor = parseFloat(valorStr);
    if (isNaN(valor)) {
      mostrarErro("Valor inválido — informe um número.");
      esconderResultado();
      return;
    }

    if (valor < 0) {
      mostrarErro("O valor deve ser maior ou igual a zero.");
      esconderResultado();
      return;
    }

    // Lê as taxas diretamente do DOM (fonte única de verdade — sem cache).
    // lerTaxa() retorna NaN se o input estiver vazio, zerado ou inválido,
    // garantindo que um campo apagado pelo usuário caia no caminho de erro
    // abaixo, em vez de usar um valor antigo em memória.
    var taxaOrigem  = lerTaxa(origem);
    var taxaDestino = lerTaxa(destino);

    if (isNaN(taxaOrigem) || taxaOrigem <= 0) {
      mostrarErro("Taxa inválida para " + origem + ". Corrija o valor na seção de taxas.");
      esconderResultado();
      return;
    }

    if (isNaN(taxaDestino) || taxaDestino <= 0) {
      mostrarErro("Taxa inválida para " + destino + ". Corrija o valor na seção de taxas.");
      esconderResultado();
      return;
    }

    // Cálculo: valor × (taxaDestino / taxaOrigem)
    var taxaCruzada = taxaDestino / taxaOrigem;
    var resultado   = valor * taxaCruzada;

    // Determinar casas decimais pelo valor do RESULTADO, não pela taxa destino.
    // Isso evita que resultados muito pequenos (ex.: 0,003) sejam exibidos
    // como 0,00 por usarem poucas casas baseadas numa taxa de magnitude alta.
    //   >= 100   → 2 casas  (ex.: 1500,00 BRL)
    //   < 0,01   → 6 casas  (ex.: 0,000830 BTC-like)
    //   demais   → 4 casas  (caso geral)
    var casasResultado = Math.abs(resultado) >= 100 ? 2 : (Math.abs(resultado) < 0.01 ? 6 : 4);

    // Preenche a saída — apenas via .textContent (anti-XSS)
    if (outValorOriginal) {
      outValorOriginal.textContent = formatarNumero(valor, 2) + " " + origem;
    }

    if (outTaxa) {
      outTaxa.textContent = "1 " + origem + " = " + formatarNumero(taxaCruzada, 6) + " " + destino;
    }

    if (outResultado) {
      outResultado.textContent = formatarNumero(resultado, casasResultado) + " " + destino;
    }

    if (outAvisoTaxa) {
      outAvisoTaxa.textContent =
        "Taxa ilustrativa. Fonte: tabela editável da ferramenta (1 USD = " +
        formatarNumero(taxaOrigem, 6) + " " + origem + " / 1 USD = " +
        formatarNumero(taxaDestino, 6) + " " + destino + "). Não use para transações reais.";
    }

    // Armazena para o botão Copiar
    ultimoResultadoTexto =
      formatarNumero(valor, 2) + " " + origem + " = " +
      formatarNumero(resultado, casasResultado) + " " + destino;

    exibirResultado();
  }

  // ─── Estado para o botão Copiar ──────────────────────────────────────────────

  var ultimoResultadoTexto = "";

  // ─── Helpers de UI ───────────────────────────────────────────────────────────

  function exibirResultado() {
    if (divResultado) { divResultado.hidden = false; }
  }

  function esconderResultado() {
    if (divResultado) { divResultado.hidden = true; }
  }

  function mostrarErro(msg) {
    if (!erroEl) { return; }
    erroEl.textContent = msg;
    erroEl.hidden = false;
  }

  function ocultarErro() {
    if (!erroEl) { return; }
    erroEl.textContent = "";
    erroEl.hidden = true;
  }

  /**
   * Copia texto para o clipboard com fallback para execCommand.
   */
  function copiarTexto(text, btn) {
    if (!text) { return; }
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
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia — usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleConverter() {
    converter();
  }

  function handleInverter() {
    var origem  = selectOrigem.value;
    var destino = selectDestino.value;
    selectOrigem.value  = destino;
    selectDestino.value = origem;
    // Recalcula se já havia um resultado exibido
    if (divResultado && !divResultado.hidden) {
      converter();
    }
  }

  function handleCopiar() {
    if (!ultimoResultadoTexto) { return; }
    copiarTexto(ultimoResultadoTexto, btnCopiar);
  }

  function handleRestaurarTaxas() {
    inicializarTaxas();
    atualizarInputsTaxas();
    // Recalcula se já havia resultado exibido
    if (divResultado && !divResultado.hidden) {
      converter();
    }
    window.DevHelper.flashButton(btnRestaurar, "Restaurado!");
  }

  // Permite converter pressionando Enter no campo de valor
  function onEnterConverter(e) {
    if (e.key === "Enter") { converter(); }
  }

  // ─── Inicialização ───────────────────────────────────────────────────────────

  inicializarTaxas();
  popularSelects();
  renderizarTabelaTaxas();

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnConverter.addEventListener("click",  handleConverter);
  btnInverter.addEventListener("click",   handleInverter);
  btnCopiar.addEventListener("click",     handleCopiar);
  btnRestaurar.addEventListener("click",  handleRestaurarTaxas);

  if (inputValor) {
    inputValor.addEventListener("keydown", onEnterConverter);
  }

  // Recalcula automaticamente ao mudar seleção de moedas (se valor já preenchido)
  function onMoedaChange() {
    if (inputValor && inputValor.value.trim() !== "") {
      converter();
    }
  }

  selectOrigem.addEventListener("change",  onMoedaChange);
  selectDestino.addEventListener("change", onMoedaChange);

  // Recalcula ao vivo quando o usuário edita qualquer taxa (delegação no
  // container, registrado uma única vez — não duplica ao restaurar padrões).
  // lerTaxa() já retorna NaN para taxa vazia/zerada, então editar para um
  // valor inválido cai corretamente no mostrarErro() dentro de converter().
  tabelaTaxas.addEventListener("input", function () {
    if (inputValor && inputValor.value.trim() !== "") {
      converter();
    }
  });

})();
