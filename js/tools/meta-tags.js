// js/tools/meta-tags.js — Gerador de meta tags (Open Graph + Twitter Card).
// Carregado APENAS em tools/meta-tags/index.html, apos js/main.js.
// Padrao defensivo: todo acesso ao DOM checa if (el).
// Anti-XSS: o bloco de tags sai via .value (textarea); o preview e montado via
// createElement/textContent -- nunca innerHTML com dado do usuario.
//
// NAO faz scraping/fetch de URL nenhuma (o site nao tem backend): a geracao e
// 100% manual a partir do que o usuario digita.
//
// UMD-lite: nucleo puro exportado p/ Node (sanidade); DOM so no navegador.

(function () {
  "use strict";

  // ================================================================
  // NUCLEO PURO -- montagem do bloco de meta tags
  // ================================================================

  // Escapa um valor para uso seguro dentro de um atributo HTML (aspas duplas).
  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isSafeUrl(url) {
    var u = String(url == null ? "" : url).replace(/[\t\n\r ]+/g, "").toLowerCase();
    var m = /^([a-z][a-z0-9+.-]*):/.exec(u);
    if (!m) { return true; }
    var scheme = m[1];
    return scheme === "http" || scheme === "https";
  }

  function metaProperty(prop, content) {
    return '<meta property="' + prop + '" content="' + escapeAttr(content) + '" />';
  }
  function metaName(name, content) {
    return '<meta name="' + name + '" content="' + escapeAttr(content) + '" />';
  }

  /**
   * Monta o bloco de meta tags (description + Open Graph + Twitter Card).
   * @param {{title?:string,description?:string,url?:string,image?:string,
   *          siteName?:string,type?:string,twitterCard?:string}} o
   * @returns {string}
   */
  function buildMetaTags(o) {
    o = o || {};
    var type = o.type === "article" ? "article" : "website";
    var twitterCard = o.twitterCard === "summary_large_image"
      ? "summary_large_image" : "summary";

    var lines = [];

    if (o.description) { lines.push(metaName("description", o.description)); }

    lines.push("<!-- Open Graph -->");
    lines.push(metaProperty("og:type", type));
    if (o.title) { lines.push(metaProperty("og:title", o.title)); }
    if (o.description) { lines.push(metaProperty("og:description", o.description)); }
    if (o.url) { lines.push(metaProperty("og:url", o.url)); }
    if (o.image) { lines.push(metaProperty("og:image", o.image)); }
    if (o.siteName) { lines.push(metaProperty("og:site_name", o.siteName)); }

    lines.push("<!-- Twitter Card -->");
    lines.push(metaName("twitter:card", twitterCard));
    if (o.title) { lines.push(metaName("twitter:title", o.title)); }
    if (o.description) { lines.push(metaName("twitter:description", o.description)); }
    if (o.image) { lines.push(metaName("twitter:image", o.image)); }

    return lines.join("\n");
  }

  // Extrai o dominio de uma URL para exibir no preview.
  function domainFromUrl(url) {
    var s = String(url == null ? "" : url).trim();
    if (s === "") { return ""; }
    var m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(s);
    if (m) { return m[1].toLowerCase(); }
    // Sem esquema: pega o que vier antes da primeira barra.
    return s.replace(/^\/+/, "").split(/[/?#]/)[0].toLowerCase();
  }

  function truncate(s, n) {
    s = String(s == null ? "" : s);
    if (s.length <= n) { return s; }
    return s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      escapeAttr: escapeAttr,
      isSafeUrl: isSafeUrl,
      buildMetaTags: buildMetaTags,
      domainFromUrl: domainFromUrl,
      truncate: truncate
    };
  }

  // ================================================================
  // FIACAO DE DOM -- apenas no navegador
  // ================================================================
  if (typeof document === "undefined") {
    return;
  }

  var fTitle = document.getElementById("mt-title");
  var fDesc = document.getElementById("mt-desc");
  var fUrl = document.getElementById("mt-url");
  var fImage = document.getElementById("mt-image");
  var fSite = document.getElementById("mt-site");
  var fType = document.getElementById("mt-type");
  var fCard = document.getElementById("mt-card");
  var outEl = document.getElementById("mt-output");
  var btnCopy = document.getElementById("mt-copy");

  // Preview
  var pvCard = document.getElementById("mt-preview-card");
  var pvImage = document.getElementById("mt-preview-image");
  var pvDomain = document.getElementById("mt-preview-domain");
  var pvTitle = document.getElementById("mt-preview-title");
  var pvDesc = document.getElementById("mt-preview-desc");

  if (!fTitle || !fDesc || !outEl) { return; }

  function currentOpts() {
    return {
      title: fTitle.value,
      description: fDesc.value,
      url: fUrl ? fUrl.value : "",
      image: fImage ? fImage.value : "",
      siteName: fSite ? fSite.value : "",
      type: fType ? fType.value : "website",
      twitterCard: fCard ? fCard.value : "summary"
    };
  }

  function updatePreview(o) {
    if (!pvCard) { return; }
    // Imagem
    if (pvImage) {
      var showImg = o.image && isSafeUrl(o.image) &&
        (o.twitterCard === "summary_large_image" || true);
      if (o.image && isSafeUrl(o.image)) {
        pvImage.src = o.image; // so http/https chegam aqui
        pvImage.hidden = false;
        pvImage.alt = o.title || "Imagem de compartilhamento";
      } else {
        pvImage.removeAttribute("src");
        pvImage.hidden = true;
      }
      void showImg;
    }
    if (pvDomain) { pvDomain.textContent = domainFromUrl(o.url); }
    if (pvTitle) { pvTitle.textContent = o.title || "Título da página"; }
    if (pvDesc) { pvDesc.textContent = truncate(o.description, 160) || "Descrição da página para o card de compartilhamento."; }
  }

  function render() {
    var o = currentOpts();
    outEl.value = buildMetaTags(o);
    updatePreview(o);
  }

  // --- Copia com fallback ---
  function copyText(text, btn) {
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copiado!", 1200);
      }).catch(function () { fallbackCopy(text, btn); });
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
    try { document.execCommand("copy"); window.DevHelper.flashButton(btn, "Copiado!", 1200); }
    catch (e) { /* silencia */ }
    finally { document.body.removeChild(tmp); }
  }

  var inputs = [fTitle, fDesc, fUrl, fImage, fSite, fType, fCard];
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i]) {
      inputs[i].addEventListener("input", render);
      inputs[i].addEventListener("change", render);
    }
  }
  if (btnCopy) {
    btnCopy.addEventListener("click", function () { copyText(outEl.value, btnCopy); });
  }
  render();
})();
