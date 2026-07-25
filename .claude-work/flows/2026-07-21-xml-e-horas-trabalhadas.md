# 2 ferramentas — Formatador/Ajustador de XML e Calculadora de Horas Trabalhadas

- **Data:** 2026-07-21
- **Tags:** static-site, texto-dados, web-rede-automacao, feat, lote-2
- **Status:** ✅ Concluído (validado em nginx local via `docker compose`)

## Tarefa

Adicionar 2 ferramentas novas ao catálogo (ferramentas #37–#38), implementadas
em sequência (mesmos arquivos compartilhados: `index.html`, `js/main.js`,
`docs/ROADMAP.md`):

1. **Formatador/Ajustador de XML** (`tools/xml/`) — categoria *Texto & Dados*.
2. **Calculadora de Horas Trabalhadas** (`tools/horas-trabalhadas/`) —
   categoria *Web, Rede & Automação*.

## Arquivos criados

- `tools/xml/index.html` + `js/tools/xml.js`
- `tools/horas-trabalhadas/index.html` + `js/tools/horas-trabalhadas.js`

## Arquivos editados

- `index.html` — 2 cards `.tool-row` novos (XML em *Texto & Dados*, Horas
  Trabalhadas em *Web, Rede & Automação*).
- `js/main.js` — 2 entradas novas no array `TOOLS` (sidebar, com ícones SVG) e
  2 slugs adicionados a `TOOL_CATEGORIES` (mesmas categorias do item acima);
  comentário da soma das categorias atualizado (35 → 37).
- `css/styles.css` — 1 bloco aditivo novo: `.horas-*` (campos, grid de
  resultado e destaque de saldo positivo/negativo, reaproveitando
  `--success-bg/fg` e `--danger-bg/fg` já existentes). A ferramenta de XML não
  precisou de CSS novo (reusa `.tool*`/`.result`/`.error-msg`, igual a
  `tools/json`).
- `docs/ROADMAP.md` — linhas #37–#38 no backlog (§2) + categorias (§2.1, "35
  ferramentas" → "37 ferramentas").
- Este flow + `.claude-work/flows/INDEX.md`.

## Ad-slots usados (todos placeholder `ca-pub-0000...`)

| Ferramenta | data-ad-slot |
|-----------|--------------|
| xml | 3939393939 |
| horas-trabalhadas | 4040404040 |

Unicidade global validada: `grep -rho 'data-ad-slot="[0-9]*"' tools/ index.html
pages/ | sort | uniq -d` → vazio.

## Decisões de design / edge-cases

### XML (`js/tools/xml.js`)

- **Parser recursivo-descendente próprio**, sem `DOMParser` — mesmo racional
  já documentado para `js/tools/yaml-json.js`: reuso idêntico da lógica no
  navegador e no Node (`require()` para sanity check), sem depender do
  comportamento de parser de XML específico de cada navegador.
- AST simples: nós `element` (`name`, `attrs`, `children`, `selfClosing`),
  `text`, `comment`, `cdata`. Suporta declaração `<?xml ...?>`, atributos
  (aspas simples ou duplas), tags self-closing, comentários, CDATA, entidades
  básicas (`&lt; &gt; &amp; &quot; &apos;`) e numéricas (`&#NN;`/`&#xNN;`).
  Namespaces tratados como parte literal do nome (sem resolver URIs).
- **`<!DOCTYPE ...>` preservado como texto OPACO**: `consumeDoctype` rastreia
  profundidade de `[`/`]` e aspas para achar o `>` de fechamento correto, mas
  **nunca processa** o subconjunto interno — evita expansão de entidade
  customizada estilo XXE. Documentado na página (corpo + FAQ).
- **Conteúdo misto** (texto não-whitespace + elementos no mesmo nó, ex.
  `<p>Olá <b>mundo</b>!</p>`): `isMixedElement` detecta o caso e
  `serializeFlat` serializa o miolo **exatamente como está**, sem reindentar —
  tanto no Formatar quanto no Minificar (mesma cautela de "não alterar dado do
  usuário" já usada em YAML/CSV).
- Erros de well-formedness cobertos com mensagem legível + posição
  (linha/coluna): tag não fechada, tag de fechamento sem abertura
  correspondente, mais de um elemento raiz, texto fora do elemento raiz,
  atributo sem aspas, aspas não fechadas, entidade desconhecida/não terminada.
  Nenhum caso lança exceção não tratada (sempre `Error` capturável).
- Fora de escopo (documentado no FAQ): validação XSD/DTD, resolução de
  namespace, XPath.

### Calculadora de Horas Trabalhadas (`js/tools/horas-trabalhadas.js`)

- Função pura central `calcularHoras(entrada, saidaAlmoco, retornoAlmoco,
  saida, cargaEsperada)` retorna `{ tempoAlmoco, totalTrabalhado, saldo, erro }`
  em **minutos** (nunca lança exceção); formatação para `HH:MM`/`±HH:MM` fica
  em `formatMinutos`/`formatSaldo`, chamadas só na hora de exibir.
- **Turno noturno**: `unwrapSequence` "desenrola" a sequência de 4 horários
  somando 24h a qualquer horário que seja cronologicamente menor que o
  anterior — mesma técnica já usada no conversor de fuso horário deste
  projeto. Se mais de uma virada de meia-noite for necessária (`wrapCount >
  1`), ou o intervalo total passar de 24h, a sequência é considerada
  implausível e retorna erro legível em vez de um resultado incorreto.
- Carga horária esperada é opcional (padrão `08:00`, campo editável no HTML
  com esse valor pré-preenchido); saldo positivo/negativo destacado via
  `.horas-saldo--positivo`/`--negativo` (cores reaproveitadas de
  `--success-bg/fg` e `--danger-bg/fg`).
- Cálculo **ao vivo** (`input` nos 5 campos), mesmo padrão de
  `tools/fuso-horario` — mais adequado que um botão explícito para 5 campos
  simples de horário.
- Escopo deliberadamente enxuto: sem múltiplos dias, sem banco de horas
  acumulado, sem persistência — documentado no FAQ da página.

## Validação

- `node --check js/tools/xml.js` e `node --check js/tools/horas-trabalhadas.js`
  → limpos.
- Sanidade em Node (via `require()` dos arquivos reais, padrão UMD-lite):
  - **XML**: formatação de um XML com atributo, texto, filho aninhado,
    comentário e CDATA sem erro; round-trip parse → minify → parse preserva a
    árvore (comparação normalizada, ignorando apenas texto whitespace-only
    insignificante); conteúdo misto não é reindentado; declaração +
    `<!DOCTYPE ... [ <!ENTITY foo "bar"> ]>` preservados como texto opaco;
    tag não fechada (`<a><b>texto</a>`) retorna erro capturável — não lança
    exceção não tratada; casos adicionais verificados (atributo sem aspas,
    aspas não fechadas, mais de uma raiz, texto fora da raiz, tag de
    fechamento sem abertura correspondente, entidade desconhecida, entrada
    vazia) — todos com mensagem legível.
  - **Horas Trabalhadas**: expediente padrão 08:00–12:00/13:00–18:00, carga
    8h → tempo de almoço `01:00`, total `09:00`, saldo `+01:00`; turno
    noturno 22:00–23:00/23:30–06:00 → tempo de almoço `00:30`, total `07:30`;
    ordem inválida sem virada de turno plausível (`10:00→09:00→08:00→07:00`)
    → erro sem exceção; carga horária omitida usa o padrão de 8h; formato de
    horário inválido → erro legível.
- `grep -rho 'data-ad-slot="[0-9]*"' tools/ index.html pages/ | sort | uniq -d`
  → vazio (sem colisão).
- Conferido que a soma de `TOOL_CATEGORIES` em `js/main.js` bate com
  `TOOLS.length` (37 em ambos, nenhum slug de `TOOLS` ausente de
  `TOOL_CATEGORIES`).
- `docker compose up -d` (container já estava no ar, reaproveitado) +
  requisições via `curl`: `/`, `/tools/xml/`, `/tools/horas-trabalhadas/` e
  todos os assets referenciados (CSS, `js/main.js`, `js/tools/xml.js`,
  `js/tools/horas-trabalhadas.js`, `favicon.svg`, `biblioteca/`,
  `pages/sobre.html`, `pages/contato.html`) → **200**; rota inexistente →
  **404** servindo `error.html` (`<title>Página não encontrada — Dev
  Helper</title>`). Links `tools/xml/` e `tools/horas-trabalhadas/`
  confirmados na home renderizada.

## Pendências

- **Code review** (obrigatório, conforme `docs/PLANEJAMENTO.md`) ainda não
  rodou — a cargo de outro agente (`code-reviewer`), fora do escopo desta
  execução.
