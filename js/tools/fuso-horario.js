// js/tools/fuso-horario.js — Conversor de fuso horario.
// Carregado APENAS em tools/fuso-horario/index.html, apos js/main.js.
// Padrao defensivo: todo acesso ao DOM checa if (el).
// Anti-XSS: saida via textContent/createElement -- nunca innerHTML.
//
// Usa a API nativa Intl.DateTimeFormat (com timeZone), sem biblioteca externa.
// Converte um horario de referencia num fuso de origem para o instante UTC e
// exibe o equivalente numa lista de fusos IANA.
//
// UMD-lite: nucleo puro exportado p/ Node (sanidade); DOM so no navegador.

(function () {
  "use strict";

  // ================================================================
  // NUCLEO PURO -- conversoes de fuso via Intl
  // ================================================================

  // Offset (em minutos) de um fuso IANA para um dado instante UTC (Date).
  // Positivo = adiantado em relacao ao UTC (ex.: Tokyo = +540).
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
   * Converte um horario "de parede" (componentes) num fuso de origem para o
   * instante UTC correspondente (epoch ms).
   * @param {{year:number,month:number,day:number,hour:number,minute:number}} p
   * @param {string} tz fuso IANA de origem
   * @returns {number} epoch em ms
   */
  function zonedWallTimeToUtc(p, tz) {
    var guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
    var offset = getOffsetMinutes(tz, new Date(guess));
    var utc = guess - offset * 60000;
    // Refina uma vez (bordas de horario de verao).
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
   * Formata um instante UTC num fuso IANA (pt-BR), devolvendo partes uteis.
   * @param {number} utcMs
   * @param {string} tz
   * @returns {{date:string,time:string,weekday:string,offset:string}}
   */
  function formatInZone(utcMs, tz) {
    var d = new Date(utcMs);
    var dtf = new Intl.DateTimeFormat("pt-BR", {
      timeZone: tz, weekday: "short",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
    var parts = dtf.formatToParts(d);
    var map = {};
    for (var i = 0; i < parts.length; i++) { map[parts[i].type] = parts[i].value; }
    return {
      date: map.day + "/" + map.month + "/" + map.year,
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
  // FIACAO DE DOM -- apenas no navegador
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

  // Lista de fusos exibidos (estado). Inicia com o conjunto padrao.
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
    btn.textContent = "Remover";
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
      if (errorEl) { errorEl.textContent = "Informe uma data e hora válidas."; errorEl.hidden = false; }
      return;
    }
    var tz = sourceEl.value;
    var utcMs;
    try {
      utcMs = zonedWallTimeToUtc(wall, tz);
    } catch (e) {
      if (errorEl) { errorEl.textContent = "Fuso de origem inválido."; errorEl.hidden = false; }
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

  // Estado inicial: se os campos vierem vazios, preenche com agora.
  if (!dateEl.value || !timeEl.value) { setToNow(); }
  render();
})();
