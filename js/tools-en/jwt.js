// js/tools-en/jwt.js — logic for the JWT Decoder (English version).
// Loaded ONLY on en/tools/jwt/index.html, after js/main.js.
// Mirrors js/tools/jwt.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output inserted exclusively via .value / .textContent and
// createElement — NEVER innerHTML with user data.
// IMPORTANT: this tool only DECODES (Base64URL → JSON). It does NOT verify
// the token's signature (that requires the key/secret, unavailable on a
// 100% client-side site without a backend).

(function () {
  "use strict";

  // --- DOM references ---
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

  // Stops silently if essential elements do not exist.
  if (
    !inputEl || !btnDecode || !btnClear || !errorEl || !resultEl ||
    !headerOut || !payloadOut || !btnCopyHeader || !btnCopyPayload ||
    !claimsWrapper || !claimsBody || !expBadge
  ) {
    return;
  }

  // --- Utilities ---

  /**
   * Decodes a Base64URL string to UTF-8 text.
   * Throws an Error if the string is not valid Base64.
   */
  function base64UrlDecode(str) {
    // Base64URL → standard Base64
    var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Restores the "=" padding that Base64URL usually omits
    while (b64.length % 4 !== 0) {
      b64 += "=";
    }
    var binary;
    try {
      binary = atob(b64);
    } catch (e) {
      throw new Error("segment is not valid Base64URL");
    }
    // atob returns latin1 bytes; reinterpret as UTF-8.
    try {
      var percent = binary
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("");
      return decodeURIComponent(percent);
    } catch (e) {
      // If not valid UTF-8, returns the raw binary (better than breaking)
      return binary;
    }
  }

  /** Displays a readable error message and hides the result. */
  function showError(msg) {
    errorEl.textContent = msg; // textContent — no XSS risk
    errorEl.hidden = false;
    resultEl.hidden = true;
  }

  /** Clears the error area. */
  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  /** Formats a UNIX timestamp (seconds) as a readable local + UTC date. */
  function formatTimestamp(seconds) {
    var d = new Date(seconds * 1000);
    if (isNaN(d.getTime())) return String(seconds);
    return d.toLocaleString() + "  (" + d.toUTCString() + ")";
  }

  var CLAIM_LABELS = {
    exp: "exp (expiration)",
    iat: "iat (issued at)",
    nbf: "nbf (valid from)"
  };

  /**
   * Builds the time-based claims table (exp/iat/nbf) via createElement.
   * Returns true if any time-based claim was found.
   */
  function renderClaims(payload) {
    // Clears the table body without innerHTML
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

    // Expiration badge
    if (typeof payload.exp === "number") {
      var agora = Math.floor(Date.now() / 1000);
      if (payload.exp < agora) {
        expBadge.textContent = "Token EXPIRED (exp has already passed)";
        expBadge.className = "result-validar result-validar--invalido";
      } else {
        expBadge.textContent = "Token within validity (exp in the future)";
        expBadge.className = "result-validar result-validar--valido";
      }
    } else {
      expBadge.textContent = "No exp claim — validity cannot be determined";
      expBadge.className = "result-validar result-validar--neutro";
    }

    claimsWrapper.hidden = !encontrou && typeof payload.exp !== "number";
    return encontrou;
  }

  /** Decodes the token and populates the UI. */
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
        "Malformed JWT token: expected at least 'header.payload' separated by a dot. " +
        "Found " + partes.length + " segment(s)."
      );
      return;
    }

    var headerObj, payloadObj;

    try {
      headerObj = JSON.parse(base64UrlDecode(partes[0]));
    } catch (e) {
      showError("Could not decode the HEADER: " + e.message);
      return;
    }

    try {
      payloadObj = JSON.parse(base64UrlDecode(partes[1]));
    } catch (e) {
      showError("Could not decode the PAYLOAD: " + e.message);
      return;
    }

    // Output via .value (textarea) — never innerHTML
    headerOut.value = JSON.stringify(headerObj, null, 2);
    payloadOut.value = JSON.stringify(payloadObj, null, 2);

    if (payloadObj && typeof payloadObj === "object") {
      renderClaims(payloadObj);
    } else {
      claimsWrapper.hidden = true;
    }

    resultEl.hidden = false;
  }

  /** Clears everything. */
  function handleClear() {
    inputEl.value = "";
    headerOut.value = "";
    payloadOut.value = "";
    resultEl.hidden = true;
    clearError();
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") return;
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
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copied!");
    } catch (e) {
      // Silences — the user can copy manually
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  btnDecode.addEventListener("click", decode);
  btnClear.addEventListener("click", handleClear);
  inputEl.addEventListener("input", decode); // decodes live
  btnCopyHeader.addEventListener("click", function () {
    copyText(headerOut.value, btnCopyHeader);
  });
  btnCopyPayload.addEventListener("click", function () {
    copyText(payloadOut.value, btnCopyPayload);
  });

})();
