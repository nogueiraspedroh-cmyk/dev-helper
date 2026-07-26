// js/tools-en/timestamp.js — Unix Timestamp converter logic (English version).
// Loaded ONLY on en/tools/timestamp/index.html, after js/main.js.
// Mirrors js/tools/timestamp.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access is preceded by a check (if (el)).
// Anti-XSS: output via .value / .textContent / createElement — never innerHTML.
//
// Converts both ways: readable date -> Unix timestamp and
// Unix timestamp -> readable date, with a choice of time zone (local vs UTC)
// and granularity (seconds vs milliseconds).
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — conversions
  // ================================================================

  /**
   * Converts date components into an epoch (ms).
   * @param {number} y year
   * @param {number} mo month 1-12
   * @param {number} d day
   * @param {number} h hour
   * @param {number} mi minute
   * @param {number} s second
   * @param {boolean} asUTC  interprets the components as UTC (true) or as
   *                         local time (false)
   * @returns {number} epoch in milliseconds (NaN if invalid)
   */
  function partsToEpochMs(y, mo, d, h, mi, s, asUTC) {
    if ([y, mo, d, h, mi, s].some(function (v) { return typeof v !== "number" || isNaN(v); })) {
      return NaN;
    }
    if (asUTC) {
      return Date.UTC(y, mo - 1, d, h, mi, s);
    }
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }

  /**
   * Parses a <input type="datetime-local"> value
   * ("YYYY-MM-DDTHH:mm" or "...:ss") into components.
   * @returns {{y,mo,d,h,mi,s}|null}
   */
  function parseDatetimeLocal(value) {
    if (typeof value !== "string") {
      return null;
    }
    var m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) {
      return null;
    }
    return {
      y: parseInt(m[1], 10),
      mo: parseInt(m[2], 10),
      d: parseInt(m[3], 10),
      h: parseInt(m[4], 10),
      mi: parseInt(m[5], 10),
      s: m[6] ? parseInt(m[6], 10) : 0
    };
  }

  /**
   * Converts an epoch (ms) into a textual description in several forms.
   * @returns {{valid:boolean, iso:string, utc:string, local:string, relative:string}}
   */
  function epochMsToDescription(epochMs, nowMs) {
    var date = new Date(epochMs);
    if (isNaN(date.getTime())) {
      return { valid: false, iso: "", utc: "", local: "", relative: "" };
    }
    return {
      valid: true,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: relativeFrom(epochMs, typeof nowMs === "number" ? nowMs : Date.now())
    };
  }

  /** Simple relative description ("3 min ago", "in 2 days"). */
  function relativeFrom(epochMs, nowMs) {
    var diff = epochMs - nowMs; // >0 future, <0 past
    var abs = Math.abs(diff);
    var sec = Math.round(abs / 1000);
    var future = diff >= 0;
    var unit, value;
    if (sec < 60) { value = sec; unit = "second"; }
    else if (sec < 3600) { value = Math.round(sec / 60); unit = "minute"; }
    else if (sec < 86400) { value = Math.round(sec / 3600); unit = "hour"; }
    else if (sec < 2592000) { value = Math.round(sec / 86400); unit = "day"; }
    else if (sec < 31536000) { value = Math.round(sec / 2592000); unit = "month"; }
    else { value = Math.round(sec / 31536000); unit = "year"; }
    var plural = value === 1 ? "" : "s";
    if (value === 0) { return "just now"; }
    return future ? "in " + value + " " + unit + plural : value + " " + unit + plural + " ago";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      partsToEpochMs: partsToEpochMs,
      parseDatetimeLocal: parseDatetimeLocal,
      epochMsToDescription: epochMsToDescription,
      relativeFrom: relativeFrom
    };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  // --- Section A: readable date -> timestamp ---
  var dateInput = document.getElementById("ts-date-input");
  var aOutput = document.getElementById("ts-a-output");
  var aCopy = document.getElementById("btn-ts-a-copy");
  var aError = document.getElementById("ts-a-error");
  var aTzEls = document.getElementsByName("ts-a-tz");
  var aGranEls = document.getElementsByName("ts-a-gran");

  // --- Section B: timestamp -> readable date ---
  var tsInput = document.getElementById("ts-ts-input");
  var bError = document.getElementById("ts-b-error");
  var bGranEls = document.getElementsByName("ts-b-gran");
  var bLocal = document.getElementById("ts-b-local");
  var bUtc = document.getElementById("ts-b-utc");
  var bIso = document.getElementById("ts-b-iso");
  var bRel = document.getElementById("ts-b-rel");

  var btnNow = document.getElementById("btn-ts-now");

  if (
    !dateInput || !aOutput || !aCopy || !aError ||
    !tsInput || !bError || !bLocal || !bUtc || !bIso || !bRel || !btnNow
  ) {
    return;
  }

  function radioValue(nodeList, fallback) {
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].checked) {
        return nodeList[i].value;
      }
    }
    return fallback;
  }

  // --- Section A ---
  function updateA() {
    aError.hidden = true;
    aError.textContent = "";
    var parts = parseDatetimeLocal(dateInput.value);
    if (!parts) {
      aOutput.value = "";
      if (dateInput.value !== "") {
        aError.textContent = "Invalid date/time. Select a complete date.";
        aError.hidden = false;
      }
      return;
    }
    var asUTC = radioValue(aTzEls, "local") === "utc";
    var epochMs = partsToEpochMs(parts.y, parts.mo, parts.d, parts.h, parts.mi, parts.s, asUTC);
    if (isNaN(epochMs)) {
      aOutput.value = "";
      aError.textContent = "Could not convert the given date.";
      aError.hidden = false;
      return;
    }
    var ms = radioValue(aGranEls, "sec") === "ms";
    aOutput.value = ms ? String(epochMs) : String(Math.floor(epochMs / 1000));
  }

  // --- Section B ---
  function updateB() {
    bError.hidden = true;
    bError.textContent = "";
    var raw = tsInput.value.trim();
    if (raw === "") {
      bLocal.textContent = "";
      bUtc.textContent = "";
      bIso.textContent = "";
      bRel.textContent = "";
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      setBEmpty();
      bError.textContent = "Enter an integer (the timestamp).";
      bError.hidden = false;
      return;
    }
    var num = parseInt(raw, 10);
    var ms = radioValue(bGranEls, "sec") === "ms";
    var epochMs = ms ? num : num * 1000;
    var desc = epochMsToDescription(epochMs);
    if (!desc.valid) {
      setBEmpty();
      bError.textContent = "Timestamp out of representable range.";
      bError.hidden = false;
      return;
    }
    bLocal.textContent = desc.local;
    bUtc.textContent = desc.utc;
    bIso.textContent = desc.iso;
    bRel.textContent = desc.relative;
  }

  function setBEmpty() {
    bLocal.textContent = "";
    bUtc.textContent = "";
    bIso.textContent = "";
    bRel.textContent = "";
  }

  // --- "Now" ---
  function fillNow() {
    var now = new Date();
    // Fills the datetime-local input in LOCAL time (the input is always local).
    var pad = function (n) { return ("0" + n).slice(-2); };
    var localValue =
      now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
      "T" + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    dateInput.value = localValue;
    // Since the filled value is local, sets section A's radio button to "local".
    for (var i = 0; i < aTzEls.length; i++) {
      aTzEls[i].checked = aTzEls[i].value === "local";
    }
    updateA();

    // Fills section B with the current timestamp, respecting the granularity.
    var ms = radioValue(bGranEls, "sec") === "ms";
    tsInput.value = ms ? String(now.getTime()) : String(Math.floor(now.getTime() / 1000));
    updateB();
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") { return; }
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
      // silences
    } finally {
      document.body.removeChild(tmp);
    }
  }


  // --- Events ---
  dateInput.addEventListener("input", updateA);
  for (var i = 0; i < aTzEls.length; i++) { aTzEls[i].addEventListener("change", updateA); }
  for (var j = 0; j < aGranEls.length; j++) { aGranEls[j].addEventListener("change", updateA); }
  aCopy.addEventListener("click", function () { copyText(aOutput.value, aCopy); });

  tsInput.addEventListener("input", updateB);
  for (var k = 0; k < bGranEls.length; k++) { bGranEls[k].addEventListener("change", updateB); }

  btnNow.addEventListener("click", fillNow);

  // Initial state: shows "now" to give immediate context.
  fillNow();
})();
