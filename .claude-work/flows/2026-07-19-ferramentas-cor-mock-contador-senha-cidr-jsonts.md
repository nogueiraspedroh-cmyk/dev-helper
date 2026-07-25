# Lote 4 — 6 ferramentas: Cor+WCAG, Mock JSON, Contador, Senha, CIDR, JSON→TS

- **Data:** 2026-07-19
- **Tags:** static-site, computacao, feat, lote-4
- **Status:** ✅ Concluído (validado em nginx local; container deixado no ar)

## Tarefa

Adicionar 6 ferramentas novas ao catálogo (ferramentas #26–#31), todas na
categoria *Computação & Produtividade*:

1. **Conversor de Cor + Contraste WCAG** (`tools/cor/`)
2. **Gerador de Dados Fake / Mock JSON** (`tools/mock-data/`)
3. **Contador de Caracteres / Palavras** (`tools/contador-caracteres/`)
4. **Gerador de Senha Forte** (`tools/gerador-senha/`)
5. **Calculadora de Subnet / CIDR** (`tools/cidr/`)
6. **JSON → Interface TypeScript** (`tools/json-para-typescript/`)

## Arquivos criados

- `tools/cor/index.html` + `js/tools/cor.js`
- `tools/mock-data/index.html` + `js/tools/mock-data.js`
- `tools/contador-caracteres/index.html` + `js/tools/contador-caracteres.js`
- `tools/gerador-senha/index.html` + `js/tools/gerador-senha.js`
- `tools/cidr/index.html` + `js/tools/cidr.js`
- `tools/json-para-typescript/index.html` + `js/tools/json-para-typescript.js`

## Arquivos editados (4 pontos de integração × 6)

- `index.html` — 6 cards `.tool-row` na categoria Computação & Produtividade.
- `js/main.js` — 6 entradas no array `TOOLS` (sidebar), com ícones SVG.
- `docs/ROADMAP.md` — linhas #26–#31 no backlog + categoria Computação §2.1.
- `css/styles.css` — bloco "LOTE 4" com classes reutilizáveis novas.
- Este flow + `.claude-work/flows/INDEX.md`.

## Ad-slots usados (todos placeholder `ca-pub-0000...`)

| Ferramenta | data-ad-slot |
|-----------|--------------|
| cor | 2828282828 |
| mock-data | 2929292929 |
| contador-caracteres | 3030303030 |
| gerador-senha | 3131313131 |
| cidr | 3232323232 |
| json-para-typescript | **3434343434** |

> ⚠️ **Colisão evitada:** `3333333333` já era usado por `tools/sql/`. A
> autorrevisão (checagem de unicidade de slot em todo o repo) pegou isso antes
> da entrega — json-para-typescript foi para `3434343434`. **Aprendizado:** a
> sequência de slots NÃO é livre só por ser "acima do último lote"; alguns
> tools antigos usam padrões repetidos (2222–9999). Sempre validar unicidade
> global com grep antes de fechar.

## Decisões de design / edge-cases

- **WCAG (cor):** luminância relativa sRGB→linear (`c<=0.03928 ? c/12.92 :
  ((c+0.055)/1.055)^2.4`), `L=0.2126R+0.7152G+0.0722B`, contraste
  `(L1+0.05)/(L2+0.05)`. Limiares: AA normal 4.5, AAA normal 7, AA grande 3,
  AAA grande 4.5. Razão exibida com 2 casas (`toFixed(2)`). Vetores conferidos:
  preto/branco = 21.00, `#777`/branco ≈ 4.48. HSL é inteiro → ida-e-volta
  RGB→HSL→RGB pode variar ±1 por canal (documentado no FAQ). Preview e badges
  aplicados via `element.style` + `result-validar--{valido,invalido}` (reuso),
  nunca innerHTML com dado do usuário.
- **Mock JSON:** geração 100% local (Math.random + `crypto.randomUUID` com
  fallback getRandomValues). E-mails no domínio `example.com` (RFC 2606) e sem
  acentos (`normalize("NFD")` + strip de combining marks). Limite de 1000
  registros. Faixa do inteiro normalizada (troca min/max se invertidos).
- **Contador:** caracteres contados por **code point** (`Array.from`) → emoji =
  1 caractere. Parágrafos = blocos separados por linha em branco; linhas por
  `\r\n|\r|\n`. Limites: X 280, meta description 160, title 60 (contam COM
  espaços). Saída sempre via `textContent`/`createElement`.
- **Senha forte:** `crypto.getRandomValues` com **rejeição de viés de módulo**
  (1 byte, limite = 256 - 256%max) + Fisher-Yates seguro; garante ≥1 char de
  cada conjunto ativo. Entropia = `len × log2(alfabeto)`; faixas Fraca<40,
  Média<60, Forte<128, Muito forte≥128. **Geração em lote** (até 100) — é o
  diferencial frente ao `tools/senha` já existente (ver nota de redundância).
  Reusa classes `senha-forca-*`.
- **CIDR:** aritmética com inteiros unsigned (`>>>0`). Aceita `IP/prefixo`,
  `IP máscara` (converte se contígua) ou IP só (prefixo do campo/hint, default
  24). **/31 = RFC 3021** (2 hosts utilizáveis, sem rede/broadcast reservados);
  **/32 = host único** (1 utilizável). Valida octetos 0–255, prefixo 0–32 e
  contiguidade da máscara (1s seguidos de 0s). Apenas IPv4.
- **JSON→TS:** `JSON.parse` (erro legível em entrada inválida). Objetos
  aninhados → interfaces próprias (PascalCase da chave); **dedup por forma**
  (objetos com mesmas chaves+tipos reusam 1 interface). Arrays → `T[]`;
  heterogêneos → `(A | B)[]`; array vazio → `unknown[]`. Chaves não-identificador
  entre aspas. **Bug pego na autorrevisão:** raiz-array tinha (a) duplicatas
  Row/Row2 para formas iguais e (b) colisão do nome do elemento com o type alias
  da raiz (TS auto-referente inválido). Corrigido reservando o nome da raiz
  ANTES de inferir elementos + dedup de forma. Opcionais fora de escopo.

## Validação

- `node --check` OK nos 6 JS novos + `js/main.js`.
- **Sanity via `require()`** (padrão UMD-lite) nos núcleos puros: WCAG
  (21.00 / 4.48), conversões de cor round-trip, mock (contagem/keys/uuid/range),
  contador (emoji/parágrafos/limites), senha (alfabeto/entropia/≥1-de-cada/erro),
  CIDR (/24, /31, /32, /0, máscara contígua e não-contígua, parse), JSON→TS
  (objeto/array/primitivo/inválido/dedup).
- **nginx local** (`docker compose up -d`): 6 páginas + assets = HTTP 200;
  rota inexistente = 404 servindo `error.html`.

## Nota de redundância — RESOLVIDA (pós-entrega, revisão do operador)

Já existia `tools/senha/` (gerador de senha, #6) com praticamente as mesmas
features (comprimento, conjuntos de caracteres, entropia, `crypto.getRandomValues`)
e ainda com um recurso a mais (excluir caracteres ambíguos) que `gerador-senha`
não tinha. Manter as duas confundiria o usuário no catálogo. Decisão: **remover
`tools/gerador-senha/` e `js/tools/gerador-senha.js`**, portando o único
diferencial real — **geração em lote** (campo "Quantidade", 1–50, textarea de
saída + botão "Copiar todas") — para `tools/senha/index.html` e
`js/tools/senha.js`. Ajustados também: `js/main.js` (removida a entrada
`gerador-senha` do array `TOOLS`), `index.html` (removido o card duplicado),
`docs/ROADMAP.md` (linha #29 marcada como "Absorvida"), `css/styles.css`
(removida a classe órfã `.gs-range`, reaproveitada `.senha-range-input`).
Ad-slot `3131313131` fica livre para uso futuro.

**Lição para o checklist de novas ferramentas:** antes de implementar uma
ferramenta sugerida em brainstorm, checar `ls tools/` por nomes/temas
semelhantes (ex.: "senha" vs "gerador-senha") — o brainstorm não tem visão do
catálogo já existente e pode reproduzir algo que já existe com outro slug.

## Limitação do ambiente de execução

Este lote foi implementado pelo orquestrador **diretamente via Bash** (heredocs +
`node --check` + `require()` de sanidade), porque o ambiente não expôs as skills
`dev-*`/`code-reviewer`/`Edit`/`Task`. Os checklists de dev e de code-review
foram aplicados como etapas discretas manuais (anti-XSS, defensividade `if(el)`,
caminhos `../../`, unicidade de ad-slot, pub-ID placeholder, casing minúsculo).
