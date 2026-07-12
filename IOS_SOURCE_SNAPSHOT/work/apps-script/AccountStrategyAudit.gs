/**
 * Read-only CODEX-02 audit of account, strategy and portfolio links.
 */
TI.AccountStrategyAudit = {

  SHEETS: [
    "Счета",
    "Стратегии",
    "Стратегии счетов",
    "Портфель",
    "Здоровье портфеля",
    "Главная",
    "Советник",
    "План сделок"
  ],

  snapshot: function() {
    var spreadsheet = SpreadsheetApp.openById("1s3l54M4sAILAd31nfMRKXS7R2NHX2SDYNaqk9nR2p_4");
    var sheets = {};
    var warnings = [];
    var errors = [];
    var runId = this.suffix(Utilities.getUuid());

    this.SHEETS.forEach(function(name) {
      var sheet = spreadsheet.getSheetByName(name);

      if (!sheet) {
        errors.push("Отсутствует лист: " + name);
        sheets[name] = { exists: false, rowCount: 0, headers: [], rows: [] };
        return;
      }

      var values = sheet.getDataRange().getDisplayValues();
      var headers = (values[0] || []).map(function(value) {
        return String(value || "").trim();
      });
      var rows = values.slice(1).filter(function(row) {
        return row.some(function(value) {
          return String(value || "").trim() !== "";
        });
      });

      sheets[name] = {
        exists: true,
        rowCount: rows.length,
        headers: headers,
        rows: rows.slice(0, 200).map(function(row) {
          return TI.AccountStrategyAudit.safeRow(headers, row);
        })
      };
    });

    var accounts = this.index(sheets["Счета"], "ID счёта");
    var strategies = this.index(sheets["Стратегии"], "ID стратегии");
    var links = this.linkAudit(sheets["Стратегии счетов"], accounts, strategies);
    var portfolio = this.portfolioAudit(sheets["Портфель"], accounts);
    var health = this.healthAudit(sheets["Здоровье портфеля"]);

    warnings = warnings.concat(accounts.warnings, strategies.warnings, links.warnings, portfolio.warnings);
    errors = errors.concat(accounts.errors, strategies.errors, links.errors, portfolio.errors);

    return {
      ok: errors.length === 0,
      readOnly: true,
      runId: runId,
      timestamp: new Date().toISOString(),
      counts: {
        accounts: accounts.count,
        strategies: strategies.count,
        accountStrategyLinks: links.count,
        portfolioPositions: portfolio.count,
        portfolioHealthRows: health.count
      },
      warnings: warnings,
      errors: errors,
      accountAudit: accounts.summary,
      strategyAudit: strategies.summary,
      linkAudit: links.summary,
      portfolioAudit: portfolio.summary,
      portfolioHealthAudit: health.summary,
      sheets: sheets
    };
  },

  safeRow: function(headers, row) {
    var result = {};

    headers.forEach(function(header, index) {
      if (!header) {
        return;
      }

      var value = row[index] || "";
      result[header] = /(id|uid|figi|идентификатор)/i.test(header)
        ? TI.AccountStrategyAudit.suffix(value)
        : value;
    });

    return result;
  },

  suffix: function(value) {
    var text = String(value || "").trim();
    return text ? "…" + text.slice(-6) : "";
  },

  number: function(value) {
    var normalized = String(value || "")
      .replace(/\s/g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");
    var result = Number(normalized);
    return isFinite(result) ? result : 0;
  },

  column: function(sheetData, title) {
    return sheetData && sheetData.headers
      ? sheetData.headers.indexOf(title)
      : -1;
  },

  index: function(sheetData, idTitle) {
    var idColumn = this.column(sheetData, idTitle);
    var sourceRows = sheetData && sheetData.rows ? sheetData.rows : [];
    var seen = {};
    var empty = 0;
    var duplicates = [];

    if (idColumn < 0) {
      return {
        count: sourceRows.length,
        ids: {},
        warnings: [],
        errors: ["Отсутствует обязательный столбец: " + idTitle],
        summary: { idColumn: false, emptyIds: sourceRows.length, duplicateIds: [] }
      };
    }

    sourceRows.forEach(function(row) {
      var id = String(row[idTitle] || "").trim();

      if (!id) {
        empty++;
        return;
      }

      if (seen[id]) {
        duplicates.push(TI.AccountStrategyAudit.suffix(id));
      }
      seen[id] = true;
    });

    return {
      count: sourceRows.length,
      ids: seen,
      warnings: empty ? [idTitle + ": пустых значений " + empty] : [],
      errors: duplicates.length ? [idTitle + ": найдены дубли"] : [],
      summary: { idColumn: true, emptyIds: empty, duplicateIds: duplicates }
    };
  },

  linkAudit: function(sheetData, accounts, strategies) {
    var rows = sheetData && sheetData.rows ? sheetData.rows : [];
    var hasStrategyId = this.column(sheetData, "ID стратегии") >= 0;
    var unknownAccounts = [];
    var unknownStrategies = [];
    var nameOnly = 0;

    rows.forEach(function(row) {
      var accountSuffix = String(row["ID счёта"] || "").replace(/^…/, "");
      var strategySuffix = String(row["ID стратегии"] || "").replace(/^…/, "");

      if (!accountSuffix && row["Счёт"]) {
        nameOnly++;
      }
      if (accountSuffix && !Object.keys(accounts.ids).some(function(id) { return id.slice(-6) === accountSuffix; })) {
        unknownAccounts.push("…" + accountSuffix);
      }
      if (strategySuffix && !Object.keys(strategies.ids).some(function(id) { return id.slice(-6) === strategySuffix; })) {
        unknownStrategies.push("…" + strategySuffix);
      }
    });

    return {
      count: rows.length,
      warnings: nameOnly ? ["Связей только по названию счёта: " + nameOnly] : [],
      errors: hasStrategyId ? [] : ["В листе Стратегии счетов отсутствует ID стратегии"],
      summary: {
        hasAccountId: this.column(sheetData, "ID счёта") >= 0,
        hasStrategyId: hasStrategyId,
        nameOnlyLinks: nameOnly,
        unknownAccountSuffixes: unknownAccounts,
        unknownStrategySuffixes: unknownStrategies
      }
    };
  },

  portfolioAudit: function(sheetData, accounts) {
    var rows = sheetData && sheetData.rows ? sheetData.rows : [];
    var missing = 0;
    var unknown = [];

    rows.forEach(function(row) {
      var accountSuffix = String(row["ID счёта"] || "").replace(/^…/, "");

      if (!accountSuffix) {
        missing++;
      } else if (!Object.keys(accounts.ids).some(function(id) { return id.slice(-6) === accountSuffix; })) {
        unknown.push("…" + accountSuffix);
      }
    });

    return {
      count: rows.length,
      warnings: missing ? ["Позиций без ID счёта: " + missing] : [],
      errors: unknown.length ? ["Позиции с неизвестным ID счёта: " + unknown.length] : [],
      summary: { missingAccountIds: missing, unknownAccountSuffixes: unknown }
    };
  },

  healthAudit: function(sheetData) {
    var rows = sheetData && sheetData.rows ? sheetData.rows : [];
    var aggregate = rows.filter(function(row) { return row["Разрез"] === "Весь портфель"; });
    var accounts = rows.filter(function(row) { return row["Разрез"] === "Счёт"; });

    return {
      count: rows.length,
      summary: {
        aggregateRows: aggregate.length,
        accountRows: accounts.length,
        aggregatePositions: aggregate.length ? this.number(aggregate[0]["Позиций"]) : 0,
        aggregateMarketValue: aggregate.length ? this.number(aggregate[0]["Стоимость бумаг"]) : 0
      }
    };
  },

  persist: function(result) {
    var sheet = TI.Diagnostics.prepare();
    var row = TI.Diagnostics.row(
      result.ok ? TI.Diagnostics.STATUS.OK : TI.Diagnostics.STATUS.ERROR,
      "CODEX-02",
      "Account/Strategy links",
      "Счета: " + result.counts.accounts +
        ", стратегии: " + result.counts.strategies +
        ", связи: " + result.counts.accountStrategyLinks +
        ", позиции: " + result.counts.portfolioPositions + ". Run ID: " + result.runId,
      result.errors.concat(result.warnings).join("; ")
    );
    var values = [Schema.buildRow(CORE.SHEETS.DIAGNOSTICS, row)];
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
  }
};

/**
 * @param {boolean=} persist Write one summary row to Diagnostics when true.
 * @return {Object} JSON-safe audit result.
 */
function TI_AuditAccountStrategyLinks(persist) {
  var result = TI.AccountStrategyAudit.snapshot();

  if (persist === true) {
    TI.AccountStrategyAudit.persist(result);
  }

  return result;
}
