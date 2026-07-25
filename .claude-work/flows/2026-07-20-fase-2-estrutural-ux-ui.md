---
title: Fase 2 (estrutural) da auditoria de UX/UI — home search-first, split de categoria, busca na sidebar, card de ferramenta destacado
date: 2026-07-20
task_ref: "-"
agents: [orquestrador, dev-frontend]
files_touched:
  - index.html (hero → search-first, split de "Computação & Produtividade" em 4 categorias, comentário de documentação)
  - css/styles.css (.tool destacado, .home-hero*, .sidebar__search*)
  - js/main.js (busca/filtro da sidebar, markup do grupo "Ferramentas")
  - docs/ROADMAP.md (§2.1 atualizado para a nova taxonomia de 6 categorias)
  - "memória: project-nova-ferramenta-checklist.md (nova taxonomia)"
tags: [static-site, ux-ui, home, sidebar, categorization, a11y, refactor]
iterations: 1
status: success
---

## Contexto
Fase 2 (estrutural) da auditoria de UX/UI de 2026-07-20, feita como tarefa
única e coordenada porque os 4 itens tocam os mesmos arquivos compartilhados
(`index.html`, `css/styles.css`, `js/main.js`) e exigem decisão de design
coerente entre si. Segue a Fase 1 (quick wins: favicon, `flashButton` global,
`role="alert"`, chips do hero — ver
`2026-07-20-quick-wins-ux-ui-auditoria.md`), que não foi retrabalhada aqui.

Ponto de partida: 35 ferramentas, 3 categorias na home (Documentos &
Localização=3, Financeiro=5, **Computação & Produtividade=27** — 77% do
catálogo numa categoria só); sidebar com as 35 ferramentas em lista linear
sem busca/agrupamento; `.tool` (wrapper da ferramenta) sem fundo/borda/sombra
própria, indistinguível do FAQ que vem depois na mesma página; home com hero
grande "chips + CTA" em vez de busca-primeiro (padrão já validado na
Biblioteca).

## O que mudou

### 1. Home: hero → "search-first"
`index.html`: o hero manteve a identidade "terminal" (`.hero` escuro/`--ink`,
`hero__prompt` com `"> "`, `<h1>` "Sem servidor. Sem rastro.") mas ficou mais
compacto (nova classe `.home-hero`, aplicada AO LADO de `.hero` — não
substitui a classe base, então `error.html`, que usa só `.hero`/`.hero__title`/
`.hero__sub` sem o modificador, continua idêntico). O campo de busca
(`#home-busca`, mesmo id e mesma lógica de `js/main.js` — NÃO reimplementada)
virou o elemento dominante: maior, com ícone de lupa embutido (mesmo SVG da
Biblioteca), logo abaixo do h1/subtítulo. Os 5 chips de atalho (já atualizados
na Fase 1) foram mantidos, mas reposicionados abaixo da busca e com
`margin-top` que os mantém visualmente secundários (pills pequenas, já
existentes, não competem com o campo grande). Removido o botão "Explorar
ferramentas" (`#cta`) e sua mensagem (`#cta-message`): na leitura do código
esse botão nunca navegava nem fazia scroll — só trocava um texto por
"Botão clicado em HH:MM:SS" (comentado como "Exemplo de interatividade" em
`js/main.js`), então era ruído competindo com a busca sem função real.
`js/main.js` não foi alterado para isso: o listener já é guardado por
`if (cta && ctaMessage)`, então a ausência dos elementos é um no-op seguro
(confirmado por leitura, sem necessidade de editar main.js).

CSS novo (`css/styles.css`, após `.hero__chip:focus-visible`): `.home-hero`
(padding/margin mais compactos), `.home-hero__title` (clamp menor),
`.home-hero__sub` (fonte menor, opacidade reduzida), `.home-hero__field` +
`.home-hero__icon` (wrapper com ícone, reaproveitando `.hero__search-input`
para o campo em si — só adiciona padding-left para o ícone e aumenta
padding/font-size), `.home-hero .hero__chips` (margem ajustada). Nenhuma cor
nova — só tokens existentes.

### 2. Split de "Computação & Produtividade" (27 → 4 categorias)
A categoria única foi lida na íntegra (27 `tool-row` em `index.html`) e
dividida por eixo de TAREFA do usuário (não por implementação):

- **Texto & Dados (11)** — processa/transforma um bloco de texto ou dado
  estruturado: JSON, SQL, CSV↔JSON, YAML↔JSON, JSON→TypeScript, Diff de
  Texto, Editor de Markdown, Regex Tester, Contador de Caracteres, Dados
  Fake/Mock JSON, Escopo de Projeto (documento gerado em Markdown — mais
  próximo de "produção de texto/documento" que de "conversor").
- **Segurança & Codificação (5)** — lida com segredo/token/hash/encoding:
  Senha, Gerador de Hash, JWT Decoder, Gerador de UUID, Base64/URL.
- **Web, Rede & Automação (7)** — rede, tempo/agendamento, metadados de
  página: Calculadora CIDR, Cron Builder, Timestamp Unix, Conversor de Fuso
  Horário, Gerador de QR Code, Gerador de Meta Tags, Gerador de .gitignore.
- **Conversores & Design (4)** — converte um valor entre notações/formatos
  visuais, sem ser documento: Conversor de Case, Conversor de Base Numérica,
  Cor + Contraste WCAG, CSS Gradient Generator.

Distribuição final (com as 2 categorias pré-existentes): Documentos &
Localização=3, Financeiro=5, Texto & Dados=11, Segurança & Codificação=5,
Web/Rede & Automação=7, Conversores & Design=4 — soma 35, confirmado por
script (ver Validação). O agrupamento é deliberadamente desbalanceado (4 a
11 itens) — prioriza coerência semântica de cada balde sobre paridade
numérica; "Texto & Dados" é o maior porque é o eixo mais comum de tarefa
("preciso mexer nesse texto/JSON/dado") no catálogo atual.

**Decisão explícita: a sidebar NÃO foi reagrupada nessas 6 categorias.**
Continua uma lista única (array `TOOLS` em `js/main.js`, inalterado) — só
ganhou busca (item 3). Motivo: o brief tornava esse reagrupamento opcional
("se fizer sentido"); replicar 6 grupos exigiria um padrão de
accordion/colapso comparável ao já usado para a Biblioteca (55 artigos), o
que é mudança estrutural maior, com mais superfície de risco, para um
ganho marginal já coberto pela busca. Fica registrado como possível Fase 3.

O comentário de documentação em `index.html` (acima de `.catalog`) foi
reescrito com a nova taxonomia e um guia de decisão ("pergunte: ela
processa/transforma texto... ela lida com segredo/token... é sobre
rede/tempo... converte um valor entre notações...") para quem for adicionar
uma ferramenta nova nesse eixo.

### 3. Busca/filtro na sidebar (`buildSidebarMarkup`, `js/main.js`)
Adicionado um `<input type="search" id="sidebar-busca">` no topo do grupo
"Ferramentas" (antes do `<ul id="sidebar-tools-list">`), com
`<p id="sidebar-busca-vazio" role="status" aria-live="polite" hidden>` logo
depois da lista — mesmo padrão de `.biblioteca-search__empty`. O markup em si
é estático (template string, sem dado do usuário — mesma justificativa já
documentada no comentário de `sidebar.innerHTML` em `js/main.js`).

Filtro (`filtrarSidebar`, dentro do `if (sidebarBuscaInput)` guard): compara
`sidebarBuscaInput.value` normalizado (mesmo `normalizarSidebar` —
minúsculas + NFD + remoção de diacríticos, técnica idêntica a
`js/biblioteca.js`) contra o `textContent` de cada `.sidebar__link-label`,
alternando `hidden` nos `<li>` já renderizados via `querySelectorAll`. **O
termo digitado nunca é escrito de volta no DOM** (nem `innerHTML`, nem
template string) — só usado em `String.indexOf` e comparação, seguindo à
risca o padrão anti-XSS pedido. `filtrarSidebar` foi declarada como
`var filtrarSidebar = function () {...}` (não `function filtrarSidebar(){}`)
deliberadamente, para escapar do escopo de bloco do `if` em modo estrito e
ficar acessível também no handler de collapse (abaixo).

Tratamento do modo colapsado (rail só-ícones, desktop ≥900px,
`.sidebar.is-collapsed`): o campo de busca e a mensagem de vazio somem via
CSS (`.sidebar.is-collapsed .sidebar__search` etc., mesmo grupo de regras que
já escondia `.sidebar__group-title`/`.sidebar__accordion`). Para evitar
ícones "sumidos" sem explicação (filtro ativo mas campo escondido),
`applyCollapsedState` agora limpa `sidebarBuscaInput.value` e re-executa
`filtrarSidebar()` sempre que o rail colapsa.

### 4. Destaque visual de `.tool`
`css/styles.css`, `.tool` (wrapper `<article class="tool">` de toda página de
ferramenta): ganhou `background: var(--surface)`, `border: 1px solid
var(--border)`, `border-radius: var(--radius-lg)`,
`box-shadow: 0 1px 3px rgba(18, 22, 29, 0.06)` e padding interno
(`1.75rem 1.75rem 2rem`, reduzido para `1.25rem 1.1rem 1.5rem` no breakpoint
mobile ≤640px). Só tokens já existentes — nenhuma cor nova. Como
`box-sizing: border-box` já é global (regra `*, *::before, *::after` no topo
do stylesheet) e `.tool` é um bloco sem largura fixa dentro de `.container`
(que já tem padding lateral próprio), o padding novo não introduz overflow.

## Validação
- `node --check js/main.js` → OK.
- CSS: contagem de `{`/`}` balanceada (440/440) — sanity check sem
  linter dedicado no projeto.
- Anti-XSS: `grep -n "innerHTML" index.html js/main.js` → só 3 atribuições
  reais (`resultadosGrid.innerHTML` com dados estáticos de
  `BIBLIOTECA_CATEGORIES`, `sidebar.innerHTML` com `buildSidebarMarkup`
  estático, `toggleBtn.innerHTML` com ícone SVG estático) — nenhuma delas usa
  `termo`/`.value`/variável derivada de entrada do usuário. Confirmado
  também por grep cruzado (`sidebarBusca|home-busca|buscaHomeInput` vs
  `innerHTML` → nenhuma ocorrência).
- `docker compose ps` → container já rodando (não derrubado). `curl` HTTP 200
  em `/`, `/tools/json/`, `/tools/pix/`, `/tools/salario-pj-clt/`,
  `/tools/qrcode/`, `/tools/cidr/`, `/tools/senha/`, `/tools/cor/`,
  `/biblioteca/`, `/pages/sobre.html` (10 páginas, categorias diferentes,
  incluindo formulário longo e ferramenta com `<canvas>`).
- Contagem de categorias na home (script Python sobre o HTML renderizado):
  Documentos & Localização=3, Financeiro=5, Texto & Dados=11, Segurança &
  Codificação=5, Web/Rede & Automação=7, Conversores & Design=4 — soma 35.
- `href="tools/<slug>/"` únicos em `index.html` (35) comparados via `diff`
  contra os 35 slugs do array `TOOLS` em `js/main.js` → idênticos (nenhuma
  ferramenta perdida/duplicada na migração de categoria).
- Sidebar: como é injetada via JS (não aparece no HTML estático servido por
  `curl`), a verificação "antes/depois" foi feita executando
  `buildSidebarMarkup` de fato (extração do trecho puro do arquivo REAL —
  `TOOLS`, `BIBLIOTECA_CATEGORIES`, `svgIcon`, `buildBibliotecaAccordion`,
  `buildSidebarMarkup` — sem stub/reimplementação, só isolado do resto do
  IIFE que toca `document`) em Node, chamando a função com `pathname` de
  home e de uma página de ferramenta: **35 `<a class="sidebar__link"
  href="tools/...">` + 1 link de índice da Biblioteca**, e **35 `<li>`**
  dentro de `#sidebar-tools-list` nos dois casos — mesma contagem de antes
  (o array `TOOLS` não foi alterado, só envolvido pelo novo campo de busca).
  Confirmado também que `id="sidebar-busca"` e `id="sidebar-busca-vazio"`
  aparecem no markup gerado.
- Leitura do HTML renderizado da home confirmando que a busca cruzada com
  artigos da Biblioteca continua intacta: `#home-biblioteca-resultados` e
  `#home-biblioteca-resultados-grid` seguem presentes, sem alteração na
  lógica de `js/main.js` (bloco `if (buscaHomeInput)` não foi tocado, só o
  HTML ao redor do input).
- `error.html` (única outra página que usa `.hero`/`.hero__title`/
  `.hero__sub`) verificado via curl: sem as classes `home-hero*`, continua
  com o layout de hero original — confirma que os modificadores novos não
  vazam para fora da home.

## Decisões de design tomadas por conta própria
- Remoção do botão "Explorar ferramentas" (não pedido explicitamente, mas
  justificado: não tinha função real, só ruído competindo com a busca).
- Taxonomia de 6 categorias na home (ver item 2) — prioriza coerência
  semântica sobre paridade numérica entre categorias.
- Sidebar mantida como lista única (com busca), sem replicar as 6 categorias
  da home — ver justificativa no item 3.
- `.tool` com sombra sutil (`0 1px 3px rgba(18,22,29,.06)`) em vez de borda
  mais grossa/cor de destaque — mantém a hierarquia visual discreta já usada
  no resto do design system (cards da home/Biblioteca também usam sombra
  leve no hover, não borda grossa).

## Iterações
Iteração única — todas as validações passaram de primeira. Ajuste feito
durante a implementação (não uma iteração separada): a primeira versão de
`normalizarSidebar` foi escrita com um regex usando caracteres Unicode
combinantes literais em vez de `̀-ͯ` (inconsistente com
`normalizarHome`/`normalizar` já existentes) — corrigido via script Python
antes de rodar `node --check`, para manter o mesmo padrão em todo o arquivo.

## Pegadinhas / lições aprendidas
- `function nome() {}` declarada dentro de um bloco `if (...) { ... }` em
  modo estrito é block-scoped (semântica ES6) — não confiável fora do bloco.
  Para reusar `filtrarSidebar` no handler de collapse (fora do `if` onde foi
  definida), foi necessário trocar para `var filtrarSidebar = function
  () {...}` (var é function-scoped, sobe para o escopo da IIFE inteira,
  independente de estar dentro de um `if`).
- A sidebar é 100% injetada via JS — não dá para validar contagem de links
  só com `curl` no HTML estático. A validação real exigiu isolar e executar
  o trecho puro (sem DOM) de `buildSidebarMarkup` do arquivo `js/main.js`
  real em Node, com um stub mínimo de `document.getElementById` retornando
  `null` (só para não quebrar o bloco de busca da home, que fica ANTES de
  `buildSidebarMarkup` no arquivo e referencia `document` incondicionalmente
  no topo do bloco).
- `error.html` compartilha `.hero`/`.hero__title`/`.hero__sub` com a home —
  qualquer mudança nesses seletores base (em vez de modificadores dedicados
  como `.home-hero`) vazaria para a página de erro. Resolvido aplicando as
  classes novas SEMPRE ao lado da classe base, nunca substituindo-a.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: `2026-07-20-quick-wins-ux-ui-auditoria.md` (Fase
  1, pré-requisito); `docs/ROADMAP.md` §2.1 (atualizado); memória
  `project-nova-ferramenta-checklist.md` (nova taxonomia).
