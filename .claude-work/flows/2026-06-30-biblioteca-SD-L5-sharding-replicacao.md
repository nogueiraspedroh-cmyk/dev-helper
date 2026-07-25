# Biblioteca — System Design L5 (Sharding + Replicação de Banco)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 5º lote da seção System Design

## Arquivos

- **Novos:** `biblioteca/sharding/index.html` (slot `6363636363`, 440 linhas),
  `biblioteca/replicacao-de-banco/index.html` (slot `6464646464`, 410 linhas).
- **Alterados:** `biblioteca/index.html` (2 cards + comentário-guia).
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Sharding:** estratégias range-based, hash-based e directory-based; hotspot;
  shard key como decisão crítica; consistent hashing para resharding; armadilhas
  de joins cross-shard e transações distribuídas (Saga/2PC).
- **Replicação:** primary/replica; síncrona (RPO=0) vs assíncrona; replication
  lag; read-your-writes; failover manual vs automático e split-brain com
  fencing/STONITH; multi-primary como complexo e a evitar.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. 2 sugestões cosméticas —
**não aplicadas** (diagrama ASCII de primary/replica levemente ambíguo;
inconsistência "réplicas" vs "replicas").

## Estado da Biblioteca

**47 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
11 System Design.
