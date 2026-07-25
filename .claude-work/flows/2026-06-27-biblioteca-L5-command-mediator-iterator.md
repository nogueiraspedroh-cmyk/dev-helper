# Biblioteca — L5 (Comportamentais: Command, Mediator, Iterator)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 5º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Avançar os Padrões Comportamentais GoF: **Command**, **Mediator**, **Iterator**.

## Arquivos

- **Novos:** `biblioteca/command/index.html` (slot `3838383838`),
  `biblioteca/mediator/index.html` (slot `3939393939`),
  `biblioteca/iterator/index.html` (slot `4040404040`).
- **Alterados (no lote):** `biblioteca/index.html` (3 cards em Padrões Comportamentais
  + ✓ no comentário-guia).
- **Alterados (pós-review):** `biblioteca/mvvm/index.html` (span Command→link);
  `biblioteca/observer/index.html` e `biblioteca/facade/index.html` (comentários
  de disciplina "Mediator pendente" → "publicado"); `biblioteca/factory-method/index.html`
  (span Template Method→link, pendência pré-existente descoberta pelo review).
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Command:** encapsula requisição como objeto (`execute()`); Invoker + Receiver
  desacoplados; undo/redo com estado capturado antes da ação (testado linha a linha:
  `DeletarTextoCommand.textoRemovido`, `DimmerCommand.intensidadeAnterior`; saídas
  numéricas conferidas). `MacroCommand` desfaz em ordem reversa. Distinção Command×Strategy.
- **Mediator:** M:N→M:1; mediador conhece os colegas e coordena. Distinções corretas:
  vs Observer (broadcast 1→N sem conhecimento mútuo) e vs Facade (unidirecional externo).
  Armadilha god object.
- **Iterator:** acesso sequencial sem expor estrutura. TS: `Symbol.iterator` + `function*`
  com `yield`; PHP: `Iterator` SPL (5 métodos) + `IteratorAggregate` com Generator.
  Distinção Iterator×Composite.

## Nota de execução

O agente de implementação foi cortado pelo limite de sessão antes de produzir relatório,
mas **todos os arquivos estavam completos em disco** (</html>, scripts, slots, cards em
200). O gate de review fez a validação independente.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (corrigidas). Ponto crítico verificado:
undo captura estado ANTES da ação (não depois); rastreou Exemplo 2 do Command inteiro
(saídas conferidas); protocolos de iteração TS/PHP corretos; distinções conceituais não
trocadas. Escaping íntegro (generics x31 no Iterator). Ressalvas aplicadas: span Command
no MVVM → link; 2 comentários "Mediator pendente" corrigidos; span Template Method no
factory-method → link (pendência pré-existente).

## Validação

- HTTP 200 nos 3 artigos + índice + artigos editados (mvvm/observer/facade/factory-method).
  Slots `3838/3939/4040` únicos. data-lang casando em todas as abas.

## Estado da Biblioteca

**25 artigos**: 18 Design Patterns GoF (Criação 5, Estruturais 6, Comportamentais 7) +
7 Arquiteturas.

## Próximo

L6 (Flyweight + Chain of Responsibility + Memento), depois L7…L10.
