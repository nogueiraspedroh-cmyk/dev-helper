# Endereço — extensão internacional (EUA, Portugal, Espanha, Reino Unido)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#9) e §4.6 — fecha o follow-up "internacional"
- **Base:** estende a ferramenta criada em `2026-06-23-ferramenta-endereco.md` (BR)

## Demanda

Completar o item #9 do backlog ("BR + internacional"): adicionar países ao gerador
de endereço, que no MVP entregou só o Brasil.

## Decisões (com o usuário)

- Países: **Estados Unidos, Portugal, Espanha, Reino Unido** (além do Brasil).
- Mesma filosofia do BR: estados/regiões e **cidades REAIS**, mas via/número/bairro/
  código postal **fictícios**. Códigos postais seguem só o **formato** de cada país
  (não são geograficamente exatos) — explicitado no FAQ.
  - ZIP US: 5 dígitos, 1º dígito 1-9, não vinculado ao estado.
  - Postcode UK: padrão visual britânico, sem base Royal Mail.
  - CP espanhol: 2 primeiros dígitos 01-52 (faixa de províncias), parcialmente plausível.
  - CP português: formato `NNNN-NNN`.

## Implementação

- Seletor de **País** que adapta o seletor de região (estados US, distritos PT,
  províncias ES, regiões UK) e oculta campos BR-only (complemento) via `hidden`.
- Formatadores de saída por país (multilinha e uma linha) no layout canônico de cada um.
- Tudo montado com `createElement`/`textContent` (zero `innerHTML`); listeners
  registrados uma vez; geração 1/5/10 por país.

## Datasets (após correção)

| País | Regiões | Cidades |
|---|---|---|
| Brasil | 27 estados | ~166 |
| EUA | 50 estados | 269 |
| Portugal | 18 distritos | 112 |
| Espanha | 18 províncias | 114 |
| Reino Unido | 4 regiões | 40 |

## Arquivos

- **Alterados:** `js/tools/endereco.js` (reescrito p/ 5 países), `tools/endereco/index.html`
  (seletor de país, FAQ/conteúdo p/ 5 países, `<title>`/`<h1>`), `index.html` (card
  atualizado p/ BR + internacional). Sem classe CSS nova (reusou as existentes).
- **Inalterado:** `js/main.js`.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas**, ressalvas corrigidas:
- Confirmou: sem regressão no BR (coerência CEP↔região preservada vs `cep.js`),
  anti-XSS impecável, formatos de saída canônicos, guard completo, slot único, sem
  CSS inline indevido.
- **Bloqueadores de DADOS** (cidades em região errada, violando "regiões reais"):
  PT (`Porto` com Braga/Guimarães; `Aveiro` com Viseu; `Coimbra` com Leiria) e ES
  (`Valencia` com Alicante/Elche/Castellón; `Zaragoza` com Huesca/Teruel).
- **Correção:** varredura completa de PT e ES. Cidades realocadas; criados os
  distritos/províncias ausentes que causavam o erro — PT ganhou **Leiria** (18
  distritos continentais); ES ganhou **Huesca** e **Castellón** (18 províncias).
  "Gaia" → "Vila Nova de Gaia" (nome oficial). EUA e UK reconferidos: sem erros
  (Kansas City existe em KS e MO; Newport/Gales; Perth/Escócia, etc.).

## Validação

- HTTP 200 em `/tools/endereco/` e `/js/tools/endereco.js`; `data-ad-slot="9999999999"`
  mantido único.
- Arrays de dados PT/ES conferidos pós-correção (entradas erradas removidas; comentários
  documentam cada remoção). Sem `style=` além do `display:block` do AdSense.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy (geral do projeto).
