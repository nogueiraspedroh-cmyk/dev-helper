# Biblioteca — System Design L6 (CDN + API Gateway)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 6º lote da seção System Design

## Arquivos

- **Novos:** `biblioteca/cdn/index.html` (slot `6565656565`, 447 linhas),
  `biblioteca/api-gateway/index.html` (slot `6767676767`, 444 linhas).
- **Alterados:** `biblioteca/index.html` (2 cards + comentário-guia) —
  editado pelo orquestrador (L6 não tocou no arquivo por paralelismo com L5).
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **CDN:** PoP; cache HIT/MISS; Cache-Control/TTL com exemplos práticos
  (`max-age`, `s-maxage`, `immutable`, `stale-while-revalidate`); invalidação
  e cache busting por hash; Pull vs Push; armadilhas TTL longo sem cache
  busting e conteúdo dinâmico com Set-Cookie no cache.
- **API Gateway:** roteamento, authn/authz, rate limiting, SSL termination,
  logging, transformação de requests; BFF (Backend for Frontend) com diagrama;
  distinção Gateway vs Proxy Reverso; transcoding gRPC↔REST; armadilhas
  lógica de negócio no Gateway e single point of failure.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. 1 sugestão opcional —
**não aplicada** (fechar triângulo de cross-link caching→cdn no artigo de
caching — será avaliado na passagem de SVG/retrofit).

## Estado da Biblioteca

**49 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
13 System Design.
