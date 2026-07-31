<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# css/

## Purpose
Folha de estilo **única** (`styles.css`, 80.1K) compartilhada por **todas**
as páginas do site — home, biblioteca (PT/EN), ferramentas (PT/EN), páginas
institucionais (PT/EN). Não existe CSS por página ou por ferramenta; todo
estilo novo entra aqui como classe reutilizável.

## Key Files / Patterns

- `styles.css` — arquivo único, `:root { ... }` no topo com **custom
  properties** (design tokens): paleta (`--ink`, `--paper`, `--surface`,
  `--primary`, `--signal`, etc.), tipografia (`--font-mono`, `--font-sans`),
  layout (`--max-width*`, `--radius*`), sidebar (`--sidebar-width*`).
  Comentário explícito no arquivo marca um bloco de "aliases
  retrocompatíveis" (`--color-bg`, `--color-primary`, etc.) que **não deve
  ser removido** — quebra inputs/resultado das ferramentas que ainda
  referenciam os nomes antigos.
- Convenção de nomenclatura **BEM-ish**: `.bloco__elemento` (ex.:
  `.tool__header`, `.artigo__secao`, `.nav__links`), com modificadores via
  `--` (ex.: `.button--secondary`, `.code-tabs__tab--ativa`).
- Famílias de classes por seção do site:
  - `.tool*` / `.tool-grid` / `.tool-card` — layout de ferramentas e grid de
    cards do catálogo (ver `tools/AGENTS.md`).
  - `.artigo*` / `.code-tabs*` — layout de artigo da biblioteca (ver
    `biblioteca/AGENTS.md`).
  - `.nav*` / `.site-header` / `.site-footer` — chrome compartilhado.
  - `.ad` — reserva de espaço para blocos AdSense (evita layout shift/CLS).
  - `.button` / `.button--secondary` / `.field*` / `.result` / `.error-msg`
    — primitivos de UI reutilizados em qualquer ferramenta.

## Subdirectories
Nenhuma — arquivo único, sem subestrutura.

## For AI Agents

### Working In This Directory
- **Antes de escrever CSS novo, procure uma classe `.tool*` ou primitivo
  existente** que já resolva o caso — a regra do projeto é "sem CSS por
  ferramenta", reaproveitar classes é o padrão esperado, não uma otimização
  opcional.
- Se uma ferramenta tiver UI muito atípica que realmente não encaixa nas
  classes existentes, a exceção documentada em `docs/ROADMAP.md` §1.3(c) é
  um `<style>` inline **na própria página** — não crie um segundo arquivo CSS.
- Mudança neste arquivo é **sempre global** (afeta toda página do site,
  PT e EN) — teste visualmente em mais de uma seção (uma ferramenta, um
  artigo, a home) antes de considerar concluída.
- Não remova as "aliases retrocompatíveis" do bloco `:root` sem grep prévio
  confirmando que nenhum HTML ainda usa o nome antigo da variável.

### Common Patterns
- Nomenclatura: `.bloco__elemento`, modificador `.bloco--variante`.
- Cores, espaçamento e raio de borda sempre via `var(--token)`, nunca valor
  hardcoded direto numa regra nova (facilita tema/consistência).

## Dependencies
- Google Fonts (Inter, JetBrains Mono) carregadas via `<link>` no `<head>` de
  cada página — `--font-sans`/`--font-mono` assumem esses nomes de família.
- Nenhuma dependência de build (sem Sass/PostCSS/CDN) — CSS puro, editado
  diretamente.
