// js/tools/css-gradient.js — gerador de gradiente CSS (linear/radial).
// Carregado APENAS em tools/css-gradient/index.html, após js/main.js.
// Anti-XSS: o preview usa element.style.background com valores GERADOS e
// VALIDADOS pelo próprio código (cor via <input type=color> = hex garantido,
// posição via número clampado). Nunca texto livre do usuário em innerHTML/CSS.
//
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // NÚCLEO PURO — validação e construção do valor CSS
  // ================================================================

  /** Aceita apenas #rgb, #rgba, #rrggbb, #rrggbbaa; senão devolve fallback. */
  function sanitizeColor(color) {
    if (typeof color === "string" && /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)) {
      return color.toLowerCase();
    }
    return "#000000";
  }

  function clampPct(pos) {
    var n = Number(pos);
    if (isNaN(n)) { return null; }
    if (n < 0) { n = 0; }
    if (n > 100) { n = 100; }
    return Math.round(n);
  }

  function clampAngle(angle) {
    var n = Number(angle);
    if (isNaN(n)) { return 0; }
    n = Math.round(n);
    return ((n % 360) + 360) % 360;
  }

  var VALID_SHAPES = { circle: true, ellipse: true };
  var VALID_TYPES = { linear: true, radial: true };

  /**
   * Constrói o valor CSS do gradiente a partir de config validada.
   * @param {{type,angle?,shape?,stops:Array<{color,pos?}>}} cfg
   * @returns {string}
   */
  function buildGradient(cfg) {
    cfg = cfg || {};
    var type = VALID_TYPES[cfg.type] ? cfg.type : "linear";
    var stops = Array.isArray(cfg.stops) ? cfg.stops : [];
    var parts = stops.map(function (s) {
      var color = sanitizeColor(s && s.color);
      var pct = (s && s.pos !== undefined && s.pos !== null && s.pos !== "") ? clampPct(s.pos) : null;
      return pct === null ? color : color + " " + pct + "%";
    });
    if (parts.length === 0) { parts = ["#000000", "#ffffff"]; }
    if (parts.length === 1) { parts.push(parts[0]); }
    if (type === "radial") {
      var shape = VALID_SHAPES[cfg.shape] ? cfg.shape : "circle";
      return "radial-gradient(" + shape + ", " + parts.join(", ") + ")";
    }
    return "linear-gradient(" + clampAngle(cfg.angle) + "deg, " + parts.join(", ") + ")";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      sanitizeColor: sanitizeColor,
      clampPct: clampPct,
      clampAngle: clampAngle,
      buildGradient: buildGradient
    };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var typeEls = document.getElementsByName("cg-type");
  var angleEl = document.getElementById("cg-angle");
  var angleOut = document.getElementById("cg-angle-out");
  var angleRow = document.getElementById("cg-angle-row");
  var shapeEl = document.getElementById("cg-shape");
  var shapeRow = document.getElementById("cg-shape-row");
  var stopsEl = document.getElementById("cg-stops");
  var btnAdd = document.getElementById("cg-add");
  var preview = document.getElementById("cg-preview");
  var codeEl = document.getElementById("cg-code");
  var btnCopy = document.getElementById("cg-copy");

  if (!stopsEl || !preview || !codeEl) { return; }

  function radioValue(nodeList, fallback) {
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].checked) { return nodeList[i].value; }
    }
    return fallback;
  }

  // Cria uma linha de stop (cor + posição + remover), via DOM.
  function addStop(color, pos) {
    var row = document.createElement("div");
    row.className = "cg-stop";

    var colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "cg-stop__color";
    colorInput.value = sanitizeColor(color);

    var posInput = document.createElement("input");
    posInput.type = "number";
    posInput.className = "cg-stop__pos tool__input-inline";
    posInput.min = "0";
    posInput.max = "100";
    posInput.step = "1";
    posInput.value = pos === undefined || pos === null ? "" : String(pos);
    posInput.setAttribute("aria-label", "Posição do stop em %");
    posInput.placeholder = "%";

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button--secondary cg-stop__remove";
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", function () {
      if (stopsEl.querySelectorAll(".cg-stop").length <= 2) { return; }
      stopsEl.removeChild(row);
      render();
    });

    colorInput.addEventListener("input", render);
    posInput.addEventListener("input", render);

    row.appendChild(colorInput);
    row.appendChild(posInput);
    row.appendChild(removeBtn);
    stopsEl.appendChild(row);
  }

  function collectStops() {
    var rows = stopsEl.querySelectorAll(".cg-stop");
    var stops = [];
    for (var i = 0; i < rows.length; i++) {
      var color = rows[i].querySelector(".cg-stop__color").value;
      var pos = rows[i].querySelector(".cg-stop__pos").value;
      stops.push({ color: color, pos: pos });
    }
    return stops;
  }

  function currentConfig() {
    var type = radioValue(typeEls, "linear");
    return {
      type: type,
      angle: angleEl ? angleEl.value : 90,
      shape: shapeEl ? shapeEl.value : "circle",
      stops: collectStops()
    };
  }

  function render() {
    var cfg = currentConfig();
    var value = buildGradient(cfg);
    // Anti-XSS: valor 100% gerado/validado internamente.
    preview.style.background = value;
    codeEl.value = "background: " + value + ";";
    if (angleOut && angleEl) { angleOut.textContent = clampAngle(angleEl.value) + "°"; }
    var isLinear = cfg.type === "linear";
    if (angleRow) { angleRow.hidden = !isLinear; }
    if (shapeRow) { shapeRow.hidden = isLinear; }
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      addStop("#4f46e5", null);
      render();
    });
  }

  for (var t = 0; t < typeEls.length; t++) { typeEls[t].addEventListener("change", render); }
  if (angleEl) { angleEl.addEventListener("input", render); }
  if (shapeEl) { shapeEl.addEventListener("change", render); }

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var text = codeEl.value;
      if (text === "") { return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { window.DevHelper.flashButton(btnCopy, "Copiado!"); })
          .catch(function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    });
  }

  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try { document.execCommand("copy"); window.DevHelper.flashButton(btnCopy, "Copiado!"); } catch (e) { /* silencia */ }
    document.body.removeChild(tmp);
  }

  // Estado inicial: dois stops padrão.
  addStop("#4f46e5", 0);
  addStop("#ec4899", 100);
  render();
})();
