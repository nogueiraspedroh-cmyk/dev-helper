# Ferramenta SQL — Identador/Formatador

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (3ª ferramenta do MVP)

## Demanda

Formatar (reindentar) e minificar queries SQL no navegador. Formatter heurístico
por palavras-chave + indentação, sem parser completo e sem libs externas.

## Decisões

- Formatter palavra-a-palavra (`split(/(\s+)/)`), casando cláusulas compostas
  (INNER JOIN, ORDER BY, GROUP BY) antes das de uma palavra — evita falsos
  positivos clássicos (OR dentro de ORDER, JOIN órfão).
- Literais entre aspas simples isolados como placeholders `\x00STRn\x00` antes de
  qualquer transformação e restaurados ao final — uppercase/marcação nunca tocam
  no conteúdo das strings (suporta `''` escapado).
- Itens de lista (SELECT, SET) separados por vírgula vão em linhas indentadas.
- `try/catch` com fallback para a entrada original — a UI nunca quebra.

## Arquivos

- **Novos:** `tools/sql/index.html`, `js/tools/sql.js`
- **Alterados:** `css/styles.css` (refactor: 5 custom properties de cor em `:root`
  — `--color-border`, `--color-success-bg/-fg`, `--color-danger-bg/-fg` — e
  classes migradas, aparência inalterada), `index.html` (card no catálogo)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` (subagente) — **Aprovado, sem bloqueadores**. Confirmou ausência
de regressão visual no refactor de cores (hex = tons canônicos, pares bg/fg/border
coerentes). Sugestões cosméticas registradas abaixo.

## Validação

- HTTP 200 em `/tools/sql/` e `/js/tools/sql.js`; card na home; vars em `:root`;
  sem `innerHTML` real (só comentário).
- Exemplos formatados conferidos (SELECT+JOIN+WHERE+GROUP/ORDER, INSERT, UPDATE,
  DELETE) — saída coerente.

## Pendências / observações (sugestões do review, não bloqueiam)

- **SQL-1 (vale endereçar):** o checkbox diz "Palavras-chave em maiúsculas", mas o
  código aplica `toUpperCase()` na query inteira (exceto strings), afetando também
  identificadores. Ajustar o texto da UI **ou** restringir o uppercase às keywords.
- SQL-2: comentários `--` podem corromper a saída (colapso de newlines) —
  documentado no FAQ como limitação conhecida.
- SQL-4: aspas duplas/backticks não são protegidos (só aspas simples) — edge case.
- CSS-1: bordas `#fca5a5`/`#86efac` ficaram fora das vars (escopo era 5 props) —
  futuro `--color-success-border`/`--color-danger-border`.
- Substituir `pub-ID`/`data-ad-slot` (`3333333333`) placeholders antes do deploy.
