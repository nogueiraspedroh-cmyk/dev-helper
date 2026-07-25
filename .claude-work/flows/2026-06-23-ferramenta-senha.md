# Ferramenta Senha — Gerador de Senha

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#6 — categoria Computação)

## Demanda

Gerar senhas seguras configuráveis (comprimento, conjuntos de caracteres, evitar
ambíguos), com indicador de entropia/força.

## Decisões

- Aleatoriedade **criptográfica**: `crypto.getRandomValues` com **rejeição de viés
  de módulo** (descarta valores acima do maior múltiplo do tamanho do alfabeto).
  Embaralhamento Fisher-Yates também com CSPRNG. Nada de `Math.random` no caminho
  da senha (só fallback inalcançável, bloqueado se crypto indisponível).
- Garante ao menos 1 caractere de cada conjunto selecionado.
- Entropia = comprimento × log2(tamanho do alfabeto), com rótulo Fraca/Média/
  Forte/Muito forte.

## Arquivos

- **Novos:** `tools/senha/index.html`, `js/tools/senha.js`
- **Alterados:** `css/styles.css` (classes `.senha-forca*`), `index.html` (card
  na categoria Computação + comentário-guia do catálogo atualizado: CEP/Senha ✓)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou a implementação
criptográfica linha a linha (rejeição de viés correta, Fisher-Yates com CSPRNG).
Sugestões cosméticas: CSS inline na página (recorrente — ver observação abaixo);
entropia teórica levemente superestimada por forçar 1 char/grupo (desprezível).

## Validação

- HTTP 200 em `/tools/senha/` e assets; `data-ad-slot="6666666666"` único.
- Exemplos por opção (16 com tudo, 24 sem símbolos, evitar ambíguos, etc.):
  comprimento correto, só caracteres dos conjuntos marcados, entropia calculada.

## Observação recorrente (para melhoria contínua)

CSS inline em página de ferramenta foi apontado no CEP e na Senha. Sinal repetido
em 2+ fluxos → candidato a uma rodada de limpeza (extrair classes utilitárias /
custom properties), conforme `docs/MELHORIA-CONTINUA-AGENTES.md`.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
