# Biblioteca — L3 (Estruturais restantes: Proxy, Composite, Bridge)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 3º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Completar os Padrões Estruturais GoF. **Proxy** já havia sido criado num lote
anterior interrompido (sessão); este lote retomou: criou Composite + Bridge,
ativou os 3 no índice, converteu spans→links e passou o gate de review.

## Arquivos

- **Novos:** `biblioteca/composite/index.html` (slot `3434343434`),
  `biblioteca/bridge/index.html` (slot `3535353535`). (`biblioteca/proxy/index.html`,
  slot `3232323232`, já existia.)
- **Alterados:** `biblioteca/index.html` (3 cards Proxy/Composite/Bridge na categoria
  "Padrões Estruturais" + ✓ no comentário-guia); spans→links (5 no total): Proxy+Bridge
  em `adapter/`, Composite+Proxy em `decorator/`, Composite em `builder/`.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Proxy:** mesma interface do sujeito real, controla o acesso (virtual/lazy+cache,
  protection). Distinção vs Decorator (controla acesso × adiciona comportamento) e vs
  Adapter (mantém interface × muda interface).
- **Composite:** árvore parte-todo; folha e composto compartilham `Componente`; soma
  recursiva (Diretorio soma o tamanho dos filhos). Transparência × segurança (exemplos
  adotam segurança: `adicionar` só no composto). Distinção vs Decorator (1 filho/
  responsabilidade × N filhos/agregação).
- **Bridge:** separa Abstração de Implementador para variarem independentemente; evita
  explosão N×M via composição (a "ponte" = referência injetada). Distinção vs Adapter
  (prospectivo × retroativo) e vs Strategy (estrutural/2 eixos × comportamental/1 algoritmo).

## Slots (prova de unicidade)

Colisão evitada: Composite recebeu `3434343434` (NÃO `3333333333`, que já era de outra
página). `grep -rhoE 'data-ad-slot' biblioteca tools` confirmou cada slot 1×.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou correção conceitual ponto a
ponto: soma recursiva do Composite confere (raiz=5900, empresa=54500 centavos); os DOIS
eixos do Bridge variam de fato com composição explícita; Proxy mantém a interface. Abas
TS/PHP, escaping, slots, scripts e disciplina de links OK (Visitor/Iterator/Mediator/MVP/
MVVM/Flyweight/Monostate permanecem spans pendentes). 3 sugestões opcionais — **aplicadas**:
1. Removida a analogia frouxa "Proxy = forma especializada de Bridge" (proxy) que borrava
   a fronteira que o lote constrói → substituída por reforço da distinção.
2. Removido `readonly` + cast do campo `renderizador` no TS do Bridge (swap em runtime
   ficava contraditório; PHP já não usava readonly) → `this.renderizador = …` direto.
3. ✓ adicionado a Proxy/Composite/Bridge no comentário-guia do índice.

## Validação

- HTTP 200 em proxy/composite/bridge + índice. `</html>` presente; scripts na ordem
  main.js→biblioteca.js; único `style=` é `display:block` no `<ins>`.

## Estado da Biblioteca

**20 artigos**: 15 Design Patterns GoF (Criação 5, Estruturais 6, Comportamentais 4) +
5 Arquiteturas. Estruturais GoF **completos** (Adapter, Decorator, Facade, Proxy,
Composite, Bridge) — exceto Flyweight (pendente, planejado para L6).

## Próximo

L4 (Arquiteturas: MVP + MVVM), depois L5…L10 conforme o plano do Orquestrador.
