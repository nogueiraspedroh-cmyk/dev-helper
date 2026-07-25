# Ferramenta JSON — Formatador/Verificador

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §3 (1ª ferramenta do MVP)

## Demanda

Primeira ferramenta do catálogo: formatar (pretty-print com indentação
configurável), minificar e validar JSON, com mensagem de erro legível —
estabelecendo o padrão arquitetural reutilizável das demais ferramentas.

## Decisões

- Padrão de URL aprovado: **`tools/<slug>/index.html`** (URL limpa `/tools/json/`).
- Saída em `<textarea readonly>` (via `.value`, nunca `innerHTML`) — anti-XSS.
- Erro com cálculo aproximado de linha/coluna a partir da posição do parser.
- Clipboard API com fallback `execCommand` para contexto não-seguro (file://).

## Etapas e delegação

| Etapa | Descrição | Agente |
|---|---|---|
| E1 | CSS base de ferramentas (`.tool*`, `.tool-grid`, `.tool-card`) | dev-typescript |
| E2 | Página `tools/json/index.html` (UI + AdSense + texto/FAQ) | dev-typescript |
| E3 | Lógica `js/tools/json.js` (defensiva, sem libs) | dev-typescript |
| E4 | Card da ferramenta na home (`index.html`) | dev-typescript |
| E5 | Validação no nginx local | dev-typescript + verificação final |
| E6 | Code review (gate obrigatório) | code-reviewer |

## Arquivos

- **Novos:** `tools/json/index.html`, `js/tools/json.js`
- **Alterados:** `css/styles.css` (bloco `.tool*` ao final), `index.html` (catálogo)
- **Inalterado:** `js/main.js` (confirmado)

## Validação

- HTTP 200 em `/`, `/tools/json/`, `/css/styles.css`, `/js/main.js`, `/js/tools/json.js`.
- Assets via `../../` corretos; AdSense presente; sem `innerHTML` real (só comentário).
- Rota inexistente → 404 servindo `error.html`.

## Code review

Aprovado, **sem bloqueadores**. 5 sugestões cosméticas (não aplicadas):
- S1: card aponta para `tools/json/` (depende do default root object) vs. frase do
  CLAUDE.md "cada link aponta para `.html` real" — alinhar texto no futuro.
- S2: cálculo de coluna do erro pode deslocar 1 (rotulado como "aprox.").
- S3: `getIndent()` fallback `|| 2` mascararia valor 0 (não ocorre no escopo).
- S4: sem botão "Validar" dedicado (validação coberta pelo Formatar).
- S5: sem feedback explícito de "JSON válido" (nice-to-have futuro).

## Pendências para produção

- Substituir `pub-ID`/`data-ad-slot` placeholders por valores reais (`DEPLOY.md`).
- Considerar S1 (alinhar frase do CLAUDE.md) numa próxima rodada.
