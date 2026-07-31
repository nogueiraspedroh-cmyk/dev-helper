<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-31 -->

# docs/

## Purpose
Documentação de processo e produto do projeto — não é documentação de API
nem de código, é o registro de **como o projeto é planejado e conduzido**:
visão/backlog do produto, o processo de tratar qualquer tarefa, e como
avaliar/evoluir os subagentes usados no fluxo de trabalho. Referenciados a
partir do `CLAUDE.md` da raiz ("Documentos de referência").

## Key Files / Patterns

| Arquivo | Propósito |
|---|---|
| `ROADMAP.md` (30.9K) | Documento vivo de planejamento de produto: (1) arquitetura multi-ferramenta e as decisões/justificativas por trás dela (§1); (2) backlog priorizado das ~37 ferramentas com status, complexidade e racional de ordem (§2.1) e das ~55 categorias/artigos da biblioteca (§2.2); (3) uma decomposição de exemplo completa (ferramenta JSON) seguindo o processo de `PLANEJAMENTO.md` (§3); (4) riscos e decisões em aberto (§4); (5) checklist reutilizável de "nova ferramenta" (apêndice). É o documento a atualizar sempre que uma ferramenta ou artigo novo é concluído, ou uma decisão arquitetural é tomada. |
| `PLANEJAMENTO.md` (7.0K) | Processo genérico de como **qualquer** tarefa neste projeto é tratada: recepção/esclarecimento (perguntas de triagem obrigatórias) → decomposição em etapas → delegação aos agentes (tabela de mapeamento tarefa→agente) → validação (checklist nginx local + code review obrigatório + checklist de deploy/AdSense) → Definition of Done. Não descreve uma feature específica — descreve o fluxo de trabalho em si. |
| `MELHORIA-CONTINUA-AGENTES.md` (9.7K) | Processo de avaliação e evolução da suíte de subagentes (`orquestrador`, `code-reviewer`, `security`, `dev-typescript`, `devops`, etc.): sinais de que um agente precisa de ajuste, critérios de qualidade, o ciclo observar→diagnosticar→ajustar→validar→registrar, quando criar agente novo vs. ajustar existente, e o changelog por agente (fonte única de rastreabilidade, já que os arquivos de definição em `~/.claude/agents/` não são versionados neste repo). |

## Subdirectories
Nenhuma — os três documentos são arquivos únicos nesta pasta.

## For AI Agents

### Working In This Directory
- Estes três documentos são **normativos do processo do projeto**, não
  descrições passivas — `PLANEJAMENTO.md` define o fluxo que qualquer tarefa
  (inclusive geração de documentação como este `AGENTS.md`) deveria seguir
  em teoria: recepção → decomposição → delegação → validação → DoD.
- Ao concluir uma ferramenta ou artigo novo, atualize a linha correspondente
  em `ROADMAP.md` §2.1/§2.2 (status ✅, contagem total) — é a fonte de
  verdade de "o que já existe" no site, mais confiável que listar
  diretórios manualmente.
- Ao editar um agente em `~/.claude/agents/`, registre a mudança no
  changelog de `MELHORIA-CONTINUA-AGENTES.md` §5 — sem essa entrada a
  mudança "não está concluída" pelos critérios do próprio documento.
- `DEPLOY.md` (publicação S3/CloudFront/ACM + checklist AdSense) vive na
  **raiz** do projeto, não aqui — não confundir escopo.

### Common Patterns
- Markdown com tabelas para backlog/checklist/changelog; seções numeradas
  (`## 1.`, `## 2.`) em `ROADMAP.md` e `PLANEJAMENTO.md`.
- Convenção de status: ✅ Concluída / ✅ Absorvida (ROADMAP.md), usada para
  varrer rapidamente o que falta.

## Dependencies
- Nenhuma dependência de código — documentação pura em Markdown, sem
  processamento/renderização especial além do viewer padrão do Git host.
- Referenciado por `CLAUDE.md` (raiz) e pelo processo descrito em
  `PLANEJAMENTO.md`/`MELHORIA-CONTINUA-AGENTES.md`, que citam uns aos
  outros.
