# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Site estático em HTML/CSS/JavaScript puro (sem framework, sem build step, sem
dependências), hospedado como páginas estáticas no AWS S3 + CloudFront.

**Produto:** uma coleção de pequenas **ferramentas para desenvolvedores**, cada
uma rodando 100% no navegador (não há backend). Ex.: gerador de CPF/CNPJ (com
CNPJ alfanumérico e validação), gerador de cartão (Luhn), gerador de endereço,
formatador/verificador de JSON, identador de SQL. A home funciona como catálogo
das ferramentas. Ver `docs/ROADMAP.md` para a arquitetura multi-ferramenta, o
backlog priorizado e as decisões em aberto.

## Documentos de referência

- `docs/ROADMAP.md` — visão do produto, arquitetura multi-ferramenta, backlog.
- `docs/PLANEJAMENTO.md` — processo de como tratar qualquer tarefa (recepção →
  decomposição → delegação aos agentes → validação → Definition of Done).
- `docs/MELHORIA-CONTINUA-AGENTES.md` — como avaliar e evoluir os subagentes.
- `DEPLOY.md` — publicação em S3 + CloudFront + ACM e checklist do AdSense.
- `.claude-work/flows/` — registro de cada tarefa executada (histórico/decisões).

## Estrutura e convenções

- `index.html` na raiz é a home (catálogo); páginas institucionais em `pages/`.
- **Ferramentas** ficam em `tools/<slug>/index.html`, com a lógica em
  `js/tools/<slug>.js`. Cada página de ferramenta carrega `js/main.js` (global)
  **e** o seu `js/tools/<slug>.js`. Não coloque lógica de ferramenta em
  `main.js` — ele roda em todas as páginas.
- Caminhos são **relativos** e a profundidade depende do diretório: raiz usa
  `css/...`; `pages/` usa `../css/...`; `tools/<slug>/` usa `../../css/...`.
  Links absolutos (`/css/...`) quebram em `file://` e dependem da config do
  bucket — não use. Confira a profundidade ao criar/mover páginas.
- `css/styles.css` é a folha de estilo **única**, compartilhada por todas as
  páginas. Usa custom properties em `:root` e classes BEM-ish (`.bloco__elemento`).
  Sem CSS por ferramenta — reaproveite as classes `.tool*`.
- `js/main.js` é carregado por **todas** as páginas no final do `<body>` e é
  **defensivo**: cada bloco checa `if (el)` antes de agir, porque o mesmo script
  roda em páginas sem aquele elemento. Mantenha esse padrão (inclusive nos JS de
  ferramenta) e evite `innerHTML` com entrada do usuário (risco de XSS).
- `error.html` é a página de erro 404 (documento de erro do S3/CloudFront).
- Nomes e caminhos são **case-sensitive** no S3 — mantenha tudo em minúsculas.

## AdSense

- A biblioteca do AdSense entra no `<head>` de cada página, **uma vez**.
- Blocos de anúncio são pares `<ins class="adsbygoogle"> + <script>push({})`;
  use a classe `.ad` (reserva espaço, evita layout shift). Um `data-ad-slot`
  diferente por bloco.
- `ads.txt` fica na **raiz** e precisa estar acessível em `https://dominio/ads.txt`.
- `pub-ID` e `data-ad-slot` estão como **placeholder** (`ca-pub-0000...`). Não
  publique valores reais sem o checklist de `DEPLOY.md`; a revisão do Google
  exige HTTPS, domínio próprio e conteúdo real (não placeholder) em cada página.

## Como rodar localmente

Não há build. O modo padrão é via Docker (imagem `nginx:alpine`), que replica o
tratamento de 404 do S3/CloudFront via `nginx.conf`:

```bash
docker compose up -d     # serve em http://localhost:8000
docker compose down      # para
docker compose restart   # após editar nginx.conf
```

A pasta do projeto é montada como volume — editar HTML/CSS/JS reflete ao dar F5,
sem reiniciar o container. Alternativa sem Docker: `python3 -m http.server 8000`.

## Deploy (resumo — detalhes em DEPLOY.md)

Bucket privado + CloudFront (OAC) + certificado ACM em `us-east-1` para HTTPS e
domínio próprio. Publicação:

```bash
aws s3 sync . s3://NOME-DO-BUCKET --delete \
  --exclude ".git/*" --exclude "*.md" \
  --exclude "docker-compose.yml" --exclude "nginx.conf"
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

Sem servidor de aplicação não há rewrites. Cada link aponta para um `.html`
real **ou** para um diretório terminado em `/` (ex.: `tools/json/`), que o
S3/CloudFront resolve para o `index.html` da pasta via *default root object* —
o padrão usado pelas páginas de ferramenta.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->