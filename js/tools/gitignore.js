// js/tools/gitignore.js — gerador de arquivo .gitignore.
// Carregado APENAS em tools/gitignore/index.html, após js/main.js.
// Anti-XSS: UI construída via createElement/textContent — nunca innerHTML.
//
// Dataset ESTÁTICO embutido (sem API do GitHub, mantém o site sem backend).
// UMD-lite: núcleo puro exportado p/ Node (sanidade); DOM só no navegador.

(function () {
  "use strict";

  // ================================================================
  // DATASET — blocos de patterns por linguagem/ferramenta.
  // Cada bloco vira uma seção "# Label" no arquivo final.
  // ================================================================
  var DATASET = [
    {
      id: "node", label: "Node", patterns: [
        "node_modules/", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*",
        ".pnpm-debug.log*", ".npm", ".yarn/cache", "dist/", "build/", ".env",
        ".env.local", "coverage/", ".nyc_output/"
      ]
    },
    {
      id: "python", label: "Python", patterns: [
        "__pycache__/", "*.py[cod]", "*$py.class", "*.egg-info/", ".eggs/",
        "build/", "dist/", ".venv/", "venv/", "env/", ".pytest_cache/",
        ".mypy_cache/", ".coverage", "htmlcov/", ".tox/"
      ]
    },
    {
      id: "java", label: "Java", patterns: [
        "*.class", "*.log", "*.jar", "*.war", "*.ear", "target/", "build/",
        ".gradle/", "hs_err_pid*", "*.iml"
      ]
    },
    {
      id: "go", label: "Go", patterns: [
        "*.exe", "*.exe~", "*.dll", "*.so", "*.dylib", "*.test", "*.out",
        "vendor/", "bin/", "go.work.sum"
      ]
    },
    {
      id: "php", label: "PHP", patterns: [
        "/vendor/", "composer.phar", ".env", ".env.local", "*.log",
        "/storage/*.key", "/public/storage", "bootstrap/cache/*"
      ]
    },
    {
      id: "ruby", label: "Ruby", patterns: [
        "*.gem", "*.rbc", "/.bundle/", "/vendor/bundle", "/log/*", "/tmp/*",
        ".byebug_history", "coverage/"
      ]
    },
    {
      id: "rust", label: "Rust", patterns: [
        "/target/", "**/*.rs.bk", "Cargo.lock", "*.pdb"
      ]
    },
    {
      id: "dotnet", label: ".NET", patterns: [
        "bin/", "obj/", "*.user", "*.suo", ".vs/", "*.userprefs", "packages/",
        "artifacts/", "*.dll", "*.exe"
      ]
    },
    {
      id: "react", label: "React", patterns: [
        "node_modules/", "/build", "/dist", ".env.local", ".env.development.local",
        ".env.test.local", ".env.production.local", "*.local"
      ]
    },
    {
      id: "angular", label: "Angular", patterns: [
        "node_modules/", "/dist", "/tmp", "/out-tsc", "/.angular/cache",
        ".sass-cache/", "*.ngfactory.ts", "*.ngsummary.json"
      ]
    },
    {
      id: "vscode", label: "VS Code", patterns: [
        ".vscode/*", "!.vscode/settings.json", "!.vscode/tasks.json",
        "!.vscode/launch.json", "!.vscode/extensions.json", "*.code-workspace"
      ]
    },
    {
      id: "jetbrains", label: "JetBrains", patterns: [
        ".idea/", "*.iml", "*.iws", "*.ipr", "out/", ".idea_modules/",
        "cmake-build-*/"
      ]
    },
    {
      id: "macos", label: "macOS", patterns: [
        ".DS_Store", ".AppleDouble", ".LSOverride", "Icon\r", "._*",
        ".Spotlight-V100", ".Trashes"
      ]
    },
    {
      id: "windows", label: "Windows", patterns: [
        "Thumbs.db", "Thumbs.db:encryptable", "ehthumbs.db", "Desktop.ini",
        "$RECYCLE.BIN/", "*.lnk"
      ]
    },
    {
      id: "linux", label: "Linux", patterns: [
        "*~", ".fuse_hidden*", ".directory", ".Trash-*", ".nfs*"
      ]
    }
  ];

  var BY_ID = {};
  for (var d = 0; d < DATASET.length; d++) { BY_ID[DATASET[d].id] = DATASET[d]; }

  /**
   * Monta o .gitignore combinando os blocos selecionados, na ordem do dataset.
   * @param {string[]} ids  ids de blocos escolhidos
   * @returns {string}
   */
  function buildGitignore(ids) {
    if (!Array.isArray(ids)) { return ""; }
    var wanted = {};
    for (var i = 0; i < ids.length; i++) { wanted[ids[i]] = true; }
    var blocks = [];
    for (var j = 0; j < DATASET.length; j++) {
      var block = DATASET[j];
      if (wanted[block.id]) {
        blocks.push("# " + block.label + "\n" + block.patterns.join("\n"));
      }
    }
    if (blocks.length === 0) { return ""; }
    return blocks.join("\n\n") + "\n";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { DATASET: DATASET, buildGitignore: buildGitignore };
  }

  // ================================================================
  // FIAÇÃO DE DOM — apenas no navegador
  // ================================================================
  if (typeof document === "undefined") { return; }

  var optionsEl = document.getElementById("gi-options");
  var output = document.getElementById("gi-output");
  var btnCopy = document.getElementById("gi-copy");
  var btnDownload = document.getElementById("gi-download");
  var btnClear = document.getElementById("gi-clear");
  var emptyMsg = document.getElementById("gi-empty");

  if (!optionsEl || !output) { return; }

  // Renderiza os checkboxes a partir do dataset (via DOM, sem innerHTML).
  for (var k = 0; k < DATASET.length; k++) {
    var item = DATASET[k];
    var label = document.createElement("label");
    label.className = "tool__checkbox-label";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = item.id;
    cb.className = "gi-check";
    var span = document.createElement("span");
    span.textContent = item.label;
    label.appendChild(cb);
    label.appendChild(span);
    optionsEl.appendChild(label);
  }

  function selectedIds() {
    var checks = optionsEl.querySelectorAll(".gi-check");
    var ids = [];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i].checked) { ids.push(checks[i].value); }
    }
    return ids;
  }

  function refresh() {
    var content = buildGitignore(selectedIds());
    output.value = content;
    if (emptyMsg) { emptyMsg.hidden = content !== ""; }
  }

  optionsEl.addEventListener("change", refresh);

  if (btnCopy) {
    btnCopy.addEventListener("click", function () {
      var text = output.value;
      if (text === "") { return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { window.DevHelper.flashButton(btnCopy, "Copiado!"); })
          .catch(function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", function () {
      var text = output.value;
      if (text === "") { return; }
      var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = ".gitignore";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      var checks = optionsEl.querySelectorAll(".gi-check");
      for (var i = 0; i < checks.length; i++) { checks[i].checked = false; }
      refresh();
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


  refresh();
})();
