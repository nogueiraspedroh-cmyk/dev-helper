# Ferramenta Escopo — Gerador de Escopo de Projeto de Software

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Roadmap:** novo MVP (gerador de escopo) — estreia a categoria **Produtividade**

## Demanda

Builder guiado por formulário que monta um documento de escopo de projeto de
software em Markdown, 100% no navegador.

## Decisões (com o usuário)

- **Builder guiado por formulário, 100% estático** — sem backend, sem IA/LLM, sem
  chamada de rede (a opção "com IA" foi descartada por conflitar com a arquitetura).
- **Domínio: projeto de software** (objetivo, requisitos funcionais/não funcionais,
  entregáveis, fora de escopo, premissas, riscos, critérios de aceite, stack, prazo).
- **Saída: Markdown**, com **Copiar** e **Baixar `.md`** (via Blob no navegador).
- Categoria nova **Produtividade** na home (onde caberá também o futuro "gerador de
  agentes de IA"). [Default escolhido pelo assistente; usuário pode realocar.]

## Comportamento

- Listas dinâmicas (add/remove item) para as seções de múltiplos itens; itens vazios
  ignorados; **seções vazias OMITIDAS** do documento. Título com fallback "Projeto sem
  nome". Download com filename = slug do projeto (fallback `escopo.md`), objectURL
  revogado (sem leak). Tudo offline.

## Arquivos

- **Novos:** `tools/escopo/index.html`, `js/tools/escopo.js`
- **Alterados:** `index.html` (nova categoria **Produtividade** + card + comentário-guia),
  `css/styles.css` (11 classes `.escopo-*`; sem custom property nova)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (sem bloqueadores; ressalvas corrigidas):
- Confirmou: **anti-XSS impecável** (Markdown como string, saída via `.value`/`.textContent`,
  linhas via `createElement`, zero `innerHTML`); omissão de seções/itens vazios correta;
  download com revogação de objectURL (sem leak, offline); listas sem vazamento de
  listeners; guard defensivo; categoria Produtividade bem integrada (sem link quebrado,
  sem categoria vazia); slot único; classes CSS existem; sem CSS inline indevido.
- **Corrigido:** (1) reentrada do `flashButton` em clique duplo (idempotente via
  `data-label-original` + guard `disabled`); (2) typo "intencional mente" →
  "intencionalmente". Bônus: `autocorrect` via `setAttribute`.

## Validação

- HTTP 200 em `/tools/escopo/` e `/js/tools/escopo.js`; `data-ad-slot="1212121212"` único.
- Sem `style=` além do `display:block` do AdSense; classes referenciadas existem.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy (geral do projeto).
- Próximo MVP relacionado: **gerador de agentes de IA** (mesma categoria Produtividade).
