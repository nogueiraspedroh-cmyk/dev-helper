// js/tools/jwt.js — lógica do JWT Decoder.
// Carregado APENAS em tools/jwt/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value / .textContent e
// createElement — NUNCA innerHTML com dado do usuário.
// IMPORTANTE: esta ferramenta apenas DECODIFICA (Base64URL → JSON). Ela NÃO
// verifica a assinatura do token (isso exige a chave/segredo, indisponível
// num site 100% client-side sem backend).

(function () {
  "use strict";

  // --- Referências ao DOM ---
  var inputEl        = document.getElementById("jwt-input");
  var btnDecode      = document.getElementById("btn-jwt-decode");
  var btnClear       = document.getElementById("btn-jwt-clear");
  var errorEl        = document.getElementById("jwt-error");
  var resultEl       = document.getElementById("jwt-resultado");
  var headerOut      = document.getElementById("jwt-header-output");
  var payloadOut     = document.getElementById("jwt-payload-output");
  var btnCopyHeader  = document.getElementById("btn-jwt-copy-header");
  var btnCopyPayload = document.getElementById("btn-jwt-copy-payload");
  var claimsWrapper  = document.getElementById("jwt-claims-wrapper");
  var claimsBody     = document.getElementById("jwt-claims-body");
  var expBadge       = document.getElementById("jwt-exp-badge");

  // Interrompe silenciosamente se os elementos essenciais não existirem.
  if (
    !inputEl || !btnDecode || !btnClear || !errorEl || !resultEl ||
    !headerOut || !payloadOut || !btnCopyHeader || !btnCopyPayload ||
    !claimsWrapper || !claimsBody || !expBadge
  ) {
    return;
  }

  // --- Utilitários ---

  /**
   * Decodifica uma string Base64URL para texto UTF-8.
   * Lança Error se a string não for Base64 válida.
   */
  function base64UrlDecode(str) {
    // Base64URL → Base64 padrão
    var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Repõe o padding "=" que o Base64URL costuma omitir
    while (b64.length % 4 !== 0) {
      b64 += "=";
    }
    var binary;
    try {
      binary = atob(b64);
    } catch (e) {
      throw new Error("segmento não é Base64URL válido");
    }
    // atob devolve bytes latin1; reinterpretamos como UTF-8.
    try {
      var percent = binary
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("");
      return decodeURIComponent(percent);
    } catch (e) {
      // Se não for UTF-8 válido, devolve o binário cru (melhor que quebrar)
      return binary;
    }
  }

  /** Exibe uma mensagem de erro legível e esconde o resultado. */
  function showError(msg) {
    errorEl.textContent = msg; // textContent — sem risco de XSS
    errorEl.hidden = false;
    resultEl.hidden = true;
  }

  /** Limpa a área de erro. */
  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /** Formata um timestamp UNIX (segundos) em data legível local + UTC. */
  function formatTimestamp(seconds) {
    var d = new Date(seconds * 1000);
    if (isNaN(d.getTime())) return String(seconds);
    return d.toLocaleString() + "  (" + d.toUTCString() + ")";
  }

  var CLAIM_LABELS = {
    exp: "exp (expiração)",
    iat: "iat (emitido em)",
    nbf: "nbf (válido a partir de)"
  };

  /**
   * Monta a tabela de claims temporais (exp/iat/nbf) via createElement.
   * Retorna true se algum claim temporal foi encontrado.
   */
  function renderClaims(payload) {
    // Limpa o corpo da tabela sem innerHTML
    while (claimsBody.firstChild) {
      claimsBody.removeChild(claimsBody.firstChild);
    }

    var temporais = ["iat", "nbf", "exp"];
    var encontrou = false;

    temporais.forEach(function (claim) {
      if (typeof payload[claim] === "undefined") return;
      encontrou = true;

      var valor = payload[claim];
      var tr = document.createElement("tr");

      var tdNome = document.createElement("td");
      tdNome.textContent = CLAIM_LABELS[claim] || claim;
      tr.appendChild(tdNome);

      var tdRaw = document.createElement("td");
      tdRaw.textContent = String(valor);
      tr.appendChild(tdRaw);

      var tdData = document.createElement("td");
      if (typeof valor === "number") {
        tdData.textContent = formatTimestamp(valor);
      } else {
        tdData.textContent = "—";
      }
      tr.appendChild(tdData);

      claimsBody.appendChild(tr);
    });

    // Badge de expiração
    if (typeof payload.exp === "number") {
      var agora = Math.floor(Date.now() / 1000);
      if (payload.exp < agora) {
        expBadge.textContent = "Token EXPIRADO (exp já passou)";
        expBadge.className = "result-validar result-validar--invalido";
      } else {
        expBadge.textContent = "Token dentro da validade (exp no futuro)";
        expBadge.className = "result-validar result-validar--valido";
      }
    } else {
      expBadge.textContent = "Sem claim exp — validade não determinável";
      expBadge.className = "result-validar result-validar--neutro";
    }

    claimsWrapper.hidden = !encontrou && typeof payload.exp !== "number";
    return encontrou;
  }

  /** Decodifica o token e popula a UI. */
  function decode() {
    clearError();
    var token = inputEl.value.trim();

    if (token === "") {
      resultEl.hidden = true;
      return;
    }

    var partes = token.split(".");
    if (partes.length < 2 || partes[0] === "" || partes[1] === "") {
      showError(
        "Token JWT malformado: esperado ao menos 'header.payload' separados por ponto. " +
        "Encontrado " + partes.length + " segmento(s)."
      );
      return;
    }

    var headerObj, payloadObj;

    try {
      headerObj = JSON.parse(base64UrlDecode(partes[0]));
    } catch (e) {
      showError("Não foi possível decodificar o HEADER: " + e.message);
      return;
    }

    try {
      payloadObj = JSON.parse(base64UrlDecode(partes[1]));
    } catch (e) {
      showError("Não foi possível decodificar o PAYLOAD: " + e.message);
      return;
    }

    // Saída via .value (textarea) — nunca innerHTML
    headerOut.value = JSON.stringify(headerObj, null, 2);
    payloadOut.value = JSON.stringify(payloadObj, null, 2);

    if (payloadObj && typeof payloadObj === "object") {
      renderClaims(payloadObj);
    } else {
      claimsWrapper.hidden = true;
    }

    resultEl.hidden = false;
  }

  /** Limpa tudo. */
  function handleClear() {
    inputEl.value = "";
    headerOut.value = "";
    payloadOut.value = "";
    resultEl.hidden = true;
    clearError();
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
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Eventos ---
  btnDecode.addEventListener("click", decode);
  btnClear.addEventListener("click", handleClear);
  inputEl.addEventListener("input", decode); // decodifica ao vivo
  btnCopyHeader.addEventListener("click", function () {
    copyText(headerOut.value, btnCopyHeader);
  });
  btnCopyPayload.addEventListener("click", function () {
    copyText(payloadOut.value, btnCopyPayload);
  });

})();
