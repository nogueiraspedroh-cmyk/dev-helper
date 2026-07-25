# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Site estático em HTML/CSS/JavaScript puro (sem framework, sem build step, sem
dependências), hospedado como páginas estáticas no AWS S3 + CloudFront.

**Produto:** uma coleção de pequenas **ferramentas para desenvolvedores**, cada
uma rodando 100% no navegador (não há backend). Ex.: gerador de CPF/CNPJ (com
CNPJ alfanumérico e validação), gerador de cartão (Luhn), gerador de endereço,
formatador/verificador de JSON, identador de SQL. A home funciona como catálogo
das ferramentas. Ver `docs/ROADMAP.md` para a arquitetura multi-ferramenta, o
backlog priorizado e as decisões em aberto.

## Documentos de referência

- `docs/ROADMAP.md` — visão do produto, arquitetura multi-ferramenta, backlog.
- `docs/PLANEJAMENTO.md` — processo de como tratar qualquer tarefa (recepção →
  decomposição → delegação aos agentes → validação → Definition of Done).
- `docs/MELHORIA-CONTINUA-AGENTES.md` — como avaliar e evoluir os subagentes.
- `DEPLOY.md` — publicação em S3 + CloudFront + ACM e checklist do AdSense.
- `.claude-work/flows/` — registro de cada tarefa executada (histórico/decisões).

## Estrutura e convenções

- `index.html` na raiz é a home (catálogo); páginas institucionais em `pages/`.
- **Ferramentas** ficam em `tools/<slug>/index.html`, com a lógica em
  `js/tools/<slug>.js`. Cada página de ferramenta carrega `js/main.js` (global)
  **e** o seu `js/tools/<slug>.js`. Não coloque lógica de ferramenta em
  `main.js` — ele roda em todas as páginas.
- Caminhos são **relativos** e a profundidade depende do diretório: raiz usa
  `css/...`; `pages/` usa `../css/...`; `tools/<slug>/` usa `../../css/...`.
  Links absolutos (`/css/...`) quebram em `file://` e dependem da config do
  bucket — não use. Confira a profundidade ao criar/mover páginas.
- `css/styles.css` é a folha de estilo **única**, compartilhada por todas as
  páginas. Usa custom properties em `:root` e classes BEM-ish (`.bloco__elemento`).
  Sem CSS por ferramenta — reaproveite as classes `.tool*`.
- `js/main.js` é carregado por **todas** as páginas no final do `<body>` e é
  **defensivo**: cada bloco checa `if (el)` antes de agir, porque o mesmo script
  roda em páginas sem aquele elemento. Mantenha esse padrão (inclusive nos JS de
  ferramenta) e evite `innerHTML` com entrada do usuário (risco de XSS).
- `error.html` é a página de erro 404 (documento de erro do S3/CloudFront).
- Nomes e caminhos são **case-sensitive** no S3 — mantenha tudo em minúsculas.

## AdSense

- A biblioteca do AdSense entra no `<head>` de cada página, **uma vez**.
- Blocos de anúncio são pares `<ins class="adsbygoogle"> + <script>push({})`;
  use a classe `.ad` (reserva espaço, evita layout shift). Um `data-ad-slot`
  diferente por bloco.
- `ads.txt` fica na **raiz** e precisa estar acessível em `https://dominio/ads.txt`.
- `pub-ID` e `data-ad-slot` estão como **placeholder** (`ca-pub-0000...`). Não
  publique valores reais sem o checklist de `DEPLOY.md`; a revisão do Google
  exige HTTPS, domínio próprio e conteúdo real (não placeholder) em cada página.

## Como rodar localmente

Não há build. O modo padrão é via Docker (imagem `nginx:alpine`), que replica o
tratamento de 404 do S3/CloudFront via `nginx.conf`:

```bash
docker compose up -d     # serve em http://localhost:8000
docker compose down      # para
docker compose restart   # após editar nginx.conf
```

A pasta do projeto é montada como volume — editar HTML/CSS/JS reflete ao dar F5,
sem reiniciar o container. Alternativa sem Docker: `python3 -m http.server 8000`.

## Deploy (resumo — detalhes em DEPLOY.md)

Bucket privado + CloudFront (OAC) + certificado ACM em `us-east-1` para HTTPS e
domínio próprio. Publicação:

```bash
aws s3 sync . s3://NOME-DO-BUCKET --delete \
  --exclude ".git/*" --exclude "*.md" \
  --exclude "docker-compose.yml" --exclude "nginx.conf"
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

Sem servidor de aplicação não há rewrites. Cada link aponta para um `.html`
real **ou** para um diretório terminado em `/` (ex.: `tools/json/`), que o
S3/CloudFront resolve para o `index.html` da pasta via *default root object* —
o padrão usado pelas páginas de ferramenta.
