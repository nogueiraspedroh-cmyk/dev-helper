# Biblioteca — L1 (Criação restantes: Abstract Factory, Builder, Prototype)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Plano:** 1º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Completar os Padrões de Criação GoF. Primeiro lote rodado **em paralelo** com o
redesign de CSS (arquivos disjuntos: conteúdo em `biblioteca/`, CSS dono separado).

## Arquivos

- **Novos:** `biblioteca/abstract-factory/index.html` (slot `2727272727`),
  `biblioteca/builder/index.html` (`2828282828`), `biblioteca/prototype/index.html`
  (`2929292929`).
- **Alterados:** `biblioteca/index.html` (3 cards em Padrões de Criação), spans→links
  de **Abstract Factory** em `singleton/` e `factory-method/`.
- **Inalterado:** `js/*`, `css/styles.css` (lote de conteúdo não toca CSS).

## Conteúdo

- **Abstract Factory:** famílias de produtos coesos; distinção vs Factory Method (AF =
  conjunto de factory methods por composição; FM = 1 produto por herança); armadilha de
  explosão de classes com 1 só família.
- **Builder:** construção passo a passo separada da representação; Director; produto
  imutável + validação no `build()`; "AF é sobre *o quê*, Builder sobre *como*".
- **Prototype:** clonagem; **shallow vs deep** demonstrado em TS (spread/Object.assign) e
  PHP (`__clone()` + objeto aninhado); registry como alternativa ao Factory.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou o código linha a linha,
incluindo os outputs do shallow-vs-deep do Prototype (que rastreiam a contaminação do
estado entre demonstrações — ponto onde a maioria erra, e aqui está certo). Distinções
AF×FM, Builder×AF, Prototype×Factory corretas; escaping integral; links recíprocos e
índice OK. 4 sugestões opcionais — **aplicadas**:
- Ressalva sobre `structuredClone()` (preserva dados/ciclos mas descarta o prototype/
  classe e falha com funções → deep copy campo a campo no `clone()`).
- Rótulo "cópia profunda" → "cópia suficiente: 1 nível basta (valores primitivos)".
- 2 comentários-guia defasados (singleton, factory-method) atualizados (AF agora existe).

## Validação

- HTTP 200 nos 3 artigos + índice + singleton/factory-method. Slots `2727/2828/2929`
  únicos. Sem `<a>` para artigo inexistente (Composite segue pendente no Builder).

## Estado da Biblioteca

**15 artigos** (Criação completa: Singleton, Factory Method, Abstract Factory, Builder,
Prototype).

## Próximo

L2 (Clean + Onion) em andamento; depois L3…L10 conforme o plano do Orquestrador.
