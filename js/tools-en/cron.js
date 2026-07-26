// js/tools-en/cron.js — Cron builder/explainer (5 fields) (English version).
// Loaded ONLY on en/tools/cron/index.html, after js/main.js.
// Mirrors js/tools/cron.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access checks if (el).
// Anti-XSS: output via .textContent / createElement — never innerHTML.
//
// Fields: minute hour day-of-month month day-of-week. Supports *, lists (1,2,3),
// ranges (1-5) and steps (*/5, 1-30/5). Out of scope: seconds field and
// spelled-out names (MON/JAN) — numbers only.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — parsing, description and next run times
  // ================================================================

  var FIELDS = [
    { name: "minute", min: 0, max: 59 },
    { name: "hour", min: 0, max: 23 },
    { name: "day of month", min: 1, max: 31 },
    { name: "month", min: 1, max: 12 },
    { name: "day of week", min: 0, max: 6 }
  ];

  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"];

  // Converts a cron field into a sorted list of valid values.
  function parseField(spec, min, max) {
    spec = String(spec).trim();
    if (spec === "") { throw new Error("empty field"); }
    var set = {};
    var parts = spec.split(",");
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p].trim();
      var step = 1;
      var slash = part.indexOf("/");
      if (slash !== -1) {
        step = parseInt(part.slice(slash + 1), 10);
        part = part.slice(0, slash);
        if (!isFinite(step) || step < 1) { throw new Error("invalid step in \"" + parts[p] + "\""); }
      }
      var lo, hi;
      if (part === "*") {
        lo = min; hi = max;
      } else if (part.indexOf("-") !== -1) {
        var seg = part.split("-");
        lo = parseInt(seg[0], 10);
        hi = parseInt(seg[1], 10);
      } else {
        lo = parseInt(part, 10);
        hi = slash !== -1 ? max : lo; // "a/n" => a..max
      }
      if (!isFinite(lo) || !isFinite(hi)) { throw new Error("invalid value in \"" + parts[p] + "\""); }
      if (lo < min || hi > max || lo > hi) {
        throw new Error("value out of range (" + min + "-" + max + ") in \"" + parts[p] + "\"");
      }
      for (var v = lo; v <= hi; v += step) { set[v] = true; }
    }
    var out = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    return out;
  }

  // Metadata of a field for the description (is it "*"? a pure step "*/n"?).
  function fieldMeta(spec, min, max) {
    spec = String(spec).trim();
    var isEvery = spec === "*";
    var pureStep = null;
    var m = /^\*\/(\d+)$/.exec(spec);
    if (m) { pureStep = parseInt(m[1], 10); }
    return {
      spec: spec,
      values: parseField(spec, min, max),
      isEvery: isEvery,
      pureStep: pureStep
    };
  }

  function two(n) { return (n < 10 ? "0" : "") + n; }

  function joinList(arr, mapFn) {
    var items = arr.map(mapFn);
    if (items.length === 1) { return items[0]; }
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  // Generates a human-readable English description from the 5 fields.
  function describe(expr) {
    var fields = tokenize(expr);
    var mi = fieldMeta(fields[0], 0, 59);
    var ho = fieldMeta(fields[1], 0, 23);
    var dom = fieldMeta(fields[2], 1, 31);
    var mo = fieldMeta(fields[3], 1, 12);
    var dow = fieldMeta(fields[4], 0, 6);

    var timePart;
    if (mi.pureStep && ho.isEvery) {
      timePart = "Every " + mi.pureStep + " minute(s)";
    } else if (mi.isEvery && ho.isEvery) {
      timePart = "Every minute";
    } else if (mi.values.length === 1 && ho.values.length === 1) {
      timePart = "At " + two(ho.values[0]) + ":" + two(mi.values[0]);
    } else if (mi.values.length === 1 && ho.isEvery) {
      timePart = "At minute " + mi.values[0] + " past every hour";
    } else if (mi.values.length === 1) {
      timePart = "At minute " + mi.values[0] + " past hours " + joinList(ho.values, String);
    } else if (ho.values.length === 1) {
      timePart = "At minutes " + joinList(mi.values, String) + " past hour " + two(ho.values[0]);
    } else {
      timePart = "At minutes " + joinList(mi.values, String) +
        " past hours " + joinList(ho.values, String);
    }

    var dayParts = [];
    if (!dom.isEvery) {
      if (dom.pureStep) {
        dayParts.push("every " + dom.pureStep + " day(s) of the month");
      } else {
        dayParts.push("on day(s) " + joinList(dom.values, String) + " of the month");
      }
    }
    if (!dow.isEvery) {
      dayParts.push("on " + joinList(dow.values, function (d) { return WEEKDAYS[d]; }));
    }

    var monthPart = "";
    if (!mo.isEvery) {
      monthPart = " in " + joinList(mo.values, function (m2) { return MONTHS[m2 - 1]; });
    }

    var out = timePart;
    if (dayParts.length) { out += ", " + dayParts.join(", "); }
    out += monthPart;
    if (dom.isEvery && dow.isEvery && mo.isEvery) { out += ", every day"; }
    return out + ".";
  }

  function tokenize(expr) {
    var fields = String(expr).trim().split(/\s+/);
    if (fields.length !== 5) {
      throw new Error("The cron expression must have exactly 5 fields (minute hour day-of-month month day-of-week). Received: " + fields.length + ".");
    }
    // Validates each field (throws if invalid).
    for (var i = 0; i < 5; i++) {
      parseField(fields[i], FIELDS[i].min, FIELDS[i].max);
    }
    return fields;
  }

  // Calculates the next N run times from `from` (Date), local time.
  function nextRuns(expr, from, count) {
    var fields = tokenize(expr);
    var minutes = parseField(fields[0], 0, 59);
    var hours = parseField(fields[1], 0, 23);
    var doms = parseField(fields[2], 1, 31);
    var months = parseField(fields[3], 1, 12);
    var dows = parseField(fields[4], 0, 6);

    var domRestricted = fields[2].trim() !== "*";
    var dowRestricted = fields[4].trim() !== "*";

    function has(arr, v) { return arr.indexOf(v) !== -1; }

    function dayMatches(d) {
      var domOk = has(doms, d.getDate());
      var dowOk = has(dows, d.getDay());
      // Vixie rule: if both restricted, it's OR; otherwise AND.
      if (domRestricted && dowRestricted) { return domOk || dowOk; }
      return domOk && dowOk;
    }

    var results = [];
    var d = new Date(from.getTime());
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);

    var iter = 0;
    var MAX_ITER = 600000; // ~416 days of minute-by-minute scanning (with jumps)
    while (results.length < count && iter < MAX_ITER) {
      iter++;
      if (!has(months, d.getMonth() + 1)) {
        d.setMonth(d.getMonth() + 1, 1);
        d.setHours(0, 0, 0, 0);
        continue;
      }
      if (!dayMatches(d)) {
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        continue;
      }
      if (!has(hours, d.getHours())) {
        d.setHours(d.getHours() + 1, 0, 0, 0);
        continue;
      }
      if (!has(minutes, d.getMinutes())) {
        d.setMinutes(d.getMinutes() + 1, 0, 0);
        continue;
      }
      results.push(new Date(d.getTime()));
      d.setMinutes(d.getMinutes() + 1, 0, 0);
    }
    return results;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseField: parseField,
      tokenize: tokenize,
      describe: describe,
      nextRuns: nextRuns
    };
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var inputEl = document.getElementById("cron-input");
  var btnEl = document.getElementById("cron-explain");
  var errorEl = document.getElementById("cron-error");
  var outputEl = document.getElementById("cron-output");
  var descEl = document.getElementById("cron-desc");
  var runsEl = document.getElementById("cron-runs");

  if (!inputEl || !errorEl || !outputEl || !descEl || !runsEl) {
    return;
  }

  function fmt(d) {
    function two2(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + two2(d.getMonth() + 1) + "-" + two2(d.getDate()) +
      " " + two2(d.getHours()) + ":" + two2(d.getMinutes()) +
      " (" + WEEKDAYS[d.getDay()] + ")";
  }

  function run() {
    errorEl.hidden = true;
    errorEl.textContent = "";
    var expr = inputEl.value.trim();
    if (expr === "") {
      outputEl.hidden = true;
      return;
    }
    var desc, runs;
    try {
      desc = describe(expr);
      runs = nextRuns(expr, new Date(), 5);
    } catch (e) {
      outputEl.hidden = true;
      errorEl.textContent = e.message;
      errorEl.hidden = false;
      return;
    }
    descEl.textContent = desc;
    while (runsEl.firstChild) { runsEl.removeChild(runsEl.firstChild); }
    if (runs.length === 0) {
      var li0 = document.createElement("li");
      li0.textContent = "No run times found within the search horizon.";
      runsEl.appendChild(li0);
    } else {
      for (var i = 0; i < runs.length; i++) {
        var li = document.createElement("li");
        li.textContent = fmt(runs[i]);
        runsEl.appendChild(li);
      }
    }
    outputEl.hidden = false;
  }

  btnEl && btnEl.addEventListener("click", run);
  inputEl.addEventListener("input", run);
  run();
})();
