// js/tools/senha.js — lógica do Gerador de Senha.
// Carregado APENAS em tools/senha/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent — nunca innerHTML.
// Aleatoriedade: window.crypto.getRandomValues (CSPRNG), sem Math.random para a senha.

(function () {
  "use strict";

  // ─── Conjuntos de caracteres base ───────────────────────────────────────────

  var CHARS_MAIUSCULAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var CHARS_MINUSCULAS = "abcdefghijklmnopqrstuvwxyz";
  var CHARS_NUMEROS    = "0123456789";
  var CHARS_SIMBOLOS   = "!@#$%^&*()-_=+[]{};:,.<>?";

  // Caracteres ambíguos a remover quando a opção estiver marcada
  var CHARS_AMBIGUOS   = "0Oo1lI";

  // ─── Referências ao DOM ─────────────────────────────────────────────────────

  var comprimentoEl   = document.getElementById("senha-comprimento");
  var rangeEl         = document.getElementById("senha-range");
  var quantidadeEl    = document.getElementById("senha-quantidade");
  var chkMaiusculas   = document.getElementById("chk-maiusculas");
  var chkMinusculas   = document.getElementById("chk-minusculas");
  var chkNumeros      = document.getElementById("chk-numeros");
  var chkSimbolos     = document.getElementById("chk-simbolos");
  var chkAmbiguos     = document.getElementById("chk-ambiguos");
  var btnGerar        = document.getElementById("btn-gerar-senha");
  var btnCopiar       = document.getElementById("btn-copiar-senha");
  var outputEl        = document.getElementById("output-senha");
  var errorEl         = document.getElementById("senha-error");
  var forcaWrapper    = document.getElementById("senha-forca-wrapper");
  var forcaLabel      = document.getElementById("senha-forca-label");
  var forcaBits       = document.getElementById("senha-forca-bits");
  var forcaBarra      = document.getElementById("senha-forca-barra");
  var loteWrapper     = document.getElementById("senha-lote-wrapper");
  var outputLote      = document.getElementById("output-senha-lote");
  var btnCopiarLote   = document.getElementById("btn-copiar-lote");

  // Interrompe silenciosamente se qualquer elemento essencial não existir
  // (quantidade/lote são opcionais — degradam para geração única se ausentes)
  if (
    !comprimentoEl || !rangeEl ||
    !chkMaiusculas || !chkMinusculas || !chkNumeros || !chkSimbolos || !chkAmbiguos ||
    !btnGerar || !btnCopiar ||
    !outputEl || !errorEl ||
    !forcaWrapper || !forcaLabel || !forcaBits || !forcaBarra
  ) {
    return;
  }

  // ─── Verificação de suporte ao CSPRNG ───────────────────────────────────────

  var cryptoOk = (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.getRandomValues === "function"
  );

  // ─── Utilitários ─────────────────────────────────────────────────────────────

  /**
   * Remove da string os caracteres presentes em 'toRemove'.
   * Retorna a string resultante (pode ser vazia).
   */
  function removeChars(str, toRemove) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      if (toRemove.indexOf(str[i]) === -1) {
        result += str[i];
      }
    }
    return result;
  }

  /**
   * Retorna um inteiro criptograficamente seguro em [0, max) sem viés de módulo.
   * Rejeita valores fora do maior múltiplo de 'max' que cabe em Uint32.
   *
   * @param {number} max - limite exclusivo; deve ser <= 2^32
   * @returns {number}
   */
  function cryptoRandBelow(max) {
    if (!cryptoOk) {
      // Fallback degradado (não seguro) — avisado no erro de suporte
      return Math.floor(Math.random() * max);
    }
    // Menor múltiplo de max que é <= 2^32
    var limit = Math.floor(4294967296 / max) * max; // 2^32 = 4294967296
    var buf = new Uint32Array(1);
    var val;
    do {
      window.crypto.getRandomValues(buf);
      val = buf[0];
    } while (val >= limit);
    return val % max;
  }

  /**
   * Embaralha um array IN-PLACE usando Fisher-Yates com CSPRNG.
   * @param {string[]} arr
   */
  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = cryptoRandBelow(i + 1);
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  /**
   * Monta o alfabeto final com base nos checkboxes marcados.
   * Retorna { alfabeto: string, grupos: string[] } onde 'grupos' lista
   * os conjuntos individuais para garantir ao menos 1 caractere de cada.
   * Retorna null se nenhum conjunto estiver selecionado.
   */
  function montarAlfabeto() {
    var grupos = [];
    var evitar = chkAmbiguos.checked ? CHARS_AMBIGUOS : "";

    if (chkMaiusculas.checked) {
      var g = evitar ? removeChars(CHARS_MAIUSCULAS, evitar) : CHARS_MAIUSCULAS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkMinusculas.checked) {
      var g = evitar ? removeChars(CHARS_MINUSCULAS, evitar) : CHARS_MINUSCULAS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkNumeros.checked) {
      var g = evitar ? removeChars(CHARS_NUMEROS, evitar) : CHARS_NUMEROS;
      if (g.length > 0) grupos.push(g);
    }
    if (chkSimbolos.checked) {
      // Símbolos não contêm ambíguos, mas removemos por consistência
      var g = evitar ? removeChars(CHARS_SIMBOLOS, evitar) : CHARS_SIMBOLOS;
      if (g.length > 0) grupos.push(g);
    }

    if (grupos.length === 0) return null;

    // Alfabeto completo (concatenação de todos os grupos)
    var alfabeto = grupos.join("");
    return { alfabeto: alfabeto, grupos: grupos };
  }

  /**
   * Gera uma senha com o comprimento dado, usando os grupos selecionados.
   * Garante ao menos 1 caractere de cada grupo (quando comprimento permite).
   *
   * @param {number} comprimento
   * @param {{ alfabeto: string, grupos: string[] }} config
   * @returns {string}
   */
  function gerarSenha(comprimento, config) {
    var alfabeto = config.alfabeto;
    var grupos   = config.grupos;
    var chars    = [];

    // Garante ao menos 1 de cada grupo (se comprimento >= número de grupos)
    var garantidos = [];
    if (comprimento >= grupos.length) {
      for (var g = 0; g < grupos.length; g++) {
        var grupo = grupos[g];
        garantidos.push(grupo[cryptoRandBelow(grupo.length)]);
      }
    }

    // Preenche o restante com caracteres aleatórios do alfabeto completo
    var restante = comprimento - garantidos.length;
    for (var i = 0; i < restante; i++) {
      chars.push(alfabeto[cryptoRandBelow(alfabeto.length)]);
    }

    // Une garantidos + aleatórios e embaralha
    var todos = garantidos.concat(chars);
    shuffleArray(todos);
    return todos.join("");
  }

  /**
   * Calcula a entropia em bits: comprimento × log2(tamanho do alfabeto).
   * @param {number} comprimento
   * @param {number} tamanhoAlfabeto
   * @returns {number}
   */
  function calcularEntropia(comprimento, tamanhoAlfabeto) {
    if (tamanhoAlfabeto <= 1) return 0;
    return comprimento * (Math.log(tamanhoAlfabeto) / Math.log(2));
  }

  /**
   * Retorna o rótulo de força com base na entropia em bits.
   * @param {number} bits
   * @returns {{ label: string, classe: string, pct: number }}
   */
  function classificarForca(bits) {
    if (bits < 40)  return { label: "Fraca",       classe: "senha-forca--fraca",       pct: 15  };
    if (bits < 60)  return { label: "Média",        classe: "senha-forca--media",       pct: 40  };
    if (bits < 128) return { label: "Forte",        classe: "senha-forca--forte",       pct: 70  };
    return              { label: "Muito forte",  classe: "senha-forca--muito-forte", pct: 100 };
  }

  // ─── Exibição de feedback ────────────────────────────────────────────────────

  /** Exibe uma mensagem de erro na área de erro. */
  function mostrarErro(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg; // textContent — sem risco de XSS
    errorEl.hidden = false;
    if (forcaWrapper) forcaWrapper.style.display = "none";
  }

  /** Limpa a área de erro. */
  function limparErro() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /**
   * Atualiza o indicador de força na UI.
   * @param {number} bits
   */
  function atualizarForca(bits) {
    if (!forcaWrapper || !forcaLabel || !forcaBits || !forcaBarra) return;

    var info = classificarForca(bits);

    // Remove classes de cor anteriores
    forcaLabel.className = "senha-forca-badge " + info.classe;
    forcaLabel.textContent = info.label;

    forcaBits.textContent = bits.toFixed(1) + " bits de entropia";

    forcaBarra.className = "senha-forca-barra " + info.classe;
    forcaBarra.style.width = info.pct + "%";

    forcaWrapper.style.display = "block";
  }

  // ─── Sincronização dos controles de comprimento ──────────────────────────────

  /** Lê e valida o comprimento atual, fixando-o entre 4 e 64. */
  function lerComprimento() {
    var val = parseInt(comprimentoEl.value, 10);
    if (isNaN(val) || val < 4)  val = 4;
    if (val > 64)               val = 64;
    return val;
  }

  comprimentoEl.addEventListener("input", function () {
    var val = lerComprimento();
    if (rangeEl) rangeEl.value = val;
  });

  comprimentoEl.addEventListener("change", function () {
    var val = lerComprimento();
    comprimentoEl.value = val;
    if (rangeEl) rangeEl.value = val;
  });

  if (rangeEl) {
    rangeEl.addEventListener("input", function () {
      var val = parseInt(rangeEl.value, 10);
      if (comprimentoEl) comprimentoEl.value = val;
    });
  }

  /** Lê e valida a quantidade de senhas a gerar, fixando-a entre 1 e 50. */
  function lerQuantidade() {
    if (!quantidadeEl) return 1;
    var val = parseInt(quantidadeEl.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 50)              val = 50;
    return val;
  }

  // ─── Handler principal: Gerar ────────────────────────────────────────────────

  function handleGerar() {
    limparErro();

    if (!cryptoOk) {
      mostrarErro("Seu navegador não suporta window.crypto.getRandomValues. Use um navegador moderno.");
      return;
    }

    var comprimento = lerComprimento();
    // Sincroniza os campos de UI com o valor validado
    comprimentoEl.value = comprimento;
    if (rangeEl) rangeEl.value = comprimento;

    var quantidade = lerQuantidade();
    if (quantidadeEl) quantidadeEl.value = quantidade;

    var config = montarAlfabeto();
    if (!config) {
      mostrarErro("Selecione ao menos um conjunto de caracteres (maiúsculas, minúsculas, números ou símbolos).");
      if (outputEl) outputEl.value = "";
      if (loteWrapper) loteWrapper.hidden = true;
      return;
    }

    if (quantidade > 1 && outputLote && loteWrapper) {
      var senhas = [];
      for (var i = 0; i < quantidade; i++) {
        senhas.push(gerarSenha(comprimento, config));
      }
      outputLote.value = senhas.join("\n");
      loteWrapper.hidden = false;
      if (outputEl) outputEl.value = senhas[0];
    } else {
      if (loteWrapper) loteWrapper.hidden = true;
      var senha = gerarSenha(comprimento, config);
      if (outputEl) outputEl.value = senha;
    }

    var entropia = calcularEntropia(comprimento, config.alfabeto.length);
    atualizarForca(entropia);
  }

  // ─── Handler: Copiar ─────────────────────────────────────────────────────────

  function handleCopiar() {
    if (!outputEl) return;
    var texto = outputEl.value;
    if (texto === "") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        window.DevHelper.flashButton(btnCopiar, "Copiado!");
      }).catch(function () {
        fallbackCopy(texto);
      });
    } else {
      fallbackCopy(texto);
    }
  }

  /**
   * Fallback de cópia via elemento temporário + execCommand.
   * Usado em contextos sem Clipboard API (HTTP não-seguro, browsers antigos).
   */
  function fallbackCopy(texto) {
    var tmp = document.createElement("textarea");
    tmp.value = texto;
    tmp.style.position = "fixed";
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopiar, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  /** Copia todas as senhas do lote, uma por linha. */
  function handleCopiarLote() {
    if (!outputLote) return;
    var texto = outputLote.value;
    if (texto === "") return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        window.DevHelper.flashButton(btnCopiarLote, "Copiado!");
      }).catch(function () {
        fallbackCopyEl(outputLote, btnCopiarLote);
      });
    } else {
      fallbackCopyEl(outputLote, btnCopiarLote);
    }
  }

  /** Fallback de cópia selecionando o próprio elemento (evita duplicar o texto num textarea temporário). */
  function fallbackCopyEl(el, btn) {
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    }
  }

  // ─── Registro de eventos ──────────────────────────────────────────────────────

  btnGerar.addEventListener("click", handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  if (btnCopiarLote) btnCopiarLote.addEventListener("click", handleCopiarLote);

  // Gera automaticamente ao carregar a página para o usuário ter uma senha imediatamente
  handleGerar();

})();
