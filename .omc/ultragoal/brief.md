# Tradução completa do Tools Dev para inglês

Ponto final: todos os escopos do site (tools-dev, site estático HTML/CSS/JS
vanilla, sem build, S3+CloudFront) têm uma versão em inglês publicável sob a
árvore `/en/`, seguindo exatamente o padrão já validado na Fase A (piloto):

- `en/tools/<slug>/index.html` + `js/tools-en/<slug>.js` (lógica idêntica ao
  `js/tools/<slug>.js`, só strings visíveis ao usuário traduzidas, mesmos
  `id`s de elemento).
- Cada ferramenta/artigo traduzido ganha uma entrada em `TRANSLATED_PATHS`
  (`js/main.js`) para que o seletor de idioma e a sidebar parem de usar o
  fallback pt-BR para aquele slug.
- hreflang recíproco (`<link rel="alternate" hreflang="pt-BR|en">`) entre
  cada par de páginas traduzido.
- Nada de sistema de i18n runtime/string-table — duplicar arquivo plano é o
  padrão deste projeto (ver CLAUDE.md: sem build, sem framework).

Referências obrigatórias antes de cada lote: `CLAUDE.md`, `docs/PLANEJAMENTO.md`
(decomposição/delegação/DoD), plano da Fase A em
`/home/casa/.claude/plans/recursive-conjuring-blanket.md`, flow da Fase A em
`.claude-work/flows/2026-07-25-traducao-ingles-fase-a-infra-piloto.md`.

## Política de execução (vale para toda story)

1. Delegar implementação ao agente `dev-typescript` (agente padrão deste
   projeto para HTML/CSS/JS vanilla).
2. Gate obrigatório: `code-reviewer` (read-only) revisa o diff antes de
   fechar a story.
3. Máximo **2 tentativas** de correção por story (implementação inicial +
   1 rodada de correção de achados do review). Se depois da 2ª tentativa
   ainda houver bloqueador em aberto, NÃO force a conclusão — registre via
   `record-review-blockers` e escale para o usuário em vez de insistir numa
   3ª rodada sozinho.
4. Validar sempre via `docker compose up -d` (nginx local) + `node --check`
   nos JS tocados + checagem de status HTTP das páginas novas e das pt-BR
   equivalentes (sem regressão).
5. Documentar o flow de cada lote (ou do conjunto de lotes de uma fase) em
   `.claude-work/flows/`, seguindo o padrão dos arquivos já existentes.

## Fase B — as 36 ferramentas restantes (piloto `json` já concluído na Fase A)

Agrupadas pelas mesmas 6 categorias já usadas em `TOOL_CATEGORIES`
(`js/main.js`) e no catálogo da home, para manter a sidebar/catálogo
coerentes enquanto a tradução avança em lotes.

## Fase C — Biblioteca (55 artigos long-form, com diagramas SVG inline)

Fora de escopo da Fase A por decisão explícita do usuário. Precisa de uma
story de infraestrutura própria (equivalente ao que a Fase A fez em
`js/main.js` para TOOLS/TOOL_CATEGORIES) antes dos lotes de conteúdo:
`BIBLIOTECA_CATEGORIES_EN` em `js/main.js`, decisão sobre o link "Library"
da sidebar (hoje aponta para `/biblioteca/` pt-BR como fallback interino —
decidir se passa a ter fallback por artigo, igual ao `translatedToolSlugs`
das ferramentas), e replicar o padrão de `js/tools-en/<slug>.js` para os
scripts de artigo, se existirem (`js/biblioteca.js` — conferir se tem string
pt-BR hardcoded, mesmo problema que apareceu em `js/tools/<slug>.js`).

Artigos long-form COM diagrama SVG inline exigem atenção redobrada: os
textos dentro do SVG (labels dos diagramas) também são conteúdo visível e
precisam ser traduzidos, não só o texto ao redor.

## Encerramento

Story final: revisão de ponta a ponta do site bilíngue completo (todas as
ferramentas + toda a Biblioteca + home + institucionais), incluindo o gate
final obrigatório do ultragoal (ai-slop-cleaner + verificação + code-review
com evidência limpa) antes de marcar o objetivo agregado como concluído.
