---
title: Tradução para inglês — Fase C (Biblioteca, 55 artigos) + gate final do ultragoal
date: 2026-07-29
task_ref: "-"
agents: [dev-typescript, code-reviewer]
files_touched:
  - js/main.js
  - en/index.html
  - en/biblioteca/index.html
  - en/biblioteca/**/index.html (55 pastas)
  - biblioteca/**/index.html (55 páginas pt-BR — hreflang retrofit)
tags: [static-site, i18n, en, feat, seo, lote, biblioteca, svg]
iterations: 3
status: success
---

## Contexto
Fecha o `/goal` agregado aberto na Fase A ([[2026-07-25-traducao-ingles-fase-a-infra-piloto]])
e continuado na Fase B ([[2026-07-25-traducao-ingles-fase-b-37-ferramentas]]):
tradução completa do site (home + 37 ferramentas + institucionais + os 55
artigos long-form da Biblioteca de system design) para inglês, via árvore
espelhada `/en/`. Este documento cobre G007-G015 do plano ultragoal — a Fase
C inteira (infra da Biblioteca + 6 lotes de artigos) e o gate final que
encerrou as 15 stories.

## Decisão arquitetural
Mesmo padrão fechado na Fase A/B, estendido para artigos: cada artigo ganha
`en/biblioteca/<slug>/index.html` (mesmo slug do pt-BR), entrada em
`TRANSLATED_PATHS`, hreflang recíproco no par PT↔EN, e link no catálogo
`en/biblioteca/index.html`. Novidade desta fase: 6 dos 55 artigos (a partir
do Lote 6b) têm diagramas `<svg>` inline com texto em pt-BR — regra
estabelecida: traduzir só o conteúdo de `<text>`/`<tspan>`, preservar todo
atributo geométrico (x, y, width, height, viewBox, d, points, transform,
fill, stroke, font, ids, classes) byte-a-byte, verificar por contagem de
`<text>` + diff estrutural com texto mascarado + checagem de overflow visual
por largura de glifo.

## Passos executados
1. G007 — Infra da Biblioteca — `BIBLIOTECA_CATEGORIES_EN` em `js/main.js` +
   fallback pt-BR interino para artigos ainda não traduzidos.
2. G008 — Lote 1, Padrões de Criação (5: singleton, factory-method,
   abstract-factory, builder, prototype).
3. G009 — Lote 2, Padrões Estruturais (7: adapter, decorator, facade, proxy,
   composite, bridge, flyweight).
4. G010 — Lote 3, Padrões Comportamentais (11: strategy, observer, state,
   template-method, command, mediator, iterator, chain-of-responsibility,
   memento, visitor, interpreter).
5. G011 — Lote 4, Arquiteturas de Software (10: mvc, arquitetura-em-camadas,
   arquitetura-hexagonal, clean-architecture, onion-architecture, mvp, mvvm,
   cqrs, event-driven, monolito-vs-microsservicos).
6. G012 — Lote 5, Organização de Código (3: monolito-vs-monorepo,
   feature-vs-layer, estrutura-de-pastas).
7. G013 — Lote 6a, Infra e Escala parte 1 (10: escalabilidade-horizontal-
   vertical, load-balancing, caching, sql-vs-nosql, rest-vs-graphql-vs-grpc,
   filas-de-mensagem, circuit-breaker, sla-slo-sli, idempotencia, sharding).
8. G014 — Lote 6b, Infra e Escala parte 2 (9: replicacao-de-banco, cdn,
   api-gateway, saga, outbox, rate-limiting, observabilidade,
   websockets-sse, consistencia) — primeiro lote com SVG inline.
9. G015 — Gate final: cobertura 100% (37 tools + 55 artigos, zero fallback
   pt-BR pendente em `TRANSLATED_PATHS`), sweep HTTP de 98 páginas EN
   (`localhost:8000` via docker/nginx), `ai-slop-cleaner` (modo reviewer-only,
   delegado a code-reviewer) sobre toda a árvore `/en/` + `js/main.js` +
   `js/tools-en/`, correções diretas, segundo code-review de verificação,
   correções finais, checkpoint com `--quality-gate-json`
   (aiSlopCleaner/verification/codeReview todos `passed`/`APPROVE`/`CLEAR`).

## Iterações
- **G013**: agente de implementação original foi interrompido por limite de
  sessão da API e (diferente da lição da Fase B) não deixou nenhum progresso
  real no disco apesar do self-report sugerir quase-conclusão — recuperado
  reiniciando do zero após confirmar o horário de reset. Review subsequente
  achou 4 bloqueadores (10 cards do índice com `href="../<slug>/"` em vez de
  `href="<slug>/"` — 404; tabela comparativa desalinhada em
  rest-vs-graphql-vs-grpc; JSON mal indentado em sql-vs-nosql; conector
  desconectado em idempotencia) + 4 avisos (setas ASCII em vez de Unicode,
  `<` não escapado, label não centralizado) — todos corrigidos diretamente
  via scripts Python de cálculo de coluna exata, sem precisar de 2ª rodada.
- **G014**: primeiro lote com SVG. Pré-visto o risco de vazamento pt-BR
  residual e o bug de link do G013 no prompt de delegação — o agente evitou
  os dois. Review inicial foi interrompida por limite de sessão sem achados;
  refeita do zero (agentes de revisão são read-only, não deixam progresso
  parcial). Resultado: 0 bloqueadores, 4 avisos cosméticos (comentários
  desatualizados, 1 link relacionado divergente entre pt/en, gloss redundante
  num diagrama, régua ASCII 2 colunas curta) — todos corrigidos diretamente.
- **G015**: o review agregado de "AI slop" (focado em padrões que só
  aparecem no nível do conjunto, não por arquivo) achou 1 **bloqueador real**
  que nenhum dos 14 reviews de lote anteriores podia ter pego: a busca
  unificada da home (`js/main.js`, bloco `resultadosGrid`) usava
  `BIBLIOTECA_CATEGORIES` (pt-BR) incondicionalmente, então a busca em
  `/en/index.html` renderizava os 55 títulos de artigo e as 6 categorias em
  português — usuário buscando "architecture" ou "infrastructure" não achava
  nada, buscando "padrões" achava tudo. Corrigido trocando para
  `BIBLIOTECA_CATEGORIES_EN` quando `isEnglishPath(location.pathname)`.
  Também achou 4 ressalvas não-cosméticas (falso cognato "tempo real" →
  "real time" em vez de "enough time" em circuit-breaker; 3 comentários em
  `js/main.js` ainda descrevendo o mundo da Fase A/piloto; metadados de
  processo — "Fase C, Lote 6b" — vazando para comentários HTML publicados;
  `tradeoff` inconsistente em consistencia) — corrigidas, depois confirmadas
  por um segundo code-review dedicado, que por sua vez achou só 3 comentários
  residuais de metadado de processo — corrigidos numa 3ª rodada curta.

## Pegadinhas / lições aprendidas
- **Bug de link "índice dentro do próprio diretório"**: como
  `en/biblioteca/index.html` já está dentro de `en/biblioteca/`, o link para
  um artigo irmão é `href="<slug>/"` (sem `../`) — usar `../<slug>/`
  resolveria para `en/<slug>/`, inexistente. Esse exato bug apareceu no G013
  e foi ativamente prevenido nos lotes seguintes citando-o no prompt.
- **SVG traduzido precisa de verificação geométrica, não só textual**:
  contagem de `<text>`/`<tspan>` idêntica entre pt/en, diff estrutural com
  texto mascarado para pegar qualquer atributo alterado por engano, e checagem
  de overflow por largura de glifo (rótulo em inglês pode ser mais longo que
  o placeholder pt-BR original e vazar da caixa).
- **Bugs agregados só aparecem revisando o conjunto inteiro**: o bloqueador
  da busca da home sobreviveu a 14 reviews de lote porque cada um revisava só
  os artigos daquele lote, nunca a home (entregue na Fase A/B, antes de
  `BIBLIOTECA_CATEGORIES_EN` existir). Vale considerar, em iniciativas
  futuras de tradução em lote, reservar um passe agregado explícito (não só
  por-lote) mirado em código compartilhado tocado indiretamente por vários
  lotes.
- **Comentários acumulam metadado de processo (fase/lote/story) que
  envelhece mal**: ao longo de 8 lotes, comentários em `js/main.js` e em HTML
  publicado passaram a afirmar coisas como "só o piloto tools/json está
  traduzido" muito depois de deixar de ser verdade, e a citar números de
  lote/story sem valor para quem mantém o código depois. Preferir descrever
  o estado atual do sistema, não o histórico de como ele chegou lá — esse
  histórico já vive nos flows (`.claude-work/flows/`) e no ledger do
  ultragoal.
- **Agentes de revisão read-only não deixam "progresso parcial" quando
  interrompidos** — ao contrário de agentes de implementação, uma
  interrupção de sessão numa revisão precisa ser refeita do zero, não
  retomada; não há arquivo em disco para inspecionar.
- **Gate final do ultragoal (`--quality-gate-json`) exige evidência
  estruturada** nas 3 chaves `aiSlopCleaner`/`verification`/`codeReview`,
  cada uma com status explícito (`passed`/`APPROVE`+`CLEAR`) — só então o
  checkpoint de `complete` é aceito para a última story do plano.

## Cobertura final (todas as fases)
- 37/37 ferramentas traduzidas (`js/tools-en/`, `en/tools/<slug>/`).
- 55/55 artigos da Biblioteca traduzidos (`en/biblioteca/<slug>/`), incluindo
  6 com SVG inline.
- Home, catálogo da Biblioteca e páginas institucionais traduzidos.
- `TRANSLATED_PATHS` (`js/main.js`) com 98 entradas — zero fallback pt-BR
  exercitado em produção (mecanismo mantido como rede de segurança para
  conteúdo futuro).
- 98 páginas EN + páginas centrais verificadas via HTTP 200 (docker/nginx
  local, paridade com S3/CloudFront).

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-07-25-traducao-ingles-fase-a-infra-piloto]]
  (infra + piloto), [[2026-07-25-traducao-ingles-fase-b-37-ferramentas]]
  (37 ferramentas). Ultragoal: `.omc/ultragoal/goals.json` — 15/15 stories
  `complete`.
