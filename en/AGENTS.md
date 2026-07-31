<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# en/

## Purpose
Espelho completo do site em **inglês**: mesma árvore de diretórios, mesmos
slugs e mesma estrutura de página que a raiz do projeto, apenas com `lang="en"`
e conteúdo/copy traduzidos. Existe porque o produto (ferramentas + biblioteca)
tem alcance internacional; a decisão foi replicar a árvore 1:1 em vez de
internacionalizar via query string ou build (o site não tem build).

Cobre as três frentes do site principal:
- `en/biblioteca/` — espelho de `../biblioteca/` (~55 artigos).
- `en/tools/` — espelho de `../tools/` (~37 ferramentas).
- `en/pages/` — espelho de `../pages/` (about, contact).
- `en/index.html` — espelho da home/catálogo.

## Key Files / Patterns

- **Relação 1:1 com PT**: todo diretório/arquivo em `en/<x>` corresponde
  exatamente a `<x>` na raiz, mesmo slug (ex.: `en/tools/json/` ↔
  `tools/json/`, `en/biblioteca/mvc/` ↔ `biblioteca/mvc/`). Não invente slugs
  diferentes em inglês — a correspondência 1:1 é o que permite o `hreflang`
  cruzado funcionar sem lógica extra.
- **Profundidade de caminho**: como `en/` adiciona **um nível a mais** que a
  raiz, os caminhos relativos para assets compartilhados também ganham um
  `../` a mais. Ex.: `en/tools/json/index.html` está 3 níveis abaixo da raiz
  → `../../../css/styles.css`, `../../../js/main.js` (vs. `../../` nas
  ferramentas em português). Confira sempre a profundidade real antes de
  copiar um caminho de uma página em português.
- **`hreflang` cruzado obrigatório** em todo par de páginas: a página PT
  aponta `<link rel="alternate" hreflang="en" href=".../en/...">` e a página
  EN aponta de volta `hreflang="pt-BR"`. Ver exemplos em qualquer
  `tools/<slug>/index.html` / `en/tools/<slug>/index.html`.
- **Scripts JS próprios**: as páginas em `en/tools/<slug>/` carregam
  `../../../js/tools-en/<slug>.js` (não `js/tools/<slug>.js`) — arquivo
  irmão com strings em inglês. Ver `js/AGENTS.md`.
- `js/main.js` (compartilhado, carregado também pelas páginas em `en/`)
  detecta automaticamente se o path pertence à árvore `/en/` (função
  `isEnglishPath`) para renderizar a sidebar de navegação e outros textos de
  UI injetados via JS (`UI_STRINGS.en` vs `UI_STRINGS.pt`) no idioma correto
  — não é necessário (nem deve ser feito) configurar isso manualmente por
  página.

## Subdirectories

| Diretório | AGENTS.md | Espelha |
|---|---|---|
| `biblioteca/` | [biblioteca/AGENTS.md](biblioteca/AGENTS.md) | `../biblioteca/` |
| `tools/` | [tools/AGENTS.md](tools/AGENTS.md) | `../tools/` |
| `pages/` | [pages/AGENTS.md](pages/AGENTS.md) (opcional/curto — ver nota) | `../pages/` |

## For AI Agents

### Working In This Directory
- Nunca crie conteúdo novo primeiro em `en/` — a versão em português é a
  fonte; toda mudança de conteúdo/estrutura entra primeiro em PT e depois é
  traduzida/replicada aqui na mesma tarefa (ou como follow-up rastreado).
- Ferramenta ou artigo novo: **não está completo** enquanto a página
  equivalente em `en/` não existir com o mesmo slug e o `hreflang` cruzado
  nos dois sentidos.
- Ao mover/renomear um slug em PT, replique a mudança aqui — o `hreflang` e
  os links da home/catálogo quebram silenciosamente se os dois lados
  divergirem.

### Common Patterns
- Mesmo CSS (`css/styles.css`) e mesmo `js/main.js` globais que o site em
  português — **não** existe `css/styles.css` nem `main.js` duplicado dentro
  de `en/`. Só os scripts de ferramenta (`js/tools-en/`) são específicos do
  idioma.
- `<html lang="en">` em toda página desta árvore (vs. `lang="pt-BR"` fora
  dela).

## Dependencies
- `css/styles.css`, `js/main.js`, `js/biblioteca.js` (raiz do projeto,
  compartilhados).
- `js/tools-en/<slug>.js` — específico desta árvore (ver `js/AGENTS.md`).
- Mesmas dependências externas do site em português (Google Fonts, AdSense).
