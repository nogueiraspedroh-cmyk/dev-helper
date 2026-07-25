# Biblioteca — System Design L7 (Saga + Outbox + Rate Limiting)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 7º lote da seção System Design — primeiro lote com SVG inline

## Arquivos

- **Novos:** `biblioteca/saga/index.html` (slot `6868686868`, 424 linhas),
  `biblioteca/outbox/index.html` (slot `6969696969`, 404 linhas),
  `biblioteca/rate-limiting/index.html` (slot `7070707070`, 467 linhas).
- **Alterados:** `biblioteca/index.html` (3 cards + comentário-guia);
  `css/styles.css` (`.artigo__figura` + `.artigo__figura figcaption` adicionados).
- **Corrigido (pós-review):** typo "introduce" → "introduz" em `outbox/index.html:224`.
- **Inalterado:** `js/*`, raiz, `tools/*`.

## SVGs criados

- **Saga:** orquestração com Orchestrator → 3 serviços; seta de compensação
  em vermelho para falha; legenda de simbologia.
- **Outbox:** fluxo App → [Transação ACID: pedidos + outbox] → Relay → Broker
  → Consumers; seta tracejada de marcação processed_at.
- **Rate Limiting:** Token Bucket (tokens + burst) vs Fixed Window (problema
  de burst na virada); Sliding Window Counter como solução; bloco de headers
  HTTP `X-RateLimit-*`.

## Conteúdo

- **Saga:** coreografia vs orquestração; transações compensatórias (não rollbacks);
  estado intermediário visível; armadilha compensação não idempotente.
- **Outbox:** atomicidade banco↔broker; INSERT na outbox na mesma transação;
  Relay com polling vs CDC; semântica at-least-once com `ON CONFLICT DO NOTHING`;
  armadilha outbox sem limpeza.
- **Rate Limiting:** 5 algoritmos (Token Bucket, Leaky Bucket, Fixed Window,
  Sliding Window Log, Sliding Window Counter); HTTP 429 + `X-RateLimit-*`;
  Redis com Lua script para distribuído; armadilha "por IP em redes corporativas".

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. 3 sugestões opcionais:
typo "introduce" → **aplicado**; acentuação em SVG (requisições/Solução) —
não aplicado (cosmético interno ao SVG); segunda seta de compensação no
diagrama de Saga — não aplicado (legenda compensa).

## Estado da Biblioteca

**52 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
16 System Design. Todos os artigos System Design de L7 em diante têm SVG.
