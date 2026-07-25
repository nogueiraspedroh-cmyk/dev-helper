# Biblioteca — L8 (Arquiteturas: CQRS, Event-Driven Architecture)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 8º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Avançar a seção Arquiteturas com dois padrões de alto impacto em sistemas distribuídos:
**CQRS** e **Event-Driven Architecture (EDA)**.

## Arquivos

- **Novos:** `biblioteca/cqrs/index.html` (slot `4848484848`),
  `biblioteca/event-driven/index.html` (slot `4949494949`).
- **Alterados:** `biblioteca/index.html` (2 cards em Arquiteturas + ✓ no comentário-guia).
- **Corrigidos (pós-review):** `artigo__link-pendente` → `artigo__padrao-pendente` em
  `cqrs/`, `event-driven/` e `monolito-vs-monorepo/` (classe CSS inexistente, typo
  herdado de um template; pré-existia em monolito-vs-monorepo).
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **CQRS:** Command (muda estado, não retorna dados de domínio) × Query (não muda, retorna);
  três graus progressivos (mesmo banco → bancos separados → com ES); consistência eventual.
  **Distinção crítica: CQRS ≠ Event Sourcing (ortogonais)** — explicitada com aviso e
  exemplos de cada um sem o outro. Diagrama ASCII Command→CommandHandler→WriteModel /
  Query→QueryHandler→ReadModel.
- **EDA:** três padrões internos distintos e corretos — Event Notification (payload mínimo),
  Event-Carried State Transfer (estado completo, sem lookup), Event Sourcing (eventos =
  fonte da verdade, estado derivado por replay). Distinção ECST ≠ ES. Diagrama ASCII de
  event broker com produtores/consumidores. **Distinção EDA × Observer**: Observer =
  in-process; EDA = inter-service, broker assíncrono — explicitada.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (corrigidas). Pontos críticos verificados:
ortogonalidade CQRS/ES correta; Notification/ECST/ES distintos e corretos; EDA×Observer
correto. Escaping, scripts, slots `4848/4949` únicos OK. Warning: classe CSS
`artigo__link-pendente` (inexistente) em 3 arquivos → corrigida para `artigo__padrao-pendente`.

## Validação

- HTTP 200 em cqrs/ e event-driven/ + índice. Scripts na ordem; slots únicos.

## Estado da Biblioteca

**33 artigos**: 21 patterns GoF + 9 Arquiteturas + 3 Estruturas de Projeto.

## Próximo

L9 (Monolito vs Microsserviços), depois L10 (Visitor + Interpreter).
