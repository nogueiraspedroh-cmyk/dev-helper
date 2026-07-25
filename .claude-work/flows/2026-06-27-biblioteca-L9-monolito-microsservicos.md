# Biblioteca — L9 (Arquiteturas: Monolito vs Microsserviços)

- **Data:** 2026-06-27
- **Status:** Concluída (DoD atendido)
- **Plano:** 9º lote do plano de expansão do Orquestrador (10 lotes)

## Demanda

Fechar a seção Arquiteturas com o artigo mais fundamental de escolha de topologia de
deploy: **Monolito vs Microsserviços**.

## Arquivos

- **Novo:** `biblioteca/monolito-vs-microsservicos/index.html` (slot `5050505050`).
- **Alterados:** `biblioteca/index.html` (card em Arquiteturas após event-driven + ✓);
  spans→links (3): "Monolito vs Microsserviços" em `cqrs/`, `event-driven/`,
  `monolito-vs-monorepo/`.
- **Inalterado:** `js/*`, `css/styles.css`, raiz, `tools/*`.

## Conteúdo

- Espectro completo: Monolito → Monolito Modular → SOA → Microsserviços → Serverless.
- **Monolito Modular como terceira via**: fronteiras de domínio dentro de um único deploy,
  sem overhead de rede. Caminho evolutivo recomendado (não paliativo): extrair para serviço
  quando a dor for real (escala independente, ciclo de deploy autônomo, tecnologia diferente).
- **Distributed Monolith** definido com precisão: banco compartilhado + deploy conjunto +
  chamadas síncronas em cadeia sem tolerância a falha — "pior dos dois mundos".
- Prós/contras simétricos; artigo não demoniza nenhuma abordagem. "Você precisa ser o
  Netflix..." contextualizado como aviso pontual (armadilha 3), não mensagem dominante.
- 5 cross-links recíprocos: monolito-vs-monorepo, cqrs, event-driven, arquitetura-em-camadas,
  arquitetura-hexagonal.

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Verificou Distributed Monolith (preciso),
Monolito Modular (terceira via honesta), equilíbrio de trade-offs, links internos (todos 200),
conversões span→link corretas, slot 5050 único, zero classes fantasma. 2 sugestões opcionais
— não aplicadas (nota pedagógica sobre BD compartilhado, reciprocidade futura de camadas/hexagonal).

## Validação

- HTTP 200 em monolito-vs-microsservicos/ + índice. Scripts na ordem; slot único.

## Estado da Biblioteca

**34 artigos**: 21 patterns GoF + 10 Arquiteturas + 3 Estruturas de Projeto.

## Próximo

L10 (Visitor + Interpreter — últimos comportamentais GoF) em andamento.
