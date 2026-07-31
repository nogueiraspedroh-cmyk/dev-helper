// Script compartilhado por todas as páginas.
// Carregado via <script src="..."> no final do <body>, então o DOM já existe.

(function () {
  "use strict";

  // Preenche o ano atual no rodapé (presente em todas as páginas).
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ================================================================
  // UTILITÁRIO GLOBAL — feedback visual de "Copiado!" em botões.
  // Antes duplicado (function flash/flashButton) em ~24 js/tools/<slug>.js;
  // consolidado aqui porque main.js é carregado ANTES do JS de cada
  // ferramenta em toda página de tools/<slug>/index.html. Exposto em
  // window.DevHelper (sem módulos ES/build neste site) para os scripts de
  // ferramenta chamarem window.DevHelper.flashButton(...).
  // ================================================================
  window.DevHelper = window.DevHelper || {};

  /**
   * Troca temporariamente o texto de um botão (ex.: "Copiado!") e o
   * desabilita durante o intervalo — evita que um clique repetido durante
   * o flash reinicie o timeout com o texto errado. `duration` é opcional
   * (padrão 1500ms).
   */
  window.DevHelper.flashButton = function (btn, label, duration) {
    if (!btn || btn.disabled) {
      return;
    }
    var original = btn.getAttribute("data-label-original") || btn.textContent;
    btn.setAttribute("data-label-original", original);
    btn.textContent = label;
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = btn.getAttribute("data-label-original");
      btn.disabled = false;
    }, duration || 1500);
  };

  // Exemplo de interatividade na página inicial.
  var cta = document.getElementById("cta");
  var ctaMessage = document.getElementById("cta-message");
  if (cta && ctaMessage) {
    cta.addEventListener("click", function () {
      ctaMessage.hidden = false;
      ctaMessage.textContent = "Botão clicado em " + new Date().toLocaleTimeString();
    });
  }

  // ================================================================
  // SIDEBAR DE NAVEGAÇÃO — injetada em todas as páginas.
  // Lista as ferramentas + link para a Biblioteca. Convive com o
  // <nav> horizontal já existente (não o substitui).
  // ================================================================

  /**
   * Quebra location.pathname em segmentos não vazios — helper compartilhado
   * por computeRelativePrefix e isEnglishPath (abaixo), para não duplicar a
   * lógica de split/filter em dois lugares. Ex.: "/en/tools/json/" ->
   * ["en", "tools", "json"].
   */
  function pathSegments(pathname) {
    return pathname.split("/").filter(function (s) {
      return s.length > 0;
    });
  }

  /**
   * Calcula o prefixo relativo ("", "../", "../../"...) necessário para
   * chegar à raiz do site a partir da página atual, com base apenas em
   * location.pathname — sem hardcode por página.
   *
   * Regra: cada segmento de diretório no caminho exige um "../".
   * - "/"                        -> []                 -> depth 0
   * - "/index.html"              -> ["index.html"]      -> depth 0
   * - "/pages/sobre.html"        -> ["pages","sobre..."] -> depth 1
   * - "/tools/json/"             -> ["tools","json"]    -> depth 2
   * - "/biblioteca/"             -> ["biblioteca"]      -> depth 1
   * - "/biblioteca/state/"       -> ["biblioteca","state"] -> depth 2
   */
  function computeRelativePrefix(pathname) {
    var segments = pathSegments(pathname);
    var endsWithSlash = pathname.charAt(pathname.length - 1) === "/";
    var depth = endsWithSlash ? segments.length : Math.max(segments.length - 1, 0);
    if (depth <= 0) {
      return "";
    }
    return new Array(depth + 1).join("../");
  }

  /**
   * true quando o path pertence à árvore /en/ (versão em inglês do site —
   * ver TOOLS_EN/TOOL_CATEGORIES_EN e UI_STRINGS mais abaixo). Reaproveita
   * pathSegments (mesma regra de split/filter de computeRelativePrefix) — o
   * primeiro segmento não vazio precisa ser exatamente "en".
   * - "/en/tools/json/" -> true
   * - "/tools/json/"    -> false
   * - "/en/index.html"  -> true
   * - "/index.html"     -> false
   */
  function isEnglishPath(pathname) {
    var segments = pathSegments(pathname);
    return segments.length > 0 && segments[0] === "en";
  }

  // Exposta para js/biblioteca.js (carregado DEPOIS de main.js em toda
  // página da Biblioteca) reaproveitar a mesma lógica de detecção de idioma
  // sem duplicar pathSegments/isEnglishPath ali — mesmo padrão de
  // window.DevHelper.flashButton, acima.
  window.DevHelper.isEnglishPath = isEnglishPath;

  // Lista única de ferramentas — fonte da verdade para a sidebar.
  // Ao adicionar uma ferramenta nova, inclua aqui (slug, título, ícone SVG)
  // e também um .tool-card correspondente em index.html.
  var TOOLS = [
    {
      slug: "cpf-cnpj",
      label: "CPF / CNPJ",
      icon:
        '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="12" r="2"/>' +
        '<line x1="13" y1="9.5" x2="18.5" y2="9.5"/><line x1="13" y1="13" x2="18.5" y2="13"/>' +
        '<line x1="13" y1="16" x2="16.5" y2="16"/>',
    },
    {
      slug: "cep",
      label: "CEP",
      icon:
        '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/>' +
        '<circle cx="12" cy="9.5" r="2.3"/>',
    },
    {
      slug: "endereco",
      label: "Endereço",
      icon:
        '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>',
    },
    {
      slug: "cartao",
      label: "Cartão",
      icon:
        '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><line x1="2.5" y1="10" x2="21.5" y2="10"/>' +
        '<line x1="5.5" y1="14.5" x2="9.5" y2="14.5"/>',
    },
    {
      slug: "conta-bancaria",
      label: "Conta Bancária",
      icon:
        '<path d="M3 10 12 4l9 6"/><line x1="4" y1="10" x2="20" y2="10"/>' +
        '<line x1="5.5" y1="10" x2="5.5" y2="18"/><line x1="9.5" y1="10" x2="9.5" y2="18"/>' +
        '<line x1="14.5" y1="10" x2="14.5" y2="18"/><line x1="18.5" y1="10" x2="18.5" y2="18"/>' +
        '<line x1="3" y1="20" x2="21" y2="20"/>',
    },
    {
      slug: "conversor-moeda",
      label: "Conversor de Moeda",
      icon:
        '<path d="M4 8h13"/><path d="M14 4l3 4-3 4"/><path d="M20 16H7"/><path d="M10 12l-3 4 3 4"/>',
    },
    {
      slug: "salario-pj-clt",
      label: "Salário PJ vs CLT",
      icon:
        '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 7h14"/><path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0z"/><path d="M19 7l-2.5 5a2.5 2.5 0 0 0 5 0z"/><path d="M5 7l7-2 7 2"/>',
    },
    {
      slug: "json",
      label: "JSON",
      icon:
        '<path d="M9 4c-2 0-3 1-3 3v3c0 1-.6 2-2 2 1.4 0 2 1 2 2v3c0 2 1 3 3 3"/>' +
        '<path d="M15 4c2 0 3 1 3 3v3c0 1 .6 2 2 2-1.4 0-2 1-2 2v3c0 2-1 3-3 3"/>',
    },
    {
      slug: "sql",
      label: "SQL",
      icon:
        '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>' +
        '<path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    },
    {
      slug: "senha",
      label: "Senha",
      icon: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    },
    {
      slug: "escopo",
      label: "Escopo de Projeto",
      icon:
        '<rect x="6" y="4.5" width="12" height="16" rx="2"/><rect x="9" y="3" width="6" height="3" rx="1"/>' +
        '<line x1="8.5" y1="10" x2="15.5" y2="10"/><line x1="8.5" y1="13.5" x2="15.5" y2="13.5"/>' +
        '<line x1="8.5" y1="17" x2="13" y2="17"/>',
    },
    {
      slug: "jwt",
      label: "JWT Decoder",
      icon:
        '<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h9.5"/>' +
        '<path d="M18 12v3"/><path d="M20.5 12v2.5"/>',
    },
    {
      slug: "uuid",
      label: "Gerador de UUID",
      icon:
        '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 4l-2 16"/><path d="M16 4l-2 16"/>',
    },
    {
      slug: "base64",
      label: "Base64 / URL",
      icon: '<path d="M8 6l-4 6 4 6"/><path d="M16 6l4 6-4 6"/>',
    },
    {
      slug: "conversor-case",
      label: "Conversor de Case",
      icon: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    },
    {
      slug: "hash",
      label: "Gerador de Hash",
      icon:
        '<line x1="9" y1="4" x2="7" y2="20"/><line x1="17" y1="4" x2="15" y2="20"/>' +
        '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>',
    },
    {
      slug: "regex",
      label: "Regex Tester",
      icon:
        '<path d="M7 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/>' +
        '<path d="M17 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>' +
        '<circle cx="8.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="15.5" cy="12" r="1.2"/>',
    },
    {
      slug: "diff",
      label: "Diff de Texto",
      icon:
        '<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>' +
        '<line x1="5" y1="9" x2="9" y2="9"/><line x1="15" y1="9" x2="19" y2="9"/><line x1="17" y1="7" x2="17" y2="11"/>',
    },
    {
      slug: "timestamp",
      label: "Timestamp Unix",
      icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    },
    {
      slug: "qrcode",
      label: "Gerador de QR Code",
      icon:
        '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
        '<rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/>' +
        '<path d="M20 14v3"/><path d="M14 20h3"/><path d="M20 20h1"/>',
    },
    {
      slug: "csv-json",
      label: "CSV ↔ JSON",
      icon:
        '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="9.5" y1="9.5" x2="9.5" y2="20"/><line x1="6" y1="14.5" x2="7.5" y2="14.5"/>',
    },
    {
      slug: "yaml-json",
      label: "YAML ↔ JSON",
      icon:
        '<path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><line x1="8" y1="13" x2="15" y2="13"/><line x1="8" y1="16.5" x2="12.5" y2="16.5"/>',
    },
    {
      slug: "gitignore",
      label: "Gerador de .gitignore",
      icon:
        '<circle cx="12" cy="12" r="8.5"/><line x1="6" y1="6" x2="18" y2="18"/>',
    },
    {
      slug: "css-gradient",
      label: "CSS Gradient Generator",
      icon:
        '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 15l17-7"/><path d="M3.5 19l17-11"/>',
    },
    {
      slug: "base-numerica",
      label: "Conversor de Base Numérica",
      icon:
        '<path d="M5 7h3v10"/><path d="M5 17h5"/><rect x="14" y="7" width="5" height="10" rx="2.5"/>',
    },
    {
      slug: "cor",
      label: "Cor + Contraste WCAG",
      icon:
        '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-2s-.6-1.4-.6-2.4 1-1.6 2.1-1.6H17a3.5 3.5 0 0 0 3.5-3.5A8.5 8.5 0 0 0 12 3.5Z"/>' +
        '<circle cx="8" cy="10" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="10.5" r="1"/>',
    },
    {
      slug: "mock-data",
      label: "Dados Fake / Mock JSON",
      icon:
        '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.1"/>' +
        '<circle cx="15.5" cy="8.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/>' +
        '<circle cx="8.5" cy="15.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/>',
    },
    {
      slug: "contador-caracteres",
      label: "Contador de Caracteres",
      icon: '<path d="M5 6h14"/><path d="M5 10h14"/><path d="M5 14h9"/><path d="M5 18h6"/>',
    },
    {
      slug: "cidr",
      label: "Calculadora CIDR",
      icon:
        '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/>' +
        '<rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4"/><path d="M6 16v-2h12v2"/>',
    },
    {
      slug: "json-para-typescript",
      label: "JSON para TypeScript",
      icon:
        '<path d="M8 4c-2 0-3 1-3 3v2c0 1-.6 2-2 2 1.4 0 2 1 2 2v2c0 2 1 3 3 3"/>' +
        '<path d="M12 9h8"/><path d="M16 9v8"/>',
    },
    {
      slug: "pix",
      label: "PIX Copia e Cola",
      icon:
        '<path d="M12 2l3.5 3.5L12 9 8.5 5.5z"/><path d="M2 12l3.5-3.5L9 12l-3.5 3.5z"/>' +
        '<path d="M22 12l-3.5-3.5L15 12l3.5 3.5z"/><path d="M12 22l3.5-3.5L12 15l-3.5 3.5z"/>',
    },
    {
      slug: "cron",
      label: "Cron Builder",
      icon:
        '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/>' +
        '<path d="M16 3v4"/><path d="M12 12v3l2 1"/>',
    },
    {
      slug: "markdown",
      label: "Editor de Markdown",
      icon:
        '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 15V9l3 3 3-3v6"/>' +
        '<path d="M16 9v3"/><path d="M14.5 12l1.5 2 1.5-2"/>',
    },
    {
      slug: "meta-tags",
      label: "Gerador de Meta Tags",
      icon:
        '<path d="M3 12l8-8h8v8l-8 8z"/><circle cx="15.5" cy="8.5" r="1.3"/>',
    },
    {
      slug: "fuso-horario",
      label: "Conversor de Fuso Horário",
      icon:
        '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/>' +
        '<path d="M12 3.5c2.5 2.4 2.5 14.6 0 17"/><path d="M12 3.5c-2.5 2.4-2.5 14.6 0 17"/>',
    },
    {
      slug: "xml",
      label: "XML",
      icon: '<path d="M8 4 3 12l5 8"/><path d="M16 4l5 8-5 8"/><line x1="14" y1="3" x2="10" y2="21"/>',
    },
    {
      slug: "horas-trabalhadas",
      label: "Horas Trabalhadas",
      icon:
        '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/>' +
        '<path d="M9 3h6"/><path d="M12 3v2"/>',
    },
  ];

  // Taxonomia de 6 categorias já usada no catálogo da home (index.html,
  // comentário acima de .catalog) — replicada aqui só como lista de slugs,
  // na mesma ordem em que aparecem em index.html, para agrupar a sidebar no
  // mesmo padrão accordion+busca já usado pela Biblioteca (ver
  // buildToolsAccordion, abaixo). Título/ícone de cada ferramenta continuam
  // vindo de TOOLS (fonte única) — evita duplicar/reescrever os paths de
  // ícone SVG aqui. Ao mudar a categoria de uma ferramenta em index.html,
  // replique a mudança aqui (mesma soma: 3+5+12+5+8+4 = 37).
  var TOOL_CATEGORIES = [
    { title: "Documentos & Localização", slugs: ["cpf-cnpj", "cep", "endereco"] },
    {
      title: "Financeiro",
      slugs: ["cartao", "conta-bancaria", "conversor-moeda", "salario-pj-clt", "pix"],
    },
    {
      title: "Texto & Dados",
      slugs: [
        "json",
        "sql",
        "csv-json",
        "yaml-json",
        "json-para-typescript",
        "diff",
        "markdown",
        "regex",
        "contador-caracteres",
        "mock-data",
        "escopo",
        "xml",
      ],
    },
    {
      title: "Segurança & Codificação",
      slugs: ["senha", "hash", "jwt", "uuid", "base64"],
    },
    {
      title: "Web, Rede & Automação",
      slugs: [
        "cidr",
        "cron",
        "timestamp",
        "fuso-horario",
        "qrcode",
        "meta-tags",
        "gitignore",
        "horas-trabalhadas",
      ],
    },
    {
      title: "Conversores & Design",
      slugs: ["conversor-case", "base-numerica", "cor", "css-gradient"],
    },
  ];

  // ================================================================
  // VERSÃO EM INGLÊS de TOOLS/TOOL_CATEGORIES — usada pela sidebar quando
  // isEnglishPath(pathname) é true (ver buildToolsAccordion, mais abaixo).
  // A Biblioteca tem sua própria versão EN (BIBLIOTECA_CATEGORIES_EN) —
  // ver comentário em buildBibliotecaAccordion.
  //
  // Em vez de reescrever as 37 entradas (duplicando os 37 desenhos de ícone
  // SVG e arriscando as duas listas divergirem com o tempo), TOOLS_EN é
  // MONTADA a partir de TOOLS: só o `label` muda, via o dicionário
  // TOOL_LABELS_EN abaixo (slug -> label em inglês); `slug` e `icon` são
  // reaproveitados de TOOLS (fonte única do desenho). Mesma ideia para
  // TOOL_CATEGORIES_EN/TOOL_CATEGORY_TITLES_EN — só o `title` muda, `slugs`
  // é o mesmo array (a taxonomia de categorias não muda por idioma).
  //
  // Ferramentas específicas do Brasil (cpf-cnpj, cep, pix, salario-pj-clt,
  // conta-bancaria) não têm tradução literal — o label em inglês explica do
  // que se trata para quem não é do Brasil, em vez de traduzir ao pé da
  // letra. As demais são tradução direta, mantendo siglas/tecnologias (JSON,
  // SQL, JWT, UUID, CSS, XML, CIDR, CSV, YAML) como estão.
  // ================================================================
  var TOOL_LABELS_EN = {
    "cpf-cnpj": "CPF/CNPJ (Brazilian Tax ID)",
    cep: "CEP (Brazilian ZIP Code)",
    endereco: "Address Generator",
    cartao: "Credit Card Generator",
    "conta-bancaria": "Bank Account (Brazil)",
    "conversor-moeda": "Currency Converter",
    "salario-pj-clt": "Salary: PJ vs CLT (Brazil)",
    json: "JSON",
    sql: "SQL",
    senha: "Password Generator",
    escopo: "Project Scope",
    jwt: "JWT Decoder",
    uuid: "UUID Generator",
    base64: "Base64 / URL",
    "conversor-case": "Case Converter",
    hash: "Hash Generator",
    regex: "Regex Tester",
    diff: "Text Diff",
    timestamp: "Unix Timestamp",
    qrcode: "QR Code Generator",
    "csv-json": "CSV ↔ JSON",
    "yaml-json": "YAML ↔ JSON",
    gitignore: ".gitignore Generator",
    "css-gradient": "CSS Gradient Generator",
    "base-numerica": "Number Base Converter",
    cor: "Color + WCAG Contrast",
    "mock-data": "Mock Data / Fake JSON",
    "contador-caracteres": "Character Counter",
    cidr: "CIDR Calculator",
    "json-para-typescript": "JSON to TypeScript",
    pix: "PIX (Brazilian Instant Payment)",
    cron: "Cron Builder",
    markdown: "Markdown Editor",
    "meta-tags": "Meta Tags Generator",
    "fuso-horario": "Time Zone Converter",
    xml: "XML",
    "horas-trabalhadas": "Worked Hours",
  };

  var TOOLS_EN = TOOLS.map(function (tool) {
    return {
      slug: tool.slug,
      label: TOOL_LABELS_EN[tool.slug] || tool.label,
      icon: tool.icon,
    };
  });

  var TOOL_CATEGORY_TITLES_EN = {
    "Documentos & Localização": "Documents & Location",
    Financeiro: "Finance",
    "Texto & Dados": "Text & Data",
    "Segurança & Codificação": "Security & Encoding",
    "Web, Rede & Automação": "Web, Network & Automation",
    "Conversores & Design": "Converters & Design",
  };

  var TOOL_CATEGORIES_EN = TOOL_CATEGORIES.map(function (category) {
    return {
      title: TOOL_CATEGORY_TITLES_EN[category.title] || category.title,
      slugs: category.slugs,
    };
  });

  // Chevron usado nos gatilhos do accordion de categorias da Biblioteca —
  // aponta para a direita por padrão; roda 90° via CSS quando expandido.
  var CHEVRON_ICON = '<path d="M9 6l6 6-6 6"/>';

  // Árvore completa da Biblioteca (55 artigos, 6 categorias) — fonte da
  // verdade para o accordion da sidebar. Ao publicar um artigo novo, some
  // aqui (categoria :: slug/label) — o link em biblioteca/index.html
  // continua sendo mantido à parte, por categoria, naquele arquivo.
  var BIBLIOTECA_CATEGORIES = [
    {
      title: "Padrões de Criação",
      articles: [
        { slug: "singleton", label: "Singleton" },
        { slug: "factory-method", label: "Factory Method" },
        { slug: "abstract-factory", label: "Abstract Factory" },
        { slug: "builder", label: "Builder" },
        { slug: "prototype", label: "Prototype" },
      ],
    },
    {
      title: "Padrões Estruturais",
      articles: [
        { slug: "adapter", label: "Adapter" },
        { slug: "decorator", label: "Decorator" },
        { slug: "facade", label: "Facade" },
        { slug: "proxy", label: "Proxy" },
        { slug: "composite", label: "Composite" },
        { slug: "bridge", label: "Bridge" },
        { slug: "flyweight", label: "Flyweight" },
      ],
    },
    {
      title: "Padrões Comportamentais",
      articles: [
        { slug: "strategy", label: "Strategy" },
        { slug: "observer", label: "Observer" },
        { slug: "state", label: "State" },
        { slug: "template-method", label: "Template Method" },
        { slug: "command", label: "Command" },
        { slug: "mediator", label: "Mediator" },
        { slug: "iterator", label: "Iterator" },
        { slug: "chain-of-responsibility", label: "Chain of Responsibility" },
        { slug: "memento", label: "Memento" },
        { slug: "visitor", label: "Visitor" },
        { slug: "interpreter", label: "Interpreter" },
      ],
    },
    {
      title: "Arquiteturas de Software",
      articles: [
        { slug: "mvc", label: "MVC" },
        { slug: "arquitetura-em-camadas", label: "Arquitetura em Camadas" },
        { slug: "arquitetura-hexagonal", label: "Arquitetura Hexagonal" },
        { slug: "clean-architecture", label: "Clean Architecture" },
        { slug: "onion-architecture", label: "Onion Architecture" },
        { slug: "mvp", label: "MVP" },
        { slug: "mvvm", label: "MVVM" },
        { slug: "cqrs", label: "CQRS" },
        { slug: "event-driven", label: "Event-Driven Architecture" },
        { slug: "monolito-vs-microsservicos", label: "Monolito vs Microsserviços" },
      ],
    },
    {
      title: "Organização de Código e Repositórios",
      articles: [
        { slug: "monolito-vs-monorepo", label: "Monorepo vs Multi-repo" },
        { slug: "feature-vs-layer", label: "Organização por Feature vs Camada" },
        { slug: "estrutura-de-pastas", label: "Boas Práticas de Estrutura de Pastas" },
      ],
    },
    {
      title: "Conceitos de Infraestrutura e Escala",
      articles: [
        { slug: "escalabilidade-horizontal-vertical", label: "Escalabilidade Horizontal vs Vertical" },
        { slug: "load-balancing", label: "Load Balancing" },
        { slug: "caching", label: "Caching" },
        { slug: "sql-vs-nosql", label: "SQL vs NoSQL" },
        { slug: "rest-vs-graphql-vs-grpc", label: "REST vs GraphQL vs gRPC" },
        { slug: "filas-de-mensagem", label: "Filas de Mensagem" },
        { slug: "circuit-breaker", label: "Circuit Breaker" },
        { slug: "sla-slo-sli", label: "SLA, SLO e SLI" },
        { slug: "idempotencia", label: "Idempotência" },
        { slug: "sharding", label: "Sharding e Particionamento" },
        { slug: "replicacao-de-banco", label: "Replicação de Banco de Dados" },
        { slug: "cdn", label: "CDN" },
        { slug: "api-gateway", label: "API Gateway" },
        { slug: "saga", label: "Saga Pattern" },
        { slug: "outbox", label: "Outbox Pattern" },
        { slug: "rate-limiting", label: "Rate Limiting" },
        { slug: "observabilidade", label: "Observabilidade" },
        { slug: "websockets-sse", label: "WebSockets e SSE" },
        { slug: "consistencia", label: "Consistência Eventual vs Forte" },
      ],
    },
  ];

  // ================================================================
  // VERSÃO EM INGLÊS de BIBLIOTECA_CATEGORIES — usada pela sidebar (e pelo
  // catálogo en/biblioteca/index.html, montado à mão a partir dos mesmos
  // labels) quando isEnglishPath(pathname) é true (ver
  // buildBibliotecaAccordion, mais abaixo). Mesma técnica de
  // TOOLS_EN/TOOL_CATEGORIES_EN acima: BIBLIOTECA_CATEGORIES_EN é MONTADA a
  // partir de BIBLIOTECA_CATEGORIES via .map() — só `title`/`label` mudam,
  // via os dicionários BIBLIOTECA_CATEGORY_TITLES_EN (6 categorias) e
  // ARTICLE_LABELS_EN (55 slugs); `slug` é reaproveitado de
  // BIBLIOTECA_CATEGORIES (fonte única da taxonomia). Todos os 55 artigos
  // já foram publicados em /en/biblioteca/<slug>/ (ver TRANSLATED_PATHS/
  // translatedArticleSlugs, abaixo) — este dicionário cobre o texto
  // (label em inglês) usado tanto pela sidebar quanto pelas páginas
  // traduzidas.
  // ================================================================
  var BIBLIOTECA_CATEGORY_TITLES_EN = {
    "Padrões de Criação": "Creational Patterns",
    "Padrões Estruturais": "Structural Patterns",
    "Padrões Comportamentais": "Behavioral Patterns",
    "Arquiteturas de Software": "Software Architectures",
    "Organização de Código e Repositórios": "Code Organization & Repositories",
    "Conceitos de Infraestrutura e Escala": "Infrastructure & Scale Concepts",
  };

  var ARTICLE_LABELS_EN = {
    // Padrões de Criação
    singleton: "Singleton",
    "factory-method": "Factory Method",
    "abstract-factory": "Abstract Factory",
    builder: "Builder",
    prototype: "Prototype",
    // Padrões Estruturais
    adapter: "Adapter",
    decorator: "Decorator",
    facade: "Facade",
    proxy: "Proxy",
    composite: "Composite",
    bridge: "Bridge",
    flyweight: "Flyweight",
    // Padrões Comportamentais
    strategy: "Strategy",
    observer: "Observer",
    state: "State",
    "template-method": "Template Method",
    command: "Command",
    mediator: "Mediator",
    iterator: "Iterator",
    "chain-of-responsibility": "Chain of Responsibility",
    memento: "Memento",
    visitor: "Visitor",
    interpreter: "Interpreter",
    // Arquiteturas de Software
    mvc: "MVC",
    "arquitetura-em-camadas": "Layered Architecture",
    "arquitetura-hexagonal": "Hexagonal Architecture",
    "clean-architecture": "Clean Architecture",
    "onion-architecture": "Onion Architecture",
    mvp: "MVP",
    mvvm: "MVVM",
    cqrs: "CQRS",
    "event-driven": "Event-Driven Architecture",
    "monolito-vs-microsservicos": "Monolith vs Microservices",
    // Organização de Código e Repositórios
    "monolito-vs-monorepo": "Monorepo vs Multi-repo",
    "feature-vs-layer": "Feature-based vs Layer-based Organization",
    "estrutura-de-pastas": "Folder Structure Best Practices",
    // Conceitos de Infraestrutura e Escala
    "escalabilidade-horizontal-vertical": "Horizontal vs Vertical Scalability",
    "load-balancing": "Load Balancing",
    caching: "Caching",
    "sql-vs-nosql": "SQL vs NoSQL",
    "rest-vs-graphql-vs-grpc": "REST vs GraphQL vs gRPC",
    "filas-de-mensagem": "Message Queues",
    "circuit-breaker": "Circuit Breaker",
    "sla-slo-sli": "SLA, SLO and SLI",
    idempotencia: "Idempotency",
    sharding: "Sharding and Partitioning",
    "replicacao-de-banco": "Database Replication",
    cdn: "CDN",
    "api-gateway": "API Gateway",
    saga: "Saga Pattern",
    outbox: "Outbox Pattern",
    "rate-limiting": "Rate Limiting",
    observabilidade: "Observability",
    "websockets-sse": "WebSockets and SSE",
    consistencia: "Eventual vs Strong Consistency",
  };

  var BIBLIOTECA_CATEGORIES_EN = BIBLIOTECA_CATEGORIES.map(function (category) {
    return {
      title: BIBLIOTECA_CATEGORY_TITLES_EN[category.title] || category.title,
      articles: category.articles.map(function (article) {
        return {
          slug: article.slug,
          label: ARTICLE_LABELS_EN[article.slug] || article.label,
        };
      }),
    };
  });

  // ================================================================
  // BUSCA UNIFICADA DA HOME (ferramentas + artigos da Biblioteca) —
  // só existe em index.html. Mesma técnica de js/biblioteca.js: normaliza
  // a query e compara com String.indexOf (nunca RegExp construída a partir
  // de entrada do usuário); nunca escreve a query digitada no DOM — só
  // alterna `hidden` sobre nós existentes ou montados a partir dos arrays
  // estáticos TOOLS/BIBLIOTECA_CATEGORIES já definidos acima (não é
  // entrada do usuário, então innerHTML aqui segue o mesmo precedente de
  // buildSidebarMarkup/buildBibliotecaAccordion).
  //
  // IMPORTANTE: este bloco precisa vir DEPOIS da declaração de
  // BIBLIOTECA_CATEGORIES (acima) — antes ficava logo no topo da IIFE,
  // antes do `var BIBLIOTECA_CATEGORIES = [...]` mais abaixo no arquivo, o
  // que levava a um TypeError ("Cannot read properties of undefined")
  // só na home (única página com #home-busca): a variável existia via
  // hoisting mas ainda não tinha sido atribuída. A exceção síncrona
  // interrompia o resto da IIFE, e a sidebar (bloco seguinte) nunca era
  // injetada na home. Mantenha este bloco sempre depois dos dados que ele
  // consome.
  // ================================================================
  var buscaHomeInput = document.getElementById("home-busca");

  if (buscaHomeInput) {
    var toolRows = document.querySelectorAll(".tool-row");
    var resultadosSecao = document.getElementById("home-biblioteca-resultados");
    var resultadosGrid = document.getElementById("home-biblioteca-resultados-grid");
    var mensagemVaziaHome = document.getElementById("home-busca-vazio");

    function normalizarHome(texto) {
      return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    // Monta os cards de artigo uma única vez, no load — cada card guarda
    // o texto (já normalizado) de título e categoria em memória (array
    // `artigoCards`), evitando reprocessar textContent a cada tecla digitada.
    var artigoCards = [];

    if (resultadosGrid) {
      var bibCategoriasHome = isEnglishPath(location.pathname)
        ? BIBLIOTECA_CATEGORIES_EN
        : BIBLIOTECA_CATEGORIES;
      var artigosMarkup = bibCategoriasHome.map(function (categoria) {
        return categoria.articles
          .map(function (artigo) {
            return (
              '<a href="biblioteca/' +
              artigo.slug +
              '/" class="tool-card" data-categoria="' +
              categoria.title +
              '">' +
              '<span class="tool-card__title">' +
              artigo.label +
              "</span></a>"
            );
          })
          .join("");
      }).join("");

      resultadosGrid.innerHTML = artigosMarkup;

      Array.prototype.forEach.call(resultadosGrid.querySelectorAll(".tool-card"), function (card) {
        var tituloEl = card.querySelector(".tool-card__title");
        artigoCards.push({
          el: card,
          titulo: normalizarHome(tituloEl ? tituloEl.textContent : ""),
          categoria: normalizarHome(card.getAttribute("data-categoria") || ""),
        });
      });
    }

    function filtrarHome() {
      var termo = normalizarHome(buscaHomeInput.value.trim());
      var termoVazio = termo === "";
      var algumaFerramentaVisivel = false;

      Array.prototype.forEach.call(toolRows, function (row) {
        var tituloEl = row.querySelector(".tool-row__title");
        var descEl = row.querySelector(".tool-row__desc");
        var titulo = tituloEl ? normalizarHome(tituloEl.textContent) : "";
        var desc = descEl ? normalizarHome(descEl.textContent) : "";
        var visivel = termoVazio || titulo.indexOf(termo) !== -1 || desc.indexOf(termo) !== -1;

        row.hidden = !visivel;
        if (visivel) { algumaFerramentaVisivel = true; }
      });

      // Query vazia: nenhum artigo fica visível (a seção inteira some logo
      // abaixo) — não dumpamos os 55 artigos na home por padrão.
      var algumArtigoVisivel = false;

      artigoCards.forEach(function (item) {
        var visivel = !termoVazio && (item.titulo.indexOf(termo) !== -1 || item.categoria.indexOf(termo) !== -1);
        item.el.hidden = !visivel;
        if (visivel) { algumArtigoVisivel = true; }
      });

      if (resultadosSecao) {
        resultadosSecao.hidden = termoVazio || !algumArtigoVisivel;
      }

      if (mensagemVaziaHome) {
        mensagemVaziaHome.hidden = termoVazio || algumaFerramentaVisivel || algumArtigoVisivel;
      }
    }

    buscaHomeInput.addEventListener("input", filtrarHome);

    // Estado inicial (campo pode vir preenchido via autofill do navegador).
    filtrarHome();
  }

  function svgIcon(pathsMarkup) {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
      'focusable="false">' +
      pathsMarkup +
      "</svg>"
    );
  }

  // ================================================================
  // STRINGS DE UI FIXAS (chrome da sidebar/nav) — PT/EN. São o texto que
  // este script injeta no DOM (rótulos, placeholder, aria-label), não
  // conteúdo de página. Selecionadas com uiText(isEnglishPath(pathname)) nos
  // pontos que já recebem/calculam `pathname` — nunca lendo
  // location.pathname de novo dentro de uma função que já tem esse
  // parâmetro/variável no escopo.
  //
  // O grupo "Biblioteca"/"Library" da sidebar tem chrome 100% traduzido
  // (rótulo, filtro, labels de artigo — ver BIBLIOTECA_CATEGORIES_EN) e
  // todos os 55 artigos já têm sua própria versão em /en/biblioteca/<slug>/
  // (ver buildBibliotecaAccordion, abaixo, e TRANSLATED_PATHS/
  // translatedArticleSlugs).
  // ================================================================
  var UI_STRINGS = {
    pt: {
      menuLabel: "Menu",
      closeMenuAriaLabel: "Fechar menu de navegação",
      openMenuAriaLabel: "Abrir menu de navegação",
      collapseMenuAriaLabel: "Recolher menu",
      expandMenuAriaLabel: "Expandir menu",
      sidebarNavAriaLabel: "Navegação de ferramentas",
      toolsGroupTitle: "Ferramentas",
      toolsFilterPlaceholder: "Filtrar ferramentas…",
      toolsFilterAriaLabel: "Filtrar ferramentas por nome",
      toolsFilterEmpty: "Nenhuma ferramenta encontrada.",
      bibliotecaGroupTitle: "Biblioteca",
      bibliotecaFilterPlaceholder: "Filtrar artigos…",
      bibliotecaFilterAriaLabel: "Filtrar artigos por título",
      bibliotecaFilterEmpty: "Nenhum artigo encontrado.",
    },
    en: {
      menuLabel: "Menu",
      closeMenuAriaLabel: "Close navigation menu",
      openMenuAriaLabel: "Open navigation menu",
      collapseMenuAriaLabel: "Collapse menu",
      expandMenuAriaLabel: "Expand menu",
      sidebarNavAriaLabel: "Tools navigation",
      toolsGroupTitle: "Tools",
      toolsFilterPlaceholder: "Filter tools…",
      toolsFilterAriaLabel: "Filter tools by name",
      toolsFilterEmpty: "No tools found.",
      // Todos os 55 artigos da Biblioteca têm tradução publicada (ver
      // TRANSLATED_PATHS/translatedArticleSlugs) — o grupo, o filtro e os
      // labels de artigo estão 100% em inglês (BIBLIOTECA_CATEGORIES_EN), e
      // os hrefs apontam para a versão traduzida de cada artigo (ver
      // buildBibliotecaAccordion). O fallback pt-BR permanece implementado
      // por segurança, mas não é mais exercitado.
      bibliotecaGroupTitle: "Library",
      bibliotecaFilterPlaceholder: "Filter articles…",
      bibliotecaFilterAriaLabel: "Filter articles by title",
      bibliotecaFilterEmpty: "No articles found.",
    },
  };

  function uiText(isEnglish) {
    return isEnglish ? UI_STRINGS.en : UI_STRINGS.pt;
  }

  // Monta o accordion de categorias da Biblioteca — MESMO padrão de
  // buildToolsAccordion (abaixo): escolhe BIBLIOTECA_CATEGORIES vs
  // BIBLIOTECA_CATEGORIES_EN via isEnglishPath(pathname), e decide o
  // prefixo do href por artigo usando translatedArticleSlugs (derivado de
  // TRANSLATED_PATHS filtrando `pt[0] === "biblioteca"`, definido mais
  // abaixo neste arquivo — var já resolvida quando esta função roda, pois só
  // é chamada a partir de buildSidebarMarkup, bem depois no fluxo do
  // script). Por padrão todas as categorias começam fechadas — EXCETO a que
  // contém o artigo atual (quando a página é um artigo da biblioteca), que
  // abre automaticamente e recebe aria-current="page" no link
  // correspondente.
  //
  // Hoje os 55 artigos estão todos em translatedArticleSlugs — todo href
  // aponta para a versão traduzida (prefix + "en/" + "biblioteca/" + slug +
  // "/"). O fallback pt-BR (prefix + "biblioteca/" + slug + "/", sem "en/")
  // continua implementado — evita 404 caso um artigo futuro seja
  // adicionado antes de sua tradução — mesma lição de buildToolsAccordion,
  // abaixo, mas não é mais exercitado hoje.
  function buildBibliotecaAccordion(prefix, pathname) {
    var isEnglish = isEnglishPath(pathname);
    var categories = isEnglish ? BIBLIOTECA_CATEGORIES_EN : BIBLIOTECA_CATEGORIES;

    return categories.map(function (category, catIndex) {
      var panelId = "sidebar-bib-panel-" + catIndex;
      var categoryHasActiveArticle = category.articles.some(function (article) {
        return pathname.indexOf("/biblioteca/" + article.slug + "/") !== -1;
      });

      var articleLinks = category.articles
        .map(function (article) {
          var articlePrefix =
            isEnglish && translatedArticleSlugs.indexOf(article.slug) !== -1 ? prefix + "en/" : prefix;
          var href = articlePrefix + "biblioteca/" + article.slug + "/";
          var isActive = pathname.indexOf("/biblioteca/" + article.slug + "/") !== -1;
          var current = isActive ? ' aria-current="page"' : "";
          return (
            '<li><a class="sidebar__link sidebar__link--nested" href="' +
            href +
            '" title="' +
            article.label +
            '"' +
            current +
            ">" +
            '<span class="sidebar__link-label">' +
            article.label +
            "</span></a></li>"
          );
        })
        .join("");

      return (
        '<div class="sidebar__accordion-item">' +
        '<button type="button" class="sidebar__accordion-trigger" aria-expanded="' +
        (categoryHasActiveArticle ? "true" : "false") +
        '" aria-controls="' +
        panelId +
        '">' +
        svgIcon(CHEVRON_ICON) +
        '<span class="sidebar__accordion-label">' +
        category.title +
        "</span>" +
        "</button>" +
        '<ul class="sidebar__accordion-panel" id="' +
        panelId +
        '"' +
        (categoryHasActiveArticle ? "" : " hidden") +
        ">" +
        articleLinks +
        "</ul>" +
        "</div>"
      );
    }).join("");
  }

  // Monta o accordion de categorias das Ferramentas — MESMO componente de
  // buildBibliotecaAccordion (mesmas classes sidebar__accordion-item/
  // -trigger/-panel, mesmo comportamento de abrir/fechar e mesma regra de
  // "categoria com item ativo expandida por padrão"). Única diferença
  // deliberada: cada ferramenta mantém seu próprio ícone (37 ícones já
  // desenhados em TOOLS), então os <li> usam "sidebar__link" (com ícone),
  // não "sidebar__link--nested" (sem ícone) como os artigos da Biblioteca —
  // não dá pra ter 37 ícones únicos por artigo, mas dá pra ter por
  // ferramenta, e o padrão visual já existia antes desta unificação.
  //
  // Em páginas /en/* usa TOOLS_EN/TOOL_CATEGORIES_EN (só o label/title muda).
  // O href de cada ferramenta só ganha o segmento "en/" quando o slug já
  // está em translatedToolSlugs (derivado de TRANSLATED_PATHS, definido mais
  // abaixo neste arquivo — var já resolvida quando esta função roda, pois só
  // é chamada a partir de buildSidebarMarkup/buildLanguageSwitchMarkup, bem
  // depois no fluxo do script). Hoje todas as 37 ferramentas estão em
  // translatedToolSlugs, então todo href aponta para /en/tools/<slug>/. O
  // fallback pt-BR (tools/<slug>/, sem "en/") continua implementado — evita
  // 404 caso uma ferramenta futura seja adicionada antes de sua tradução.
  function buildToolsAccordion(prefix, pathname) {
    var isEnglish = isEnglishPath(pathname);
    var tools = isEnglish ? TOOLS_EN : TOOLS;
    var categories = isEnglish ? TOOL_CATEGORIES_EN : TOOL_CATEGORIES;

    var toolsBySlug = {};
    tools.forEach(function (tool) {
      toolsBySlug[tool.slug] = tool;
    });

    return categories.map(function (category, catIndex) {
      var panelId = "sidebar-tools-panel-" + catIndex;
      var categoryHasActiveTool = category.slugs.some(function (slug) {
        return pathname.indexOf("/tools/" + slug + "/") !== -1;
      });

      var toolLinks = category.slugs
        .map(function (slug) {
          var tool = toolsBySlug[slug];
          if (!tool) {
            return "";
          }
          var toolPrefix =
            isEnglish && translatedToolSlugs.indexOf(tool.slug) !== -1 ? prefix + "en/" : prefix;
          var href = toolPrefix + "tools/" + tool.slug + "/";
          var isActive = pathname.indexOf("/tools/" + tool.slug + "/") !== -1;
          var current = isActive ? ' aria-current="page"' : "";
          return (
            '<li><a class="sidebar__link" href="' +
            href +
            '" title="' +
            tool.label +
            '"' +
            current +
            ">" +
            svgIcon(tool.icon) +
            '<span class="sidebar__link-label">' +
            tool.label +
            "</span></a></li>"
          );
        })
        .join("");

      return (
        '<div class="sidebar__accordion-item">' +
        '<button type="button" class="sidebar__accordion-trigger" aria-expanded="' +
        (categoryHasActiveTool ? "true" : "false") +
        '" aria-controls="' +
        panelId +
        '">' +
        svgIcon(CHEVRON_ICON) +
        '<span class="sidebar__accordion-label">' +
        category.title +
        "</span>" +
        "</button>" +
        '<ul class="sidebar__accordion-panel" id="' +
        panelId +
        '"' +
        (categoryHasActiveTool ? "" : " hidden") +
        ">" +
        toolLinks +
        "</ul>" +
        "</div>"
      );
    }).join("");
  }

  function buildSidebarMarkup(prefix, pathname) {
    var t = uiText(isEnglishPath(pathname));
    return (
      '<div class="sidebar__panel">' +
      '<div class="sidebar__top">' +
      '<span class="sidebar__top-label">' +
      t.menuLabel +
      "</span>" +
      '<button type="button" class="sidebar__close" id="sidebar-close" aria-label="' +
      t.closeMenuAriaLabel +
      '">' +
      svgIcon('<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>') +
      "</button>" +
      "</div>" +
      '<div class="sidebar__desktop-controls">' +
      '<button type="button" class="sidebar__collapse-toggle" id="sidebar-collapse-toggle" ' +
      'aria-controls="site-sidebar" aria-expanded="true" aria-label="' +
      t.collapseMenuAriaLabel +
      '">' +
      svgIcon('<path d="M14 6l-6 6 6 6"/>') +
      "</button>" +
      "</div>" +
      '<div class="sidebar__group">' +
      '<p class="sidebar__group-title">' +
      t.toolsGroupTitle +
      "</p>" +
      '<div class="sidebar__search">' +
      '<input type="search" id="sidebar-busca" class="sidebar__search-input" ' +
      'placeholder="' +
      t.toolsFilterPlaceholder +
      '" aria-label="' +
      t.toolsFilterAriaLabel +
      '" autocomplete="off" />' +
      "</div>" +
      '<div class="sidebar__accordion sidebar__accordion--tools" id="sidebar-tools-accordion">' +
      buildToolsAccordion(prefix, pathname) +
      "</div>" +
      '<p class="sidebar__search-empty" id="sidebar-busca-vazio" role="status" aria-live="polite" hidden>' +
      t.toolsFilterEmpty +
      "</p>" +
      "</div>" +
      '<div class="sidebar__group">' +
      '<p class="sidebar__group-title">' +
      t.bibliotecaGroupTitle +
      "</p>" +
      '<div class="sidebar__search">' +
      '<input type="search" id="sidebar-biblioteca-busca" class="sidebar__search-input" ' +
      'placeholder="' +
      t.bibliotecaFilterPlaceholder +
      '" aria-label="' +
      t.bibliotecaFilterAriaLabel +
      '" autocomplete="off" />' +
      "</div>" +
      '<div class="sidebar__accordion" id="sidebar-biblioteca-accordion">' +
      buildBibliotecaAccordion(prefix, pathname) +
      "</div>" +
      '<p class="sidebar__search-empty" id="sidebar-biblioteca-busca-vazio" role="status" aria-live="polite" hidden>' +
      t.bibliotecaFilterEmpty +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  // ================================================================
  // SELETOR DE IDIOMA (PT/EN) — injetado em .nav__links (ver bloco
  // "var navEl", abaixo). Ferramentas e a home usam o MESMO slug nos dois
  // idiomas (/tools/json/ em pt e em en — decisão de arquitetura da
  // tradução do site), mas páginas institucionais mudam de slug
  // (pages/sobre.html <-> en/pages/about.html) — por isso o alvo do link
  // não é um simples "insere/remove en/" no pathname, e sim uma tabela de
  // correspondência 1:1.
  //
  // TRANSLATED_PATHS lista os pares de path (em SEGMENTOS, no mesmo formato
  // de pathSegments/computeRelativePrefix, SEM o "en/" inicial e sem barras
  // nas pontas) que já têm tradução publicada — hoje as 37 ferramentas, os
  // 55 artigos da Biblioteca e as páginas institucionais/home. Quando o
  // path atual não está na tabela, o seletor cai no fallback "home do
  // idioma alvo" — evita montar uma URL 1:1 para uma página que ainda não
  // existe (404), rede de segurança para conteúdo futuro.
  // ================================================================
  var TRANSLATED_PATHS = [
    { pt: [], en: [] }, // home via "/"
    { pt: ["index.html"], en: ["index.html"] }, // home via "/index.html"
    { pt: ["pages", "sobre.html"], en: ["pages", "about.html"] },
    { pt: ["pages", "contato.html"], en: ["pages", "contact.html"] },
    { pt: ["tools", "json"], en: ["tools", "json"] },
    { pt: ["tools", "cpf-cnpj"], en: ["tools", "cpf-cnpj"] },
    { pt: ["tools", "cep"], en: ["tools", "cep"] },
    { pt: ["tools", "endereco"], en: ["tools", "endereco"] },
    { pt: ["tools", "cartao"], en: ["tools", "cartao"] },
    { pt: ["tools", "conta-bancaria"], en: ["tools", "conta-bancaria"] },
    { pt: ["tools", "conversor-moeda"], en: ["tools", "conversor-moeda"] },
    { pt: ["tools", "salario-pj-clt"], en: ["tools", "salario-pj-clt"] },
    { pt: ["tools", "pix"], en: ["tools", "pix"] },
    { pt: ["tools", "sql"], en: ["tools", "sql"] },
    { pt: ["tools", "csv-json"], en: ["tools", "csv-json"] },
    { pt: ["tools", "yaml-json"], en: ["tools", "yaml-json"] },
    { pt: ["tools", "json-para-typescript"], en: ["tools", "json-para-typescript"] },
    { pt: ["tools", "diff"], en: ["tools", "diff"] },
    { pt: ["tools", "markdown"], en: ["tools", "markdown"] },
    { pt: ["tools", "regex"], en: ["tools", "regex"] },
    { pt: ["tools", "contador-caracteres"], en: ["tools", "contador-caracteres"] },
    { pt: ["tools", "mock-data"], en: ["tools", "mock-data"] },
    { pt: ["tools", "escopo"], en: ["tools", "escopo"] },
    { pt: ["tools", "xml"], en: ["tools", "xml"] },
    { pt: ["tools", "senha"], en: ["tools", "senha"] },
    { pt: ["tools", "hash"], en: ["tools", "hash"] },
    { pt: ["tools", "jwt"], en: ["tools", "jwt"] },
    { pt: ["tools", "uuid"], en: ["tools", "uuid"] },
    { pt: ["tools", "base64"], en: ["tools", "base64"] },
    { pt: ["tools", "cidr"], en: ["tools", "cidr"] },
    { pt: ["tools", "cron"], en: ["tools", "cron"] },
    { pt: ["tools", "timestamp"], en: ["tools", "timestamp"] },
    { pt: ["tools", "fuso-horario"], en: ["tools", "fuso-horario"] },
    { pt: ["tools", "qrcode"], en: ["tools", "qrcode"] },
    { pt: ["tools", "meta-tags"], en: ["tools", "meta-tags"] },
    { pt: ["tools", "gitignore"], en: ["tools", "gitignore"] },
    { pt: ["tools", "horas-trabalhadas"], en: ["tools", "horas-trabalhadas"] },
    { pt: ["tools", "conversor-case"], en: ["tools", "conversor-case"] },
    { pt: ["tools", "base-numerica"], en: ["tools", "base-numerica"] },
    { pt: ["tools", "cor"], en: ["tools", "cor"] },
    { pt: ["tools", "css-gradient"], en: ["tools", "css-gradient"] },
    // Índice da Biblioteca (biblioteca/index.html <-> en/biblioteca/index.html)
    // — path de conteúdo é só "biblioteca" (sem slug de
    // artigo, ao contrário das entradas "tools" acima), então
    // segmentsToPath trata como diretório (sem "." no último segmento) e
    // resolve para "biblioteca/". Habilita o seletor de idioma em
    // biblioteca/index.html ⇄ en/biblioteca/index.html.
    { pt: ["biblioteca"], en: ["biblioteca"] },
    { pt: ["biblioteca", "index.html"], en: ["biblioteca", "index.html"] },
    // Artigos da Biblioteca — mesmo formato
    // { pt: ["biblioteca", "<slug>"], en: [...] } das entradas "tools"
    // acima. Cada entrada habilita o seletor de idioma no artigo e faz
    // translatedArticleSlugs (abaixo) incluir o slug, o que faz
    // buildBibliotecaAccordion apontar o link da sidebar para
    // en/biblioteca/<slug>/ em vez do fallback pt-BR. Agrupadas por
    // categoria (ver BIBLIOTECA_CATEGORIES, acima) só para facilitar leitura
    // — a ordem não afeta o comportamento.
    // Padrões de Criação
    { pt: ["biblioteca", "singleton"], en: ["biblioteca", "singleton"] },
    { pt: ["biblioteca", "factory-method"], en: ["biblioteca", "factory-method"] },
    { pt: ["biblioteca", "abstract-factory"], en: ["biblioteca", "abstract-factory"] },
    { pt: ["biblioteca", "builder"], en: ["biblioteca", "builder"] },
    { pt: ["biblioteca", "prototype"], en: ["biblioteca", "prototype"] },
    // Padrões Estruturais
    { pt: ["biblioteca", "adapter"], en: ["biblioteca", "adapter"] },
    { pt: ["biblioteca", "decorator"], en: ["biblioteca", "decorator"] },
    { pt: ["biblioteca", "facade"], en: ["biblioteca", "facade"] },
    { pt: ["biblioteca", "proxy"], en: ["biblioteca", "proxy"] },
    { pt: ["biblioteca", "composite"], en: ["biblioteca", "composite"] },
    { pt: ["biblioteca", "bridge"], en: ["biblioteca", "bridge"] },
    { pt: ["biblioteca", "flyweight"], en: ["biblioteca", "flyweight"] },
    // Padrões Comportamentais
    { pt: ["biblioteca", "strategy"], en: ["biblioteca", "strategy"] },
    { pt: ["biblioteca", "observer"], en: ["biblioteca", "observer"] },
    { pt: ["biblioteca", "state"], en: ["biblioteca", "state"] },
    { pt: ["biblioteca", "template-method"], en: ["biblioteca", "template-method"] },
    { pt: ["biblioteca", "command"], en: ["biblioteca", "command"] },
    { pt: ["biblioteca", "mediator"], en: ["biblioteca", "mediator"] },
    { pt: ["biblioteca", "iterator"], en: ["biblioteca", "iterator"] },
    { pt: ["biblioteca", "chain-of-responsibility"], en: ["biblioteca", "chain-of-responsibility"] },
    { pt: ["biblioteca", "memento"], en: ["biblioteca", "memento"] },
    { pt: ["biblioteca", "visitor"], en: ["biblioteca", "visitor"] },
    { pt: ["biblioteca", "interpreter"], en: ["biblioteca", "interpreter"] },
    // Arquiteturas de Software
    { pt: ["biblioteca", "mvc"], en: ["biblioteca", "mvc"] },
    { pt: ["biblioteca", "arquitetura-em-camadas"], en: ["biblioteca", "arquitetura-em-camadas"] },
    { pt: ["biblioteca", "arquitetura-hexagonal"], en: ["biblioteca", "arquitetura-hexagonal"] },
    { pt: ["biblioteca", "clean-architecture"], en: ["biblioteca", "clean-architecture"] },
    { pt: ["biblioteca", "onion-architecture"], en: ["biblioteca", "onion-architecture"] },
    { pt: ["biblioteca", "mvp"], en: ["biblioteca", "mvp"] },
    { pt: ["biblioteca", "mvvm"], en: ["biblioteca", "mvvm"] },
    { pt: ["biblioteca", "cqrs"], en: ["biblioteca", "cqrs"] },
    { pt: ["biblioteca", "event-driven"], en: ["biblioteca", "event-driven"] },
    { pt: ["biblioteca", "monolito-vs-microsservicos"], en: ["biblioteca", "monolito-vs-microsservicos"] },
    // Organização de Código e Repositórios
    { pt: ["biblioteca", "monolito-vs-monorepo"], en: ["biblioteca", "monolito-vs-monorepo"] },
    { pt: ["biblioteca", "feature-vs-layer"], en: ["biblioteca", "feature-vs-layer"] },
    { pt: ["biblioteca", "estrutura-de-pastas"], en: ["biblioteca", "estrutura-de-pastas"] },
    // Conceitos de Infraestrutura e Escala
    { pt: ["biblioteca", "escalabilidade-horizontal-vertical"], en: ["biblioteca", "escalabilidade-horizontal-vertical"] },
    { pt: ["biblioteca", "load-balancing"], en: ["biblioteca", "load-balancing"] },
    { pt: ["biblioteca", "caching"], en: ["biblioteca", "caching"] },
    { pt: ["biblioteca", "sql-vs-nosql"], en: ["biblioteca", "sql-vs-nosql"] },
    { pt: ["biblioteca", "rest-vs-graphql-vs-grpc"], en: ["biblioteca", "rest-vs-graphql-vs-grpc"] },
    { pt: ["biblioteca", "filas-de-mensagem"], en: ["biblioteca", "filas-de-mensagem"] },
    { pt: ["biblioteca", "circuit-breaker"], en: ["biblioteca", "circuit-breaker"] },
    { pt: ["biblioteca", "sla-slo-sli"], en: ["biblioteca", "sla-slo-sli"] },
    { pt: ["biblioteca", "idempotencia"], en: ["biblioteca", "idempotencia"] },
    { pt: ["biblioteca", "sharding"], en: ["biblioteca", "sharding"] },
    { pt: ["biblioteca", "replicacao-de-banco"], en: ["biblioteca", "replicacao-de-banco"] },
    { pt: ["biblioteca", "cdn"], en: ["biblioteca", "cdn"] },
    { pt: ["biblioteca", "api-gateway"], en: ["biblioteca", "api-gateway"] },
    { pt: ["biblioteca", "saga"], en: ["biblioteca", "saga"] },
    { pt: ["biblioteca", "outbox"], en: ["biblioteca", "outbox"] },
    { pt: ["biblioteca", "rate-limiting"], en: ["biblioteca", "rate-limiting"] },
    { pt: ["biblioteca", "observabilidade"], en: ["biblioteca", "observabilidade"] },
    { pt: ["biblioteca", "websockets-sse"], en: ["biblioteca", "websockets-sse"] },
    { pt: ["biblioteca", "consistencia"], en: ["biblioteca", "consistencia"] },
  ];

  /**
   * Slugs de ferramenta que já têm versão publicada em /en/tools/<slug>/ —
   * derivado de TRANSLATED_PATHS (única fonte de verdade) filtrando as
   * entradas cujo path pt começa em "tools" e pegando o segundo segmento
   * (o slug). Usado por buildToolsAccordion para decidir, em páginas /en/*,
   * se o link de cada ferramenta aponta para a versão traduzida
   * (en/tools/<slug>/) ou cai no fallback pt-BR (tools/<slug>/, sem "en/")
   * quando a ferramenta ainda não foi publicada em inglês (evita 404 — ver
   * comentário de buildToolsAccordion). Hoje cobre as 37 ferramentas; cresce
   * sozinho se TRANSLATED_PATHS ganhar novas entradas de ferramenta.
   */
  var translatedToolSlugs = TRANSLATED_PATHS.filter(function (entry) {
    return entry.pt[0] === "tools";
  }).map(function (entry) {
    return entry.pt[1];
  });

  /**
   * Slugs de artigo da Biblioteca que já têm versão publicada em
   * /en/biblioteca/<slug>/ — mesmo princípio de translatedToolSlugs, mas
   * filtrando `pt[0] === "biblioteca"` e pegando o segundo segmento. Hoje
   * cobre os 55 artigos; o fallback pt-BR em buildBibliotecaAccordion
   * permanece como rede de segurança para artigos futuros adicionados
   * antes de sua tradução.
   */
  var translatedArticleSlugs = TRANSLATED_PATHS.filter(function (entry) {
    return (
      entry.pt[0] === "biblioteca" &&
      entry.pt.length > 1 &&
      entry.pt[1] !== "index.html"
    );
  }).map(function (entry) {
    return entry.pt[1];
  });

  /**
   * Reconstrói um path (string) a partir de segmentos. Segmento final sem
   * "." é tratado como diretório (ex.: ["tools","json"] -> "tools/json/" —
   * padrão de todas as páginas de ferramenta neste site, ver CLAUDE.md).
   * Lista vazia é a home ("index.html").
   */
  function segmentsToPath(segments) {
    if (segments.length === 0) {
      return "index.html";
    }
    var joined = segments.join("/");
    var lastSegment = segments[segments.length - 1];
    var isDirectory = lastSegment.indexOf(".") === -1;
    return isDirectory ? joined + "/" : joined;
  }

  /**
   * Monta o href (sempre RELATIVO — nunca "/en/...", ver CLAUDE.md) do link
   * que troca para `targetEnglish`. Retorna null se a página já estiver no
   * idioma alvo (não deveria ser chamado nesse caso — ver
   * buildLanguageSwitchMarkup).
   */
  function buildLanguageSwitchHref(pathname, targetEnglish) {
    var currentlyEnglish = isEnglishPath(pathname);
    if (targetEnglish === currentlyEnglish) {
      return null;
    }

    var rawSegments = pathSegments(pathname);
    var contentSegments = currentlyEnglish ? rawSegments.slice(1) : rawSegments;
    var contentKey = contentSegments.join("/");
    var fromKey = currentlyEnglish ? "en" : "pt";
    var toKey = targetEnglish ? "en" : "pt";

    var match = null;
    TRANSLATED_PATHS.some(function (entry) {
      if (entry[fromKey].join("/") === contentKey) {
        match = entry;
        return true;
      }
      return false;
    });

    // Sem tradução 1:1 disponível para este path -> cai na home do idioma
    // alvo (ver comentário de TRANSLATED_PATHS, acima). Rede de segurança
    // para páginas futuras adicionadas antes de sua tradução — hoje quase
    // todo path do site já está na tabela.
    var targetSegments = match ? match[toKey] : [];
    var targetPath = segmentsToPath(targetSegments);
    var prefix = computeRelativePrefix(pathname);

    return targetEnglish ? prefix + "en/" + targetPath : prefix + targetPath;
  }

  // Marca visualmente o idioma atual com uma classe + aria-current (no lugar
  // de link) e o outro idioma como link de fato — evita um link "morto"
  // (href="#") apontando pra própria página. Conteúdo estático (sem entrada
  // de usuário), então innerHTML segue o mesmo precedente já usado em
  // buildSidebarMarkup/buildToolsAccordion acima.
  function buildLanguageSwitchMarkup(pathname) {
    var currentlyEnglish = isEnglishPath(pathname);

    var ptMarkup = currentlyEnglish
      ? '<a class="nav__lang-link" href="' +
        buildLanguageSwitchHref(pathname, false) +
        '" lang="pt-BR" hreflang="pt-BR">PT</a>'
      : '<span class="nav__lang-link nav__lang-link--current" aria-current="page" lang="pt-BR">PT</span>';

    var enMarkup = currentlyEnglish
      ? '<span class="nav__lang-link nav__lang-link--current" aria-current="page" lang="en">EN</span>'
      : '<a class="nav__lang-link" href="' +
        buildLanguageSwitchHref(pathname, true) +
        '" lang="en" hreflang="en">EN</a>';

    return (
      '<li class="nav__lang">' + ptMarkup + '<span class="nav__lang-sep" aria-hidden="true">/</span>' + enMarkup + "</li>"
    );
  }

  var navEl = document.querySelector(".site-header .nav");
  if (navEl && !document.getElementById("site-sidebar")) {
    var pathname = window.location.pathname;
    var prefix = computeRelativePrefix(pathname);
    // Calculado uma única vez aqui e reaproveitado por todo este bloco
    // (aria-label da sidebar, do hambúrguer e do collapse-toggle) — nunca
    // relido via location.pathname dentro das funções abaixo.
    var t = uiText(isEnglishPath(pathname));

    // Overlay (mobile) — clique fora fecha o drawer.
    var overlay = document.createElement("div");
    overlay.className = "sidebar__overlay";
    overlay.id = "site-sidebar-overlay";
    overlay.hidden = true;

    // Painel da sidebar — conteúdo estático controlado por este script
    // (não há entrada de usuário envolvida), montado via template strings.
    var sidebar = document.createElement("nav");
    sidebar.className = "sidebar";
    sidebar.id = "site-sidebar";
    sidebar.setAttribute("aria-label", t.sidebarNavAriaLabel);
    sidebar.innerHTML = buildSidebarMarkup(prefix, pathname);

    // ================================================================
    // FILTRO DA SIDEBAR — mesmo princípio de js/biblioteca.js (bloco 2):
    // input nativo, comparação em memória com String.indexOf sobre texto
    // normalizado, e toggle de `hidden` sobre os <li> já renderizados por
    // buildSidebarMarkup acima (que é conteúdo estático, sem entrada de
    // usuário — ver comentário na declaração de `sidebar`). O termo
    // digitado pelo usuário NUNCA é escrito de volta no DOM (nem via
    // innerHTML, nem via template string): só é comparado em memória.
    //
    // Os grupos "Ferramentas" e "Biblioteca" usam o MESMO componente
    // (accordion de categorias, ver buildToolsAccordion/
    // buildBibliotecaAccordion) e agora também o MESMO padrão de busca —
    // criarFiltroAccordion é a lógica compartilhada entre os dois, só
    // parametrizada pelo container/input/mensagem de cada grupo.
    // ================================================================
    function normalizarSidebar(texto) {
      return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    // Monta o filtro de um accordion (Ferramentas OU Biblioteca): esconde
    // os <li> sem match e abre automaticamente toda categoria com pelo
    // menos 1 resultado visível (fecha as que ficarem sem nenhum). Ao
    // limpar o campo, restaura o estado padrão — a categoria que já vinha
    // aberta por conter a página atual (ou nenhuma, fora dela) — capturado
    // uma única vez em `defaultExpandedId`, antes de qualquer filtragem.
    // Usa `setAccordionExpanded`, definida mais abaixo (function
    // declaration — hoisted para todo este bloco, então já está disponível
    // aqui). Retorna a função de filtro (para reuso no handler de
    // collapse) ou `null` se o container/input não existir nesta página.
    function criarFiltroAccordion(accordionEl, inputEl, emptyEl) {
      if (!accordionEl || !inputEl) {
        return null;
      }

      var items = Array.prototype.slice.call(
        accordionEl.querySelectorAll(".sidebar__accordion-panel > li")
      );
      var triggers = Array.prototype.slice.call(
        accordionEl.querySelectorAll(".sidebar__accordion-trigger")
      );
      var defaultExpandedId = null;

      triggers.forEach(function (trigger) {
        if (trigger.getAttribute("aria-expanded") === "true") {
          defaultExpandedId = trigger.getAttribute("aria-controls");
        }
      });

      function filtrar() {
        var termo = normalizarSidebar(inputEl.value.trim());
        var termoVazio = termo === "";
        var algumVisivel = false;
        var panelsComResultado = {};

        items.forEach(function (item) {
          var labelEl = item.querySelector(".sidebar__link-label");
          var label = labelEl ? normalizarSidebar(labelEl.textContent) : "";
          var visivel = termoVazio || label.indexOf(termo) !== -1;

          item.hidden = !visivel;
          if (visivel) {
            algumVisivel = true;
            var panelEl = item.parentNode;
            if (panelEl && panelEl.id) {
              panelsComResultado[panelEl.id] = true;
            }
          }
        });

        triggers.forEach(function (trigger) {
          var panelId = trigger.getAttribute("aria-controls");
          var expanded = termoVazio
            ? panelId === defaultExpandedId
            : Boolean(panelsComResultado[panelId]);
          setAccordionExpanded(trigger, expanded);
        });

        if (emptyEl) {
          emptyEl.hidden = termoVazio || algumVisivel;
        }
      }

      inputEl.addEventListener("input", filtrar);

      return filtrar;
    }

    var sidebarBuscaInput = sidebar.querySelector("#sidebar-busca");
    var sidebarBuscaVazio = sidebar.querySelector("#sidebar-busca-vazio");
    var sidebarToolsAccordionEl = sidebar.querySelector("#sidebar-tools-accordion");
    var filtrarSidebarFerramentas = criarFiltroAccordion(
      sidebarToolsAccordionEl,
      sidebarBuscaInput,
      sidebarBuscaVazio
    );

    var sidebarBibliotecaBuscaInput = sidebar.querySelector("#sidebar-biblioteca-busca");
    var sidebarBibliotecaBuscaVazio = sidebar.querySelector("#sidebar-biblioteca-busca-vazio");
    var sidebarBibliotecaAccordionEl = sidebar.querySelector("#sidebar-biblioteca-accordion");
    var filtrarSidebarBiblioteca = criarFiltroAccordion(
      sidebarBibliotecaAccordionEl,
      sidebarBibliotecaBuscaInput,
      sidebarBibliotecaBuscaVazio
    );

    // Preferência de collapse (modo desktop) — persistida em localStorage.
    // Lida/aplicada aqui, ANTES do appendChild, para chegar ao DOM já no
    // estado certo e reduzir o flash de "expandido -> colapsado" no load.
    // Limitação conhecida: como main.js é carregado no fim do <body> (sem
    // script inline no <head>, para não editar as 71 páginas do site), um
    // pequeno flash ainda pode ocorrer em conexões lentas, entre o primeiro
    // paint da página e a execução deste script — é o trade-off aceito de
    // não termos build/SSR neste site estático.
    var collapseBtn = sidebar.querySelector("#sidebar-collapse-toggle");

    function getStoredCollapsedPreference() {
      try {
        return window.localStorage.getItem("sidebar-collapsed") === "1";
      } catch (e) {
        return false;
      }
    }

    function storeCollapsedPreference(collapsed) {
      try {
        window.localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
      } catch (e) {
        // localStorage pode estar indisponível (modo privado, cookies
        // bloqueados etc.) — nesse caso a preferência simplesmente não
        // persiste entre sessões, sem quebrar a funcionalidade.
      }
    }

    function applyCollapsedState(collapsed, persist) {
      sidebar.classList.toggle("is-collapsed", collapsed);
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      if (collapseBtn) {
        collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        collapseBtn.setAttribute("aria-label", collapsed ? t.expandMenuAriaLabel : t.collapseMenuAriaLabel);
      }
      // O rail colapsado (só ícones) esconde os campos de filtro via CSS —
      // se um filtro estivesse ativo, ícones "sumiriam" sem explicação
      // visível (o campo que os esconderia está fora de vista). Limpa os
      // dois filtros (Ferramentas e Biblioteca) ao colapsar, para o rail
      // sempre mostrar as 35 ferramentas (o CSS específico do rail força
      // todas as categorias "abertas" nesse modo — ver .sidebar__accordion--tools
      // em css/styles.css).
      if (collapsed) {
        if (sidebarBuscaInput) {
          sidebarBuscaInput.value = "";
          if (filtrarSidebarFerramentas) {
            filtrarSidebarFerramentas();
          }
        }
        if (sidebarBibliotecaBuscaInput) {
          sidebarBibliotecaBuscaInput.value = "";
          if (filtrarSidebarBiblioteca) {
            filtrarSidebarBiblioteca();
          }
        }
      }
      if (persist) {
        storeCollapsedPreference(collapsed);
      }
    }

    applyCollapsedState(getStoredCollapsedPreference(), false);

    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    // Botão hambúrguer — injetado como primeiro filho do <nav> do header.
    var toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "sidebar__toggle";
    toggleBtn.id = "sidebar-toggle";
    toggleBtn.setAttribute("aria-controls", "site-sidebar");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-label", t.openMenuAriaLabel);
    toggleBtn.innerHTML = svgIcon(
      '<line x1="3.5" y1="6.5" x2="20.5" y2="6.5"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><line x1="3.5" y1="17.5" x2="20.5" y2="17.5"/>'
    );
    navEl.insertBefore(toggleBtn, navEl.firstChild);

    // Seletor de idioma (PT/EN) — injetado no <ul class="nav__links"> do
    // <nav> horizontal (existe em toda página, ao lado dos links Início/
    // Biblioteca/Sobre/Contato). Reaproveita `pathname`/`prefix` já
    // calculados acima neste bloco. Guarda contra dupla injeção (mesmo
    // princípio de `!document.getElementById("site-sidebar")` no `if` que
    // envolve todo este bloco).
    var navLinksEl = navEl.querySelector(".nav__links");
    if (navLinksEl && !navLinksEl.querySelector(".nav__lang")) {
      navLinksEl.insertAdjacentHTML("beforeend", buildLanguageSwitchMarkup(pathname));
    }

    var closeBtn = document.getElementById("sidebar-close");
    var desktopQuery = window.matchMedia("(min-width: 900px)");

    function syncInert() {
      if (desktopQuery.matches) {
        sidebar.inert = false;
      } else {
        sidebar.inert = !sidebar.classList.contains("is-open");
      }
    }

    // Contenção de foco (mobile): enquanto o drawer está aberto, o restante
    // da página (header, main, footer) vira inert — não é focável nem
    // acessível a leitores de tela — para não vazar o Tab por trás do
    // overlay. Guardamos os elementos marcados para reverter com precisão.
    var inertedBackgroundEls = [];

    function trapBackground(shouldTrap) {
      if (shouldTrap) {
        inertedBackgroundEls = [];
        Array.prototype.forEach.call(document.body.children, function (el) {
          if (el !== sidebar && el !== overlay) {
            el.inert = true;
            inertedBackgroundEls.push(el);
          }
        });
      } else {
        inertedBackgroundEls.forEach(function (el) {
          el.inert = false;
        });
        inertedBackgroundEls = [];
      }
    }

    function openSidebar() {
      sidebar.classList.add("is-open");
      overlay.hidden = false;
      toggleBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("sidebar-locked");
      syncInert();
      if (!desktopQuery.matches) {
        trapBackground(true);
        // Move o foco para dentro do drawer (botão de fechar) — evita que
        // o Tab continue navegando por trás do overlay.
        if (closeBtn) {
          closeBtn.focus();
        }
      }
    }

    function closeSidebar() {
      var wasOpenOnMobile = sidebar.classList.contains("is-open") && !desktopQuery.matches;
      sidebar.classList.remove("is-open");
      overlay.hidden = true;
      toggleBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("sidebar-locked");
      // Libera o conteúdo de fundo ANTES de tentar focar o hambúrguer —
      // senão toggleBtn.focus() falharia se ainda estivesse inert.
      trapBackground(false);
      syncInert();
      if (wasOpenOnMobile) {
        toggleBtn.focus();
      }
    }

    toggleBtn.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeSidebar);
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        applyCollapsedState(!sidebar.classList.contains("is-collapsed"), true);
      });
    }

    // Accordion de categorias — abertura única DENTRO DE CADA GRUPO
    // (Ferramentas e Biblioteca são independentes entre si): abrir uma
    // categoria fecha qualquer outra do MESMO grupo que esteja aberta no
    // momento (evita a sidebar ficar "cheia" com várias categorias
    // expandidas ao mesmo tempo), sem interferir no accordion do grupo
    // vizinho. O estado inicial (categoria da página atual auto-expandida)
    // é definido em buildToolsAccordion/buildBibliotecaAccordion, acima, e
    // não é afetado por este handler.
    function setAccordionExpanded(triggerEl, expanded) {
      var panelId = triggerEl.getAttribute("aria-controls");
      var panelEl = panelId ? document.getElementById(panelId) : null;
      triggerEl.setAttribute("aria-expanded", String(expanded));
      if (panelEl) {
        panelEl.hidden = !expanded;
      }
    }

    var accordionContainers = sidebar.querySelectorAll(".sidebar__accordion");

    Array.prototype.forEach.call(accordionContainers, function (container) {
      var triggersDoGrupo = container.querySelectorAll(".sidebar__accordion-trigger");

      Array.prototype.forEach.call(triggersDoGrupo, function (trigger) {
        trigger.addEventListener("click", function () {
          var isExpanded = trigger.getAttribute("aria-expanded") === "true";
          var nextExpanded = !isExpanded;

          if (nextExpanded) {
            Array.prototype.forEach.call(triggersDoGrupo, function (otherTrigger) {
              if (otherTrigger !== trigger && otherTrigger.getAttribute("aria-expanded") === "true") {
                setAccordionExpanded(otherTrigger, false);
              }
            });
          }

          setAccordionExpanded(trigger, nextExpanded);
        });
      });
    });

    overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
        closeSidebar();
      }
    });

    // Ao cruzar o breakpoint desktop, garante que o estado mobile
    // (drawer aberto / scroll travado) não fique "preso".
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", function () {
        closeSidebar();
      });
    }

    syncInert();
  }

  // ================================================================
  // ADS — colapso gracioso de slots do AdSense não preenchidos.
  // Cada bloco de anúncio (<section class="ad"><ins class="adsbygoogle">…)
  // reserva min-height: 90px via CSS (ver .ad em css/styles.css) para evitar
  // CLS enquanto o AdSense decide se tem anúncio para preencher o slot. Se o
  // slot não é preenchido — hoje SEMPRE, porque data-ad-client ainda é o
  // placeholder "ca-pub-0000000000000000" (ver comentário no <head> de cada
  // página); depois do deploy com pub-ID real, também em cenários normais de
  // operação (baixo tráfego, sem anunciante disponível, ad blocker do
  // visitante) — esse espaço reservado vira um vazio grande entre o
  // conteúdo da ferramenta e o texto/FAQ abaixo. Padrão recomendado pelo
  // próprio Google para "collapse" gracioso de slot não preenchido: observar
  // data-ad-status (definido de forma assíncrona pelo script do AdSense) e
  // esconder o container quando for "unfilled", com fallback por timeout
  // para quando o AdSense nunca chega a rodar (ad blocker, request que falha
  // por causa do pub-ID placeholder etc.).
  //
  // Carregado em TODAS as páginas (main.js é global) — não precisa editar
  // nenhum dos HTMLs de ferramenta individualmente.
  // ================================================================
  function collapseUnfilledAds() {
    var insEls = document.querySelectorAll(".adsbygoogle");

    Array.prototype.forEach.call(insEls, function (ins) {
      // Se não houver um <section class="ad"> ancestral, esconde o próprio
      // <ins> como fallback (não deveria acontecer no padrão atual do
      // projeto, mas evita um vazio "invisível" órfão em qualquer variação
      // futura de markup).
      var container = (ins.closest && ins.closest(".ad")) || ins;

      function hideContainer() {
        container.hidden = true;
      }

      // O AdSense sempre define data-adsbygoogle-status ao processar o
      // elemento (preenchido ou não); data-ad-status só existe quando o
      // resultado (filled/unfilled) já foi decidido.
      function isProcessed() {
        return ins.hasAttribute("data-ad-status") || ins.hasAttribute("data-adsbygoogle-status");
      }

      var timeoutId = null;
      var observer = null;

      function cleanup() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }

      if (typeof MutationObserver === "function") {
        observer = new MutationObserver(function () {
          var status = ins.getAttribute("data-ad-status");
          if (status === "unfilled") {
            hideContainer();
            cleanup();
          } else if (status === "filled") {
            // Preenchido — mantém visível, só para de observar.
            cleanup();
          }
        });
        observer.observe(ins, {
          attributes: true,
          attributeFilter: ["data-ad-status"],
        });
      }

      // Fallback por timeout: nem sempre o AdSense chega a definir
      // data-ad-status (ad blocker impede o script de rodar; ou, no cenário
      // atual, o pub-ID placeholder pode fazer a request falhar antes
      // disso). Sem MutationObserver disponível, este timeout é a única
      // via. Depois de ~3s, se não houver nenhum indício de que o AdSense
      // processou o slot, esconde o container também.
      timeoutId = setTimeout(function () {
        timeoutId = null;
        if (!isProcessed()) {
          hideContainer();
        }
        cleanup();
      }, 3000);
    });
  }

  collapseUnfilledAds();
})();
