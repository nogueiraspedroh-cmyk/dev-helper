# ROADMAP — Tools Dev (coleção de ferramentas para desenvolvedores)

> Documento de planejamento de MVP, seguindo `docs/PLANEJAMENTO.md`.
> Contexto: site **estático** HTML/CSS/JS vanilla, **sem build**, S3 + CloudFront,
> Google AdSense. Ver `CLAUDE.md` (convenções) e `DEPLOY.md` (publicação).
> Toda lógica das ferramentas roda **100% no navegador** (sem backend).

---

## 1. Arquitetura do site multi-ferramenta

### 1.1. Princípio diretor

O site passa de "site institucional com algumas páginas" para um **catálogo de
ferramentas**. Cada ferramenta é uma página HTML autocontida + um JS próprio,
reusando o CSS e o chrome (nav/footer) compartilhados. Mantemos **zero build**:
cada ferramenta é só mais arquivos estáticos linkados na home.

### 1.2. Estrutura de pastas proposta

```
/
├── index.html                 # HOME = catálogo (grid de cards de ferramentas)
├── error.html                 # 404 (já existe)
├── ads.txt                    # raiz, obrigatório (já existe)
├── css/
│   └── styles.css             # ÚNICO, compartilhado (já existe) — recebe classes novas
├── js/
│   ├── main.js                # ÚNICO, compartilhado: nav, ano, comportamento global
│   └── tools/                 # 1 arquivo de lógica por ferramenta
│       ├── cpf-cnpj.js
│       ├── cartao.js
│       ├── endereco.js
│       ├── json.js
│       └── sql.js
├── pages/                     # páginas institucionais (sobre, contato — já existem)
│   ├── sobre.html
│   └── contato.html
└── tools/                     # 1 pasta = 1 ferramenta (HTML da ferramenta)
    ├── cpf-cnpj/index.html
    ├── cartao/index.html
    ├── endereco/index.html
    ├── json/index.html
    └── sql/index.html
```

### 1.3. Decisões e justificativas

**(a) Uma pasta por ferramenta em `tools/<slug>/index.html`.**
URL limpa (`/tools/cpf-cnpj/`) e default root object do CloudFront resolve
`index.html` automaticamente. Isola cada ferramenta — adicionar/remover uma não
toca nas outras. Escala para dezenas de ferramentas sem poluir a raiz.
*Profundidade de caminho:* `tools/<slug>/index.html` está **2 níveis** abaixo da
raiz, então os assets compartilhados são referenciados com `../../`
(ex.: `../../css/styles.css`, `../../js/main.js`, `../../index.html`). Isso é o
ponto de atenção #1 de `CLAUDE.md` aplicado ao novo nível — tem de ser conferido
em todo HTML de ferramenta (case-sensitive, sem caminho absoluto).

**(b) JS de cada ferramenta separado em `js/tools/<slug>.js`, NÃO em `main.js`.**
`main.js` é carregado em **todas** as páginas. Colocar a lógica pesada de cada
ferramenta nele faria toda página baixar código que não usa e violaria o padrão
defensivo (o arquivo viraria um emaranhado de `if (el)`). Em vez disso:
- `main.js` continua só com o **global** (nav, ano do footer, futuros toggles).
- Cada página de ferramenta carrega **dois** scripts no fim do `<body>`:
  `../../js/main.js` (global) **e** `../../js/tools/<slug>.js` (específico).
- O JS específico também é **defensivo** (`if (el)`) por consistência, embora só
  rode na sua página — mantém o padrão do projeto e evita erro se for incluído
  por engano em outra página.

**(c) CSS único compartilhado (`css/styles.css`).**
Mantém o já existente. Adicionamos um bloco de classes BEM-ish reutilizáveis para
a UI das ferramentas, com custom properties em `:root`:
- `.tool` / `.tool__header` / `.tool__controls` / `.tool__output` — layout padrão
  de qualquer ferramenta (campos de entrada, botões de ação, área de resultado).
- `.tool-grid` / `.tool-card` — grid de cards da home.
- `.button--secondary`, `.field`, `.field__label`, `.copy-btn`, `.result` etc.
Sem CSS por ferramenta: um único arquivo cacheável agressivamente pelo CloudFront.
Só se uma ferramenta tiver UI muito atípica avaliamos um `<style>` inline na
própria página (exceção, não regra).

**(d) Home como catálogo.**
`index.html` deixa de ser hero institucional e vira um **grid de cards**, cada
card = uma ferramenta (título, descrição curta, link para `tools/<slug>/`).
Lista mantida **manualmente em HTML estático** (sem JS para renderizar o catálogo)
— é a forma mais simples, indexável por SEO e por crawler do AdSense, e sem custo
de build. Quando o número de ferramentas crescer muito, reavaliamos gerar o grid
a partir de um `tools/manifest.json` lido por JS; por ora, HTML estático é o certo.

**(e) Nav compartilhado.**
A nav fica como está (Início / Sobre / Contato). Não criamos um item de menu por
ferramenta (não escala). A descoberta de ferramentas é via **home (catálogo)**.
A nav segue copiada em cada HTML (não há includes sem build) — aceitável porque
muda pouco; se virar dor, avaliamos um pequeno include via JS no futuro (mas isso
prejudica SEO/crawler e fica fora do MVP).

**(f) Convivência com AdSense.**
- A **lib** do AdSense continua no `<head>` de cada página, 1x (igual hoje).
- Cada página de ferramenta ganha **1 bloco `<ins> + <script>`** em posição que
  **não atrapalhe a interação** — recomendado **abaixo da área de resultado da
  ferramenta** (`.tool__output`), nunca entre os controles. A reserva de espaço
  (`.ad { min-height }`) evita layout shift (CLS) quando o anúncio não carrega.
- `data-ad-slot` **diferente por página** (cada bloco do painel AdSense tem o seu).
- `ads.txt` permanece único na raiz.
- **Atenção AdSense (DEPLOY.md):** cada ferramenta precisa de **conteúdo real**
  (parágrafo explicando o que a ferramenta faz / o que é CPF, Luhn etc.) — páginas
  só com um widget e sem texto tendem a ser reprovadas. Cada página de ferramenta
  deve trazer uma seção de texto explicativo + FAQ curto.

### 1.4. Compatibilidade com o "MVP futuro" (gerador de escopo / agentes de IA)

A estrutura `tools/<slug>/` + `js/tools/<slug>.js` acomoda essas ferramentas sem
mudança arquitetural. **Ponto de atenção**: se elas precisarem de chamada a uma
API de IA, isso quebra o "sem backend". Decisão a tomar lá na frente (não agora):
chamada client-side com API key do usuário (BYO-key, mantém estático) **vs.**
introduzir uma function serverless (deixa de ser puramente estático → entra
`devops`). A arquitetura atual não trava nenhuma das opções.

---

## 2. Backlog priorizado das ferramentas

Ordem recomendada de implementação, com critério (valor x complexidade x risco x
papel de "padrão de referência" para as próximas):

| # | Ferramenta | Status | Complexidade | Por que nesta posição |
|---|-----------|--------|--------------|------------------------|
| **1** | **Formatador/verificador de JSON** | ✅ Concluída | Baixa | **Primeira**: lógica trivial (`JSON.parse`/`stringify`), zero regra de domínio, valor alto e universal. Estabeleceu o padrão arquitetural (pasta, JS próprio, CSS de ferramenta, AdSense, card na home). É o "template" das demais. |
| **2** | **Gerador de CPF/CNPJ** | ✅ Concluída | Média | Alto valor para devs BR. Inclui **dígitos verificadores** (CPF e CNPJ) e o **novo CNPJ alfanumérico** + **validação**. |
| **3** | **Formatador (identador) de SQL** | ✅ Concluída | Média | Valor alto, só-texto. Formatter heurístico (keywords + indentação), sem dependências externas. |
| **4** | **Gerador de cartão de crédito/débito** | ✅ Concluída | Média | **Luhn** + prefixos/comprimentos por bandeira (Visa, Mastercard, Amex, Elo, Hipercard). Números **fictícios/teste** com aviso de compliance. |
| **5** | **Gerador de CEP** | ✅ Concluída | Baixa-Média | Categoria *Localização*. Gera CEP plausível por região (e valida **formato** — CEP não tem DV). Datasets simples (faixas por região). |
| **6** | **Gerador de senha** | ✅ Concluída | Baixa | Categoria *Computação*. Comprimento/conjuntos de caracteres + entropia; `crypto.getRandomValues` com rejeição de viés. Sem dependências. |
| **7** | **Gerador de conta bancária** | ✅ Concluída | Média | Categoria *Financeiro*. Agência/conta com DV por banco (BB, Bradesco, Caixa) via módulo 11. Autoconsistência gerar→validar (10k/banco). |
| **8** | **Conversor de moeda** | ✅ Concluída | Média-Alta | Categoria *Financeiro*. **Decisão tomada:** taxas **manuais** inseridas/editadas pelo usuário (100% estático, sem fetch). Moeda-base USD=1; 10 moedas com taxas-padrão ilustrativas. |
| **9** | **Gerador de endereço (BR + internacional)** | ✅ Concluída | Alta | Categoria *Localização*. Seletor de país: **BR, EUA, Portugal, Espanha, Reino Unido**. Cidades/regiões reais; via/número/bairro/código postal fictícios; CEP BR plausível pela região (reusa `cep.js`), códigos postais intl no formato de cada país. |
| **10** | **Gerador de escopo de projeto** | ✅ Concluída | Média | Estreia a categoria *Produtividade*. Builder guiado por formulário (100% estático, **sem IA/backend**) → documento de escopo de software em **Markdown**, com copiar e baixar `.md`. Seções vazias omitidas. |
| **11** | **Calculadora de Salário PJ vs CLT** | ✅ Concluída | Média-Alta | Categoria *Financeiro*. Compara **total anual** CLT e PJ (3 modos: só CLT / só PJ / comparativo). CLT: INSS/IRRF progressivos, 13º, férias+1/3, FGTS. PJ: pró-labore mensal (opcional; padrão = salário mínimo) com INSS de 11% deduzido do líquido, alíquota editável (Simples). Benefícios dinâmicos com aplicabilidade por item. Tabelas **ilustrativas/estimativas** com disclaimer. |
| **12** | **JWT Decoder** | ✅ Concluída | Baixa-Média | Categoria *Computação*. Decodifica header/payload (Base64URL → JSON) de um JWT; converte `exp`/`iat`/`nbf` para data legível e sinaliza expiração. **Não verifica assinatura** (client-side, sem chave) — deixado explícito em aviso + FAQ. Trata token malformado sem quebrar. |
| **13** | **Gerador de UUID** | ✅ Concluída | Baixa | Categoria *Computação*. UUID v4 via `crypto.randomUUID()` (fallback `getRandomValues`); quantidade 1–100, com/sem hífens, maiúsc./minúsc.; copiar individual e todos. |
| **14** | **Base64 / URL encode-decode** | ✅ Concluída | Baixa | Categoria *Computação*. Dois modos (Base64 e `encodeURIComponent`), cada um com encode/decode; **UTF-8 seguro** (acentos/emoji); erro legível para entrada inválida; copiar. |
| **15** | **Conversor de Case** | ✅ Concluída | Baixa | Categoria *Computação*. Converte para camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE e Title Case **de uma vez** (ao vivo); tokenização reconhece camel/Pascal e separadores; copiar por linha. |
| **16** | **Gerador de Hash** | ✅ Concluída | Média | Categoria *Computação*. Gera **SHA-1/256/384/512** via `crypto.subtle.digest` nativo e **MD5** por implementação própria em JS (RFC 1321), já que a Web Crypto não suporta MD5. Entrada UTF-8; copiar por hash; aviso de que MD5/SHA-1 não servem para segurança. |
| **17** | **Regex Tester** | ✅ Concluída | Média | Categoria *Computação*. Padrão + flags g/i/m/s; destaca matches no texto (via `createElement`/`textContent`, nunca `innerHTML`) e lista grupos capturados (numerados e nomeados). Regex inválida tratada com `try/catch` no `new RegExp`; protege contra loop em match de largura zero. |
| **18** | **Diff de Texto** | ✅ Concluída | Média | Categoria *Computação*. Compara dois textos por **LCS** (sem lib), granularidade **linha** ou **palavra**, com adições/remoções destacadas por cor. Saída construída via DOM; limite de segurança para a matriz DP. |
| **19** | **Timestamp / Unix converter** | ✅ Concluída | Baixa-Média | Categoria *Computação*. Converte **data ↔ timestamp Unix** nos dois sentidos, com fuso (local/UTC) e granularidade (segundos/ms); mostra local, UTC, ISO 8601 e relativo; atalho "agora". |
| **20** | **Gerador de QR Code** | ✅ Concluída | Alta | Categoria *Computação*. Geração **100% client-side sem lib/CDN** (algoritmo próprio adaptado da lib MIT de Nayuki): modo **byte/UTF-8**, correção **Reed-Solomon** L/M/Q/H, versões 1–40 com seleção automática e melhor máscara; render em `<canvas>` com quiet zone e **download PNG** via `toBlob`. |
| **21** | **Conversor CSV ↔ JSON** | ✅ Concluída | Média | Categoria *Computação*. Dois sentidos + **detecção automática**. Parser CSV **RFC 4180 básico** (aspas, escape `""`, delimitador/quebra dentro de campo citado); delimitador configurável (vírgula/ponto-e-vírgula/tab); primeira linha como cabeçalho togglável. Valores mantidos como texto para round-trip estável. Erro legível para JSON inválido/CSV malformado. |
| **22** | **Conversor YAML ↔ JSON** | ✅ Concluída | Alta | Categoria *Computação*. Parser/serializer **YAML simplificado escrito à mão** (sem lib). Suporta mapas, listas, escalares (string/número/bool/null), aninhamento por indentação, aspas, comentários, forma compacta `- chave: valor` e `[]`/`{}`. **Fora de escopo** (documentado na página/FAQ): âncoras/tags, multi-doc, blocos `|`/`>`, fluxo inline não-vazio, tabs. Erro legível para entrada não suportada. |
| **23** | **Gerador de .gitignore** | ✅ Concluída | Baixa-Média | Categoria *Produtividade*. Multi-select de linguagens/frameworks/ferramentas (Node, Python, Java, Go, PHP, Ruby, Rust, .NET, React, Angular, VS Code, JetBrains, macOS, Windows, Linux); combina blocos com cabeçalho `# Label`. **Dataset estático embutido no JS** (sem API do GitHub). Copiar e baixar `.gitignore`. |
| **24** | **CSS Gradient Generator** | ✅ Concluída | Média | Categoria *Computação*. `linear`/`radial` com N stops (cor + posição %), ângulo (linear) e forma círculo/elipse (radial), **preview ao vivo**. Anti-XSS: cor via `<input type=color>` (hex garantido) e posição clampada 0–100 aplicadas via `element.style.background` — nunca texto livre. Código CSS pronto para copiar. |
| **25** | **Conversor de Base Numérica** | ✅ Concluída | Baixa-Média | Categoria *Computação*. Binário/octal/decimal/hexadecimal **simultâneos** (editar um atualiza os outros); validação de dígitos por base; **BigInt** para inteiros grandes sem perda; erro legível para dígito inválido. |
| **26** | **Conversor de Cor + Contraste WCAG** | ✅ Concluída | Média | Categoria *Computação*. Conversão **HEX ↔ RGB ↔ HSL** bidirecional ao vivo com preview (via `element.style`, nunca innerHTML) e verificador de **contraste WCAG 2.x** (sRGB → linear → luminância relativa → `(L1+0.05)/(L2+0.05)`), com aprovação AA/AAA para texto normal e grande. |
| **27** | **Gerador de Dados Fake / Mock JSON** | ✅ Concluída | Baixa-Média | Categoria *Computação*. Array JSON de objetos mock (id, uuid, nome, email, número em range, boolean, data, texto lorem) com quantidade e campos configuráveis. Geração 100% local (Math.random + Web Crypto), sem rede. Copiar/baixar. Domínio `example.com` (RFC 2606). |
| **28** | **Contador de Caracteres / Palavras** | ✅ Concluída | Baixa | Categoria *Computação*. Contagem ao vivo de caracteres (com/sem espaços, por code point → emoji = 1), palavras, linhas e parágrafos, com indicadores de limite (X 280, meta description 160, title tag 60) mostrando quanto falta/excedeu. |
| **29** | ~~Gerador de Senha Forte~~ | ✅ Absorvida | — | Ferramenta **duplicada** de `tools/senha` (já existente no catálogo, mesmas features). Em vez de manter duas páginas quase idênticas, o diferencial real (**geração em lote**, até 50 senhas) foi portado para `tools/senha` (`js/tools/senha.js`) e a página `tools/gerador-senha/` foi removida. |
| **30** | **Calculadora de Subnet / CIDR** | ✅ Concluída | Média | Categoria *Computação*. IPv4 + prefixo (`192.168.1.10/24`) ou IP + máscara → rede, broadcast, primeiro/último host, máscara, wildcard, total e hosts utilizáveis. Trata **/31 (RFC 3021, 2 hosts)** e **/32 (host único)**; valida octetos 0–255, prefixo 0–32 e contiguidade de máscara. |
| **31** | **JSON → Interface TypeScript** | ✅ Concluída | Média | Categoria *Computação*. Infere interfaces TS de um JSON de exemplo: objetos aninhados como interfaces próprias (com **dedup** de formas idênticas), arrays `T[]`, **union** para itens heterogêneos, chaves não-identificadoras entre aspas. Nome da raiz configurável; erro legível para JSON inválido. Opcionais fora de escopo (todos obrigatórios). |
| **32** | **Gerador de PIX Copia e Cola / QR Code** | ✅ Concluída | Alta | Categoria *Financeiro*. Monta o payload **BR Code / EMV** de um PIX estático (campos 00/01/26/52/53/54/58/59/60/62/63) e calcula o **CRC16-CCITT** (poly 0x1021, init 0xFFFF, sem reflexão). Gera o QR **reaproveitando o núcleo puro** extraído para `js/lib/qrcode-core.js` (compartilhado com a ferramenta de QR Code). CRC validado contra o vetor canônico CCITT-FALSE (`"123456789"` → `0x29B1`). |
| **33** | **Cron Builder / Explicador** | ✅ Concluída | Média | Categoria *Computação*. Expressão cron de 5 campos com `*`, listas, ranges e steps → descrição em português + próximas 5 execuções (cálculo local). **Fora de escopo**: campo de segundos e nomes por extenso (MON/JAN). Regra Vixie para dia-do-mês vs dia-da-semana. |
| **34** | **Editor / Preview de Markdown** | ✅ Concluída | Média-Alta | Categoria *Computação*. Preview ao vivo com renderização **segura** (AST pura → `createElement`/`textContent`, nunca `innerHTML`). URLs de links validadas por esquema (http/https/mailto/relativo; `javascript:` recusado). Suporta headings, negrito, itálico, código inline/bloco, listas, links, citação, hr. |
| **35** | **Gerador de Meta Tags / Open Graph** | ✅ Concluída | Média | Categoria *Computação*. Formulário manual (**sem scraping/fetch** — site sem backend) → bloco de `<meta>` (Open Graph + Twitter Card + description) com escape de atributos, e preview visual do card montado via `createElement`/`textContent`. |
| **36** | **Conversor de Fuso Horário** | ✅ Concluída | Média | Categoria *Computação*. Horário de referência + fuso de origem → equivalente em vários fusos IANA via `Intl.DateTimeFormat` (com **horário de verão** automático). Adiciona/remove fusos da lista. Conversão wall-time→UTC por refinamento de offset. |
| **37** | **Formatador/Ajustador de XML** | ✅ Concluída | Alta | Categoria *Texto & Dados*. Parser/serializer de XML **escrito à mão** (sem `DOMParser`), mesmo racional já usado para YAML/CSV: reuso em Node para sanidade, sem depender de comportamento de parser específico do navegador. Suporta declaração XML, atributos, tags self-closing, comentários, CDATA, entidades básicas/numéricas; elementos com **conteúdo misto** não são reindentados (preserva o texto original). **Fora de escopo**: validação XSD/DTD, resolução de namespace, XPath e **expansão de DOCTYPE** (superfície XXE) — DOCTYPE é preservado como texto opaco. |
| **38** | **Calculadora de Horas Trabalhadas** | ✅ Concluída | Baixa-Média | Categoria *Web, Rede & Automação*. 4 campos `time` (entrada, saída/retorno de almoço, saída) calculam tempo de almoço, total trabalhado e saldo contra uma **carga horária esperada** (padrão 08:00, editável). Cálculo ao vivo. Suporta **turno noturno** (soma 24h ao horário "menor" que o anterior, mesma técnica do conversor de fuso); ordem inválida sem virada de turno plausível gera erro legível. |

**Racional da ordem:** as 4 primeiras (concluídas) cristalizaram o padrão. As
próximas seguem por baixo custo/risco (CEP, Senha) antes das de maior decisão de
dados/escopo (Conta bancária, Conversor de moeda, Endereço).

### 2.1. Categorias do catálogo (home)

**[Atualizado na Fase 2 de UX/UI, 2026-07-20 — ver flow
`2026-07-20-fase-2-estrutural-ux-ui.md`]** A home agrupa as 37 ferramentas em
**6 categorias**. Só são renderizadas as categorias que já têm ao menos uma
ferramenta (estrutura em `index.html`, classes `.catalog__category` /
`.catalog__category-title`). A antiga categoria única "Computação &
Produtividade" concentrava 27 das 35 ferramentas (77% do catálogo) sem
categorizar nada de fato; foi quebrada em 4 categorias menores por eixo de
tarefa do usuário. A SIDEBAR (injetada em todas as páginas via `js/main.js`)
não replica essas 6 categorias — continua uma lista única (array `TOOLS`),
agora com filtro de busca no topo.

| Categoria | Ferramentas |
|-----------|-------------|
| **Documentos & Localização** | CPF/CNPJ, CEP, Gerador de endereço |
| **Financeiro** | Cartão, Conta bancária, Conversor de moeda, Salário PJ vs CLT, Gerador de PIX Copia e Cola / QR Code |
| **Texto & Dados** | JSON, SQL, Conversor CSV ↔ JSON, Conversor YAML ↔ JSON, JSON → Interface TypeScript, Diff de Texto, Editor / Preview de Markdown, Regex Tester, Contador de Caracteres, Gerador de Dados Fake / Mock JSON, Gerador de escopo de projeto, Formatador/Ajustador de XML |
| **Segurança & Codificação** | Gerador de senha (com geração em lote), Gerador de Hash, JWT Decoder, Gerador de UUID, Base64 / URL |
| **Web, Rede & Automação** | Calculadora de Subnet / CIDR, Cron Builder / Explicador, Timestamp/Unix, Conversor de Fuso Horário, Gerador de QR Code, Gerador de Meta Tags / Open Graph, Gerador de .gitignore, Calculadora de Horas Trabalhadas |
| **Conversores & Design** | Conversor de Case, Conversor de Base Numérica, Conversor de Cor + Contraste WCAG, CSS Gradient Generator |

### 2.2. Biblioteca (conteúdo educacional)

Nova frente, separada das ferramentas: seção `/biblioteca/` com artigos sobre
**Design Patterns, arquiteturas e estruturas de projeto**, com exemplos em abas
**TypeScript + PHP** (`js/biblioteca.js` faz a troca). Índice próprio que só renderiza
categorias com pelo menos 1 artigo; link "Biblioteca" na nav de todas as páginas.
Reforça conteúdo real para AdSense/SEO.

| Categoria GoF | Artigos publicados |
|---------------|--------------------|
| **Padrões de Criação** | Singleton ✅, Factory Method ✅, Abstract Factory ✅, Builder ✅, Prototype ✅ |
| **Padrões Estruturais** | Adapter ✅, Decorator ✅, Facade ✅, Proxy ✅, Composite ✅, Bridge ✅, Flyweight ✅ |
| **Padrões Comportamentais** | Strategy ✅, Observer ✅, State ✅, Template Method ✅, Command ✅, Mediator ✅, Iterator ✅, Chain of Responsibility ✅, Memento ✅, Visitor ✅, Interpreter ✅ |

As 3 categorias GoF já renderizam no índice — **23 de 23 patterns GoF publicados**.
Além disso, a seção **Arquiteturas** (agrupamento próprio no índice, formato conceitual
com diagramas) já tem:

| Seção | Artigos publicados |
|-------|--------------------|
| **Arquiteturas** | MVC ✅, Arquitetura em Camadas ✅, Arquitetura Hexagonal ✅, Clean Architecture ✅, Onion Architecture ✅, MVP ✅, MVVM ✅, CQRS ✅, Event-Driven ✅, Monolito vs Microsserviços ✅ |
| **Estruturas de Projeto** | Monorepo vs Multi-repo ✅, Feature vs Camada ✅, Estrutura de Pastas ✅ |
| **System Design** | Escalabilidade Horizontal vs Vertical ✅, Load Balancing ✅, Caching ✅, SQL vs NoSQL ✅, REST vs GraphQL vs gRPC ✅, Filas de Mensagem ✅, Circuit Breaker ✅, SLA/SLO/SLI ✅, Idempotência ✅, Sharding ✅, Replicação de Banco ✅, CDN ✅, API Gateway ✅, Saga ✅, Outbox ✅, Rate Limiting ✅, Observabilidade ✅, WebSockets e SSE ✅, Consistência Eventual vs Forte ✅ |

Total: **55 artigos** (23 patterns GoF + 10 Arquiteturas + 3 Estruturas de Projeto +
19 System Design). GoF **completo** (23/23). Artigos System Design de L7+ têm SVG
inline. Retrofit SVG nos 13 artigos anteriores pendente. Flows em 2026-06-25,
2026-06-27 e 2026-06-30.

---

## 3. Decomposição da 1ª ferramenta — Formatador/verificador de JSON

> Aplicando o processo de `docs/PLANEJAMENTO.md` (recepção → decomposição →
> delegação → validação → DoD).

### 3.0. Recepção / esclarecimento (respostas de triagem)

- **O quê / por quê:** página `/tools/json/` que valida, formata (pretty-print
  com indentação configurável) e minifica JSON; reporta erro de sintaxe de forma
  legível. Resolve uma necessidade diária de dev.
- **Escopo de página:** cria **página nova** (`tools/json/index.html`, 2 níveis →
  assets via `../../`); **altera `index.html`** (card no catálogo) e
  **`css/styles.css`** (classes de ferramenta, globais). Cria `js/tools/json.js`.
- **Conteúdo real?** Sim — texto explicativo + FAQ (exigência AdSense).
- **Impacto em assets compartilhados:** `css/styles.css` ganha classes novas
  (mudança global, mas aditiva); `js/main.js` **não muda** (lógica vai em
  `js/tools/json.js`).
- **Impacto em AdSense/`ads.txt`:** 1 bloco `<ins>` na página nova com novo
  `data-ad-slot`; `ads.txt` inalterado; `pub-ID` continua placeholder (não vai a
  produção nesta tarefa).
- **Impacto em infra/deploy:** nenhum (sem mudança de cache/404/CloudFront).
- **Vai para produção?** Não — preparar e validar localmente (nginx).

### 3.1. Etapas, delegação e responsável

| Etapa | Descrição | Agente |
|------|-----------|--------|
| E1 — CSS base de ferramentas | Em `css/styles.css`: `.tool`, `.tool__header`, `.tool__controls`, `.tool__output`, `.tool-grid`, `.tool-card`, `.button--secondary`, `.result`, `.error-msg`, usando `:root`/BEM-ish | `dev-typescript` |
| E2 — HTML da página | `tools/json/index.html`: nav+footer copiados, assets via `../../`, lib AdSense no `<head>`, textarea de entrada, controles (Formatar / Minificar / Limpar / Copiar / seletor de indentação 2/4/tab), área de saída, **bloco `<ins>` abaixo do resultado**, seção de texto explicativo + FAQ | `dev-typescript` |
| E3 — Lógica JS | `js/tools/json.js` defensivo (`if (el)`): parse seguro, pretty/minify, mensagem de erro legível (posição/linha quando possível), copiar para clipboard. Sem libs externas | `dev-typescript` |
| E4 — Card na home | Em `index.html`: adicionar `.tool-grid` + `.tool-card` da ferramenta JSON (título, descrição, link `tools/json/`) | `dev-typescript` |
| E5 — Validação local | Subir nginx, rodar checklist 4.1 do PLANEJAMENTO | `dev-typescript` executa o passo; orquestrador confere |
| E6 — Code review (gate) | Review read-only do diff completo (links/casing/caminhos `../../`, JS defensivo, sem `pub-ID` real, sem regressão de layout) | `code-reviewer` (**obrigatório**) |

**Notas de delegação:** todas as etapas de conteúdo vão para `dev-typescript`
(agente padrão do site, conforme PLANEJAMENTO.md). `devops` **não** entra (sem
mudança de infra/deploy). `security` **opcional**: como a ferramenta injeta no DOM
texto vindo do usuário (o JSON formatado), garantir que a saída é inserida via
`textContent`/value e **nunca** `innerHTML` — se houver qualquer dúvida de XSS,
acionar `security` (read-only). E1→E4 têm dependência leve (E2/E4 usam classes de
E1); recomendado sequencial E1→E2→E3→E4, depois E5 e E6.

### 3.2. Critérios de aceite (verificáveis)

- [ ] `tools/json/index.html` responde **200** no nginx local e no card da home.
- [ ] Entrada JSON válida → **formata** com indentação escolhida (2/4/tab) na área
      de saída.
- [ ] Botão **Minificar** produz JSON em uma linha.
- [ ] Entrada inválida → exibe **mensagem de erro legível** (não quebra a página,
      sem erro não tratado no console).
- [ ] Botão **Copiar** copia a saída para o clipboard.
- [ ] **Copiar/Limpar** funcionam; estado limpo não deixa erro residual.
- [ ] CSS e JS carregam sem 404 (caminhos `../../` corretos, casing minúsculo).
- [ ] Bloco AdSense presente abaixo do resultado; layout **não quebra** sem
      anúncio carregado (espaço reservado).
- [ ] Card da ferramenta aparece na home e leva para a página.
- [ ] Saída inserida via `textContent`/`value` (sem `innerHTML`) — sem risco de XSS.

### 3.3. Definition of Done (conforme PLANEJAMENTO.md §5)

- [ ] Todos os critérios de aceite (3.2) atendidos.
- [ ] Checklist **nginx local** (4.1) passou: páginas afetadas carregam, sem 404
      de assets, navegação/casing ok, 404 ainda serve `error.html`, console limpo.
- [ ] **Code review** rodou e sem bloqueadores em aberto.
- [ ] Caminhos relativos, minúsculos, case-correct; todo link aponta para `.html`
      existente.
- [ ] `js/main.js` permanece defensivo e **inalterado**; `js/tools/json.js` também
      defensivo; CSS segue BEM-ish + `:root`.
- [ ] **Não publicado** nesta tarefa → checklist de deploy/AdSense (4.3) **não**
      se aplica; `pub-ID` segue placeholder.
- [ ] Fluxo documentado em `.claude-work/flows/` (decisões, arquivos, iterações).

---

## 4. Riscos e decisões em aberto (precisam de definição antes de implementar)

### Arquiteturais / globais
1. **URL das ferramentas:** confirmar o padrão `tools/<slug>/index.html`
   (URL `/tools/json/`). Alternativa mais rasa: `tools/json.html` (1 nível,
   assets via `../`). Recomendo a pasta por ferramenta — decisão do usuário.
2. **Catálogo estático vs. gerado:** manter a home como HTML escrito à mão (MVP)
   ou já preparar `tools/manifest.json` + render por JS? Recomendo estático agora.
3. **Reuso de nav/footer sem build:** aceitar a nav copiada em cada página
   (simples, bom p/ SEO) ou introduzir include via JS (DRY, mas pior p/ crawler)?
   Recomendo copiar no MVP.

### Por ferramenta
4. **Gerador de cartão (compliance/produto):** deixar **explícito** que os números
   são **fictícios/para teste** (válidos por Luhn, mas não emitidos). Definir copy
   e disclaimer para não violar políticas do AdSense/uso indevido. **Bandeiras do
   MVP:** confirmar a lista (Visa, Mastercard, Amex, Elo, Hipercard, Diners, …?).
5. **CNPJ alfanumérico:** confirmar a **regra oficial vigente** de cálculo do DV do
   CNPJ alfanumérico (mapeamento de letras→valores e máscara) a adotar como fonte
   de verdade, para a implementação e os casos de teste manuais.
6. **Gerador de endereço — abrangência:** ✅ **RESOLVIDO E ENTREGUE** (BR em
   2026-06-23; internacional em 2026-06-25). Países: BR, EUA, Portugal, Espanha,
   Reino Unido. Estados/cidades/regiões reais; via/número/bairro/código postal
   fictícios; CEP BR plausível pela região (reusa `cep.js`), códigos postais
   internacionais apenas no formato de cada país. Mais países podem ser adicionados
   no futuro (mesmo padrão de dataset por país).
7. **Formatador SQL — profundidade:** MVP simples (uppercase de keywords +
   indentação por cláusula) **ou** parser mais completo (subqueries, JOINs
   aninhados)? Definir o nível para o MVP. Sem dependências externas em qualquer caso.

### AdSense / deploy
8. **`pub-ID` real e `data-ad-slot` por página:** quando houver conta AdSense,
   substituir placeholders e criar 1 slot por ferramenta (hoje todos placeholder).
9. **Densidade de anúncios:** 1 bloco por página de ferramenta (recomendado) vs.
   mais — equilibrar receita x experiência x políticas do AdSense.

---

## Apêndice — checklist de "nova ferramenta" (template a partir do #1)

Para cada ferramenta nova, repetir:
1. `tools/<slug>/index.html` (assets `../../`, nav/footer, lib AdSense no head,
   1 bloco `<ins>` abaixo do resultado, texto explicativo + FAQ).
2. `js/tools/<slug>.js` (defensivo, sem libs externas).
3. Classes específicas só se necessário (preferir reuso de `.tool*`).
4. Card em `index.html` (`.tool-card` no `.tool-grid`).
5. Validação nginx local + **code review obrigatório**.
6. Documentar o fluxo em `.claude-work/flows/`.
