# Biblioteca — L10 (Visitor + Interpreter)

- **Data:** 2026-06-30
- **Status:** Concluída (DoD atendido)
- **Plano:** 10º e último lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Fechar os Padrões Comportamentais GoF com os dois últimos ausentes:
**Visitor** e **Interpreter**.

## Arquivos

- **Novos:** `biblioteca/visitor/index.html` (slot `5151515151`),
  `biblioteca/interpreter/index.html` (slot `5252525252`).
- **Alterados:** `biblioteca/index.html` (2 cards em Comportamentais + ✓✓ no
  comentário-guia); spans→links: "Visitor" em `composite/`, `iterator/`,
  `chain-of-responsibility/`.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **Visitor:** double dispatch correto — `accept(visitor)` em cada ConcreteElement
  chamando `visitTipo(this)`, e `visit*` na interface IVisitor. Visitors operam
  sobre a AST sem modificá-la. Trace ASCII de `(2+3)*4 = 20` validado. Armadilhas:
  instanceof vs accept, adição de novo tipo exige alterar todos os visitors.
  Distinções Visitor×Strategy, Visitor×Iterator documentadas.
- **Interpreter:** Terminal (`Numero`, `Variavel`) e NonTerminal (`Soma`,
  `Subtracao`, `Multiplicacao`) presentes e rotulados. Context passado por toda
  a recursão (`interpretar(ctx)`). Limitação de performance e explosão de classes
  em gramáticas grandes explicitada. Aritmética dos exemplos validada (16, 15, 16).
  Relação com Composite (mesma estrutura de árvore, propósito diferente) e quando
  preferir parser externo documentados.

## Nota de recuperação

O agente dev-typescript que criou os dois artigos encerrou por session limit
antes de completar os cards no índice e as conversões span→link. Os arquivos dos
artigos estavam completos e fechados no disco (937 e 810 linhas, `</html>` presente,
HTTP 200). O gate de code-reviewer foi executado sobre os arquivos como estavam,
e as tarefas residuais (cards + conversões) foram aplicadas diretamente pelo
orquestrador após o gate.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou: double dispatch
correto (Visitor), Terminal/NonTerminal e Context (Interpreter), abas TS/PHP,
slots 5151/5252 únicos, escaping PHP, cross-links todos existentes, zero classes
fantasma, caminhos `../../`. 3 sugestões opcionais — **não aplicadas** (diagrama
vs exemplo expressão diferente em Interpreter, vocabulário Terminal/NonTerminal
num artigo de Visitor, output pretty-printed vs código em linha no SerializarJson).

## Validação

- HTTP 200 em visitor/ + interpreter/ + índice. `</html>` presente em ambos.
  Scripts na ordem; slots únicos; zero spans pendentes de Visitor/Interpreter
  nos artigos relacionados.

## Estado da Biblioteca

**36 artigos**: 23 Design Patterns GoF (Criação 5, Estruturais 7,
Comportamentais 11 — completos) + 10 Arquiteturas + 3 Estruturas de Projeto.

## Plano de 10 lotes — CONCLUÍDO

Todos os 10 lotes do plano de expansão do Orquestrador foram executados e
fechados com gate de code-reviewer.
