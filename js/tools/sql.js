// js/tools/sql.js — lógica do Identador e Formatador de SQL.
// Carregado APENAS em tools/sql/index.html, após js/main.js.
// Padrão defensivo: todo acesso ao DOM é precedido de verificação (if (el)).
// Anti-XSS: saída inserida exclusivamente via .value (textarea) — nunca innerHTML.
//
// NOTA: esta é uma formatação HEURÍSTICA baseada em palavras-chave, não um parser
// SQL completo. Strings entre aspas simples são protegidas na medida do possível,
// mas comentários SQL (-- e /* */) e strings com conteúdo SQL interno podem não
// ser 100% preservados em todos os casos. Consulte o FAQ da página para detalhes.

(function () {
  "use strict";

  // --- Referências ao DOM ---
  var inputEl   = document.getElementById("sql-input");
  var outputEl  = document.getElementById("sql-output");
  var selectEl  = document.getElementById("indent-select");
  var chkUpper  = document.getElementById("chk-uppercase");
  var btnFormat = document.getElementById("btn-format");
  var btnMinify = document.getElementById("btn-minify");
  var btnClear  = document.getElementById("btn-clear");
  var btnCopy   = document.getElementById("btn-copy");

  // Guard inicial — interrompe silenciosamente se os elementos não existirem.
  if (
    !inputEl || !outputEl || !selectEl || !chkUpper ||
    !btnFormat || !btnMinify || !btnClear || !btnCopy
  ) {
    return;
  }

  // ─── Cláusulas principais (ordem: compostas/mais longas primeiro) ───────────
  //
  // A ordem é CRÍTICA: cláusulas compostas ("INNER JOIN", "GROUP BY", "ORDER BY",
  // "INSERT INTO", "DELETE FROM", "UNION ALL") devem vir ANTES das suas
  // sub-palavras ("JOIN", "BY", "INTO", "FROM", "UNION") para garantir que o
  // replace das compostas aconteça primeiro e as sub-palavras não quebrem tokens
  // já marcados.

  var CLAUSES_TOP = [
    "INSERT INTO",
    "DELETE FROM",
    "UNION ALL",
    "GROUP BY",
    "ORDER BY",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "SELECT",
    "FROM",
    "JOIN",
    "ON",
    "WHERE",
    "AND",
    "OR",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "VALUES",
    "UPDATE",
    "SET"
  ];

  // ─── Tokenização para proteção de strings ──────────────────────────────────

  /**
   * Divide a query em tokens: strings entre aspas simples e o restante.
   * Retorna um array de { type: 'string'|'sql', value: string }.
   *
   * Strings entre aspas simples (incluindo aspas escapadas '' dentro delas)
   * são marcadas como 'string' para não sofrer transformações de cláusula.
   *
   * Limitação documentada: comentários SQL (-- e /* *\/) são tratados como
   * SQL normal (não isolados como tokens próprios).
   */
  function tokenize(sql) {
    var tokens = [];
    var i = 0;
    var len = sql.length;
    var buf = "";

    while (i < len) {
      if (sql[i] === "'") {
        // Flush do buffer SQL acumulado
        if (buf !== "") {
          tokens.push({ type: "sql", value: buf });
          buf = "";
        }
        // Coleta a string entre aspas simples (suporta '' como escape de aspas)
        var strBuf = "'";
        i++;
        while (i < len) {
          if (sql[i] === "'" && i + 1 < len && sql[i + 1] === "'") {
            // Aspas simples escapadas dentro da string: ''
            strBuf += "''";
            i += 2;
          } else if (sql[i] === "'") {
            strBuf += "'";
            i++;
            break;
          } else {
            strBuf += sql[i];
            i++;
          }
        }
        tokens.push({ type: "string", value: strBuf });
      } else {
        buf += sql[i];
        i++;
      }
    }

    if (buf !== "") {
      tokens.push({ type: "sql", value: buf });
    }

    return tokens;
  }

  // ─── Utilitários ───────────────────────────────────────────────────────────

  /**
   * Retorna o valor de indentação selecionado: "  " (2 esp), "    " (4 esp)
   * ou "\t" (tab).
   */
  function getIndent() {
    var val = selectEl ? selectEl.value : "2";
    if (val === "tab") return "\t";
    var n = parseInt(val, 10) || 2;
    var s = "";
    for (var i = 0; i < n; i++) { s += " "; }
    return s;
  }

  /** Retorna true se a opção "palavras-chave em maiúsculas" está marcada. */
  function shouldUppercase() {
    return chkUpper ? chkUpper.checked : true;
  }

  /**
   * Normaliza espaços em branco: colapsa múltiplos espaços/tabs/newlines
   * em um único espaço e remove espaços nas pontas.
   */
  function normalizeSpaces(str) {
    return str.replace(/[\s\n\r\t]+/g, " ").trim();
  }

  // ─── Conjunto completo de palavras-chave SQL reconhecidas ─────────────────
  //
  // Inclui as cláusulas principais de CLAUSES_TOP mais palavras-chave comuns
  // que aparecem no corpo das cláusulas (operadores, funções, tipos, etc.).
  // A correspondência é feita palavra-a-palavra (boundary de espaços) para
  // nunca tocar em identificadores.

  var SQL_KEYWORDS_SET = (function () {
    var kws = [
      // Cláusulas principais (já em CLAUSES_TOP)
      "SELECT", "FROM", "WHERE", "JOIN", "ON", "AND", "OR", "NOT",
      "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
      "GROUP", "ORDER", "BY", "HAVING", "LIMIT", "OFFSET",
      "UNION", "ALL", "INTERSECT", "EXCEPT",
      "INNER", "LEFT", "RIGHT", "FULL", "CROSS", "OUTER",
      // Operadores e predicados
      "AS", "IN", "IS", "NULL", "LIKE", "BETWEEN", "EXISTS",
      "CASE", "WHEN", "THEN", "ELSE", "END",
      "DISTINCT", "TOP",
      // Funções de agregação e comuns
      "COUNT", "SUM", "AVG", "MIN", "MAX",
      "COALESCE", "NULLIF", "ISNULL", "IFNULL", "NVL",
      "CAST", "CONVERT", "TRIM", "UPPER", "LOWER", "LENGTH",
      "SUBSTRING", "SUBSTR", "REPLACE", "CONCAT",
      "NOW", "GETDATE", "CURRENT_DATE", "CURRENT_TIMESTAMP",
      "DATE", "TIME", "YEAR", "MONTH", "DAY",
      "ROW_NUMBER", "RANK", "DENSE_RANK", "OVER", "PARTITION",
      // DDL
      "CREATE", "TABLE", "ALTER", "DROP", "INDEX",
      "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE",
      "DEFAULT", "CONSTRAINT", "CHECK", "AUTO_INCREMENT",
      // Tipos de dados comuns
      "INT", "INTEGER", "BIGINT", "SMALLINT", "TINYINT",
      "VARCHAR", "CHAR", "TEXT", "NVARCHAR", "NCHAR",
      "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL",
      "BOOLEAN", "BOOL", "BIT",
      "DATETIME", "TIMESTAMP", "INTERVAL",
      // Outros
      "WITH", "RECURSIVE", "RETURNING", "EXPLAIN", "ANALYZE"
    ];
    var set = {};
    for (var i = 0; i < kws.length; i++) {
      set[kws[i]] = true;
    }
    return set;
  }());

  /**
   * Converte para maiúsculas APENAS as palavras que são palavras-chave SQL
   * reconhecidas em SQL_KEYWORDS_SET. Identificadores, aliases e valores
   * numéricos/literais mantêm a caixa original.
   *
   * A comparação é feita com toUpperCase() da palavra mas a substituição
   * só ocorre se a versão em maiúsculas estiver no conjunto de keywords.
   *
   * @param {string} sql — query normalizada (espaços colapsados), com
   *                       strings já substituídas por placeholders.
   * @returns {string}
   */
  function uppercaseKeywordsOnly(sql) {
    // Divide preservando separadores (espaços), substitui palavra a palavra.
    return sql.replace(/[^\s]+/g, function (word) {
      // Remove pontuação trailing para checar só a palavra pura
      // (ex.: "FROM," ou "WHERE;" não devem interferir).
      // Separamos o sufixo de pontuação do token palavra.
      var match = word.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(.*)$/);
      if (match) {
        var token = match[1];
        var suffix = match[2];
        if (SQL_KEYWORDS_SET[token.toUpperCase()]) {
          return token.toUpperCase() + suffix;
        }
        return word; // identificador — preserva caixa original
      }
      // Não é uma palavra alfanumérica (número, operador, etc.) — passa direto
      return word;
    });
  }

  // ─── Marcação de cláusulas ─────────────────────────────────────────────────

  // Marcador único que não aparece em SQL real.
  var CLAUSE_MARKER = "\x01";

  /**
   * Insere CLAUSE_MARKER imediatamente antes de cada cláusula principal no texto
   * SQL (já normalizado e uppercase). Cada cláusula deve ser uma palavra inteira:
   * precedida por início ou espaço, seguida por espaço ou fim de string.
   *
   * A detecção é feita palavra-a-palavra para cláusulas compostas:
   *   - Percorre o sql token-a-token (split por espaço).
   *   - Tenta casar 1 ou 2 palavras contra a lista de cláusulas.
   *   - Marca o início da cláusula com CLAUSE_MARKER.
   *
   * Esta abordagem garante que "ORDER BY" seja detectado antes de "OR",
   * e que "OR" dentro de "ORDER" não cause falso positivo.
   */
  function markClauses(sql, upper) {
    // Constrói um Set de 1-word e 2-word keywords para lookup rápido
    var kw1 = {};  // single-word clauses → true
    var kw2 = {};  // first word of two-word clauses → second word

    CLAUSES_TOP.forEach(function (clause) {
      var normalized = upper ? clause.toUpperCase() : clause;
      var parts = normalized.split(" ");
      if (parts.length === 1) {
        kw1[parts[0]] = true;
      } else if (parts.length === 2) {
        if (!kw2[parts[0]]) { kw2[parts[0]] = []; }
        kw2[parts[0]].push(parts[1]);
      }
    });

    // Divide em palavras preservando os separadores (espaços) para reconstrução
    // Usamos split com captura para manter os separadores.
    var parts = sql.split(/(\s+)/);
    var result = [];
    var i = 0;

    while (i < parts.length) {
      var word = parts[i];

      // Partes de separador passam direto
      if (/^\s+$/.test(word)) {
        result.push(word);
        i++;
        continue;
      }

      var wordUp = word.toUpperCase();

      // Tenta casar cláusula de duas palavras primeiro (ex: "ORDER BY")
      var matched2 = false;
      if (kw2[wordUp]) {
        // Pega a próxima palavra não-espaço
        var j = i + 1;
        while (j < parts.length && /^\s+$/.test(parts[j])) { j++; }
        if (j < parts.length) {
          var nextWord = parts[j].toUpperCase();
          var candidates = kw2[wordUp];
          for (var k = 0; k < candidates.length; k++) {
            if (candidates[k] === nextWord) {
              // Casa: marca e inclui as duas palavras (e o espaço entre elas)
              result.push(CLAUSE_MARKER);
              result.push(word);
              // Inclui o(s) separador(es) entre as duas palavras
              for (var m = i + 1; m < j; m++) { result.push(parts[m]); }
              result.push(parts[j]);
              i = j + 1;
              matched2 = true;
              break;
            }
          }
        }
      }

      if (matched2) { continue; }

      // Tenta casar cláusula de uma palavra (ex: "SELECT", "WHERE")
      if (kw1[wordUp]) {
        result.push(CLAUSE_MARKER);
        result.push(word);
        i++;
        continue;
      }

      // Palavra comum — passa direto
      result.push(word);
      i++;
    }

    return result.join("");
  }

  // ─── Formatador principal ───────────────────────────────────────────────────

  /**
   * Formata a query SQL com indentação e palavras-chave opcionalmente em maiúsculas.
   *
   * Abordagem:
   * 1. Tokeniza para isolar strings entre aspas simples (protege contra falsos
   *    positivos de cláusulas dentro de strings).
   * 2. Substitui tokens de string por placeholders numéricos.
   * 3. Normaliza espaços nos tokens SQL e opcionalmente faz uppercase.
   * 4. Marca cláusulas principais com CLAUSE_MARKER (percorre palavra a palavra).
   * 5. Divide pelos marcadores e formata cada segmento.
   * 6. Restaura os placeholders com os valores originais das strings.
   */
  function formatSQL(rawSql) {
    var indent = getIndent();
    var upper  = shouldUppercase();

    // Passo 1: tokenizar para isolar strings entre aspas simples
    var tokens = tokenize(rawSql);

    // Passo 2: substituir tokens de string por placeholders únicos
    var placeholders = [];
    var sqlParts = tokens.map(function (tok) {
      if (tok.type === "string") {
        var idx = placeholders.length;
        placeholders.push(tok.value);
        return "\x00STR" + idx + "\x00";
      }
      return tok.value;
    });

    var sql = sqlParts.join("");

    // Passo 3: normalizar espaços e opcionalmente fazer uppercase
    // APENAS nas palavras-chave SQL reconhecidas, preservando a caixa original
    // de identificadores (tabelas, colunas, aliases) e de strings (já protegidas
    // por placeholders).
    sql = normalizeSpaces(sql);
    if (upper) {
      sql = uppercaseKeywordsOnly(sql);
    }

    // Passo 4: marcar cláusulas (word-by-word, compostas primeiro)
    sql = markClauses(sql, upper);

    // Passo 5: dividir em segmentos por cláusula
    var segments = sql.split(CLAUSE_MARKER).filter(function (s) {
      return s.trim() !== "";
    });

    // Passo 6: formatar cada segmento
    var lines = segments.map(function (seg) {
      seg = seg.trim();
      if (!seg) { return ""; }

      // Detecta qual cláusula abre este segmento (prioridade: compostas primeiro)
      var clauseName = "";
      for (var i = 0; i < CLAUSES_TOP.length; i++) {
        var kw = upper ? CLAUSES_TOP[i].toUpperCase() : CLAUSES_TOP[i];
        var segUp = seg.toUpperCase();
        var kwUp = kw.toUpperCase();
        // Deve ser exatamente o início seguido de espaço ou fim
        if (segUp === kwUp || segUp.indexOf(kwUp + " ") === 0) {
          clauseName = kw;
          break;
        }
      }

      if (clauseName === "") {
        // Não identificou cláusula — passa o segmento intacto
        return seg;
      }

      // Corpo após a cláusula
      var body = seg.slice(clauseName.length).trim();

      if (body === "") {
        return clauseName;
      }

      // SELECT e SET: expandir itens separados por vírgula em linhas próprias
      // (ignora vírgulas dentro de parênteses — ex.: COALESCE(a, b))
      var isListClause = (clauseName.toUpperCase() === "SELECT" ||
                          clauseName.toUpperCase() === "SET");
      if (isListClause) {
        var items = splitByTopLevelComma(body);
        if (items.length > 1) {
          return clauseName + "\n" +
            items.map(function (item) {
              return indent + item.trim();
            }).join(",\n");
        }
      }

      // Demais cláusulas: corpo na mesma linha separado por espaço
      return clauseName + " " + body;
    });

    // Passo 7: juntar as linhas formatadas
    var formatted = lines.filter(function (l) { return l !== ""; }).join("\n");

    // Passo 8: restaurar placeholders de string com os valores originais
    formatted = formatted.replace(/\x00STR(\d+)\x00/g, function (_, idx) {
      return placeholders[parseInt(idx, 10)];
    });

    return formatted;
  }

  /**
   * Divide uma string pelos tokens de vírgula no nível superior (depth 0),
   * ignorando vírgulas dentro de parênteses.
   * Ex.: "a, COALESCE(b, c), d" → ["a", " COALESCE(b, c)", " d"]
   */
  function splitByTopLevelComma(str) {
    var items = [];
    var depth = 0;
    var current = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === "(") {
        depth++;
        current += ch;
      } else if (ch === ")") {
        depth--;
        current += ch;
      } else if (ch === "," && depth === 0) {
        items.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current !== "") {
      items.push(current);
    }
    return items;
  }

  // ─── Minificador ───────────────────────────────────────────────────────────

  /**
   * Minifica a query SQL: preserva strings entre aspas simples intactas e
   * colapsa todo o restante em uma linha com espaços normalizados.
   *
   * Para garantir espaçamento correto ao redor de tokens de string,
   * o resultado é montado parte a parte com um espaço entre tokens SQL
   * e de string apenas quando necessário.
   */
  function minifySQL(rawSql) {
    var tokens = tokenize(rawSql);
    var parts = [];

    tokens.forEach(function (tok) {
      if (tok.type === "string") {
        // String: inclui sem modificação
        parts.push(tok.value);
      } else {
        // SQL: normaliza espaços internos
        var normalized = normalizeSpaces(tok.value);
        if (normalized !== "") {
          parts.push(normalized);
        }
      }
    });

    // Reconstrói: adiciona espaço entre partes, exceto quando a junção já
    // é naturalmente separada por operadores ou vírgulas que não precisam de espaço.
    // Para simplicidade e segurança, junta sempre com espaço e depois limpa
    // espaços desnecessários ao redor de vírgulas e parênteses.
    var joined = parts.join(" ").trim();

    // Remove espaço antes de vírgula: "a , b" → "a, b"
    joined = joined.replace(/\s+,/g, ",");
    // Remove espaço após "(" e antes de ")": "( a )" → "(a)"
    joined = joined.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");

    return joined;
  }

  // ─── Handlers dos botões ───────────────────────────────────────────────────

  function handleFormat() {
    if (!inputEl || !outputEl) { return; }

    var text = inputEl.value.trim();
    if (text === "") {
      outputEl.value = "";
      return;
    }

    try {
      outputEl.value = formatSQL(text);
    } catch (e) {
      // Falha inesperada — exibe a query original sem formatação, nunca quebra
      outputEl.value = text;
    }
  }

  function handleMinify() {
    if (!inputEl || !outputEl) { return; }

    var text = inputEl.value.trim();
    if (text === "") {
      outputEl.value = "";
      return;
    }

    try {
      outputEl.value = minifySQL(text);
    } catch (e) {
      outputEl.value = text;
    }
  }

  function handleClear() {
    if (inputEl)  { inputEl.value  = ""; }
    if (outputEl) { outputEl.value = ""; }
  }

  /**
   * Copia o conteúdo da área de saída para o clipboard.
   * Usa a Clipboard API moderna com fallback para execCommand (browsers legados).
   */
  function handleCopy() {
    if (!outputEl) { return; }

    var text = outputEl.value;
    if (text === "") { return; }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.DevHelper.flashButton(btnCopy, "Copiado!");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  /**
   * Fallback de cópia via elemento temporário + execCommand.
   * Usado em contextos sem Clipboard API (HTTP não-seguro, browsers antigos).
   */
  function fallbackCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.style.position = "fixed";
    tmp.style.opacity  = "0";
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    try {
      document.execCommand("copy");
      window.DevHelper.flashButton(btnCopy, "Copiado!");
    } catch (e) {
      // Silencia — o usuário pode copiar manualmente
    } finally {
      document.body.removeChild(tmp);
    }
  }

  // --- Registro de eventos ---
  btnFormat.addEventListener("click", handleFormat);
  btnMinify.addEventListener("click", handleMinify);
  btnClear.addEventListener("click",  handleClear);
  btnCopy.addEventListener("click",   handleCopy);

})();
