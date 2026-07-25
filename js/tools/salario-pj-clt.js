// js/tools/salario-pj-clt.js — Calculadora de Salário PJ vs CLT.
// Carregado APENAS em tools/salario-pj-clt/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .textContent/.value — nunca
//   innerHTML com dados do usuário (nomes de benefícios etc. via createElement).
//
// AVISO:
//   Os cálculos são ESTIMATIVAS/APROXIMAÇÕES para fins de comparação e
//   aprendizado. Usam tabelas de INSS/IRRF/Simples ilustrativas que podem
//   estar desatualizadas e NÃO substituem consultoria trabalhista/contábil.
//
// Modelagem (documentada nas FAQ da página):
//   CLT   → líquido mensal = bruto − INSS − IRRF; total anual soma 13º, 1/3 de
//           férias, FGTS (8% sobre 13 salários) e benefícios.
//   PJ    → líquido mensal = faturamento − impostos (alíquota editável) − custos
//           fixos − INSS sobre pró-labore (11%, pró-labore = informado ou
//           salário mínimo padrão); total anual = 12 × líquido + benefícios
//           (sem 13º/férias/FGTS).

(function () {
  "use strict";

  // ─── Tabelas fiscais (ILUSTRATIVAS — atualize conforme a legislação) ─────────
  //
  // INSS — tabela progressiva do empregado (referência 2024). Cada faixa incide
  // apenas sobre a parcela do salário dentro dela. Contribuição limitada ao teto.
  var INSS_FAIXAS = [
    { ate: 1412.00, aliquota: 0.075 },
    { ate: 2666.68, aliquota: 0.09 },
    { ate: 4000.03, aliquota: 0.12 },
    { ate: 7786.02, aliquota: 0.14 }
  ];
  var INSS_TETO_SALARIO = 7786.02;

  // Salário mínimo nacional (referência 2024) — mesmo ano de referência das
  // demais tabelas fiscais deste arquivo (INSS/IRRF). Usado como pró-labore
  // padrão do sócio PJ quando o campo é deixado em branco/inválido, já que
  // todo sócio precisa declarar um pró-labore mensal e sobre ele incide INSS.
  var SALARIO_MINIMO = 1412.00;

  // IRRF — tabela mensal (referência 2024). base = bruto − INSS (sem dependentes
  // nesta estimativa). imposto = base × alíquota − parcela a deduzir.
  var IRRF_FAIXAS = [
    { ate: 2259.20, aliquota: 0.0,   deduzir: 0.0 },
    { ate: 2826.65, aliquota: 0.075, deduzir: 169.44 },
    { ate: 3751.05, aliquota: 0.15,  deduzir: 381.44 },
    { ate: 4664.68, aliquota: 0.225, deduzir: 662.77 },
    { ate: Infinity, aliquota: 0.275, deduzir: 896.00 }
  ];

  // ─── Cálculos fiscais ────────────────────────────────────────────────────────

  /**
   * INSS progressivo do empregado sobre o salário de contribuição (limitado ao teto).
   * @param {number} bruto salário bruto mensal
   * @returns {number} contribuição de INSS
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
   * INSS sobre o pró-labore do sócio PJ (contribuinte individual).
   * APROXIMAÇÃO: usa alíquota fixa de 11% (plano de contribuição simplificado
   * mais comum para pró-labore) em vez da tabela progressiva do empregado —
   * na prática, a alíquota efetiva pode variar conforme o regime de
   * recolhimento escolhido (11% ou 20%, com ou sem dedução da CPP da empresa).
   * Reaproveita o mesmo teto de contribuição usado no cálculo do INSS CLT.
   * @param {number} proLabore valor do pró-labore mensal
   * @returns {number} contribuição de INSS sobre o pró-labore
   */
  function calcularINSSProLabore(proLabore) {
    var base = Math.min(proLabore, INSS_TETO_SALARIO);
    return base * 0.11;
  }

  /**
   * IRRF mensal sobre a base (bruto − INSS). Nunca negativo.
   * @param {number} base base de cálculo
   * @returns {number} imposto de renda retido
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

  // ─── Formatação ──────────────────────────────────────────────────────────────

  /**
   * Formata número como moeda BRL pt-BR, com fallback para toFixed.
   * @param {number} valor
   * @returns {string}
   */
  function formatBRL(valor) {
    if (typeof Intl !== "undefined" && Intl.NumberFormat) {
      try {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(valor);
      } catch (e) {
        // fallback abaixo
      }
    }
    return "R$ " + valor.toFixed(2).replace(".", ",");
  }

  /**
   * Formata percentual pt-BR com 1 casa decimal.
   */
  function formatPct(valor) {
    return valor.toFixed(1).replace(".", ",") + "%";
  }

  /**
   * Lê um input numérico do DOM. Retorna NaN se ausente/vazio/inválido.
   * type="number" fornece valor com ponto decimal — parseFloat direto.
   */
  function lerNumero(el) {
    if (!el) { return NaN; }
    var v = el.value.trim();
    if (v === "") { return NaN; }
    var n = parseFloat(v);
    return isNaN(n) ? NaN : n;
  }

  // ─── Referências ao DOM ─────────────────────────────────────────────────────

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

  // Guard — interrompe silenciosamente se elementos essenciais não existirem
  if (
    !inputCltSalario || !inputPjFaturamento || !inputPjAliquota ||
    !listaBeneficios || !btnAddBeneficio || !btnCalcular ||
    !secResultado || !corpoResultado || !erroEl
  ) {
    return;
  }

  // ─── Modo de exibição ────────────────────────────────────────────────────────

  /**
   * Retorna o modo selecionado: "clt" | "pj" | "comparativo".
   */
  function modoSelecionado() {
    for (var i = 0; i < radiosModo.length; i++) {
      if (radiosModo[i].checked) { return radiosModo[i].value; }
    }
    return "comparativo";
  }

  // ─── Benefícios dinâmicos ────────────────────────────────────────────────────
  //
  // Cada benefício tem: nome (texto), valor mensal (número) e aplicabilidade
  // ("ambos" | "clt" | "pj"). "ambos" soma no total anual dos dois regimes;
  // "clt"/"pj" somam apenas no regime correspondente. Criados via createElement
  // (nome do usuário nunca vai a innerHTML).

  /**
   * Cria uma linha de benefício e a anexa à lista. Retorna a linha criada.
   */
  function criarBeneficio() {
    var linha = document.createElement("div");
    linha.className = "salario-beneficio";

    var inputNome = document.createElement("input");
    inputNome.type = "text";
    inputNome.className = "tool__input-inline salario-beneficio__nome";
    inputNome.placeholder = "Benefício (ex.: Vale-refeição)";
    inputNome.setAttribute("aria-label", "Nome do benefício");
    inputNome.spellcheck = false;

    var inputValor = document.createElement("input");
    inputValor.type = "number";
    inputValor.className = "tool__input-inline salario-beneficio__valor";
    inputValor.placeholder = "Valor/mês";
    inputValor.min = "0";
    inputValor.step = "any";
    inputValor.setAttribute("aria-label", "Valor mensal do benefício em reais");

    var selectAplic = document.createElement("select");
    selectAplic.className = "tool__select salario-beneficio__aplic";
    selectAplic.setAttribute("aria-label", "A quais regimes o benefício se aplica");
    var opcoes = [
      { value: "ambos", label: "Ambos" },
      { value: "clt", label: "Só CLT" },
      { value: "pj", label: "Só PJ" }
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
    btnRemover.textContent = "Remover";
    btnRemover.setAttribute("aria-label", "Remover benefício");
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
   * Coleta os benefícios preenchidos (com valor > 0).
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
   * Soma anual dos benefícios aplicáveis a um regime ("clt" ou "pj").
   * "ambos" conta para os dois.
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

  // ─── Cálculo dos regimes ─────────────────────────────────────────────────────

  /**
   * Calcula o pacote anual CLT a partir do salário bruto mensal.
   * @returns {object} detalhamento
   */
  function calcularCLT(salario, beneficiosAnual) {
    var inss = calcularINSS(salario);
    var baseIrrf = salario - inss;
    var irrf = calcularIRRF(baseIrrf);
    var liquidoMensal = salario - inss - irrf;

    // 13º salário: possui INSS/IRRF próprios sobre o mesmo valor de 1 salário,
    // resultando (sem outras rendas) no mesmo líquido de um mês normal.
    var decimoLiquido = liquidoMensal;

    // Terço constitucional de férias: adicional de 1/3 do salário. Estimado
    // aplicando a mesma razão líquido/bruto do mês (aproximação da tributação).
    var ratio = salario > 0 ? liquidoMensal / salario : 0;
    var tercoLiquido = (salario / 3) * ratio;

    // FGTS: 8% depositados pelo empregador sobre 13 salários (12 + 13º). É
    // dinheiro do trabalhador (não é desconto), incluído no pacote anual.
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
   * Calcula o pacote anual PJ.
   * @param {number} faturamento faturamento mensal (NF)
   * @param {number} aliquotaPct alíquota de impostos sobre o faturamento (%)
   * @param {number} custosMensal custos fixos mensais (contador, coworking etc.)
   * @param {number} beneficiosAnual soma anual dos benefícios aplicáveis ao PJ
   * @param {number} proLabore pró-labore mensal já resolvido (informado ou
   *   salário mínimo padrão — a decisão é do chamador)
   * @param {boolean} proLaboreDefault true se o valor veio do padrão (salário
   *   mínimo) por o operador não ter informado; false se foi digitado
   * @returns {object} detalhamento
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

  // ─── Renderização de resultado (via createElement — anti-XSS) ────────────────

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

    coluna.appendChild(criarLinha("Salário bruto/mês", formatBRL(clt.salarioBruto)));
    coluna.appendChild(criarLinha("(−) INSS/mês", formatBRL(clt.inss)));
    coluna.appendChild(criarLinha("(−) IRRF/mês", formatBRL(clt.irrf)));
    coluna.appendChild(criarLinha("Líquido/mês", formatBRL(clt.liquidoMensal), "salario-linha--sub"));
    coluna.appendChild(criarLinha("13º (líquido)", formatBRL(clt.decimoLiquido)));
    coluna.appendChild(criarLinha("1/3 de férias (líq.)", formatBRL(clt.tercoLiquido)));
    coluna.appendChild(criarLinha("FGTS/ano (8%)", formatBRL(clt.fgtsAnual)));
    if (clt.beneficiosAnual > 0) {
      coluna.appendChild(criarLinha("Benefícios/ano", formatBRL(clt.beneficiosAnual)));
    }
    coluna.appendChild(criarLinha("Total anual", formatBRL(clt.totalAnual), "salario-linha--total"));
    coluna.appendChild(criarLinha("Média/mês (anual÷12)", formatBRL(clt.totalAnual / 12), "salario-linha--sub"));

    return coluna;
  }

  function criarColunaPJ(pj) {
    var coluna = document.createElement("div");
    coluna.className = "salario-coluna salario-coluna--pj";

    var titulo = document.createElement("h3");
    titulo.className = "salario-coluna__titulo";
    titulo.textContent = "PJ";
    coluna.appendChild(titulo);

    coluna.appendChild(criarLinha("Faturamento/mês", formatBRL(pj.faturamento)));
    var proLaboreTexto = formatBRL(pj.proLabore) + (pj.proLaboreDefault ? " (padrão: salário mínimo)" : "");
    coluna.appendChild(criarLinha("Pró-labore considerado", proLaboreTexto));
    coluna.appendChild(criarLinha("(−) INSS s/ pró-labore (11%)", formatBRL(pj.inssProLabore)));
    coluna.appendChild(criarLinha("(−) Impostos (" + formatPct(pj.aliquotaPct) + ")", formatBRL(pj.impostoMensal)));
    if (pj.custosMensal > 0) {
      coluna.appendChild(criarLinha("(−) Custos fixos/mês", formatBRL(pj.custosMensal)));
    }
    coluna.appendChild(criarLinha("Líquido/mês", formatBRL(pj.liquidoMensal), "salario-linha--sub"));
    if (pj.beneficiosAnual > 0) {
      coluna.appendChild(criarLinha("Benefícios/ano", formatBRL(pj.beneficiosAnual)));
    }
    coluna.appendChild(criarLinha("Total anual", formatBRL(pj.totalAnual), "salario-linha--total"));
    coluna.appendChild(criarLinha("Média/mês (anual÷12)", formatBRL(pj.totalAnual / 12), "salario-linha--sub"));

    return coluna;
  }

  function criarDiff(clt, pj) {
    var diff = clt.totalAnual - pj.totalAnual;
    var caixa = document.createElement("div");
    caixa.className = "salario-diff";

    var texto = document.createElement("p");
    texto.className = "salario-diff__texto";

    if (Math.abs(diff) < 0.01) {
      texto.textContent = "Os dois regimes resultam praticamente no mesmo total anual.";
    } else {
      var maior = diff > 0 ? "CLT" : "PJ";
      var absoluto = Math.abs(diff);
      var maiorTotal = diff > 0 ? clt.totalAnual : pj.totalAnual;
      var menorTotal = diff > 0 ? pj.totalAnual : clt.totalAnual;
      var pct = menorTotal > 0 ? (absoluto / menorTotal) * 100 : 0;
      texto.textContent =
        maior + " rende " + formatBRL(absoluto) + " a mais por ano" +
        (pct > 0 ? " (" + formatPct(pct) + ")" : "") +
        " — cerca de " + formatBRL(absoluto / 12) + "/mês de diferença.";
    }

    caixa.appendChild(texto);
    return caixa;
  }

  /**
   * Renderiza o resultado no corpo, conforme o modo, limpando o anterior.
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

  // ─── Erros ───────────────────────────────────────────────────────────────────

  function mostrarErro(msg) {
    erroEl.textContent = msg;
    erroEl.hidden = false;
    secResultado.hidden = true;
  }

  function ocultarErro() {
    erroEl.textContent = "";
    erroEl.hidden = true;
  }

  // ─── Ação principal ────────────────────────────────────────────────────────────

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
        mostrarErro("Informe um salário bruto CLT válido (maior que zero).");
        return;
      }
      clt = calcularCLT(salario, beneficiosAnuais(beneficios, "clt"));
    }

    if (precisaPJ) {
      var faturamento = lerNumero(inputPjFaturamento);
      if (isNaN(faturamento) || faturamento <= 0) {
        mostrarErro("Informe um faturamento PJ válido (maior que zero).");
        return;
      }
      var aliquota = lerNumero(inputPjAliquota);
      if (isNaN(aliquota) || aliquota < 0 || aliquota > 100) {
        mostrarErro("Informe uma alíquota de impostos PJ entre 0 e 100%.");
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

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnCalcular.addEventListener("click", calcular);
  btnAddBeneficio.addEventListener("click", function () {
    var linha = criarBeneficio();
    var nome = linha.querySelector(".salario-beneficio__nome");
    if (nome) { nome.focus(); }
  });
  if (btnLimpar) {
    btnLimpar.addEventListener("click", limpar);
  }

  // Enter nos campos numéricos dispara o cálculo.
  function onEnter(e) {
    if (e.key === "Enter") { calcular(); }
  }
  inputCltSalario.addEventListener("keydown", onEnter);
  inputPjFaturamento.addEventListener("keydown", onEnter);
  if (inputPjProLabore) { inputPjProLabore.addEventListener("keydown", onEnter); }
  inputPjAliquota.addEventListener("keydown", onEnter);
  if (inputPjCustos) { inputPjCustos.addEventListener("keydown", onEnter); }

  // ─── Inicialização ───────────────────────────────────────────────────────────

  criarBeneficio();

})();
