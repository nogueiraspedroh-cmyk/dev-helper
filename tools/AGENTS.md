<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# tools/

## Purpose
Coleção de **~37 ferramentas para desenvolvedores** em português, cada uma
rodando 100% no navegador (sem backend). É o produto principal do site — a
home (`../index.html`) funciona como catálogo dessas ferramentas. Cada
subpasta `tools/<slug>/` é **uma ferramenta**: um `index.html` autocontido +
lógica em `js/tools/<slug>.js`.

Existe um espelho completo em inglês em `../en/tools/` (ver
`en/tools/AGENTS.md`).

## Key Files / Patterns

Toda ferramenta (`tools/<slug>/index.html`) segue o **mesmo template**,
2 níveis abaixo da raiz (assets via `../../`):

- `<head>`: título + meta description específicos, `css/styles.css`,
  Google Fonts, `<link rel="alternate" hreflang="en" href="../../en/tools/<slug>/">`,
  lib do AdSense.
- `<body>`: nav/footer copiados (padrão do site, sem includes), depois
  `<article class="tool">` com:
  - `<header class="tool__header">`: título + descrição curta.
  - `<div class="tool__controls">`: campos de entrada, botões de ação
    (classes `.button` / `.button--secondary`).
  - `<div class="tool__output">`: área de resultado (`.result`), mensagem de
    erro (`.error-msg[hidden]`).
- Bloco `<ins class="adsbygoogle">` + `<script>push({})` logo **abaixo** da
  área de resultado (nunca entre os controles), `data-ad-slot` próprio da
  página (placeholder — não publicar valor real sem seguir `DEPLOY.md`).
- Seção de **conteúdo real** (texto explicativo + FAQ) — exigência do
  AdSense, documentada em `docs/ROADMAP.md` §1.3(f).
- Scripts no fim do `<body>`: `../../js/main.js` (global) **e**
  `../../js/tools/<slug>.js` (lógica específica, defensivo `if (el)`, sem
  libs externas). Nunca coloque lógica de ferramenta em `main.js`.

Cada ferramenta é um diretório estruturalmente idêntico — **não crie um
`AGENTS.md` por ferramenta**; este arquivo documenta o padrão para todas.

## Subdirectories

Nenhum `AGENTS.md` filho — os ~37 diretórios `tools/<slug>/` são folhas (um
`index.html` cada, sem lógica própria além do template acima; a lógica real
vive em `js/tools/<slug>.js`). Categorias do catálogo (ver
`docs/ROADMAP.md` §2.1 para a lista completa por ferramenta):

| Categoria | Exemplos |
|---|---|
| Documentos & Localização | CPF/CNPJ, CEP, Gerador de endereço |
| Financeiro | Cartão, Conta bancária, Conversor de moeda, PIX |
| Texto & Dados | JSON, SQL, CSV↔JSON, YAML↔JSON, Diff de Texto, Markdown |
| Segurança & Codificação | Senha, Hash, JWT Decoder, UUID, Base64/URL |
| Web, Rede & Automação | Subnet/CIDR, Cron, Timestamp, QR Code, .gitignore |
| Conversores & Design | Case, Base Numérica, Cor + Contraste WCAG, CSS Gradient |

## For AI Agents

### Working In This Directory
- Nova ferramenta: siga o checklist do apêndice de `docs/ROADMAP.md`
  ("checklist de nova ferramenta") — 4 pontos de integração: card na home
  (`../index.html`), entrada no array `TOOLS` de `js/main.js`, atualização
  do `docs/ROADMAP.md`, e o par completo em `en/tools/<slug>/`.
- Não use copy do tipo "tudo roda no navegador, nada é enviado" como
  disclaimer de privacidade em ferramenta nova — decisão já revertida no
  site (ver memória do projeto, retrofit concluído em 2026-07-20).
- Ferramentas que compartilham algoritmo pesado (ex.: geração de QR code)
  extraem o núcleo para `js/lib/` em vez de duplicar — ver
  `qrcode.js`/`pix.js` reaproveitando `js/lib/qrcode-core.js`.

### Common Patterns
- Classes BEM-ish reutilizáveis: `.tool`, `.tool__header`, `.tool__controls`,
  `.tool__output`, `.tool-grid` / `.tool-card` (grid de cards na home),
  `.button--secondary`, `.field`, `.result`, `.error-msg`. **Sem CSS por
  ferramenta** — tudo em `css/styles.css`.
- JS sempre defensivo (`if (el)`), sem `innerHTML` com entrada do usuário.
- Caminhos relativos `../../` para tudo compartilhado.

## Dependencies
- `css/styles.css` (classes `.tool*`).
- `js/main.js` (global, inclui o array `TOOLS`/`TOOL_CATEGORIES` que
  alimenta a sidebar de navegação) + `js/tools/<slug>.js` (por ferramenta).
- `js/lib/qrcode-core.js` — compartilhado entre `qrcode` e `pix`.
- Google Fonts + AdSense (mesmas libs do resto do site).
