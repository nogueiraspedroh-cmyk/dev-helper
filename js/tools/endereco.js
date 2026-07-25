// js/tools/endereco.js — Gerador de Endereço Internacional (BR, EUA, Portugal, Espanha, Reino Unido).
// Carregado APENAS em tools/endereco/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .textContent/.value — nunca innerHTML.
//
// AVISO DE COMPLIANCE:
//   Os endereços gerados são FICTÍCIOS e destinados EXCLUSIVAMENTE a testes de
//   software. Cidades e estados/regiões são reais; logradouro, número, bairro
//   e código postal NÃO correspondem a nenhum endereço real. Os códigos postais
//   seguem apenas o FORMATO do país — não são verificados em nenhuma base oficial.
//   Não use esses dados para entregas, cadastros ou correspondência real.

(function () {
  "use strict";

  // ─── Utilitários ─────────────────────────────────────────────────────────────

  /** Retorna um inteiro aleatório em [min, max). */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /** Retorna um elemento aleatório de um array. */
  function escolher(arr) {
    return arr[randInt(0, arr.length)];
  }

  /** Retorna um dígito aleatório (0–9) como string. */
  function randDigit() {
    return String(randInt(0, 10));
  }

  /** Retorna uma letra maiúscula aleatória (A–Z). */
  function randLetra() {
    return String.fromCharCode(65 + randInt(0, 26));
  }

  /**
   * Gera uma string de N dígitos numéricos aleatórios.
   * @param {number} n
   * @returns {string}
   */
  function randDigitos(n) {
    var s = "";
    for (var i = 0; i < n; i++) { s += randDigit(); }
    return s;
  }

  // ─── BRASIL ───────────────────────────────────────────────────────────────────
  //
  // Mapa de regiões dos Correios (1º dígito do CEP):
  //   "0" → Grande São Paulo  |  "1" → Interior de SP  |  "2" → RJ e ES
  //   "3" → MG                |  "4" → BA e SE         |  "5" → PE, AL, PB, RN
  //   "6" → CE, PI, MA, PA, AM, AC, AP, RR
  //   "7" → DF, GO, TO, MT, MS, RO
  //   "8" → PR e SC           |  "9" → RS

  var UFS_BR = {
    AC: { nome: "Acre",                  cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],                                                                         cepDigitos: ["6"] },
    AL: { nome: "Alagoas",               cidades: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares"],                                                                 cepDigitos: ["5"] },
    AM: { nome: "Amazonas",              cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari"],                                                                                     cepDigitos: ["6"] },
    AP: { nome: "Amapá",                 cidades: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Porto Grande"],                                                                            cepDigitos: ["6"] },
    BA: { nome: "Bahia",                 cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas"],                                  cepDigitos: ["4"] },
    CE: { nome: "Ceará",                 cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato"],                                                                    cepDigitos: ["6"] },
    DF: { nome: "Distrito Federal",      cidades: ["Brasília", "Taguatinga", "Ceilândia", "Sobradinho", "Planaltina", "Samambaia"],                                                                 cepDigitos: ["7"] },
    ES: { nome: "Espírito Santo",        cidades: ["Vitória", "Vila Velha", "Cariacica", "Serra", "Cachoeiro de Itapemirim", "Linhares"],                                                           cepDigitos: ["2"] },
    GO: { nome: "Goiás",                 cidades: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás"],                                               cepDigitos: ["7"] },
    MA: { nome: "Maranhão",              cidades: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó"],                                                                     cepDigitos: ["6"] },
    MG: { nome: "Minas Gerais",          cidades: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba"],                          cepDigitos: ["3"] },
    MS: { nome: "Mato Grosso do Sul",    cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã"],                                                                             cepDigitos: ["7"] },
    MT: { nome: "Mato Grosso",           cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra"],                                                                         cepDigitos: ["7"] },
    PA: { nome: "Pará",                  cidades: ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Parauapebas"],                                                                        cepDigitos: ["6"] },
    PB: { nome: "Paraíba",               cidades: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa"],                                                                      cepDigitos: ["5"] },
    PE: { nome: "Pernambuco",            cidades: ["Recife", "Caruaru", "Olinda", "Petrolina", "Paulista", "Jaboatão dos Guararapes"],                                                              cepDigitos: ["5"] },
    PI: { nome: "Piauí",                 cidades: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano"],                                                                                        cepDigitos: ["6"] },
    PR: { nome: "Paraná",                cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu"],                                        cepDigitos: ["8"] },
    RJ: { nome: "Rio de Janeiro",        cidades: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Campos dos Goytacazes", "Belford Roxo"],                         cepDigitos: ["2"] },
    RN: { nome: "Rio Grande do Norte",   cidades: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba"],                                                                         cepDigitos: ["5"] },
    RO: { nome: "Rondônia",              cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal"],                                                                                   cepDigitos: ["7"] },
    RR: { nome: "Roraima",               cidades: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre", "Mucajaí"],                                                                             cepDigitos: ["6"] },
    RS: { nome: "Rio Grande do Sul",     cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Novo Hamburgo"],                                              cepDigitos: ["9"] },
    SC: { nome: "Santa Catarina",        cidades: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Itajaí", "Criciúma"],                                                         cepDigitos: ["8"] },
    SE: { nome: "Sergipe",               cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão"],                                                                 cepDigitos: ["4"] },
    SP: { nome: "São Paulo",             cidades: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba", "São José dos Campos", "Mauá", "Santos", "Mogi das Cruzes", "São José do Rio Preto", "Diadema", "Jundiaí"], cepDigitos: ["0", "1"] },
    TO: { nome: "Tocantins",             cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],                                                                      cepDigitos: ["7"] }
  };

  var CHAVES_UF_BR = Object.keys(UFS_BR);

  var TIPOS_LOGRADOURO_BR = [
    "Rua", "Rua", "Rua", "Rua",
    "Avenida", "Avenida", "Avenida",
    "Travessa", "Alameda", "Rodovia"
  ];

  var NOMES_LOGRADOURO_BR = [
    "das Flores", "dos Pinheiros", "do Comércio", "da Paz", "da Liberdade",
    "Central", "Brasil", "São João", "Santa Maria", "das Acácias",
    "dos Ipês", "do Sol", "da Saudade", "das Palmeiras", "do Café",
    "dos Trabalhadores", "da República", "Getúlio Vargas", "dos Bandeirantes",
    "das Américas", "Presidente Kennedy", "dos Girassóis", "das Rosas",
    "dos Eucaliptos", "do Contorno", "Marechal Rondon", "Tiradentes",
    "Visconde de Mauá", "das Castanheiras", "do Parque", "da Esperança",
    "Sete de Setembro", "Quinze de Novembro", "Duque de Caxias", "das Garças",
    "dos Coqueiros", "do Trovão", "das Orquídeas", "José Bonifácio",
    "Monteiro Lobato", "Oswaldo Cruz", "Santos Dumont", "Carlos Drummond",
    "da Serra", "do Bosque", "das Laranjeiras", "da Praça", "do Rio",
    "Nova", "Velha", "Grande", "das Pedras", "da Mata", "do Campo"
  ];

  var NOMES_BAIRRO_BR = [
    "Centro", "Jardim América", "Vila Nova", "Jardim das Flores",
    "Bela Vista", "Alto da Serra", "Jardim Europa", "Nova Esperança",
    "São Francisco", "Vila Jardim", "Parque Industrial", "Jardim Primavera",
    "Vila Santa Maria", "Residencial Solar", "Jardim Paulista",
    "Boa Esperança", "Parque das Nações", "Vila Rica", "Jardim Ipê",
    "Jardim Atlântico", "Santa Cecília", "Vila Real", "Jardim Verde",
    "Parque Residencial", "Alto da Boa Vista", "Vila União", "Jardim Sumaré",
    "Novo Horizonte", "Jardim das Acácias", "Vila Esperança",
    "Morada do Sol", "Jardim Tropical", "Santa Cruz", "Vila Operária",
    "Jardim Olímpico", "Nova Cidade", "Portal das Flores",
    "Jardim São Paulo", "Bairro dos Lagos", "Serra Dourada", "Recanto Verde",
    "Santa Luzia", "Parque São Jorge", "Jardim Boa Vista"
  ];

  var COMPLEMENTOS_BR = [
    "Apto 101", "Apto 202", "Apto 304", "Apto 12B", "Apto 501",
    "Casa 2", "Fundos", "Bloco A Apto 3", "Bloco B Apto 7", "Sala 10",
    "Conjunto 5", "Casa dos Fundos", "2º andar", "3º andar", "Loja 4"
  ];

  /** Gera CEP plausível pela região (1º dígito coerente com a UF). */
  function gerarCEP(cepDigitos) {
    var d0 = escolher(cepDigitos);
    var digits = d0;
    for (var i = 1; i < 8; i++) { digits += randDigit(); }
    return digits.slice(0, 5) + "-" + digits.slice(5);
  }

  /**
   * Gera endereço brasileiro fictício.
   * @param {string|null} ufFiltro
   * @param {boolean} incluirComplemento
   * @returns {Object}
   */
  function gerarEnderecoBR(ufFiltro, incluirComplemento) {
    var uf = (ufFiltro && UFS_BR[ufFiltro]) ? ufFiltro : escolher(CHAVES_UF_BR);
    var dadosUF    = UFS_BR[uf];
    var cidade     = escolher(dadosUF.cidades);
    var bairro     = escolher(NOMES_BAIRRO_BR);
    var logradouro = escolher(TIPOS_LOGRADOURO_BR) + " " + escolher(NOMES_LOGRADOURO_BR);
    var numero     = String(randInt(1, 9999));
    var cep        = gerarCEP(dadosUF.cepDigitos);
    var complemento = null;
    if (incluirComplemento && Math.random() < 0.6) {
      complemento = escolher(COMPLEMENTOS_BR);
    }
    return {
      pais: "br",
      logradouro: logradouro,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      cidade: cidade,
      uf: uf,
      nomeUF: dadosUF.nome,
      cep: cep
    };
  }

  // ─── ESTADOS UNIDOS ───────────────────────────────────────────────────────────
  //
  // ZIP Code: 5 dígitos (NNNNN). Não há correspondência geográfica verificável
  // offline por faixa de estado sem base de dados oficial — geramos 5 dígitos
  // aleatórios (primeiro dígito 1–9 para evitar 0xxxx que pertence a regiões
  // específicas do Nordeste dos EUA). Declarado explicitamente no disclaimer.
  //
  // Formato de saída:
  //   {numero} {rua}
  //   {city}, {ST} {ZIP}
  //   United States

  var ESTADOS_EUA = {
    AL: { nome: "Alabama",       cidades: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"] },
    AK: { nome: "Alaska",        cidades: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"] },
    AZ: { nome: "Arizona",       cidades: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale"] },
    AR: { nome: "Arkansas",      cidades: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"] },
    CA: { nome: "California",    cidades: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland"] },
    CO: { nome: "Colorado",      cidades: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton"] },
    CT: { nome: "Connecticut",   cidades: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury"] },
    DE: { nome: "Delaware",      cidades: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"] },
    FL: { nome: "Florida",       cidades: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee"] },
    GA: { nome: "Georgia",       cidades: ["Atlanta", "Columbus", "Augusta", "Macon", "Savannah", "Athens"] },
    HI: { nome: "Hawaii",        cidades: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Pearl City"] },
    ID: { nome: "Idaho",         cidades: ["Boise", "Nampa", "Meridian", "Idaho Falls", "Pocatello"] },
    IL: { nome: "Illinois",      cidades: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield"] },
    IN: { nome: "Indiana",       cidades: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"] },
    IA: { nome: "Iowa",          cidades: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"] },
    KS: { nome: "Kansas",        cidades: ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe"] },
    KY: { nome: "Kentucky",      cidades: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"] },
    LA: { nome: "Louisiana",     cidades: ["New Orleans", "Baton Rouge", "Shreveport", "Metairie", "Lafayette"] },
    ME: { nome: "Maine",         cidades: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"] },
    MD: { nome: "Maryland",      cidades: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie"] },
    MA: { nome: "Massachusetts", cidades: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton"] },
    MI: { nome: "Michigan",      cidades: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor"] },
    MN: { nome: "Minnesota",     cidades: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"] },
    MS: { nome: "Mississippi",   cidades: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"] },
    MO: { nome: "Missouri",      cidades: ["Kansas City", "Saint Louis", "Springfield", "Columbia", "Independence"] },
    MT: { nome: "Montana",       cidades: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte"] },
    NE: { nome: "Nebraska",      cidades: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"] },
    NV: { nome: "Nevada",        cidades: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"] },
    NH: { nome: "New Hampshire", cidades: ["Manchester", "Nashua", "Concord", "Derry", "Dover"] },
    NJ: { nome: "New Jersey",    cidades: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton"] },
    NM: { nome: "New Mexico",    cidades: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"] },
    NY: { nome: "New York",      cidades: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"] },
    NC: { nome: "North Carolina",cidades: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville"] },
    ND: { nome: "North Dakota",  cidades: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"] },
    OH: { nome: "Ohio",          cidades: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"] },
    OK: { nome: "Oklahoma",      cidades: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"] },
    OR: { nome: "Oregon",        cidades: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro"] },
    PA: { nome: "Pennsylvania",  cidades: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"] },
    RI: { nome: "Rhode Island",  cidades: ["Providence", "Cranston", "Warwick", "Pawtucket", "East Providence"] },
    SC: { nome: "South Carolina",cidades: ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill"] },
    SD: { nome: "South Dakota",  cidades: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"] },
    TN: { nome: "Tennessee",     cidades: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"] },
    TX: { nome: "Texas",         cidades: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington"] },
    UT: { nome: "Utah",          cidades: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"] },
    VT: { nome: "Vermont",       cidades: ["Burlington", "South Burlington", "Rutland", "Essex Junction", "Barre"] },
    VA: { nome: "Virginia",      cidades: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria"] },
    WA: { nome: "Washington",    cidades: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Olympia"] },
    WV: { nome: "West Virginia", cidades: ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling"] },
    WI: { nome: "Wisconsin",     cidades: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"] },
    WY: { nome: "Wyoming",       cidades: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"] }
  };

  var CHAVES_ESTADOS_EUA = Object.keys(ESTADOS_EUA);

  var TIPOS_RUA_EUA = [
    "Street", "Street", "Street",
    "Avenue", "Avenue",
    "Boulevard", "Drive", "Drive",
    "Lane", "Road", "Way", "Circle", "Court"
  ];

  var NOMES_RUA_EUA = [
    "Maple", "Oak", "Cedar", "Elm", "Pine", "Walnut", "Washington",
    "Lake", "Hill", "Park", "Ridge", "Sunset", "Spring", "River",
    "Lincoln", "Jefferson", "Madison", "Monroe", "Adams", "Jackson",
    "Highland", "Meadow", "Forest", "Valley", "Church", "Mill",
    "Main", "First", "Second", "Third", "Fourth", "Fifth",
    "Broad", "Market", "Liberty", "Union", "Commerce", "Pleasant",
    "Colonial", "Heritage", "Willow", "Cherry", "Birch", "Magnolia"
  ];

  /** Gera ZIP Code de 5 dígitos (puramente de formato — não vinculado ao estado). */
  function gerarZIP() {
    // 1º dígito 1–9 para evitar série 0xxxx (casos especiais do Nordeste)
    return String(randInt(1, 10)) + randDigitos(4);
  }

  /**
   * Gera endereço dos EUA fictício.
   * @param {string|null} estadoFiltro - sigla do estado (ex.: "CA") ou null.
   * @returns {Object}
   */
  function gerarEnderecoEUA(estadoFiltro) {
    var st = (estadoFiltro && ESTADOS_EUA[estadoFiltro]) ? estadoFiltro : escolher(CHAVES_ESTADOS_EUA);
    var dadosSt = ESTADOS_EUA[st];
    var cidade  = escolher(dadosSt.cidades);
    var numero  = String(randInt(1, 9999));
    var rua     = escolher(NOMES_RUA_EUA) + " " + escolher(TIPOS_RUA_EUA);
    var zip     = gerarZIP();
    return {
      pais: "us",
      numero: numero,
      rua: rua,
      cidade: cidade,
      estado: st,
      nomeEstado: dadosSt.nome,
      zip: zip
    };
  }

  // ─── PORTUGAL ─────────────────────────────────────────────────────────────────
  //
  // Código postal: NNNN-NNN (4 dígitos + hífen + 3 dígitos).
  // Formato de saída:
  //   {rua}, {numero}
  //   {NNNN-NNN} {localidade}
  //   Portugal

  // Nota: cada cidade está verificada como pertencente ao respectivo distrito.
  // Fontes: divisão administrativa oficial de Portugal (18 distritos).
  var DISTRITOS_PT = {
    Lisboa:    ["Lisboa", "Amadora", "Cascais", "Loures", "Sintra", "Odivelas", "Vila Franca de Xira"],
    // Porto: "Braga" e "Guimarães" removidos (pertencem ao distrito de Braga);
    //        "Gaia" corrigido para o nome oficial "Vila Nova de Gaia".
    Porto:     ["Porto", "Vila Nova de Gaia", "Gondomar", "Matosinhos", "Maia", "Penafiel", "Valongo"],
    // Braga: "Famalicão" expandido para o nome oficial "Vila Nova de Famalicão".
    Braga:     ["Braga", "Guimarães", "Barcelos", "Vila Nova de Famalicão", "Esposende", "Amares"],
    // Aveiro: "Viseu" removido (é capital do distrito de Viseu); adicionadas cidades do distrito.
    Aveiro:    ["Aveiro", "Águeda", "Ovar", "Santa Maria da Feira", "Ílhavo", "Oliveira de Azeméis"],
    // Coimbra: "Leiria" removido (capital do distrito de Leiria); "Pombal" removido (distrito de Leiria).
    Coimbra:   ["Coimbra", "Figueira da Foz", "Cantanhede", "Montemor-o-Velho", "Condeixa-a-Nova"],
    // Leiria: distrito adicionado com suas cidades reais (incluindo Pombal e Leiria).
    Leiria:    ["Leiria", "Pombal", "Caldas da Rainha", "Alcobaça", "Marinha Grande", "Nazaré"],
    Faro:      ["Faro", "Portimão", "Loulé", "Lagos", "Tavira", "Albufeira", "Olhão"],
    Setúbal:   ["Setúbal", "Almada", "Seixal", "Barreiro", "Montijo", "Palmela", "Sesimbra"],
    Santarém:  ["Santarém", "Torres Novas", "Tomar", "Abrantes", "Ourém", "Entroncamento"],
    Évora:     ["Évora", "Estremoz", "Reguengos de Monsaraz", "Montemor-o-Novo", "Mora"],
    // Beja: "Santiago do Cacém" removido (pertence ao distrito de Setúbal).
    Beja:      ["Beja", "Ferreira do Alentejo", "Moura", "Serpa", "Castro Verde"],
    Portalegre:["Portalegre", "Elvas", "Campo Maior", "Ponte de Sôr", "Alter do Chão"],
    Castelo:   ["Castelo Branco", "Covilhã", "Fundão", "Idanha-a-Nova", "Penamacor"],
    Guarda:    ["Guarda", "Seia", "Gouveia", "Trancoso", "Sabugal"],
    Viseu:     ["Viseu", "Lamego", "Mangualde", "Tondela", "São Pedro do Sul"],
    Viana:     ["Viana do Castelo", "Ponte de Lima", "Caminha", "Valença", "Arcos de Valdevez"],
    Bragança:  ["Bragança", "Macedo de Cavaleiros", "Miranda do Douro", "Mirandela", "Mogadouro"],
    VilReal:   ["Vila Real", "Chaves", "Peso da Régua", "Murça", "Alijó"]
  };

  var CHAVES_DISTRITOS_PT = Object.keys(DISTRITOS_PT);

  var TIPOS_RUA_PT = [
    "Rua", "Rua", "Rua",
    "Avenida", "Avenida",
    "Travessa", "Largo", "Praça", "Calçada", "Alameda"
  ];

  var NOMES_RUA_PT = [
    "da Liberdade", "do Comércio", "de Portugal", "das Flores", "da República",
    "de Santo António", "da Saudade", "do Mar", "dos Pescadores", "do Carmo",
    "da Paz", "da Alegria", "do Castelo", "da Igreja", "da Serra",
    "Vasco da Gama", "Fernão de Magalhães", "de São Pedro", "de Camões",
    "Dom Afonso Henriques", "do Rossio", "da Misericórdia", "das Acácias",
    "das Palmeiras", "dos Loureiros", "do Pinheiro", "da Oliveira",
    "do Calvário", "de Santa Maria", "da Graça", "do Souto",
    "dos Bombeiros", "da Estação", "do Mercado", "da Escola"
  ];

  /** Gera código postal português NNNN-NNN. */
  function gerarCPPortugal() {
    return randDigitos(4) + "-" + randDigitos(3);
  }

  /**
   * Gera endereço português fictício.
   * @param {string|null} distritoFiltro
   * @returns {Object}
   */
  function gerarEnderecoPortugal(distritoFiltro) {
    var dist = (distritoFiltro && DISTRITOS_PT[distritoFiltro]) ? distritoFiltro : escolher(CHAVES_DISTRITOS_PT);
    var cidade   = escolher(DISTRITOS_PT[dist]);
    var rua      = escolher(TIPOS_RUA_PT) + " " + escolher(NOMES_RUA_PT);
    var numero   = String(randInt(1, 999));
    var cp       = gerarCPPortugal();
    return {
      pais: "pt",
      rua: rua,
      numero: numero,
      localidade: cidade,
      distrito: dist,
      cp: cp
    };
  }

  // ─── ESPANHA ──────────────────────────────────────────────────────────────────
  //
  // Código postal: 5 dígitos (os 2 primeiros indicam a província, de 01 a 52).
  // Geramos 2 dígitos de província fictícios (01–52) + 3 dígitos aleatórios.
  // Formato de saída:
  //   {calle} {numero}
  //   {NNNNN} {ciudad}
  //   {provincia}
  //   España

  // Nota: cada cidade está verificada como pertencente à respectiva província.
  // Espanha é organizada em 50 províncias; as chaves abaixo usam o nome da
  // província (que coincide com a capital na maioria dos casos).
  var PROVINCIAS_ES = {
    Madrid:       ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón"],
    Barcelona:    ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet"],
    // Valencia: "Alicante" removido (prov. Alicante); "Elche" removido (prov. Alicante);
    //           "Castellón de la Plana" removido (prov. Castellón). Adicionadas cidades da província de Valencia.
    Valencia:     ["Valencia", "Torrent", "Gandia", "Paterna", "Sagunto", "Alzira", "Burjassot"],
    Sevilla:      ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija"],
    // Zaragoza: "Huesca" removido (capital da prov. Huesca); "Teruel" removido (capital da prov. Teruel).
    Zaragoza:     ["Zaragoza", "Calatayud", "Ejea de los Caballeros", "Utebo", "Tarazona", "Borja"],
    // Huesca: província autónoma adicionada (antes erroneamente em Zaragoza).
    Huesca:       ["Huesca", "Monzón", "Barbastro", "Fraga", "Sabiñánigo"],
    // Castellón: província autónoma adicionada (antes erroneamente em Valencia).
    Castellón:    ["Castellón de la Plana", "Vila-real", "Benicarló", "Vinaròs", "Onda"],
    Málaga:       ["Málaga", "Marbella", "Fuengirola", "Vélez-Málaga", "Torremolinos", "Benalmádena"],
    Murcia:       ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón"],
    // Palmas: nombre completo "Las Palmas" (isla de Gran Canaria).
    Palmas:       ["Las Palmas de Gran Canaria", "Telde", "Arucas", "Santa Lucía de Tirajana", "Ingenio"],
    Vizcaya:      ["Bilbao", "Barakaldo", "Getxo", "Basauri", "Sestao", "Portugalete"],
    // Alicante: "Elche" correto aqui (é da prov. Alicante). Removido de Valencia.
    Alicante:     ["Alicante", "Elche", "Benidorm", "Torrevieja", "Orihuela", "Petrer", "Alcoy"],
    Córdoba:      ["Córdoba", "Lucena", "Montilla", "Puente Genil", "Baena", "Priego de Córdoba"],
    Valladolid:   ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda", "Tordesillas"],
    Coruña:       ["A Coruña", "Ferrol", "Santiago de Compostela", "Narón", "Oleiros", "Ribeira"],
    Granada:      ["Granada", "Motril", "Almuñécar", "Maracena", "Armilla", "Loja"],
    Asturias:     ["Oviedo", "Gijón", "Avilés", "Siero", "Langreo", "Mieres"],
    Guadalajara:  ["Guadalajara", "Azuqueca de Henares", "Cabanillas del Campo", "Alovera", "Marchamalo"]
  };

  var CHAVES_PROVINCIAS_ES = Object.keys(PROVINCIAS_ES);

  var TIPOS_CALLE_ES = [
    "Calle", "Calle", "Calle",
    "Avenida", "Avenida",
    "Plaza", "Paseo", "Carrera", "Travesía", "Ronda"
  ];

  var NOMES_CALLE_ES = [
    "Mayor", "de la Paz", "del Sol", "de España", "Real",
    "de la Constitución", "de la Libertad", "del Mar", "de la Rosa",
    "San Miguel", "San José", "Santa María", "de Goya", "de Cervantes",
    "del Prado", "de Alcalá", "Gran Vía", "de la Reina", "del Rey",
    "de Colón", "de las Flores", "del Olmo", "del Pino", "de los Olivos",
    "de la Sierra", "del Castillo", "del Parque", "del Campo",
    "de la Cruz", "de la Paloma", "de los Álamos", "de la Fuente",
    "de la Estrella", "del Carmen", "de las Rosas", "de las Acacias"
  ];

  /** Gera código postal espanhol de 5 dígitos (2 de província 01–52 + 3 aleatórios). */
  function gerarCPEspanha() {
    var provincia = String(randInt(1, 53)).padStart(2, "0");
    return provincia + randDigitos(3);
  }

  /**
   * Gera endereço espanhol fictício.
   * @param {string|null} provinciaFiltro
   * @returns {Object}
   */
  function gerarEnderecoEspanha(provinciaFiltro) {
    var prov = (provinciaFiltro && PROVINCIAS_ES[provinciaFiltro]) ? provinciaFiltro : escolher(CHAVES_PROVINCIAS_ES);
    var cidade  = escolher(PROVINCIAS_ES[prov]);
    var calle   = escolher(TIPOS_CALLE_ES) + " " + escolher(NOMES_CALLE_ES);
    var numero  = String(randInt(1, 999));
    var cp      = gerarCPEspanha();
    return {
      pais: "es",
      calle: calle,
      numero: numero,
      ciudad: cidade,
      provincia: prov,
      cp: cp
    };
  }

  // ─── REINO UNIDO ──────────────────────────────────────────────────────────────
  //
  // Postcode britânico: formato típico AN NAA ou ANN NAA ou AAN NAA etc.
  // Simplificação adotada: {LL}{N} {N}{LL} onde L = letra, N = dígito,
  // ex. "SW1A 1AA", "EC2V 8RF", "M4 3AB".
  // Geramos no padrão {1-2 letras}{1-2 dígitos} {1 dígito}{2 letras}.
  // Formato de saída:
  //   {numero} {street}
  //   {town/city}
  //   {postcode}
  //   United Kingdom

  var REGIOES_UK = {
    England: ["London", "Birmingham", "Leeds", "Sheffield", "Bradford", "Liverpool",
              "Manchester", "Bristol", "Coventry", "Leicester", "Nottingham",
              "Newcastle upon Tyne", "Southampton", "Brighton", "Plymouth", "Derby",
              "Stoke-on-Trent", "Wolverhampton", "Exeter", "Oxford", "Cambridge"],
    Scotland:     ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Perth", "Stirling"],
    Wales:        ["Cardiff", "Swansea", "Newport", "Bangor", "Wrexham", "Neath"],
    NorthernIreland: ["Belfast", "Derry", "Lisburn", "Newry", "Armagh", "Ballymena"]
  };

  var CHAVES_REGIOES_UK = Object.keys(REGIOES_UK);

  var TIPOS_STREET_UK = [
    "Street", "Street", "Street",
    "Road", "Road",
    "Avenue", "Lane", "Close", "Drive", "Way", "Place", "Terrace", "Gardens"
  ];

  var NOMES_STREET_UK = [
    "High", "Church", "Victoria", "King", "Queen", "Park",
    "Mill", "Station", "Green", "Hill", "Manor", "Castle",
    "Garden", "Grove", "Oak", "Elm", "Cedar", "Birch",
    "Regent", "Oxford", "Baker", "Bond", "Fleet", "Chancery",
    "Wellington", "Nelson", "Churchill", "Windsor", "Kensington",
    "Bloomsbury", "Piccadilly", "Whitehall", "Waterloo", "Tower",
    "Bridge", "Abbey", "Forest", "Meadow", "Riverside", "Lakeside"
  ];

  /**
   * Gera postcode britânico no formato AN{N} NAA (simplificado mas visualmente correto).
   * Ex.: "SW3 4BK", "EC1V 9NB", "M15 6EF"
   */
  function gerarPostcodeUK() {
    // Área: 1 ou 2 letras
    var area = (Math.random() < 0.5) ? randLetra() : randLetra() + randLetra();
    // Distrito: 1 ou 2 dígitos
    var distrito = (Math.random() < 0.5) ? randDigit() : randDigit() + randDigit();
    // Sector: 1 dígito + 2 letras
    var sector = randDigit() + randLetra() + randLetra();
    return area + distrito + " " + sector;
  }

  /**
   * Gera endereço do Reino Unido fictício.
   * @param {string|null} regiaoFiltro
   * @returns {Object}
   */
  function gerarEnderecoUK(regiaoFiltro) {
    var regiao = (regiaoFiltro && REGIOES_UK[regiaoFiltro]) ? regiaoFiltro : escolher(CHAVES_REGIOES_UK);
    var cidade    = escolher(REGIOES_UK[regiao]);
    var numero    = String(randInt(1, 999));
    var street    = escolher(NOMES_STREET_UK) + " " + escolher(TIPOS_STREET_UK);
    var postcode  = gerarPostcodeUK();
    return {
      pais: "uk",
      numero: numero,
      street: street,
      cidade: cidade,
      regiao: regiao,
      postcode: postcode
    };
  }

  // ─── Formatadores de texto por país ─────────────────────────────────────────

  function formatarMultilinhaEndereco(end) {
    if (end.pais === "br") {
      var l1 = end.logradouro + ", " + end.numero;
      if (end.complemento) { l1 += " — " + end.complemento; }
      return [l1, end.bairro, end.cidade + " — " + end.uf, "CEP: " + end.cep].join("\n");
    }
    if (end.pais === "us") {
      return [end.numero + " " + end.rua, end.cidade + ", " + end.estado + " " + end.zip, "United States"].join("\n");
    }
    if (end.pais === "pt") {
      return [end.rua + ", " + end.numero, end.cp + " " + end.localidade, "Portugal"].join("\n");
    }
    if (end.pais === "es") {
      return [end.calle + " " + end.numero, end.cp + " " + end.ciudad, end.provincia, "España"].join("\n");
    }
    if (end.pais === "uk") {
      return [end.numero + " " + end.street, end.cidade, end.postcode, "United Kingdom"].join("\n");
    }
    return "";
  }

  function formatarUmaLinhaEndereco(end) {
    if (end.pais === "br") {
      var partes = [end.logradouro + ", " + end.numero];
      if (end.complemento) { partes.push(end.complemento); }
      partes.push(end.bairro, end.cidade + " — " + end.uf, "CEP " + end.cep);
      return partes.join(", ");
    }
    if (end.pais === "us") {
      return [end.numero + " " + end.rua, end.cidade + " " + end.estado + " " + end.zip, "United States"].join(", ");
    }
    if (end.pais === "pt") {
      return [end.rua + " " + end.numero, end.cp + " " + end.localidade, "Portugal"].join(", ");
    }
    if (end.pais === "es") {
      return [end.calle + " " + end.numero, end.cp + " " + end.ciudad, end.provincia, "España"].join(", ");
    }
    if (end.pais === "uk") {
      return [end.numero + " " + end.street, end.cidade, end.postcode, "United Kingdom"].join(", ");
    }
    return "";
  }

  // ─── Renderer DOM (zero innerHTML com dados dinâmicos) ───────────────────────

  /**
   * Cria um campo label+valor para o grid de endereço.
   * @param {string} label
   * @param {string} valor
   * @param {boolean} mono - se true, aplica classe monospace ao valor.
   * @returns {HTMLElement}
   */
  function criarCampo(label, valor, mono) {
    var campo = document.createElement("div");
    campo.className = "cartao-campo";
    var lbl = document.createElement("span");
    lbl.className = "cartao-campo__label";
    lbl.textContent = label;
    campo.appendChild(lbl);
    var val = document.createElement("span");
    val.className = mono ? "cartao-campo__valor cartao-campo__valor--mono" : "cartao-campo__valor";
    val.textContent = valor;
    campo.appendChild(val);
    return campo;
  }

  /**
   * Monta o bloco completo de um endereço no DOM sem innerHTML.
   * @param {Object} end
   * @param {number} indice
   * @param {number} total
   * @returns {HTMLElement}
   */
  function criarBlocoEndereco(end, indice, total) {
    var bloco = document.createElement("div");
    bloco.className = "endereco-bloco";

    if (total > 1) {
      var titulo = document.createElement("p");
      titulo.className = "endereco-bloco__numero";
      titulo.textContent = "Endereço " + (indice + 1) + " de " + total;
      bloco.appendChild(titulo);
    }

    if (end.pais === "br") {
      var textoLog = end.logradouro + ", " + end.numero;
      if (end.complemento) { textoLog += " — " + end.complemento; }
      bloco.appendChild(criarCampo("Logradouro", textoLog, false));
      bloco.appendChild(criarCampo("Bairro", end.bairro, false));
      bloco.appendChild(criarCampo("Cidade", end.cidade, false));
      bloco.appendChild(criarCampo("Estado (UF)", end.nomeUF + " (" + end.uf + ")", false));
      bloco.appendChild(criarCampo("CEP", end.cep, true));
      bloco.appendChild(criarCampo("País", "Brasil", false));
    } else if (end.pais === "us") {
      bloco.appendChild(criarCampo("Street address", end.numero + " " + end.rua, false));
      bloco.appendChild(criarCampo("City", end.cidade, false));
      bloco.appendChild(criarCampo("State", end.nomeEstado + " (" + end.estado + ")", false));
      bloco.appendChild(criarCampo("ZIP Code", end.zip, true));
      bloco.appendChild(criarCampo("Country", "United States", false));
    } else if (end.pais === "pt") {
      bloco.appendChild(criarCampo("Morada", end.rua + ", " + end.numero, false));
      bloco.appendChild(criarCampo("Localidade", end.localidade, false));
      bloco.appendChild(criarCampo("Distrito", end.distrito, false));
      bloco.appendChild(criarCampo("Código Postal", end.cp, true));
      bloco.appendChild(criarCampo("País", "Portugal", false));
    } else if (end.pais === "es") {
      bloco.appendChild(criarCampo("Dirección", end.calle + " " + end.numero, false));
      bloco.appendChild(criarCampo("Ciudad", end.ciudad, false));
      bloco.appendChild(criarCampo("Provincia", end.provincia, false));
      bloco.appendChild(criarCampo("Código Postal", end.cp, true));
      bloco.appendChild(criarCampo("País", "España", false));
    } else if (end.pais === "uk") {
      bloco.appendChild(criarCampo("Street address", end.numero + " " + end.street, false));
      bloco.appendChild(criarCampo("Town / City", end.cidade, false));
      bloco.appendChild(criarCampo("Region", end.regiao, false));
      bloco.appendChild(criarCampo("Postcode", end.postcode, true));
      bloco.appendChild(criarCampo("Country", "United Kingdom", false));
    }

    return bloco;
  }

  // ─── Despacho por país ───────────────────────────────────────────────────────

  /**
   * Gera um endereço para o país e região especificados.
   * @param {string} pais - "br" | "us" | "pt" | "es" | "uk"
   * @param {string|null} regiaoFiltro - chave de região/estado/distrito ou null.
   * @param {boolean} incluirComplemento - somente BR usa.
   * @returns {Object}
   */
  function gerarEndereco(pais, regiaoFiltro, incluirComplemento) {
    if (pais === "us")  { return gerarEnderecoEUA(regiaoFiltro); }
    if (pais === "pt")  { return gerarEnderecoPortugal(regiaoFiltro); }
    if (pais === "es")  { return gerarEnderecoEspanha(regiaoFiltro); }
    if (pais === "uk")  { return gerarEnderecoUK(regiaoFiltro); }
    return gerarEnderecoBR(regiaoFiltro, incluirComplemento);
  }

  // ─── Dados de região por país (para popular o select de região) ───────────────

  var REGIOES_POR_PAIS = {
    br: {
      label: "Estado:",
      placeholder: "Aleatório (qualquer estado)",
      opcoes: CHAVES_UF_BR.map(function (k) {
        return { valor: k, texto: UFS_BR[k].nome + " (" + k + ")" };
      })
    },
    us: {
      label: "State:",
      placeholder: "Random (any state)",
      opcoes: CHAVES_ESTADOS_EUA.map(function (k) {
        return { valor: k, texto: ESTADOS_EUA[k].nome + " (" + k + ")" };
      })
    },
    pt: {
      label: "Distrito:",
      placeholder: "Aleatório (qualquer distrito)",
      opcoes: CHAVES_DISTRITOS_PT.map(function (k) {
        return { valor: k, texto: k };
      })
    },
    es: {
      label: "Provincia:",
      placeholder: "Aleatorio (cualquier provincia)",
      opcoes: CHAVES_PROVINCIAS_ES.map(function (k) {
        return { valor: k, texto: k };
      })
    },
    uk: {
      label: "Region:",
      placeholder: "Random (any region)",
      opcoes: CHAVES_REGIOES_UK.map(function (k) {
        return { valor: k, texto: k };
      })
    }
  };

  // ─── Referências ao DOM ──────────────────────────────────────────────────────

  var paisSelect        = document.getElementById("pais-select");
  var regiaoLabel       = document.getElementById("regiao-label");
  var regiaoSelect      = document.getElementById("regiao-select");
  var regiaoRow         = document.getElementById("regiao-row");
  var qtdSelect         = document.getElementById("qtd-select");
  var chkComplemento    = document.getElementById("chk-complemento");
  var chkComplementoRow = document.getElementById("chk-complemento-row");
  var btnGerar          = document.getElementById("btn-gerar-endereco");

  var resultadoDiv      = document.getElementById("endereco-resultado");
  var listaDiv          = document.getElementById("endereco-lista");

  var btnCopiarMulti    = document.getElementById("btn-copiar-multilinha");
  var btnCopiarUma      = document.getElementById("btn-copiar-umalinha");

  // Guard — interrompe silenciosamente se elementos essenciais não existirem.
  if (
    !paisSelect || !regiaoLabel || !regiaoSelect || !regiaoRow ||
    !qtdSelect || !chkComplemento || !chkComplementoRow || !btnGerar ||
    !resultadoDiv || !listaDiv || !btnCopiarMulti || !btnCopiarUma
  ) {
    return;
  }

  // ─── Estado interno ──────────────────────────────────────────────────────────

  var ultimosGerados = [];

  // ─── Helpers de UI ──────────────────────────────────────────────────────────


  function copiarTexto(text, btn) {
    if (!text) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btn, "Copiado!");
      }).catch(function () {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btn, "Copiado!");
    } catch (e) {
      // Silencia — usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  /**
   * Atualiza o select de região conforme o país selecionado.
   * Reconstrói as <option> via createElement (zero innerHTML).
   */
  function atualizarRegioes() {
    if (!paisSelect || !regiaoSelect || !regiaoLabel || !regiaoRow || !chkComplementoRow) { return; }

    var pais = paisSelect.value;
    var info = REGIOES_POR_PAIS[pais];
    if (!info) { return; }

    // Atualiza label
    regiaoLabel.textContent = info.label;

    // Reconstrói options
    while (regiaoSelect.firstChild) { regiaoSelect.removeChild(regiaoSelect.firstChild); }

    var optPlaceholder = document.createElement("option");
    optPlaceholder.value = "aleatorio";
    optPlaceholder.textContent = info.placeholder;
    regiaoSelect.appendChild(optPlaceholder);

    for (var i = 0; i < info.opcoes.length; i++) {
      var opt = document.createElement("option");
      opt.value = info.opcoes[i].valor;
      opt.textContent = info.opcoes[i].texto;
      regiaoSelect.appendChild(opt);
    }

    // Complemento só faz sentido para BR
    chkComplementoRow.hidden = (pais !== "br");

    // Esconde a linha de região se não houver opções (não acontece aqui, mas defensivo)
    regiaoRow.hidden = (info.opcoes.length === 0);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleGerar() {
    if (!paisSelect || !regiaoSelect || !qtdSelect || !chkComplemento) { return; }

    var pais           = paisSelect.value;
    var regiaoVal      = regiaoSelect.value;
    var regiaoFiltro   = (regiaoVal === "aleatorio") ? null : regiaoVal;
    var qtd            = parseInt(qtdSelect.value, 10) || 1;
    var comComplemento = chkComplemento.checked;

    if (qtd < 1)  { qtd = 1; }
    if (qtd > 10) { qtd = 10; }

    ultimosGerados = [];
    for (var i = 0; i < qtd; i++) {
      ultimosGerados.push(gerarEndereco(pais, regiaoFiltro, comComplemento));
    }

    // Limpa e repopula via DOM (nunca innerHTML com dado externo)
    while (listaDiv.firstChild) { listaDiv.removeChild(listaDiv.firstChild); }

    for (var j = 0; j < ultimosGerados.length; j++) {
      listaDiv.appendChild(criarBlocoEndereco(ultimosGerados[j], j, ultimosGerados.length));
    }

    resultadoDiv.hidden = false;
  }

  function handleCopiarMulti() {
    if (ultimosGerados.length === 0) { return; }
    var texto = ultimosGerados.map(formatarMultilinhaEndereco).join("\n\n---\n\n");
    copiarTexto(texto, btnCopiarMulti);
  }

  function handleCopiarUma() {
    if (ultimosGerados.length === 0) { return; }
    var texto = ultimosGerados.map(formatarUmaLinhaEndereco).join("\n");
    copiarTexto(texto, btnCopiarUma);
  }

  // ─── Registro de eventos ─────────────────────────────────────────────────────

  paisSelect.addEventListener("change", atualizarRegioes);
  btnGerar.addEventListener("click", handleGerar);
  btnCopiarMulti.addEventListener("click", handleCopiarMulti);
  btnCopiarUma.addEventListener("click", handleCopiarUma);

  // Inicializa select de regiões com o país default (Brasil)
  atualizarRegioes();

})();
