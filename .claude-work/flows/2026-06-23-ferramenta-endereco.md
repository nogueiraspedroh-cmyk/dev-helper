# Ferramenta Endereço — Gerador de Endereço (Brasil)

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#9 — categoria Localização)

## Demanda

Gerar endereços brasileiros fictícios para testes de software.

## Decisões (definidas com o usuário antes de implementar — ver §4.6 do ROADMAP)

- **Só BRASIL neste MVP.** Internacional adiado como follow-up (registrado no ROADMAP).
- **Estados e cidades REAIS** (dataset embutido), mas **bairro, logradouro, número e
  CEP fictícios**. CEP apenas **plausível pela região** (1º dígito coerente com a
  macro-região da UF), reaproveitando a lógica de `js/tools/cep.js` — NÃO é o CEP
  real da rua.
- Filtro por UF específica ou "Aleatório"; geração de 1/5/10 endereços de uma vez.

## Arquivos

- **Novos:** `tools/endereco/index.html`, `js/tools/endereco.js`
- **Alterados:** `index.html` (card na categoria **Localização**, ao lado do CEP +
  comentário-guia atualizado: Endereço agora existe), `css/styles.css` (classes
  `.endereco-lista`, `.endereco-bloco`, `.endereco-bloco__numero` — sem custom
  property nova; reusou `.cartao-campo*`, `.conta-aviso`, `.info-table`)
- **Inalterado:** `js/main.js`

## Dataset embutido

27 UFs; ~166 cidades reais; 45 bairros + 54 logradouros fictícios; tipos de
logradouro com peso (Rua x4, Avenida x3, …). Cada UF tem `cepDigitos` (1º dígito do
CEP por macro-região; SP com dois: 0 e 1, Grande SP / Interior).

## Code review (gate formal)

`code-reviewer` — **Aprovado, sem bloqueadores**. Cruzou o mapa de região de `cep.js`
com `cepDigitos` de cada UF: **100% coerente** (SP→0/1, RJ/ES→2, MG→3, BA/SE→4,
PE/AL/PB/RN→5, CE/PI/MA/PA/AM/AC/AP/RR→6, DF/GO/TO/MT/MS/RO→7, PR/SC→8, RS→9).
Amostrou o dataset de cidades — todas na UF correta, com armadilhas evitadas
(Juazeiro/BA vs Juazeiro do Norte/CE; São Gonçalo/RJ vs São Gonçalo do Amarante/RN;
Santana/AP). Anti-XSS impecável (createElement/textContent; limpeza por removeChild,
não innerHTML); geração múltipla sem vazamento de listeners. 6 sugestões opcionais
(duplicação de helpers entre ferramentas — padrão do projeto; rótulo "N de M" fora do
texto copiado — proposital para colar em CSV/banco). Nenhuma exige ação.

## Validação

- HTTP 200 em `/tools/endereco/` e `/js/tools/endereco.js`;
  `data-ad-slot="9999999999"` único.
- Sem `style=` além do `display:block` do AdSense; classes referenciadas existem.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
- **Follow-up:** endereço internacional (outros países) — adiado deste MVP.
