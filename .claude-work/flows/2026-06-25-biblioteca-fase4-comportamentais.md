# Biblioteca — Fase 4 (Comportamentais: Observer, State, Template Method)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Base:** reusa o molde das fases 1-3 da Biblioteca

## Demanda

Completar a categoria **Padrões Comportamentais** com mais 3 artigos (além do Strategy).

## Arquivos

- **Novos:** `biblioteca/observer/index.html` (slot `2020202020`),
  `biblioteca/state/index.html` (slot `2121212121`),
  `biblioteca/template-method/index.html` (slot `2323232323` — evitou `2222222222`,
  que é da ferramenta CPF/CNPJ).
- **Alterados:** `biblioteca/index.html` (categoria Comportamental agora com 4 cards),
  `biblioteca/strategy/index.html` (itens **State** e **Template Method** em "Padrões
  relacionados" viraram **links reais**).
- **Inalterado:** `js/biblioteca.js`, `js/main.js`, `css/styles.css`.

## Conteúdo

- **Observer:** dependência um-para-muitos; subject notifica observers; **push vs pull**
  (exemplos materializam os dois); **Observer vs Pub/Sub** (acoplamento direto vs broker);
  armadilhas (vazamento por não cancelar inscrição, atualizações em cascata).
- **State:** comportamento muda conforme estado interno; **distinção vs Strategy**
  (estrutura idêntica, intenção diferente — no State os estados se conhecem e transicionam);
  máquinas de estado (documento rascunho→revisão→publicado; player parado→tocando→pausado).
- **Template Method:** esqueleto na classe-base + passos nas subclasses (hooks);
  inversão de controle ("princípio de Hollywood"); **distinção vs Strategy** (herança vs
  composição); **Factory Method como especialização**.
- Cross-links recíprocos reais (strategy↔state, strategy↔template-method, observer→strategy/state,
  state→singleton, template-method→factory-method/strategy); Mediator como span pendente.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (corrigida):
- **Verificado OK:** completude e fechamento dos 3 HTML; **distinções State×Strategy e
  Template Method×Strategy precisas**; máquina de estados e hooks logicamente corretos;
  saídas comentadas conferem (soma 100, média 25.00; transições do player; parser CSV →
  3 itens); escapamento integral; sem `<a>` para artigo inexistente; índice com 4 cards.
- **Corrigido:** diagrama ASCII de Estrutura do Template Method citava `aposFormatar`/"antes
  de formatar", divergindo do código (`aposProcessar`, chamado após processar e antes de
  formatar) → diagrama alinhado ao código (processar → aposProcessar → formatar → exportar).
- Sugestões opcionais não aplicadas (ex.: `array_values` no unsubscribe PHP — funciona com
  `foreach`; uniformizar casas decimais dos alertas) — registradas, sem impacto.

## Validação

- HTTP 200 nos 9 artigos + índice. Slots `2020/2121/2323` únicos. Sem `style=` além do
  AdSense. Cross-links recíprocos coerentes.

## Estado da Biblioteca

**9 artigos** em 3 categorias GoF:
- Criação: Singleton, Factory Method
- Estrutural: Adapter, Decorator, Facade
- Comportamental: Strategy, Observer, State, Template Method

## Próximos passos (sugestões)

- Mais padrões (Abstract Factory, Builder, Proxy, Composite, Bridge, Mediator…).
- Nova seção **Arquiteturas** (MVC, Hexagonal, Clean…) — merece conversa de escopo própria.
- Nova seção **Estruturas de Projeto**.
