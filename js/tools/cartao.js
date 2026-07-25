// js/tools/cartao.js — lógica do Gerador e Validador de Cartão de Crédito/Débito.
// Carregado APENAS em tools/cartao/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .textContent/.value — nunca innerHTML.
//
// Os números gerados são FICTÍCIOS e destinados EXCLUSIVAMENTE a testes de software.
// São válidos pelo algoritmo de Luhn mas não pertencem a nenhum cartão emitido.

(function () {
  "use strict";

  // ─── Definição das bandeiras ─────────────────────────────────────────────────
  //
  // Cada entrada define:
  //   name     — nome legível da bandeira.
  //   length   — comprimento total do número (em dígitos).
  //   cvvLen   — comprimento do CVV (3 para a maioria; 4 para Amex).
  //   prefixes — array de prefixos (strings) que identificam a bandeira.
  //              Para intervalos (ex.: MC 51-55), listamos cada prefixo explicitamente.
  //   genPrefix — função que retorna UM prefixo aleatório válido para geração.

  var BANDEIRAS = {
    visa: {
      name: "Visa",
      length: 16,
      cvvLen: 3,
      prefixes: ["4"],
      genPrefix: function () { return "4"; }
    },

    mastercard: {
      name: "Mastercard",
      length: 16,
      cvvLen: 3,
      // Faixas de prefixo Mastercard:
      //   51–55 (prefixos de 2 dígitos)
      //   2221–2720 (prefixos de 4 dígitos — IIN Mastercard expandido)
      // Para detecção guardamos os ranges; para geração escolhemos aleatoriamente
      // entre as duas faixas.
      prefixes: [
        "51", "52", "53", "54", "55"
        // A faixa 2221-2720 é verificada via luhnDetectBandeira com range check
      ],
      genPrefix: function () {
        // 50% de chance de usar faixa clássica (51-55), 50% faixa expandida (2221-2720)
        if (Math.random() < 0.5) {
          // Faixa clássica: 51-55
          var n = randInt(51, 56); // [51, 55]
          return String(n);
        } else {
          // Faixa expandida: 2221-2720
          var m = randInt(2221, 2721); // [2221, 2720]
          return String(m);
        }
      }
    },

    amex: {
      name: "American Express",
      length: 15,
      cvvLen: 4,
      prefixes: ["34", "37"],
      genPrefix: function () {
        return Math.random() < 0.5 ? "34" : "37";
      }
    },

    elo: {
      name: "Elo",
      length: 16,
      cvvLen: 3,
      // Prefixos representativos do Elo. A detecção é feita verificando
      // se o número começa com um desses prefixos.
      prefixes: [
        "4011", "4312", "4389",
        "5041", "5066", "5067",
        "6277", "6362", "6363",
        "6500", "6501", "6502", "6503", "6504",
        "6505", "6506", "6507", "6508", "6509",
        "6510", "6511", "6512", "6513", "6514",
        "6515", "6516", "6517", "6518", "6519",
        "6550", "6551", "6552", "6553", "6554",
        "6555", "6556", "6557", "6558", "6559"
      ],
      genPrefix: function () {
        // Prefixos representativos para geração
        var opts = [
          "4011", "4312", "4389",
          "5041", "5066", "5067",
          "6277", "6362", "6363",
          "6501", "6511", "6550"
        ];
        return opts[randInt(0, opts.length)];
      }
    },

    hipercard: {
      name: "Hipercard",
      length: 16,
      cvvLen: 3,
      prefixes: ["6062"],
      genPrefix: function () { return "6062"; }
    }
  };

  // Ordem de detecção: mais específicos (prefixos mais longos) primeiro.
  // Elo (4 dígitos) antes de Visa (1 dígito), para que 4011 não caia em Visa.
  var DETECCAO_ORDER = ["amex", "elo", "hipercard", "mastercard", "visa"];

  // ─── Utilitários numéricos ──────────────────────────────────────────────────

  /** Retorna um inteiro aleatório em [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Retorna um dígito aleatório (0–9). */
  function randDigit() {
    return randInt(0, 10);
  }

  // ─── Algoritmo de Luhn ──────────────────────────────────────────────────────

  /**
   * Verifica se uma string de dígitos passa no algoritmo de Luhn.
   *
   * Algoritmo (fonte de verdade):
   *   - Da direita para a esquerda, dobre cada segundo dígito.
   *   - Se o dobro > 9, subtraia 9.
   *   - Some todos os dígitos (originais + dobrados/ajustados).
   *   - Válido se soma % 10 === 0.
   *
   * @param {string} digits — string com apenas dígitos numéricos.
   * @returns {boolean}
   */
  function luhnValido(digits) {
    var sum = 0;
    var shouldDouble = false;
    // Percorre da direita para a esquerda
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) { d -= 9; }
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Calcula o check digit de Luhn para um número com n-1 dígitos já definidos.
   *
   * A ideia: encontrar o dígito X (0–9) tal que (prefixo + X) seja válido por Luhn.
   * Abordagem eficiente: calcula a soma parcial dos n-1 dígitos como se fossem
   * o número completo e deduz o check digit pela propriedade do módulo 10.
   *
   * @param {string} prefix — string com os primeiros n-1 dígitos.
   * @returns {number} — o check digit (0–9).
   */
  function luhnCheckDigit(prefix) {
    // Adiciona um "0" como placeholder do check digit e calcula a soma de Luhn
    // tratando esse 0 como o dígito mais à direita.
    var digits = prefix + "0";
    var sum = 0;
    var shouldDouble = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) { d -= 9; }
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    // O check digit é o complemento de 10 da soma atual, mod 10
    return (10 - (sum % 10)) % 10;
  }

  // ─── Detecção de bandeira ────────────────────────────────────────────────────

  /**
   * Detecta a bandeira de um número de cartão pelos prefixos e comprimento.
   * Retorna a chave da bandeira (ex.: "visa") ou null se desconhecida.
   *
   * @param {string} digits — string com apenas dígitos numéricos.
   * @returns {string|null}
   */
  function detectarBandeira(digits) {
    for (var i = 0; i < DETECCAO_ORDER.length; i++) {
      var key = DETECCAO_ORDER[i];
      var bandeira = BANDEIRAS[key];

      // Verifica comprimento
      if (digits.length !== bandeira.length) {
        // Mastercard tem 16 dígitos e Amex 15 — só pula se realmente diferente
        // Mas algumas bandeiras têm mesmo comprimento, então não podemos filtrar
        // só por comprimento aqui — verificamos prefixo+comprimento juntos.
        // Para simplificar: verifica prefixo primeiro, comprimento depois.
      }

      // Verifica prefixos declarados
      var prefixes = bandeira.prefixes;
      for (var j = 0; j < prefixes.length; j++) {
        if (digits.indexOf(prefixes[j]) === 0) {
          // Prefixo bate — verifica comprimento
          if (digits.length === bandeira.length) {
            return key;
          }
        }
      }

      // Mastercard faixa expandida 2221–2720 (prefixos de 4 dígitos)
      if (key === "mastercard" && digits.length === 16) {
        var pref4 = parseInt(digits.slice(0, 4), 10);
        if (!isNaN(pref4) && pref4 >= 2221 && pref4 <= 2720) {
          return "mastercard";
        }
      }

      // Elo faixas 650x, 651x, 655x: verificação por range nos 4 primeiros dígitos
      if (key === "elo" && digits.length === 16) {
        var pref4Elo = parseInt(digits.slice(0, 4), 10);
        if (!isNaN(pref4Elo)) {
          if ((pref4Elo >= 6500 && pref4Elo <= 6519) ||
              (pref4Elo >= 6550 && pref4Elo <= 6559)) {
            return "elo";
          }
        }
      }
    }

    return null;
  }

  // ─── Gerador de número de cartão ────────────────────────────────────────────

  /**
   * Gera um número de cartão válido por Luhn para a bandeira indicada.
   *
   * @param {string} bandeiraKey — chave em BANDEIRAS (ex.: "visa").
   * @returns {string} — número do cartão (apenas dígitos).
   */
  function gerarNumero(bandeiraKey) {
    var bandeira = BANDEIRAS[bandeiraKey];
    var prefix = bandeira.genPrefix();
    var totalLen = bandeira.length;

    // Preenche os dígitos intermediários aleatoriamente
    // (os primeiros são o prefixo; o último será o check digit)
    var base = prefix;
    while (base.length < totalLen - 1) {
      base += String(randDigit());
    }

    // Calcula e adiciona o check digit
    var check = luhnCheckDigit(base);
    return base + String(check);
  }

  /**
   * Gera uma data de validade futura no formato MM/AA.
   * Usa um mês e ano aleatórios, garantindo que o cartão seja válido
   * por pelo menos 1 ano e no máximo 5 anos a partir de hoje.
   *
   * @returns {string} — ex.: "08/28"
   */
  function gerarValidade() {
    var agora = new Date();
    var anoAtual = agora.getFullYear();
    var mesAtual = agora.getMonth() + 1; // 1–12

    // Ano entre anoAtual+1 e anoAtual+5
    var anoFuturo = randInt(anoAtual + 1, anoAtual + 6);
    var mes = randInt(1, 13); // 01–12

    // Se for o mesmo ano (não é o caso aqui, mas por robustez), garante mês futuro
    if (anoFuturo === anoAtual && mes <= mesAtual) {
      mes = mesAtual + 1;
      if (mes > 12) { mes = 1; anoFuturo++; }
    }

    var mm = mes < 10 ? "0" + mes : String(mes);
    var aa = String(anoFuturo).slice(-2);
    return mm + "/" + aa;
  }

  /**
   * Gera um CVV aleatório com o número de dígitos correto para a bandeira.
   *
   * @param {number} len — comprimento do CVV (3 ou 4).
   * @returns {string}
   */
  function gerarCVV(len) {
    var cvv = "";
    for (var i = 0; i < len; i++) {
      cvv += String(randDigit());
    }
    return cvv;
  }

  // ─── Formatação do número ────────────────────────────────────────────────────

  /**
   * Formata o número do cartão com espaços.
   * Amex: padrão 4-6-5 (15 dígitos: 4 + 6 + 5).
   * Demais: padrão 4-4-4-4 (16 dígitos: 4 + 4 + 4 + 4).
   *
   * @param {string} digits — número sem máscara.
   * @param {string} bandeiraKey — chave da bandeira.
   * @returns {string}
   */
  function formatarNumero(digits, bandeiraKey) {
    if (bandeiraKey === "amex") {
      // Amex: 4-6-5
      return digits.slice(0, 4) + " " +
             digits.slice(4, 10) + " " +
             digits.slice(10, 15);
    }
    // Padrão: grupos de 4
    var grupos = [];
    for (var i = 0; i < digits.length; i += 4) {
      grupos.push(digits.slice(i, i + 4));
    }
    return grupos.join(" ");
  }

  // ─── Limpeza de máscara ──────────────────────────────────────────────────────

  /**
   * Remove espaços, hífens e outros separadores comuns de número de cartão.
   * Mantém apenas dígitos.
   *
   * @param {string} raw
   * @returns {string}
   */
  function removerMascara(raw) {
    return raw.replace(/[\s\-]/g, "");
  }

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var bandeiraSelect    = document.getElementById("bandeira-select");
  var chkFormatar       = document.getElementById("chk-formatar-cartao");
  var btnGerar          = document.getElementById("btn-gerar-cartao");
  var cartaoResultado   = document.getElementById("cartao-resultado");
  var outBandeira       = document.getElementById("out-bandeira");
  var outNumero         = document.getElementById("out-numero");
  var outValidade       = document.getElementById("out-validade");
  var outCVV            = document.getElementById("out-cvv");
  var btnCopiarNumero   = document.getElementById("btn-copiar-numero");

  var inputValidar      = document.getElementById("input-validar-cartao");
  var btnValidar        = document.getElementById("btn-validar-cartao");
  var btnLimparValidar  = document.getElementById("btn-limpar-validar-cartao");
  var resultValidar     = document.getElementById("result-validar-cartao");

  // Guard — interrompe silenciosamente se os elementos essenciais não existirem.
  if (
    !bandeiraSelect || !chkFormatar || !btnGerar ||
    !cartaoResultado || !outBandeira || !outNumero ||
    !outValidade || !outCVV || !btnCopiarNumero ||
    !inputValidar || !btnValidar || !resultValidar
  ) {
    return;
  }

  // ─── Estado interno ──────────────────────────────────────────────────────────

  // Guarda o número gerado sem máscara para o botão "Copiar número"
  var ultimoNumeroGerado = "";

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
    // Determina a bandeira a usar
    var escolha = bandeiraSelect ? bandeiraSelect.value : "aleatoria";
    var bandeiraKey;

    if (escolha === "aleatoria") {
      var keys = Object.keys(BANDEIRAS);
      bandeiraKey = keys[randInt(0, keys.length)];
    } else if (BANDEIRAS[escolha]) {
      bandeiraKey = escolha;
    } else {
      bandeiraKey = "visa"; // fallback de segurança
    }

    var bandeira = BANDEIRAS[bandeiraKey];
    var numero   = gerarNumero(bandeiraKey);
    var validade = gerarValidade();
    var cvv      = gerarCVV(bandeira.cvvLen);
    var formatar = chkFormatar && chkFormatar.checked;

    // Guarda o número sem máscara para o clipboard
    ultimoNumeroGerado = numero;

    // Exibe os resultados via textContent — sem risco de XSS
    if (outBandeira)  { outBandeira.textContent  = bandeira.name; }
    if (outNumero)    { outNumero.textContent     = formatar ? formatarNumero(numero, bandeiraKey) : numero; }
    if (outValidade)  { outValidade.textContent   = validade; }
    if (outCVV)       { outCVV.textContent        = cvv; }

    // Mostra a área de resultado (estava hidden na carga inicial)
    if (cartaoResultado) { cartaoResultado.hidden = false; }
  }

  function handleCopiarNumero() {
    if (!ultimoNumeroGerado) { return; }
    // Copia sempre o número sem máscara
    copiarTexto(ultimoNumeroGerado, btnCopiarNumero);
  }

  function handleValidar() {
    if (!inputValidar || !resultValidar) { return; }

    var raw = inputValidar.value.trim();
    if (raw === "") {
      resultValidar.textContent = "Digite um número de cartão para validar.";
      resultValidar.className   = "result-validar result-validar--neutro";
      return;
    }

    var digits = removerMascara(raw);

    // Verifica se contém apenas dígitos após remover separadores
    if (!/^\d+$/.test(digits)) {
      resultValidar.textContent = "Numero invalido — contém caracteres não numéricos.";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    // Verifica comprimento mínimo e máximo razoáveis para cartões
    if (digits.length < 13 || digits.length > 19) {
      resultValidar.textContent = "Numero invalido — comprimento fora do esperado para cartões (13 a 19 dígitos).";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    var valido      = luhnValido(digits);
    var bandeiraKey = detectarBandeira(digits);
    var nomeBandeira = bandeiraKey ? BANDEIRAS[bandeiraKey].name : "desconhecida";

    if (valido) {
      resultValidar.textContent = "VALIDO por Luhn — Bandeira detectada: " + nomeBandeira;
      resultValidar.className   = "result-validar result-validar--valido";
    } else {
      resultValidar.textContent = "INVALIDO — não passa no algoritmo de Luhn. Bandeira detectada: " + nomeBandeira;
      resultValidar.className   = "result-validar result-validar--invalido";
    }
  }

  function handleLimparValidar() {
    if (inputValidar)  { inputValidar.value  = ""; }
    if (resultValidar) {
      resultValidar.textContent = "";
      resultValidar.className   = "result-validar";
    }
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnGerar.addEventListener("click",        handleGerar);
  btnCopiarNumero.addEventListener("click", handleCopiarNumero);
  btnValidar.addEventListener("click",      handleValidar);

  // Permite validar pressionando Enter no campo de validação
  inputValidar.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { handleValidar(); }
  });

  if (btnLimparValidar) {
    btnLimparValidar.addEventListener("click", handleLimparValidar);
  }

})();
