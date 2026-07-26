// js/tools-en/fuso-horario.js — Time zone converter logic (English version).
// Loaded ONLY on en/tools/fuso-horario/index.html, after js/main.js.
// Mirrors js/tools/fuso-horario.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access checks if (el).
// Anti-XSS: output via textContent/createElement -- never innerHTML.
//
// Uses the native Intl.DateTimeFormat API (with timeZone), no external library.
// Converts a reference time in a source time zone to the UTC instant and
// displays the equivalent across a list of IANA time zones.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE -- time zone conversions via Intl
  // ================================================================

  // Offset (in minutes) of an IANA time zone for a given UTC instant (Date).
  // Positive = ahead of UTC (e.g. Tokyo = +540).
  function getOffsetMinutes(tz, date) {
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    var parts = dtf.formatToParts(date);
    var map = {};
    for (var i = 0; i < parts.length; i++) { map[parts[i].type] = parts[i].value; }
    var h = map.hour === "24" ? 0 : parseInt(map.hour, 10);
    var asUTC = Date.UTC(
      parseInt(map.year, 10), parseInt(map.month, 10) - 1, parseInt(map.day, 10),
      h, parseInt(map.minute, 10), parseInt(map.second, 10)
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  }

  /**
   * Converts a "wall-clock" time (components) in a source time zone to the
   * corresponding UTC instant (epoch ms).
   * @param {{year:number,month:number,day:number,hour:number,minute:number}} p
   * @param {string} tz source IANA time zone
   * @returns {number} epoch in ms
   */
  function zonedWallTimeToUtc(p, tz) {
    var guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
    var offset = getOffsetMinutes(tz, new Date(guess));
    var utc = guess - offset * 60000;
    // Refines once (daylight saving time edges).
    offset = getOffsetMinutes(tz, new Date(utc));
    utc = guess - offset * 60000;
    return utc;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function offsetLabel(min) {
    var sign = min >= 0 ? "+" : "-";
    var abs = Math.abs(min);
    return "UTC" + sign + pad2(Math.floor(abs / 60)) + ":" + pad2(abs % 60);
  }

  /**
   * Formats a UTC instant in an IANA time zone (en-US), returning useful parts.
   * @param {number} utcMs
   * @param {string} tz
   * @returns {{date:string,time:string,weekday:string,offset:string}}
   */
  function formatInZone(utcMs, tz) {
    var d = new Date(utcMs);
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, weekday: "short",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
    var parts = dtf.formatToParts(d);
    var map = {};
    for (var i = 0; i < parts.length; i++) { map[parts[i].type] = parts[i].value; }
    return {
      date: map.year + "-" + map.month + "-" + map.day,
      time: map.hour + ":" + map.minute,
      weekday: (map.weekday || "").replace(".", ""),
      offset: offsetLabel(getOffsetMinutes(tz, d))
    };
  }

  var DEFAULT_ZONES = [
    "America/Sao_Paulo", "America/New_York", "America/Los_Angeles",
    "Europe/London", "Europe/Lisbon", "Europe/Berlin",
    "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata",
    "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "UTC"
  ];

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      getOffsetMinutes: getOffsetMinutes,
      zonedWallTimeToUtc: zonedWallTimeToUtc,
      formatInZone: formatInZone,
      offsetLabel: offsetLabel,
      DEFAULT_ZONES: DEFAULT_ZONES
    };
  }

  // ================================================================
  // DOM WIRING -- browser only
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var dateEl = document.getElementById("tz-date");
  var timeEl = document.getElementById("tz-time");
  var sourceEl = document.getElementById("tz-source");
  var nowBtn = document.getElementById("tz-now");
  var addSelect = document.getElementById("tz-add-select");
  var addBtn = document.getElementById("tz-add-btn");
  var tbodyEl = document.getElementById("tz-tbody");
  var errorEl = document.getElementById("tz-error");

  if (!dateEl || !timeEl || !sourceEl || !tbodyEl) { return; }

  // List of displayed time zones (state). Starts with the default set.
  var shownZones = DEFAULT_ZONES.slice();

  function setToNow() {
    var d = new Date();
    dateEl.value = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    timeEl.value = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function readWallTime() {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateEl.value);
    var tm = /^(\d{1,2}):(\d{2})$/.exec(timeEl.value);
    if (!dm || !tm) { return null; }
    return {
      year: parseInt(dm[1], 10), month: parseInt(dm[2], 10), day: parseInt(dm[3], 10),
      hour: parseInt(tm[1], 10), minute: parseInt(tm[2], 10)
    };
  }

  function makeRemoveButton(zone) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button button--secondary escopo-lista__btn-remover";
    btn.textContent = "Remove";
    btn.addEventListener("click", function () {
      shownZones = shownZones.filter(function (z) { return z !== zone; });
      render();
    });
    return btn;
  }

  function render() {
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ""; }
    var wall = readWallTime();
    if (!wall) {
      if (errorEl) { errorEl.textContent = "Enter a valid date and time."; errorEl.hidden = false; }
      return;
    }
    var tz = sourceEl.value;
    var utcMs;
    try {
      utcMs = zonedWallTimeToUtc(wall, tz);
    } catch (e) {
      if (errorEl) { errorEl.textContent = "Invalid source time zone."; errorEl.hidden = false; }
      return;
    }

    while (tbodyEl.firstChild) { tbodyEl.removeChild(tbodyEl.firstChild); }

    for (var i = 0; i < shownZones.length; i++) {
      var zone = shownZones[i];
      var info;
      try { info = formatInZone(utcMs, zone); }
      catch (e) { continue; }

      var tr = document.createElement("tr");

      var tdZone = document.createElement("th");
      tdZone.setAttribute("scope", "row");
      tdZone.textContent = zone;

      var tdTime = document.createElement("td");
      tdTime.textContent = info.weekday + " " + info.date + " " + info.time;

      var tdOffset = document.createElement("td");
      tdOffset.textContent = info.offset;

      var tdAction = document.createElement("td");
      tdAction.appendChild(makeRemoveButton(zone));

      tr.appendChild(tdZone);
      tr.appendChild(tdTime);
      tr.appendChild(tdOffset);
      tr.appendChild(tdAction);
      tbodyEl.appendChild(tr);
    }
  }

  if (nowBtn) { nowBtn.addEventListener("click", function () { setToNow(); render(); }); }
  dateEl.addEventListener("input", render);
  timeEl.addEventListener("input", render);
  sourceEl.addEventListener("change", render);
  if (addBtn && addSelect) {
    addBtn.addEventListener("click", function () {
      var z = addSelect.value;
      if (z && shownZones.indexOf(z) === -1) {
        shownZones.push(z);
        render();
      }
    });
  }

  // Initial state: if the fields come in empty, fills them with now.
  if (!dateEl.value || !timeEl.value) { setToNow(); }
  render();
})();
