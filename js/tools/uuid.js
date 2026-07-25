// js/tools/uuid.js — lógica do Gerador de UUID (v4).
// Carregado APENAS em tools/uuid/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent e
// createElement — NUNCA innerHTML com dado do usuário.
// Aleatoriedade: crypto.randomUUID quando disponível; fallback via
// crypto.getRandomValues (ambos CSPRNG). Sem Math.random.

(function () {
  "use strict";

  // --- Referências ao DOM ---
  var qtdEl        = document.getElementById("uuid-quantidade");
  var chkHifens    = document.getElementById("uuid-hifens");
  var chkMaiusculo = document.getElementById("uuid-maiusculo");
  var btnGerar     = document.getElementById("btn-uuid-gerar");
  var btnCopiarTodos = document.getElementById("btn-uuid-copiar-todos");
  var listaEl      = document.getElementById("uuid-lista");
  var errorEl      = document.getElementById("uuid-error");

  if (
    !qtdEl || !chkHifens || !chkMaiusculo ||
    !btnGerar || !btnCopiarTodos || !listaEl || !errorEl
  ) {
    return;
  }

  var MAX_QTD = 100;

  var cryptoOk = (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.getRandomValues === "function"
  );

  // --- Geração ---

  /**
   * Gera um UUID v4. Usa crypto.randomUUID se disponível; caso contrário,
   * monta a partir de getRandomValues (16 bytes, com bits de versão/variante).
   */
  function gerarUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    // Fallback: 16 bytes aleatórios criptográficos
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    // Versão 4 (bits 12-15 do time_hi_and_version)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Variante RFC 4122 (bits 6-7 do clock_seq_hi_and_reserved)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var i = 0; i < 16; i++) {
      hex.push(("0" + bytes[i].toString(16)).slice(-2));
    }
    return (
      hex.slice(0, 4).join("") + "-" +
      hex.slice(4, 6).join("") + "-" +
      hex.slice(6, 8).join("") + "-" +
      hex.slice(8, 10).join("") + "-" +
      hex.slice(10, 16).join("")
    );
  }

  /** Aplica as opções de formatação (hífens, caixa) ao UUID. */
  function formatar(uuid) {
    var out = uuid;
    if (!chkHifens.checked) {
      out = out.replace(/-/g, "");
    }
    if (chkMaiusculo.checked) {
      out = out.toUpperCase();
    } else {
      out = out.toLowerCase();
    }
    return out;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /** Lê e valida a quantidade, fixando entre 1 e MAX_QTD. */
  function lerQuantidade() {
    var val = parseInt(qtdEl.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > MAX_QTD) val = MAX_QTD;
    return val;
  }

  /**
   * Monta uma linha da lista (input readonly + botão copiar) via createElement.
   * @param {string} valor
   */
  function criarLinha(valor) {
    var linha = document.createElement("div");
    linha.className = "uuid-item";

    var campo = document.createElement("input");
    campo.type = "text";
    campo.readOnly = true;
    campo.className = "tool__result-input uuid-item__input";
    campo.value = valor; // .value — sem risco de XSS
    campo.setAttribute("spellcheck", "false");
    linha.appendChild(campo);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button--secondary uuid-item__copy";
    btn.textContent = "Copiar";
    btn.addEventListener("click", function () {
      copyText(valor, btn);
    });
    linha.appendChild(btn);

    return linha;
  }

  function handleGerar() {
    clearError();

    if (!cryptoOk) {
      showError("Seu navegador não suporta a Web Crypto API. Use um navegador moderno.");
      return;
    }

    var qtd = lerQuantidade();
    qtdEl.value = qtd; // sincroniza o campo com o valor validado

    // Limpa a lista atual sem innerHTML
    while (listaEl.firstChild) {
      listaEl.removeChild(listaEl.firstChild);
    }

    for (var i = 0; i < qtd; i++) {
      var valor = formatar(gerarUuid());
      listaEl.appendChild(criarLinha(valor));
    }

    btnCopiarTodos.hidden = qtd < 2;
  }

  /** Coleta todos os UUIDs da lista, um por linha. */
  function coletarTodos() {
    var inputs = listaEl.querySelectorAll(".uuid-item__input");
    var vals = [];
    Array.prototype.forEach.call(inputs, function (el) {
      vals.push(el.value);
    });
    return vals.join("\n");
  }

  function handleCopiarTodos() {
    var texto = coletarTodos();
    copyText(texto, btnCopiarTodos);
  }

  // --- Cópia com fallback ---
  function copyText(text, btn) {
    if (text === "") return;
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
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  btnGerar.addEventListener("click", handleGerar);
  btnCopiarTodos.addEventListener("click", handleCopiarTodos);
  // Regera ao mudar opções de formatação (se já houver algo gerado)
  chkHifens.addEventListener("change", function () {
    if (listaEl.firstChild) handleGerar();
  });
  chkMaiusculo.addEventListener("change", function () {
    if (listaEl.firstChild) handleGerar();
  });

  // Gera um UUID inicial ao carregar
  handleGerar();

})();
