# Ferramenta Cartão — Gerador e Validador de Cartão de Crédito/Débito

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (4ª ferramenta do MVP)

## Demanda

Gerar números de cartão válidos por Luhn (fictícios, para teste) por bandeira, com
CVV e validade; e validar um número (Luhn + detecção de bandeira).

## Decisões

- Bandeiras do MVP: Visa (4/16), Mastercard (51–55 e 2221–2720/16), Amex
  (34,37/15, CVV 4), Elo (prefixos representativos/16), Hipercard (6062/16).
- **Compliance:** aviso visível no topo + FAQ — números são FICTÍCIOS, só teste.
- Ordem de detecção importa (Elo antes de Visa, pois alguns prefixos Elo começam
  com 4).

## Arquivos

- **Novos:** `tools/cartao/index.html`, `js/tools/cartao.js`
- **Alterados:** `css/styles.css` (`.cartao-aviso`, `.cartao-resultado-grid`,
  `.cartao-campo*`), `index.html` (card no catálogo)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` (subagente) — **Aprovado, sem bloqueadores**. Validou Luhn e check
digit em 50.000 casos (0 falhas) e round-trip geração→detecção de bandeira.
Sugestões cosméticas: remover bloco morto em `detectarBandeira`; acentuar
mensagens de feedback.

## Também nesta rodada: correção SQL-1

`js/tools/sql.js` — uppercase passou a afetar **apenas palavras-chave** SQL
reconhecidas (set `SQL_KEYWORDS_SET` + `uppercaseKeywordsOnly`), preservando a
caixa de identificadores e strings. Revisado e aprovado no mesmo ciclo.
Teste: `select id, nome from Usuarios where Ativo = 1` →
`SELECT id, nome FROM Usuarios WHERE Ativo = 1`.

## Validação

- HTTP 200 em `/tools/cartao/` e assets; `data-ad-slot="4444444444"` único.
- Luhn: `4111111111111111` VÁLIDO; `378282246310005` (Amex) VÁLIDO.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
- Sugestões cosméticas do review (acentuação, bloco morto) — opcionais.
