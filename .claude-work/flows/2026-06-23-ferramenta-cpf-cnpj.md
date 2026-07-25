# Ferramenta CPF/CNPJ — Gerador e Validador

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (2ª ferramenta do MVP)

## Demanda

Gerar e validar CPF e CNPJ, incluindo o novo **CNPJ alfanumérico** da Receita
Federal, tudo no navegador.

## Decisões

- Regra do CNPJ alfanumérico adotada como fonte de verdade: 12 caracteres base
  (`0-9`, `A-Z`) + 2 DVs **numéricos**; valor de cada caractere = `charCode - 48`
  (`'0'..'9'` → 0..9, `'A'..'Z'` → 17..42); mesmos pesos do CNPJ numérico; mód. 11.
- CNPJ alfanumérico é exibido **sem máscara** ao gerar (a Receita ainda não
  publicou máscara oficial para o formato).
- Validação detecta o tipo automaticamente: 11 → CPF; 14 só dígitos → CNPJ
  numérico; 14 com letras na base → CNPJ alfanumérico. Máscara é ignorada.

## Arquivos

- **Novos:** `tools/cpf-cnpj/index.html`, `js/tools/cpf-cnpj.js`
- **Alterados:** `css/styles.css` (classes `.tool__section*`, `.tool__fieldset`,
  `.tool__radio-label`, `.tool__result-input`, `.result-validar*` etc.),
  `index.html` (card no catálogo)
- **Inalterado:** `js/main.js`

## Execução

Implementada pelo `dev-typescript` (os arquivos já haviam sido gravados antes de
uma interrupção). Em vez de re-executar o agente, fiz **revisão manual** (gate de
code review desta rodada): conferência de IDs HTML↔JS, caminhos `../../`,
anti-XSS (saída via `.value`/`.textContent`, sem `innerHTML`), AdSense e classes
CSS presentes.

## Validação

- HTTP 200 em `/tools/cpf-cnpj/`, `/js/tools/cpf-cnpj.js`, `/css/styles.css`.
- Card na home presente; todas as classes CSS usadas existem.
- **Teste de lógica** (bash puro, sem instalar runtime), reproduzindo o algoritmo:
  - Exemplo oficial Serpro `12ABC34501DE35` → VÁLIDO ✓
  - `12ABC34501DE36` (adulterado) → INVÁLIDO ✓
  - CNPJ numérico `11222333000181` → VÁLIDO ✓
  - CPF `52998224725` → VÁLIDO ✓; com DV errado → INVÁLIDO ✓

## Code review (gate formal)

`code-reviewer` (subagente) — **Aprovado, sem bloqueadores**. Confirmou o exemplo
Serpro `12ABC34501DE` → DV `35` de forma independente. Sugestões cosméticas (não
aplicadas): promover cores de sucesso/erro a custom properties em `:root`;
acentuar mensagens ("VÁLIDO"/"INVÁLIDO"); ocultar checkbox de máscara quando
CNPJ alfanumérico selecionado (UX).

## Pendências / observações

- `validarCNPJAlfanumerico` não rejeita sequências de caracteres iguais (o
  numérico rejeita) — cosmético, não bloqueia.
- Substituir `pub-ID`/`data-ad-slot` (`2222222222`) placeholders antes do deploy.
