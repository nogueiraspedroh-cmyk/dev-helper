<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# pages/

## Purpose
Páginas institucionais do site em português — conteúdo que não é nem
ferramenta nem artigo de biblioteca (ex.: sobre o projeto, contato). 1 nível
abaixo da raiz (assets via `../`).

## Key Files / Patterns

| Arquivo | Conteúdo atual |
|---|---|
| `sobre.html` | Placeholder — "Esta é a página Sobre. Edite o conteúdo conforme necessário." Inclui a lib do AdSense no `<head>` e um bloco `<ins>` no corpo. |
| `contato.html` | Placeholder — "Esta é a página Contato. Edite o conteúdo conforme necessário." **Não** inclui a lib do AdSense nem bloco de anúncio (inconsistente com `sobre.html` — verificar antes de publicar). |

Ambas seguem o esqueleto padrão do site: `<head>` com `css/styles.css` via
`../css/styles.css`, Google Fonts, `hreflang` cruzado para o par em
`../en/pages/`; `<body>` com nav/footer copiados e `<script src="../js/main.js">`
no fim.

**Nenhuma das duas tem conteúdo real ainda** — ambas são placeholders
explícitos do template inicial do projeto. Isso é relevante para o checklist
de AdSense (`DEPLOY.md`): página com placeholder reprova a revisão do
Google; qualquer tarefa que prepare o site para produção precisa substituir
esse texto por conteúdo real antes do deploy.

## Subdirectories
Nenhuma.

## For AI Agents

### Working In This Directory
- Ao escrever conteúdo real para `sobre.html`/`contato.html`, replique a
  mesma tarefa em `en/pages/about.html`/`en/pages/contact.html` (ver
  `en/AGENTS.md`) — os pares existem e têm o mesmo texto placeholder hoje.
- Se adicionar o bloco AdSense em `contato.html` para alinhar com
  `sobre.html`, use um `data-ad-slot` diferente do já usado em `sobre.html`
  e na home (um slot por página/bloco, conforme `CLAUDE.md`).
- Página institucional nova (ex.: política de privacidade, termos): mesma
  profundidade (`../` para assets), mesmo esqueleto de nav/footer, e
  precisa de card/link de navegação + par em `en/pages/` + `hreflang`
  cruzado.

### Common Patterns
- Caminhos relativos `../` (1 nível).
- `<link rel="alternate" hreflang="en" href="../en/pages/<arquivo-en>.html">`
  no `<head>`; o lado inglês aponta de volta com `hreflang="pt-BR"`.

## Dependencies
- `css/styles.css`, `js/main.js` (raiz do projeto, compartilhados).
- Google Fonts + AdSense (quando presente).
