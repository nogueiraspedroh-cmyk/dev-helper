# Melhoria Contínua dos Agentes

Processo documentado para avaliar e evoluir a suíte de subagentes deste projeto
(`orquestrador`, `code-reviewer`, `security`, `dev-typescript`, `dev-php`,
`dev-laravel`, `dev-nestjs`, `devops`, `documentador-fluxos`, `skynet`).

> **Contexto deste projeto**: site estático em HTML/CSS/JS vanilla, sem build,
> hospedado em S3+CloudFront com AdSense. Na prática o trabalho real recai sobre
> `dev-typescript` (JS do `js/main.js`), `devops` (deploy S3/CloudFront),
> `code-reviewer`, `security` (AdSense, headers, `ads.txt`) e os meta-agentes.
> Os agentes `dev-laravel`, `dev-nestjs`, `dev-php` existem por herança da suíte
> e raramente serão acionados aqui — não invista esforço de evolução neles a
> menos que o projeto mude de stack.

Os arquivos de definição dos agentes ficam em `~/.claude/agents/<nome>.md`. O
histórico de mudanças vive neste repositório (ver seção 5).

---

## 1. Como detectar que um agente precisa de ajuste

Sinais observáveis durante os ciclos do orquestrador. Quem detecta é o `skynet`
no modo pós-execução (Fase 5 do orquestrador), mas qualquer um dos sinais
abaixo, percebido pelo usuário, também justifica abrir o ciclo.

| Sinal | O que indica |
|-------|--------------|
| **Retrabalho** — o agente foi re-chamado na mesma iteração para corrigir o que ele mesmo fez | Instrução incompleta ou ambígua; falta de checklist |
| **Falha de validação repetida** — testes/lint/build quebram pela mesma causa em 2+ iterações | O agente não conhece uma regra do projeto (ex.: caminhos relativos, casing do S3) |
| **Bloqueador recorrente no code-review** — o `code-reviewer` aponta sempre o mesmo tipo de problema | Padrão do projeto não está no prompt do agente de dev |
| **Escalada ao usuário** — o ciclo parou por falta de decisão | O agente não tem caminho de "quando não souber, peça decisão" |
| **Output fora do escopo** — o agente tocou arquivos ou tomou decisões além do pedido | Escopo mal delimitado |
| **Feedback direto do usuário** — "isso não era pra ter feito assim" | Expectativa não codificada no prompt |
| **Gap de cobertura** — nenhuma stack/tarefa cobre o pedido | Falta um agente (ver seção 4) |

Regra prática: **um sinal isolado** vira nota no relatório pós-execução; **o
mesmo sinal em 2+ fluxos** vira proposta de ajuste.

---

## 2. Critérios de qualidade de um agente

Avalie cada agente nestes eixos. Para um projeto pequeno, foque nos de peso Alto.

| Critério | Pergunta-chave | Peso |
|----------|----------------|------|
| **Clareza do prompt** | As instruções são objetivas e sem ambiguidade? | Alto |
| **Escopo bem definido** | O agente sabe o que NÃO é responsabilidade dele? | Alto |
| **Ferramentas adequadas** | O `tools:` no frontmatter bate com o papel? (read-only não tem `Write`/`Edit`; dev tem) | Alto |
| **Aderência ao projeto** | Conhece as regras do `CLAUDE.md` (caminhos relativos, casing, `if (el)`, sync S3)? | Alto |
| **Checklist de qualidade** | Tem uma lista de verificação acionável antes de declarar "pronto"? | Médio |
| **Exemplos** | Há exemplos concretos suficientes para remover dúvida? | Médio |
| **Consistência** | Segue a estrutura dos demais agentes (frontmatter + seções)? | Médio |
| **Atualização** | Reflete práticas atuais e o estado real do projeto? | Médio |

**Checagem de ferramentas (importante e barata):** confirme que `code-reviewer`,
`security` e `orquestrador` **não** têm `Write`/`Edit` (são read-only/coordenação)
e que os `dev-*` e `devops` têm. Uma ferramenta a mais num agente read-only é um
bug de definição.

---

## 3. O ciclo de melhoria

Cinco passos. Os três primeiros são responsabilidade do `skynet`; o ajuste só é
aplicado **com consentimento do usuário**.

```
observar → diagnosticar → ajustar prompt/escopo → validar → registrar
```

### 3.1 Observar
Ao final de cada fluxo, o orquestrador entrega ao `skynet` (Fase 5): tarefa,
agentes usados, nº de iterações, erros/correções, arquivos tocados, escaladas.
O `skynet` cruza isso com os sinais da seção 1.

### 3.2 Diagnosticar
Para cada agente envolvido, responder: *qual instrução ausente ou ambígua causou
a fricção?* Localize a causa-raiz numa seção específica do prompt, não no agente
como um todo.

### 3.3 Ajustar prompt/escopo
- **Mudança mínima e cirúrgica**: edite a seção exata. Não reescreva o agente.
- **Adicione, não infle**: prefira um item de checklist ou um exemplo a um
  parágrafo genérico.
- **Escopo**: se o agente extrapolou, adicione um "Fora de escopo" explícito.
- **Ferramentas**: se o problema é de permissão, ajuste o `tools:` do frontmatter.
- **Regra crítica**: em modo pós-execução o `skynet` **propõe** o diff e
  **aguarda aprovação**. Só edita `~/.claude/agents/*.md` em modo explícito ou
  após "ok" do usuário.

### 3.4 Validar
Antes de fechar a mudança:
- A alteração teria evitado a fricção observada? (teste mental contra o fluxo real)
- Não conflita com outro agente nem com o `CLAUDE.md`?
- Não introduz duplicação com instrução já existente?
- Quando possível, valide no próximo fluxo real e observe se o sinal sumiu.

### 3.5 Registrar
Toda mudança aplicada vira uma linha no changelog (seção 5). Sem registro, a
mudança não está concluída.

### Formato da proposta de melhoria (saída do `skynet`)

```markdown
### Melhoria proposta: <agente>
**Motivação**: <o que aconteceu no fluxo que motiva a mudança>
**Mudança**: <seção/linha + texto antigo → texto novo>
**Impacto esperado**: <quando essa mudança teria evitado fricção>
```

---

## 4. Criar um agente novo vs. ajustar um existente

Padrão: **ajustar o existente.** Coesão sobre quantidade — poucos agentes bem
definidos valem mais que muitos superficiais. Num projeto deste tamanho, a barra
para criar agente novo é alta.

**Ajuste um existente quando:**
- O agente acerta o domínio, mas erra em um detalhe (instrução faltando, exemplo).
- O problema é de escopo ou de ferramentas, não de competência.
- A nova necessidade é uma variação do que o agente já faz.

**Crie um agente novo apenas quando todas forem verdadeiras:**
1. Há um **domínio recorrente** sem dono claro (apareceu em ≥2 fluxos).
2. Encaixar no agente existente **deturparia** o escopo dele (misturaria papéis).
3. O novo domínio tem **boas práticas e checklist próprios**, distintos.

Exemplo plausível aqui: se SEO/performance/acessibilidade de páginas estáticas
virar recorrente e não couber bem em `dev-typescript`, considere um agente
`web-static` dedicado. Enquanto for esporádico, reforce o `dev-typescript`.

**Nunca crie** um agente para uma micro-tarefa pontual nem duplicando algo que
outro agente já cobre.

Ao criar, use o template-padrão (frontmatter `name`/`description`/`tools`/`model`
+ seções "Quando Invocado", "Princípios/Stack", "Boas Práticas", "Checklist") e
**registre-o na matriz do `orquestrador`, na do `skynet` e no changelog abaixo.**

---

## 5. Registro do histórico de mudanças

Cada agente tem seu histórico **neste arquivo**, na tabela abaixo. É a fonte
única de rastreabilidade — os arquivos em `~/.claude/agents/` não são versionados
neste repo, então o changelog aqui é o que sobrevive.

Convenção de versão: `vMAJOR.MINOR`.
- **MINOR** — ajuste de instrução, exemplo, item de checklist.
- **MAJOR** — mudança de escopo, papel ou de `tools:` do frontmatter.

Adicione a entrada mais recente **no topo** de cada tabela.

### Como registrar (3 passos)
1. Aplicada a edição em `~/.claude/agents/<agente>.md` (com ok do usuário).
2. Adicione uma linha na tabela do agente correspondente abaixo.
3. Se a mudança nasceu de um fluxo, linke o fluxo em `.claude-work/flows/`.

### Changelog por agente

#### orquestrador
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### code-reviewer
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### security
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### dev-typescript
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### devops
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### documentador-fluxos
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

#### skynet
| Data | Versão | Mudança | Motivação | Fluxo |
|------|--------|---------|-----------|-------|
| 2026-06-23 | v1.0 | Estado inicial registrado | Baseline | - |

> Agentes `dev-php`, `dev-laravel`, `dev-nestjs`: herdados da suíte, sem uso
> esperado neste projeto. Sem changelog até que sejam efetivamente acionados.

---

## Resumo do processo (cola rápida)

1. **Detectar** (seção 1): retrabalho, falha de validação repetida, escalada,
   feedback do usuário. Mesmo sinal em 2+ fluxos → proposta.
2. **Avaliar** (seção 2): clareza, escopo, ferramentas, aderência ao `CLAUDE.md`.
3. **Ciclo** (seção 3): observar → diagnosticar → ajustar (mínimo) → validar →
   registrar. `skynet` propõe; usuário aprova.
4. **Novo vs. ajustar** (seção 4): default é ajustar; criar só com domínio
   recorrente + escopo distinto.
5. **Registrar** (seção 5): changelog por agente, neste arquivo, mais recente no
   topo.
