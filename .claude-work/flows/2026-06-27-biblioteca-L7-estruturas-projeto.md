# Biblioteca — L7 (Estruturas de Projeto: nova seção)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 7º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Estrear a nova seção **Estruturas de Projeto** no índice da Biblioteca.

## Arquivos

- **Novos:** `biblioteca/monolito-vs-monorepo/index.html` (slot `4747474747` — 4444 colidiu com
  tools/cartao), `biblioteca/feature-vs-layer/index.html` (slot `4545454545`),
  `biblioteca/estrutura-de-pastas/index.html` (slot `4646464646`).
- **Alterados:** `biblioteca/index.html` — nova `<section class="catalog">` "Estruturas de Projeto"
  após Arquiteturas, com 3 cards + ✓ no comentário-guia.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Monolito-vs-Monorepo** (slug correto: monorepo × multi-repo; "monolito" entra só como armadilha
  de ortogonalidade): eixos ortogonais (organização de repo ≠ organização de deploy); tabela das 4
  combinações válidas (incl. microsserviços em monorepo); variantes Turborepo/Nx/pnpm workspaces;
  armadilhas: CI sem cache incremental, acoplamento por imports internos.
- **Feature-vs-Layer**: diagramas ASCII comparáveis (mesmos 3 domínios, critérios opostos); posição
  intermediária (feature com camadas internas); armadilhas feature-silo e 5-diretórios-por-1-feature.
- **Estrutura-de-Pastas**: árvores backend (Node API) e frontend (SPA); Screaming Architecture;
  convenções de nível raiz; armadilhas utils-lixeira, barrel re-exports com ciclo documentado, shared/
  sem critério.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou ortogonalidade monorepo/monolito (correta,
tabela das 4 combinações presente), diagramas ASCII comparáveis (mesmos domínios), barrel circular
conceitualmente correto, disciplina de links (monolito-vs-microsservicos → span pendente). Colisão de
slot detectada e evitada (4444→4747). 2 sugestões opcionais — **não aplicadas**: slug naming (renomear
quebraria o link sem redirect S3) e import idiom cosmético.

## Nota de slug

O slug `monolito-vs-monorepo` ficou levemente divergente do conteúdo (que compara monorepo×multi-repo).
Não renomear: quebra o link já publicado sem redirect no S3/CloudFront. Registrado para não confundir
com o futuro artigo de Monolito vs Microsserviços (slug planejado: `monolito-vs-microsservicos`).

## Validação

- HTTP 200 nos 3 artigos + índice. Scripts na ordem; slots únicos; zero links para artigos inexistentes.

## Estado da Biblioteca

**31 artigos**: 21 patterns GoF + 7 Arquiteturas + **3 Estruturas de Projeto** (nova seção).

## Próximo

L8 (CQRS + Event-Driven Architecture), depois L9 (Monolito vs Microsserviços), L10 (Visitor + Interpreter).
