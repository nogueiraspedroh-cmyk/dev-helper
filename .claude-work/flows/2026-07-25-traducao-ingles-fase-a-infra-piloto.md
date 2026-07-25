---
title: Tradução para inglês — Fase A (infraestrutura i18n + piloto com 1 ferramenta)
date: 2026-07-25
task_ref: "-"
agents: [orquestrador, dev-typescript, code-reviewer]
files_touched:
  - js/main.js
  - css/styles.css
  - index.html
  - pages/sobre.html
  - pages/contato.html
  - tools/json/index.html
  - en/index.html
  - en/pages/about.html
  - en/pages/contact.html
  - en/tools/json/index.html
  - js/tools-en/json.js
tags: [static-site, i18n, en, infra, feat, seo]
iterations: 2
status: success
---

## Contexto
Pedido do usuário: "criar a tradução para inglês da nossa ferramenta". Esclarecido
que significa o site inteiro (37 ferramentas + home + institucionais), com a
Biblioteca (55 artigos long-form) explicitamente fora de escopo por ora (vira
"Fase C" separada). Dado o tamanho (37 ferramentas), o trabalho foi dividido em
Fase A (infra + 1 ferramenta piloto, esta execução), Fase B (36 ferramentas
restantes, mesmo padrão em lote) e Fase C (Biblioteca).

## Decisão arquitetural
- **URL tree `/en/` espelhando pt-BR** (mesmo padrão "diretório + index.html" já
  usado, ex. `/tools/json/`), em vez de troca de idioma client-side numa única
  URL — melhor SEO e consistente com hosting estático sem backend/rewrites.
- **Slugs idênticos entre idiomas** (`/en/tools/json/`); só páginas
  institucionais ganham slug em inglês (`sobre.html`→`about.html`,
  `contato.html`→`contact.html`).
- **`js/tools-en/<slug>.js` por ferramenta traduzida** (cópia de
  `js/tools/<slug>.js` com só as strings visíveis traduzidas, lógica idêntica)
  em vez de um sistema de i18n runtime/string-table — decisão deliberada para
  não introduzir build step/dependência, seguindo o princípio do CLAUDE.md
  ("sem framework, sem build step").
- **Seletor de idioma injetado via JS** (`js/main.js`), não editado à mão nas
  ~90 páginas pt-BR — usa tabela extensível `TRANSLATED_PATHS` (hoje 4 pares).
  Quando o path atual não tem tradução 1:1, cai no fallback "home do idioma
  alvo" em vez de linkar para página inexistente.
- Biblioteca continua só pt-BR (decisão consciente); sidebar da Biblioteca
  sempre linka `/biblioteca/` mesmo em páginas `/en/*`.

## Passos executados
1. Investigação técnica — orquestrador — descobriu 2 fatores que definiram o
   escopo: `js/main.js` tem ~15 strings de UI + tabelas `TOOLS`/`TOOL_CATEGORIES`
   hardcoded em pt-BR (script único compartilhado por todas as páginas); 36 dos
   37 `js/tools/<slug>.js` têm strings pt-BR visíveis ao usuário.
2. Infra de i18n em `js/main.js` — dev-typescript — `isEnglishPath(pathname)`
   (extraída de dentro de `computeRelativePrefix`, reaproveitando
   `pathSegments`); `TOOLS_EN`/`TOOL_CATEGORIES_EN` derivadas de
   `TOOLS`/`TOOL_CATEGORIES` via `.map()` + dicionário de tradução (evita
   duplicar os 37 ícones SVG e listas divergentes); `UI_STRINGS`/`uiText()`
   para strings fixas de UI; `buildLanguageSwitchHref`/`buildLanguageSwitchMarkup`
   para o seletor PT/EN.
3. Páginas piloto + hreflang retrofit — dev-typescript — criou
   `en/index.html`, `en/pages/about.html`, `en/pages/contact.html`,
   `en/tools/json/index.html`, `js/tools-en/json.js`; adicionou
   `<link rel="alternate" hreflang="pt-BR|en">` recíproco nos 4 pares
   traduzidos (páginas pt-BR existentes só ganharam essa tag, nada mais mudou).
4. Estilo do seletor — dev-typescript — bloco `.nav__lang*` em `css/styles.css`.
5. Code review (read-only) do diff completo — code-reviewer — 1 bloqueador +
   1 warning (ver Iterações).
6. Correção dos achados — dev-typescript — ajustes mecânicos, revalidados via
   curl + `node --check` sem nova rodada de review (achados objetivos).

## Iterações
- **Iter 1**: code-reviewer encontrou (a) bloqueador — a sidebar injetada por
  `js/main.js` em páginas `/en/*` linkava TODAS as 37 ferramentas com prefixo
  `en/`, gerando 404 nas 36 ainda não traduzidas (inconsistente com o fallback
  já usado em `en/index.html`); (b) warning — CSS ausente para as classes
  `.nav__lang*` injetadas pelo seletor de idioma.
- **Iter 2**: dev-typescript corrigiu ambos — sidebar passou a usar
  `translatedToolSlugs` (derivado automaticamente de `TRANSLATED_PATHS`, não
  hardcoded) para decidir por slug se linka `en/tools/<slug>/` ou faz fallback
  para `tools/<slug>/` pt-BR; CSS do seletor adicionado. Revalidado com curl +
  `node --check`, sem necessidade de nova rodada de code-review.

## Pegadinhas / lições aprendidas
- Qualquer novo componente injetado via JS (sidebar, seletor de idioma) que
  gera links para conteúdo ainda-não-traduzido precisa checar a lista de slugs
  já traduzidos (`translatedToolSlugs`, derivada de `TRANSLATED_PATHS`) antes
  de montar o href com prefixo `en/` — senão gera 404 silencioso. Esse é o
  padrão a seguir na Fase B conforme cada ferramenta for traduzida.
- `js/main.js` sendo o único script compartilhado por todas as páginas significa
  que qualquer feature "language-aware" tem que entrar ali, não em páginas
  individuais — foi o que fez a Fase A ser maior que "só traduzir HTML".

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: Fase B (traduzir as 36 ferramentas restantes, mesmo
  padrão em lote, gate de code-reviewer por lote) e Fase C (tradução da
  Biblioteca, incluindo `BIBLIOTECA_CATEGORIES_EN` e decisão sobre o link
  "Library" da sidebar EN) ainda não têm flow próprio — ficam para quando
  forem executadas. Gap conhecido não bloqueador: `error.html` (404 do
  S3/CloudFront) continua só pt-BR, fora de escopo desta fase.
