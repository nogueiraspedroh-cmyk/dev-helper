# Biblioteca — Fase 1 (fundação + Singleton)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Tipo:** nova seção de **conteúdo educacional** (Design Patterns), não-ferramenta.

## Demanda

Criar uma biblioteca de conteúdo (design patterns, arquiteturas, estruturas) com
exemplos. Decisões com o usuário: começar por **Design Patterns (GoF)**; exemplos em
**múltiplas linguagens** (abas **TypeScript + PHP**); **seção própria** em `/biblioteca/`
com link na nav.

## Estratégia

Mesmo playbook das ferramentas: **fase 1 cristaliza o template** (índice + 1 artigo
modelo + componente de abas + CSS + nav), depois escalar. Fase 2 = Factory Method +
Strategy reusando o molde.

## Arquivos

- **Novos:** `biblioteca/index.html` (índice, profundidade 1), `biblioteca/singleton/index.html`
  (artigo, profundidade 2), `js/biblioteca.js` (troca de abas de linguagem, defensivo).
- **Alterados:** `css/styles.css` (classes `.biblioteca-*`, `.artigo*`, `.code-tabs*`,
  `.code-bloco`, `.mt-1`, `.artigo__padrao-pendente`; sem var nova), e **nav de 13 páginas**
  (link "Biblioteca" entre Início e Sobre, com href de profundidade correta por nível:
  raiz `biblioteca/`, `pages/` `../biblioteca/`, `tools/<slug>/` `../../biblioteca/`).
- **Inalterado:** `js/main.js`.

## Componente de abas (`js/biblioteca.js`)

Carregado só nas páginas da biblioteca, depois do main.js. IIFE defensivo (guard:
sem `.code-tabs` → return). Suporta **vários grupos de abas independentes** por página;
default = TypeScript visível; troca via classe `--ativa` + `hidden` nos painéis;
`aria-selected` + teclado (Enter/Espaço); zero `innerHTML`. Não precisa mudar para
novos artigos — detecta os grupos automaticamente.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (sem bloqueadores; ressalvas corrigidas):
- **Verificado OK:** os 15 caminhos relativos da nav (13 editadas + 2 novas) corretos
  (ponto mais frágil — passou 100%); escapamento de `<`/`>`/`&` nos 5 blocos `<pre><code>`
  perfeito; JS de abas robusto e sem leak; índice só renderiza o que existe; conteúdo
  técnico do Singleton sólido e idiomático.
- **Corrigido:** (1) links de "Padrões relacionados" davam **404** (artigos inexistentes)
  → trocados por `<span class="artigo__padrao-pendente">… (em breve)</span>`, mesma
  disciplina do índice; (2) adicionada nota sobre **ciclo de vida** do Singleton em PHP
  (share-nothing, recriado por request) vs Node (long-lived, persiste); (3) coerência
  LSB: exemplos PHP passaram de `static::`/`new static()` para `self::`/`new self()`
  (construtor `private` veda herança), com a armadilha 4 explicando quando `static::` cabe.

## Validação

- HTTP 200 em `/biblioteca/`, `/biblioteca/singleton/`, `/js/biblioteca.js`.
- Slots AdSense únicos: índice `1313131313`, artigo `1414141414`.
- Zero `<a>` para artigo inexistente; sem `style=` além do `display:block` do AdSense;
  classes CSS referenciadas existem; `main.js` antes de `biblioteca.js` no artigo.

## Pendências / próximos passos

- **Fase 2:** artigos Factory Method + Strategy (reusam o molde).
- Quando criar um padrão relacionado, trocar o `span.artigo__padrao-pendente` por link.
- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy (geral do projeto).
