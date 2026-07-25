---
title: Quick wins da auditoria de UX/UI (favicon, flashButton global, a11y de erros, botões, chips da home)
date: 2026-07-20
task_ref: "-"
agents: [orquestrador, dev-frontend]
files_touched:
  - favicon.svg (novo)
  - "95 arquivos *.html (link de favicon no <head>)"
  - js/main.js (nova função global window.DevHelper.flashButton)
  - "24 arquivos js/tools/*.js (remoção da implementação local de flash/flashButton)"
  - "22 arquivos tools/*/index.html (role=\"alert\" em 23 ocorrências de .error-msg)"
  - "3 arquivos tools/*/index.html (button--secondary redundante)"
  - index.html (chips do hero)
tags: [static-site, quick-win, a11y, refactor, home]
iterations: 1
status: success
---

## Contexto
Segunda leva de ações da auditoria de UX/UI (35 ferramentas + Biblioteca de 55
artigos): os 5 "quick wins" de baixo risco/alto impacto, sem decisão de design
pendente. Fase estrutural (home, categorização, sidebar, destaque visual do
card de ferramenta) fica para depois, à parte, para não conflitar com esta.

## O que mudou

### 1. Favicon ausente (95 arquivos HTML)
- Criado `favicon.svg` na raiz: quadrado arredondado `--ink` (#12161d) com um
  glifo `>` em `--primary` (#4f46e5) e um cursor/traço em `--signal`
  (#10b981) — reaproveita a mesma identidade "prompt de terminal" já usada em
  `.hero__prompt::before` (`"> "` em `--primary` sobre fundo `--ink`) e o
  verde exclusivo de "chrome de código" (`--signal`). Simples o bastante para
  não perder legibilidade em 16×16.
- `<link rel="icon" type="image/svg+xml" href="...">` inserido logo após o
  `<link rel="stylesheet" href="...css/styles.css">` no `<head>` de **todos**
  os 95 HTML do site (raiz, `pages/`, `tools/<slug>/`, `biblioteca/` e
  `biblioteca/<slug>/`), via script Python que calculou o prefixo relativo
  (`""`, `"../"`, `"../../"`) a partir do próprio prefixo já usado no link do
  CSS na mesma linha — não precisou reimplementar o cálculo de profundidade.
- Não foi criado `favicon.ico`/PNG fallback: todos os navegadores relevantes
  hoje suportam `rel="icon" type="image/svg+xml"`; manter um único arquivo
  SVG evita depender de ferramenta de conversão de imagem fora do ambiente.

### 2. `flashButton`/`flash` duplicado em 24 `js/tools/<slug>.js`
- Nova função global em `js/main.js`: `window.DevHelper.flashButton(btn,
  label, duration)`. Escolhida a variante mais robusta entre as 24
  implementações encontradas (a de `escopo.js`): ignora reentrada
  (`if (!btn || btn.disabled) return`) e guarda o label original em
  `data-label-original` (sobrevive a chamadas concorrentes). `duration` é
  opcional, padrão `1500` — preserva o valor usado por 22 das 24 chamadas.
  `meta-tags.js` e `pix.js` usavam 1200ms; as chamadas desses dois arquivos
  passam `1200` explicitamente como terceiro argumento para não mudar
  comportamento.
- Confirmado que `js/main.js` é sempre carregado **antes** de
  `js/tools/<slug>.js` em toda página de ferramenta (nenhuma exceção
  encontrada) — não foi preciso reordenar `<script>`.
- Nos 24 arquivos, a função local (`function flash(...)` ou `function
  flashButton(...)`) foi removida, junto com o JSDoc órfão que a descrevia, e
  todas as chamadas passaram a usar `window.DevHelper.flashButton(...)`.
  Onde havia rótulos diferentes de "Copiado!" (`escopo.js`: "Baixando...";
  `conversor-moeda.js`: "Restaurado!") o comportamento foi preservado —
  só a implementação mudou de local para global.

Arquivos tocados no item 2 (24 + `js/main.js`):
`gitignore.js, css-gradient.js, cep.js, meta-tags.js, base64.js, csv-json.js,
mock-data.js, hash.js, endereco.js, escopo.js, conta-bancaria.js,
conversor-moeda.js, cpf-cnpj.js, senha.js, yaml-json.js, conversor-case.js,
json-para-typescript.js, json.js, sql.js, timestamp.js, cartao.js, jwt.js,
pix.js, uuid.js`.

### 3. Mensagens de erro sem anúncio a leitor de tela
- `role="alert"` adicionado em todas as 23 ocorrências de
  `class="error-msg"` (22 arquivos `tools/*/index.html`; `timestamp/index.html`
  tem duas, uma por lado da conversão). Escolhido `role="alert"` (assertivo)
  em vez de `aria-live="polite"` porque são mensagens de **erro de
  validação** disparadas por ação direta do usuário (clique/input) — o padrão
  ARIA recomenda `alert` para esse caso, e já existe um precedente de
  `aria-live="polite"` no site para status não-crítico (`#home-busca-vazio`,
  em `index.html`), então os dois papéis convivem com semântica distinta.
  Nenhum JS foi alterado — é só atributo estático no HTML.

### 4. `.button--secondary` combinado redundantemente com `.button`
- Lido `css/styles.css`: `.button--secondary` define sozinho `display,
  align-items, gap, background, color, border, border-radius, padding,
  font-size, font-weight, font-family, cursor, transition, line-height` — não
  estende `.button` (não há `@extend`/composição, é CSS puro). Os valores de
  padding/font-size/border inclusive **diferem** dos de `.button` (botão
  secundário é mais compacto). Combinar as duas classes funcionava por
  acidente de ordem de declaração no stylesheet (`.button--secondary` vem
  depois de `.button`, mesma especificidade, então suas propriedades
  sobrescreviam as de `.button` nos poucos casos onde havia colisão) — frágil
  e não é o padrão do resto do site.
- Corrigidas as 3 ocorrências de `class="button button--secondary"` para
  `class="button--secondary"`, alinhando com as outras 24 ocorrências já
  existentes: `tools/meta-tags/index.html`, `tools/pix/index.html`,
  `tools/fuso-horario/index.html`.

### 5. Chips do hero da home (`index.html`)
- Trocados 3 dos 5 chips (mantidos 2 clássicos como âncora de identidade):
  `SQL`, `Senha`, `CEP` → `JWT`, `UUID`, `PIX`.
- Seleção final: **CPF/CNPJ** (clássica, identidade BR do site), **JSON**
  (clássica, uso universal), **JWT** (nova, alta demanda entre devs web),
  **UUID** (nova, ferramenta de geração pura, uso muito frequente),
  **PIX Copia e Cola** (nova, vitrine de uma ferramenta mais elaborada —
  gera BR Code + QR Code). Mistura documentos/financeiro/computação e
  clássicas/recentes, mais representativa do catálogo atual de 35
  ferramentas do que os 5 originais (todos antigos).

## Decisões de design tomadas por conta própria
- Aparência do favicon: quadrado `--ink` + glifo `>` `--primary` + cursor
  `--signal`, reaproveitando tokens e o motivo visual de terminal já
  presentes em `.hero__prompt` — nenhuma cor nova introduzida.
- Nome da função global: `window.DevHelper.flashButton` (namespace
  `DevHelper` por ser o nome do produto; `flashButton` por já ser o nome mais
  usado nas 24 implementações originais — só 6 usavam `flash`).
- `role="alert"` como padrão único para `.error-msg` em vez de
  `aria-live="polite"`, por ser mensagem de erro de validação (ver item 3).
- Escolha dos 5 chips da home (ver item 5).

## Validação
- `node --check` em `js/main.js` e nos 24 `js/tools/*.js` tocados → todos OK.
- `grep -rl 'rel="icon"' --include="*.html" .` → 95 de 95 arquivos HTML do
  site têm a tag (confirmado por `comm` contra a lista total de `find -name
  "*.html"`, sem diferença).
- `grep -rn "function flash"` em `js/tools/*.js` → nenhuma ocorrência
  (nenhuma implementação local restante).
- `grep -rn "[^.]flashButton(\|[^.]flash("` em `js/tools/*.js` (excluindo
  `window.DevHelper.flashButton`) → nenhuma ocorrência (nenhuma chamada
  "solta" restante).
- `grep -rn 'class="error-msg"'` em `tools/*/index.html` → todas as 23
  ocorrências têm `role="alert"`.
- `grep -rn 'class="button button--secondary"'` → 0 ocorrências restantes;
  `class="button--secondary"` isolada → 27 ocorrências (24 originais + 3
  corrigidas).
- `docker compose ps` → container já estava em pé; `curl -o /dev/null -w
  "%{http_code}"` para `/`, `/favicon.svg`, `/tools/cep/`, `/tools/pix/`,
  `/tools/uuid/`, `/tools/meta-tags/`, `/tools/senha/`, `/tools/escopo/`,
  `/biblioteca/`, `/biblioteca/singleton/`, `/pages/sobre.html` → todos HTTP
  200. Container **não** foi derrubado.
- Leitura de código confirmando o fluxo de "Copiar" em 3 ferramentas de
  gerações diferentes: `cpf-cnpj.js` (antiga) → `copiarTexto` →
  `window.DevHelper.flashButton(btn, "Copiado!")`; `hash.js` (meio) → mesmo
  padrão; `pix.js` (recente) → `copyText` →
  `window.DevHelper.flashButton(btn, "Copiado!", 1200)`. Todos os três
  chamam a função global corretamente, com `main.js` carregado antes do
  script da ferramenta em cada página.

## Iterações
Iteração única — todas as validações passaram de primeira. Um ajuste manual
extra (não pedido explicitamente, mas necessário): remoção de blocos de
comentário JSDoc órfãos ("Muda temporariamente o texto de um botão...") que
sobraram em 9 arquivos após a extração automática da função, e normalização
de linhas em branco duplicadas em 3 arquivos (`css-gradient.js`,
`csv-json.js`, `yaml-json.js`) deixadas pela remoção do bloco de função.

## Pegadinhas / lições aprendidas
- Duas das 24 implementações de flash (`meta-tags.js`, `pix.js`) usavam
  1200ms em vez do padrão 1500ms — não dava para fazer um find/replace cego
  de `flashButton(` → `window.DevHelper.flashButton(`; foi preciso tratar
  esses dois arquivos à parte, passando `1200` como terceiro argumento.
- A extração automática via regex (encontrar `function flash(...){...}` e
  remover o bloco inteiro) deixou comentários JSDoc órfãos acima da função em
  9 arquivos — precisou de uma segunda passada para limpar.
- `.button--secondary` não estender `.button` só não quebrava porque a ordem
  de declaração no CSS "salvava" o resultado visual — vale reforçar em code
  review que classes de botão não devem ser combinadas sem checar o CSS
  primeiro.

## Referências
- Commits: pendente
- PR/MR: -
- Documentos relacionados: auditoria de UX/UI (fase estrutural pendente —
  home, categorização, sidebar, destaque visual do card de ferramenta).
