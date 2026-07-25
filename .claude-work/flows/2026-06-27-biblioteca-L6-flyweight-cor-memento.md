# Biblioteca — L6 (Flyweight, Chain of Responsibility, Memento)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 6º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Três padrões GoF: **Flyweight** (Estrutural), **Chain of Responsibility** e
**Memento** (Comportamentais).

## Arquivos

- **Novos:** `biblioteca/flyweight/index.html` (slot `4141414141`),
  `biblioteca/chain-of-responsibility/index.html` (slot `4242424242`),
  `biblioteca/memento/index.html` (slot `4343434343`).
- **Alterados (lote):** `biblioteca/index.html` (Flyweight em Estruturais, CoR e
  Memento em Comportamentais + ✓ no comentário-guia); spans→links: Flyweight em
  `singleton/`, Memento em `command/`.
- **Alterados (pós-review):** comentário stale em `command/` corrigido; typo de
  concordância em `memento/` corrigido.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Flyweight:** factory retorna a MESMA instância (Map/lookup antes do new — verificado
  linha a linha); estado intrínseco `readonly`; extrínseco passado como argumento. Contagem
  k=3 instâncias vs N=10.000 contextos demonstrada.
- **Chain of Responsibility:** encadeamento fluente via `setNext()`; cada handler processa
  OU passa (sem double-handling); armadilha "cair no vazio" documentada; distinções CoR×Strategy
  e CoR×Decorator corretas.
- **Memento:** Caretaker NÃO acessa conteúdo do Memento (só armazena/devolve — verificado em
  código TS e PHP); Originator acessa via `_recuperar()` (friend pattern documentado). Cópia
  defensiva presente. Distinção crítica **Command (incremental) × Memento (snapshot completo)**
  explícita e correta.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Os 3 pontos críticos verificados: factory
que reinstancia (não), double-handling no CoR (não), Caretaker que inspeciona o Memento
(não). Escaping, abas, scripts, slots `4141/4242/4343` únicos OK. 4 sugestões opcionais —
**2 aplicadas** (comentário stale command:911, typo concordância memento:908); 2 deixadas
(chave de cache com campo omisso no Flyweight ex.1, divergência diagrama/código CoR — ambas
sem impacto funcional ou pedagógico direto).

## Validação

- HTTP 200 em flyweight/chain-of-responsibility/memento + índice. `</html>` presente;
  scripts na ordem; slots únicos.

## Estado da Biblioteca

**28 artigos**: 21 Design Patterns GoF (Criação 5, Estruturais 7, Comportamentais 9) +
7 Arquiteturas. Estruturais GoF completos (faltava só Flyweight). Comportamentais: faltam
Visitor e Interpreter (L10).

## Próximo

L7 (Estruturas de Projeto: monolito-vs-monorepo, feature-vs-layer, estrutura-de-pastas —
nova seção no índice), depois L8…L10.
