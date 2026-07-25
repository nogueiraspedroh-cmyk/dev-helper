# Redesign — Design System "artefato tipado"

- **Data:** 2026-06-25
- **Status:** Concluída (DoD técnico atendido; validação estética com o usuário no navegador)
- **Origem:** usuário adicionou o skill `frontend-design` (instalado como plugin, ainda
  não habilitado no harness — guidance aplicada a partir do `SKILL.md` lido).

## Demanda

Elevar o visual do site (estava funcional mas "cru") com um design system distintivo,
aplicado em tudo. Decisões do usuário: **design system + aplicar em tudo** e **pipeline
de conteúdo seguindo em paralelo**.

## Direção de design (frontend-design)

Identidade **"artefato tipado / engenharia"**, fiel ao sujeito (ferramentas + biblioteca
para devs), fugindo dos 3 clichês de IA (creme+serifa+terracota / quase-preto+verde-ácido
/ jornal hairline):
- **Paleta (tokens em `:root`):** ink `#12161d`, paper `#f5f6f8`, surface `#fff`, primária
  índigo `#4f46e5` (hover `#4338ca`), **sinal** esmeralda `#10b981` (exclusivo da chrome de
  painéis de código + aba ativa), texto `#1f2530`, muted `#59616e`, bordas `#e3e6ea`/`#eceef1`,
  painel de código `#0e1320`/`#e6e9f0`. Raios 6/10px.
- **Tipografia (system stacks, zero webfont):** monoespaçada com personalidade
  (`ui-monospace, "JetBrains Mono", "SF Mono"…`) em display/eyebrows/títulos de card/h1-h3;
  sans humanista no corpo (`system-ui…`).
- **Elemento-assinatura:** o "painel tipado" — `.code-tabs`/`.code-bloco`/diagramas ASCII
  unificados num painel escuro com barra de cabeçalho rotulada e aba ativa em esmeralda.
- **Hero da home:** tese em prompt monoespaçado (`~/dev-helper —`), painel ink com grade
  blueprint sutil. `error.html` ficou on-brand.

## Estratégia (paralelismo sem git)

Como o projeto NÃO é repositório git, agentes simultâneos não fazem merge. Resolvido com
**ownership disjunto de arquivos**: o redesign é dono de `css/styles.css` (folha única →
propaga para todas as páginas automaticamente) + `index.html` raiz (hero) + `error.html`.
Os lotes de conteúdo são donos dos HTML novos da biblioteca e **não tocam o CSS** (reusam
classes existentes). Sem colisão.

## Arquivos

- **Alterados:** `css/styles.css` (tokens + reestilização de TODAS as classes existentes,
  sem renomear), `index.html` (hero remarcado: `.hero__prompt/__title/__sub`; IDs `#cta`,
  `#cta-message`, `#year` preservados), `error.html` (header/nav/hero/footer on-brand).
- **Inalterado:** `js/*` e o markup das páginas de ferramenta/biblioteca (o novo visual
  propaga via CSS compartilhado).

## Code review (gate técnico)

`code-reviewer` — **Aprovado com ressalvas** (corrigidas), **sem bloqueadores/regressões**:
- **Verificado OK:** 11 custom properties retrocompatíveis (`--color-*`) ainda definidas
  (aliases dos novos tokens) — zero var órfã; contrato do JS de abas intacto
  (`.code-tabs__panel[hidden]{display:none}`, `.code-tabs__tab--ativa`); 32 classes críticas
  preservadas sem renomear; chaves balanceadas; **zero webfont/CDN** (offline OK); IDs do
  main.js preservados.
- **Corrigido (acessibilidade AA):** contraste do `.hero__message` (1.9:1 → ~7:1, `#a5b4fc`),
  `.hero__prompt` (3.3:1 → ~4.8:1), abas inativas (~3:1 → ~4:1); `flex-wrap` no `.nav` (evita
  scroll horizontal ≤360px); foco global `a:focus-visible` (+ `.nav__brand`).

## Validação

- Chaves balanceadas (199/199). HTTP 200 em `/`, `/tools/json/`, `/pages/sobre.html`,
  `/biblioteca/`, `/biblioteca/strategy/`, `/css/styles.css` (CSS serve em todas as
  profundidades). `prefers-reduced-motion` preservado.
- **Pendente de validação estética com o usuário** (sem navegador headless no WSL puro):
  abrir http://localhost:8000/ e dar feedback da direção.

## Pendências

- Confirmar a direção visual com o usuário no navegador; refinar conforme feedback.
- Substituir placeholders do AdSense antes do deploy (geral).
