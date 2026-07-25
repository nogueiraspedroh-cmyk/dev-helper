# Ferramenta CEP — Gerador e Validador

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#5 — estreia a categoria Localização)

## Demanda

Gerar CEP plausível (com faixa por região do 1º dígito) e validar o formato.

## Decisões

- Geração por região via mapa do 1º dígito (0 Grande SP … 9 RS); "Aleatório" default.
- **Honestidade técnica:** CEP NÃO tem dígito verificador — a validação é só de
  FORMATO (8 dígitos), não confirma existência. Explícito no conteúdo, FAQ e no
  cabeçalho do JS. Não inventa logradouro; aponta ViaCEP/Correios para consulta real.

## Arquivos

- **Novos:** `tools/cep/index.html`, `js/tools/cep.js`
- **Alterados:** `index.html` (categoria **Localização** passou de comentário a
  seção renderizada, na ordem Documentos → Localização → Financeiro → Computação)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Destacou a honestidade técnica
como exemplar. Sugestões cosméticas: atualizar comentário-guia do catálogo (será
feito junto da próxima ferramenta); acentuar "VÁLIDO/INVÁLIDO"; tabela de regiões
usa `style` inline (preferir classe compartilhada se surgirem mais tabelas).

## Validação

- HTTP 200 em `/tools/cep/` e assets; `data-ad-slot="5555555555"` único.
- Geração: 1º dígito respeita a faixa nas 10 regiões. Validação de formato OK
  (8 dígitos, ignora máscara; rejeita não-numérico e tamanho errado).

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
