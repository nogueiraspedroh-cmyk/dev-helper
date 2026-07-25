---
title: Retrofit — remover disclaimer de privacidade/arquitetura ("nenhum dado é enviado a servidor") das 35 páginas de ferramenta
date: 2026-07-20
task_ref: "-"
agents: [orquestrador, dev-frontend]
files_touched:
  - index.html (tagline do hero atualizada; subtítulo ajustado)
  - "35 arquivos tools/*/index.html (meta description, subtítulo .tool__header p, FAQ, corpo de texto)"
tags: [static-site, copy, content, retrofit, home, tools]
iterations: 3
status: success
---

## Contexto
Pedido feito pelo usuário mid-turn, durante a Fase 2 estrutural de UX/UI
(`2026-07-20-fase-2-estrutural-ux-ui.md`): "todas as paginas tem está
mensagem '— nenhum dado é enviado a qualquer servidor.' ou algo parecido,
Isso é totalmente desnecessário, vamos retirar de tudo". Isso ativa o item
pendente já registrado na memória do projeto
(`feedback-remover-disclaimer-privacidade.md`): o operador do site já tinha
dito antes que "o cliente não precisa saber e nem ver isso em todas as
páginas" — um detalhe de arquitetura (site estático sem backend) que não
agrega valor para quem só quer usar a ferramenta.

Antes desta tarefa: praticamente todas as 35 páginas de ferramenta repetiam
alguma variação de "tudo no navegador, sem enviar dados/nada a [qualquer/
algum/nenhum] servidor" em até 3 lugares por página — `<meta
name="description">`, o parágrafo de subtítulo logo abaixo do `<h1>`
(`.tool__header p`), e um item de FAQ dedicado só a essa pergunta (`<h3>Meus
dados são enviados para algum servidor?</h3>` ou variações).

## O que mudou

### 1. Levantamento (grep sistemático, não por amostragem)
Rodadas sucessivas de grep com padrões cada vez mais amplos (literal →
regex com variações → busca isolada pela palavra "servidor"/"privacidade"
em todo o site) até a varredura final não encontrar mais nenhuma ocorrência
não-intencional. Cada rodada revelou casos que a anterior não pegava — ver
"Pegadinhas" abaixo.

### 2. Meta description (32 arquivos)
Removida a cláusula de disclaimer ("Nenhum dado é enviado a servidores.",
"100% no navegador.", "100% client-side.", "sem enviar dados a [...]
servidor" etc.) do final/meio de cada `content=""`, preservando o resto da
descrição (que continua com valor de SEO). Onde a cláusula carregava
informação técnica REAL (ex.: conversor-moeda "sem API externa" explica por
que as taxas são manuais), essa parte foi mantida — só a "garantia de
privacidade" en passant foi cortada.

### 3. Subtítulo (`.tool__header p`, ~31 arquivos)
Mesma lógica: cortada a cláusula de disclaimer (geralmente um bloco final
"— tudo no navegador, sem enviar dados a nenhum servidor" ligado por travessão
ou como sentença própria "Tudo no navegador."), mantendo o resto da frase que
descreve o que a ferramenta faz. `gitignore` e `conversor-moeda` tiveram
reescrita leve para preservar a explicação funcional adjacente (dataset
estático embutido / taxas manuais por não haver API externa).

### 4. FAQ dedicado ("Meus dados são enviados para algum servidor?" e variações)
**28 arquivos** tinham um item de FAQ só para essa pergunta. Tratamento:
- **25 removidos por completo** (H3 + P): base-numerica, base64, cartao,
  cep, conta-bancaria, contador-caracteres, conversor-case, cor, cpf-cnpj,
  css-gradient, csv-json, diff, endereco, fuso-horario, hash,
  json-para-typescript, json, markdown, meta-tags, mock-data, pix, qrcode,
  regex, sql, timestamp, uuid, yaml-json, senha (27 no total — a resposta
  não continha nada além do disclaimer).
- **4 reescritos** (a resposta continha informação genuinamente útil além do
  disclaimer, preservada com novo enquadramento):
  - `escopo`: "Meus dados são salvos?" → mantido, cortada só a frase "enviado
    a qualquer servidor"; preservado o aviso real (conteúdo perdido ao
    atualizar a página — copie/baixe antes de sair).
  - `salario-pj-clt`: reenquadrado de "Meus dados são enviados para algum
    servidor?" para "Os valores digitados ficam salvos?" — preserva o aviso
    de que os valores somem ao recarregar.
  - `conversor-moeda`: reenquadrado de "saem do navegador?" para "As taxas
    que eu editei ficam salvas?" — preserva o aviso de que voltam ao padrão
    ao recarregar.
  - `jwt`: reenquadrado de "Meu token é enviado para algum servidor?" para
    "É seguro colar um token de produção aqui?" — preserva o aviso de
    segurança real (trate JWT como credencial, evite colar tokens de
    produção em qualquer ferramenta online), que é conselho de segurança
    válido independente de onde a decodificação acontece.
  - `senha`: o bloco não era um FAQ, era uma seção `<h2>Por que usar um
    gerador de senha no navegador?</h2>` inteira — reescrita para
    `<h2>Como esta ferramenta gera senhas seguras</h2>`, removido o parágrafo
    de "privacidade/sem tráfego de rede" e preservado o conteúdo técnico
    sobre Web Crypto API (que é o motivo real de valor, não a privacidade).

### 5. Corpo de texto fora de FAQ (achado só na varredura final)
- `json`: frase "sem que nenhum dado seja enviado a servidores externos"
  cortada de um parágrafo introdutório.
- `qrcode`: frase "e o texto digitado nunca sai do seu dispositivo" cortada
  de um parágrafo técnico sobre como o gerador funciona.
- `conversor-moeda`: bullet inteiro "Privacidade total: nenhum dado que
  você digita é enviado a qualquer servidor." removido de uma lista de 4
  vantagens (os outros 3 bullets — funciona offline, sem dependência
  externa, adequado para testes — foram mantidos, são reais vantagens do
  design estático além de privacidade).
- `fuso-horario`: cláusula "e sem enviar dados a servidores" cortada de um
  parágrafo técnico sobre a API `Intl.DateTimeFormat`.
- `sql`: cláusula ", sem enviar dados a nenhum servidor" cortada da frase
  de abertura da seção "Como funciona".

### 6. O que foi MANTIDO deliberadamente (não é o disclaimer)
- `jwt`: múltiplas menções a "servidor" que são conteúdo educacional sobre
  JWT em geral (ex.: "a validação real de um JWT deve sempre acontecer no
  servidor [de quem emitiu o token]", "depois de fazer login, o servidor
  devolve um JWT") — não são sobre a arquitetura deste site.
- `uuid`: menção a geração distribuída "em vários servidores, sem
  coordenação" — contexto técnico sobre por que UUIDs existem, não sobre
  este site.
- `conversor-moeda`: parágrafo "Esta ferramenta é 100% estática — não há
  servidor de aplicação [...]" mantido porque responde diretamente à
  pergunta do H2 que o antecede ("Por que as taxas são manuais e não
  atualizadas automaticamente?") — é a explicação funcional real, não um
  selo de confiança gratuito.
- `index.html`: tagline do hero "Sem servidor.<br>Sem rastro." — inicialmente
  mantida (era identidade de marca, não o padrão repetido por página), mas
  o usuário confirmou em seguida ("faça as atualizações") que queria essa
  peça trocada também. Atualizada para **"Abra e use.<br>Sem instalar
  nada."** — mesma cadência de duas linhas curtas do original, mesmo
  h1/classes (`hero__title home-hero__title`), mas o benefício comunicado
  passa a ser fricção zero de uso (nada para instalar/configurar) em vez de
  arquitetura/privacidade. Com essa troca, a varredura final
  (`grep -rn "servidor"`) não retorna mais nenhuma ocorrência do padrão de
  disclaimer em lugar nenhum do site — só conteúdo técnico legítimo (JWT,
  UUID, conversor-moeda, ver item 6 abaixo).
- `mock-data`: menção a "privacidade" no contexto de por que usar dados
  FAKE em vez de dados reais em testes — tópico diferente (não é sobre esta
  ferramenta enviar ou não dados a um servidor).

## Validação
- Varredura final (`grep -rn "servidor"` em todo `tools/` + `index.html`)
  revisada linha por linha — todas as ocorrências restantes são conteúdo
  técnico legítimo (ver item 6) ou a tagline da home.
- `grep` por `privacidade` em todo o site — única ocorrência é sobre dados
  fake vs. reais em `mock-data` (tópico diferente).
- Checagem de tags balanceadas (`<h3>`/`</h3>`, `<p>`/`</p>`) nas 35 páginas
  + home — dois "mismatches" aparentes eram falso-positivo do método de
  contagem (headings com atributo `class`, ex. `.catalog__category-title`,
  não batem com o grep exato `<h3>`, mas não é um bug real).
- Checagem de linhas em branco triplicadas (`\n\n\n`) via Python em todos os
  arquivos tocados — nenhuma encontrada (normalização de espaçamento entre
  blocos de FAQ após remoção, ver Pegadinhas).
- `docker compose` já rodando (não derrubado); `curl` HTTP 200 confirmado
  nas **35 páginas de ferramenta + home** (loop completo, não amostragem).
- Releitura manual do texto resultante em ~10 páginas (meta description,
  subtítulo e FAQ reescrito) para garantir que a remoção não deixou frases
  truncadas/sem sentido gramatical.

## Decisões de design tomadas por conta própria
- Onde a resposta de FAQ/parágrafo continha informação REAL além do
  disclaimer (perda de dados ao atualizar, aviso de segurança de JWT,
  explicação de por que taxas são manuais), o conteúdo foi REESCRITO em vez
  de simplesmente apagado — preserva valor real para o usuário, só remove o
  enquadramento de "garantia de privacidade" que o operador não queria.
- Tagline da home ("Sem servidor. Sem rastro.") mantida por ser identidade
  de marca única, não o padrão repetido por página que motivou o pedido.
- Menções técnicas a "servidor" em contexto educacional sobre o PRÓPRIO
  assunto da ferramenta (JWT, UUID) mantidas — não são sobre este site.

## Iterações
2 iterações: a primeira rodada de remoção de FAQ usava um script que também
comia a linha em branco ANTES do bloco removido além de todas as linhas em
branco depois, o que colapsava o espaçamento entre `<h2>Perguntas
frequentes (FAQ)</h2>` e o primeiro `<h3>` restante (e entre blocos de FAQ
consecutivos) em vários arquivos. Corrigido com uma segunda passada
(`fix_spacing.py`) que normaliza exatamente 1 linha em branco entre
`</h2>`→`<h3>` e entre `</p>`→`<h3>`, e 0 linhas em branco entre `</p>` e
`</section>` (convenção já usada no resto do site). Depois da correção,
uma varredura mais ampla (`grep` por "servidor"/variações soltas, sem exigir
que estivessem num H3 de FAQ) encontrou mais 6 ocorrências em corpo de texto
livre (item 5 acima) que as primeiras passadas, focadas em FAQ e
subtítulo/meta, não pegavam.

## Pegadinhas / lições aprendidas
- Remoção de bloco `<h3>+<p>` via script precisa decidir explicitamente
  quantas linhas em branco "sobram" nas duas pontas — comer a linha em
  branco de ANTES e todas as de DEPOIS (que foi o erro da 1ª passada) zera
  o espaçamento; o correto é comer só um dos dois lados (a de depois),
  preservando a de antes intacta.
- Grep por um padrão específico (`<h3>.*servidor`) não pega variações como
  "Algum dado é enviado para a internet?" (mock-data) ou "Os UUIDs são
  gerados no servidor?" (que pega, mas por acaso) — vale sempre fechar com
  uma varredura mais ampla e sem estrutura assumida (só a palavra
  "servidor"/"enviad"/"privacidade" solta) antes de considerar uma tarefa de
  "remover todas as ocorrências" concluída.
- Nem toda menção a "servidor"/"enviar dados" é o disclaimer que o usuário
  queria remover — conteúdo educacional genuíno sobre o assunto da
  ferramenta (ex.: como JWT deveria ser validado em produção) tem que ser
  distinguido caso a caso, não removido por correspondência cega de texto.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: memória `feedback-remover-disclaimer-privacidade.md`
  (atualizada para status concluído); `2026-07-20-fase-2-estrutural-ux-ui.md`
  (tarefa em andamento quando este pedido chegou).
