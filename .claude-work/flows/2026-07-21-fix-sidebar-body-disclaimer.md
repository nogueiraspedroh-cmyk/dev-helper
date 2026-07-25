# Fix: sidebar desconexa, espaçamento gigantesco no body, disclaimer residual

- **Data:** 2026-07-21
- **Tags:** ux-ui, bugfix, sidebar, css
- **Status:** ✅ Concluído

## Pendências reportadas pelo operador

1. **Sidebar desconexa** — a seção "Ferramentas" tem busca + lista plana (35
   itens); a seção "Biblioteca" tem accordion por categoria + link "Todos os
   artigos". Dois padrões de navegação diferentes para o mesmo tipo de tarefa
   (achar um item numa lista grande).
2. **`<body>` com classe que causa espaçamento gigantesco** em todas as
   páginas.
3. **Mensagem "não envia dados ao servidor" ainda presente em todas as
   páginas**, apesar do retrofit anterior (2026-07-20).

## Investigação prévia (antes de delegar)

### Item 3 — reconfirmado
Varredura ampla (`grep -rn "servidor\|enviad"` em TODOS os `*.html` do site,
sem restringir a `tools/` ou à home) não encontrou nenhuma ocorrência do
disclaimer — todos os hits são conteúdo legítimo (artigos técnicos da
Biblioteca sobre arquitetura de servidores, explicações de JWT/UUID/conversor
de moeda já classificadas como conteúdo educacional válido no retrofit
anterior). **Conclusão: item já resolvido no estado atual dos arquivos.**
Hipótese para a percepção do operador: cache do navegador de uma versão
anterior da página, vista durante a janela em que os agentes da Fase 2 ainda
estavam fazendo ajustes finos (retrofit + troca da tagline da home aconteceram
em resumes subsequentes do mesmo agente, fora do meu controle direto).

### Item 2 — não reproduzido
- `<body>` não tem classe nenhuma no HTML estático de nenhum dos 95 arquivos
  (`grep '<body'` confirma `<body>` puro em todos).
- A única forma de `body` ganhar classe é via JS (`js/main.js`): `sidebar-locked`
  (trava de scroll no mobile, `overflow: hidden`) e `sidebar-collapsed`
  (`padding-left: var(--sidebar-width-collapsed)` = 68px, só em desktop
  ≥900px). Nenhuma dessas regras tem valor "gigantesco" (`--sidebar-width:
  260px`, `--sidebar-width-collapsed: 68px`).
- Varredura de TODO o `css/styles.css` por valores suspeitos (rem/px/vw
  anormalmente grandes) não encontrou nada fora do esperado.
- Não há bloco `.home-hero`/`.hero`/`body` duplicado no fim do arquivo (3327
  linhas, sem sobra de resumes anteriores).
- Padrão `[hidden]` (footgun já documentado no próprio CSS) está coberto nos
  elementos relevantes — não é uma seção "escondida" que na verdade renderiza.
- Tentei renderizar via Chromium headless (Playwright) para visualizar direto:
  binário já estava instalado, mas falha ao iniciar por biblioteca de sistema
  ausente (`libnspr4.so`) e não há `sudo` sem senha disponível para instalar
  as dependências do SO. **Sem confirmação visual própria.**
- **Ação:** perguntar ao operador por um screenshot ou mais detalhes (qual
  página, desktop/mobile, onde exatamente) antes de arriscar um fix às cegas.

### Item 1 — diagnóstico confirmado, ação clara
Achado real. `js/main.js` (`buildSidebarMarkup`) constrói:
- Grupo "Ferramentas": `<div class="sidebar__search">` (busca, adicionada na
  Fase 2) + `<ul class="sidebar__list">` plana com as 35 ferramentas — SEM
  agrupamento pelas 6 categorias já criadas na Fase 2 (decisão explícita na
  época: "a sidebar NÃO replica essas 6 categorias").
- Grupo "Biblioteca": link "Todos os artigos" + `<div class="sidebar__accordion">`
  com accordion por categoria (~9 categorias, 55 artigos) — SEM busca.
- **Fix:** unificar os dois grupos no mesmo padrão. Decisão: aplicar accordion
  por categoria (usando a taxonomia de 6 categorias da Fase 2) TAMBÉM em
  Ferramentas, e adicionar busca também no grupo Biblioteca — os dois grupos
  passam a ter os mesmos dois recursos (busca + accordion por categoria),
  eliminando a assimetria.

## Plano de execução
- [x] Investigar os 3 itens antes de delegar (evitar delegar um fix às cegas).
- [x] Item 3: confirmado já resolvido — sem ação.
- [x] Item 1: delegar unificação do padrão de sidebar (dev-frontend) — ver
  "Execução" abaixo.
- [x] Item 2: operador enviou screenshot — era o bloco de anúncio `.ad`
  vazio, não um bug de classe no `<body>`. Ver "Execução (Item 2)" abaixo.
- [x] Item 4 (novo, reportado após o screenshot): link "Todos os artigos"
  ficou solto/fora de contexto na sidebar após a unificação do Item 1 —
  removido. Ver "Execução (Item 4)" abaixo.
- [x] Item 5 (novo, reportado depois): `<h2 class="catalog__title">` redundante
  em 3 seções da Biblioteca — removido. Ver "Execução (Item 5)" abaixo.

## Execução (Item 2 — bloco de anúncio vazio, RESOLVIDO)

Screenshot do operador mostrou o vazio real: entre o resultado da ferramenta
(CEP) e o texto de FAQ, exatamente onde fica `<section class="ad">`. Hipótese
do `<body>` com classe gigante estava errada — descartada.

**Causa:** `.ad { min-height: 90px }` reserva espaço para o slot AdSense
(prática recomendada, evita CLS), mas como `data-ad-client` é placeholder
(`ca-pub-0000000000000000`), o anúncio nunca preenche e o espaço reservado
fica vazio — e o próprio script do AdSense tende a inflar essa área ainda
mais ao tentar processar um slot que não pode preencher.

**Fix (`js/main.js`, função nova `collapseUnfilledAds`, chamada 1x na
inicialização):** para cada `.adsbygoogle` da página, resolve o container via
`ins.closest(".ad") || ins`; `MutationObserver` no atributo `data-ad-status`
— esconde (`container.hidden = true`) quando `"unfilled"`, mantém quando
`"filled"`; fallback de `setTimeout` de 3000ms para quando o AdSense nunca
processa o slot (ad blocker, ou o pub-ID placeholder atual, que provavelmente
nem chega a definir `data-ad-status`); `cleanup()` desconecta o observer e
cancela o timeout em qualquer um dos dois caminhos de saída. Continua
relevante em produção (com pub-ID real): AdSense frequentemente não tem
anúncio para preencher um slot (baixo tráfego, ad blocker do visitante) —
esse é um cenário normal, não só do ambiente de dev.

**Limitação:** validado por leitura de código (não há browser funcional neste
ambiente — tentei Playwright/Chromium headless, falha por lib de sistema
ausente `libnspr4.so` e sem `sudo`). Teste manual para o operador: abrir uma
página de ferramenta, aguardar ~3-4s, confirmar que o vazio sumiu (ou
inspecionar `data-ad-status`/atributo `hidden` no DevTools).

## Execução (Item 4 — link solto na sidebar, RESOLVIDO)

Depois da unificação do Item 1, o grupo "Biblioteca" ficou com busca +
accordion (igual a Ferramentas) MAIS um link avulso "Todos os artigos" entre
os dois — sobra do padrão antigo, que passou a destoar visualmente do resto
(um único item solto ao lado de accordions organizados). Removido em
`js/main.js` (bloco `<ul class="sidebar__list">` dentro de
`buildSidebarMarkup`, variáveis `bibIndexLabel/bibIndexHref/
bibIndexIsExactIndex/bibSectionActive/bibIndexClass/bibIndexCurrent`) e limpo
o CSS/JS órfão resultante: `.sidebar__link--section-active` (só essa link
usava), `.sidebar__list`/`.sidebar__list li[hidden]` (nenhum HTML/JS do site
usa mais essa classe) e `var BIBLIOTECA_ICON` (só esse link usava o ícone).
Mesma decisão já tomada para o grupo Ferramentas (sem link de índice — o
"Início"/"Biblioteca" da nav principal já cobre isso).

Feito diretamente (sem subagente) para evitar dois agentes editando
`js/main.js` ao mesmo tempo — o fix do Item 2 (bloco de anúncio) estava
rodando em paralelo no mesmo arquivo.

## Execução (Item 5 — h2 redundante na Biblioteca, RESOLVIDO)

`biblioteca/index.html` tinha 4 `<section class="catalog">` distintas, cada
uma com seu próprio `<h2 class="catalog__title">`: a primeira ("Artigos
disponíveis") é o título genérico correto da página inteira, igual ao padrão
usado na home (`index.html`, "Ferramentas disponíveis") — mas as outras 3
("Arquiteturas", "Estruturas de Projeto", "System Design") envolviam cada uma
APENAS 1 `.catalog__category` interna, criando dois níveis de heading quase
redundantes (h2 "Estruturas de Projeto" > h3 "Organização de Código e
Repositórios") só para essas 3 seções — inconsistente com o padrão do
restante do site. Removidos os 3 `<h2>` redundantes, mantendo o `<h3
class="catalog__category-title">` de cada categoria (já é o padrão correto).
As `<section class="catalog">` em si não foram mescladas/removidas (`.catalog`
não tem padding/margin que dependa de ter um `<h2>` dentro — `margin-top: 0`
— então não sobrou vazio). Feito diretamente, mudança pequena e mecânica.

**Regressão pega pelo operador e corrigida na sequência:** remover só o `<h2>`
quebrou o espaçamento ENTRE as 3 seções que tinham 1 categoria só — porque
`.catalog__category:last-child { margin-bottom: 0; }` zerava a margem de cada
uma dessas categorias (cada uma era, sozinha, a última/única filha da sua
própria `<section>`). Sem o `<h2>` para ocupar espaço antes da categoria
seguinte, tudo colou. Fix real: fundir as 4 `<section class="catalog">` numa
única seção (mesmo padrão da home, `index.html`), com as 6 `.catalog__category`
como filhas diretas em sequência — assim o espaçamento normal
(`margin-bottom: 2.75rem`) volta a valer entre todas, e só a categoria
verdadeiramente última do catálogo fica com margem zero (comportamento
correto). Validado: `<section>` balanceado (3 aberturas/3 fechamentos), 1
única `<section class="catalog">`, 6 categorias, 1 único `<h2>`, HTTP 200.

## Execução (Item 1 — unificação da sidebar)

### O que mudou em `js/main.js`
- **Nova taxonomia replicada:** `var TOOL_CATEGORIES` (logo após `TOOLS`) —
  só título + lista de slugs, na mesma ordem/agrupamento das 6 categorias já
  documentadas em `index.html` (Documentos & Localização=3, Financeiro=5,
  Texto & Dados=11, Segurança & Codificação=5, Web/Rede & Automação=7,
  Conversores & Design=4). Não duplica ícone/label — só referencia o slug;
  quem resolve ícone/label continua sendo `TOOLS` via um lookup
  (`toolsBySlug`) montado dentro de `buildToolsAccordion`.
- **`buildToolsAccordion(prefix, pathname)`** (nova função, espelha
  `buildBibliotecaAccordion` linha a linha: mesmas classes
  `sidebar__accordion-item`/`-trigger`/`-panel`, mesmo `aria-expanded`/
  `hidden` no panel, mesma regra "categoria com item ativo expandida por
  padrão"). Única divergência deliberada: cada `<li>` usa `sidebar__link`
  (COM ícone SVG por ferramenta) em vez de `sidebar__link--nested` (sem
  ícone, usado pelos 55 artigos) — os 35 ícones desenhados à mão já eram
  parte da identidade visual da navegação de ferramentas antes desta
  unificação; não fazia sentido descartá-los para "combinar" com a
  Biblioteca, que nunca teve ícone por artigo.
- **`buildSidebarMarkup`:** grupo "Ferramentas" trocou
  `<ul id="sidebar-tools-list">` (lista plana) por
  `<div class="sidebar__accordion sidebar__accordion--tools" id="sidebar-tools-accordion">`
  com `buildToolsAccordion(...)` dentro — busca (`#sidebar-busca`) mantida
  acima, no mesmo lugar. Grupo "Biblioteca" ganhou um `<div class="sidebar__search">`
  com `<input id="sidebar-biblioteca-busca">` (mesmo padrão/estilo do campo
  de Ferramentas) entre o título do grupo e o link "Todos os artigos", mais
  `<p id="sidebar-biblioteca-busca-vazio">` depois do accordion (que ganhou
  `id="sidebar-biblioteca-accordion"` para ser alvo do filtro).
- **Filtro unificado:** função `criarFiltroAccordion(accordionEl, inputEl,
  emptyEl)` (substituiu o antigo `filtrarSidebar` fixo em lista plana) —
  reutilizada para os dois grupos. Filtra os `<li>` dentro de
  `.sidebar__accordion-panel` (mesma técnica de sempre: `normalizarSidebar`
  + `String.indexOf` sobre `textContent`, nunca grava o termo digitado no
  DOM). Novidade pedida no brief: ao digitar, toda categoria com ≥1
  resultado visível é auto-expandida (`setAccordionExpanded(trigger, true)`)
  e as sem resultado são fechadas; ao limpar o campo, volta para
  `defaultExpandedId` — a categoria que já estava aberta por conter a
  página atual, capturada uma única vez antes de qualquer filtragem (ou
  nenhuma, se a página não pertencer a nenhuma categoria). Cada grupo tem
  seu próprio estado (`filtrarSidebarFerramentas` / `filtrarSidebarBiblioteca`),
  sem vazamento entre Ferramentas e Biblioteca.
- **Accordion de abertura única, agora por GRUPO:** o handler de clique nos
  `sidebar__accordion-trigger` antes usava um único `NodeList` (só existia
  o accordion da Biblioteca); com dois accordions na mesma sidebar, escopei
  o "fecha os outros" para dentro de cada `.sidebar__accordion` (via
  `sidebar.querySelectorAll(".sidebar__accordion")` + trigger set por
  container) — abrir uma categoria de Ferramentas não fecha mais a
  categoria aberta da Biblioteca, e vice-versa.
- **Collapse do rail (desktop, modo só-ícones):** `applyCollapsedState`
  agora limpa e re-filtra os DOIS campos de busca (antes só o de
  Ferramentas), para não deixar filtro "grudado" ao expandir de novo.

### O que mudou em `css/styles.css`
Um bloco novo dentro do `@media (min-width: 900px)` existente (mesma seção
que já escondia `.sidebar__accordion` no modo colapsado), reaproveitando
100% das classes já existentes (`sidebar__link`, `sidebar__accordion-panel[hidden]`
override — mesmo padrão já documentado em `.tool-card[hidden]`) — não
inventei nenhuma classe visual nova, só um modificador estrutural
`.sidebar__accordion--tools` para diferenciar o accordion de Ferramentas do
de Biblioteca nesse modo específico:
- Motivo: o rail colapsado (~68px, só ícones) já mostrava as 35 ferramentas
  como ícones clicáveis ANTES desta mudança (a antiga `<ul class="sidebar__list">`
  plana nunca era escondida no modo colapsado). Se eu deixasse a regra
  genérica `.sidebar.is-collapsed .sidebar__accordion { display: none }`
  também esconder o novo accordion de Ferramentas, o rail perderia esse
  quick-nav por completo (regressão real, não pedida). A Biblioteca nunca
  teve esse comportamento (55 artigos sem ícone próprio não cabem/fazem
  sentido num rail de ícones) — continua escondida por completo, como
  sempre foi.
- `.sidebar.is-collapsed .sidebar__accordion--tools { display: flex }`
  reabre o accordion de Ferramentas nesse modo (mesma especificidade da
  regra genérica — 3 classes —, vence por vir depois no cascade).
- `.sidebar__accordion-trigger`/`.sidebar__accordion-label` somem dentro
  dele (a faixa de ~68px não comporta o texto/chevron da categoria).
- `.sidebar__accordion-panel[hidden] { display: flex }` força todas as
  categorias "abertas" nesse modo (ignora o `hidden` que uma categoria
  fechada teria) — resultado visual idêntico ao da lista plana anterior:
  35 ícones sempre visíveis, sem agrupamento por categoria (que não cabe
  no rail estreito de qualquer forma).

### Validação
- `node --check js/main.js` → OK.
- Contagem de `{`/`}` em `css/styles.css` → 443/443 (balanceado).
- `grep -n innerHTML js/main.js index.html` → só as 3 atribuições já
  existentes/documentadas (`resultadosGrid.innerHTML` com dado estático de
  `BIBLIOTECA_CATEGORIES`, `sidebar.innerHTML` com `buildSidebarMarkup`
  estático, `toggleBtn.innerHTML` com ícone SVG estático) — nenhuma nova.
  Cruzado com `grep -n "\.value" js/main.js | grep -i "busca\|termo\|input"`:
  `.value` só é LIDO (`.trim()`/comparação) ou ZERADO (`= ""` no collapse) —
  nunca escrito em template string/innerHTML.
- Isolamento de `buildSidebarMarkup` em Node (mesma técnica da Fase 2: só o
  trecho de dados+funções do arquivo REAL, sem stub reimplementado, com
  `document` mockado por não ser tocado nesse trecho) confirmou por
  contagem: **35** `<a class="sidebar__link" href="tools/...">` (soma
  3+5+11+5+7+4, uma por ferramenta, sem duplicata), **12**
  `sidebar__accordion-item` (6 categorias de Ferramentas + 6 de
  Biblioteca), **55** `sidebar__link--nested` (artigos, inalterado),
  `id="sidebar-tools-accordion"`/`id="sidebar-biblioteca-accordion"`/
  `id="sidebar-busca"`/`id="sidebar-biblioteca-busca"` presentes, link
  "Todos os artigos" presente. `TOOL_CATEGORIES` soma 35, `BIBLIOTECA_CATEGORIES`
  soma 55 — paridade confirmada com a base antes da mudança (registrada na
  Fase 2).
- Teste de estado inicial por categoria: `buildSidebarMarkup(..., "/tools/pix/")`
  → só a categoria "Financeiro" (que contém PIX) renderiza sem `hidden` no
  panel e com `aria-expanded="true"` no trigger; as outras 5 vêm fechadas.
  Mesmo teste com `/biblioteca/observer/` confirma `aria-current="page"` no
  link do artigo certo — comportamento herdado de `buildBibliotecaAccordion`
  preservado.
- `docker compose ps` → container já rodando (não derrubado). `curl` HTTP
  200 em `/`, `/tools/json/` (Texto & Dados), `/tools/pix/` (Financeiro),
  `/tools/cor/` (Conversores & Design), `/tools/senha/` (Segurança &
  Codificação), `/biblioteca/`, `/biblioteca/observer/` — 4 categorias de
  ferramenta diferentes + 2 páginas de Biblioteca.
- Leitura de código do fluxo de busca nos dois grupos (`criarFiltroAccordion`):
  termo existente → item some/fica conforme match, categoria com resultado
  abre (`setAccordionExpanded(trigger, true)`), mensagem de vazio some;
  termo inexistente → todas as categorias fecham, mensagem de vazio some
  de `hidden` (`role="status" aria-live="polite"` já herdado do padrão
  anterior); campo limpo → volta a `defaultExpandedId` capturado no load.

### Decisões de UX tomadas por conta própria
- **Não adicionei link de índice "Todas as ferramentas" em Ferramentas**
  (apontando para `index.html`), embora o brief tenha deixado a critério.
  Motivo: a home já é o destino do link "Início" na nav principal — um
  segundo link fazendo a mesma coisa dentro da sidebar seria redundante
  (diferente do link "Todos os artigos" da Biblioteca, que é o único jeito
  de "resetar" para a listagem completa de artigos a partir de dentro de um
  artigo — não existe outro link de nav para `biblioteca/` fora da sidebar).
  Simetria estrutural (accordion+busca nos dois grupos) foi priorizada
  sobre simetria decorativa (um link a mais só para "parecer igual").
- **Ícone por ferramenta preservado dentro do accordion** (`sidebar__link`,
  não `sidebar__link--nested`) — decisão já justificada acima, na seção
  "O que mudou em `js/main.js`".
- **CSS extra para preservar o rail colapsado** (`.sidebar__accordion--tools`)
  — não pedido explicitamente, mas necessário para não regredir um
  comportamento existente (rail de 35 ícones) que a unificação, aplicada
  ingenuamente, teria quebrado (accordion inteiro somem no modo colapsado,
  igual já acontecia com a Biblioteca).
- **Memória do projeto atualizada**: `project-nova-ferramenta-checklist.md`
  tinha uma afirmação explícita ("a sidebar NÃO replica essas 6
  categorias") que ficou contradita por esta mudança — atualizada para
  refletir que adicionar uma ferramenta agora exige tocar em DOIS arrays
  (`TOOLS` + `TOOL_CATEGORIES`) em `js/main.js`, não só um.

### Pendente (à época)
Item 2 (espaçamento gigantesco no body) seguia sem reprodução — aguardando
screenshot/detalhes do operador, como registrado na investigação acima.

## Item 2 — RESOLVIDO

### Diagnóstico final
O operador enviou um screenshot que confirmou a causa real: o "espaçamento
gigantesco" **não é** um bug de classe no `<body>` (hipótese investigada e
descartada acima, sem reprodução) — é o bloco de anúncio `<section class="ad">`
vazio, presente em praticamente todas as 93 páginas do site.

Cadeia de causa:
- `data-ad-client="ca-pub-0000000000000000"` é um placeholder (ainda sem
  conta AdSense real — ver comentário no `<head>` de cada página). Nenhum
  anúncio jamais preenche esse slot.
- O CSS de `.ad` (`css/styles.css`, `margin: 2.5rem 0; min-height: 90px;`)
  reserva espaço para evitar CLS enquanto o AdSense decide se tem anúncio —
  prática correta e recomendada. O problema é que esse espaço reservado
  **nunca é liberado** quando o slot não é preenchido: nem o HTML nem o CSS
  tinham lógica de collapse, então o vazio ficava permanente. Na prática, o
  próprio script do AdSense (ao tentar processar um slot que não pode
  preencher) muitas vezes infla ainda mais essa área, resultando num vazio
  visualmente bem maior que os 90px do CSS — batendo com o que o operador
  reportou (vazio enorme entre o resultado da ferramenta e o texto/FAQ
  abaixo).
- Esse problema também continuaria acontecendo DEPOIS do deploy com um
  pub-ID real: o AdSense frequentemente não tem anúncio para preencher um
  slot específico (baixo tráfego, sem anunciante disponível, ad blocker do
  visitante) — cenário normal de operação, não só do ambiente de dev atual.

### Fix — o que mudou em `js/main.js`
Nova função `collapseUnfilledAds()`, adicionada no fim da IIFE (chamada uma
única vez, na inicialização) e carregada por `js/main.js` — ou seja, cobre
os 93 arquivos HTML automaticamente, **sem editar nenhum deles**. Nenhuma
mudança em CSS ou nos HTMLs (a reserva de `min-height: 90px` em `.ad`
continua correta e necessária enquanto o AdSense está processando).

Lógica (padrão recomendado pelo próprio Google para collapse gracioso de
slot não preenchido):
1. `document.querySelectorAll(".adsbygoogle")` — trata como lista (0, 1 ou
   mais blocos), embora hoje haja no máximo 1 por página.
2. Para cada `<ins>`, resolve o container a esconder via
   `ins.closest(".ad")`; se não houver ancestral `.ad`, esconde o próprio
   `<ins>` como fallback (`(ins.closest && ins.closest(".ad")) || ins`).
3. `MutationObserver` observa mudanças no atributo `data-ad-status` do
   `<ins>` (é isso que o AdSense define de forma assíncrona depois de
   tentar preencher o slot). Se `data-ad-status === "unfilled"` →
   `container.hidden = true` (atributo `hidden`, não `style.display` via
   JS — consistente com o padrão já usado no resto do projeto, ex.:
   `sidebarBuscaVazio.hidden`, `row.hidden`). Se `"filled"` → não faz nada,
   só para de observar.
4. **Fallback por timeout de 3000ms por `<ins>`:** cobre os casos em que o
   AdSense nunca chega a definir `data-ad-status` — ad blocker no navegador
   do visitante (impede o script de rodar) ou, no cenário atual, a request
   falhando por causa do pub-ID placeholder antes de decidir filled/unfilled.
   Verifica `isProcessed()` (`data-ad-status` OU `data-adsbygoogle-status` —
   este último o AdSense sempre define ao processar o elemento, preenchido
   ou não); se nenhum dos dois existir depois de 3s, esconde o container.
5. `cleanup()` desconecta o `MutationObserver` e cancela o `setTimeout`
   assim que um dos dois resolve primeiro (evita vazamento de memória e
   dupla execução).
6. Se `document.querySelectorAll(".adsbygoogle")` não encontrar nada na
   página, o `forEach` simplesmente não itera — sem erro, sem no-op
   especial necessário (padrão defensivo do projeto).
7. Se `MutationObserver` não existir no navegador, o código pula direto
   para o `if (typeof MutationObserver === "function")` como falso e cai
   só no fallback por timeout — sem quebrar.

### Anti-XSS
Nenhum uso de `innerHTML` nem dado de usuário — só leitura de atributos
(`getAttribute`/`hasAttribute`) que o próprio script do AdSense escreve, e
toggle do atributo `hidden`. Confirmado por grep (ver Validação).

### Validação
- `node --check js/main.js` → OK.
- `grep -n "innerHTML" js/main.js` → só os 3 usos pré-existentes e já
  documentados (`resultadosGrid.innerHTML`, `sidebar.innerHTML`,
  `toggleBtn.innerHTML`, todos com dado estático) — nenhuma ocorrência nova
  na função `collapseUnfilledAds`.
- `docker compose ps` → container já estava rodando (não derrubado).
  `curl` HTTP 200 em `/`, `/tools/json/`, `/tools/cpf-cnpj/`,
  `/tools/senha/`, `/biblioteca/observer/` (5 páginas, incluindo uma sem
  `.ad` — a de Biblioteca — para confirmar que a função não gera erro nem
  quebra páginas sem bloco de anúncio). `curl` em `/js/main.js` → 200, e
  grep confirma `collapseUnfilledAds` presente no arquivo servido pelo
  Nginx (reflete a edição, sem precisar de restart do container — bind
  mount).

**Limitação conhecida do ambiente:** o comportamento real de
`collapseUnfilledAds()` depende de um script assíncrono de terceiro
(AdSense) que não pôde ser executado de verdade neste ambiente (sem
browser disponível — mesma limitação de Playwright/Chromium já registrada
na investigação do Item 2, acima). A validação foi feita por **leitura de
código**: correção da lógica do fallback de timeout (isProcessed cobre os
dois atributos que o AdSense usa), desconexão do observer em ambos os
caminhos de saída (filled/unfilled/timeout), uso de `closest(".ad")` com
fallback, e ausência de vazamento de memória (cleanup sempre chamado). Não
houve teste end-to-end num navegador real com o script do AdSense carregado
— essa é uma lacuna que só o operador pode fechar com o teste manual abaixo.

### Teste manual para o operador confirmar no navegador
1. Suba/confirme o site local (`docker compose up -d`, já rodando) e abra
   `http://localhost:8000/tools/json/` (ou qualquer outra ferramenta) no
   navegador.
2. Localize onde o bloco de anúncio ficava — entre o resultado da
   ferramenta e o conteúdo de texto/FAQ abaixo.
3. Aguarde ~3-4 segundos após o carregamento da página.
4. Confirme que o vazio enorme sumiu e o texto/FAQ abaixo "sobe" para logo
   depois do resultado da ferramenta, sem espaço em branco anômalo.
5. Opcional (DevTools): inspecionar o `<section class="ad">` correspondente
   e confirmar que ganhou o atributo `hidden` depois desse intervalo.
