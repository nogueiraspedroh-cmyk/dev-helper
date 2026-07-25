---
title: Ferramenta Calculadora de Salário PJ vs CLT
date: 2026-07-18
task_ref: "-"
agents: [orquestrador, dev-typescript, code-reviewer, documentador-fluxos]
files_touched:
  - tools/salario-pj-clt/index.html
  - js/tools/salario-pj-clt.js
  - index.html
  - js/main.js
  - css/styles.css
tags: [static-site, financeiro, ferramenta, feat]
iterations: 1
status: success
---

## Contexto
11ª ferramenta do catálogo (categoria Financeiro): compara remuneração CLT e PJ
pelo TOTAL ANUAL estimado, com 3 modos (só CLT / só PJ / comparativo lado a lado),
descontos legais, itens do vínculo (13º, férias+1/3, FGTS), tributação PJ editável
e uma lista dinâmica de benefícios. Segue o "Apêndice — nova ferramenta" do ROADMAP.

## Decisão arquitetural
Reuso máximo do padrão existente: página `tools/<slug>/` (assets `../../`), JS
próprio defensivo, CSS aditivo namespaced `.salario-*`. Sem libs. Padrão de lista
dinâmica espelhado do gerador de escopo (createElement + botão Remover), estendido
para 3 campos (nome + valor + aplicabilidade).

Decisões de produto (assunções, sem usuário em tempo real):
- **Benefícios com aplicabilidade por item** (Ambos/Só CLT/Só PJ) via `<select>` —
  mais útil que um flag global; default "Ambos". Cada benefício soma valor×12 ao
  total anual do(s) regime(s).
- **CLT**: INSS progressivo 2024 (7,5–14%, teto 7.786,02 → máx ~908,86); IRRF mensal
  2024 (base = bruto−INSS, sem dependentes) com parcela a deduzir; 13º líquido ≈ 1
  mês líquido; 1/3 de férias estimado pela razão líquido/bruto; FGTS = 8% sobre 13
  salários (incluído no pacote por ser dinheiro do trabalhador).
- **PJ**: faturamento − (alíquota editável, default 6% ≈ Simples Anexo III) − custos
  fixos opcionais; sem 13º/férias/FGTS automáticos. Total anual = 12 × líquido.
- Ambos os painéis de entrada ficam sempre visíveis; o modo (radio) controla só quais
  colunas de resultado aparecem. Comparativo exibe caixa de diferença (R$/ano, % e /mês).
- Todas as tabelas são ILUSTRATIVAS/estimativas — disclaimer `.conta-aviso` + FAQ
  explicitando que não substitui consultoria (mesmo padrão do gerador de cartão).

## Passos executados
1. Descoberta — leitura de ROADMAP/PLANEJAMENTO, conversor-moeda e escopo como templates.
2. Implementação (dev-typescript) — `js/tools/salario-pj-clt.js` (INSS/IRRF/CLT/PJ,
   benefícios dinâmicos, render via createElement) + `tools/salario-pj-clt/index.html`
   (3 modos, entradas CLT/PJ, benefícios, resultado, AdSense slot 1010101010, texto+FAQ).
3. Integração — card na categoria Financeiro em `index.html`; entrada no array `TOOLS`
   de `js/main.js` (sidebar); bloco `.salario-*` em `css/styles.css`.
4. Validação local (nginx/docker) — HTTP 200 na página, JS, CSS, home; 404 → error.html;
   `node --check` OK; sanity da matemática fiscal (INSS teto 908,86; R$8000→líq 6.037,08).
5. Code review (read-only) — sem innerHTML, sem path absoluto, pub-ID placeholder,
   textContent na saída, casing minúsculo, main.js aditivo. Aprovado, sem bloqueadores.

## Iterações
Iteração única — verde de primeira (HTTP, sintaxe, matemática e review OK).

## Pegadinhas / lições aprendidas
- `INDEX.md` de flows não existia — criado neste flow.
- Ad-slots de 1111111111 a 9999999999 já em uso; usado **1010101010** (livre).
- 13º e 1/3 de férias são estimativas (o real tem tributação própria por evento);
  documentado nas FAQ para não induzir a exatidão.
- Ambiente do orquestrador tinha apenas Read+Bash (sem Skill/Agent/Edit): a
  implementação e o review foram executados in-context seguindo os prompts das skills.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-06-23-ferramenta-conversor-moeda]], [[2026-06-25-ferramenta-escopo]], [[2026-06-23-ferramenta-cartao]]
