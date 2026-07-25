# Ferramenta Conta Bancária — Gerador e Validador

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#7 — categoria Financeiro)

## Demanda

Gerar e validar dados fictícios de conta bancária (agência, operação e conta com
DV) para testes de software, com cálculo de dígito verificador por módulo 11.
Bancos do MVP: Banco do Brasil, Bradesco e Caixa Econômica Federal.

## Decisões

- **DV por módulo 11** documentado publicamente, com tratamento de casos especiais
  por banco:
  - **BB:** conta até 8 díg. + DV (pesos 2..9), agência 4 díg. + DV (pesos 2..5);
    DV=10 → "X", DV=11 → 0.
  - **Bradesco:** conta 7 díg. + DV (pesos 2..7), agência 4 díg. + DV (pesos 2..5);
    DV=11 → 0, DV=10 → "P".
  - **Caixa:** DV calculado sobre **operação (3 díg.) + conta (8 díg.)** com pesos
    2..9; DV=10 ou 11 → 0. Agência 4 díg. **sem DV** (formato mais comum). Operações
    representativas: 001, 013, 023.
- **Honestidade técnica/compliance:** dados fictícios; a regra de DV documentada
  **pode diferir** da variante interna/oficial de cada banco — não há vetor de teste
  oficial público. Disclaimer visível (`.conta-aviso`), aviso na validação, FAQ
  extenso e cabeçalho do JS deixam isso explícito. A Caixa é destacada como a menos
  padronizada publicamente.
- **Autoconsistência** como garantia central: toda conta gerada passa na própria
  validação (gerar → validar = VÁLIDO).
- Geração usa `Math.random` (dados de teste, não-sensíveis — diferente da Senha, que
  exige CSPRNG). Reaproveita as classes `.cartao-campo*` da ferramenta de Cartão.

## Arquivos

- **Novos:** `tools/conta-bancaria/index.html`, `js/tools/conta-bancaria.js`
- **Alterados:** `index.html` (card na categoria **Financeiro**, ao lado do Cartão),
  `css/styles.css` (classes `.conta-aviso`, `.conta-resultado-grid`,
  `.conta-validar-aviso`, `.conta-valid-label`, `.conta-valid-input`)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Reimplementou os 3 algoritmos em
Python e rodou **10.000 iterações por banco**: 10000/10000 OK, 0 falhas em todos.
Distribuição de DVs confirma que os ramos especiais (X/P/0) são exercitados (sem
código morto). Parsing, comprimentos, anti-XSS, caminhos relativos e slot AdSense
único verificados. Sugestões cosméticas/opcionais: acentuar mensagens de erro do JS;
validação do BB tolera agência `0000`/zeros à esquerda (assimetria inócua, gerador
nunca produz); `maxlength` da agência generoso; limpar `outOperacao` ao alternar de
Caixa para BB/Bradesco (sem impacto visual, linha fica oculta).

## Validação

- HTTP 200 em `/tools/conta-bancaria/` e `/js/tools/conta-bancaria.js`;
  `data-ad-slot="7777777777"` único entre as 7 ferramentas.
- Autoconsistência gerar→validar confirmada (10k/banco) pelo code-reviewer.
- Todas as classes CSS referenciadas existem em `css/styles.css`.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
- Sugestões cosméticas acima — candidatas a uma rodada de polimento futura
  (junto da limpeza de CSS inline recorrente, ver `docs/MELHORIA-CONTINUA-AGENTES.md`).
