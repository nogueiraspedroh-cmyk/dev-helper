# Fluxo — 5 ferramentas novas (CSV↔JSON, YAML↔JSON, .gitignore, CSS Gradient, Base Numérica)

- **Data:** 2026-07-19
- **Tags:** static-site, computacao, produtividade, feat
- **Status:** ✅ Concluído
- **Categorias:** Computação (4) + Produtividade (1)

## Tarefa

Adicionar 5 ferramentas ao catálogo seguindo o "Apêndice — checklist de nova
ferramenta" do `docs/ROADMAP.md`: Conversor CSV↔JSON, Conversor YAML↔JSON,
Gerador de .gitignore, CSS Gradient Generator e Conversor de Base Numérica.
Todas 100% client-side, padrão UMD-lite, anti-XSS, texto explicativo + FAQ.

## Nota de ambiente

O orquestrador rodou com apenas `Read` + `Bash` (sem `Skill`/`Agent`/`Edit`).
Seguiu-se o fallback documentado: implementação in-context via Bash aplicando os
prompts das skills `dev-typescript`/`code-reviewer` e o checklist do ROADMAP,
com o code review executado como etapa própria (read-only). Limitação declarada.

## Arquivos por ferramenta

| Ferramenta | Slug | HTML | JS | Ad-slot | Categoria |
|-----------|------|------|----|---------|-----------|
| Conversor CSV ↔ JSON | `csv-json` | `tools/csv-json/index.html` | `js/tools/csv-json.js` | 2323232323 | Computação |
| Conversor YAML ↔ JSON | `yaml-json` | `tools/yaml-json/index.html` | `js/tools/yaml-json.js` | 2424242424 | Computação |
| Gerador de .gitignore | `gitignore` | `tools/gitignore/index.html` | `js/tools/gitignore.js` | 2525252525 | Produtividade |
| CSS Gradient Generator | `css-gradient` | `tools/css-gradient/index.html` | `js/tools/css-gradient.js` | 2626262626 | Computação |
| Conversor de Base Numérica | `base-numerica` | `tools/base-numerica/index.html` | `js/tools/base-numerica.js` | 2727272727 | Computação |

### Arquivos compartilhados alterados

- `index.html` — 5 cards `.tool-row` no bloco "Computação & Produtividade".
- `js/main.js` — 5 entradas no array `TOOLS` (registro da sidebar); lógica **não** foi para cá.
- `css/styles.css` — aditivo: `.tool__hint`, `.tool__checkbox-grid` e bloco `.cg-*`
  (stops + preview do gradiente; exceção de CSS por ferramenta conforme ROADMAP §1.3(c)).
- `docs/ROADMAP.md` — backlog #21–#25 e categorias 2.1 (Computação/Produtividade).

## Decisões de produto/técnicas

### Escopo do parser YAML (decisão central)
Parser/serializer **simplificado, escrito à mão, sem lib**. **Suportado:** mapas,
listas, aninhamento por indentação (espaços), escalares string/número/bool/null,
aspas simples/duplas com escapes básicos, comentários `#`, forma compacta
`- chave: valor`, coleções vazias `[]`/`{}`. **Fora de escopo** (documentado na
página e no FAQ): âncoras/aliases (`&`/`*`), tags (`!!`), multi-documento, blocos
literais/dobrados (`|`/`>`), fluxo inline não-vazio (`[a,b]`/`{a:1}`), tabs na
indentação. Entrada não suportada gera erro legível (não resultado silenciosamente
errado). O truque central do parser de lista de objetos compacta: ao encontrar
`- chave: valor`, a linha é reescrita in-place com indentação = coluna do texto
após o traço, e delegada a `parseMap`, o que faz o round-trip JSON→YAML→JSON bater.

### Dataset do .gitignore
**Estático embutido no JS** (sem API do GitHub → mantém o site sem backend, offline).
15 blocos: Node, Python, Java, Go, PHP, Ruby, Rust, .NET, React, Angular, VS Code,
JetBrains, macOS, Windows, Linux. Blocos combinados na **ordem do dataset** (não na
ordem de seleção), cada um com cabeçalho `# Label`. Copiar + baixar `.gitignore`
(via Blob/`URL.createObjectURL`).

### CSV↔JSON
Parser RFC 4180 básico (aspas, escape `""`, delimitador/quebra dentro de campo
citado). Delimitador configurável (`,`/`;`/tab), cabeçalho togglável, detecção
automática de direção (entrada começando com `{`/`[` → JSON→CSV). **Valores mantidos
como texto** (não coeridos a número) para round-trip CSV→JSON→CSV estável e evitar
perda de zeros à esquerda / precisão. JSON→CSV faz **união de chaves** preservando
ordem de aparição.

### CSS Gradient — anti-XSS por construção
Cor via `<input type="color">` (hexadecimal sempre válido) + posição via `number`
clampada 0–100; ângulo clampado/normalizado 0–359. O valor é montado só com tokens
validados e aplicado via `element.style.background` — nunca texto livre em
`innerHTML`/CSS. `sanitizeColor` aceita apenas `#rgb`/`#rgba`/`#rrggbb`/`#rrggbbaa`
(3-dígitos preservado, é CSS válido) e cai para `#000000` se inválido.

### Base numérica
`BigInt` para inteiros grandes sem perda; parse manual por base (2/8/10/16) com
validação de dígito e mensagem legível; 4 campos vivos (editar um recalcula os
outros); tolera `_`/espaço como separadores e sinal negativo.

## Validação

- `node --check` nos 5 JS: OK.
- **Sanidade Node da lógica core (32 asserts, todos passaram):** round-trip
  CSV→JSON→CSV; CSV com aspas/escape/quebra citada; delimitadores; CSV malformado→erro;
  YAML map/lista/aninhado/lista-de-objetos-compacta/null/comentário/`[]`/`{}`; YAML tab→erro;
  YAML inline→erro; round-trip JSON→YAML→JSON; string-que-parece-número citada;
  .gitignore combina blocos na ordem do dataset com cabeçalho; base conversão de valores
  conhecidos (255↔ff↔377↔11111111) e número grande (30 dígitos) via BigInt sem perda;
  gradiente linear/radial + sanitização de cor maliciosa + clamp de posição/ângulo.
  (2 asserts do gradiente estavam com expectativa errada — `#fff` é hex válido e é
  preservado; comportamento da ferramenta correto.)
- **nginx local (Docker):** home + 5 páginas + assets = HTTP 200; rota inexistente →
  404 servindo `error.html`; wiring por página (js próprio + main.js + styles via
  `../../`, ad-slot presente, sem caminho absoluto); home lista os 5 cards. **Container
  deixado no ar** (`docker compose up -d`) para inspeção manual.

## Code review (read-only)

Sem bloqueadores. Verificado: `innerHTML` só em comentários (uso real via
`textContent`/`createElement`/`.value`); zero caminhos absolutos; UMD-lite nos 5;
ad-slots novos sem colisão; AdSense lib 1x/página; sem `console.*`/`debugger`
residual; slugs/arquivos minúsculos; `js/main.js` só recebeu o registro do array
`TOOLS` (lógica isolada em `js/tools/*`).

## Iterações

- Iteração 1: implementação + sanidade + nginx + review passaram sem falha funcional.
  Ajustes de suporte só de CSS (classes aditivas `.tool__hint`, `.tool__checkbox-grid`,
  `.cg-*` que ainda não existiam).

## Pendências

- `pub-ID`/`data-ad-slot` seguem placeholder (não publicado — checklist AdSense de
  `DEPLOY.md` não se aplica nesta tarefa).
- Melhorias opcionais futuras (não-bloqueadoras): botão "copiar" por campo no conversor
  de base; opção de coerção de tipos no CSV→JSON; suporte a mais blocos no .gitignore.
