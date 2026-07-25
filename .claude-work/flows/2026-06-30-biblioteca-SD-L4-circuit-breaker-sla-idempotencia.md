# Biblioteca — System Design L4 (Circuit Breaker + SLA/SLO/SLI + Idempotência)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 4º lote da seção System Design

## Demanda

Cobrir resiliência e confiabilidade: padrão de tolerância a falha, métricas
de confiabilidade e garantia de operações seguras a retries.

## Arquivos

- **Novos:** `biblioteca/circuit-breaker/index.html` (slot `6060606060`,
  385 linhas), `biblioteca/sla-slo-sli/index.html` (slot `6161616161`,
  373 linhas), `biblioteca/idempotencia/index.html` (slot `6262626262`,
  380 linhas).
- **Alterados:** `biblioteca/index.html` (3 cards adicionados ao `.tool-grid`
  System Design + comentário-guia atualizado) — editado pelo orquestrador
  após o dev confirmar que não havia tocado no arquivo.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Decisão de paralelismo

L4 rodou em paralelo com L3. Para evitar conflito em `biblioteca/index.html`,
L4 foi instruído a não editar o índice — os cards foram adicionados pelo
orquestrador após ambos concluírem.

## Conteúdo

- **Circuit Breaker:** 3 estados (CLOSED/OPEN/HALF-OPEN) com transições e
  parâmetros (failure threshold, timeout, success threshold); fallback +
  degradação graciosa; distinção Circuit Breaker vs Retry com backoff
  exponencial; armadilha "sem observabilidade".
- **SLA/SLO/SLI:** hierarquia SLI→SLO→SLA; Error Budget (`1 - SLO`, ~43min/mês
  para 99,9%); tabela de noves numericamente correta; armadilha "SLO = SLA
  sem margem".
- **Idempotência:** Idempotency Key como UUID por operação (não por retry);
  PUT/DELETE idempotentes vs POST; at-least-once + idempotência; armadilha
  "idempotência parcial" (operação ok, efeitos colaterais duplicados);
  distinção idempotência vs concorrência.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Todos os 8 bloqueadores OK
nos três arquivos. 3 sugestões opcionais — **não aplicadas** (seta ASCII no
diagrama de estados do Circuit Breaker, "~43" vs "~43,8" min, comentário
cosmético no pseudocódigo de Idempotência).

## Validação

- HTTP 200 em circuit-breaker/ + sla-slo-sli/ + idempotencia/ + índice.
  Scripts na ordem; slots únicos e sem colisão; zero classes fantasma.

## Estado da Biblioteca

**45 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
**9 System Design**.
