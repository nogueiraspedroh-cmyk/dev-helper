# Biblioteca — System Design L2 (Caching + SQL vs NoSQL)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 2º lote da seção System Design

## Demanda

Completar o primeiro ciclo de System Design com dois artigos sobre
armazenamento e estratégias de leitura.

## Arquivos

- **Novos:** `biblioteca/caching/index.html` (slot `5757575757`, 442 linhas),
  `biblioteca/sql-vs-nosql/index.html` (slot `5656565656`, 439 linhas).
- **Alterados:** `biblioteca/index.html` (2 cards adicionados ao `.tool-grid`
  da seção System Design existente + comentário-guia); spans pendentes de
  "Caching (em breve)" em `escalabilidade-horizontal-vertical/` e
  `load-balancing/` convertidos em links reais.
- **Corrigido (pós-review):** vírgula faltando no exemplo JSON do diagrama
  ASCII em `sql-vs-nosql/index.html:149`.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Colisão de slot resolvida

O agente dev usou `5555555555` para caching, que já estava em `tools/cep/`.
Corrigido para `5757575757` antes do gate.

## Conteúdo

- **Caching:** 4 estratégias de escrita (Cache-Aside, Write-Through,
  Write-Behind, Read-Through) corretas e distintas; LRU/LFU/TTL; cache
  stampede com soluções (jitter, mutex, probabilistic early expiration);
  armadilha de chaves sem namespace com exemplo de prefixo.
- **SQL vs NoSQL:** 4 modelos NoSQL (documento, chave-valor, coluna larga,
  grafo); CAP theorem com observação de que P é obrigatório em sistemas
  distribuídos; ACID vs BASE; armadilha "joins no código" e "NoSQL escala,
  SQL não" (corrigida).

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. 1 sugestão aplicada
(vírgula no JSON do diagrama). 1 observação editorial não aplicada
(padrão de `<title>` — será avaliada futuramente como padronização geral
da Biblioteca).

## Validação

- HTTP 200 em caching/ + sql-vs-nosql/ + índice. `</html>` presente.
  Scripts na ordem; slots únicos; zero classes fantasma.

## Estado da Biblioteca

**40 artigos**: 23 GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
**4 System Design**.
