# Biblioteca — Fase 3 (Padrões Estruturais: Adapter, Decorator, Facade)

- **Data:** 2026-06-25
- **Status:** Concluída (DoD atendido)
- **Base:** reusa o molde das fases 1/2 da Biblioteca

## Demanda

Estrear a 3ª categoria GoF (**Padrões Estruturais**) com 3 artigos, fazendo o índice
exibir as três categorias.

## Arquivos

- **Novos:** `biblioteca/adapter/index.html` (slot `1717171717`),
  `biblioteca/decorator/index.html` (slot `1818181818`),
  `biblioteca/facade/index.html` (slot `1919191919`).
- **Alterados:** `biblioteca/index.html` (categoria **Padrões Estruturais** ativada com
  os 3 cards; ordem Criação → Estrutural → Comportamental; comentário-guia atualizado),
  `biblioteca/singleton/index.html` (item Facade em "Padrões relacionados" virou **link
  real** `../facade/`).
- **Inalterado:** `js/biblioteca.js`, `js/main.js`, `css/styles.css`.

## Conteúdo

- **Adapter:** converter a interface esperada; **object adapter (composição)** como
  forma idiomática em TS/PHP (class adapter por herança não se aplica); exemplo de
  adaptar API de terceiros à interface do cliente.
- **Decorator:** wrapper que mantém a MESMA interface e delega + adiciona; **distinção
  vs Adapter** (mantém vs muda a interface); exemplos café (preço) e cadeia
  Log→Criptografia→Timestamp→Email; armadilha "a ordem dos decorators importa".
- **Facade:** interface unificada/simplificada para um subsistema, sem vedá-lo;
  exemplo de fachada de checkout (estoque+pagamento+envio).
- Cross-links recíprocos reais (adapter↔decorator↔facade, facade↔singleton,
  decorator→strategy); demais relacionados como spans pendentes.

## Intercorrência (limite de sessão)

O 1º dev escreveu os 3 artigos completos mas foi cortado por **limite de sessão**
antes de 2 ajustes finais. Verifiquei que os 3 HTML estavam íntegros (fechamento,
scripts, footer) e um 2º dev finalizou: ativar a categoria no índice + link Facade no
Singleton.

## Code review (gate formal)

`code-reviewer` — **Aprovado com ressalvas** (corrigidas):
- **Verificado OK:** completude (sem truncamento apesar da interrupção); correção
  conceitual de Adapter×Decorator×Facade×Proxy bem articulada e recíproca; código TS/PHP
  idiomático; cálculos do café conferem (4,50 / 4,25); escapamento integral; índice com
  as 3 categorias na ordem certa; sem `<a>` para artigo inexistente.
- **Corrigido:** (1) comentário de saída **enganoso** no exemplo "completo" do Decorator
  (TS+PHP) que contradizia a ordem real dos decorators — entrada trocada para ASCII
  `"Ola"` (evita quebra multibyte do `strrev`) e saída corrigida para
  `[EMAIL] [<ts>] [ENC:alO]`; (2) typo `ServicoPagemento` → `ServicoPagamento` no Facade.

## Validação

- HTTP 200 nos 7 artigos + índice. Slots `1717/1818/1919` únicos. Sem link 404 na
  biblioteca (12 spans pendentes). Sem `style=` além do AdSense.

## Estado da Biblioteca

**6 artigos** em **3 categorias GoF** (todas as categorias agora renderizam):
- Criação: Singleton, Factory Method
- Estrutural: Adapter, Decorator, Facade
- Comportamental: Strategy

## Próximos passos (sugestões)

- Mais comportamentais (Observer, State, Template Method) — destravam spans pendentes.
- Mais estruturais (Proxy, Composite, Bridge).
- Futuro: seções de **Arquiteturas** e **Estruturas de Projeto**.
