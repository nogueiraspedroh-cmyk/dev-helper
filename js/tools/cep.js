// js/tools/cep.js — lógica do Gerador e Validador de CEP.
// Carregado APENAS em tools/cep/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent — nunca innerHTML.
//
// IMPORTANTE: o CEP brasileiro NÃO possui dígito verificador.
// A "validação" desta ferramenta verifica apenas FORMATO (8 dígitos numéricos),
// não confirma que o CEP existe na base de dados dos Correios.

(function () {
  "use strict";

  // ─── Mapa de regiões ────────────────────────────────────────────────────────
  //
  // Chave: primeiro dígito do CEP (string "0".."9").
  // Valor: nome legível da região correspondente.
  // Fonte: regra oficial dos Correios para faixas de CEP.

  var REGIOES = {
    "0": "Grande São Paulo",
    "1": "Interior de SP",
    "2": "RJ e ES",
    "3": "MG",
    "4": "BA e SE",
    "5": "PE, AL, PB e RN",
    "6": "CE, PI, MA, PA, AM, AC, AP e RR",
    "7": "DF, GO, TO, MT, MS e RO",
    "8": "PR e SC",
    "9": "RS"
  };

  // Array dos dígitos iniciais válidos (para geração aleatória)
  var DIGITOS_INICIAIS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // ─── Utilitários numéricos ──────────────────────────────────────────────────

  /** Retorna um inteiro aleatório em [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Retorna um dígito aleatório (0–9) como string. */
  function randDigit() {
    return String(randInt(0, 10));
  }

  // ─── Lógica de CEP ──────────────────────────────────────────────────────────

  /**
   * Gera um CEP de 8 dígitos numéricos.
   *
   * @param {string|null} primeiroDigito — dígito inicial fixo ("0".."9")
   *   ou null para aleatório.
   * @returns {string} — string com exatamente 8 dígitos.
   */
  function gerarCEP(primeiroDigito) {
    var d0;

    if (primeiroDigito !== null &&
        primeiroDigito !== undefined &&
        REGIOES[primeiroDigito] !== undefined) {
      d0 = primeiroDigito;
    } else {
      // Aleatório: sorteia um dos 10 dígitos iniciais
      d0 = DIGITOS_INICIAIS[randInt(0, DIGITOS_INICIAIS.length)];
    }

    var digits = d0;
    for (var i = 1; i < 8; i++) {
      digits += randDigit();
    }
    return digits;
  }

  /**
   * Aplica a máscara NNNNN-NNN a uma string de 8 dígitos.
   *
   * @param {string} digits — 8 dígitos numéricos.
   * @returns {string} — ex.: "01310-100"
   */
  function formatarCEP(digits) {
    return digits.slice(0, 5) + "-" + digits.slice(5);
  }

  /**
   * Remove hífen e espaços de um CEP para obter apenas dígitos.
   *
   * @param {string} raw — entrada do usuário (com ou sem máscara).
   * @returns {string} — apenas dígitos.
   */
  function removerMascara(raw) {
    return raw.replace(/[\s\-]/g, "");
  }

  /**
   * Valida o formato de um CEP (apenas formato — não confirma existência).
   *
   * Critérios de formato válido:
   *   - Exatamente 8 dígitos numéricos (após remover máscara).
   *   - Primeiro dígito entre 0 e 9 (qualquer sequência é aceita — sem DV).
   *
   * @param {string} raw — CEP digitado pelo usuário (com ou sem máscara).
   * @returns {{ valido: boolean, mensagem: string }}
   */
  function validarCEP(raw) {
    var limpo = removerMascara(raw.trim());

    if (limpo.length === 0) {
      return {
        valido: false,
        mensagem: "Digite um CEP para validar."
      };
    }

    // Verifica se contém apenas dígitos
    if (!/^\d+$/.test(limpo)) {
      return {
        valido: false,
        mensagem: "CEP INVALIDO — contém caracteres não numéricos."
      };
    }

    // Verifica comprimento exato de 8 dígitos
    if (limpo.length !== 8) {
      return {
        valido: false,
        mensagem: "CEP INVALIDO — deve ter 8 dígitos (encontrado: " + limpo.length + ")."
      };
    }

    // Formato válido — identifica a região pelo primeiro dígito
    var primeiroDigito = limpo[0];
    var regiao = REGIOES[primeiroDigito] || "desconhecida";

    return {
      valido: true,
      mensagem: "CEP VALIDO — Região: " + regiao + " (1º dígito: " + primeiroDigito + ")."
    };
  }

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var regiaoSelect      = document.getElementById("regiao-select");
  var chkFormatar       = document.getElementById("chk-formatar-cep");
  var btnGerar          = document.getElementById("btn-gerar-cep");
  var outputGerado      = document.getElementById("output-cep-gerado");
  var btnCopiar         = document.getElementById("btn-copiar-cep");

  var inputValidar      = document.getElementById("input-validar-cep");
  var btnValidar        = document.getElementById("btn-validar-cep");
  var btnLimparValidar  = document.getElementById("btn-limpar-validar-cep");
  var resultValidar     = document.getElementById("result-validar-cep");

  // Guard — interrompe silenciosamente se os elementos essenciais não existirem.
  if (
    !regiaoSelect || !chkFormatar || !btnGerar || !outputGerado || !btnCopiar ||
    !inputValidar || !btnValidar || !resultValidar
  ) {
    return;
  }

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

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    if (!regiaoSelect || !chkFormatar || !outputGerado) { return; }

    var escolha = regiaoSelect.value;
    // "aleatorio" → passa null; dígito "0".."9" → passa o dígito
    var primeiroDigito = (escolha === "aleatorio") ? null : escolha;

    var cep     = gerarCEP(primeiroDigito);
    var formatar = chkFormatar.checked;

    // Saída via .value — sem risco de XSS
    outputGerado.value = formatar ? formatarCEP(cep) : cep;
  }

  function handleCopiar() {
    if (!outputGerado) { return; }
    copiarTexto(outputGerado.value, btnCopiar);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) { return; }

    var raw = inputValidar.value;

    if (raw.trim() === "") {
      resultValidar.textContent = "Digite um CEP para validar.";
      resultValidar.className   = "result-validar result-validar--neutro";
      return;
    }

    var resultado = validarCEP(raw);

    // Exibe via textContent — sem risco de XSS
    resultValidar.textContent = resultado.mensagem;
    resultValidar.className   = resultado.valido
      ? "result-validar result-validar--valido"
      : "result-validar result-validar--invalido";
  }

  function handleLimparValidar() {
    if (inputValidar) { inputValidar.value = ""; }
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className   = "result-validar";
    }
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnGerar.addEventListener("click",  handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click", handleValidar);

  // Permite validar pressionando Enter no campo de validação
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { handleValidar(); }
  });

  if (btnLimparValidar) {
    btnLimparValidar.addEventListener("click", handleLimparValidar);
  }

})();
