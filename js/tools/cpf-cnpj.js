// js/tools/cpf-cnpj.js — lógica do Gerador e Validador de CPF/CNPJ.
// Carregado APENAS em tools/cpf-cnpj/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent — nunca innerHTML.

(function () {
  "use strict";

  // ─── Constantes de pesos ────────────────────────────────────────────────────

  // CPF: pesos do 1º DV (sobre 9 dígitos base) e do 2º DV (sobre 10 dígitos)
  var CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  var CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  // CNPJ: pesos do 1º DV (sobre 12 caracteres base)
  var CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  // CNPJ: pesos do 2º DV (sobre 13 caracteres = base + 1º DV)
  var CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Sequências de CPF inválidas (todos os dígitos iguais)
  var CPF_INVALID_SEQS = [
    "00000000000", "11111111111", "22222222222", "33333333333",
    "44444444444", "55555555555", "66666666666", "77777777777",
    "88888888888", "99999999999"
  ];

  // Caracteres alfanuméricos válidos para o CNPJ alfanumérico (0-9, A-Z)
  var ALNUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // ─── Utilitários numéricos ──────────────────────────────────────────────────

  /** Retorna um inteiro aleatório em [min, max) */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Calcula um dígito verificador a partir de um array de valores numéricos
   * e um array de pesos de mesmo comprimento.
   * Regra: soma dos produtos → resto = soma % 11 → DV = resto < 2 ? 0 : 11 - resto
   */
  function calcDV(values, weights) {
    var sum = 0;
    for (var i = 0; i < weights.length; i++) {
      sum += values[i] * weights[i];
    }
    var resto = sum % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  // ─── CPF ────────────────────────────────────────────────────────────────────

  /**
   * Gera 9 dígitos base aleatórios que não formem uma sequência inválida,
   * calcula os 2 DVs e retorna a string com 11 dígitos.
   */
  function gerarCPF() {
    var base;
    do {
      base = [];
      for (var i = 0; i < 9; i++) {
        base.push(randInt(0, 10));
      }
    } while (CPF_INVALID_SEQS.indexOf(base.join("")) !== -1);

    var dv1 = calcDV(base, CPF_WEIGHTS_1);
    var dv2 = calcDV(base.concat([dv1]), CPF_WEIGHTS_2);
    return base.join("") + dv1 + dv2;
  }

  /**
   * Valida um CPF (apenas dígitos, 11 caracteres).
   * Retorna true se válido.
   */
  function validarCPF(digits) {
    if (digits.length !== 11) return false;
    if (CPF_INVALID_SEQS.indexOf(digits) !== -1) return false;

    var nums = digits.split("").map(Number);
    var dv1 = calcDV(nums.slice(0, 9), CPF_WEIGHTS_1);
    var dv2 = calcDV(nums.slice(0, 10), CPF_WEIGHTS_2);
    return nums[9] === dv1 && nums[10] === dv2;
  }

  /** Formata 11 dígitos como CPF: 000.000.000-00 */
  function formatarCPF(digits) {
    return digits.slice(0, 3) + "." +
           digits.slice(3, 6) + "." +
           digits.slice(6, 9) + "-" +
           digits.slice(9);
  }

  // ─── CNPJ Numérico ──────────────────────────────────────────────────────────

  /**
   * Gera 12 dígitos base aleatórios, calcula os 2 DVs e retorna a string
   * com 14 dígitos (CNPJ numérico tradicional).
   */
  function gerarCNPJNumerico() {
    var base = [];
    for (var i = 0; i < 12; i++) {
      base.push(randInt(0, 10));
    }

    var dv1 = calcDV(base, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(base.concat([dv1]), CNPJ_WEIGHTS_2);
    return base.join("") + dv1 + dv2;
  }

  /**
   * Valida um CNPJ numérico (apenas dígitos, 14 caracteres).
   * Retorna true se válido.
   */
  function validarCNPJNumerico(digits) {
    if (digits.length !== 14) return false;
    // Rejeita sequências de dígitos iguais (ex.: 00000000000000)
    if (/^(\d)\1{13}$/.test(digits)) return false;

    var nums = digits.split("").map(Number);
    var dv1 = calcDV(nums.slice(0, 12), CNPJ_WEIGHTS_1);
    var dv2 = calcDV(nums.slice(0, 13), CNPJ_WEIGHTS_2);
    return nums[12] === dv1 && nums[13] === dv2;
  }

  /** Formata 14 dígitos como CNPJ: 00.000.000/0000-00 */
  function formatarCNPJNumerico(digits) {
    return digits.slice(0, 2) + "." +
           digits.slice(2, 5) + "." +
           digits.slice(5, 8) + "/" +
           digits.slice(8, 12) + "-" +
           digits.slice(12);
  }

  // ─── CNPJ Alfanumérico ──────────────────────────────────────────────────────

  /**
   * Converte um caractere alfanumérico para o valor numérico usado no cálculo do DV.
   * Regra: valor = charCode - 48
   * '0'..'9' → 0..9 (charCodes 48..57, resultado 0..9)
   * 'A'..'Z' → 17..42 (charCodes 65..90, resultado 17..42)
   */
  function charParaValor(ch) {
    return ch.charCodeAt(0) - 48;
  }

  /**
   * Gera 12 caracteres base alfanuméricos (0-9, A-Z) aleatórios,
   * calcula os 2 DVs (sempre numéricos) e retorna a string de 14 caracteres.
   */
  function gerarCNPJAlfanumerico() {
    var base = [];
    for (var i = 0; i < 12; i++) {
      base.push(ALNUM_CHARS[randInt(0, ALNUM_CHARS.length)]);
    }

    // Converte cada caractere para valor numérico para o cálculo do DV
    var baseVals = base.map(charParaValor);

    var dv1 = calcDV(baseVals, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(baseVals.concat([dv1]), CNPJ_WEIGHTS_2);

    return base.join("") + dv1 + dv2;
  }

  /**
   * Valida um CNPJ alfanumérico (14 caracteres: 12 alfanum + 2 dígitos DV).
   * Retorna true se válido.
   */
  function validarCNPJAlfanumerico(str) {
    if (str.length !== 14) return false;

    // Os 2 últimos caracteres (DVs) devem ser dígitos
    var dvPart = str.slice(12);
    if (!/^\d{2}$/.test(dvPart)) return false;

    // Os 12 primeiros devem ser 0-9 ou A-Z
    var basePart = str.slice(0, 12);
    if (!/^[0-9A-Z]{12}$/.test(basePart)) return false;

    var baseVals = basePart.split("").map(charParaValor);
    var dvs = dvPart.split("").map(Number);

    var dv1 = calcDV(baseVals, CNPJ_WEIGHTS_1);
    var dv2 = calcDV(baseVals.concat([dv1]), CNPJ_WEIGHTS_2);

    return dvs[0] === dv1 && dvs[1] === dv2;
  }

  /**
   * Detecta se um CNPJ (já sem máscara, 14 caracteres) é alfanumérico.
   * Considera alfanumérico se tiver ao menos uma letra nos 12 primeiros caracteres.
   */
  function isCNPJAlfanumerico(str) {
    return /[A-Z]/.test(str.slice(0, 12));
  }

  // ─── Validador unificado (CPF ou CNPJ) ──────────────────────────────────────

  /**
   * Remove todos os caracteres que não sejam dígitos ou letras A-Z maiúsculas.
   * Usado para ignorar máscaras (pontos, traços, barras).
   */
  function removerMascara(str) {
    return str.toUpperCase().replace(/[^0-9A-Z]/g, "");
  }

  /**
   * Detecta o tipo e valida CPF ou CNPJ.
   * Retorna um objeto { tipo, valido, mensagem }.
   */
  function validarDocumento(raw) {
    var limpo = removerMascara(raw);

    if (limpo.length === 11) {
      // CPF: apenas dígitos
      if (/^\d{11}$/.test(limpo)) {
        var ok = validarCPF(limpo);
        return {
          tipo: "CPF",
          valido: ok,
          mensagem: ok ? "CPF VALIDO" : "CPF INVALIDO"
        };
      }
      return { tipo: "CPF", valido: false, mensagem: "CPF INVALIDO — formato incorreto" };
    }

    if (limpo.length === 14) {
      // CNPJ numérico (apenas dígitos)
      if (/^\d{14}$/.test(limpo)) {
        var okN = validarCNPJNumerico(limpo);
        return {
          tipo: "CNPJ",
          valido: okN,
          mensagem: okN ? "CNPJ VALIDO" : "CNPJ INVALIDO"
        };
      }
      // CNPJ alfanumérico (12 base alfanum + 2 DVs numéricos)
      if (/^[0-9A-Z]{12}\d{2}$/.test(limpo)) {
        var okA = validarCNPJAlfanumerico(limpo);
        return {
          tipo: "CNPJ alfanumerico",
          valido: okA,
          mensagem: okA ? "CNPJ ALFANUMERICO VALIDO" : "CNPJ ALFANUMERICO INVALIDO"
        };
      }
      return { tipo: "CNPJ", valido: false, mensagem: "CNPJ INVALIDO — formato incorreto" };
    }

    return {
      tipo: "desconhecido",
      valido: false,
      mensagem: "Documento invalido — tamanho incorreto (esperado 11 digitos para CPF ou 14 para CNPJ)"
    };
  }

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var btnGerarCPF     = document.getElementById("btn-gerar-cpf");
  var btnGerarCNPJ    = document.getElementById("btn-gerar-cnpj");
  var btnCopiarGerado = document.getElementById("btn-copiar-gerado");
  var btnValidar      = document.getElementById("btn-validar");
  var btnLimparVal    = document.getElementById("btn-limpar-validar");

  var chkFormatar     = document.getElementById("chk-formatar");
  var outputGerado    = document.getElementById("output-gerado");

  var inputValidar    = document.getElementById("input-validar");
  var resultValidar   = document.getElementById("result-validar");

  // Interrompe silenciosamente se os elementos essenciais não existirem.
  if (
    !btnGerarCPF || !btnGerarCNPJ || !btnCopiarGerado || !btnValidar ||
    !chkFormatar || !outputGerado || !inputValidar || !resultValidar
  ) {
    return;
  }

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

  /**
   * Retorna o formato de CNPJ selecionado: "numerico" ou "alfanumerico".
   */
  function getFormatoCNPJ() {
    var radios = document.getElementsByName("cnpj-formato");
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return "numerico";
  }

  /**
   * Copia texto para o clipboard (com fallback para execCommand).
   */
  function copiarTexto(text, btn) {
    if (!text) return;
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

  function handleGerarCPF() {
    var cpf = gerarCPF();
    var formatar = chkFormatar && chkFormatar.checked;
    outputGerado.value = formatar ? formatarCPF(cpf) : cpf;
  }

  function handleGerarCNPJ() {
    var formato = getFormatoCNPJ();
    var cnpj;
    var formatar = chkFormatar && chkFormatar.checked;

    if (formato === "alfanumerico") {
      cnpj = gerarCNPJAlfanumerico();
      // CNPJ alfanumérico não tem máscara oficial definida — exibe sem máscara
      // (a Receita ainda não publicou máscara para o formato alfanumérico)
      outputGerado.value = cnpj;
    } else {
      cnpj = gerarCNPJNumerico();
      outputGerado.value = formatar ? formatarCNPJNumerico(cnpj) : cnpj;
    }
  }

  function handleCopiar() {
    if (!outputGerado) return;
    copiarTexto(outputGerado.value, btnCopiarGerado);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) return;

    var raw = inputValidar.value.trim();
    if (raw === "") {
      resultValidar.textContent = "Digite um CPF ou CNPJ para validar.";
      resultValidar.className = "result-validar result-validar--neutro";
      return;
    }

    var resultado = validarDocumento(raw);

    // Exibe a mensagem via textContent — sem risco de XSS
    resultValidar.textContent = resultado.mensagem;
    resultValidar.className = resultado.valido
      ? "result-validar result-validar--valido"
      : "result-validar result-validar--invalido";
  }

  function handleLimparValidar() {
    if (inputValidar)  inputValidar.value  = "";
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className = "result-validar";
    }
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnGerarCPF.addEventListener("click",     handleGerarCPF);
  btnGerarCNPJ.addEventListener("click",    handleGerarCNPJ);
  btnCopiarGerado.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click",      handleValidar);

  // Permitir validar com Enter no campo de validação
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleValidar();
  });

  if (btnLimparVal) {
    btnLimparVal.addEventListener("click", handleLimparValidar);
  }

})();
