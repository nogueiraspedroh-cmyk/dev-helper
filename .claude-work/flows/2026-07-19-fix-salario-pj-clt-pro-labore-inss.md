---
title: Correção — Calculadora de Salário PJ vs CLT (pró-labore + INSS ausentes)
date: 2026-07-19
task_ref: "-"
agents: [orquestrador, dev-typescript]
files_touched:
  - tools/salario-pj-clt/index.html
  - js/tools/salario-pj-clt.js
  - docs/ROADMAP.md
tags: [static-site, financeiro, ferramenta, fix]
iterations: 1
status: success
---

## Contexto
Bug reportado pelo operador do site: o cálculo do lado PJ não tinha nenhum
campo de pró-labore — o "líquido PJ" era só `faturamento − impostos(alíquota%)
− custos fixos`, sem desconto de INSS. Isso é incorreto: todo sócio PJ
(mesmo optante do Simples) precisa declarar um pró-labore mensal, e sobre ele
incide INSS. Pedido do operador: "O PJ tem que especificar o pro labore, caso
não especifica pegamos o salário mínimo. Pois o INSS é 11% desse valor."

## O que mudou

### `js/tools/salario-pj-clt.js`
- Nova constante `SALARIO_MINIMO = 1412.00` (mesma referência 2024 já usada
  na primeira faixa de `INSS_FAIXAS`), documentada como padrão de pró-labore
  quando o campo é deixado em branco/inválido/≤0.
- Nova função `calcularINSSProLabore(proLabore)`: alíquota fixa de 11% sobre
  `Math.min(proLabore, INSS_TETO_SALARIO)` — reaproveita o teto de
  contribuição já usado no INSS CLT. JSDoc deixa explícito que é uma
  aproximação (a alíquota efetiva do contribuinte individual pode variar
  conforme o regime de recolhimento: 11% simplificado ou 20% cheio, com/sem
  dedução da CPP da empresa).
- `calcularPJ(...)` ganhou os parâmetros `proLabore` e `proLaboreDefault`
  (o chamador já resolve qual valor usar — a função só calcula). O INSS do
  pró-labore agora é subtraído do líquido mensal:
  `liquidoMensal = faturamento - impostoMensal - custosMensal - inssProLabore`.
  `proLabore`, `proLaboreDefault` e `inssProLabore` entram no objeto de retorno.
- `calcular()` (handler do botão) lê `inputPjProLabore`; se vazio/inválido/≤0,
  usa `SALARIO_MINIMO` e marca `proLaboreDefault = true`.
- `criarColunaPJ(pj)` (renderização via `createElement`, sem innerHTML) ganhou
  duas linhas novas entre "Faturamento/mês" e "(−) Impostos": "Pró-labore
  considerado" (com sufixo " (padrão: salário mínimo)" quando aplicável) e
  "(−) INSS s/ pró-labore (11%)".
- `limpar()` e `onEnter` atualizados para incluir o novo campo (mesmo padrão
  defensivo `if (el)` do `pj-custos`, já que o campo é opcional).

### `tools/salario-pj-clt/index.html`
- Novo input `#pj-pro-labore` (opcional, sem `required`) posicionado logo
  após `pj-faturamento` e antes de `pj-aliquota` — é conceitualmente a
  primeira dedução do PJ, antes dos impostos.
- Texto de aviso pós-inputs (`.conta-validar-aviso`) reescrito: removida a
  sugestão de "embutir o INSS do pró-labore na alíquota" (agora contraditória,
  já que o INSS é calculado automaticamente); adicionada menção ao novo campo
  e ao padrão de salário mínimo.
- FAQ "Por que a alíquota PJ é editável e começa em 6%?" — mesma frase
  problemática removida/ajustada.
- Novo bullet na seção "Como o cálculo PJ é estimado" explicando pró-labore
  obrigatório, padrão de salário mínimo (R$ 1.412,00, referência 2024) e
  INSS de 11% limitado ao teto.
- Texto "100% no navegador / nenhum dado enviado a servidor" **não foi
  tocado** — está fora do escopo desta correção (tarefa separada, a ser feita
  em todas as páginas do site).

### `docs/ROADMAP.md`
- Linha do item #11 (Financeiro) atualizada para mencionar o pró-labore
  (padrão salário mínimo) e o INSS de 11% deduzido do líquido PJ.

## Decisões de design

- **11% flat em vez de tabela progressiva**: o pró-labore do sócio é
  tributado como contribuinte individual, cujo regime mais comum/simples é o
  "Plano Simplificado" de 11% flat (sem faixas), diferente da tabela
  progressiva do empregado CLT (7,5%–14% por faixa). Usar a tabela CLT aqui
  seria tecnicamente incorreto — são regimes previdenciários diferentes.
  Documentado no JSDoc como aproximação, já que na prática o sócio pode optar
  pelo regime de 20% (com dedução da CPP patronal de 20% se a empresa não for
  optante do Simples), o que foge do escopo desta calculadora ilustrativa.
- **Teto do INSS reaproveitado**: o teto de contribuição previdenciária
  (`INSS_TETO_SALARIO = 7786.02`) é um limite único do sistema, não específico
  do regime do empregado — vale também para o contribuinte individual.
  Reaproveitar a constante evita duplicação e mantém consistência caso a
  legislação mude o teto no futuro (uma única constante a atualizar).
- **Pró-labore opcional com fallback para salário mínimo**: reflete o pedido
  literal do operador ("caso não especifica pegamos o salário mínimo") e
  também a prática real — todo sócio PJ precisa ter pró-labore declarado
  (obrigação legal), então um padrão sensato é melhor que deixar o campo
  crítico de fora do cálculo silenciosamente.
- **UX do "padrão foi usado"**: optou-se por concatenar `" (padrão: salário
  mínimo)"` ao valor formatado na linha "Pró-labore considerado", em vez de
  criar um modificador de linha novo (`salario-linha--nota`) — mais simples,
  sem CSS adicional, e a informação fica no mesmo lugar onde o número
  aparece (não exige o usuário caçar uma nota em outro canto da coluna).

## Validação
- `node --check js/tools/salario-pj-clt.js` → OK (sem erros de sintaxe).
- Sanity matemática manual via `node -e` (funções replicadas isoladamente,
  já que o arquivo não segue o padrão UMD-lite/`module.exports` — não
  refatorado para isso nesta correção, fora de escopo):
  - Pró-labore padrão (R$ 1.412,00) → INSS R$ 155,32 (11% flat).
  - Pró-labore R$ 2.500,00 (abaixo do teto) → INSS R$ 275,00.
  - Pró-labore R$ 10.000,00 (acima do teto) → INSS R$ 856,46, igual a
    `INSS_TETO_SALARIO × 11% = 856,46` — teto aplicado corretamente.
- `grep innerHTML` → único uso é o comentário existente que documenta a
  proibição (nenhum innerHTML novo introduzido).
- `docker compose` já estava rodando; `curl -s -o /dev/null -w "%{http_code}"`
  para `tools/salario-pj-clt/` e `js/tools/salario-pj-clt.js` → ambos HTTP 200.
  Container deixado rodando ao final.

## Iterações
Iteração única — validado de primeira (sintaxe, matemática e HTTP OK).

## Pegadinhas / lições aprendidas
- O arquivo `salario-pj-clt.js` não expõe funções via `module.exports`
  (não segue o padrão UMD-lite de tools mais recentes do projeto) — validação
  de lógica feita replicando as funções puras em `node -e` isoladamente, em
  vez de `require()` direto. Não foi refatorado para UMD-lite por estar fora
  do escopo desta correção pontual.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-07-18-ferramenta-salario-pj-clt]]
