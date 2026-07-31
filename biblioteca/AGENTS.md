<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# biblioteca/

## Purpose
Seção educacional do site: **~55 artigos** em português sobre Design Patterns
(GoF), arquiteturas de software e system design. Reforça conteúdo real para
SEO/AdSense (exigência documentada em `docs/ROADMAP.md` §2.2) e serve como
referência técnica para os visitantes do catálogo de ferramentas. `index.html`
nesta pasta é o índice/busca da biblioteca; cada subpasta `biblioteca/<slug>/`
é **um artigo**.

Existe um espelho completo em inglês em `../en/biblioteca/` (ver
`en/biblioteca/AGENTS.md`).

## Key Files / Patterns

Todo artigo (`biblioteca/<slug>/index.html`) segue o **mesmo template**,
2 níveis abaixo da raiz (assets via `../../`):

- `<head>`: título + meta description específicos, `css/styles.css`,
  Google Fonts, `<link rel="alternate" hreflang="en" href="../../en/biblioteca/<slug>/">`,
  lib do AdSense.
- `<body>`: nav/footer copiados (padrão do site, sem includes), depois
  `<article class="artigo">` com:
  - `<header class="artigo__header">`: breadcrumb, categoria
    (`.artigo__categoria`), título, subtítulo.
  - `<div class="artigo__corpo">`: seções (`<section class="artigo__secao">`)
    cobrindo Intenção, Problema, Solução, Estrutura, exemplos de código em
    abas **TypeScript + PHP** (`.code-tabs`, ver `js/biblioteca.js`), Quando
    usar / evitar, armadilhas comuns.
  - Artigos de System Design de nível L7+ incluem **diagramas SVG inline**
    (retrofit nos artigos mais antigos ainda pendente — ver
    `MEMORY.md`/`project-biblioteca-svg`).
- Bloco `<ins class="adsbygoogle">` + `<script>push({})`, com `data-ad-slot`
  próprio da página (placeholder `ca-pub-0000...` — não publicar valor real
  sem seguir o checklist de `DEPLOY.md`).
- Scripts no fim do `<body>`: `../../js/main.js` (global) **e**
  `../../js/biblioteca.js` (abas de código + TOC auto-gerado, só nesta
  seção).

Cada artigo é um diretório estruturalmente idêntico — **não crie um
`AGENTS.md` por artigo**; este arquivo documenta o padrão para todos.

## Subdirectories

Nenhum `AGENTS.md` filho — os ~55 diretórios `biblioteca/<slug>/` são folhas
(um único `index.html` cada, sem lógica própria além do template acima).
Categorias de conteúdo (ver `docs/ROADMAP.md` §2.2 para a lista completa):

| Categoria | Exemplos |
|---|---|
| Padrões de Criação (GoF) | Singleton, Factory Method, Builder |
| Padrões Estruturais (GoF) | Adapter, Decorator, Facade, Proxy |
| Padrões Comportamentais (GoF) | Strategy, Observer, Command, Mediator |
| Arquiteturas | MVC, Clean Architecture, Hexagonal, CQRS, Event-Driven |
| Estruturas de Projeto | Monorepo vs Multi-repo, Feature vs Camada |
| System Design | Caching, Load Balancing, Circuit Breaker, Sharding, Outbox |

## For AI Agents

### Working In This Directory
- Ao criar um artigo novo, copie a estrutura de um artigo existente da mesma
  categoria (ex.: `mvc/index.html` para arquiteturas, `singleton/index.html`
  para GoF) em vez de escrever do zero — garante consistência de classes CSS
  e de seções.
- Todo artigo novo em PT precisa do equivalente em `en/biblioteca/<slug>/`
  (mesmo slug) com o `hreflang` cruzado nos dois sentidos — não deixe a
  tradução pendente.
- Ao adicionar/editar artigos, atualize também `biblioteca/index.html` (índice
  local) e a tabela de contagem em `docs/ROADMAP.md` §2.2.
- Este site não tem build: `js/biblioteca.js` injeta o TOC (sumário) via JS
  em runtime — **não** edite os 55 `index.html` para adicionar TOC manual.

### Common Patterns
- Classes BEM-ish: `.artigo`, `.artigo__header`, `.artigo__secao`,
  `.artigo__destaque`, `.code-tabs` / `.code-tabs__tab` / `.code-tabs__panel`
  — todas vivem em `css/styles.css` (sem CSS por artigo).
- Exemplos de código sempre em par **TypeScript + PHP**, alternados via
  `data-lang` e `js/biblioteca.js` (nunca `innerHTML` com conteúdo dinâmico).
- Caminhos relativos `../../` (2 níveis) para tudo compartilhado
  (`css/`, `js/`, `favicon.svg`, `index.html` da raiz); `../` para voltar ao
  índice da biblioteca.

## Dependencies
- `css/styles.css` (classes `.artigo*`, `.code-tabs*`).
- `js/main.js` (global) + `js/biblioteca.js` (abas de código, busca do
  índice, TOC — exclusivo desta seção, ver `js/AGENTS.md`).
- Google Fonts + AdSense (mesmas libs do resto do site).
