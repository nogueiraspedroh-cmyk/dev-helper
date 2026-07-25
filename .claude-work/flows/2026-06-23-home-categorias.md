# Home — catálogo por categorias

- **Data:** 2026-06-23
- **Status:** Concluída
- **Relacionado:** decisão de produto do usuário (organizar ferramentas por guias)

## Demanda

Agrupar o catálogo da home em categorias, em vez de um único grid.

## Decisão

4 categorias (Documentos, Localização, Financeiro, Computação). Só renderizar as
que já têm ao menos uma ferramenta — Localização fica como comentário até o CEP
existir. Estrutura preparada para inserir novas categorias/cards facilmente.

## Arquivos

- **Alterados:** `index.html` (seção `.catalog` reorganizada em `.catalog__category`),
  `css/styles.css` (`.catalog__category`, `.catalog__category-title`),
  `docs/ROADMAP.md` (backlog atualizado: 4 concluídas + CEP, Senha, Conta
  bancária, Conversor de moeda, Endereço; tabela de categorias em §2.1).
- **Inalterado:** `js/main.js`.

## Estado renderizado hoje

- Documentos: CPF/CNPJ
- Financeiro: Cartão
- Computação: JSON, SQL
- (Localização: só comentário, aguardando CEP)

## Code review

`code-reviewer` — **Aprovado, sem bloqueadores**. Confirmou: 4 cards reais, sem
links quebrados, sem categoria vazia renderizada, home preservada, CSS BEM-ish.
Sugestão cosmética: extrair `#e5e7eb` para custom property no futuro.
