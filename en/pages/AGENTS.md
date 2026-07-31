<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# en/pages/

## Purpose
Espelho em inglês de `../../pages/` — páginas institucionais (about, contact).
2 níveis abaixo da raiz (assets via `../../`, um nível a mais que
`../../pages/` em português por causa do prefixo `en/`).

## Key Files / Patterns

| Arquivo | Espelha | Conteúdo atual |
|---|---|---|
| `about.html` | `../../pages/sobre.html` | Placeholder — "This is the About page. Edit the content as needed." Inclui lib do AdSense + bloco `<ins>`, igual ao lado PT. |
| `contact.html` | `../../pages/contato.html` | Placeholder — "This is the Contact page. Edit the content as needed." Também **sem** AdSense, mesma inconsistência do lado PT (`pages/contato.html`) — os dois pares divergem de `sobre.html`/`about.html` da mesma forma. |

Mesmo esqueleto do site: `<html lang="en">`, `css/styles.css` via
`../../css/styles.css`, `hreflang` cruzado apontando de volta para
`../../pages/<arquivo-pt>.html`, `js/main.js` via `../../js/main.js`.

## Subdirectories
Nenhuma.

## For AI Agents

### Working In This Directory
- Trate `pages/` (português) como fonte: qualquer conteúdo real escrito lá
  precisa do par traduzido aqui na mesma tarefa — ver `pages/AGENTS.md` para
  o estado atual (ambos ainda placeholder).
- Ao resolver a inconsistência de AdSense entre `sobre.html`/`about.html`
  (com bloco) e `contato.html`/`contact.html` (sem bloco), replique a
  decisão nos dois idiomas ao mesmo tempo.

### Common Patterns
- Caminhos relativos `../../` (2 níveis, por causa do prefixo `en/`).
- `<html lang="en">`.

## Dependencies
- `css/styles.css`, `js/main.js` (raiz do projeto, compartilhados).
- Google Fonts + AdSense (quando presente).
