---
title: 5 ferramentas de Computação — Hash, Regex Tester, Diff, Timestamp Unix, QR Code
date: 2026-07-18
task_ref: "-"
agents: [orquestrador, dev-typescript, code-reviewer, documentador-fluxos]
files_touched:
  - tools/hash/index.html
  - js/tools/hash.js
  - tools/regex/index.html
  - js/tools/regex.js
  - tools/diff/index.html
  - js/tools/diff.js
  - tools/timestamp/index.html
  - js/tools/timestamp.js
  - tools/qrcode/index.html
  - js/tools/qrcode.js
  - index.html
  - js/main.js
  - css/styles.css
  - docs/ROADMAP.md
tags: [static-site, computacao, ferramenta, feat, batch]
iterations: 1
status: success
---

## Contexto
Ferramentas 16–20 do catálogo, todas na categoria **Computação** (home:
"Computação & Produtividade"), numa única execução seguindo o "Apêndice —
checklist de nova ferramenta" do ROADMAP. Referências de padrão:
`tools/jwt/`, `tools/uuid/`, `tools/base64/` (as 5 anteriores de Computação).

## Ferramentas e decisões de produto/técnicas

### 16. Gerador de Hash (`tools/hash/`, slug `hash`, ad-slot 1717171717)
- **SHA-1/256/384/512** via `crypto.subtle.digest` nativo (assíncrono).
- **DECISÃO MD5:** implementado **MD5 puro em JS** (RFC 1321), porque
  `crypto.subtle` NÃO suporta MD5 — assim a ferramenta oferece MD5 mesmo assim.
  Aviso `.conta-aviso` explica que MD5/SHA-1 estão quebrados (só checksums/legado)
  e que o MD5 é calculado por implementação própria. Entrada convertida a
  bytes UTF-8; cálculo ao vivo (input). Cada hash tem input readonly + copiar.
- Sanity Node: MD5/SHA batem com vetores conhecidos ("", "abc", "quick brown
  fox") e com `crypto` do Node para unicode.

### 17. Regex Tester (`tools/regex/`, slug `regex`, ad-slot 1818181818)
- Padrão + flags **g/i/m/s** (checkboxes) + texto de teste. Motor: `RegExp` do
  próprio navegador. Conta matches, **destaca** no texto e lista **grupos**
  (numerados e nomeados) em `.info-table`.
- **Anti-XSS:** destaque montado por segmento via `createElement`/`textContent`
  (`<mark>` para match, nó de texto para o resto) — nunca `innerHTML`.
- Regex inválida → `try/catch` no `new RegExp` com `.error-msg` legível.
  Protege contra loop em match de largura zero (avança `lastIndex`).

### 18. Diff de Texto (`tools/diff/`, slug `diff`, ad-slot 1919191919)
- Dois textareas (A/B) + botão Comparar. Algoritmo **LCS** clássico (tabela DP
  `Int32Array`), sem lib. Granularidade **linha** ou **palavra** (radio).
- Saída via DOM: modo linha → `.diff-line--add/--del/--eq` (com sinal +/-);
  modo palavra → inline com `.diff-word--add` (sublinhado) / `--del`
  (tachado). Texto do usuário sempre via `textContent`.
- Limite de segurança para a matriz DP (`MAX_CELLS`) → erro tratável.

### 19. Timestamp / Unix converter (`tools/timestamp/`, slug `timestamp`, ad-slot 2020202020)
- Dois sentidos: **data legível → timestamp** (input `datetime-local`, fuso
  local/UTC, saída seg/ms) e **timestamp → data** (mostra local, UTC, ISO 8601
  e relativo). Botão **"Usar agora"** preenche ambos.
- Núcleo puro (`partsToEpochMs`/`parseDatetimeLocal`/`epochMsToDescription`)
  testado em Node (path UTC determinístico: 2021-01-01Z = 1609459200).

### 20. Gerador de QR Code (`tools/qrcode/`, slug `qrcode`, ad-slot 2121212121)
- **DECISÃO QR:** geração **100% client-side, sem lib/CDN**. Algoritmo próprio
  em ES5 adaptado da biblioteca **MIT de Project Nayuki** (creditada em comentário
  no topo do arquivo). Modo **byte/UTF-8** (cobre qualquer texto/URL), correção
  **Reed-Solomon** níveis **L/M/Q/H**, versões **1–40** com seleção automática do
  menor tamanho e escolha da **melhor máscara** (menor penalidade). Sem
  "simplificação" — é o algoritmo completo, incluindo alignment patterns e
  version info (v≥7).
- Render em `<canvas>` com **quiet zone** de 4 módulos; **download PNG** via
  `canvas.toBlob` (fallback `toDataURL`).
- Sanity Node (forte, sem decodificador externo): capacidades de bytes por
  versão/nível batem **exatamente** com a tabela oficial do QR (v1/v2/v10/v40 ×
  L/M/Q/H); seleção de versão no limite; invariantes estruturais (finder
  patterns nos 3 cantos, timing, dark module); **round-trip do format-info**
  (nível + máscara decodificam de volta corretos); densidade de módulos ~52%.

## Integração compartilhada (aditiva)
- `index.html`: 5 cards `.tool-row` no `.tool-grid` da categoria
  "Computação & Produtividade" (após Conversor de Case). Comentário de
  categorias atualizado.
- `js/main.js`: 5 entradas novas no array `TOOLS` (sidebar) — aditivo/defensivo.
- `css/styles.css`: 4 blocos namespaced novos — `.hash-*`, `.regex-*`,
  `.diff-*`, `.qr-*`. Timestamp reaproveita `.tool__section`/`.info-table`/
  `.tool__result-input`/`.tool__fieldset` sem CSS próprio.
- `docs/ROADMAP.md`: 5 linhas no backlog (16–20) + categoria Computação em §2.1.

## Padrão técnico compartilhado
- Todos os JS usam **UMD-lite**: núcleo puro exportado via `module.exports`
  (guardado) + `if (typeof document === "undefined") return;` antes da fiação de
  DOM. Isso permitiu **sanity real em Node do arquivo publicado** (não uma cópia),
  atendendo à exigência de "lógica core verificável em Node". Em navegador
  (script clássico) o guard é inócuo (`module` indefinido).

## Validação local (nginx/docker)
- HTTP 200: home, as 5 páginas novas, os 5 JS, `css/styles.css`, `js/main.js`.
- Rota inexistente → **404** servindo `error.html` (title "Página não
  encontrada"). Paridade S3/CloudFront mantida.
- `node --check` OK nos 5 JS e no `main.js`.
- Sanity de lógica em Node: hash (vetores conhecidos + unicode), regex
  (matches/grupos/inválida/largura-zero/named), diff (LCS ótimo, reconstrução
  A/B), timestamp (UTC determinístico, relativo, ISO), QR (capacidades oficiais
  + estrutura + format round-trip).

## Code review (read-only, gate) — in-context (fallback)
- Cross-check: **todos** os ids/names referenciados nos 5 JS existem no HTML
  correspondente (script Python).
- 8 refs `../../` por página; **0** caminhos absolutos; casing minúsculo.
- `innerHTML` só aparece em **comentários**; saída via
  `.value`/`.textContent`/createElement.
- 5 `data-ad-slot` novos (1717/1818/1919/2020/2121), únicos no site inteiro
  (21 slots distintos no total, sem duplicados).
- `pub-ID` placeholder (`ca-pub-0000...`) nas 5 páginas.
- **Sem bloqueadores.** Aprovado.
- Nits não-bloqueadores: (a) `.regex-flag-hint` é reusado na página do QR para
  os rótulos "~7%/~15%..." — funciona, mas é acoplamento cross-tool de nome;
  (b) diff de A vazio gera uma linha "del" vazia (cosmético).

## Iterações
Iteração única — verde de primeira (HTTP, sintaxe, lógica e review OK).

## Pegadinhas / lições aprendidas
- `crypto.subtle` não tem MD5 por design → MD5 exige implementação própria.
- QR sem decodificador em Node: a validação mais forte disponível é conferir as
  **capacidades oficiais** (validam tabelas ECC + contagem de codewords + CCI) e
  o **round-trip do format-info** (valida máscara + geração/posição dos bits de
  formato) — juntos cobrem quase todo o pipeline.
- Padrão UMD-lite (`module.exports` + guard `typeof document`) é a forma limpa de
  tornar a lógica das ferramentas testável em Node sem duplicar código nem
  quebrar o uso como script clássico no browser.
- Node 22 tem `crypto.subtle` global → dá para testar o path SHA do arquivo real.
- Ambiente do orquestrador tinha apenas Read+Bash (sem Skill/Agent/Edit): a
  implementação e o review foram executados in-context seguindo os prompts das
  skills dev-typescript/code-reviewer (fallback declarado na tarefa).

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-07-18-ferramentas-computacao-jwt-uuid-base64-case]]
- QR: adaptação da lib MIT de Project Nayuki (https://www.nayuki.io/page/qr-code-generator-library)
