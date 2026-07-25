# Biblioteca — Fase 5 (estreia Arquiteturas: MVC, Camadas, Hexagonal)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Base:** reusa o boilerplate do molde de artigo; formato adaptado (conceitual)

## Demanda

Estrear a seção **Arquiteturas** na Biblioteca, separada das categorias de Design
Patterns (GoF).

## Decisões (com o usuário)

- 1º lote: **MVC + Arquitetura em Camadas + Arquitetura Hexagonal** (fundacional e
  progressivo).
- **Formato conceitual**: diagramas ASCII + tradeoffs (Intenção, Problema, Estrutura,
  Como funciona, Quando usar/evitar, Prós/contras, Armadilhas, Relacionados). Código
  só em **trechos curtos** (ex.: porta + adaptador no Hexagonal), sem abas TS/PHP
  completas obrigatórias.
- **Agrupamento próprio "Arquiteturas"** no índice (nova `<section class="catalog">`),
  separado das 3 categorias GoF.

## Arquivos

- **Novos:** `biblioteca/mvc/index.html` (slot `2424242424`),
  `biblioteca/arquitetura-em-camadas/index.html` (slot `2525252525`),
  `biblioteca/arquitetura-hexagonal/index.html` (slot `2626262626`).
- **Alterados:** `biblioteca/index.html` (agrupamento "Arquiteturas" com 3 cards +
  comentário-guia).
- **Inalterado:** `js/biblioteca.js`, `js/main.js`, `css/styles.css` (nenhuma classe
  nova foi precisa).

## Conteúdo

- **MVC:** papéis Model/View/Controller; distinção MVC clássico (View observa Model
  via Observer) vs MVC web/server-side; menção a MVP/MVVM; armadilhas (fat controller,
  anemic model).
- **Camadas:** Apresentação → Aplicação → Domínio → Infraestrutura; regra de
  dependência; strict vs relaxed; armadilhas (lasanha, vazamento, domínio anêmico).
- **Hexagonal:** núcleo isolado; portas (interfaces do domínio) + adaptadores;
  **inversão de dependência** (infra depende do domínio); driving vs driven adapters;
  trecho porta+adaptador em TS/PHP.
- Cross-links recíprocos mvc↔camadas↔hexagonal; hexagonal→adapter/strategy, mvc→observer.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (corrigidas):
- **Verificado OK (ponto crítico):** a **direção de dependência do Hexagonal** está
  correta em texto, diagrama E código (o erro clássico de inverter foi evitado).
  Distinções MVC clássico/web e strict/relaxed layering corretas; escapamento integral;
  índice com a seção Arquiteturas separada sem quebrar o GoF; disciplina de links
  (pendentes Clean/Onion/MVP/MVVM como spans).
- **Corrigido:** (1) rótulo ambíguo da seta no diagrama de Camadas → agora mostra duas
  variantes ("SEM DIP: Domínio→Infra" e "COM DIP+Repository: Infra→Domínio"); (2)
  triângulo de cross-links fechado (adicionado hexagonal→mvc, com justificativa de que
  o Controller é um adaptador primário); (3) precisão histórica do MVC (Reenskaug, Xerox
  PARC, fim dos anos 1970, em vez de "Smalltalk-80, 1978").
- Observação não-bloqueante: reciprocidade GoF→Arquiteturas (observer/adapter/strategy
  linkarem de volta) exigiria editar artigos aprovados — deixado para fase futura.

## Validação

- HTTP 200 nos 3 artigos + índice. Slots `2424/2525/2626` únicos. Sem `style=` além do
  AdSense. Cross-links internos recíprocos e corretos.

## Estado da Biblioteca

**12 artigos**: 9 Design Patterns (GoF, 3 categorias) + **3 Arquiteturas** (MVC,
Camadas, Hexagonal).

## Próximos passos (sugestões)

- Mais arquiteturas: Clean Architecture, Onion, MVVM/MVP, CQRS, Event-Driven,
  Monolito vs Microsserviços.
- Seção **Estruturas de Projeto** (monolito/monorepo, organização de pastas).
- Mais patterns GoF restantes.
