// js/tools-en/conta-bancaria.js — Bank Account (Brazil) Generator and Validator (English version).
// Loaded ONLY on en/tools/conta-bancaria/index.html, after js/main.js.
// Mirrors js/tools/conta-bancaria.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .textContent/.value — never innerHTML.
//
// COMPLIANCE NOTICE:
//   The generated data (branch, account, operation) is FICTITIOUS and intended
//   EXCLUSIVELY for software testing. It does not correspond to real accounts
//   at any financial institution.
//
// NOTICE ABOUT THE DV RULES:
//   The check digits are calculated using the publicly documented modulo-11
//   algorithm for each bank. This implementation may differ from each
//   institution's internal/official rule — there is no official public test
//   vector available. Assumptions are documented in the comments for each bank.

(function () {
  "use strict";

  // ─── Utilities ───────────────────────────────────────────────────────────────

  /** Returns a random integer in [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Returns a random non-zero digit (1–9). */
  function randDigitNZ() {
    return randInt(1, 10);
  }

  /** Returns a random digit (0–9). */
  function randDigit() {
    return randInt(0, 10);
  }

  /**
   * Generates a random digit string with the specified length.
   * The first digit is always non-zero (avoids accounts that start with 0).
   *
   * @param {number} len - desired length
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
   * Applies modulo-11 weights over an array of digits (left to right),
   * walking them from right to left with weights starting at 2 and
   * cycling according to the provided weights array.
   *
   * Standard rule (modulo 11):
   *   sum = Σ (digit[i] * weight[i])
   *   remainder = sum % 11
   *   DV = 11 - remainder
   *
   * Handling of DV == 10 and DV == 11 varies by bank — the caller decides.
   *
   * @param {string} digits - digit string to calculate over
   * @param {number[]} pesos - array of weights, applied right to left,
   *                           cycling if there are more digits than weights.
   * @returns {number} result of 11 - (sum % 11), which can be 1..11.
   */
  function calcMod11(digits, pesos) {
    var soma = 0;
    var pi = 0; // index in the weights array
    // Walk from right to left
    for (var i = digits.length - 1; i >= 0; i--) {
      soma += parseInt(digits[i], 10) * pesos[pi % pesos.length];
      pi++;
    }
    var resto = soma % 11;
    return 11 - resto; // caller handles cases 10 and 11
  }

  // ─── BANCO DO BRASIL ─────────────────────────────────────────────────────────
  //
  // Source: Banco do Brasil's public documentation (billing convention).
  // ASSUMPTION: the rule described here is based on third-party material and
  // the specification provided for this implementation. BB may use internal
  // variations not publicly documented.
  //
  // ACCOUNT (up to 8 digits + 1 DV):
  //   - Weights from the right: 2, 3, 4, 5, 6, 7, 8, 9 (cycling if > 8 digits).
  //   - remainder = sum % 11
  //   - DV = 11 - remainder
  //   - If DV == 10 → "X"
  //   - If DV == 11 → 0
  //
  // BRANCH (4 digits + 1 DV):
  //   - Weights from the right: 2, 3, 4, 5 (cycling).
  //   - Same 10→"X", 11→0 rule.

  var BB_PESOS_CONTA   = [2, 3, 4, 5, 6, 7, 8, 9];
  var BB_PESOS_AGENCIA = [2, 3, 4, 5];

  /**
   * Calculates the DV of a Banco do Brasil account or branch.
   * @param {string} digits
   * @param {number[]} pesos
   * @returns {string} - "0".."9" or "X"
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

    // Account base: 8 digits
    var ctBase = randDigits(8);
    var ctDV   = dvBB(ctBase, BB_PESOS_CONTA);

    return {
      banco:    "Banco do Brasil",
      agencia:  agBase + "-" + agDV,
      conta:    ctBase + "-" + ctDV,
      operacao: null, // BB doesn't use operation
      // raw values for validation
      _agBase: agBase,
      _agDV:   agDV,
      _ctBase: ctBase,
      _ctDV:   ctDV
    };
  }

  /**
   * Validates a Banco do Brasil branch and account.
   * Returns { valido, mensagem }.
   */
  function validarBB(agenciaRaw, contaRaw) {
    // Removes the mask: keeps digits and "X"
    var ag = agenciaRaw.replace(/[^0-9X]/gi, "").toUpperCase();
    var ct = contaRaw.replace(/[^0-9X]/gi, "").toUpperCase();

    // Branch: 4 base + 1 DV = 5 total characters
    if (ag.length !== 5) {
      return { valido: false, mensagem: "Invalid branch — expected 4 digits + 1 DV (5 characters total, e.g., 12345 or 1234X)." };
    }
    var agBase = ag.slice(0, 4);
    var agDVIn = ag.slice(4);
    if (!/^\d{4}$/.test(agBase)) {
      return { valido: false, mensagem: "Invalid branch — the first 4 characters must be digits." };
    }
    var agDVEsp = dvBB(agBase, BB_PESOS_AGENCIA);
    if (agDVIn !== agDVEsp) {
      return {
        valido: false,
        mensagem: "INVALID — incorrect branch DV. Expected: " + agDVEsp + ", received: " + agDVIn + "."
      };
    }

    // Account: 1..8 base + 1 DV
    if (ct.length < 2 || ct.length > 9) {
      return { valido: false, mensagem: "Invalid account — expected up to 8 digits + 1 DV (2 to 9 characters total)." };
    }
    var ctBase = ct.slice(0, ct.length - 1);
    var ctDVIn = ct.slice(-1);
    if (!/^\d+$/.test(ctBase)) {
      return { valido: false, mensagem: "Invalid account — the base digits must be numeric." };
    }
    var ctDVEsp = dvBB(ctBase, BB_PESOS_CONTA);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALID — incorrect account DV. Expected: " + ctDVEsp + ", received: " + ctDVIn + "."
      };
    }

    return { valido: true, mensagem: "VALID — branch and account DV match under the modulo-11 rule (Banco do Brasil)." };
  }

  // ─── BRADESCO ─────────────────────────────────────────────────────────────────
  //
  // Source: Bradesco's public billing/boleto documentation.
  // ASSUMPTION: the described rule is the one widely cited in third-party material.
  // Bradesco may have internal variations (e.g., special accounts) not covered.
  //
  // ACCOUNT (7 digits + 1 DV):
  //   - Weights from the right: 2, 3, 4, 5, 6, 7 (cycling).
  //   - remainder = sum % 11
  //   - DV = 11 - remainder
  //   - If DV == 11 → 0
  //   - If DV == 10 → "P"  (letter P — Bradesco's standard for this case)
  //
  // BRANCH (4 digits + 1 DV):
  //   - Weights from the right: 2, 3, 4, 5 (cycling).
  //   - Same 11→0, 10→"P" rule.

  var BRA_PESOS_CONTA   = [2, 3, 4, 5, 6, 7];
  var BRA_PESOS_AGENCIA = [2, 3, 4, 5];

  /**
   * Calculates the DV of a Bradesco account or branch.
   * @param {string} digits
   * @param {number[]} pesos
   * @returns {string} - "0".."9" or "P"
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
   * Validates a Bradesco branch and account.
   * Returns { valido, mensagem }.
   */
  function validarBradesco(agenciaRaw, contaRaw) {
    var ag = agenciaRaw.replace(/[^0-9P]/gi, "").toUpperCase();
    var ct = contaRaw.replace(/[^0-9P]/gi, "").toUpperCase();

    // Branch: 4 base + 1 DV = 5 characters
    if (ag.length !== 5) {
      return { valido: false, mensagem: "Invalid branch — expected 4 digits + 1 DV (5 characters, e.g., 12345 or 1234P)." };
    }
    var agBase = ag.slice(0, 4);
    var agDVIn = ag.slice(4);
    if (!/^\d{4}$/.test(agBase)) {
      return { valido: false, mensagem: "Invalid branch — the first 4 characters must be digits." };
    }
    var agDVEsp = dvBradesco(agBase, BRA_PESOS_AGENCIA);
    if (agDVIn !== agDVEsp) {
      return {
        valido: false,
        mensagem: "INVALID — incorrect branch DV. Expected: " + agDVEsp + ", received: " + agDVIn + "."
      };
    }

    // Account: 7 base + 1 DV = 8 characters
    if (ct.length !== 8) {
      return { valido: false, mensagem: "Invalid account — expected 7 digits + 1 DV (8 characters total)." };
    }
    var ctBase = ct.slice(0, 7);
    var ctDVIn = ct.slice(7);
    if (!/^\d{7}$/.test(ctBase)) {
      return { valido: false, mensagem: "Invalid account — the first 7 characters must be digits." };
    }
    var ctDVEsp = dvBradesco(ctBase, BRA_PESOS_CONTA);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALID — incorrect account DV. Expected: " + ctDVEsp + ", received: " + ctDVIn + "."
      };
    }

    return { valido: true, mensagem: "VALID — branch and account DV match under the modulo-11 rule (Bradesco)." };
  }

  // ─── CAIXA ECONÔMICA FEDERAL ─────────────────────────────────────────────────
  //
  // NOTICE: Caixa Econômica Federal is the bank with the LEAST publicly
  // standardized DV rule. The Caixa account uses an "operation" (product/account
  // type code) that is part of the DV calculation. The implementation below is
  // the most commonly cited APPROXIMATION in public third-party material; it may
  // not exactly match Caixa's official internal rule for every account type.
  //
  // ASSUMPTION: modulo 11 is applied over the concatenation (operation +
  // 8-digit account), walking right to left with cycling weights 2,3,4,5,6,7,8,9.
  // If DV == 10 or DV == 11 → DV = 0.
  //
  // ACCOUNT (3-digit operation + 8-digit account + 1 DV):
  //   - The DV is calculated over (operation + account), not separately.
  //
  // Representative operations used for generation (non-exhaustive list; based
  // on public third-party material):
  //   001 — Individual checking account
  //   013 — Individual savings account
  //   023 — Caixa Fácil account
  //   1288 — Special checking account (4 digits — ASSUMPTION: some materials
  //           list 4-digit operations; we adopt 3 for the MVP since it is the
  //           most common format in the available public documents).
  //
  // For the MVP, we use 3-digit operations (001, 013, 023).
  //
  // Caixa BRANCH: 4 digits with no DV (Caixa does not use a branch DV in the
  // most common format — ASSUMPTION based on third-party material; may vary by
  // account type/agreement).

  var CEF_PESOS_CONTA = [2, 3, 4, 5, 6, 7, 8, 9];
  var CEF_OPERACOES   = ["001", "013", "023"];

  /**
   * Calculates the Caixa account DV over the operation+account concatenation.
   * @param {string} opConta - concatenation of operation + account (without DV)
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
      agencia:  agBase, // no DV (see assumption above)
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
   * Validates a Caixa account (operation + account).
   * Returns { valido, mensagem }.
   */
  function validarCaixa(agenciaRaw, contaRaw, operacaoRaw) {
    // Branch: 4 digits, no DV
    var ag = agenciaRaw.replace(/\D/g, "");
    if (ag.length !== 4) {
      return { valido: false, mensagem: "Invalid branch — expected exactly 4 digits (Caixa doesn't use a branch DV in this format)." };
    }

    // Operation: 3 digits
    var op = operacaoRaw.replace(/\D/g, "");
    if (op.length !== 3) {
      return { valido: false, mensagem: "Invalid operation — expected exactly 3 digits (e.g., 001, 013, 023)." };
    }

    // Account: 8 base + 1 DV = 9 characters
    var ct = contaRaw.replace(/\D/g, "");
    if (ct.length !== 9) {
      return { valido: false, mensagem: "Invalid account — expected 8 digits + 1 DV (9 characters total)." };
    }
    var ctBase = ct.slice(0, 8);
    var ctDVIn = ct.slice(8);
    if (!/^\d{8}$/.test(ctBase)) {
      return { valido: false, mensagem: "Invalid account — the first 8 characters must be digits." };
    }
    var ctDVEsp = dvCaixa(op + ctBase);
    if (ctDVIn !== ctDVEsp) {
      return {
        valido: false,
        mensagem: "INVALID — incorrect account DV. Expected: " + ctDVEsp + ", received: " + ctDVIn +
                  ". (DV calculated over operation + account using Caixa's modulo-11 approximation.)"
      };
    }

    return {
      valido: true,
      mensagem: "VALID — account DV matches the modulo-11 approximation (Caixa Econômica Federal). " +
                "Note: Caixa's rule is the least publicly standardized — this result does not guarantee official validity."
    };
  }

  // ─── Dispatch by bank ──────────────────────────────────────────────────────────

  var BANCOS = {
    bb:        { nome: "Banco do Brasil",      gerar: gerarBB,       validar: validarBB },
    bradesco:  { nome: "Bradesco",             gerar: gerarBradesco, validar: validarBradesco },
    caixa:     { nome: "Caixa Economica Federal", gerar: gerarCaixa, validar: validarCaixa }
  };

  // ─── DOM references ──────────────────────────────────────────────────────────

  var bancoSelect      = document.getElementById("banco-select");
  var btnGerar         = document.getElementById("btn-gerar-conta");

  // Generator output
  var resultadoDiv     = document.getElementById("conta-resultado");
  var outBanco         = document.getElementById("out-banco");
  var outAgencia       = document.getElementById("out-agencia");
  var outOperacao      = document.getElementById("out-operacao");
  var outConta         = document.getElementById("out-conta");
  var rowOperacao      = document.getElementById("row-operacao");
  var btnCopiar        = document.getElementById("btn-copiar-conta");

  // Validation
  var validBancoSelect  = document.getElementById("valid-banco-select");
  var validAgencia      = document.getElementById("valid-agencia");
  var validOperacao     = document.getElementById("valid-operacao");
  var validConta        = document.getElementById("valid-conta");
  var rowValidOperacao  = document.getElementById("row-valid-operacao");
  var btnValidar        = document.getElementById("btn-validar-conta");
  var btnLimpar         = document.getElementById("btn-limpar-conta");
  var resultValidar     = document.getElementById("result-validar-conta");

  // Guard — silently stops if essential elements don't exist
  if (
    !bancoSelect || !btnGerar || !resultadoDiv ||
    !outBanco || !outAgencia || !outConta || !btnCopiar ||
    !validBancoSelect || !validAgencia || !validConta ||
    !btnValidar || !resultValidar
  ) {
    return;
  }

  // ─── Internal state ──────────────────────────────────────────────────────────

  /** Last generated data, used by the Copy button */
  var ultimoGerado = null;

  // ─── UI helpers ──────────────────────────────────────────────────────────────

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

  /**
   * Shows or hides the operation row in the validation panel,
   * depending on the selected bank.
   */
  function atualizarCamposValidacao() {
    if (!validBancoSelect || !rowValidOperacao) { return; }
    var banco = validBancoSelect.value;
    // Operation is exclusive to Caixa
    rowValidOperacao.hidden = (banco !== "caixa");
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    var chave = bancoSelect ? bancoSelect.value : "bb";
    var banco = BANCOS[chave];
    if (!banco) { return; }

    var dados = banco.gerar();
    ultimoGerado = dados;

    // Shows the bank
    if (outBanco) { outBanco.textContent = dados.banco; }

    // Shows the branch
    if (outAgencia) { outAgencia.textContent = dados.agencia; }

    // Shows the operation (Caixa only)
    if (rowOperacao) {
      rowOperacao.hidden = (dados.operacao === null);
    }
    if (outOperacao && dados.operacao !== null) {
      outOperacao.textContent = dados.operacao;
    }

    // Shows the account
    if (outConta) { outConta.textContent = dados.conta; }

    // Shows the result block
    if (resultadoDiv) { resultadoDiv.hidden = false; }
  }

  function handleCopiar() {
    if (!ultimoGerado) { return; }
    var d = ultimoGerado;
    var texto;
    if (d.operacao) {
      texto = "Bank: " + d.banco + "\nBranch: " + d.agencia +
              "\nOperation: " + d.operacao + "\nAccount: " + d.conta;
    } else {
      texto = "Bank: " + d.banco + "\nBranch: " + d.agencia +
              "\nAccount: " + d.conta;
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
      resultValidar.textContent = "Invalid bank.";
      resultValidar.className   = "result-validar result-validar--invalido";
      return;
    }

    var agVal = validAgencia ? validAgencia.value.trim() : "";
    var ctVal = validConta ? validConta.value.trim() : "";

    if (!agVal || !ctVal) {
      resultValidar.textContent = "Fill in the branch and the account to validate.";
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

  // ─── Event registration ──────────────────────────────────────────────────────

  btnGerar.addEventListener("click",  handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  btnValidar.addEventListener("click", handleValidar);

  if (btnLimpar) {
    btnLimpar.addEventListener("click", handleLimpar);
  }

  if (validBancoSelect) {
    validBancoSelect.addEventListener("change", atualizarCamposValidacao);
  }

  // Initializes the visibility of the validation fields
  atualizarCamposValidacao();

  // Allow validating by pressing Enter in the validation fields
  function onEnterValidar(e) {
    if (e.key === "Enter") { handleValidar(); }
  }
  if (validAgencia)  { validAgencia.addEventListener("keydown",  onEnterValidar); }
  if (validOperacao) { validOperacao.addEventListener("keydown", onEnterValidar); }
  if (validConta)    { validConta.addEventListener("keydown",    onEnterValidar); }

})();
