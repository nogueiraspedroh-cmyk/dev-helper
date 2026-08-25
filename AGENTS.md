<!-- Generated: 2026-07-31 -->

# tools-dev (root)

## Purpose
Site estático em HTML/CSS/JavaScript puro — sem framework, sem build step, sem
dependências de runtime — hospedado como páginas estáticas em AWS S3 + CloudFront.
O produto são duas frentes irmãs sob o mesmo chrome (nav/footer/CSS):

1. **Ferramentas para desenvolvedores** (`tools/<slug>/`): dezenas de utilitários
   que rodam 100% no navegador (gerador de CPF/CNPJ, cartão via Luhn, JSON
   formatter, conversores, etc.). Sem backend — toda lógica é client-side.
2. **Biblioteca** (`biblioteca/<slug>/`): artigos educacionais sobre Design
   Patterns (GoF), arquitetura de software e system design, com exemplos de
   código em abas TypeScript/PHP.

Todo o site tem uma **versão em inglês espelhada** em `en/` (mesma árvore,
mesmos slugs, conteúdo traduzido, scripts JS próprios em `js/tools-en/`).

## Key Files / Patterns

| Arquivo/dir | Papel |
|---|---|
| `index.html` | Home — catálogo de ferramentas em grid de cards, HTML estático manual |
| `error.html` | Documento de erro 404 (S3/CloudFront error document) |
| `ads.txt` | Obrigatório na raiz para o Google AdSense |
| `favicon.svg` | Favicon único do site |
| `docker-compose.yml` / `nginx.conf` | Ambiente local que replica o comportamento de 404 do S3/CloudFront |
| `CLAUDE.md` | Convenções gerais do projeto (leia primeiro — este AGENTS.md não repete o conteúdo dele) |
| `DEPLOY.md` | Publicação em S3 + CloudFront + ACM e checklist do AdSense |
| `.claude-work/flows/` | Histórico de tarefas executadas (fora do escopo de documentação AGENTS.md) |

## Subdirectories

| Diretório | AGENTS.md | Conteúdo |
|---|---|---|
| `biblioteca/` | [biblioteca/AGENTS.md](biblioteca/AGENTS.md) | ~55 artigos de arquitetura/system design em português |
| `tools/` | [tools/AGENTS.md](tools/AGENTS.md) | ~37 ferramentas para devs em português |
| `en/` | [en/AGENTS.md](en/AGENTS.md) | Espelho completo do site em inglês (biblioteca + tools + pages) |
| `js/` | [js/AGENTS.md](js/AGENTS.md) | `main.js` global, `lib/`, `tools/` e `tools-en/` |
| `css/` | [css/AGENTS.md](css/AGENTS.md) | Folha de estilo única `styles.css` |
| `docs/` | [docs/AGENTS.md](docs/AGENTS.md) | ROADMAP, PLANEJAMENTO, MELHORIA-CONTINUA-AGENTES |
| `pages/` | [pages/AGENTS.md](pages/AGENTS.md) | Páginas institucionais em português (sobre, contato) |

## For AI Agents

### Working In This Directory
- **Leia `CLAUDE.md` primeiro** — tem as convenções detalhadas (caminhos
  relativos por profundidade, AdSense, como rodar local, deploy). Este arquivo
  e os `AGENTS.md` filhos complementam, não substituem.
- Este projeto documenta AGENTS.md em **escopo category-level**, não
  leaf-level: não há (nem deve haver) um `AGENTS.md` dentro de cada
  `biblioteca/<slug>/` ou `tools/<slug>/` individual — são dezenas de
  diretórios estruturalmente idênticos (um único `index.html` seguindo o
  mesmo template). O padrão comum de cada categoria está documentado uma vez
  no `AGENTS.md` do diretório pai.
- Sem build: qualquer edição em HTML/CSS/JS reflete direto ao dar F5 no
  Docker (`docker compose up -d`, serve em `http://localhost:8000`).
- Caminhos são **relativos** e a profundidade depende do diretório (raiz usa
  `css/...`; `pages/` usa `../css/...`; `tools/<slug>/` e `biblioteca/<slug>/`
  usam `../../css/...`). Nunca use caminho absoluto (`/css/...`) — quebra em
  `file://` e depende da config do bucket.
- Nomes e caminhos são **case-sensitive** no S3 — mantenha tudo em minúsculas.

### Common Patterns
- `js/main.js` é carregado por **todas** as páginas e é **defensivo**: todo
  bloco checa `if (el)` antes de agir. Mantenha esse padrão em qualquer JS
  novo, inclusive nos scripts de ferramenta.
- Nunca use `innerHTML` com entrada do usuário — sempre `textContent`/`value`
  (risco de XSS). Ver `js/AGENTS.md` para detalhes por script.
- Toda página nova em português tem uma equivalente em `en/` com
  `hreflang` cruzado (`<link rel="alternate" hreflang="...">`) — ver
  `en/AGENTS.md`.

## Dependencies
- **Externas**: Google Fonts (Inter, JetBrains Mono) via `<link>`, Google
  AdSense (`adsbygoogle.js`). Nenhuma dependência de build/runtime (sem
  npm/node_modules neste repo).
- **Internas**: `css/styles.css` e `js/main.js` são singletons compartilhados
  por toda página — qualquer mudança neles é global, não local a uma
  ferramenta ou artigo.
