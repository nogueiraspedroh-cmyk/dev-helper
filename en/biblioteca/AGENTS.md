<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# en/biblioteca/

## Purpose
Espelho em inglês de `../../biblioteca/` — os mesmos ~55 artigos sobre Design
Patterns (GoF), arquiteturas de software e system design, com título,
descrição e corpo do artigo traduzidos para inglês (`lang="en"`). Mesma
função de conteúdo real para SEO/AdSense, agora para o público
anglófono.

**Estado da tradução**: verificado por contagem de subpastas e por comparação
de tamanho de arquivo — `biblioteca/` e `en/biblioteca/` têm **56 entradas
cada** (55 artigos + `index.html`), mesmos slugs em ambos os lados, e nenhum
artigo em inglês ficou com menos de 60% do tamanho em bytes do artigo em
português (amostragem completa dos 55 pares). Isso indica **tradução
completa**, não placeholder/stub — não é o caso de "traduzir os que
faltam", e sim de manter os pares em sincronia ao editar conteúdo em PT.

## Key Files / Patterns
Mesmo template de `biblioteca/AGENTS.md`, adaptado à profundidade extra de
`en/` (3 níveis abaixo da raiz em vez de 2):

- Assets compartilhados via `../../../` (`css/styles.css`, `js/main.js`,
  `favicon.svg`, `index.html` da raiz).
- `<link rel="alternate" hreflang="pt-BR" href="../../../biblioteca/<slug>/">`
  no `<head>`, apontando de volta para o artigo em português.
- Mesmas classes BEM-ish (`.artigo`, `.artigo__secao`, `.code-tabs`, etc.) —
  vêm do `css/styles.css` único, não há CSS específico desta árvore.
- Scripts no fim do `<body>`: `../../../js/main.js` +
  `../../../js/biblioteca.js` (os mesmos arquivos compartilhados usados pela
  biblioteca em português — não há `biblioteca-en.js`).

## Subdirectories
Nenhum `AGENTS.md` filho — os ~55 diretórios `en/biblioteca/<slug>/` são
folhas estruturalmente idênticas (um `index.html` cada). Mesmas categorias de
`biblioteca/AGENTS.md` (Padrões de Criação/Estruturais/Comportamentais GoF,
Arquiteturas, Estruturas de Projeto, System Design), com títulos em inglês.

## For AI Agents

### Working In This Directory
- Um artigo novo em `biblioteca/<slug>/` só está pronto quando o par em
  `en/biblioteca/<slug>/` existir com o mesmo slug, o `hreflang` cruzado nos
  dois sentidos e o conteúdo efetivamente traduzido (não copiado em
  português) — ver checklist de nova ferramenta/artigo em memória do
  projeto.
- Ao editar um artigo em português (correção técnica, novo diagrama SVG
  etc.), verifique se a mudança também se aplica ao par em inglês; divergir
  silenciosamente os dois lados é o principal risco de manutenção desta
  árvore.
- Diagramas SVG inline (artigos System Design L7+) devem ser replicados aqui
  também — mesmo SVG, apenas labels/texto traduzidos quando o diagrama tiver
  texto.

### Common Patterns
- `<html lang="en">`.
- Mesma tokenização de nome de arquivo (slug idêntico ao português) — nunca
  traduza o slug do diretório, só o conteúdo da página.

## Dependencies
- `css/styles.css`, `js/main.js`, `js/biblioteca.js` (raiz do projeto,
  compartilhados com a versão em português — ver `js/AGENTS.md`).
- Google Fonts + AdSense (mesmas libs do resto do site).
