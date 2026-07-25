---
title: 4 ferramentas de Computação — JWT Decoder, Gerador de UUID, Base64/URL, Conversor de Case
date: 2026-07-18
task_ref: "-"
agents: [orquestrador, dev-typescript, code-reviewer, documentador-fluxos]
files_touched:
  - tools/jwt/index.html
  - js/tools/jwt.js
  - tools/uuid/index.html
  - js/tools/uuid.js
  - tools/base64/index.html
  - js/tools/base64.js
  - tools/conversor-case/index.html
  - js/tools/conversor-case.js
  - index.html
  - js/main.js
  - css/styles.css
  - docs/ROADMAP.md
tags: [static-site, computacao, ferramenta, feat, batch]
iterations: 1
status: success
---

## Contexto
Ferramentas 12–15 do catálogo, todas na categoria **Computação** (home:
"Computação & Produtividade"), implementadas numa única execução seguindo o
"Apêndice — checklist de nova ferramenta" do ROADMAP, uma vez por ferramenta.
Referências de padrão: `tools/json/`, `tools/senha/`, `tools/salario-pj-clt/`.

## Ferramentas e decisões de produto
### 1. JWT Decoder (`tools/jwt/`, slug `jwt`, ad-slot 1313131313)
- Decodifica header e payload (Base64URL → JSON) e exibe formatados em textareas
  `.result` readonly, com botão copiar por seção.
- Base64URL decode próprio (troca `-_`→`+/`, repõe padding, reinterpreta latin1
  como UTF-8 via decodeURIComponent) — trata acentos/emoji no payload.
- Claims temporais `exp`/`iat`/`nbf` renderizadas em `.info-table` via
  createElement (nunca innerHTML); cada uma mostra epoch + data legível
  (local + UTC). Badge `.result-validar` indica EXPIRADO/dentro da validade/neutro.
- **Decisão-chave:** NÃO verifica assinatura (impossível client-side sem a chave).
  Deixado explícito em aviso `.conta-aviso` no topo + seção "o que faz / não faz"
  + FAQ, para não passar falsa sensação de validação de segurança.
- Token malformado (< 2 segmentos, segmento não-Base64, JSON inválido) → mensagem
  `.error-msg` clara, sem quebrar a página. Decodifica ao vivo (input) + botão.

### 2. Gerador de UUID (`tools/uuid/`, slug `uuid`, ad-slot 1414141414)
- `crypto.randomUUID()` com fallback para `getRandomValues` (16 bytes + bits de
  versão 4 / variante RFC 4122). Ambos CSPRNG; sem Math.random.
- Quantidade 1–100 (clamp). Opções: com/sem hífens; maiúsc./minúsc.
- Lista renderizada via createElement: cada item = input readonly
  (`.tool__result-input`) + botão "Copiar". Botão "Copiar todos" (um por linha)
  aparece só quando há ≥ 2. Regera ao alternar opções de formatação.
- Gera 1 UUID no load para o usuário ter resultado imediato (espelha o senha.js).

### 3. Base64 / URL encode-decode (`tools/base64/`, slug `base64`, ad-slot 1515151515)
- Dois modos via radio (Base64 | URL). Cada modo com Codificar/Decodificar,
  além de Limpar e Copiar.
- **UTF-8 seguro:** Base64 encode = `btoa(unescape(encodeURIComponent(str)))`,
  decode = `decodeURIComponent(escape(atob(str)))` — round-trip validado com
  "olá 👋 mundo — çãé". URL usa `encodeURIComponent`/`decodeURIComponent`.
- Entrada inválida (Base64 malformado → atob lança; `%` malformado no URL) →
  `.error-msg` legível. Troca de modo limpa a saída/erro.

### 4. Conversor de Case (`tools/conversor-case/`, slug `conversor-case`, ad-slot 1616161616)
- **Decisão:** mostra TODOS os 6 formatos de uma vez (camelCase, PascalCase,
  snake_case, kebab-case, CONSTANT_CASE, Title Case), atualizados ao vivo — mais
  útil que exigir seleção. Cada linha tem botão copiar próprio.
- Linhas de resultado são ESTÁTICAS no HTML (ids fixos `case-out-*`), então o JS
  só preenche `.value` — zero markup a partir de dado do usuário.
- Tokenização reconhece limites camelCase/PascalCase (inclui heurística
  `XMLHttpRequest → xml/http/request`) e separadores comuns; dígitos preservados.

## Integração compartilhada (aditiva)
- `index.html`: 4 cards `.tool-row` no `.tool-grid` da categoria
  "Computação & Produtividade" (após o card Escopo).
- `js/main.js`: 4 entradas novas no array `TOOLS` (sidebar) — arquivo permanece
  defensivo e sem mudança de comportamento; só dados aditivos.
- `css/styles.css`: 2 blocos namespaced mínimos — `.uuid-lista/.uuid-item*` e
  `.case-grid/.case-linha*` (responsivo < 560px). Todo o resto reaproveita
  `.tool*`, `.result`, `.error-msg`, `.result-validar`, `.info-table`,
  `.conta-aviso`, `.tool__result-input`.
- `docs/ROADMAP.md`: 4 linhas no backlog (12–15) + categoria Computação em §2.1.

## Validação local (nginx/docker)
- HTTP 200: home, `/tools/jwt/`, `/tools/uuid/`, `/tools/base64/`,
  `/tools/conversor-case/`, os 4 JS, `css/styles.css`, `js/main.js`.
- Rota inexistente → status 404 servindo `error.html` (title "Página não
  encontrada"). Paridade S3/CloudFront mantida.
- `node --check` OK nos 4 JS e no `main.js`.
- Sanity de lógica em Node: JWT (header/payload/exp expirado, unicode),
  Base64 round-trip UTF-8, URL enc/dec, 6 conversões de case + tokenização de
  camel/Pascal/números, formato UUID v4 (regex RFC).
- Cross-check: todos os `getElementById`/ids dinâmicos existem no HTML correspondente.

## Code review (read-only, gate)
- Sem `innerHTML` com dado do usuário (só menções em comentários); saída via
  `.value`/`.textContent`/createElement.
- Sem caminho absoluto/maiúsculo; 8 refs `../../` por página; casing minúsculo.
- `pub-ID` placeholder (`ca-pub-0000...`) em todas as páginas.
- 17 `data-ad-slot` distintos no site, cada um usado 1×; os 4 novos
  (1313/1414/1515/1616) livres e únicos.
- `js/main.js` aditivo/defensivo, sintaxe OK.
- **Sem bloqueadores.** Aprovado.

## Iterações
Iteração única — verde de primeira (HTTP, sintaxe, lógica e review OK).

## Pegadinhas / lições aprendidas
- `atob` do Node é leniente (não lança em Base64 inválido), mas o `atob` do
  navegador lança `InvalidCharacterError` — o try/catch do base64.js está correto
  para o alvo real (browser); a sanity em Node não cobre esse caminho de erro.
- Home usa 3 categorias consolidadas ("Computação & Produtividade"), não as 5 do
  §2.1 do ROADMAP — os cards entraram na categoria consolidada correta.
- Ao adicionar ferramenta é preciso tocar em DOIS lugares além da pasta: card em
  `index.html` E entrada no array `TOOLS` de `js/main.js` (sidebar injetada).
- Ad-slots repetidos (1111–9999) e 1010/1212/1234/0987 já em uso; novos escolhidos
  na sequência 1313/1414/1515/1616 (livres).
- Ambiente do orquestrador tinha apenas Read+Bash (sem Skill/Agent/Edit): a
  implementação e o review foram executados in-context seguindo os prompts das
  skills dev-typescript/code-reviewer (fallback declarado na tarefa).

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-07-18-ferramenta-salario-pj-clt]]
