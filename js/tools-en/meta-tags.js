// js/tools-en/meta-tags.js — Meta tags generator (Open Graph + Twitter Card) (English version).
// Loaded ONLY on en/tools/meta-tags/index.html, after js/main.js.
// Mirrors js/tools/meta-tags.js — same logic, only user-visible strings translated.
// Defensive pattern: every DOM access checks if (el).
// Anti-XSS: the tags block goes out via .value (textarea); the preview is built via
// createElement/textContent -- never innerHTML with user data.
//
// Does NOT scrape/fetch any URL (the site has no backend): generation is
// 100% manual, based on what the user types.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE -- assembling the meta tags block
  // ================================================================

  // Escapes a value for safe use inside an HTML attribute (double quotes).
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
   * Assembles the meta tags block (description + Open Graph + Twitter Card).
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

  // Extracts the domain from a URL to display in the preview.
  function domainFromUrl(url) {
    var s = String(url == null ? "" : url).trim();
    if (s === "") { return ""; }
    var m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(s);
    if (m) { return m[1].toLowerCase(); }
    // No scheme: takes whatever comes before the first slash.
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
  // DOM WIRING -- browser only
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
    // Image
    if (pvImage) {
      var showImg = o.image && isSafeUrl(o.image) &&
        (o.twitterCard === "summary_large_image" || true);
      if (o.image && isSafeUrl(o.image)) {
        pvImage.src = o.image; // only http/https reach here
        pvImage.hidden = false;
        pvImage.alt = o.title || "Sharing image";
      } else {
        pvImage.removeAttribute("src");
        pvImage.hidden = true;
      }
      void showImg;
    }
    if (pvDomain) { pvDomain.textContent = domainFromUrl(o.url); }
    if (pvTitle) { pvTitle.textContent = o.title || "Page title"; }
    if (pvDesc) { pvDesc.textContent = truncate(o.description, 160) || "Page description for the sharing card."; }
  }

  function render() {
    var o = currentOpts();
    outEl.value = buildMetaTags(o);
    updatePreview(o);
  }

  // --- Copy with fallback ---
  function copyText(text, btn) {
    if (text === "") { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copied!", 1200);
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
    try { document.execCommand("copy"); window.DevHelper.flashButton(btn, "Copied!", 1200); }
    catch (e) { /* silences */ }
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
