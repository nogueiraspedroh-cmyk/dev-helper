# Limpeza de CSS inline (senha + CEP)

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Motivação:** achado recorrente em 2+ revisões (CEP e Senha) — gatilho de
  melhoria contínua previsto em `docs/MELHORIA-CONTINUA-AGENTES.md`.

## Demanda

Remover o CSS inline (`style="..."`) das páginas de ferramenta, extraindo para
classes reutilizáveis em `css/styles.css`. Refatoração **pura**: resultado
renderizado idêntico ao anterior.

## Escopo

Só duas páginas tinham CSS inline real: `tools/senha/` (~26 ocorrências) e
`tools/cep/` (~14, a tabela de regiões). As demais páginas só têm o
`style="display:block"` padrão do `<ins>` do AdSense (única exceção tolerada,
mantida). As duas tabelas (entropia da senha e regiões do CEP) usavam estilos
idênticos → extraídas para UMA classe compartilhada.

## Decisões

- **Custom properties novas no `:root`:** `--color-border-soft` (#e5e7eb, bordas) e
  `--color-bg-subtle` (#f3f4f6, fundos sutis). `#6b7280` reusou a `--color-muted`
  já existente. Atende pedido antigo de review de extrair `#e5e7eb` para variável.
- **Classe de tabela compartilhada `.info-table`** (+ `thead tr`, `th`, `td`) usada
  por senha e CEP (DRY).
- **Classes específicas da senha** (BEM-ish): `.senha-comprimento-input`,
  `.senha-range-input`, `.senha-opcoes-grid`, `.senha-saida`, `.senha-forca-wrapper`,
  `.senha-forca-linha`, `.senha-forca-bits`, `.exemplo-mono`; `margin-top` somado à
  `.senha-forca-barra-bg`.
- **Toggle de força preservado:** o id `senha-forca-wrapper` permanece; `js/tools/senha.js`
  segue alternando via `style.display` (inline sobrepõe a classe por especificidade).
  `js/main.js` e os JS de ferramenta NÃO foram alterados.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Conferiu equivalência visual 1:1
de cada classe vs. os estilos inline removidos; toggle de força íntegro; `--color-muted`
== #6b7280; só restou o `display:block` do AdSense (1/página). Nota de manutenção
(não bloqueante): as classes de override (`.senha-saida`, `.senha-comprimento-input`,
`.senha-range-input`) dependem de virem DEPOIS das classes base (`.tool__result-input`,
`.tool__select`) na ordem do arquivo — atualmente corretas; não reordenar sem cuidado.

## Validação

- HTTP 200 em `/tools/senha/` e `/tools/cep/`.
- `grep 'style="'` retorna só o `display:block` do AdSense (1 por página).
- Todas as classes novas referenciadas existem em `css/styles.css`.

## Pendências

- Nenhuma específica. (Manutenção: manter as classes de override após as base.)
