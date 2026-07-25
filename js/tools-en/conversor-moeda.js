// js/tools-en/conversor-moeda.js — Currency Converter with manual/editable rates (English version).
// Loaded ONLY on en/tools/conversor-moeda/index.html, after js/main.js.
// Mirrors js/tools/conversor-moeda.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .textContent/.value — never innerHTML.
//
// NOTICE:
//   The default rates are ILLUSTRATIVE and do not reflect real market quotes.
//   This tool is intended EXCLUSIVELY for estimation, software testing and
//   learning purposes. Do not use the results for financial transactions.
//
// Modeling: single base-currency approach (USD = 1).
//   To convert A → B: result = value × (rateB / rateA)
//   Where rateX = how many units of X equal 1 USD.

(function () {
  "use strict";

  // ─── Currency data ────────────────────────────────────────────────────────────
  //
  // Each entry: { codigo, nome, taxaPadrao }
  //   taxaPadrao = how many units of this currency equal 1 USD (illustrative mid rate).
  //   USD has a fixed rate = 1 (it is the base currency).
  //
  // NOTICE: these values are rough historical approximations, used only as an
  // illustrative starting point. Update them as needed.

  var MOEDAS_PADRAO = [
    { codigo: "BRL", nome: "Brazilian Real",   taxaPadrao: 5.00  },
    { codigo: "USD", nome: "US Dollar",        taxaPadrao: 1.0   },
    { codigo: "EUR", nome: "Euro",             taxaPadrao: 0.92  },
    { codigo: "GBP", nome: "Pound Sterling",   taxaPadrao: 0.79  },
    { codigo: "JPY", nome: "Japanese Yen",     taxaPadrao: 149.0 },
    { codigo: "ARS", nome: "Argentine Peso",   taxaPadrao: 900.0 },
    { codigo: "CAD", nome: "Canadian Dollar",  taxaPadrao: 1.36  },
    { codigo: "CHF", nome: "Swiss Franc",      taxaPadrao: 0.90  },
    { codigo: "CNY", nome: "Renminbi Yuan",    taxaPadrao: 7.24  },
    { codigo: "MXN", nome: "Mexican Peso",     taxaPadrao: 17.15 }
  ];

  // ─── Session state ────────────────────────────────────────────────────────────

  /**
   * Default values used exclusively by "Restore default rates".
   * The calculation does NOT read from this object — it always reads from the
   * DOM input (lerTaxa).
   * Format: { "BRL": 5.00, "USD": 1.0, ... }
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
   * Reads a currency's rate directly from the DOM input, ensuring the
   * calculation always reflects what is on screen — no cache that can diverge.
   *
   * USD is the base currency and always returns 1 (the input is readonly).
   * For the others, returns the parseFloat of the corresponding input.
   * Returns NaN if the input is not found, is empty, or the value is <= 0,
   * so converter() can show the proper error message.
   *
   * @param {string} codigo - ISO currency code (e.g., "BRL")
   * @returns {number} valid rate > 0, or NaN on invalid input
   */
  function lerTaxa(codigo) {
    if (codigo === "USD") { return 1; }
    var inp = tabelaTaxas.querySelector("[data-moeda=\"" + codigo + "\"]");
    if (!inp) { return NaN; }
    var v = parseFloat(inp.value);
    if (isNaN(v) || v <= 0) { return NaN; }
    return v;
  }

  // ─── DOM references ─────────────────────────────────────────────────────────

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

  // Guard — silently stops if essential elements don't exist
  if (
    !inputValor || !selectOrigem || !selectDestino || !btnInverter ||
    !btnConverter || !divResultado || !outValorOriginal || !outTaxa ||
    !outResultado || !btnCopiar || !erroEl || !tabelaTaxas || !btnRestaurar
  ) {
    return;
  }

  // ─── Number formatting ────────────────────────────────────────────────────────

  /**
   * Formats a number with en-US separators and a fixed number of decimal places.
   * Uses Intl.NumberFormat when available, with a fallback to toFixed.
   *
   * @param {number} valor
   * @param {number} casas - number of decimal places
   * @returns {string}
   */
  function formatarNumero(valor, casas) {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      try {
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: casas,
          maximumFractionDigits: casas
        }).format(valor);
      } catch (e) {
        // fallback below
      }
    }
    return valor.toFixed(casas);
  }

  // ─── Select construction ──────────────────────────────────────────────────────

  /**
   * Populates the origin and destination <select> elements with the available currencies.
   * Selects BRL as the default origin and USD as the default destination.
   */
  function popularSelects() {
    // Clears the existing options
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

    // Defaults: BRL → USD
    selectOrigem.value  = "BRL";
    selectDestino.value = "USD";
  }

  // ─── Editable rates table construction ────────────────────────────────────────

  /**
   * Renders the rate input grid for each currency.
   * Reuses the .conta-resultado-grid + .cartao-campo layout pattern.
   * The rate inputs are updated via the 'input' event.
   * USD (base currency) is shown as readonly.
   */
  function renderizarTabelaTaxas() {
    // Safely removes existing children (anti-XSS: no innerHTML)
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
      // Identifier for later reading
      input.setAttribute("data-moeda", m.codigo);

      if (isBase) {
        input.readOnly = true;
        input.title = "USD is the base currency (always 1.000000)";
        input.className += " conversor-taxa-input--base";
      }
      // No 'input' listener writing into taxasAtivas: converter() always reads
      // from the DOM via lerTaxa(), eliminating divergence between cache and screen.

      campo.appendChild(input);
      grid.appendChild(campo);
    }

    tabelaTaxas.appendChild(grid);
  }

  /**
   * Updates the displayed values in the rate table inputs
   * (used after restoring the default values).
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

  // ─── Conversion logic ────────────────────────────────────────────────────────

  /**
   * Performs the conversion using the active rates and updates the result DOM.
   * Formula: result = value × (destRate / originRate)
   */
  function converter() {
    ocultarErro();

    var valorStr = inputValor.value.trim();
    var origem   = selectOrigem.value;
    var destino  = selectDestino.value;

    // Value validation
    if (valorStr === "" || valorStr === null) {
      mostrarErro("Enter a value to convert.");
      esconderResultado();
      return;
    }

    var valor = parseFloat(valorStr);
    if (isNaN(valor)) {
      mostrarErro("Invalid value — enter a number.");
      esconderResultado();
      return;
    }

    if (valor < 0) {
      mostrarErro("The value must be greater than or equal to zero.");
      esconderResultado();
      return;
    }

    // Reads the rates directly from the DOM (single source of truth — no cache).
    // lerTaxa() returns NaN if the input is empty, zeroed or invalid, ensuring
    // that a field cleared by the user falls into the error path below,
    // instead of using a stale value from memory.
    var taxaOrigem  = lerTaxa(origem);
    var taxaDestino = lerTaxa(destino);

    if (isNaN(taxaOrigem) || taxaOrigem <= 0) {
      mostrarErro("Invalid rate for " + origem + ". Fix the value in the rates section.");
      esconderResultado();
      return;
    }

    if (isNaN(taxaDestino) || taxaDestino <= 0) {
      mostrarErro("Invalid rate for " + destino + ". Fix the value in the rates section.");
      esconderResultado();
      return;
    }

    // Calculation: value × (destRate / originRate)
    var taxaCruzada = taxaDestino / taxaOrigem;
    var resultado   = valor * taxaCruzada;

    // Determine decimal places based on the RESULT's value, not the destination rate.
    // This avoids very small results (e.g., 0.003) being shown as 0.00 due to
    // using few decimal places based on a high-magnitude rate.
    //   >= 100   → 2 places (e.g., 1500.00 BRL)
    //   < 0.01   → 6 places (e.g., 0.000830 BTC-like)
    //   others   → 4 places (general case)
    var casasResultado = Math.abs(resultado) >= 100 ? 2 : (Math.abs(resultado) < 0.01 ? 6 : 4);

    // Fills the output — only via .textContent (anti-XSS)
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
        "Illustrative rate. Source: the tool's editable table (1 USD = " +
        formatarNumero(taxaOrigem, 6) + " " + origem + " / 1 USD = " +
        formatarNumero(taxaDestino, 6) + " " + destino + "). Do not use for real transactions.";
    }

    // Stores for the Copy button
    ultimoResultadoTexto =
      formatarNumero(valor, 2) + " " + origem + " = " +
      formatarNumero(resultado, casasResultado) + " " + destino;

    exibirResultado();
  }

  // ─── State for the Copy button ────────────────────────────────────────────────

  var ultimoResultadoTexto = "";

  // ─── UI helpers ───────────────────────────────────────────────────────────────

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
   * Copies text to the clipboard with fallback to execCommand.
   */
  function copiarTexto(text, btn) {
    if (!text) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copied!");
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
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silence — user can copy manually
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
    // Recalculates if a result was already being shown
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
    // Recalculates if a result was already being shown
    if (divResultado && !divResultado.hidden) {
      converter();
    }
    window.DevHelper.flashButton(btnRestaurar, "Restored!");
  }

  // Allow converting by pressing Enter in the value field
  function onEnterConverter(e) {
    if (e.key === "Enter") { converter(); }
  }

  // ─── Initialization ───────────────────────────────────────────────────────────

  inicializarTaxas();
  popularSelects();
  renderizarTabelaTaxas();

  // ─── Event registration ──────────────────────────────────────────────────────

  btnConverter.addEventListener("click",  handleConverter);
  btnInverter.addEventListener("click",   handleInverter);
  btnCopiar.addEventListener("click",     handleCopiar);
  btnRestaurar.addEventListener("click",  handleRestaurarTaxas);

  if (inputValor) {
    inputValor.addEventListener("keydown", onEnterConverter);
  }

  // Automatically recalculates when the currency selection changes (if a value is already filled)
  function onMoedaChange() {
    if (inputValor && inputValor.value.trim() !== "") {
      converter();
    }
  }

  selectOrigem.addEventListener("change",  onMoedaChange);
  selectDestino.addEventListener("change", onMoedaChange);

  // Recalculates live when the user edits any rate (delegated on the
  // container, registered once — does not duplicate when restoring defaults).
  // lerTaxa() already returns NaN for an empty/zeroed rate, so editing to an
  // invalid value correctly falls into mostrarErro() inside converter().
  tabelaTaxas.addEventListener("input", function () {
    if (inputValor && inputValor.value.trim() !== "") {
      converter();
    }
  });

})();
