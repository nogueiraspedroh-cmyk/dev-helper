# Biblioteca — L2 (Arquiteturas: Clean Architecture, Onion Architecture)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 2º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Aprofundar a seção **Arquiteturas** com Clean Architecture e Onion Architecture,
na sequência de MVC / Camadas / Hexagonal (L/Fase 5). Formato conceitual.

## Arquivos

- **Novos:** `biblioteca/clean-architecture/index.html` (slot `3030303030`),
  `biblioteca/onion-architecture/index.html` (slot `3131313131`).
- **Alterados:** `biblioteca/index.html` (2 cards na seção "Arquiteturas" +
  comentário-guia com ✓); spans→links de Clean/Onion em `arquitetura-hexagonal/`
  e `arquitetura-em-camadas/`.
- **Inalterado:** `js/*`, `css/styles.css` (lote de conteúdo não toca CSS/JS).

## Conteúdo

- **Clean Architecture:** círculos concêntricos Entities → Use Cases → Interface
  Adapters → Frameworks & Drivers; **regra de dependência** (setas só para dentro);
  inversão via interfaces declaradas no núcleo e implementadas na infra
  (`PostgresPedidoRepository implements PedidoRepository`).
- **Onion Architecture:** Domain Model → Serviços de Domínio → Serviços de
  Aplicação → Infraestrutura; interfaces de repositório nos Serviços de Domínio;
  todas as setas para o centro.
- Relações cruzadas com nuance (convergentes, **não idênticas**): Clean formaliza
  boundaries; Hexagonal fala portas/adaptadores; Onion enfatiza domain model rico.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Ponto crítico verificado: a
**direção da regra de dependência** (apontando para dentro) está coerente entre
diagrama, texto E código nos dois artigos — o erro clássico de inverter foi
evitado. Distinções Clean×Onion×Hexagonal×Camadas corretas; escaping integral;
slots `3030/3131` únicos; disciplina de links OK (zero 404). 2 sugestões opcionais
(snippet `ItemPedido` ilustrativo; estilo de placeholder) — **não aplicadas por
serem cosméticas e não-bloqueantes**.

## Validação

- HTTP 200 em `/biblioteca/clean-architecture/` e `/onion-architecture/` + índice.
  Único `style=` é `display:block` no `<ins>` do AdSense.

## Estado da Biblioteca

**17 artigos**: 12 Design Patterns (GoF) + **5 Arquiteturas** (MVC, Camadas,
Hexagonal, Clean, Onion).

## Próximo

L3 (estruturais: Proxy, Composite, Bridge) — em andamento neste mesmo dia.
