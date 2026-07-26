---
title: Tradução para inglês — Fase B (36 ferramentas restantes, 37/37 completo)
date: 2026-07-25
task_ref: "-"
agents: [orquestrador, dev-typescript, code-reviewer]
files_touched:
  - js/main.js
  - en/index.html
  - en/tools/**/index.html (36 pastas)
  - js/tools-en/**/*.js (36 arquivos)
  - tools/**/index.html (36 páginas pt-BR — hreflang retrofit)
tags: [static-site, i18n, en, feat, seo, lote]
iterations: 2
status: success
---

## Contexto
Sequência direta da Fase A ([[2026-07-25-traducao-ingles-fase-a-infra-piloto]]),
que deixou a infra de i18n pronta e traduziu 1 ferramenta piloto (`json`). O
usuário pediu um plano `/goal` (ultragoal, ferramenta OMC) com ponto final =
site inteiro traduzido, política de máx. 2 tentativas de correção por lote
antes de escalar. Plano de 15 stories gerado (`.omc/ultragoal/goals.json`):
G001-G006 = Fase B (esta execução), G007-G015 = Fase C (Biblioteca, futura).

## Decisão arquitetural
Nenhuma decisão nova de arquitetura — Fase B só replica em lote o padrão já
fechado na Fase A (`en/tools/<slug>/index.html` + `js/tools-en/<slug>.js` +
`TRANSLATED_PATHS` + hreflang recíproco + link no catálogo `en/index.html`).
A única decisão de escopo tomada durante a execução foi corrigir o hreflang
retroativamente em todas as 36 páginas pt-BR de uma vez (ver Iterações), em
vez de só nas do lote em andamento, para fechar a pendência transversal.

## Passos executados
1. G001 — Lote 1 (8: Documentos/Localização + Financeiro — cpf-cnpj, cep,
   endereco, cartao, conta-bancaria, conversor-moeda, salario-pj-clt, pix) —
   dev-typescript → code-reviewer — aprovado sem bloqueadores.
2. G002 — Lote 2 (11: Texto & Dados — sql, csv-json, yaml-json,
   json-para-typescript, diff, markdown, regex, contador-caracteres,
   mock-data, escopo, xml) — dev-typescript → code-reviewer — 1 iteração de
   correção (nomes brasileiros em `mock-data` EN).
3. G003 — Lote 3 (5: Segurança & Codificação — senha, hash, jwt, uuid,
   base64) — dev-typescript → code-reviewer — aprovado sem bloqueadores.
4. G004 — Lote 4 (8: Web, Rede & Automação — cidr, cron, timestamp,
   fuso-horario, qrcode, meta-tags, gitignore, horas-trabalhadas) —
   dev-typescript → code-reviewer — 1 iteração de correção (formato de data
   BR em `fuso-horario`/`cron` EN).
5. G005 — Lote 5, último lote de ferramentas (4: Conversores & Design —
   conversor-case, base-numerica, cor, css-gradient) — dev-typescript →
   code-reviewer — 1 bloqueador real (hreflang incompleto, retrofit
   retroativo nos 36 arquivos pt-BR dos Lotes 1-5).
6. G006 — Integração final — orquestrador — validação de cobertura via
   script: `TRANSLATED_PATHS` (37) == slugs de `TOOLS` (37), 37 pastas em
   `en/tools/`, 74 páginas HTTP 200 via nginx local, `node --check js/main.js`
   limpo.

## Iterações
- **Iter (Lote 2)**: code-reviewer aprovou com ressalva — `js/tools-en/mock-data.js`
  gerava nomes brasileiros (João, Olívia, Araújo) na versão EN → corrigido
  para nomes/sobrenomes em inglês.
- **Iter (Lote 4)**: code-reviewer aprovou com ressalva — `fuso-horario`/`cron`
  EN exibiam data em DD/MM/YYYY (padrão BR) → corrigido para ISO
  YYYY-MM-DD, não-ambíguo internacionalmente.
- **Iter (Lote 5)**: code-reviewer encontrou bloqueador real — páginas pt-BR
  só ganhavam `hreflang="en"`, faltando a tag self-referencing
  `hreflang="pt-BR"` exigida pelo padrão (presente desde o piloto `json` da
  Fase A). Essa falha se repetia desde o Lote 1 mas tinha sido registrada só
  como sugestão não-bloqueadora nos reviews anteriores → em vez de corrigir
  só as 4 páginas do Lote 5, foi feita correção retroativa nas 36 páginas
  pt-BR (Lotes 1-5) de uma vez. Revalidado: 37/37 pastas `tools/` com
  hreflang bidirecional completo.
- Lote 2 também sofreu uma interrupção por limite de sessão da API no meio da
  implementação (não é erro de código) — retomado numa segunda rodada que
  revalidou tudo do zero e não achou arquivo truncado; não conta como
  iteração de correção.

## Pegadinhas / lições aprendidas
- Dado gerado/exibido por uma ferramenta (nomes de pessoa, formato de data)
  precisa ser revisado para fazer sentido para usuário internacional, não só
  ter a UI traduzida — 2 achados desse tipo (mock-data, fuso-horario/cron).
- O padrão de severidade do `code-reviewer` variou entre execuções — a mesma
  falha de hreflang foi "sugestão" em alguns lotes e "bloqueador" só no
  último. Vale, numa fase futura, deixar explícito no prompt do reviewer que
  falhas já conhecidas de lotes anteriores devem manter a mesma severidade,
  não ser reavaliadas do zero a cada rodada.
- Interrupção de sessão no meio de um lote não corrompeu nada: sempre
  revalidar do zero (nunca assumir que a rodada anterior terminou limpa) —
  mesma lição da Fase A, reconfirmada aqui.
- `qrcode` reusa `js/lib/qrcode-core.js` (motor puro, sem strings visíveis) —
  não precisa de cópia/tradução, só a página HTML e o wrapper JS.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: [[2026-07-25-traducao-ingles-fase-a-infra-piloto]]
  (infra + piloto). Próxima fase (G007+ no ultragoal, ainda sem flow): Fase C
  — Biblioteca (55 artigos), começando por infra (`BIBLIOTECA_CATEGORIES_EN`
  em `js/main.js` + decisão sobre o link "Library"), terminando em revisão
  final do site bilíngue completo (G015).
