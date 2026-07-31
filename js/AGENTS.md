<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# js/

## Purpose
Todo o JavaScript do site, sem build/bundler (arquivos carregados diretamente
via `<script src="...">`). Organizado por escopo: um script global
compartilhado por toda página, um script específico da seção Biblioteca, uma
pasta de lógica por ferramenta em português, o par em inglês, e uma pasta de
código compartilhado entre ferramentas.

## Key Files / Patterns

| Arquivo/dir | Carregado em | Papel |
|---|---|---|
| `main.js` (74.8K) | **todas** as páginas, fim do `<body>` | Global: ano do footer, `window.DevHelper.flashButton` (feedback "Copiado!"), sidebar de navegação injetada via JS (array `TOOLS`/`TOOL_CATEGORIES`, ~L118+/L373+), detecção PT/EN (`isEnglishPath`), `TOOLS_EN`/`TOOL_CATEGORIES_EN` (derivados de `TOOLS` via `.map`, ~L479+/L496+), `UI_STRINGS` (~L837+) para textos da sidebar por idioma |
| `biblioteca.js` (11.0K) | só `biblioteca/index.html` e `biblioteca/<slug>/index.html` (PT **e** EN — reaproveitado, não duplicado) | Abas de código `.code-tabs` (TypeScript/PHP), busca client-side no índice, TOC auto-gerado a partir dos `<h2>` do artigo |
| `lib/qrcode-core.js` (17.1K) | ferramentas que geram QR Code | Núcleo puro de geração de QR (Reed-Solomon, versões 1–40, seleção de máscara) extraído para reuso — hoje consumido por `tools/qrcode` e `tools/pix` (e seus pares `-en`) |
| `tools/<slug>.js` | `tools/<slug>/index.html` (PT) | Lógica específica de cada ferramenta, ~37 arquivos, um por ferramenta |
| `tools-en/<slug>.js` | `en/tools/<slug>/index.html` | Par em inglês de cada `tools/<slug>.js` — mesma lógica de negócio, strings de UI traduzidas |

**Todo `js/tools/<slug>.js` e `js/tools-en/<slug>.js` é estruturalmente
idêntico em intenção** (um arquivo por ferramenta, defensivo, sem libs
externas) — não há necessidade de um `AGENTS.md` por arquivo; este documento
cobre o padrão comum. Ver `tools/AGENTS.md` e `en/tools/AGENTS.md` para o
contrato de cada lado (HTML ↔ JS).

## Subdirectories

| Diretório | AGENTS.md | Conteúdo |
|---|---|---|
| `lib/` | — (arquivo único, sem subpadrão a documentar) | `qrcode-core.js` |
| `tools/` | — (ver nota acima) | ~37 scripts, um por ferramenta em português |
| `tools-en/` | — (ver nota acima) | ~37 scripts, um por ferramenta em inglês |

## For AI Agents

### Working In This Directory
- **`main.js` é defensivo por contrato**: todo bloco começa checando
  `if (el)` antes de agir, porque o mesmo arquivo roda em páginas sem aquele
  elemento (home, artigo, ferramenta, página institucional — todas carregam
  `main.js`). Qualquer adição nova a este arquivo **precisa** seguir o mesmo
  padrão — não assuma que um elemento existe.
- Ao adicionar uma ferramenta nova, o JS específico vai em
  `tools/<slug>.js` (e o par `tools-en/<slug>.js`) — **nunca** em `main.js`,
  mesmo que pareça pequeno. Colocar lógica de ferramenta em `main.js` faria
  toda página baixar código que não usa.
- Ao corrigir um bug de lógica/cálculo em `tools/<slug>.js`, replique em
  `tools-en/<slug>.js` — são o mesmo algoritmo, só strings diferem (ver
  `en/tools/AGENTS.md`, seção "Working In This Directory").
- Se duas ferramentas precisarem do mesmo algoritmo pesado, extraia para
  `lib/` (padrão já usado por `qrcode-core.js`) em vez de duplicar.
- Nenhum destes arquivos usa import/export (sem módulos ES, sem build) — são
  IIFEs (`(function () { "use strict"; ... })()`) que expõem o necessário via
  `window.DevHelper` quando outro script precisa consumir algo (ex.:
  `flashButton`).

### Common Patterns
- IIFE com `"use strict"` no topo de cada arquivo.
- `if (el)` antes de qualquer manipulação de elemento.
- **Nunca `innerHTML` com conteúdo do usuário** — sempre `textContent`/
  `value`/`createElement` (risco de XSS); ver `js/biblioteca.js` como
  referência de comentário anti-XSS explícito.
- `window.DevHelper.flashButton(btn, label, duration)` é o utilitário
  compartilhado para feedback de "Copiado!" em botões — não duplique essa
  lógica num script de ferramenta novo.

## Dependencies
- Nenhuma dependência externa (sem npm, sem CDN de framework). Consome
  apenas APIs nativas do navegador (`crypto.subtle`, `crypto.randomUUID`,
  `Intl.DateTimeFormat`, `clipboard`, etc., dependendo da ferramenta).
- `main.js` é dependência implícita de **todo** outro script desta pasta
  (`window.DevHelper`) — deve ser carregado antes deles no HTML.
