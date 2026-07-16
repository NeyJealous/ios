/**
 * Read-only CODEX-04A migration preview. No provider methods and no writes.
 */
var TI = TI || {};

TI.AccountExclusionMigration = {
  FLAG_FIELDS: Object.freeze([
    "Sync_Enabled",
    "Calculation_Enabled",
    "Display_Enabled",
    "Recommendations_Enabled",
    "History_Enabled"
  ]),

  HISTORY_SHEETS: Object.freeze(["Сделки", "Операции"]),
  CURRENT_SHEETS: Object.freeze(["Портфель", "Данные источников", "Кэш", "API Операции", "API Счета"]),
  RECALC_SHEETS: Object.freeze([
    "Лоты FIFO", "Продажи FIFO", "Ошибки FIFO", "Налоги", "Ребалансировка",
    "Решения", "План сделок", "Советник", "Здоровье портфеля",
    "Интеллект портфеля", "Визуализация", "Главная"
  ]),

  suffix: function(value) {
    var text = String(value || "").trim();
    return text ? "…" + text.slice(-6) : "";
  },

  rows: function(sheet) {
    if (!sheet || sheet.getLastRow() < 1) return { headers: [], rows: [] };
    var values = sheet.getDataRange().getValues();
    var headers = (values.shift() || []).map(function(value) { return String(value || "").trim(); });
    return {
      headers: headers,
      rows: values.map(function(valuesRow, index) {
        return { rowNumber: index + 2, values: valuesRow };
      }).filter(function(item) {
        return item.values.some(function(value) { return String(value || "").trim() !== ""; });
      })
    };
  },

  inspect: function(accountId) {
    accountId = String(accountId || "").trim();
    if (!accountId) {
      return { ok: false, readOnly: true, code: "TARGET_ACCOUNT_ID_REQUIRED", externalApiCalls: 0 };
    }

    var spreadsheet = SpreadsheetApp.getActive();
    var accountsSheet = spreadsheet.getSheetByName(CORE.SHEETS.ACCOUNTS);
    var accounts = this.rows(accountsSheet);
    var idColumn = accounts.headers.indexOf("ID счёта");
    if (idColumn < 0) {
      return { ok: false, readOnly: true, code: "ACCOUNT_ID_COLUMN_MISSING", externalApiCalls: 0 };
    }
    var targetRows = accounts.rows.filter(function(item) {
      return String(item.values[idColumn] || "").trim() === accountId;
    });
    if (targetRows.length !== 1) {
      return {
        ok: false,
        readOnly: true,
        code: targetRows.length ? "TARGET_ACCOUNT_ID_DUPLICATE" : "TARGET_ACCOUNT_ID_NOT_FOUND",
        accountIdSuffix: this.suffix(accountId),
        matches: targetRows.length,
        externalApiCalls: 0
      };
    }

    var target = targetRows[0];
    var fields = TI.FIFO.fieldsByTitle(CORE.SHEETS.ACCOUNTS);
    var targetObject = {};
    accounts.headers.forEach(function(title, index) {
      targetObject[fields[title] || title] = target.values[index];
    });
    var displayName = String(targetObject.accountName || "").trim();
    var sheets = spreadsheet.getSheets();
    var impacted = [];
    var targetHistory = 0;
    var otherHistoryBefore = 0;

    sheets.forEach(function(sheet) {
      var data = TI.AccountExclusionMigration.rows(sheet);
      var exactRows = data.rows.filter(function(item) {
        return item.values.some(function(value) {
          var text = String(value || "").trim();
          return text === accountId || text.indexOf(accountId) !== -1;
        });
      });
      var legacyNameRows = displayName ? data.rows.filter(function(item) {
        if (exactRows.some(function(exact) { return exact.rowNumber === item.rowNumber; })) return false;
        return item.values.some(function(value) { return String(value || "").trim() === displayName; });
      }) : [];
      var isHistory = TI.AccountExclusionMigration.HISTORY_SHEETS.indexOf(sheet.getName()) !== -1;
      if (isHistory) {
        targetHistory += exactRows.length;
        otherHistoryBefore += Math.max(0, data.rows.length - exactRows.length);
      }
      if (exactRows.length || legacyNameRows.length) {
        impacted.push({
          sheet: sheet.getName(),
          exactAccountIdRows: exactRows.length,
          exactRowNumbers: exactRows.map(function(item) { return item.rowNumber; }),
          legacyDisplayNameRows: legacyNameRows.length,
          legacyDisplayNameRowNumbers: legacyNameRows.map(function(item) { return item.rowNumber; }),
          deleteByAccountId: sheet.getName() !== CORE.SHEETS.ACCOUNTS,
          deleteByDisplayName: false,
          rebuildRequired: TI.AccountExclusionMigration.RECALC_SHEETS.indexOf(sheet.getName()) !== -1
        });
      }
    });

    var currentFlags = {};
    this.FLAG_FIELDS.forEach(function(field) { currentFlags[field] = targetObject[field]; });
    var alreadyFlagsOff = this.FLAG_FIELDS.every(function(field) {
      return !TI.AccountScope.isTrue(targetObject[field]);
    });
    var purgeRows = impacted.reduce(function(total, item) {
      return total + (item.deleteByAccountId ? item.exactAccountIdRows : 0);
    }, 0);

    return {
      ok: true,
      readOnly: true,
      code: alreadyFlagsOff && purgeRows === 0 ? "ALREADY_EXCLUDED" : "DRY_RUN_READY",
      externalApiCalls: 0,
      target: {
        accountIdSuffix: this.suffix(accountId),
        displayName: displayName,
        accountType: targetObject.accountType || "",
        status: targetObject.active || "",
        rowNumber: target.rowNumber,
        currentFlags: currentFlags,
        proposedFlags: {
          Sync_Enabled: false,
          Calculation_Enabled: false,
          Display_Enabled: false,
          Recommendations_Enabled: false,
          History_Enabled: false
        }
      },
      impactedSheets: impacted,
      cacheKeysToClear: impacted.filter(function(item) {
        return TI.AccountExclusionMigration.CURRENT_SHEETS.indexOf(item.sheet) !== -1;
      }).map(function(item) { return item.sheet + ":" + TI.AccountExclusionMigration.suffix(accountId); }),
      recalculatedSheets: this.RECALC_SHEETS.slice(),
      expectedWriteSet: ["Счета: five flags on row " + target.rowNumber].concat(this.RECALC_SHEETS),
      expectedDeleteRows: purgeRows,
      historySafety: {
        targetRowsToDelete: targetHistory,
        otherAccountRowsBefore: otherHistoryBefore,
        otherAccountRowsAfterExpected: otherHistoryBefore,
        otherAccountHistoryDecreases: false
      },
      rollbackSource: "Google Sheets backup + private account archive",
      targetOnly: true
    };
  }
};

function TI_DryRunExcludeAccount(accountId) {
  return TI.AccountExclusionMigration.inspect(accountId);
}
