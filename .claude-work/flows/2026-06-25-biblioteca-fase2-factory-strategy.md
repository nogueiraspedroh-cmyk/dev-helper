# Biblioteca — Fase 2 (Factory Method + Strategy)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Base:** reusa o molde de `2026-06-25-biblioteca-fase1-singleton.md`

## Demanda

Escalar a Biblioteca com mais 2 design patterns, validando o molde em conteúdos de
formatos diferentes (criação + comportamental).

## Arquivos

- **Novos:** `biblioteca/factory-method/index.html` (Padrões de Criação, slot
  `1515151515`), `biblioteca/strategy/index.html` (Padrões Comportamentais, slot
  `1616161616`).
- **Alterados:** `biblioteca/index.html` (card Factory Method em Criação; **nova
  categoria Padrões Comportamentais** com card Strategy; Estruturais segue comentada;
  comentário-guia atualizado), `biblioteca/singleton/index.html` (item "Factory Method"
  em Padrões relacionados virou **link real** `../factory-method/`).
- **Inalterado:** `js/biblioteca.js` (o componente de abas detecta os grupos novos
  automaticamente), `js/main.js`, `css/styles.css` (nenhuma classe nova foi precisa).

## Conteúdo

- **Factory Method:** intenção GoF; distinção Factory Method × Simple Factory (não-GoF)
  × Abstract Factory (famílias); exemplo de notificações (herança clássica + variante
  com mapa de factories) em TS/PHP; armadilhas (explosão de subclasses etc.).
- **Strategy:** algoritmos intercambiáveis trocados em runtime; if/else ingênuo como
  problema; cálculo de frete (setter de estratégia) + comparadores de ordenação
  (função-como-estratégia em TS vs interface/`callable` em PHP); distinção Strategy ×
  State; armadilhas (overengineering, vazamento de contexto).
- Cross-links recíprocos reais (factory↔singleton, strategy→factory); demais
  relacionados (Abstract Factory, State, Template Method) como spans pendentes.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores nem warnings**. Verificou a **correção
conceitual** dos dois padrões e **rodou a aritmética dos exemplos numericamente**
(frete PAC 2.15 / SEDEX 9.36 / Transportadora 13.24 / Retirada 0.00; ordenações
asc/desc/nome — todos batem com os comentários `// →`). Escapamento integral de
`<`/`>`/`&`/`<=>`/`<?php`; contrato de abas respeitado sem tocar no JS; disciplina de
links impecável (sem `<a>` para artigo inexistente; Singleton atualizado span→link).
5 sugestões opcionais (didáticas), nenhuma bloqueia.

## Validação

- HTTP 200 em `/biblioteca/`, `/biblioteca/singleton/`, `/biblioteca/factory-method/`,
  `/biblioteca/strategy/`. Slots `1515151515` e `1616161616` únicos.
- Índice renderiza só categorias com artigo (Criação + Comportamentais); Estruturais
  comentada. Sem `style=` além do AdSense.

## Estado da Biblioteca

3 artigos publicados (Singleton, Factory Method, Strategy) em 2 das 3 categorias GoF.

## Próximos passos (sugestões)

- Padrões Estruturais (estreia da 3ª categoria) — ex.: Adapter, Decorator, Facade.
- Mais comportamentais (Observer, State, Template Method) — destravam spans pendentes.
- Futuro: seções de Arquiteturas e Estruturas de Projeto (decisão original do usuário).
