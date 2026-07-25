# Ferramenta Conversor de Moeda

- **Data:** 2026-06-23
- **Status:** Concluída (DoD atendido)
- **Roadmap:** `docs/ROADMAP.md` §2 (#8 — categoria Financeiro)

## Demanda

Converter valores entre moedas, 100% no navegador, sem depender de API de câmbio.

## Decisões

- **Taxas MANUAIS, 100% estático** (decisão de produto): NÃO faz fetch a nenhuma
  API externa. Conjunto inicial de 10 moedas (BRL, USD, EUR, GBP, JPY, ARS, CAD,
  CHF, CNY, MXN) com taxas-padrão **ilustrativas** (placeholders), editáveis pelo
  usuário.
- **Modelagem moeda-base USD=1:** cada moeda tem taxa relativa ao USD; conversão
  A→B = valor × (taxaB / taxaA). USD fica readonly (sempre 1).
- **Fonte de verdade = DOM:** `lerTaxa(codigo)` lê o input no momento do cálculo
  (não há cache paralelo no caminho do cálculo). Campo vazio/zerado/inválido →
  `NaN` → cai no erro visível, sem usar valor fantasma. `taxasAtivas` só serve para
  "Restaurar taxas padrão".
- **Honestidade/compliance:** disclaimer triplo (bloco de aviso, aviso na seção de
  taxas, aviso no resultado) + FAQ — taxas ilustrativas/manuais, não são cotação ao
  vivo, não usar para decisões/transações reais. Sem `localStorage`: taxas voltam ao
  padrão ao recarregar (privacidade).
- Recálculo ao vivo ao mudar valor, moedas (origem/destino) ou ao editar qualquer
  taxa (delegação de evento no container da tabela). Botões: Inverter, Copiar
  (fallback execCommand), Restaurar taxas padrão.

## Arquivos

- **Novos:** `tools/conversor-moeda/index.html`, `js/tools/conversor-moeda.js`
- **Alterados:** `index.html` (card na categoria **Financeiro** + comentário-guia),
  `css/styles.css` (classes `.conversor-*`)
- **Inalterado:** `js/main.js`

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (2 warnings de corretude, ambos
corrigidos antes do fecho):
1. **Cache de taxa divergente** do input em entrada inválida — o cálculo usava
   `taxasAtivas` (valor antigo) enquanto a tela mostrava outra coisa. Corrigido:
   `lerTaxa()` lê do DOM; listener que gravava no cache removido.
2. **Casas decimais** baseadas na magnitude da taxa de destino (resultados muito
   pequenos viravam `0,00`). Corrigido: casas baseadas na magnitude do **resultado**
   (`>=100 → 2`, `<0,01 → 6`, senão `4`).

Verificações positivas do review: zero chamadas de rede (100% estático confirmado),
closures de loop corretas (IIFE), "Restaurar padrão" não duplica listeners, anti-XSS
impecável (só `textContent`/`createElement`), guard defensivo, divisão por zero
protegida.

**Pós-correção:** ao remover o listener do cache, o recálculo ao vivo na edição de
taxa regrediu. Reintroduzido via **delegação** (`tabelaTaxas.addEventListener("input"...)`),
sem voltar ao cache — `lerTaxa()` permanece a fonte de verdade.

## Validação

- HTTP 200 em `/tools/conversor-moeda/` e `/js/tools/conversor-moeda.js`;
  `data-ad-slot="8888888888"` único.
- Todas as classes CSS referenciadas existem em `css/styles.css`.

## Pendências

- Substituir `pub-ID`/`data-ad-slot` placeholders antes do deploy.
