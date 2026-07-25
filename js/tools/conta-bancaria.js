// js/tools/conta-bancaria.js — Gerador e Validador de Conta Bancária.
// Carregado APENAS em tools/conta-bancaria/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .textContent/.value — nunca innerHTML.
//
// AVISO DE COMPLIANCE:
//   Os dados gerados (agência, conta, operação) são FICTÍCIOS e destinados
//   EXCLUSIVAMENTE a testes de software. Não correspondem a contas reais em
//   nenhuma instituição financeira.
//
// AVISO SOBRE AS REGRAS DE DV:
//   Os dígitos verificadores são calculados pelo algoritmo de módulo 11
//   publicamente documentado para cada banco. Esta implementação pode diferir
//   da regra interna/oficial de cada instituição — não há vetor de teste
//   oficial público disponível. Suposições estão documentadas nos comentários
//   de cada banco.

(function () {
  "use strict";

  // ─── Utilitários ─────────────────────────────────────────────────────────────

  /** Retorna um inteiro aleatório em [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Retorna um dígito aleatório não-zero (1–9). */
  function randDigitNZ() {
    return randInt(1, 10);
  }

  /** Retorna um dígito aleatório (0–9). */
  function randDigit() {
    return randInt(0, 10);
  }

  /**
   * Gera uma string de dígitos aleatória com o comprimento especificado.
   * O primeiro dígito é sempre não-zero (evita contas que começam com 0).
   *
   * @param {number} len - comprimento desejado
   * @returns {string}
   */
  function randDigits(len) {
    if (len <= 0) { return ""; }
    var s = String(randDigitNZ());
    for (var i = 1; i < len; i++) {
      s += String(randDigit());
    }
    return s;
  }

  /**
   * Aplica pesos do módulo 11 sobre um array de dígitos (da esquerda para a
   * direita), percorrendo-os de trás para frente com pesos começando em 2
   * e ciclando de acordo com o array de pesos fornecido.
   *
   * Regra padrão (módulo 11):
   *   soma = Σ (dígito[i] * peso[i])
   *   resto = soma % 11
   *   DV = 11 - resto
   *
   * O tratamento de DV == 10 e DV == 11 varia por banco — o chamador decide.
   *
   * @param {string} digits - string de dígitos sobre os quais calcular
   * @param {number[]} pesos - array de pesos, aplicado da direita para a esquerda,
   *                           ciclando se houver mais dígitos que pesos.
   * @returns {number} resultado de 11 - (soma % 11), podendo ser 1..11.
   */
  function calcMod11(digits, pesos) {
    var soma = 0;
    var pi = 0; // índice no array de pesos
    // Percorre da direita para a esquerda
    for (var i = digits.length - 1; i >= 0; i--) {
      soma += parseInt(digits[i], 10) * pesos[pi % pesos.length];
      pi++;
    }
    var resto = soma % 11;
    return 11 - resto; // chamador trata casos 10 e 11
  }

  // ─── BANCO DO BRASIL ─────────────────────────────────────────────────────────
  //
  // Fonte: documentação pública do Banco do Brasil (convenção de cobrança).
  // SUPOSIÇÃO: a regra descrita aqui é baseada em material de terceiros e na
  // especificação fornecida para esta implementação. O BB pode usar variações
  // internas não documentadas publicamente.
  //
  // CONTA (até 8 dígitos + 1 DV):
  //   - Pesos da direita: 2, 3, 4, 5, 6, 7, 8, 9 (ciclando se > 8 dígitos).
  //   - resto = soma % 11
  //   - DV = 11 - resto
  //   - Se DV == 10 → "X"
  //   - Se DV == 11 → 0
  //
  // AGÊNCIA (4 dígitos + 1 DV):
  //   - Pesos da direita: 2, 3, 4, 5 (ciclando).
  //   - Mesma regra de 10→"X", 11→0.

  var BB_PESOS_CONTA   = [2, 3, 4, 5, 6, 7, 8, 9];
  var BB_PESOS_AGENCIA = [2, 3, 4, 5];

  /**
   * Calcula o DV de conta ou agência do Banco do Brasil.
   * @param {string} digits
   * @param {number[]} pesos
   * @returns {string} - "0".."9" ou "X"
   */
  function dvBB(digits, pesos) {
    var dv = calcMod11(digits, pesos);
    if (dv === 11) { return "0"; }
    if (dv === 10) { return "X"; }
    return String(dv);
  }

  function gerarBB() {
    var agBase = randDigits(4);
    var agDV   = dvBB(agBase, BB_PESOS_AGENCIA);

    // Conta base: 8 dígitos
    var ctBase = randDigits(8);
    var ctDV   = dvBB(ctBase, BB_PESOS_CONTA);

    return {
      banco:    "Banco do Brasil",
      agencia:  agBase + "-" + agDV,
      conta:    ctBase + "-" + ctDV,
      operacao: null, // BB não usa operação
      // valores brutos para validação
      _agBase: agBase,
      _agDV:   agDV,
      _ctBase: ctBase,
      _ctDV:   ctDV
    };
  }

  /**
   * Valida agência e conta do Banco do Brasil.
   * Retorna { valido, mensagem }.
   */
  function validarBB(agenciaRaw, contaRaw) {
    // Remove máscara: mantém dígitos e "X"
    var ag = agenciaRaw.replace(/[^0-9X]/gi, "").toUpperCase();
    var ct = contaRaw.replace(/[^0-9X]/gi, "").toUpperCase();

    // Agência: 4 base + 1 DV = 5 caracteres totais
    if (ag.length !== 5) {
      return { valido: false, mensagem: "Agencia invalida — esperado 4 digitos + 1 DV (total 5 caracteres, ex.: 12345 ou 1234X)." };
    }
    var agBase = ag.slice(0, 4);
    var agDVIn = ag.slice(4);
    if (!/^\d{4}$/.test(agBase)) {
      return { valido: false, mensagem: "Agencia invalida — os 4 primeiros caracteres devem ser digitos." };
    }
    var agDVEsp = dvBB(agBase, BB_PESOS_AGENCIA);
    if (agDVIn !== agDVEsp) {
      return {
        valido: false,
        mensagem: "INVALIDO — DV da agencia incorreto. Esperado: " + agDVEsp + ", recebido: " + agDVIn + "."
      };
    }

    // Conta: 1..8 base + 1 DV
    if (ct.length < 2 || ct.length > 9) {
      return { valido: false, mensagem: "Conta invalida — esperado ate 8 digitos + 1 DV (2 a 9 caracteres no total)." };
    }
    var ctBase = ct.slice(0, ct.length - 1);
    var ctDVIn = ct.slice(-1);
    if (!/^\d+$/.test(ctBase)) {
      return { valido: false, mensagem: "Conta invalida — os digitos da base devem ser numericos." };
    }
    var ctDVEsp = dvBB(ctBase, BB_PESOS_CONTA);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALIDO — DV da conta incorreto. Esperado: " + ctDVEsp + ", recebido: " + ctDVIn + "."
      };
    }

    return { valido: true, mensagem: "VALIDO — DV da agencia e da conta conferem pela regra modulo 11 (Banco do Brasil)." };
  }

  // ─── BRADESCO ─────────────────────────────────────────────────────────────────
  //
  // Fonte: documentação pública de boletos/cobrança Bradesco.
  // SUPOSIÇÃO: a regra descrita é a amplamente citada em material de terceiros.
  // O Bradesco pode ter variações internas (ex.: contas especiais) não cobertas.
  //
  // CONTA (7 dígitos + 1 DV):
  //   - Pesos da direita: 2, 3, 4, 5, 6, 7 (ciclando).
  //   - resto = soma % 11
  //   - DV = 11 - resto
  //   - Se DV == 11 → 0
  //   - Se DV == 10 → "P"  (letra P — padrão Bradesco para este caso)
  //
  // AGÊNCIA (4 dígitos + 1 DV):
  //   - Pesos da direita: 2, 3, 4, 5 (ciclando).
  //   - Mesma regra de 11→0, 10→"P".

  var BRA_PESOS_CONTA   = [2, 3, 4, 5, 6, 7];
  var BRA_PESOS_AGENCIA = [2, 3, 4, 5];

  /**
   * Calcula o DV de conta ou agência do Bradesco.
   * @param {string} digits
   * @param {number[]} pesos
   * @returns {string} - "0".."9" ou "P"
   */
  function dvBradesco(digits, pesos) {
    var dv = calcMod11(digits, pesos);
    if (dv === 11) { return "0"; }
    if (dv === 10) { return "P"; }
    return String(dv);
  }

  function gerarBradesco() {
    var agBase = randDigits(4);
    var agDV   = dvBradesco(agBase, BRA_PESOS_AGENCIA);

    var ctBase = randDigits(7);
    var ctDV   = dvBradesco(ctBase, BRA_PESOS_CONTA);

    return {
      banco:    "Bradesco",
      agencia:  agBase + "-" + agDV,
      conta:    ctBase + "-" + ctDV,
      operacao: null,
      _agBase: agBase,
      _agDV:   agDV,
      _ctBase: ctBase,
      _ctDV:   ctDV
    };
  }

  /**
   * Valida agência e conta do Bradesco.
   * Retorna { valido, mensagem }.
   */
  function validarBradesco(agenciaRaw, contaRaw) {
    var ag = agenciaRaw.replace(/[^0-9P]/gi, "").toUpperCase();
    var ct = contaRaw.replace(/[^0-9P]/gi, "").toUpperCase();

    // Agência: 4 base + 1 DV = 5 caracteres
    if (ag.length !== 5) {
      return { valido: false, mensagem: "Agencia invalida — esperado 4 digitos + 1 DV (5 caracteres, ex.: 12345 ou 1234P)." };
    }
    var agBase = ag.slice(0, 4);
    var agDVIn = ag.slice(4);
    if (!/^\d{4}$/.test(agBase)) {
      return { valido: false, mensagem: "Agencia invalida — os 4 primeiros caracteres devem ser digitos." };
    }
    var agDVEsp = dvBradesco(agBase, BRA_PESOS_AGENCIA);
    if (agDVIn !== agDVEsp) {
      return {
        valido: false,
        mensagem: "INVALIDO — DV da agencia incorreto. Esperado: " + agDVEsp + ", recebido: " + agDVIn + "."
      };
    }

    // Conta: 7 base + 1 DV = 8 caracteres
    if (ct.length !== 8) {
      return { valido: false, mensagem: "Conta invalida — esperado 7 digitos + 1 DV (8 caracteres no total)." };
    }
    var ctBase = ct.slice(0, 7);
    var ctDVIn = ct.slice(7);
    if (!/^\d{7}$/.test(ctBase)) {
      return { valido: false, mensagem: "Conta invalida — os 7 primeiros caracteres devem ser digitos." };
    }
    var ctDVEsp = dvBradesco(ctBase, BRA_PESOS_CONTA);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALIDO — DV da conta incorreto. Esperado: " + ctDVEsp + ", recebido: " + ctDVIn + "."
      };
    }

    return { valido: true, mensagem: "VALIDO — DV da agencia e da conta conferem pela regra modulo 11 (Bradesco)." };
  }

  // ─── CAIXA ECONÔMICA FEDERAL ─────────────────────────────────────────────────
  //
  // AVISO: A Caixa Econômica Federal é o banco com a regra de DV MENOS padronizada
  // publicamente. A conta Caixa usa uma "operação" (código de produto/tipo de conta)
  // que faz parte do cálculo do DV. A implementação abaixo é a APROXIMAÇÃO mais
  // citada em material público de terceiros; pode não corresponder exatamente à
  // regra interna oficial da Caixa para todos os tipos de conta.
  //
  // SUPOSIÇÃO: aplica-se módulo 11 sobre a concatenação (operação + conta de 8 dígitos),
  // percorrendo da direita para a esquerda com pesos 2,3,4,5,6,7,8,9 ciclando.
  // Se DV == 10 ou DV == 11 → DV = 0.
  //
  // CONTA (operação 3 dígitos + conta 8 dígitos + 1 DV):
  //   - O DV é calculado sobre (operação + conta), não separadamente.
  //
  // Operações representativas usadas para geração (lista não exaustiva; baseada
  // em material público de terceiros):
  //   001 — Conta Corrente Pessoa Física
  //   013 — Conta Poupança Pessoa Física
  //   023 — Conta Caixa Fácil
  //   1288 — Conta Corrente Especial (4 dígitos — SUPOSIÇÃO: alguns materiais
  //           listam operações de 4 dígitos; adotamos 3 para o MVP pois é o formato
  //           mais comum nos documentos públicos disponíveis).
  //
  // Para o MVP, usamos operações de 3 dígitos (001, 013, 023).
  //
  // AGÊNCIA Caixa: 4 dígitos sem DV (a Caixa não usa DV de agência no formato
  // mais comum — SUPOSIÇÃO baseada em material de terceiros; pode variar por tipo
  // de conta/convênio).

  var CEF_PESOS_CONTA = [2, 3, 4, 5, 6, 7, 8, 9];
  var CEF_OPERACOES   = ["001", "013", "023"];

  /**
   * Calcula o DV da conta Caixa sobre a concatenação operação+conta.
   * @param {string} opConta - concatenação de operação + conta (sem DV)
   * @returns {string} - "0".."9"
   */
  function dvCaixa(opConta) {
    var dv = calcMod11(opConta, CEF_PESOS_CONTA);
    if (dv === 10 || dv === 11) { return "0"; }
    return String(dv);
  }

  function gerarCaixa() {
    var op     = CEF_OPERACOES[randInt(0, CEF_OPERACOES.length)];
    var agBase = randDigits(4);
    var ctBase = randDigits(8);
    var ctDV   = dvCaixa(op + ctBase);

    return {
      banco:    "Caixa Economica Federal",
      agencia:  agBase, // sem DV (ver suposição acima)
      conta:    ctBase + "-" + ctDV,
      operacao: op,
      _agBase: agBase,
      _agDV:   null,
      _ctBase: ctBase,
      _ctDV:   ctDV,
      _op:     op
    };
  }

  /**
   * Valida conta da Caixa (operação + conta).
   * Retorna { valido, mensagem }.
   */
  function validarCaixa(agenciaRaw, contaRaw, operacaoRaw) {
    // Agência: 4 dígitos, sem DV
    var ag = agenciaRaw.replace(/\D/g, "");
    if (ag.length !== 4) {
      return { valido: false, mensagem: "Agencia invalida — esperado exatamente 4 digitos (Caixa nao usa DV de agencia neste formato)." };
    }

    // Operação: 3 dígitos
    var op = operacaoRaw.replace(/\D/g, "");
    if (op.length !== 3) {
      return { valido: false, mensagem: "Operacao invalida — esperado exatamente 3 digitos (ex.: 001, 013, 023)." };
    }

    // Conta: 8 base + 1 DV = 9 caracteres
    var ct = contaRaw.replace(/\D/g, "");
    if (ct.length !== 9) {
      return { valido: false, mensagem: "Conta invalida — esperado 8 digitos + 1 DV (9 caracteres no total)." };
    }
    var ctBase = ct.slice(0, 8);
    var ctDVIn = ct.slice(8);
    if (!/^\d{8}$/.test(ctBase)) {
      return { valido: false, mensagem: "Conta invalida — os 8 primeiros caracteres devem ser digitos." };
    }
    var ctDVEsp = dvCaixa(op + ctBase);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALIDO — DV da conta incorreto. Esperado: " + ctDVEsp + ", recebido: " + ctDVIn +
                  ". (DV calculado sobre operacao + conta pela aproximacao modulo 11 da Caixa.)"
      };
    }

    return {
      valido: true,
      mensagem: "VALIDO — DV da conta confere pela aproximacao modulo 11 (Caixa Economica Federal). " +
                "Nota: a regra da Caixa e a menos padronizada publicamente — este resultado nao garante validade oficial."
    };
  }

  // ─── Despachante por banco ────────────────────────────────────────────────────

  var BANCOS = {
    bb:        { nome: "Banco do Brasil",      gerar: gerarBB,       validar: validarBB },
    bradesco:  { nome: "Bradesco",             gerar: gerarBradesco, validar: validarBradesco },
    caixa:     { nome: "Caixa Economica Federal", gerar: gerarCaixa, validar: validarCaixa }
  };

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var bancoSelect      = document.getElementById("banco-select");
  var btnGerar         = document.getElementById("btn-gerar-conta");

  // Saída do gerador
  var resultadoDiv     = document.getElementById("conta-resultado");
  var outBanco         = document.getElementById("out-banco");
  var outAgencia       = document.getElementById("out-agencia");
  var outOperacao      = document.getElementById("out-operacao");
  var outConta         = document.getElementById("out-conta");
  var rowOperacao      = document.getElementById("row-operacao");
  var btnCopiar        = document.getElementById("btn-copiar-conta");

  // Validação
  var validBancoSelect  = document.getElementById("valid-banco-select");
  var validAgencia      = document.getElementById("valid-agencia");
  var validOperacao     = document.getElementById("valid-operacao");
  var validConta        = document.getElementById("valid-conta");
  var rowValidOperacao  = document.getElementById("row-valid-operacao");
  var btnValidar        = document.getElementById("btn-validar-conta");
  var btnLimpar         = document.getElementById("btn-limpar-conta");
  var resultValidar     = document.getElementById("result-validar-conta");

  // Guard — interrompe silenciosamente se elementos essenciais não existirem
  if (
    !bancoSelect || !btnGerar || !resultadoDiv ||
    !outBanco || !outAgencia || !outConta || !btnCopiar ||
    !validBancoSelect || !validAgencia || !validConta ||
    !btnValidar || !resultValidar
  ) {
    return;
  }

  // ─── Estado interno ──────────────────────────────────────────────────────────

  /** Últimos dados gerados, usados pelo botão Copiar */
  var ultimoGerado = null;

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

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

  /**
   * Mostra ou oculta a linha de operação no painel de validação,
   * de acordo com o banco selecionado.
   */
  function atualizarCamposValidacao() {
    if (!validBancoSelect || !rowValidOperacao) { return; }
    var banco = validBancoSelect.value;
    // Operação é exclusiva da Caixa
    rowValidOperacao.hidden = (banco !== "caixa");
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    var chave = bancoSelect ? bancoSelect.value : "bb";
    var banco = BANCOS[chave];
    if (!banco) { return; }

    var dados = banco.gerar();
    ultimoGerado = dados;

    // Exibe banco
    if (outBanco) { outBanco.textContent = dados.banco; }

    // Exibe agência
    if (outAgencia) { outAgencia.textContent = dados.agencia; }

    // Exibe operação (só para Caixa)
    if (rowOperacao) {
      rowOperacao.hidden = (dados.operacao === null);
    }
    if (outOperacao && dados.operacao !== null) {
      outOperacao.textContent = dados.operacao;
    }

    // Exibe conta
    if (outConta) { outConta.textContent = dados.conta; }

    // Mostra o bloco de resultado
    if (resultadoDiv) { resultadoDiv.hidden = false; }
  }

  function handleCopiar() {
    if (!ultimoGerado) { return; }
    var d = ultimoGerado;
    var texto;
    if (d.operacao) {
      texto = "Banco: " + d.banco + "\nAgencia: " + d.agencia +
              "\nOperacao: " + d.operacao + "\nConta: " + d.conta;
    } else {
      texto = "Banco: " + d.banco + "\nAgencia: " + d.agencia +
              "\nConta: " + d.conta;
    }
    copiarTexto(texto, btnCopiar);
  }

  function handleValidar() {
    if (!validBancoSelect || !validAgencia || !validConta || !resultValidar) {
      return;
    }

    var chave   = validBancoSelect.value;
    var banco   = BANCOS[chave];
    if (!banco) {
      resultValidar.textContent = "Banco invalido.";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    var agVal = validAgencia ? validAgencia.value.trim() : "";
    var ctVal = validConta ? validConta.value.trim() : "";

    if (!agVal || !ctVal) {
      resultValidar.textContent = "Preencha a agencia e a conta para validar.";
      resultValidar.className   = "result-validar result-validar--neutro";
      return;
    }

    var resultado;
    if (chave === "caixa") {
      var opVal = validOperacao ? validOperacao.value.trim() : "";
      resultado = banco.validar(agVal, ctVal, opVal);
    } else {
      resultado = banco.validar(agVal, ctVal);
    }

    resultValidar.textContent = resultado.mensagem;
    resultValidar.className   = resultado.valido
      ? "result-validar result-validar--valido"
      : "result-validar result-validar--invalido";
  }

  function handleLimpar() {
    if (validAgencia)     { validAgencia.value    = ""; }
    if (validOperacao)    { validOperacao.value   = ""; }
    if (validConta)       { validConta.value      = ""; }
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className   = "result-validar";
    }
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnGerar.addEventListener("click",  handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click", handleValidar);

  if (btnLimpar) {
    btnLimpar.addEventListener("click", handleLimpar);
  }

  if (validBancoSelect) {
    validBancoSelect.addEventListener("change", atualizarCamposValidacao);
  }

  // Inicializa visibilidade dos campos de validação
  atualizarCamposValidacao();

  // Permite validar pressionando Enter nos campos de validação
  function onEnterValidar(e) {
    if (e.key === "Enter") { handleValidar(); }
  }
  if (validAgencia)  { validAgencia.addEventListener("keydown",  onEnterValidar); }
  if (validOperacao) { validOperacao.addEventListener("keydown", onEnterValidar); }
  if (validConta)    { validConta.addEventListener("keydown",    onEnterValidar); }

})();
