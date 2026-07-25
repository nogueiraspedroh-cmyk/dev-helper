# Biblioteca — System Design L1 (Escalabilidade + Load Balancing)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 1º lote da nova seção System Design

## Demanda

Inaugurar a seção **System Design** na Biblioteca com dois artigos
fundamentais de infraestrutura e escala.

## Arquivos

- **Novos:** `biblioteca/escalabilidade-horizontal-vertical/index.html`
  (slot `5353535353`, 371 linhas),
  `biblioteca/load-balancing/index.html` (slot `5454545454`, 404 linhas).
- **Alterados:** `biblioteca/index.html` — nova `<section class="catalog">`
  "System Design" após Estruturas de Projeto, com 2 cards + comentário-guia.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Escalabilidade Horizontal vs Vertical:** scale-up vs scale-out com
  diagramas ASCII paralelos; stateless vs stateful como pré-condição do
  scale-out; elasticidade e auto-scaling; armadilha "escalar app sem
  escalar banco" (armadilha 3, com PgBouncer/réplicas/sharding).
- **Load Balancing:** algoritmos Round Robin, Weighted RR, Least
  Connections, IP Hash, Random; L4 vs L7 (transporte vs aplicação,
  terminação TLS); health checks ativo e passivo; sticky session como
  anti-pattern que mascara estado local.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Todos os 8 bloqueadores
verificados OK. 3 sugestões opcionais — **não aplicadas** (custo
"exponencial" → "super-linear" cosmético; desalinhamento leve no diagrama
ASCII do LB; construção "resolve nada" → "não resolve nada" estilístico).

## Validação

- HTTP 200 em escalabilidade-horizontal-vertical/ + load-balancing/ +
  índice. `</html>` presente; scripts na ordem; slots únicos; zero
  classes fantasma.

## Estado da Biblioteca

**38 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
**2 System Design** (nova seção).

## Próximo

SD-L2 (Caching + SQL vs NoSQL).
