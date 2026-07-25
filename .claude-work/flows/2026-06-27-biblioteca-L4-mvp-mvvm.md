# Biblioteca — L4 (Arquiteturas: MVP, MVVM)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 4º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Completar a família MV* de arquiteturas de UI, derivando do MVC já publicado:
**MVP** e **MVVM**, no formato conceitual.

## Arquivos

- **Novos:** `biblioteca/mvp/index.html` (slot `3636363636`),
  `biblioteca/mvvm/index.html` (slot `3737373737`).
- **Alterados:** `biblioteca/index.html` (2 cards na seção "Arquiteturas" + ✓ no
  comentário-guia); spans→links de MVP/MVVM em `mvc/index.html`.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- **MVP:** View passiva (interface `IView`); o **Presenter empurra** dados chamando
  métodos da View (`view.exibirNome()`); a View não conhece o Model — o Presenter
  media 100%. Variantes Passive View × Supervising Controller (def. de Fowler).
- **MVVM:** a View **observa** o ViewModel via **data binding** declarativo/two-way;
  o ViewModel expõe estado observável + comandos e **não referencia a View**; binding
  é Observer por baixo. Origem WPF/Silverlight; uso atual Vue/Angular/Knockout.
- **Distinção-chave (onde a maioria erra):** MVP = Presenter empurra via interface,
  imperativo; MVVM = View observa via binding, declarativo. Explicitada e simétrica
  nos dois artigos (inclusive no diagrama ASCII do MVVM).

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou a distinção MVC×MVP×MVVM
ponto a ponto (correta, sem troca): MVP não descreve binding automático; MVVM não
descreve o ViewModel empurrando. Coerência diagrama↔texto↔código; escaping integral;
contrato de abas, slots `3636/3737` únicos, disciplina de links OK (Humble Object e
Command permanecem spans pendentes). 1 sugestão aplicada: 2ª aba do MVVM tinha
`data-lang="php"` num painel TypeScript (enganoso) → trocado para `ts-vanilla` em aba+
painel. Alinhamento fino de ASCII deixado como cosmético.

## Validação

- HTTP 200 em `/biblioteca/mvp/`, `/biblioteca/mvvm/` + índice. `</html>` presente;
  scripts main.js→biblioteca.js; único `style=` é `display:block` no `<ins>`.

## Estado da Biblioteca

**22 artigos**: 15 Design Patterns GoF + **7 Arquiteturas** (MVC, Camadas, Hexagonal,
Clean, Onion, MVP, MVVM). Família MV* completa.

## Próximo

L5 (Comportamentais: Command + Mediator + Iterator), depois L6…L10.
