// js/tools/escopo.js — Gerador de Escopo de Projeto de Software.
// Carregado APENAS em tools/escopo/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value/.textContent — nunca innerHTML.
//   Itens de lista dinâmica são criados com createElement (sem innerHTML com input do usuário).

(function () {
  "use strict";

  // ─── IDs das listas dinâmicas e suas labels no Markdown ──────────────────────

  var LISTAS = [
    { id: "lista-funcionais",    secao: "## Requisitos funcionais" },
    { id: "lista-nao-funcionais",secao: "## Requisitos não funcionais" },
    { id: "lista-entregaveis",   secao: "## Entregáveis" },
    { id: "lista-fora-escopo",   secao: "## Fora de escopo" },
    { id: "lista-premissas",     secao: "## Premissas" },
    { id: "lista-riscos",        secao: "## Riscos" },
    { id: "lista-criterios",     secao: "## Critérios de aceite" }
  ];

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var inputNome      = document.getElementById("escopo-nome");
  var inputPrazo     = document.getElementById("escopo-prazo");
  var inputStack     = document.getElementById("escopo-stack");
  var inputObjetivo  = document.getElementById("escopo-objetivo");
  var btnGerar       = document.getElementById("btn-gerar-escopo");
  var btnLimpar      = document.getElementById("btn-limpar-escopo");
  var saidaSection   = document.getElementById("escopo-saida-section");
  var saidaTextarea  = document.getElementById("escopo-saida");
  var avisoVazio     = document.getElementById("escopo-aviso-vazio");
  var btnCopiar      = document.getElementById("btn-copiar-escopo");
  var btnBaixar      = document.getElementById("btn-baixar-escopo");

  // Guard — interrompe silenciosamente se elementos essenciais não existirem
  if (
    !inputNome || !inputObjetivo || !btnGerar ||
    !saidaSection || !saidaTextarea || !btnCopiar || !btnBaixar
  ) {
    return;
  }

  // ─── Listas dinâmicas ────────────────────────────────────────────────────────

  /**
   * Cria uma linha de item para uma lista dinâmica.
   * Usa createElement para não tocar em innerHTML com dados do usuário.
   *
   * @param {HTMLElement} listaEl - contêiner da lista
   * @returns {HTMLElement} a linha criada (já appended)
   */
  function criarItemLista(listaEl) {
    if (!listaEl) { return null; }

    var linha = document.createElement("div");
    linha.className = "escopo-lista__item";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "tool__input-inline escopo-lista__input";
    input.placeholder = "Digite o item...";
    input.spellcheck = true;
    input.setAttribute("autocorrect", "off");

    var btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "escopo-lista__btn-remover";
    // textContent é seguro para conteúdo de botão
    btnRemover.textContent = "Remover";
    btnRemover.setAttribute("aria-label", "Remover item");

    btnRemover.addEventListener("click", function () {
      // Remove o nó da linha — sem memory leak de listener orphan
      // (o listener está no nó que será removido)
      if (listaEl.contains(linha)) {
        listaEl.removeChild(linha);
      }
    });

    linha.appendChild(input);
    linha.appendChild(btnRemover);
    listaEl.appendChild(linha);

    return linha;
  }

  /**
   * Inicializa cada lista dinâmica com um item vazio e registra o botão "+ Adicionar".
   */
  function inicializarListas() {
    // Inicializa as listas com um item vazio cada
    LISTAS.forEach(function (def) {
      var listaEl = document.getElementById(def.id);
      if (listaEl) {
        criarItemLista(listaEl);
      }
    });

    // Registra os botões de adicionar item
    var btnsAdicionar = document.querySelectorAll(".escopo-btn-adicionar");
    for (var i = 0; i < btnsAdicionar.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var listaId = btn.getAttribute("data-lista");
          if (!listaId) { return; }
          var listaEl = document.getElementById(listaId);
          if (listaEl) {
            var novoItem = criarItemLista(listaEl);
            // Foca o novo input para facilitar o preenchimento
            if (novoItem) {
              var novoInput = novoItem.querySelector("input");
              if (novoInput) { novoInput.focus(); }
            }
          }
        });
      }(btnsAdicionar[i]));
    }
  }

  /**
   * Coleta os valores não-vazios de uma lista dinâmica.
   *
   * @param {string} listaId
   * @returns {string[]}
   */
  function coletarItens(listaId) {
    var listaEl = document.getElementById(listaId);
    if (!listaEl) { return []; }
    var inputs = listaEl.querySelectorAll("input");
    var itens = [];
    for (var i = 0; i < inputs.length; i++) {
      var val = inputs[i].value.trim();
      if (val) { itens.push(val); }
    }
    return itens;
  }

  // ─── Montagem do Markdown ────────────────────────────────────────────────────

  /**
   * Converte o nome do projeto em slug (minúsculo, hífens, sem caracteres especiais).
   * Usado para nomear o arquivo .md ao baixar.
   *
   * @param {string} nome
   * @returns {string}
   */
  function slugify(nome) {
    return nome
      .toLowerCase()
      // Substitui acentos comuns do português
      .replace(/[àáâãä]/g, "a")
      .replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u")
      .replace(/[ç]/g, "c")
      .replace(/[ñ]/g, "n")
      // Remove caracteres não alfanuméricos (exceto espaços)
      .replace(/[^a-z0-9\s-]/g, "")
      // Colapsa múltiplos espaços/hífens
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Monta o documento de escopo em Markdown a partir dos valores do formulário.
   *
   * @returns {{ markdown: string, temConteudo: boolean }}
   */
  function montarMarkdown() {
    var nome     = inputNome    ? inputNome.value.trim()     : "";
    var prazo    = inputPrazo   ? inputPrazo.value.trim()    : "";
    var stack    = inputStack   ? inputStack.value.trim()    : "";
    var objetivo = inputObjetivo ? inputObjetivo.value.trim() : "";

    var tituloEfetivo = nome || "Projeto sem nome";
    var temConteudo   = !!(nome || objetivo);

    var linhas = [];

    // Título
    linhas.push("# " + tituloEfetivo);
    linhas.push("");

    // Metadados inline (prazo e stack, se preenchidos)
    if (prazo || stack) {
      if (prazo) { linhas.push("**Prazo estimado:** " + prazo + "  "); }
      if (stack) { linhas.push("**Stack / Tecnologias:** " + stack + "  "); }
      linhas.push("");
    }

    // Objetivo
    if (objetivo) {
      linhas.push("## Objetivo");
      linhas.push("");
      linhas.push(objetivo);
      linhas.push("");
    }

    // Seções de lista — pula seções sem itens
    LISTAS.forEach(function (def) {
      var itens = coletarItens(def.id);
      if (itens.length === 0) { return; }
      linhas.push(def.secao);
      linhas.push("");
      itens.forEach(function (item) {
        linhas.push("- " + item);
      });
      linhas.push("");
    });

    // Remove linha vazia final extra
    while (linhas.length > 0 && linhas[linhas.length - 1] === "") {
      linhas.pop();
    }

    return {
      markdown: linhas.join("\n"),
      temConteudo: temConteudo
    };
  }

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

  /**
   * Copia texto para o clipboard com fallback para execCommand.
   */
  function copiarTexto(text, btn) {
    if (!text) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copiado!");
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
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia — usuário pode copiar manualmente da textarea
    } finally {
      document.body.removeChild(tmp);
    }
  }

  /**
   * Gera um Blob com o Markdown e dispara download de arquivo .md.
   * Usa URL.createObjectURL + <a download> — tudo client-side.
   */
  function baixarMarkdown(markdown, nome) {
    var nomeArquivo = nome ? slugify(nome) : "";
    nomeArquivo = nomeArquivo || "escopo";
    nomeArquivo = nomeArquivo + ".md";

    var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    var url  = URL.createObjectURL(blob);

    var a = document.createElement("a");
    a.href     = url;
    a.download = nomeArquivo;
    // Deve estar no DOM para funcionar no Firefox
    a.style.position = "fixed";
    a.style.opacity  = "0";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoga o objectURL para liberar memória
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 10000);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    var resultado = montarMarkdown();

    if (!resultado.temConteudo) {
      // Mostra aviso e revela a seção (para o aviso aparecer)
      if (saidaSection) { saidaSection.hidden = false; }
      if (avisoVazio)   { avisoVazio.hidden = false; }
      if (saidaTextarea) { saidaTextarea.value = ""; }
      return;
    }

    if (avisoVazio)   { avisoVazio.hidden = true; }
    if (saidaTextarea) { saidaTextarea.value = resultado.markdown; }
    if (saidaSection) { saidaSection.hidden = false; }

    // Rola suavemente até a área de saída
    if (saidaSection && saidaSection.scrollIntoView) {
      saidaSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCopiar() {
    if (!saidaTextarea) { return; }
    var texto = saidaTextarea.value;
    if (!texto) { return; }
    copiarTexto(texto, btnCopiar);
  }

  function handleBaixar() {
    if (!saidaTextarea) { return; }
    var markdown = saidaTextarea.value;
    if (!markdown) { return; }
    var nome = inputNome ? inputNome.value.trim() : "";
    baixarMarkdown(markdown, nome);
    window.DevHelper.flashButton(btnBaixar, "Baixando...");
  }

  function handleLimpar() {
    // Limpa campos simples
    if (inputNome)     { inputNome.value     = ""; }
    if (inputPrazo)    { inputPrazo.value    = ""; }
    if (inputStack)    { inputStack.value    = ""; }
    if (inputObjetivo) { inputObjetivo.value = ""; }

    // Limpa e reinicializa cada lista dinâmica (remove todos os itens e cria 1 vazio)
    LISTAS.forEach(function (def) {
      var listaEl = document.getElementById(def.id);
      if (!listaEl) { return; }
      // Remove todos os filhos do contêiner
      while (listaEl.firstChild) {
        listaEl.removeChild(listaEl.firstChild);
      }
      // Recria um item vazio
      criarItemLista(listaEl);
    });

    // Oculta a seção de saída
    if (saidaSection)  { saidaSection.hidden  = true; }
    if (saidaTextarea) { saidaTextarea.value  = ""; }
    if (avisoVazio)    { avisoVazio.hidden     = true; }

    // Foca o campo de nome para começar novo escopo
    if (inputNome) { inputNome.focus(); }
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  btnGerar.addEventListener("click", handleGerar);
  btnCopiar.addEventListener("click", handleCopiar);
  btnBaixar.addEventListener("click", handleBaixar);

  if (btnLimpar) {
    btnLimpar.addEventListener("click", handleLimpar);
  }

  // ─── Inicialização ───────────────────────────────────────────────────────────

  inicializarListas();

})();
