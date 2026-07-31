<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# en/tools/

## Purpose
Espelho em inglês de `../../tools/` — as mesmas ~37 ferramentas para
desenvolvedores, com HTML traduzido (`lang="en"`) e lógica JS própria. Mesma
função de produto, público anglófono.

## Key Files / Patterns
Mesmo template de `tools/AGENTS.md`, adaptado à profundidade extra de `en/`
(3 níveis abaixo da raiz em vez de 2):

- Assets compartilhados via `../../../` (`css/styles.css`, `js/main.js`,
  `favicon.svg`, `index.html` da raiz).
- `<link rel="alternate" hreflang="pt-BR" href="../../../tools/<slug>/">` no
  `<head>`, apontando de volta para a ferramenta em português.
- Mesmas classes `.tool*` do `css/styles.css` único — sem CSS específico
  desta árvore.
- Scripts no fim do `<body>`: `../../../js/main.js` (global, compartilhado)
  **e** `../../../js/tools-en/<slug>.js` — script **próprio desta árvore**,
  com strings de UI em inglês (rótulos de botão, mensagens de erro,
  placeholders). Não reaproveita `js/tools/<slug>.js` diretamente porque a
  lógica de cada ferramenta mistura cálculo com strings voltadas ao usuário.

## Subdirectories
Nenhum `AGENTS.md` filho — os ~37 diretórios `en/tools/<slug>/` são folhas
estruturalmente idênticas. Mesmas categorias de `tools/AGENTS.md`
(Documentos & Localização, Financeiro, Texto & Dados, Segurança &
Codificação, Web/Rede & Automação, Conversores & Design), com nomes de UI em
inglês.

## For AI Agents

### Working In This Directory
- Uma ferramenta nova em `tools/<slug>/` só está completa quando o par em
  `en/tools/<slug>/` existir com o mesmo slug, `hreflang` cruzado e um
  `js/tools-en/<slug>.js` próprio (não um symlink/cópia do script em
  português) traduzindo toda string voltada ao usuário.
- Ao corrigir um bug de **lógica** (cálculo, validação, parsing) em
  `js/tools/<slug>.js`, replique a correção em `js/tools-en/<slug>.js` — os
  dois arquivos têm a mesma lógica de negócio, só as strings mudam. Divergir
  os dois é o principal risco de regressão silenciosa nesta árvore (o bug é
  corrigido em um idioma e continua no outro).

### Common Patterns
- `<html lang="en">`.
- Mesmo slug de diretório que a versão em português — nunca traduza o nome
  da pasta.

## Dependencies
- `css/styles.css`, `js/main.js` (raiz do projeto, compartilhados).
- `js/tools-en/<slug>.js` — específico desta árvore (ver `js/AGENTS.md`).
- `js/lib/qrcode-core.js` — compartilhado com a versão em português quando
  aplicável (ex.: `qrcode`, `pix`).
- Google Fonts + AdSense (mesmas libs do resto do site).
