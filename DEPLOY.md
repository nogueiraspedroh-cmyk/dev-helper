# Deploy: S3 + CloudFront + ACM (com domínio e HTTPS)

Guia de referência para publicar este site estático com domínio próprio e
HTTPS — pré-requisitos do Google AdSense. A ideia geral:

```
Usuário ──HTTPS──> CloudFront (CDN + certificado) ──> S3 (arquivos do site)
                        ▲
                        │ certificado
                     ACM (us-east-1)
```

- **S3**: guarda os arquivos (`index.html`, `css/`, `js/`, `ads.txt`...).
- **CloudFront**: CDN na frente do S3; é quem entrega **HTTPS** e o domínio.
- **ACM**: emite o certificado TLS gratuito usado pelo CloudFront.
- **Route 53** (ou seu provedor de DNS): aponta o domínio para o CloudFront.

> Importante: o certificado do ACM usado pelo CloudFront **precisa** estar na
> região `us-east-1` (N. Virginia), independente de onde está o bucket.

---

## 1. Bucket S3

Com CloudFront na frente, o bucket **não** precisa de "static website hosting"
nem de acesso público — o CloudFront acessa via Origin Access Control (OAC).
Mantenha o bucket privado.

```bash
# Cria o bucket (escolha um nome único globalmente).
aws s3 mb s3://meu-site-estatico --region us-east-1

# Envia os arquivos do site (exclui o que não deve ir para produção).
aws s3 sync . s3://meu-site-estatico --delete \
  --exclude ".git/*" \
  --exclude "*.md" \
  --exclude "docker-compose.yml" \
  --exclude "nginx.conf"
```

## 2. Certificado HTTPS (ACM)

```bash
aws acm request-certificate \
  --domain-name meusite.com.br \
  --subject-alternative-names www.meusite.com.br \
  --validation-method DNS \
  --region us-east-1
```

O ACM devolve registros CNAME de validação — crie-os no seu DNS. Quando o
status virar `ISSUED`, o certificado está pronto.

## 3. Distribuição CloudFront

Pelo console é mais simples no começo. Configurações-chave:

- **Origin**: o bucket S3, com **Origin Access Control (OAC)** habilitado
  (o console gera a policy do bucket que libera só o CloudFront).
- **Viewer protocol policy**: `Redirect HTTP to HTTPS`.
- **Default root object**: `index.html`.
- **Alternate domain (CNAME)**: `meusite.com.br` (+ `www`).
- **Custom SSL certificate**: o certificado do passo 2.
- **Custom error response**: código `404` → resposta `/error.html`
  (replica o comportamento do nginx local e do "error document" do S3).

## 4. DNS

Aponte o domínio para o CloudFront:

- Route 53: registro **A (Alias)** → distribuição CloudFront.
- Outro provedor: registro **CNAME** → `dxxxx.cloudfront.net`.

## 5. Publicar atualizações

A cada mudança no site:

```bash
# 1. Sobe os arquivos novos.
aws s3 sync . s3://meu-site-estatico --delete \
  --exclude ".git/*" --exclude "*.md" \
  --exclude "docker-compose.yml" --exclude "nginx.conf"

# 2. Invalida o cache do CloudFront para servir a versão nova na hora.
aws cloudfront create-invalidation \
  --distribution-id SEU_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Checklist para o AdSense

- [ ] Site acessível por **HTTPS** no domínio próprio (passos 2–4).
- [ ] `https://meusite.com.br/ads.txt` retorna o conteúdo do arquivo `ads.txt`.
- [ ] `pub-ID` real preenchido em `ads.txt` e em todos os `data-ad-client`/`<script src=...client=>`.
- [ ] Conteúdo real nas páginas (a revisão do Google reprova placeholders).
