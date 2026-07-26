// biblioteca.js — lógica exclusiva das páginas da Biblioteca (artigos educacionais).
// Carregado apenas em biblioteca/index.html e biblioteca/<slug>/index.html,
// DEPOIS de js/main.js, no final do <body>.
//
// Responsabilidades (cada uma com seu próprio guard defensivo, já que nem
// toda página da Biblioteca tem os três recursos — o índice não tem
// .code-tabs nem .artigo__corpo, e os artigos não têm a busca):
//   1. Sistema de abas de linguagem (.code-tabs) — só em artigos.
//   2. Busca client-side do índice de artigos — só em biblioteca/index.html.
//   3. Sumário (TOC) auto-gerado a partir dos <h2> do artigo — só em
//      artigos, injetado 100% via JS (nenhum dos 55 index.html é editado).
// Anti-XSS: os três recursos só fazem toggle de visibilidade (hidden/
// classList) ou criam nós via createElement + textContent sobre conteúdo
// que já existe no DOM — nenhum innerHTML com conteúdo dinâmico ou digitado
// pelo usuário.

(function () {
  "use strict";

  // ================================================================
  // 1. ABAS DE LINGUAGEM (.code-tabs) — presente só nos 55 artigos.
  // Suporta múltiplos grupos de abas independentes na mesma página.
  // ================================================================
  var grupos = document.querySelectorAll(".code-tabs");

  if (grupos.length) {
    grupos.forEach(function (grupo) {
      var abas = grupo.querySelectorAll(".code-tabs__tab");
      var paineis = grupo.querySelectorAll(".code-tabs__panel");

      if (!abas.length || !paineis.length) { return; }

      // Ativa uma aba e exibe seu painel correspondente dentro deste grupo.
      function ativar(lang) {
        abas.forEach(function (aba) {
          var ativo = aba.getAttribute("data-lang") === lang;
          aba.classList.toggle("code-tabs__tab--ativa", ativo);
          // Acessibilidade: aria-selected
          aba.setAttribute("aria-selected", ativo ? "true" : "false");
        });

        paineis.forEach(function (painel) {
          var ativo = painel.getAttribute("data-lang") === lang;
          // Usa o atributo `hidden` nativo — mais semântico e compatível com
          // a regra CSS .code-tabs__panel[hidden] { display: none; }
          if (ativo) {
            painel.removeAttribute("hidden");
          } else {
            painel.setAttribute("hidden", "");
          }
        });
      }

      // Adiciona papel ARIA às abas (role="tab" é informativo; sem tablist
      // completo para não introduzir dependências de gestão de foco
      // complexas em HTML puro).
      abas.forEach(function (aba) {
        aba.setAttribute("role", "tab");

        aba.addEventListener("click", function () {
          var lang = aba.getAttribute("data-lang");
          if (lang) { ativar(lang); }
        });

        // Suporte a teclado: Enter e Espaço ativam a aba focada.
        aba.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            var lang = aba.getAttribute("data-lang");
            if (lang) { ativar(lang); }
          }
        });
      });

      // Estado inicial: ativa a aba marcada com .code-tabs__tab--ativa,
      // ou, se nenhuma estiver marcada, ativa a primeira.
      var ativaInicial = grupo.querySelector(".code-tabs__tab--ativa");
      var langInicial = ativaInicial
        ? ativaInicial.getAttribute("data-lang")
        : (abas[0] ? abas[0].getAttribute("data-lang") : null);

      if (langInicial) { ativar(langInicial); }
    });
  }

  // ================================================================
  // 2. BUSCA CLIENT-SIDE DO ÍNDICE — só em biblioteca/index.html.
  // Filtra os .tool-card já renderizados por título (e, se o termo bater
  // com o nome de uma categoria, mostra a categoria inteira). Sem chamada
  // de rede — os 55 artigos já estão no DOM. Nunca insere a query digitada
  // no DOM (só toggla `hidden` sobre nós existentes).
  // ================================================================
  var buscaInput = document.getElementById("biblioteca-busca");

  if (buscaInput) {
    var secoesCatalogo = document.querySelectorAll(".catalog");
    var mensagemVazio = document.getElementById("biblioteca-busca-vazio");

    // Normaliza para comparação tolerante a maiúsculas/acentos
    // ("arquitetura" encontra "Arquitetura Hexagonal", "camadas" etc.).
    function normalizar(texto) {
      return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function filtrar() {
      var termo = normalizar(buscaInput.value.trim());
      var termoVazio = termo === "";
      var algumCardVisivelNaPagina = false;

      secoesCatalogo.forEach(function (secao) {
        var algumaCategoriaVisivelNaSecao = false;

        secao.querySelectorAll(".catalog__category").forEach(function (categoria) {
          var tituloCategoriaEl = categoria.querySelector(".catalog__category-title");
          var nomeCategoria = tituloCategoriaEl ? normalizar(tituloCategoriaEl.textContent) : "";
          var categoriaCombinaComTermo = !termoVazio && nomeCategoria.indexOf(termo) !== -1;
          var algumCardVisivelNaCategoria = false;

          categoria.querySelectorAll(".tool-card").forEach(function (card) {
            var tituloEl = card.querySelector(".tool-card__title");
            var titulo = tituloEl ? normalizar(tituloEl.textContent) : "";
            var visivel = termoVazio || categoriaCombinaComTermo || titulo.indexOf(termo) !== -1;

            card.hidden = !visivel;
            if (visivel) { algumCardVisivelNaCategoria = true; }
          });

          categoria.hidden = !algumCardVisivelNaCategoria;
          if (algumCardVisivelNaCategoria) { algumaCategoriaVisivelNaSecao = true; }
        });

        // Esconde a seção inteira (com seu <h2>) se nenhuma categoria dela
        // sobreviveu ao filtro — evita título "órfão" sem cards abaixo.
        secao.hidden = !algumaCategoriaVisivelNaSecao;
        if (algumaCategoriaVisivelNaSecao) { algumCardVisivelNaPagina = true; }
      });

      if (mensagemVazio) {
        mensagemVazio.hidden = termoVazio || algumCardVisivelNaPagina;
      }
    }

    buscaInput.addEventListener("input", filtrar);

    // Estado inicial (campo pode vir preenchido via autofill do navegador).
    filtrar();
  }

  // ================================================================
  // 3. SUMÁRIO (TOC) DO ARTIGO — só em biblioteca/<slug>/index.html.
  // Construído inteiramente em runtime a partir dos <h2> já presentes no
  // DOM: nenhum dos 55 index.html é editado. Guard por .artigo__corpo, que
  // só existe nas páginas de artigo (o índice tem .catalog, não isso).
  // ================================================================
  var artigoCorpo = document.querySelector(".artigo__corpo");

  if (artigoCorpo) {
    var headings = artigoCorpo.querySelectorAll(".artigo__secao h2");

    // Normaliza para slug: minúsculas, sem acento (mesma técnica de
    // normalizar() usada na busca do bloco 2), troca tudo que não for
    // [a-z0-9] por hífen, colapsa/limpa hífens nas pontas.
    function slugificar(texto) {
      return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (headings.length) {
      // Único texto visível hardcoded deste arquivo — reaproveita
      // window.DevHelper.isEnglishPath (exposta em js/main.js, carregado
      // antes deste script em toda página da Biblioteca) para não duplicar
      // a lógica de detecção de idioma aqui.
      var isEnglish =
        window.DevHelper && typeof window.DevHelper.isEnglishPath === "function"
          ? window.DevHelper.isEnglishPath(location.pathname)
          : false;
      var tocTitulo = isEnglish ? "On this page" : "Nesta página";

      var slugsUsados = Object.create(null);
      var nav = document.createElement("nav");
      var lista = document.createElement("ul");

      nav.className = "artigo-toc";
      nav.setAttribute("aria-label", tocTitulo);

      var titulo = document.createElement("p");
      titulo.className = "artigo-toc__title";
      titulo.textContent = tocTitulo;
      nav.appendChild(titulo);

      headings.forEach(function (heading) {
        var texto = heading.textContent.trim();

        if (!heading.id) {
          var base = slugificar(texto) || "secao";
          var slug = base;
          var contador = 2;

          // Garante unicidade do id dentro do artigo (heading repetido ou
          // que gera o mesmo slug de outro já processado).
          while (slugsUsados[slug] || document.getElementById(slug)) {
            slug = base + "-" + contador;
            contador += 1;
          }

          heading.id = slug;
        }

        slugsUsados[heading.id] = true;

        var item = document.createElement("li");
        var link = document.createElement("a");

        link.href = "#" + heading.id;
        link.className = "artigo-toc__link";
        link.textContent = texto;

        item.appendChild(link);
        lista.appendChild(item);
      });

      nav.appendChild(lista);

      // Envolve o <article> existente num wrapper de grid (article + toc),
      // sem alterar o HTML original do artigo — só reposiciona o mesmo nó.
      var artigo = document.querySelector(".artigo");

      if (artigo && artigo.parentNode) {
        var wrapper = document.createElement("div");
        wrapper.className = "artigo-layout";

        artigo.parentNode.insertBefore(wrapper, artigo);
        wrapper.appendChild(artigo);
        wrapper.appendChild(nav);

        var main = document.querySelector("main.container");
        if (main) {
          main.classList.add("container--article-toc");
        }

        // Scroll-spy opcional: marca o link do heading atualmente em foco
        // de leitura. Baixo risco/esforço — falha silenciosa se o browser
        // não suportar IntersectionObserver (TOC continua 100% funcional
        // via âncora nativa).
        if ("IntersectionObserver" in window) {
          var linkPorId = Object.create(null);
          lista.querySelectorAll(".artigo-toc__link").forEach(function (link) {
            linkPorId[link.getAttribute("href").slice(1)] = link;
          });

          var ativarLink = function (id) {
            for (var key in linkPorId) {
              if (Object.prototype.hasOwnProperty.call(linkPorId, key)) {
                linkPorId[key].classList.toggle("artigo-toc__link--active", key === id);
              }
            }
          };

          var observer = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  ativarLink(entry.target.id);
                }
              });
            },
            { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
          );

          headings.forEach(function (heading) {
            observer.observe(heading);
          });
        }
      }
    }
  }
})();
