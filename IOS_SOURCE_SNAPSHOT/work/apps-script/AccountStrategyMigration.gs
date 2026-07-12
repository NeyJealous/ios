/**
 * Controlled one-time CODEX-02 migration for account/strategy identifiers.
 */
TI.AccountStrategyMigration = {
  SPREADSHEET_ID: "1s3l54M4sAILAd31nfMRKXS7R2NHX2SDYNaqk9nR2p_4",
  LINK_SHEET: "Стратегии счетов",
  EXPECTED_LINK_HEADERS: [
    "Счёт", "Стратегия", "Дата начала", "Активна", "Лимиты",
    "Резерв", "Комментарий", "ID счёта"
  ],

  suffix: function(value) {
    var text = String(value || "").trim();
    return text ? "…" + text.slice(-6) : "";
  },

  fail: function(code, message, details) {
    return {
      ok: false,
      code: code,
      message: message,
      details: details || {},
      changed: false
    };
  },

  rows: function(sheet) {
    var values = sheet.getDataRange().getValues();
    var headers = (values[0] || []).map(function(value) {
      return String(value || "").trim();
    });
    return {
      values: values,
      headers: headers,
      rows: values.slice(1).filter(function(row) {
        return row.some(function(value) { return String(value || "").trim() !== ""; });
      })
    };
  },

  index: function(headers, title) {
    return headers.indexOf(title);
  },

  duplicateCount: function(rows, column) {
    var seen = {};
    var duplicates = 0;
    rows.forEach(function(row) {
      var value = String(row[column] || "").trim();
      if (!value) return;
      if (seen[value]) duplicates += 1;
      seen[value] = true;
    });
    return duplicates;
  },

  digest: function(value) {
    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(value)
    );
    return bytes.map(function(byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    }).join("");
  },

  inspect: function() {
    var spreadsheet = SpreadsheetApp.openById(this.SPREADSHEET_ID);
    var accountsSheet = spreadsheet.getSheetByName("Счета");
    var strategiesSheet = spreadsheet.getSheetByName("Стратегии");
    var linksSheet = spreadsheet.getSheetByName(this.LINK_SHEET);
    var portfolioSheet = spreadsheet.getSheetByName("Портфель");

    if (!accountsSheet || !strategiesSheet || !linksSheet || !portfolioSheet) {
      return this.fail("SHEET_MISSING", "Один из обязательных листов отсутствует.");
    }

    var accounts = this.rows(accountsSheet);
    var strategies = this.rows(strategiesSheet);
    var links = this.rows(linksSheet);
    var portfolio = this.rows(portfolioSheet);
    var accountIdCol = this.index(accounts.headers, "ID счёта");
    var accountNameCol = this.index(accounts.headers, "Счёт");
    var strategyIdCol = this.index(strategies.headers, "ID стратегии");
    var strategyNameCol = this.index(strategies.headers, "Стратегия");
    var linkAccountNameCol = this.index(links.headers, "Счёт");
    var linkStrategyNameCol = this.index(links.headers, "Стратегия");
    var linkAccountIdCol = this.index(links.headers, "ID счёта");
    var linkStrategyIdCol = this.index(links.headers, "ID стратегии");
    var portfolioAccountIdCol = this.index(portfolio.headers, "ID счёта");
    var errors = [];

    if (accounts.rows.length !== 3) errors.push("ACCOUNTS_COUNT");
    if (accountIdCol < 0 || accounts.rows.some(function(row) { return !String(row[accountIdCol] || "").trim(); })) errors.push("ACCOUNT_ID_EMPTY");
    if (accountIdCol >= 0 && this.duplicateCount(accounts.rows, accountIdCol)) errors.push("ACCOUNT_ID_DUPLICATE");
    if (strategies.rows.length !== 1) errors.push("STRATEGIES_COUNT");
    if (strategyIdCol < 0 || strategies.rows.some(function(row) { return !String(row[strategyIdCol] || "").trim(); })) errors.push("STRATEGY_ID_EMPTY");
    if (strategyIdCol >= 0 && this.duplicateCount(strategies.rows, strategyIdCol)) errors.push("STRATEGY_ID_DUPLICATE");
    if (links.rows.length !== 1) errors.push("LINKS_COUNT");
    if (links.headers.join("|") !== this.EXPECTED_LINK_HEADERS.join("|")) errors.push("LINK_STRUCTURE_CHANGED");
    if (linkAccountIdCol < 0 || (links.rows[0] && String(links.rows[0][linkAccountIdCol] || "").trim())) errors.push("LINK_ACCOUNT_ID_NOT_EMPTY");
    if (linkStrategyIdCol >= 0 && links.rows[0] && String(links.rows[0][linkStrategyIdCol] || "").trim()) errors.push("LINK_STRATEGY_ID_NOT_EMPTY");
    if (!links.rows[0] || String(links.rows[0][linkAccountNameCol] || "").trim() !== "Пасивный") errors.push("LINK_DISPLAY_NAME_CHANGED");
    if (!links.rows[0] || String(links.rows[0][linkStrategyNameCol] || "").trim() !== "Базовая стратегия") errors.push("LINK_STRATEGY_NAME_CHANGED");

    var accountIds = {};
    accounts.rows.forEach(function(row) { accountIds[String(row[accountIdCol] || "").trim()] = true; });
    if (portfolioAccountIdCol < 0 || portfolio.rows.some(function(row) {
      var id = String(row[portfolioAccountIdCol] || "").trim();
      return !id || !accountIds[id];
    })) errors.push("PORTFOLIO_ACCOUNT_ID_INVALID");

    var canonicalAccount = accounts.rows.filter(function(row) {
      return String(row[accountNameCol] || "").trim() === "Пассивный";
    });
    var canonicalStrategy = strategies.rows.filter(function(row) {
      return String(row[strategyNameCol] || "").trim() === "Базовая стратегия";
    });
    if (canonicalAccount.length !== 1) errors.push("ACCOUNT_MAPPING_AMBIGUOUS");
    if (canonicalStrategy.length !== 1) errors.push("STRATEGY_MAPPING_AMBIGUOUS");

    if (errors.length) {
      return this.fail("PRECONDITION_FAILED", "Миграция не применена.", { errors: errors });
    }

    return {
      ok: true,
      code: "PRECONDITIONS_OK",
      changed: false,
      spreadsheetSuffix: this.suffix(spreadsheet.getId()),
      sheetCount: spreadsheet.getSheets().length,
      targetSheet: this.LINK_SHEET,
      targetRow: 2,
      addedColumn: "ID стратегии",
      before: {
        accountName: "Пасивный",
        strategyName: "Базовая стратегия",
        accountId: "",
        strategyId: ""
      },
      after: {
        accountName: "Пассивный",
        strategyName: "Базовая стратегия",
        accountId: this.suffix(canonicalAccount[0][accountIdCol]),
        strategyId: this.suffix(canonicalStrategy[0][strategyIdCol])
      },
      fullAccountId: String(canonicalAccount[0][accountIdCol]),
      fullStrategyId: String(canonicalStrategy[0][strategyIdCol]),
      portfolioDigest: this.digest(portfolio.values),
      linkValues: links.values,
      linkFormulas: linksSheet.getDataRange().getFormulas()
    };
  },

  publicResult: function(result) {
    if (!result.ok) return result;
    return {
      ok: true,
      code: result.code,
      changed: result.changed,
      spreadsheetSuffix: result.spreadsheetSuffix,
      sheetCount: result.sheetCount,
      targetSheet: result.targetSheet,
      targetRow: result.targetRow,
      addedColumn: result.addedColumn,
      before: result.before,
      after: result.after,
      portfolioDigestSuffix: this.suffix(result.portfolioDigest)
    };
  },

  dryRun: function() {
    return this.publicResult(this.inspect());
  },

  createBackup: function() {
    var inspected = this.inspect();
    if (!inspected.ok) return inspected;
    var spreadsheet = SpreadsheetApp.openById(this.SPREADSHEET_ID);
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    var name = "CODEX-02 Account Strategy Backup " + stamp;
    var backup = spreadsheet.copy(name);
    return {
      ok: true,
      code: "BACKUP_CREATED",
      changed: false,
      timestamp: new Date().toISOString(),
      backupName: name,
      originalSpreadsheetSuffix: this.suffix(spreadsheet.getId()),
      backupSpreadsheetSuffix: this.suffix(backup.getId()),
      sheetCount: backup.getSheets().length,
      sheetsToChange: [this.LINK_SHEET],
      before: inspected.before,
      after: inspected.after
    };
  },

  apply: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return this.fail("LOCK_TIMEOUT", "Не удалось получить lock.");

    var inspected;
    var sheet;
    var originalValues;
    var originalColumns;
    var inserted = false;
    try {
      inspected = this.inspect();
      if (!inspected.ok) return inspected;
      if (inspected.linkFormulas.some(function(row) { return row.some(function(value) { return value !== ""; }); })) {
        return this.fail("TARGET_FORMULA_FOUND", "В изменяемом диапазоне обнаружена формула.");
      }

      var spreadsheet = SpreadsheetApp.openById(this.SPREADSHEET_ID);
      sheet = spreadsheet.getSheetByName(this.LINK_SHEET);
      originalValues = inspected.linkValues;
      originalColumns = sheet.getLastColumn();
      var newHeaders = originalValues[0].slice();
      var newRow = originalValues[1].slice();
      newHeaders.push("ID стратегии");
      newRow[0] = "Пассивный";
      newRow[7] = inspected.fullAccountId;
      newRow.push(inspected.fullStrategyId);

      sheet.insertColumnAfter(originalColumns);
      inserted = true;
      sheet.getRange(1, 1, 2, newHeaders.length).setValues([newHeaders, newRow]);
      sheet.hideColumns(newHeaders.length);
      SpreadsheetApp.flush();

      var after = this.validateApplied(inspected.portfolioDigest);
      if (!after.ok) throw new Error(after.code + ": " + after.message);

      var result = {
        ok: true,
        code: "MIGRATION_APPLIED",
        changed: true,
        runId: this.suffix(Utilities.getUuid()),
        targetSheet: this.LINK_SHEET,
        targetRow: 2,
        addedColumn: "ID стратегии",
        accountId: inspected.after.accountId,
        strategyId: inspected.after.strategyId,
        accountName: "Пассивный",
        strategyName: "Базовая стратегия",
        portfolioUnchanged: true
      };
      this.persist(result);
      return result;
    } catch (error) {
      if (sheet && originalValues) {
        try {
          if (inserted && sheet.getLastColumn() > originalColumns) sheet.deleteColumn(sheet.getLastColumn());
          sheet.getRange(1, 1, originalValues.length, originalColumns).setValues(originalValues);
          SpreadsheetApp.flush();
        } catch (rollbackError) {
          return this.fail("ROLLBACK_FAILED", error.message, { rollback: rollbackError.message });
        }
      }
      return this.fail("APPLY_FAILED_ROLLED_BACK", error.message);
    } finally {
      lock.releaseLock();
    }
  },

  validateApplied: function(portfolioDigest) {
    var spreadsheet = SpreadsheetApp.openById(this.SPREADSHEET_ID);
    var accounts = this.rows(spreadsheet.getSheetByName("Счета"));
    var strategies = this.rows(spreadsheet.getSheetByName("Стратегии"));
    var links = this.rows(spreadsheet.getSheetByName(this.LINK_SHEET));
    var portfolio = this.rows(spreadsheet.getSheetByName("Портфель"));
    var accountIdCol = this.index(accounts.headers, "ID счёта");
    var strategyIdCol = this.index(strategies.headers, "ID стратегии");
    var linkAccountIdCol = this.index(links.headers, "ID счёта");
    var linkStrategyIdCol = this.index(links.headers, "ID стратегии");
    var accountIds = {};
    var strategyIds = {};
    accounts.rows.forEach(function(row) { accountIds[String(row[accountIdCol] || "").trim()] = true; });
    strategies.rows.forEach(function(row) { strategyIds[String(row[strategyIdCol] || "").trim()] = true; });
    var row = links.rows[0] || [];
    var accountId = String(row[linkAccountIdCol] || "").trim();
    var strategyId = String(row[linkStrategyIdCol] || "").trim();
    var valid = links.rows.length === 1 &&
      links.headers.length === 9 &&
      accountId && accountIds[accountId] &&
      strategyId && strategyIds[strategyId] &&
      String(row[0] || "").trim() === "Пассивный" &&
      String(row[1] || "").trim() === "Базовая стратегия" &&
      this.digest(portfolio.values) === portfolioDigest;
    return valid
      ? { ok: true, code: "POST_VALIDATION_OK" }
      : this.fail("POST_VALIDATION_FAILED", "Проверка после записи не пройдена.");
  },

  persist: function(result) {
    var sheet = TI.Diagnostics.prepare();
    var row = TI.Diagnostics.row(
      TI.Diagnostics.STATUS.OK,
      "CODEX-02",
      "Account/Strategy ID migration",
      "Миграция применена. Run ID: " + result.runId,
      "Account ID " + result.accountId + ", Strategy ID " + result.strategyId
    );
    var values = [Schema.buildRow(CORE.SHEETS.DIAGNOSTICS, row)];
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
  }
};

function TI_DryRunAccountStrategyIdMigration() {
  return TI.AccountStrategyMigration.dryRun();
}

function TI_CreateAccountStrategyMigrationBackup() {
  return TI.AccountStrategyMigration.createBackup();
}

function TI_ApplyAccountStrategyIdMigration() {
  return TI.AccountStrategyMigration.apply();
}
