# Biblioteca — System Design L3 (REST vs GraphQL vs gRPC + Filas de Mensagem)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 3º lote da seção System Design

## Demanda

Cobrir comunicação entre serviços: protocolos de API e mensageria assíncrona.

## Arquivos

- **Novos:** `biblioteca/rest-vs-graphql-vs-grpc/index.html`
  (slot `5858585858`, 497 linhas),
  `biblioteca/filas-de-mensagem/index.html` (slot `5959595959`, 455 linhas).
- **Alterados:** `biblioteca/index.html` (2 cards adicionados ao `.tool-grid`
  System Design + comentário-guia).
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **REST vs GraphQL vs gRPC:** over-fetching/under-fetching REST; N+1 problem
  GraphQL (com DataLoader como solução); 4 tipos de RPC gRPC (unary, server
  streaming, client streaming, bidirecional); tabela comparativa completa;
  armadilha gRPC sem grpc-web em browsers.
- **Filas de Mensagem:** queue (point-to-point) vs topic (pub-sub); semânticas
  at-most-once / at-least-once / exactly-once com ACK/duplicatas; DLQ com
  `maxReceiveCount`; comparativo RabbitMQ vs Kafka; armadilha consumer não
  idempotente com at-least-once.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Todos os 8 bloqueadores OK
nos dois arquivos. 2 sugestões opcionais — **não aplicadas** (desalinhamento
visual leve em ASCII, sobreposição temática entre armadilhas 2 e 3 de filas).

## Validação

- HTTP 200 em rest-vs-graphql-vs-grpc/ + filas-de-mensagem/ + índice.
  Scripts na ordem; slots únicos; zero classes fantasma.

## Estado da Biblioteca

**42 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
6 System Design.

## Próximo

SD-L4 (Circuit Breaker + SLA/SLO/SLI + Idempotência) — em andamento.
