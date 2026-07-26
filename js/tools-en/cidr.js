// js/tools-en/cidr.js — subnet / CIDR (IPv4) calculator (English version).
// Loaded ONLY on en/tools/cidr/index.html, after js/main.js.
// Mirrors js/tools/cidr.js — same logic, only user-visible strings translated.
// Anti-XSS: output via .textContent — never innerHTML with user data.
//
// UMD-lite: pure core exported for Node (sanity checks); DOM only in browser.

(function () {
  "use strict";

  // ================================================================
  // PURE CORE — IPv4/CIDR arithmetic
  // ================================================================

  /** Validates and converts "a.b.c.d" into an unsigned integer (0..2^32-1) or null. */
  function ipToInt(ip) {
    if (typeof ip !== "string") { return null; }
    var parts = ip.trim().split(".");
    if (parts.length !== 4) { return null; }
    var n = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) { return null; }
      var octet = parseInt(parts[i], 10);
      if (octet < 0 || octet > 255) { return null; }
      n = (n * 256) + octet;
    }
    return n >>> 0;
  }

  /** Unsigned integer -> "a.b.c.d". */
  function intToIp(n) {
    n = n >>> 0;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  /** Mask (integer) from prefix 0..32. */
  function maskFromPrefix(prefix) {
    prefix = Math.floor(Number(prefix));
    if (prefix < 0 || prefix > 32) { return null; }
    if (prefix === 0) { return 0; }
    return (0xFFFFFFFF << (32 - prefix)) >>> 0;
  }

  /** Prefix from a dotted-decimal mask; null if not contiguous. */
  function prefixFromMask(maskStr) {
    var m = ipToInt(maskStr);
    if (m === null) { return null; }
    // Checks that it is a contiguous run of 1s followed by 0s.
    var zeros = 0;
    var seenZero = false;
    for (var i = 31; i >= 0; i--) {
      var bit = (m >>> i) & 1;
      if (bit === 0) { seenZero = true; zeros++; }
      else if (seenZero) { return null; } // 1 after 0 => invalid
    }
    return 32 - zeros;
  }

  /**
   * Computes the subnet data.
   * Handles /31 (RFC 3021, 2 point-to-point hosts) and /32 (single host).
   * @param {string} ip  IPv4 address
   * @param {number} prefix  0..32
   * @returns {object|null}
   */
  function calculate(ip, prefix) {
    var ipInt = ipToInt(ip);
    prefix = Math.floor(Number(prefix));
    if (ipInt === null) { return null; }
    if (prefix < 0 || prefix > 32) { return null; }

    var mask = maskFromPrefix(prefix);
    var wildcard = (~mask) >>> 0;
    var network = (ipInt & mask) >>> 0;
    var broadcast = (network | wildcard) >>> 0;
    var totalAddresses = Math.pow(2, 32 - prefix);

    var firstHost, lastHost, usableHosts;
    if (prefix === 32) {
      firstHost = network;
      lastHost = network;
      usableHosts = 1;
    } else if (prefix === 31) {
      // RFC 3021: both addresses are usable (point-to-point link).
      firstHost = network;
      lastHost = broadcast;
      usableHosts = 2;
    } else {
      firstHost = (network + 1) >>> 0;
      lastHost = (broadcast - 1) >>> 0;
      usableHosts = totalAddresses - 2;
    }

    return {
      ip: intToIp(ipInt),
      prefix: prefix,
      mask: intToIp(mask),
      wildcard: intToIp(wildcard),
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      totalAddresses: totalAddresses,
      usableHosts: usableHosts
    };
  }

  /**
   * Parses a free-form entry: "ip/prefix", "ip mask" or just "ip".
   * @returns {{ip:string, prefix:number}|null}
   */
  function parseInput(str, prefixHint) {
    if (typeof str !== "string") { return null; }
    var s = str.trim();
    if (s === "") { return null; }
    var ip, prefix;
    if (s.indexOf("/") !== -1) {
      var slash = s.split("/");
      ip = slash[0].trim();
      if (!/^\d{1,2}$/.test(slash[1].trim())) { return null; }
      prefix = parseInt(slash[1].trim(), 10);
    } else if (/\s/.test(s)) {
      var sp = s.split(/\s+/);
      ip = sp[0];
      prefix = prefixFromMask(sp[1]);
      if (prefix === null) { return null; }
    } else {
      ip = s;
      prefix = (prefixHint === undefined || prefixHint === null || prefixHint === "")
        ? 24 : Math.floor(Number(prefixHint));
    }
    if (ipToInt(ip) === null) { return null; }
    if (prefix < 0 || prefix > 32) { return null; }
    return { ip: ip, prefix: prefix };
  }

  var core = {
    ipToInt: ipToInt,
    intToIp: intToIp,
    maskFromPrefix: maskFromPrefix,
    prefixFromMask: prefixFromMask,
    calculate: calculate,
    parseInput: parseInput
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  // ================================================================
  // DOM WIRING — browser only
  // ================================================================
  if (typeof document === "undefined") { return; }

  var elInput = document.getElementById("cidr-input");
  var elPrefix = document.getElementById("cidr-prefix");
  var elError = document.getElementById("cidr-error");
  var elResult = document.getElementById("cidr-result");
  var btnCalc = document.getElementById("cidr-calc");

  if (!elInput || !elResult) { return; }

  function showError(msg) {
    if (!elError) { return; }
    elError.textContent = msg;
    elError.hidden = false;
    elResult.hidden = true;
  }
  function clearError() {
    if (!elError) { return; }
    elError.textContent = "";
    elError.hidden = true;
  }

  function setCell(id, value) {
    var el = document.getElementById(id);
    if (el) { el.textContent = value; }
  }

  function run() {
    clearError();
    var parsed = parseInput(elInput.value, elPrefix ? elPrefix.value : "");
    if (!parsed) {
      showError("Invalid input. Use IP + prefix (e.g. 192.168.1.10/24) or IP + mask.");
      return;
    }
    var r = calculate(parsed.ip, parsed.prefix);
    if (!r) {
      showError("Could not calculate. Check the IP and prefix (0–32).");
      return;
    }
    if (elPrefix) { elPrefix.value = r.prefix; }
    setCell("cidr-out-cidr", r.ip + "/" + r.prefix);
    setCell("cidr-out-mask", r.mask);
    setCell("cidr-out-wildcard", r.wildcard);
    setCell("cidr-out-network", r.network);
    setCell("cidr-out-broadcast", r.broadcast);
    setCell("cidr-out-first", r.firstHost);
    setCell("cidr-out-last", r.lastHost);
    setCell("cidr-out-total", String(r.totalAddresses));
    setCell("cidr-out-usable", String(r.usableHosts));
    elResult.hidden = false;
  }

  btnCalc && btnCalc.addEventListener("click", run);
  elInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { run(); }
  });

  // Initial example state.
  run();
})();
