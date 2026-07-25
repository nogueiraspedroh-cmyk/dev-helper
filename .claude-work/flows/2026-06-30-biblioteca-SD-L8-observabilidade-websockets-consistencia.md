# Biblioteca — System Design L8 (Observabilidade + WebSockets/SSE + Consistência)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 8º lote da seção System Design

## Arquivos

- **Novos:** `biblioteca/observabilidade/index.html` (slot `7171717171`, 520 linhas),
  `biblioteca/websockets-sse/index.html` (slot `7272727272`, 576 linhas),
  `biblioteca/consistencia/index.html` (slot `7373737373`, 519 linhas).
- **Alterados:** `biblioteca/index.html` (3 cards + comentário-guia) — editado
  pelo orquestrador (L8 não tocou no arquivo).
- **Corrigido (pós-review):** "Read-Your-Writes (monotonic writes)" → "(read-after-write)"
  em `consistencia/index.html:142` — Monotonic Writes e Read-Your-Writes são
  garantias distintas na taxonomia de Tanenbaum/DDIA.
- **Inalterado:** `css/styles.css`, `js/*`, raiz, `tools/*`.

## Nota de paralelismo

Primeira tentativa do L8 bateu no session limit antes de qualquer escrita.
Relançado após reset; segunda execução completou sem problemas.

## SVGs

- **Observabilidade:** 3 colunas (Logs JSON em fundo escuro, Métricas com
  polylines p50/p95/p99, Distributed Tracing com cascata de spans). Barra
  conectora com mesmo TraceID nos três pilares.
- **WebSockets/SSE:** diagrama de sequência comparativo — WebSocket (full-duplex),
  SSE (unidirecional com keepalive), Long Polling (ciclos request-response).
- **Consistência:** dois painéis — eventual (propagação assíncrona com leitura
  stale antes de convergir) vs forte (bloqueio síncrono até ack do segundo nó).

## Conteúdo

- **Observabilidade:** 3 pilares + RED Method + OpenTelemetry + sampling head/tail.
- **WebSockets/SSE:** handshake Upgrade→101, `text/event-stream`, Long Polling;
  escalabilidade com sticky session + Redis Pub/Sub.
- **Consistência:** forte vs eventual; Read-Your-Writes, Monotonic Reads, Causal;
  CAP Theorem + PACELC com classificação por banco.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas**. 1 ressalva aplicada (rótulo
"monotonic writes" → "read-after-write"). 3 sugestões opcionais não aplicadas
(HTTP/2+WebSocket RFC 8441 nota, `<text>` vazios no SVG, terminologia token).

## Estado da Biblioteca

**55 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
**19 System Design**.
