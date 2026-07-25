# Processo de Planejamento

Como qualquer tarefa nova neste projeto é recebida, decomposta, delegada,
validada e encerrada. Vale para todas as demandas (conteúdo, layout, JS,
deploy, AdSense). Não descreve uma feature específica — descreve o **fluxo**.

> Contexto do projeto: site estático em HTML/CSS/JS vanilla, **sem build**,
> servido via S3 + CloudFront, com Google AdSense. Ver `CLAUDE.md` (arquitetura
> e convenções) e `DEPLOY.md` (publicação e checklist AdSense).

---

## 1. Recepção e esclarecimento da demanda

Antes de tocar em qualquer arquivo, a demanda precisa estar clara. Registre as
respostas no próprio card/issue ou no fluxo documentado.

**Perguntas de triagem (responder todas):**

- **O quê / por quê**: qual é a mudança e qual problema ela resolve?
- **Escopo de página**: afeta a raiz (`index.html`), páginas em `pages/`, ou
  ambas? Cria página nova? (se sim, lembrar dos caminhos relativos — `CLAUDE.md`).
- **Conteúdo real ou placeholder?**: AdSense reprova placeholder. Se a página
  vai ao ar com AdSense, exige texto real (ver checklist DEPLOY.md).
- **Impacto em assets compartilhados**: mexe em `css/styles.css` ou `js/main.js`?
  Ambos são únicos e compartilhados por todas as páginas — mudança neles é
  global.
- **Impacto em AdSense / `ads.txt`**: altera slots de anúncio, `data-ad-client`
  ou `ads.txt`? Toca em `pub-ID`?
- **Impacto em infra/deploy**: muda comportamento de cache, 404, headers,
  domínio ou pipeline (S3/CloudFront)?
- **Vai para produção nesta tarefa?** ou só preparar localmente?

**Critérios de aceite**: traduza a demanda em itens verificáveis. Ex.:
"nav exibe link 'Blog' em todas as páginas", "página `/pages/blog.html`
responde 200 no nginx local", "404 continua servindo `error.html`".

Se faltar informação para definir critérios de aceite, **pare e pergunte** —
não assuma.

---

## 2. Decomposição em etapas

Quebre a demanda em etapas pequenas, ordenadas por dependência. Padrões comuns
neste projeto:

1. **Estrutura/conteúdo** — HTML (nova página, seção, copy).
2. **Estilo** — ajustes em `css/styles.css` (custom properties em `:root`,
   classes BEM-ish `.bloco__elemento`).
3. **Comportamento** — JS em `js/main.js`, sempre defensivo (`if (el)`), pois o
   script roda em todas as páginas.
4. **AdSense/SEO** — slots de anúncio, `ads.txt`, meta tags.
5. **Infra/deploy** — só se a tarefa mexer em S3/CloudFront/cache/404.

Regras de caminho (de `CLAUDE.md`, valem em toda etapa de HTML):

- Caminhos **relativos**: raiz usa `css/...`; páginas em `pages/` usam `../css/...`.
- Tudo **minúsculo** e **case-sensitive** (S3 é sensível a caixa).
- Cada link aponta para um `.html` real existente (sem rewrites no S3).

Use TaskCreate/TaskList para rastrear quando houver 3+ etapas.

---

## 3. Delegação aos agentes

A implementação é sempre delegada à skill de dev apropriada — o orquestrador
nunca edita arquivos diretamente. Neste site estático, o mapeamento prático é:

| Etapa / Tipo de mudança | Agente | Quando usar aqui |
|---|---|---|
| HTML, CSS, JS vanilla, `ads.txt`, meta/SEO | **`dev-typescript`** | **Agente padrão** para todo o conteúdo do site. É o mais próximo de front-end web vanilla (HTML/CSS/JS sem framework). Cobre a grande maioria das tarefas. |
| Deploy, S3, CloudFront, ACM, invalidação de cache, `nginx.conf`, `docker-compose.yml`, CI/CD | **`devops`** | Qualquer mudança em infra/publicação ou no servidor local. Toda etapa do `DEPLOY.md`. |
| Revisão read-only do diff final | **`code-reviewer`** | **Obrigatório em todo fluxo** (inclusive doc/CSS/conteúdo). Aponta, não corrige. |
| Auditoria de segurança | **`security`** | Quando houver formulário que envie dados, `<script>` de terceiros novo, conteúdo injetado via JS (risco de XSS), ou headers de segurança no CloudFront. Read-only. |

Agentes **fora de uso normal** neste projeto (não há backend):

- **`dev-php`**, **`dev-laravel`**, **`dev-nestjs`** — só se o escopo do projeto
  mudar e passar a existir backend/API. Hoje: não aplicar.

Notas:

- **Especificidade**: conteúdo do site → `dev-typescript`; tudo de
  publicação/infra → `devops`. Não misture (não peça deploy ao `dev-typescript`).
- **`code-reviewer` é read-only**: nunca delegue implementação a ele.
- Etapas independentes (ex.: copy de uma página + ajuste de infra sem contrato
  comum) podem ser delegadas em paralelo; dependentes, em ordem, passando o
  resultado como contexto.

---

## 4. Validação

A validação roda em três camadas, todas obrigatórias antes do DoD.

### 4.1. Verificação local no nginx (paridade com produção)

Não há suíte de testes automatizada; a validação funcional é manual via nginx
local, que replica o tratamento de 404 do S3/CloudFront.

```bash
docker compose up -d        # sobe o nginx em http://localhost:8000
# (alternativa sem docker: python3 -m http.server 8000)
```

Confira:

- [ ] Páginas afetadas carregam em `http://localhost:8000` (raiz e `pages/`).
- [ ] CSS e JS aplicados (sem 404 em assets no DevTools → Network/Console).
- [ ] Navegação entre páginas funciona (links relativos corretos, casing ok).
- [ ] URL inexistente serve `error.html` (404 tratado).
- [ ] Sem erros no console do navegador.
- [ ] Em página com AdSense: `<script>` e `data-ad-client` presentes; layout
      não quebra sem anúncio carregado.

### 4.2. Code review (gate obrigatório)

`code-reviewer` revisa o diff. Bloqueadores (link quebrado, caminho absoluto,
casing errado, JS não-defensivo, `pub-ID` placeholder indo para produção,
regressão de layout) voltam para o dev e contam como nova iteração. Sugestões
não-bloqueadoras vão para o resumo.

### 4.3. Checklist de deploy / AdSense (`DEPLOY.md`)

Só quando a tarefa publica em produção:

- [ ] `aws s3 sync` com os excludes de `DEPLOY.md` (`.git/*`, `*.md`,
      `docker-compose.yml`, `nginx.conf`).
- [ ] `aws cloudfront create-invalidation --paths "/*"` após o sync.
- [ ] Site acessível por **HTTPS** no domínio próprio.
- [ ] `https://<dominio>/ads.txt` retorna o conteúdo de `ads.txt`.
- [ ] `pub-ID` **real** em `ads.txt` e em todo `data-ad-client`/`src=...client=`.
- [ ] Conteúdo **real** (sem placeholders) nas páginas publicadas.

---

## 5. Definition of Done

Uma tarefa só está **pronta** quando:

- [ ] Todos os **critérios de aceite** (passo 1) atendidos.
- [ ] Verificação no **nginx local** passou (checklist 4.1).
- [ ] **Code review** rodou e não há bloqueadores em aberto.
- [ ] Caminhos **relativos**, em **minúsculo** e case-correct; todo link aponta
      para `.html` existente.
- [ ] `js/main.js` permanece **defensivo** (`if (el)`); CSS segue padrão
      BEM-ish e usa custom properties de `:root`.
- [ ] Se publicado: checklist **deploy/AdSense** (4.3) cumprido e site no ar
      via HTTPS com cache invalidado.
- [ ] Fluxo documentado em `.claude-work/flows/` (decisões, arquivos alterados,
      iterações) e, se houver card externo, comentário com o resumo.

Se qualquer item falhar e não convergir em até 3 iterações, **escale** com o
histórico (plano, iterações, último erro/apontamento).
