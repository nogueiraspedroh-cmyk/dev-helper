// js/tools-en/salario-pj-clt.js — Salary Calculator: Contractor (PJ) vs Employee (CLT) (English version).
// Loaded ONLY on en/tools/salario-pj-clt/index.html, after js/main.js.
// Mirrors js/tools/salario-pj-clt.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .textContent/.value — never
//   innerHTML with user data (benefit names etc. via createElement).
//
// NOTICE:
//   The calculations are ESTIMATES/APPROXIMATIONS for comparison and learning
//   purposes. They use illustrative INSS/IRRF/Simples tables that may be
//   outdated and do NOT replace labor/accounting advice.
//
// Modeling (documented in the page's FAQ):
//   CLT   → monthly net = gross − INSS − IRRF; annual total sums the 13th
//           salary, 1/3 vacation bonus, FGTS (8% over 13 salaries) and benefits.
//   PJ    → monthly net = billing − taxes (editable rate) − fixed costs −
//           INSS on the pró-labore (11%, pró-labore = entered value or minimum
//           wage default); annual total = 12 × net + benefits
//           (no 13th salary/vacation/FGTS).

(function () {
  "use strict";

  // ─── Tax tables (ILLUSTRATIVE — update according to current legislation) ─────
  //
  // INSS — employee progressive table (2024 reference). Each bracket applies
  // only to the portion of the salary within it. Contribution capped at the ceiling.
  var INSS_FAIXAS = [
    { ate: 1412.00, aliquota: 0.075 },
    { ate: 2666.68, aliquota: 0.09 },
    { ate: 4000.03, aliquota: 0.12 },
    { ate: 7786.02, aliquota: 0.14 }
  ];
  var INSS_TETO_SALARIO = 7786.02;

  // National minimum wage (2024 reference) — same reference year as the other
  // tax tables (INSS/IRRF) in this file. Used as the default pró-labore for the
  // PJ owner when the field is left blank/invalid, since every owner must
  // declare a monthly pró-labore, and INSS is charged on it.
  var SALARIO_MINIMO = 1412.00;

  // IRRF — monthly table (2024 reference). base = gross − INSS (no dependents
  // in this estimate). tax = base × rate − deductible amount.
  var IRRF_FAIXAS = [
    { ate: 2259.20, aliquota: 0.0,   deduzir: 0.0 },
    { ate: 2826.65, aliquota: 0.075, deduzir: 169.44 },
    { ate: 3751.05, aliquota: 0.15,  deduzir: 381.44 },
    { ate: 4664.68, aliquota: 0.225, deduzir: 662.77 },
    { ate: Infinity, aliquota: 0.275, deduzir: 896.00 }
  ];

  // ─── Tax calculations ────────────────────────────────────────────────────────

  /**
   * Employee's progressive INSS over the contribution salary (capped at the ceiling).
   * @param {number} bruto gross monthly salary
   * @returns {number} INSS contribution
   */
  function calcularINSS(bruto) {
    var base = Math.min(bruto, INSS_TETO_SALARIO);
    var total = 0;
    var piso = 0;
    for (var i = 0; i < INSS_FAIXAS.length; i++) {
      var faixa = INSS_FAIXAS[i];
      if (base > piso) {
        var tributavel = Math.min(base, faixa.ate) - piso;
        if (tributavel > 0) {
          total += tributavel * faixa.aliquota;
        }
        piso = faixa.ate;
      } else {
        break;
      }
    }
    return total;
  }

  /**
   * INSS on the PJ owner's pró-labore (individual contributor).
   * APPROXIMATION: uses a fixed 11% rate (the most common simplified
   * contribution plan for pró-labore) instead of the employee's progressive
   * table — in practice, the effective rate may vary depending on the chosen
   * collection regime (11% or 20%, with or without the employer's CPP deduction).
   * Reuses the same contribution ceiling used in the CLT INSS calculation.
   * @param {number} proLabore monthly pró-labore value
   * @returns {number} INSS contribution on the pró-labore
   */
  function calcularINSSProLabore(proLabore) {
    var base = Math.min(proLabore, INSS_TETO_SALARIO);
    return base * 0.11;
  }

  /**
   * Monthly IRRF over the base (gross − INSS). Never negative.
   * @param {number} base calculation base
   * @returns {number} income tax withheld
   */
  function calcularIRRF(base) {
    for (var i = 0; i < IRRF_FAIXAS.length; i++) {
      var faixa = IRRF_FAIXAS[i];
      if (base <= faixa.ate) {
        var imposto = base * faixa.aliquota - faixa.deduzir;
        return imposto > 0 ? imposto : 0;
      }
    }
    return 0;
  }

  // ─── Formatting ──────────────────────────────────────────────────────────────

  /**
   * Formats a number as BRL currency (en-US locale), with fallback to toFixed.
   * @param {number} valor
   * @returns {string}
   */
  function formatBRL(valor) {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "BRL"
        }).format(valor);
      } catch (e) {
        // fallback below
      }
    }
    return "R$ " + valor.toFixed(2);
  }

  /**
   * Formats a percentage with 1 decimal place.
   */
  function formatPct(valor) {
    return valor.toFixed(1) + "%";
  }

  /**
   * Reads a numeric input from the DOM. Returns NaN if missing/empty/invalid.
   * type="number" provides a value with a decimal point — parseFloat directly.
   */
  function lerNumero(el) {
    if (!el) { return NaN; }
    var v = el.value.trim();
    if (v === "") { return NaN; }
    var n = parseFloat(v);
    return isNaN(n) ? NaN : n;
  }

  // ─── DOM references ──────────────────────────────────────────────────────────

  var radiosModo     = document.querySelectorAll("input[name=\"salario-modo\"]");
  var inputCltSalario = document.getElementById("clt-salario");
  var inputPjFaturamento = document.getElementById("pj-faturamento");
  var inputPjProLabore = document.getElementById("pj-pro-labore");
  var inputPjAliquota = document.getElementById("pj-aliquota");
  var inputPjCustos  = document.getElementById("pj-custos");
  var listaBeneficios = document.getElementById("salario-beneficios");
  var btnAddBeneficio = document.getElementById("btn-add-beneficio");
  var btnCalcular    = document.getElementById("btn-calcular-salario");
  var btnLimpar      = document.getElementById("btn-limpar-salario");
  var secResultado   = document.getElementById("salario-resultado");
  var corpoResultado = document.getElementById("salario-resultado-corpo");
  var erroEl         = document.getElementById("salario-erro");

  // Guard — silently stops if essential elements don't exist
  if (
    !inputCltSalario || !inputPjFaturamento || !inputPjAliquota ||
    !listaBeneficios || !btnAddBeneficio || !btnCalcular ||
    !secResultado || !corpoResultado || !erroEl
  ) {
    return;
  }

  // ─── Display mode ────────────────────────────────────────────────────────────

  /**
   * Returns the selected mode: "clt" | "pj" | "comparativo".
   */
  function modoSelecionado() {
    for (var i = 0; i < radiosModo.length; i++) {
      if (radiosModo[i].checked) { return radiosModo[i].value; }
    }
    return "comparativo";
  }

  // ─── Dynamic benefits ────────────────────────────────────────────────────────
  //
  // Each benefit has: name (text), monthly value (number) and applicability
  // ("ambos" | "clt" | "pj"). "ambos" (both) is added to both regimes' annual
  // total; "clt"/"pj" is added only to the corresponding regime. Created via
  // createElement (the user's name never goes to innerHTML).

  /**
   * Creates a benefit row and appends it to the list. Returns the created row.
   */
  function criarBeneficio() {
    var linha = document.createElement("div");
    linha.className = "salario-beneficio";

    var inputNome = document.createElement("input");
    inputNome.type = "text";
    inputNome.className = "tool__input-inline salario-beneficio__nome";
    inputNome.placeholder = "Benefit (e.g., Meal voucher)";
    inputNome.setAttribute("aria-label", "Benefit name");
    inputNome.spellcheck = false;

    var inputValor = document.createElement("input");
    inputValor.type = "number";
    inputValor.className = "tool__input-inline salario-beneficio__valor";
    inputValor.placeholder = "Value/month";
    inputValor.min = "0";
    inputValor.step = "any";
    inputValor.setAttribute("aria-label", "Monthly benefit value in reais");

    var selectAplic = document.createElement("select");
    selectAplic.className = "tool__select salario-beneficio__aplic";
    selectAplic.setAttribute("aria-label", "Which regimes the benefit applies to");
    var opcoes = [
      { value: "ambos", label: "Both" },
      { value: "clt", label: "CLT only" },
      { value: "pj", label: "PJ only" }
    ];
    for (var i = 0; i < opcoes.length; i++) {
      var opt = document.createElement("option");
      opt.value = opcoes[i].value;
      opt.textContent = opcoes[i].label;
      selectAplic.appendChild(opt);
    }

    var btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "salario-beneficio__remover";
    btnRemover.textContent = "Remove";
    btnRemover.setAttribute("aria-label", "Remove benefit");
    btnRemover.addEventListener("click", function () {
      if (listaBeneficios.contains(linha)) {
        listaBeneficios.removeChild(linha);
      }
    });

    linha.appendChild(inputNome);
    linha.appendChild(inputValor);
    linha.appendChild(selectAplic);
    linha.appendChild(btnRemover);
    listaBeneficios.appendChild(linha);

    return linha;
  }

  /**
   * Collects the filled-in benefits (with value > 0).
   * @returns {Array<{nome:string, valor:number, aplic:string}>}
   */
  function coletarBeneficios() {
    var itens = [];
    var linhas = listaBeneficios.querySelectorAll(".salario-beneficio");
    for (var i = 0; i < linhas.length; i++) {
      var nomeEl = linhas[i].querySelector(".salario-beneficio__nome");
      var valorEl = linhas[i].querySelector(".salario-beneficio__valor");
      var aplicEl = linhas[i].querySelector(".salario-beneficio__aplic");
      var valor = lerNumero(valorEl);
      if (!isNaN(valor) && valor > 0) {
        itens.push({
          nome: nomeEl ? nomeEl.value.trim() : "",
          valor: valor,
          aplic: aplicEl ? aplicEl.value : "ambos"
        });
      }
    }
    return itens;
  }

  /**
   * Annual sum of the benefits applicable to a regime ("clt" or "pj").
   * "ambos" (both) counts for the two.
   */
  function beneficiosAnuais(beneficios, regime) {
    var totalMensal = 0;
    for (var i = 0; i < beneficios.length; i++) {
      var b = beneficios[i];
      if (b.aplic === "ambos" || b.aplic === regime) {
        totalMensal += b.valor;
      }
    }
    return totalMensal * 12;
  }

  // ─── Regime calculations ──────────────────────────────────────────────────────

  /**
   * Calculates the CLT annual package from the gross monthly salary.
   * @returns {object} breakdown
   */
  function calcularCLT(salario, beneficiosAnual) {
    var inss = calcularINSS(salario);
    var baseIrrf = salario - inss;
    var irrf = calcularIRRF(baseIrrf);
    var liquidoMensal = salario - inss - irrf;

    // 13th salary: has its own INSS/IRRF over the same 1-salary amount,
    // resulting (absent other income) in the same net as a normal month.
    var decimoLiquido = liquidoMensal;

    // Constitutional 1/3 vacation bonus: a 1/3 salary bonus. Estimated by
    // applying the same net/gross ratio of the month (taxation approximation).
    var ratio = salario > 0 ? liquidoMensal / salario : 0;
    var tercoLiquido = (salario / 3) * ratio;

    // FGTS: 8% deposited by the employer over 13 salaries (12 + 13th). It is
    // the worker's money (not a deduction), included in the annual package.
    var fgtsAnual = salario * 0.08 * 13;

    var liquidoEmMaos = liquidoMensal * 12 + decimoLiquido + tercoLiquido;
    var totalAnual = liquidoEmMaos + fgtsAnual + beneficiosAnual;

    return {
      salarioBruto: salario,
      inss: inss,
      irrf: irrf,
      liquidoMensal: liquidoMensal,
      decimoLiquido: decimoLiquido,
      tercoLiquido: tercoLiquido,
      fgtsAnual: fgtsAnual,
      beneficiosAnual: beneficiosAnual,
      liquidoEmMaos: liquidoEmMaos,
      totalAnual: totalAnual
    };
  }

  /**
   * Calculates the PJ annual package.
   * @param {number} faturamento monthly billing (invoice)
   * @param {number} aliquotaPct tax rate on billing (%)
   * @param {number} custosMensal monthly fixed costs (accountant, coworking, etc.)
   * @param {number} beneficiosAnual annual sum of PJ-applicable benefits
   * @param {number} proLabore already resolved monthly pró-labore (entered
   *   value or minimum wage default — the decision is made by the caller)
   * @param {boolean} proLaboreDefault true if the value came from the default
   *   (minimum wage) because the user didn't enter one; false if it was typed
   * @returns {object} breakdown
   */
  function calcularPJ(faturamento, aliquotaPct, custosMensal, beneficiosAnual, proLabore, proLaboreDefault) {
    var impostoMensal = faturamento * (aliquotaPct / 100);
    var inssProLabore = calcularINSSProLabore(proLabore);
    var liquidoMensal = faturamento - impostoMensal - custosMensal - inssProLabore;
    var totalAnual = liquidoMensal * 12 + beneficiosAnual;

    return {
      faturamento: faturamento,
      aliquotaPct: aliquotaPct,
      impostoMensal: impostoMensal,
      custosMensal: custosMensal,
      proLabore: proLabore,
      proLaboreDefault: proLaboreDefault,
      inssProLabore: inssProLabore,
      liquidoMensal: liquidoMensal,
      beneficiosAnual: beneficiosAnual,
      totalAnual: totalAnual
    };
  }

  // ─── Result rendering (via createElement — anti-XSS) ─────────────────────────

  function criarLinha(label, valor, modificador) {
    var linha = document.createElement("div");
    linha.className = "salario-linha" + (modificador ? " " + modificador : "");

    var lab = document.createElement("span");
    lab.className = "salario-linha__label";
    lab.textContent = label;

    var val = document.createElement("span");
    val.className = "salario-linha__valor";
    val.textContent = valor;

    linha.appendChild(lab);
    linha.appendChild(val);
    return linha;
  }

  function criarColunaCLT(clt) {
    var coluna = document.createElement("div");
    coluna.className = "salario-coluna salario-coluna--clt";

    var titulo = document.createElement("h3");
    titulo.className = "salario-coluna__titulo";
    titulo.textContent = "CLT";
    coluna.appendChild(titulo);

    coluna.appendChild(criarLinha("Gross salary/month", formatBRL(clt.salarioBruto)));
    coluna.appendChild(criarLinha("(−) INSS/month", formatBRL(clt.inss)));
    coluna.appendChild(criarLinha("(−) IRRF/month", formatBRL(clt.irrf)));
    coluna.appendChild(criarLinha("Net/month", formatBRL(clt.liquidoMensal), "salario-linha--sub"));
    coluna.appendChild(criarLinha("13th salary (net)", formatBRL(clt.decimoLiquido)));
    coluna.appendChild(criarLinha("1/3 vacation bonus (net)", formatBRL(clt.tercoLiquido)));
    coluna.appendChild(criarLinha("FGTS/year (8%)", formatBRL(clt.fgtsAnual)));
    if (clt.beneficiosAnual > 0) {
      coluna.appendChild(criarLinha("Benefits/year", formatBRL(clt.beneficiosAnual)));
    }
    coluna.appendChild(criarLinha("Annual total", formatBRL(clt.totalAnual), "salario-linha--total"));
    coluna.appendChild(criarLinha("Average/month (annual÷12)", formatBRL(clt.totalAnual / 12), "salario-linha--sub"));

    return coluna;
  }

  function criarColunaPJ(pj) {
    var coluna = document.createElement("div");
    coluna.className = "salario-coluna salario-coluna--pj";

    var titulo = document.createElement("h3");
    titulo.className = "salario-coluna__titulo";
    titulo.textContent = "PJ";
    coluna.appendChild(titulo);

    coluna.appendChild(criarLinha("Billing/month", formatBRL(pj.faturamento)));
    var proLaboreTexto = formatBRL(pj.proLabore) + (pj.proLaboreDefault ? " (default: minimum wage)" : "");
    coluna.appendChild(criarLinha("Pró-labore considered", proLaboreTexto));
    coluna.appendChild(criarLinha("(−) INSS on pró-labore (11%)", formatBRL(pj.inssProLabore)));
    coluna.appendChild(criarLinha("(−) Taxes (" + formatPct(pj.aliquotaPct) + ")", formatBRL(pj.impostoMensal)));
    if (pj.custosMensal > 0) {
      coluna.appendChild(criarLinha("(−) Fixed costs/month", formatBRL(pj.custosMensal)));
    }
    coluna.appendChild(criarLinha("Net/month", formatBRL(pj.liquidoMensal), "salario-linha--sub"));
    if (pj.beneficiosAnual > 0) {
      coluna.appendChild(criarLinha("Benefits/year", formatBRL(pj.beneficiosAnual)));
    }
    coluna.appendChild(criarLinha("Annual total", formatBRL(pj.totalAnual), "salario-linha--total"));
    coluna.appendChild(criarLinha("Average/month (annual÷12)", formatBRL(pj.totalAnual / 12), "salario-linha--sub"));

    return coluna;
  }

  function criarDiff(clt, pj) {
    var diff = clt.totalAnual - pj.totalAnual;
    var caixa = document.createElement("div");
    caixa.className = "salario-diff";

    var texto = document.createElement("p");
    texto.className = "salario-diff__texto";

    if (Math.abs(diff) < 0.01) {
      texto.textContent = "Both regimes result in practically the same annual total.";
    } else {
      var maior = diff > 0 ? "CLT" : "PJ";
      var absoluto = Math.abs(diff);
      var maiorTotal = diff > 0 ? clt.totalAnual : pj.totalAnual;
      var menorTotal = diff > 0 ? pj.totalAnual : clt.totalAnual;
      var pct = menorTotal > 0 ? (absoluto / menorTotal) * 100 : 0;
      texto.textContent =
        maior + " pays " + formatBRL(absoluto) + " more per year" +
        (pct > 0 ? " (" + formatPct(pct) + ")" : "") +
        " — about " + formatBRL(absoluto / 12) + "/month of difference.";
    }

    caixa.appendChild(texto);
    return caixa;
  }

  /**
   * Renders the result in the body, according to the mode, clearing the previous one.
   */
  function renderizar(modo, clt, pj) {
    while (corpoResultado.firstChild) {
      corpoResultado.removeChild(corpoResultado.firstChild);
    }

    var colunas = document.createElement("div");
    colunas.className = "salario-colunas";
    if (modo === "comparativo") {
      colunas.className += " salario-colunas--duplo";
    }

    if (modo === "clt" || modo === "comparativo") {
      colunas.appendChild(criarColunaCLT(clt));
    }
    if (modo === "pj" || modo === "comparativo") {
      colunas.appendChild(criarColunaPJ(pj));
    }

    corpoResultado.appendChild(colunas);

    if (modo === "comparativo") {
      corpoResultado.appendChild(criarDiff(clt, pj));
    }
  }

  // ─── Errors ──────────────────────────────────────────────────────────────────

  function mostrarErro(msg) {
    erroEl.textContent = msg;
    erroEl.hidden = false;
    secResultado.hidden = true;
  }

  function ocultarErro() {
    erroEl.textContent = "";
    erroEl.hidden = true;
  }

  // ─── Main action ─────────────────────────────────────────────────────────────

  function calcular() {
    ocultarErro();
    var modo = modoSelecionado();
    var beneficios = coletarBeneficios();

    var precisaCLT = modo === "clt" || modo === "comparativo";
    var precisaPJ = modo === "pj" || modo === "comparativo";

    var clt = null;
    var pj = null;

    if (precisaCLT) {
      var salario = lerNumero(inputCltSalario);
      if (isNaN(salario) || salario <= 0) {
        mostrarErro("Enter a valid CLT gross salary (greater than zero).");
        return;
      }
      clt = calcularCLT(salario, beneficiosAnuais(beneficios, "clt"));
    }

    if (precisaPJ) {
      var faturamento = lerNumero(inputPjFaturamento);
      if (isNaN(faturamento) || faturamento <= 0) {
        mostrarErro("Enter a valid PJ billing amount (greater than zero).");
        return;
      }
      var aliquota = lerNumero(inputPjAliquota);
      if (isNaN(aliquota) || aliquota < 0 || aliquota > 100) {
        mostrarErro("Enter a PJ tax rate between 0 and 100%.");
        return;
      }
      var custos = lerNumero(inputPjCustos);
      if (isNaN(custos) || custos < 0) { custos = 0; }
      var proLabore = lerNumero(inputPjProLabore);
      var proLaboreDefault = false;
      if (isNaN(proLabore) || proLabore <= 0) {
        proLabore = SALARIO_MINIMO;
        proLaboreDefault = true;
      }
      pj = calcularPJ(faturamento, aliquota, custos, beneficiosAnuais(beneficios, "pj"), proLabore, proLaboreDefault);
    }

    renderizar(modo, clt, pj);
    secResultado.hidden = false;

    if (secResultado.scrollIntoView) {
      secResultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function limpar() {
    inputCltSalario.value = "";
    inputPjFaturamento.value = "";
    if (inputPjProLabore) { inputPjProLabore.value = ""; }
    inputPjAliquota.value = "6";
    if (inputPjCustos) { inputPjCustos.value = ""; }

    while (listaBeneficios.firstChild) {
      listaBeneficios.removeChild(listaBeneficios.firstChild);
    }
    criarBeneficio();

    ocultarErro();
    secResultado.hidden = true;
    while (corpoResultado.firstChild) {
      corpoResultado.removeChild(corpoResultado.firstChild);
    }
    inputCltSalario.focus();
  }

  // ─── Event registration ──────────────────────────────────────────────────────

  btnCalcular.addEventListener("click", calcular);
  btnAddBeneficio.addEventListener("click", function () {
    var linha = criarBeneficio();
    var nome = linha.querySelector(".salario-beneficio__nome");
    if (nome) { nome.focus(); }
  });
  if (btnLimpar) {
    btnLimpar.addEventListener("click", limpar);
  }

  // Enter in numeric fields triggers the calculation.
  function onEnter(e) {
    if (e.key === "Enter") { calcular(); }
  }
  inputCltSalario.addEventListener("keydown", onEnter);
  inputPjFaturamento.addEventListener("keydown", onEnter);
  if (inputPjProLabore) { inputPjProLabore.addEventListener("keydown", onEnter); }
  inputPjAliquota.addEventListener("keydown", onEnter);
  if (inputPjCustos) { inputPjCustos.addEventListener("keydown", onEnter); }

  // ─── Initialization ───────────────────────────────────────────────────────────

  criarBeneficio();

})();
