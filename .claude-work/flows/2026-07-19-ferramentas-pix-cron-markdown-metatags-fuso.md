# Lote 5 — 5 ferramentas: PIX, Cron, Markdown, Meta Tags, Fuso Horário

- **Data:** 2026-07-19
- **Tags:** static-site, computacao, financeiro, feat, lote-5, refactor-qr
- **Status:** ✅ Concluído (validado em nginx local; container deixado no ar)

## Tarefa

Adicionar 5 ferramentas novas ao catálogo (ferramentas #32–#36):

1. **Gerador de PIX Copia e Cola / QR Code** (`tools/pix/`) — *Financeiro*
2. **Cron Builder / Explicador** (`tools/cron/`) — *Computação*
3. **Editor / Preview de Markdown** (`tools/markdown/`) — *Computação*
4. **Gerador de Meta Tags / Open Graph** (`tools/meta-tags/`) — *Computação*
5. **Conversor de Fuso Horário** (`tools/fuso-horario/`) — *Computação*

Além disso, um **refactor** do motor de QR Code para compartilhá-lo entre a
ferramenta de QR e a de PIX.

## Limitação do ambiente de execução

Este lote foi implementado por um orquestrador que, neste ambiente, dispunha
apenas de **Read + Bash** (sem as skills `dev-*`/`code-reviewer` nem Edit/Write).
A implementação foi feita diretamente via Bash (heredocs + Node), mas seguindo os
mesmos passos discretos de dev e de autorrevisão de segurança/qualidade que as
skills executariam. Registro aqui para rastreabilidade.

## Refactor do motor de QR (compartilhamento do núcleo)

- Criado `js/lib/qrcode-core.js` (**UMD-lite**): núcleo puro extraído de
  `js/tools/qrcode.js` — `encodeText`, Reed-Solomon (GF(256), poly 0x11D),
  seleção de versão/máscara, `ECL`, `getNumDataCodewords`. Exporta via
  `module.exports` (Node) **e** `window.QRCore` (navegador).
- `js/tools/qrcode.js` passou a **consumir** o núcleo
  (`require("../lib/qrcode-core.js")` em Node / `window.QRCore` no browser),
  mantendo apenas a fiação de canvas/DOM/PNG.
- `tools/qrcode/index.html` carrega `js/lib/qrcode-core.js` **antes** de
  `js/tools/qrcode.js`.
- **Regressão confirmada:** `encodeText("HELLO WORLD", "M")` → `size: 21`,
  `version: 1`; `tools/qrcode/` responde 200 com os elementos DOM originais
  intactos; `node --check` limpo nos dois arquivos.

## Arquivos criados

- `js/lib/qrcode-core.js` (novo diretório `js/lib/`)
- `tools/pix/index.html` + `js/tools/pix.js`
- `tools/cron/index.html` + `js/tools/cron.js`
- `tools/markdown/index.html` + `js/tools/markdown.js`
- `tools/meta-tags/index.html` + `js/tools/meta-tags.js`
- `tools/fuso-horario/index.html` + `js/tools/fuso-horario.js`

## Arquivos editados

- `js/tools/qrcode.js` — refatorado para usar o núcleo compartilhado.
- `tools/qrcode/index.html` — carrega o `qrcode-core.js` antes.
- `index.html` — 5 cards `.tool-row` (PIX em *Financeiro*; os outros 4 em
  *Computação & Produtividade*).
- `js/main.js` — 5 entradas no array `TOOLS` (sidebar), com ícones SVG.
- `docs/ROADMAP.md` — linhas #32–#36 no backlog + categorias §2.1.
- `css/styles.css` — 2 blocos aditivos: `.md-preview` (editor de Markdown) e
  `.mt-card*` (preview do card de Open Graph).
- Este flow + `.claude-work/flows/INDEX.md`.

## Ad-slots usados (todos placeholder `ca-pub-0000...`)

| Ferramenta | data-ad-slot |
|-----------|--------------|
| pix | 3131313131 |
| cron | 3535353535 |
| markdown | 3636363636 |
| meta-tags | 3737373737 |
| fuso-horario | 3838383838 |

Unicidade global validada: `grep -rho 'data-ad-slot="[0-9]*"' tools/ index.html
pages/ | sort | uniq -d` → vazio.

## Decisões de design / edge-cases

### PIX (BR Code / EMV + CRC16)
- **CRC16-CCITT** (poly `0x1021`, init `0xFFFF`, sem reflexão, xorout 0). Vetor
  de validação **canônico e público**: `crc16("123456789") === 0x29B1` (check
  value oficial do CRC-16/CCITT-FALSE, exatamente o algoritmo do PIX). Confirmado
  em Node. O CRC é calculado sobre o payload já com `"6304"` anexado.
- Campos EMV montados na ordem ascendente: `00`(Payload Format=01), `01`(Point of
  Initiation=11, reutilizável), `26`(GUI `br.gov.bcb.pix` + chave + descrição
  opcional), `52`(MCC=0000), `53`(moeda=986), `54`(valor, só se informado),
  `58`(BR), `59`(nome), `60`(cidade), `62`(txid, `05`), `63`(CRC).
- Nome (máx 25) e cidade (máx 15) normalizados: maiúsculas, sem acento, só
  `A-Z0-9` e espaço. Valor aceita `,`/`.` → `toFixed(2)`; vazio/≤0 omite o campo
  54. txid alfanumérico (máx 25); ausente → `***`.
- QR gerado com `window.QRCore.encodeText(payload, "M")` no canvas (reaproveita a
  lógica de desenho da ferramenta de QR). Exemplo gerado:
  `00020101021126430014br.gov.bcb.pix0121minha-chave@email.com5204000053039865802BR5913FULANO DE TAL6009SAO PAULO62070503***63040D4D`
  (CRC `0D4D`, verificado por recomputação sobre o corpo).

### Cron
- 5 campos; `*`, listas `1,2,3`, ranges `1-5`, steps `*/5` e `1-30/5`.
- **Fora de escopo (documentado no FAQ):** campo de segundos (6 campos) e nomes
  por extenso (`MON`/`JAN`) — apenas números; sem apelidos `@daily`.
- Próximas execuções por varredura minuto-a-minuto com **saltos** (pula mês/dia/
  hora que não casam) e cap de segurança (~416 dias) contra expressões impossíveis.
- Combinação dia-do-mês × dia-da-semana segue a **regra Vixie** (ambos restritos
  ⇒ OU; senão E).

### Markdown (maior risco de XSS do catálogo)
- Parser puro → **AST** (`parseMarkdown`/`parseInline`); renderização
  **exclusivamente** por `document.createElement` + `textContent`. **Nunca**
  `innerHTML`. Texto de negrito/itálico/link tratado como dado.
- URL de link validada por `isSafeUrl`: aceita `http:`/`https:`/`mailto:`/
  relativo; **rejeita** `javascript:`, `data:`, `vbscript:` (link vira texto
  puro). Remove `\t\n\r`/espaços antes de checar o esquema (bloqueia
  `java\tscript:`). Links seguros recebem `rel="nofollow noopener noreferrer"`.
- Suporta: headings `#`–`######`, `**negrito**`, `*itálico*`, `` `código` ``,
  blocos ```` ``` ````, listas `-`/`*` e numeradas, `[texto](url)`, `> citação`,
  `---`, parágrafos. Fora de escopo documentado no FAQ.

### Meta Tags / Open Graph
- **Sem scraping/fetch** (site sem backend) — geração 100% manual, deixado
  explícito na página e no FAQ.
- Bloco `<meta>` (description + Open Graph + Twitter Card) com **escape de
  atributo** (`& < > "`) para markup válido; saída via `.value` (textarea).
- Preview do card montado via `createElement`/`textContent`; `img.src` só é
  setado se a URL passar por `isSafeUrl` (http/https). Domínio extraído da URL.

### Fuso Horário
- `Intl.DateTimeFormat` nativo (sem lib). Conversão wall-time→UTC por
  **refinamento de offset** (calcula o offset do fuso no instante estimado e
  corrige uma vez, tratando bordas de horário de verão).
- Validado em Node: SP 15:00 → UTC 18:00; Tokyo 03:00 (+09); NY jan `UTC-05:00`
  (EST) vs. jul `UTC-04:00` (EDT) — DST correto.
- Lista de fusos IANA adicionável/removível; render da tabela via createElement.

## Validação

- `node --check` limpo em: `qrcode-core.js`, `qrcode.js`, `pix.js`, `cron.js`,
  `markdown.js`, `meta-tags.js`, `fuso-horario.js`, `main.js`.
- Sanidade em Node por ferramenta: CRC16 `0x29B1`; cron `describe`/`nextRuns` +
  erros esperados; markdown `isSafeUrl` (safe/unsafe) e AST; meta-tags escape +
  domínio + truncate; fuso conversões + DST.
- Autorrevisão (papel code-review): caminhos `../../`, casing minúsculo, JS
  defensivo (`if (el)`/`return`), saída sem `innerHTML` de dado do usuário,
  ad-slots únicos, `pub-ID` placeholder, sem regressão no QR.
- `docker compose up -d` + fetch (Node): home, as 5 páginas novas, `tools/qrcode/`
  e todos os assets (incl. `js/lib/qrcode-core.js`) → **200**; rota inexistente →
  **404** servindo `error.html`. Container deixado no ar.

## Aprendizados para os próximos lotes

- **Núcleo de QR agora é compartilhável** via `js/lib/qrcode-core.js`
  (`window.QRCore`/`require`). Novas ferramentas que precisem de QR reusam-no —
  não reimplementar.
- **CRC16-CCITT-FALSE**: validar sempre contra o vetor `"123456789" → 0x29B1`.
- Próximos ad-slots livres sugeridos: 3939393939, 4040404040, … (evitar
  4444–9999 repetidos e os já usados).
