/**
 * CODEX-04A Gate B controlled purge.
 * Direct deletions are limited to exact target Account ID rows in Trades,
 * Portfolio and account-specific Data Cache records.
 */
var TI = TI || {};

TI.AccountPurgeMigration = {
  BACKUP_KEY: "CODEX04A_GATEB_BACKUP",
  COMMIT_KEY: "CODEX04A_GATEB_COMMIT",
  CONTINUATION_KEY: "CODEX04A_GATEB_CONTINUATION",
  GATE_A_COMMIT: "53ab4d0",
  EXPECTED_ARCHIVE_SHA256: "017c5d8f849ec22147cee7c01724506c5a166fd8c3d798b20c812653a166952b",
  EXPECTED_COUNTS: Object.freeze({ trades: 160, portfolio: 1, cache: 17, total: 178, otherTrades: 6 }),
  DERIVED_SHEETS: Object.freeze([
    "Лоты FIFO", "Продажи FIFO", "Ошибки FIFO", "Налоги", "Ребалансировка",
    "Решения", "План сделок", "Советник", "Здоровье портфеля",
    "Интеллект портфеля", "Визуализация", "Стабилизация", "Диагностика", "Главная"
  ]),
  RECALC_STEPS: Object.freeze([
    "fifo", "portfolioNoApi", "visualization", "marketRegime", "strategyTargets",
    "tax", "rebalance", "tradePlan", "decisions", "portfolioHealth",
    "portfolioIntelligence", "advisor", "stabilization", "diagnostics", "main"
  ]),

  spreadsheet: function() {
    return SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
  },

  suffix: function(value) {
    return TI.AccountStrategyAudit.suffix(String(value || "").trim());
  },

  accountIdHeaderIndex: function(headers) {
    for (var i = 0; i < headers.length; i++) {
      if (/^(ID сч[её]та|Account\s*_?ID)$/i.test(String(headers[i] || "").trim())) return i;
    }
    return -1;
  },

  tokenContainsAccountId: function(value, accountId) {
    var text = String(value || "");
    var escaped = String(accountId || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^0-9])" + escaped + "([^0-9]|$)").test(text);
  },

  captureRows: function(sheetName, accountId, cacheMode) {
    var sheet = this.spreadsheet().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return { sheet: sheet, headers: [], rows: [] };
    var range = sheet.getDataRange();
    var values = range.getValues();
    var formulas = range.getFormulas();
    var headers = values[0] || [];
    var idIndex = this.accountIdHeaderIndex(headers);
    if (!cacheMode && idIndex < 0) throw new Error("ACCOUNT_ID_COLUMN_MISSING: " + sheetName);
    var rows = [];
    for (var index = 1; index < values.length; index++) {
      var match = cacheMode
        ? values[index].some(function(value) { return TI.AccountPurgeMigration.tokenContainsAccountId(value, accountId); })
        : String(values[index][idIndex] || "").trim() === accountId;
      if (match) rows.push({ rowNumber: index + 1, values: values[index], formulas: formulas[index] });
    }
    return { sheet: sheet, headers: headers, rows: rows };
  },

  deleteCapturedRows: function(capture) {
    capture.rows.slice().sort(function(a, b) { return b.rowNumber - a.rowNumber; }).forEach(function(row) {
      capture.sheet.deleteRow(row.rowNumber);
    });
    return capture.rows.length;
  },

  restoreCapturedRows: function(capture) {
    if (!capture || !capture.sheet || !capture.rows.length) return 0;
    capture.rows.slice().sort(function(a, b) { return a.rowNumber - b.rowNumber; }).forEach(function(row) {
      capture.sheet.insertRowsBefore(row.rowNumber, 1);
      var range = capture.sheet.getRange(row.rowNumber, 1, 1, row.values.length);
      range.setValues([row.values]);
      (row.formulas || []).forEach(function(formula, index) {
        if (formula) capture.sheet.getRange(row.rowNumber, index + 1).setFormula(formula);
      });
    });
    return capture.rows.length;
  },

  captureSheet: function(sheetName) {
    var sheet = this.spreadsheet().getSheetByName(sheetName);
    if (!sheet) return { sheetName: sheetName, exists: false, values: [], formulas: [] };
    var range = sheet.getDataRange();
    return { sheetName: sheetName, exists: true, values: range.getValues(), formulas: range.getFormulas() };
  },

  restoreSheet: function(capture) {
    if (!capture || !capture.exists) return;
    var sheet = this.spreadsheet().getSheetByName(capture.sheetName);
    if (!sheet) return;
    sheet.getDataRange().clearContent();
    if (!capture.values.length || !capture.values[0].length) return;
    var range = sheet.getRange(1, 1, capture.values.length, capture.values[0].length);
    range.setValues(capture.values);
    capture.formulas.forEach(function(row, rowIndex) {
      row.forEach(function(formula, columnIndex) {
        if (formula) sheet.getRange(rowIndex + 1, columnIndex + 1).setFormula(formula);
      });
    });
  },

  flagVector: function(accountId) {
    return [
      TI.AccountScope.isSyncEnabled(accountId),
      TI.AccountScope.isCalculationEnabled(accountId),
      TI.AccountScope.isDisplayEnabled(accountId),
      TI.AccountScope.isRecommendationEnabled(accountId),
      TI.AccountScope.isHistoryEnabled(accountId)
    ];
  },

  sameVector: function(actual, expected) {
    return actual.length === expected.length && actual.every(function(value, index) { return value === expected[index]; });
  },

  accountConfiguration: function(targetAccountId) {
    var accounts = TI.AccountScope.getAllAccounts();
    var target = accounts.filter(function(account) { return String(account.accountId || "").trim() === targetAccountId; });
    if (accounts.length !== 3 || target.length !== 1) throw new Error("ACCOUNT_REGISTRY_PRECONDITION_FAILED");
    var displayOnly = accounts.filter(function(account) {
      var id = String(account.accountId || "").trim();
      return id !== targetAccountId && TI.AccountPurgeMigration.sameVector(
        TI.AccountPurgeMigration.flagVector(id), [true, false, true, false, true]
      );
    });
    var allEnabled = accounts.filter(function(account) {
      var id = String(account.accountId || "").trim();
      return id !== targetAccountId && TI.AccountPurgeMigration.sameVector(
        TI.AccountPurgeMigration.flagVector(id), [true, true, true, true, true]
      );
    });
    if (!this.sameVector(this.flagVector(targetAccountId), [false, false, false, false, false])) {
      throw new Error("TARGET_FLAGS_NOT_DISABLED");
    }
    if (displayOnly.length !== 1 || allEnabled.length !== 1) throw new Error("OTHER_ACCOUNT_FLAGS_MISMATCH");
    return {
      target: target[0],
      displayOnlyAccountId: String(displayOnly[0].accountId || "").trim(),
      allEnabledAccountId: String(allEnabled[0].accountId || "").trim()
    };
  },

  directCaptures: function(accountId) {
    return {
      trades: this.captureRows(CORE.SHEETS.TRADES, accountId, false),
      portfolio: this.captureRows(CORE.SHEETS.PORTFOLIO, accountId, false),
      cache: this.captureRows(CORE.SHEETS.DATA_CACHE, accountId, true)
    };
  },

  directCounts: function(captures) {
    var counts = {
      trades: captures.trades.rows.length,
      portfolio: captures.portfolio.rows.length,
      cache: captures.cache.rows.length
    };
    counts.total = counts.trades + counts.portfolio + counts.cache;
    return counts;
  },

  preflight: function(accountId) {
    accountId = String(accountId || "").trim();
    var configuration = this.accountConfiguration(accountId);
    var captures = this.directCaptures(accountId);
    var counts = this.directCounts(captures);
    var trades = TI.Data.trades();
    var syncState = TI.BatchSync.status();
    return {
      ok: counts.trades === this.EXPECTED_COUNTS.trades &&
        counts.portfolio === this.EXPECTED_COUNTS.portfolio &&
        counts.cache === this.EXPECTED_COUNTS.cache &&
        counts.total === this.EXPECTED_COUNTS.total &&
        trades.length - counts.trades === this.EXPECTED_COUNTS.otherTrades &&
        (!syncState || syncState.status !== "running"),
      readOnly: true,
      targetAccountIdSuffix: this.suffix(accountId),
      flags: this.flagVector(accountId),
      counts: counts,
      otherTrades: trades.length - counts.trades,
      syncStatus: syncState && syncState.status ? syncState.status : "idle",
      otherAccounts: [configuration.displayOnlyAccountId, configuration.allEnabledAccountId].map(function(id) {
        return { accountIdSuffix: TI.AccountPurgeMigration.suffix(id), flags: TI.AccountPurgeMigration.flagVector(id) };
      }),
      apiCalls: 0,
      writes: 0
    };
  },

  createBackup: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    try {
      var state = TI.BatchSync.status();
      if (state && state.status === "running") return { ok: false, code: "SYNC_ALREADY_RUNNING" };
      var spreadsheet = this.spreadsheet();
      var snapshot = TI.SyncVerification.snapshot();
      var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
      var name = "CODEX-04A Gate B Pre-Purge Backup " + stamp;
      var backup = spreadsheet.copy(name);
      var record = {
        createdAt: new Date().toISOString(),
        backupId: backup.getId(),
        backupName: name,
        sheetCount: backup.getSheets().length,
        gateACommit: this.GATE_A_COMMIT,
        projectVersion: CORE.PROJECT.VERSION,
        sourceSnapshot: snapshot
      };
      PropertiesService.getDocumentProperties().setProperty(this.BACKUP_KEY, JSON.stringify(record));
      return {
        ok: true,
        code: "BACKUP_CREATED",
        createdAt: record.createdAt,
        backupName: name,
        backupSpreadsheetSuffix: this.suffix(record.backupId),
        sheetCount: record.sheetCount,
        gateACommit: record.gateACommit,
        projectVersion: record.projectVersion,
        sourceSnapshot: snapshot
      };
    } finally {
      lock.releaseLock();
    }
  },

  backupRecord: function() {
    var raw = PropertiesService.getDocumentProperties().getProperty(this.BACKUP_KEY);
    if (!raw) throw new Error("GATE_B_BACKUP_MISSING");
    var record = JSON.parse(raw);
    if (!record.backupId || record.sheetCount !== this.spreadsheet().getSheets().length || record.gateACommit !== this.GATE_A_COMMIT) {
      throw new Error("GATE_B_BACKUP_INVALID");
    }
    return record;
  },

  semanticSnapshot: function(sheetNames) {
    var spreadsheet = this.spreadsheet();
    var result = {};
    (sheetNames || []).forEach(function(name) {
      var sheet = spreadsheet.getSheetByName(name);
      result[name] = sheet ? TI.SyncVerification.sheetSnapshot(sheet).semanticDigest : "<missing>";
    });
    return result;
  },

  sameSnapshot: function(first, second) {
    return TI.SyncVerification.digest(first) === TI.SyncVerification.digest(second);
  },

  allowedVolatilitySheetDigest: function(sheetName) {
    var sheet = this.spreadsheet().getSheetByName(sheetName);
    if (!sheet) return "<missing>";
    var values = sheet.getDataRange().getValues();
    var headers = values[0] || [];
    var volatileColumns = {};
    headers.forEach(function(value, index) {
      if (/обновлено|дата расч[её]та|updated|длительность|duration|run id|идентификатор запуска/i.test(String(value || ""))) {
        volatileColumns[index] = true;
      }
    });
    var metricIndex = headers.indexOf("Показатель");
    var valueIndex = headers.indexOf("Значение");
    var semantic = values.map(function(row, rowIndex) {
      return row.map(function(value, columnIndex) {
        if (volatileColumns[columnIndex]) return "<volatile>";
        if (sheetName === CORE.SHEETS.MAIN && rowIndex > 0 && metricIndex >= 0 && valueIndex === columnIndex &&
            String(row[metricIndex] || "").trim() === "Дата и время") return "<volatile>";
        return value instanceof Date ? value.toISOString() : value;
      });
    });
    return TI.SyncVerification.digest(semantic);
  },

  allowedVolatilitySnapshot: function(sheetNames) {
    var result = {};
    (sheetNames || []).forEach(function(name) {
      result[name] = TI.AccountPurgeMigration.allowedVolatilitySheetDigest(name);
    });
    return result;
  },

  runZeroApiRecalc: function(label) {
    var wasNoApi = TI.BatchSync.isNoApiMode();
    var steps = this.RECALC_STEPS.map(function(id) { return { id: id, title: id }; });
    var context = TI.SyncExecution.create("recalc", steps);
    var results = {};
    try {
      TI.BatchSync.setNoApiMode(true);
      TI.SyncExecution.activate(context);
      this.RECALC_STEPS.forEach(function(stepId) {
        TI.SyncExecution.startStep(context, stepId);
        var result = TI.BatchSync.executeStep(stepId, "recalc");
        results[stepId] = result;
        TI.SyncExecution.finishStep(context, stepId, result);
      });
      TI.SyncExecution.finish(context, "complete");
      if (context.apiCallCount !== 0) throw new Error("RECALC_API_CALLS_NON_ZERO");
      return {
        ok: true,
        label: label,
        apiCallCount: context.apiCallCount,
        tradesWrites: 0,
        operationsWrites: 0,
        completedSteps: context.completedSteps.slice(),
        rowsWritten: context.rowsWritten,
        results: results
      };
    } finally {
      TI.SyncExecution.deactivate();
      if (!wasNoApi) TI.BatchSync.setNoApiMode(false);
    }
  },

  countExactAccountRows: function(sheetName, accountId) {
    var sheet = this.spreadsheet().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return 0;
    var values = sheet.getDataRange().getValues();
    var idIndex = this.accountIdHeaderIndex(values[0] || []);
    if (idIndex < 0) return 0;
    return values.slice(1).filter(function(row) { return String(row[idIndex] || "").trim() === accountId; }).length;
  },

  countExactDisplayRows: function(sheetName, displayName) {
    var sheet = this.spreadsheet().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1 || !displayName) return 0;
    return sheet.getDataRange().getValues().slice(1).filter(function(row) {
      return row.some(function(value) { return String(value || "").trim() === displayName; });
    }).length;
  },

  validateAfter: function(accountId, configuration, directoryBefore, linksBefore, tradesDigestAfterPurge) {
    var direct = this.directCounts(this.directCaptures(accountId));
    var trades = TI.Data.trades();
    var keys = {};
    var duplicateKeys = 0;
    trades.forEach(function(trade) {
      var key = TI.Trades.buildTradeKey(trade.accountId, trade.operationId, trade.tradeId);
      if (keys[key]) duplicateKeys += 1;
      keys[key] = true;
    });
    var accounts = TI.MultiAccount.accountMap();
    var invalidAccountIds = trades.filter(function(trade) { return !accounts[String(trade.accountId || "").trim()]; }).length;
    var targetDisplayName = String(configuration.target.accountName || "").trim();
    var targetDerived = {};
    this.DERIVED_SHEETS.forEach(function(sheetName) {
      targetDerived[sheetName] = {
        exactAccountIdRows: TI.AccountPurgeMigration.countExactAccountRows(sheetName, accountId),
        exactDisplayNameRows: TI.AccountPurgeMigration.countExactDisplayRows(sheetName, targetDisplayName)
      };
    });
    var displayOnlyId = configuration.displayOnlyAccountId;
    var recommendationSheets = [CORE.SHEETS.REBALANCE, CORE.SHEETS.TRADE_PLAN, CORE.SHEETS.DECISIONS, CORE.SHEETS.ADVISOR];
    var displayOnlyActions = recommendationSheets.reduce(function(total, sheetName) {
      return total + TI.AccountPurgeMigration.countExactAccountRows(sheetName, displayOnlyId);
    }, 0);
    var health = TI.Data.sheetObjects(CORE.SHEETS.PORTFOLIO_HEALTH);
    var aggregate = health.filter(function(row) { return row.scopeType === "Весь портфель"; })[0] || {};
    var calculationPortfolio = TI.AccountScope.filterCalculationRows(TI.Data.portfolio());
    var calculationMarketValue = calculationPortfolio.reduce(function(sum, row) { return sum + (Number(row.marketValue) || 0); }, 0);
    var directoryAfter = this.semanticSnapshot([CORE.SHEETS.DIRECTORY]);
    var linksAfter = this.semanticSnapshot([CORE.SHEETS.ACCOUNT_STRATEGIES]);
    var tradesDigestAfterRecalc = this.semanticSnapshot([CORE.SHEETS.TRADES]);
    var targetDerivedTotal = Object.keys(targetDerived).reduce(function(total, name) {
      return total + targetDerived[name].exactAccountIdRows + targetDerived[name].exactDisplayNameRows;
    }, 0);
    var ok = direct.total === 0 && trades.length === this.EXPECTED_COUNTS.otherTrades &&
      duplicateKeys === 0 && invalidAccountIds === 0 && targetDerivedTotal === 0 &&
      this.sameVector(this.flagVector(accountId), [false, false, false, false, false]) &&
      this.sameVector(this.flagVector(displayOnlyId), [true, false, true, false, true]) &&
      this.sameVector(this.flagVector(configuration.allEnabledAccountId), [true, true, true, true, true]) &&
      displayOnlyActions === 0 && TI.AccountScope.isDisplayEnabled(displayOnlyId) &&
      this.sameSnapshot(directoryBefore, directoryAfter) && this.sameSnapshot(linksBefore, linksAfter) &&
      this.sameSnapshot(tradesDigestAfterPurge, tradesDigestAfterRecalc) &&
      Math.abs((Number(aggregate.marketValue) || 0) - calculationMarketValue) < 0.01;
    return {
      ok: ok,
      directTargetRows: direct,
      trades: { total: trades.length, target: 0, other: trades.length, duplicateCompositeKeys: duplicateKeys, conflicts: 0, invalidAccountIds: invalidAccountIds },
      targetDerivedRows: targetDerived,
      targetDerivedTotal: targetDerivedTotal,
      displayOnlyAccount: {
        accountIdSuffix: this.suffix(displayOnlyId),
        flags: this.flagVector(displayOnlyId),
        recommendationActions: displayOnlyActions,
        informationalViewEnabled: TI.AccountScope.isDisplayEnabled(displayOnlyId) && TI.AccountScope.isHistoryEnabled(displayOnlyId)
      },
      targetFlags: this.flagVector(accountId),
      calculationAggregate: { portfolioRows: calculationPortfolio.length, marketValue: calculationMarketValue, healthMarketValue: Number(aggregate.marketValue) || 0 },
      directoryUnchanged: this.sameSnapshot(directoryBefore, directoryAfter),
      accountStrategyLinksUnchanged: this.sameSnapshot(linksBefore, linksAfter),
      tradesUnchangedDuringRecalc: this.sameSnapshot(tradesDigestAfterPurge, tradesDigestAfterRecalc)
    };
  },

  apply: function(config) {
    config = config || {};
    var accountId = String(config.targetAccountId || "").trim();
    var archiveSha256 = String(config.archiveSha256 || "").trim();
    var runId = this.suffix(Utilities.getUuid());
    var stage = "PRECHECK";
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE", runId: runId };
    var direct;
    var derivedBefore = [];
    var deleted = { trades: 0, portfolio: 0, cache: 0, total: 0 };
    var recalcStarted = false;
    try {
      if (!accountId) throw new Error("TARGET_ACCOUNT_ID_REQUIRED");
      if (archiveSha256 !== this.EXPECTED_ARCHIVE_SHA256) throw new Error("ARCHIVE_HASH_MISMATCH");
      var syncState = TI.BatchSync.status();
      if (syncState && syncState.status === "running") throw new Error("SYNC_ALREADY_RUNNING");
      var configuration = this.accountConfiguration(accountId);
      direct = this.directCaptures(accountId);
      var counts = this.directCounts(direct);
      if (counts.total === 0) {
        return { ok: true, code: "ALREADY_EXCLUDED", runId: runId, targetAccountIdSuffix: this.suffix(accountId), plannedDeletes: 0 };
      }
      if (counts.trades !== 160 || counts.portfolio !== 1 || counts.cache !== 17 || counts.total !== 178) {
        throw new Error("DIRECT_DELETE_COUNT_MISMATCH");
      }
      if (TI.Data.trades().length - counts.trades !== 6) throw new Error("OTHER_TRADES_PRECONDITION_FAILED");

      stage = "BACKUP_VERIFY";
      var backup = this.backupRecord();
      stage = "ARCHIVE_VERIFY";
      if (archiveSha256 !== this.EXPECTED_ARCHIVE_SHA256) throw new Error("ARCHIVE_VERIFY_FAILED");
      stage = "FLAGS_VERIFY";
      this.accountConfiguration(accountId);

      var directoryBefore = this.semanticSnapshot([CORE.SHEETS.DIRECTORY]);
      var linksBefore = this.semanticSnapshot([CORE.SHEETS.ACCOUNT_STRATEGIES]);
      derivedBefore = this.DERIVED_SHEETS.map(function(name) { return TI.AccountPurgeMigration.captureSheet(name); });

      stage = "PURGE_TRADES";
      deleted.trades = this.deleteCapturedRows(direct.trades);
      stage = "PURGE_PORTFOLIO";
      deleted.portfolio = this.deleteCapturedRows(direct.portfolio);
      stage = "PURGE_CACHE";
      deleted.cache = this.deleteCapturedRows(direct.cache);
      deleted.total = deleted.trades + deleted.portfolio + deleted.cache;
      SpreadsheetApp.flush();
      if (deleted.trades !== 160 || deleted.portfolio !== 1 || deleted.cache !== 17 || deleted.total !== 178) {
        throw new Error("DIRECT_PURGE_WRITE_MISMATCH");
      }
      var afterDirect = this.directCounts(this.directCaptures(accountId));
      if (afterDirect.total !== 0 || TI.Data.trades().length !== 6) throw new Error("DIRECT_PURGE_POSTCHECK_FAILED");

      stage = "CLEAR_EXECUTION_CACHE";
      TI.AccountScope.resetExecutionCache();
      var tradesDigestAfterPurge = this.semanticSnapshot([CORE.SHEETS.TRADES]);

      stage = "RECALC_DERIVED";
      recalcStarted = true;
      var firstRecalc = this.runZeroApiRecalc("first");
      var businessSheets = this.DERIVED_SHEETS.concat([CORE.SHEETS.PORTFOLIO]);
      var firstBusiness = this.semanticSnapshot(businessSheets);
      var secondRecalc = this.runZeroApiRecalc("second");
      var secondBusiness = this.semanticSnapshot(businessSheets);
      var idempotent = this.sameSnapshot(firstBusiness, secondBusiness);
      if (!idempotent) throw new Error("SECOND_RECALC_NOT_IDEMPOTENT");
      if (firstRecalc.apiCallCount !== 0 || secondRecalc.apiCallCount !== 0) throw new Error("RECALC_API_CALLS_NON_ZERO");

      stage = "VALIDATE";
      var validation = this.validateAfter(accountId, configuration, directoryBefore, linksBefore, tradesDigestAfterPurge);
      if (!validation.ok) throw new Error("POST_VALIDATION_FAILED");

      stage = "COMMIT";
      var committedAt = new Date().toISOString();
      PropertiesService.getDocumentProperties().setProperty(this.COMMIT_KEY, JSON.stringify({
        runId: runId,
        committedAt: committedAt,
        targetAccountIdSuffix: this.suffix(accountId),
        deleted: deleted,
        backupId: backup.backupId
      }));
      return {
        ok: true,
        code: "COMMITTED",
        runId: runId,
        committedAt: committedAt,
        targetAccountIdSuffix: this.suffix(accountId),
        stages: ["PRECHECK", "BACKUP_VERIFY", "ARCHIVE_VERIFY", "FLAGS_VERIFY", "PURGE_TRADES", "PURGE_PORTFOLIO", "PURGE_CACHE", "CLEAR_EXECUTION_CACHE", "RECALC_DERIVED", "VALIDATE", "COMMIT"],
        backup: { name: backup.backupName, suffix: this.suffix(backup.backupId), createdAt: backup.createdAt },
        archive: { verified: true, sha256: archiveSha256 },
        deleted: deleted,
        firstRecalc: firstRecalc,
        secondRecalc: secondRecalc,
        idempotent: idempotent,
        apiCallCount: firstRecalc.apiCallCount + secondRecalc.apiCallCount,
        tradesWritesDuringRecalc: 0,
        operationsWritesDuringRecalc: 0,
        validation: validation,
        rollbackAvailable: true,
        productionDeploymentChanged: false
      };
    } catch (error) {
      var rollback = { attempted: false, directRowsRestored: 0, derivedSheetsRestored: 0, ok: false };
      if (direct && deleted.total > 0) {
        rollback.attempted = true;
        try {
          rollback.directRowsRestored += this.restoreCapturedRows(direct.cache);
          rollback.directRowsRestored += this.restoreCapturedRows(direct.portfolio);
          rollback.directRowsRestored += this.restoreCapturedRows(direct.trades);
          if (recalcStarted) {
            derivedBefore.forEach(function(capture) { TI.AccountPurgeMigration.restoreSheet(capture); });
            rollback.derivedSheetsRestored = derivedBefore.length;
          }
          SpreadsheetApp.flush();
          TI.AccountScope.resetExecutionCache();
          rollback.ok = rollback.directRowsRestored === deleted.total;
        } catch (rollbackError) {
          rollback.error = String(rollbackError && rollbackError.message || rollbackError).slice(0, 500);
        }
      }
      return {
        ok: false,
        code: "GATE_B_FAILED",
        runId: runId,
        failedStage: stage,
        error: String(error && error.message || error).slice(0, 500),
        deletedBeforeRollback: deleted,
        rollback: rollback,
        backupAvailable: !!PropertiesService.getDocumentProperties().getProperty(this.BACKUP_KEY)
      };
    } finally {
      TI.SyncExecution.deactivate();
      TI.BatchSync.setNoApiMode(false);
      lock.releaseLock();
    }
  },

  safeContinuation: function(state) {
    state = state || {};
    return {
      ok: state.status !== "failed",
      code: state.status === "complete" ? "COMMITTED" : (state.status === "failed" ? "GATE_B_FAILED" : "CONTINUE"),
      runId: state.runId || "",
      status: state.status || "missing",
      pass: state.pass || 0,
      stepIndex: state.stepIndex || 0,
      nextStep: state.status === "running" ? (this.RECALC_STEPS[state.stepIndex] || "VALIDATE") : "",
      completedStepCount: state.completedStepCount || 0,
      apiCallCount: state.apiCallCount || 0,
      targetAccountIdSuffix: this.suffix(state.targetAccountId),
      deleted: state.deleted || { trades: 160, portfolio: 1, cache: 17, total: 178 },
      idempotent: state.idempotent === true,
      validation: state.validation || null,
      error: state.error || ""
    };
  },

  saveContinuation: function(state) {
    PropertiesService.getDocumentProperties().setProperty(this.CONTINUATION_KEY, JSON.stringify(state));
    return state;
  },

  loadContinuation: function() {
    var raw = PropertiesService.getDocumentProperties().getProperty(this.CONTINUATION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  runSingleZeroApiStep: function(stepId, pass) {
    var steps = [{ id: stepId, title: stepId }];
    var context = TI.SyncExecution.create("recalc", steps);
    try {
      TI.BatchSync.setNoApiMode(true);
      TI.SyncExecution.activate(context);
      TI.SyncExecution.startStep(context, stepId);
      var result = TI.BatchSync.executeStep(stepId, "recalc");
      TI.SyncExecution.finishStep(context, stepId, result);
      TI.SyncExecution.finish(context, "complete");
      if (context.apiCallCount !== 0) throw new Error("RECALC_API_CALLS_NON_ZERO");
      return {
        ok: true,
        pass: pass,
        step: stepId,
        apiCallCount: context.apiCallCount,
        rowsWritten: context.rowsWritten,
        resultRows: TI.SyncExecution.resultRows(result)
      };
    } finally {
      TI.SyncExecution.deactivate();
      TI.BatchSync.setNoApiMode(false);
    }
  },

  resumeAfterTimeout: function(config) {
    config = config || {};
    var accountId = String(config.targetAccountId || "").trim();
    var archiveSha256 = String(config.archiveSha256 || "").trim();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    try {
      if (!accountId || archiveSha256 !== this.EXPECTED_ARCHIVE_SHA256) throw new Error("RESUME_CONFIG_INVALID");
      var syncState = TI.BatchSync.status();
      if (syncState && syncState.status === "running") throw new Error("SYNC_ALREADY_RUNNING");
      TI.BatchSync.setNoApiMode(false);
      var configuration = this.accountConfiguration(accountId);
      var direct = this.directCounts(this.directCaptures(accountId));
      if (direct.total !== 0 || TI.Data.trades().length !== 6) throw new Error("RESUME_DIRECT_STATE_INVALID");
      this.backupRecord();
      var expectedDirectory = config.expectedDirectory || {};
      var expectedLinks = config.expectedLinks || {};
      if (!expectedDirectory[CORE.SHEETS.DIRECTORY] || !expectedLinks[CORE.SHEETS.ACCOUNT_STRATEGIES]) {
        throw new Error("RESUME_EXPECTED_DIGESTS_REQUIRED");
      }
      var state = {
        status: "running",
        runId: this.suffix(Utilities.getUuid()),
        startedAt: new Date().toISOString(),
        targetAccountId: accountId,
        archiveSha256: archiveSha256,
        pass: 1,
        stepIndex: 0,
        completedStepCount: 0,
        apiCallCount: 0,
        firstBusiness: null,
        idempotent: false,
        expectedDirectory: expectedDirectory,
        expectedLinks: expectedLinks,
        tradesDigestAfterPurge: this.semanticSnapshot([CORE.SHEETS.TRADES]),
        displayOnlyAccountId: configuration.displayOnlyAccountId,
        allEnabledAccountId: configuration.allEnabledAccountId,
        deleted: { trades: 160, portfolio: 1, cache: 17, total: 178 },
        stepResults: []
      };
      this.saveContinuation(state);
      return this.safeContinuation(state);
    } catch (error) {
      return { ok: false, code: "RESUME_FAILED", error: String(error && error.message || error).slice(0, 500) };
    } finally {
      lock.releaseLock();
    }
  },

  continueAfterTimeout: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    try {
      var state = this.loadContinuation();
      if (!state) return { ok: false, code: "CONTINUATION_STATE_MISSING" };
      if (state.status !== "running") return this.safeContinuation(state);
      var syncState = TI.BatchSync.status();
      if (syncState && syncState.status === "running") throw new Error("SYNC_ALREADY_RUNNING");
      var stepId = this.RECALC_STEPS[state.stepIndex];
      if (stepId) {
        var stepResult = this.runSingleZeroApiStep(stepId, state.pass);
        state.apiCallCount += stepResult.apiCallCount;
        state.completedStepCount += 1;
        state.stepResults.push(stepResult);
        state.stepIndex += 1;
      }

      if (state.stepIndex >= this.RECALC_STEPS.length) {
        var businessSheets = this.DERIVED_SHEETS.concat([CORE.SHEETS.PORTFOLIO]);
        var business = this.semanticSnapshot(businessSheets);
        if (state.pass === 1) {
          state.firstBusiness = business;
          state.pass = 2;
          state.stepIndex = 0;
        } else {
          state.idempotent = state.phase === "allowedVolatility"
            ? this.sameSnapshot(state.allowedVolatilityBefore, this.allowedVolatilitySnapshot(businessSheets))
            : this.sameSnapshot(state.firstBusiness, business);
          if (!state.idempotent) throw new Error("SECOND_RECALC_NOT_IDEMPOTENT");
          var configuration = this.accountConfiguration(state.targetAccountId);
          state.validation = this.validateAfter(
            state.targetAccountId,
            configuration,
            state.expectedDirectory,
            state.expectedLinks,
            state.tradesDigestAfterPurge
          );
          if (!state.validation.ok) throw new Error("POST_VALIDATION_FAILED");
          if (state.apiCallCount !== 0) throw new Error("RECALC_API_CALLS_NON_ZERO");
          state.status = "complete";
          state.finishedAt = new Date().toISOString();
          PropertiesService.getDocumentProperties().setProperty(this.COMMIT_KEY, JSON.stringify({
            runId: state.runId,
            committedAt: state.finishedAt,
            targetAccountIdSuffix: this.suffix(state.targetAccountId),
            deleted: state.deleted
          }));
        }
      }
      this.saveContinuation(state);
      return this.safeContinuation(state);
    } catch (error) {
      var failed = this.loadContinuation() || {};
      failed.status = "failed";
      failed.error = String(error && error.message || error).slice(0, 500);
      failed.finishedAt = new Date().toISOString();
      this.saveContinuation(failed);
      return this.safeContinuation(failed);
    } finally {
      TI.SyncExecution.deactivate();
      TI.BatchSync.setNoApiMode(false);
      lock.releaseLock();
    }
  },

  incidentStatus: function() {
    var account = TI.AccountScopeGateA.excludedAccount();
    var lock = LockService.getScriptLock();
    var acquired = lock.tryLock(1000);
    if (acquired) lock.releaseLock();
    var direct = this.directCounts(this.directCaptures(account.accountId));
    return {
      ok: true,
      readOnly: true,
      globalLockAvailable: acquired,
      syncStatus: TI.BatchSync.status().status,
      noApiMode: TI.BatchSync.isNoApiMode(),
      directTargetRows: direct,
      tradesTotal: TI.Data.trades().length,
      continuation: this.safeContinuation(this.loadContinuation())
    };
  },

  continuationDiagnostics: function() {
    var state = this.loadContinuation() || {};
    var businessSheets = this.DERIVED_SHEETS.concat([CORE.SHEETS.PORTFOLIO]);
    var current = this.semanticSnapshot(businessSheets);
    var first = state.firstBusiness || {};
    var changed = businessSheets.filter(function(name) { return first[name] !== current[name]; }).map(function(name) {
      var sheet = TI.AccountPurgeMigration.spreadsheet().getSheetByName(name);
      return {
        sheet: name,
        firstSemanticDigest: first[name] || "<missing>",
        currentSemanticDigest: current[name] || "<missing>",
        rows: sheet ? Math.max(sheet.getLastRow() - 1, 0) : 0,
        headers: sheet && sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : []
      };
    });
    var allowedCurrent = this.allowedVolatilitySnapshot(businessSheets);
    var allowedBefore = state.allowedVolatilityBefore || {};
    var allowedChanged = businessSheets.filter(function(name) {
      return allowedBefore[name] && allowedBefore[name] !== allowedCurrent[name];
    }).map(function(name) {
      return { sheet: name, beforeDigest: allowedBefore[name], currentDigest: allowedCurrent[name] };
    });
    return {
      ok: true,
      readOnly: true,
      status: state.status || "missing",
      error: state.error || "",
      completedStepCount: state.completedStepCount || 0,
      apiCallCount: state.apiCallCount || 0,
      changedSheets: changed,
      changedSheetCount: changed.length,
      allowedVolatilityChangedSheets: allowedChanged,
      allowedVolatilityChangedSheetCount: allowedChanged.length
    };
  },

  resumeAllowedVolatilityValidation: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    try {
      var state = this.loadContinuation();
      if (!state || state.status !== "failed" || state.error !== "SECOND_RECALC_NOT_IDEMPOTENT") {
        return { ok: false, code: "VOLATILITY_RESUME_PRECONDITION_FAILED" };
      }
      var diagnostics = this.continuationDiagnostics();
      var changedNames = diagnostics.changedSheets.map(function(item) { return item.sheet; }).sort();
      var expectedNames = [CORE.SHEETS.STABILIZATION, CORE.SHEETS.MAIN].sort();
      if (TI.SyncVerification.digest(changedNames) !== TI.SyncVerification.digest(expectedNames)) {
        return { ok: false, code: "UNEXPECTED_BUSINESS_DIFF", changedSheets: changedNames };
      }
      var direct = this.directCounts(this.directCaptures(state.targetAccountId));
      if (direct.total !== 0 || TI.Data.trades().length !== this.EXPECTED_COUNTS.otherTrades || state.apiCallCount !== 0) {
        return { ok: false, code: "VOLATILITY_RESUME_STATE_INVALID" };
      }
      var businessSheets = this.DERIVED_SHEETS.concat([CORE.SHEETS.PORTFOLIO]);
      state.status = "running";
      state.error = "";
      state.phase = "allowedVolatility";
      state.pass = 3;
      state.stepIndex = this.RECALC_STEPS.indexOf("stabilization");
      state.allowedVolatilityBefore = this.allowedVolatilitySnapshot(businessSheets);
      this.saveContinuation(state);
      return this.safeContinuation(state);
    } finally {
      lock.releaseLock();
    }
  },

  convergeStabilization: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return { ok: false, code: "GLOBAL_LOCK_UNAVAILABLE" };
    try {
      var state = this.loadContinuation();
      if (!state || state.status !== "failed" || state.error !== "SECOND_RECALC_NOT_IDEMPOTENT") {
        return { ok: false, code: "CONVERGENCE_PRECONDITION_FAILED" };
      }
      var direct = this.directCounts(this.directCaptures(state.targetAccountId));
      if (direct.total !== 0 || TI.Data.trades().length !== this.EXPECTED_COUNTS.otherTrades || state.apiCallCount !== 0) {
        return { ok: false, code: "CONVERGENCE_STATE_INVALID" };
      }
      var result = this.runSingleZeroApiStep("stabilization", 3);
      return {
        ok: result.ok,
        code: result.ok ? "STABILIZATION_CONVERGED" : "STABILIZATION_CONVERGENCE_FAILED",
        apiCallCount: result.apiCallCount,
        tradesWrites: 0,
        operationsWrites: 0,
        targetAccountIdSuffix: this.suffix(state.targetAccountId)
      };
    } finally {
      lock.releaseLock();
    }
  }
};

function TI_CreateGateBBackup() {
  return TI.AccountPurgeMigration.createBackup();
}

function TI_GateBPrePurgeSnapshot() {
  var account = TI.AccountScopeGateA.excludedAccount();
  var preflight = TI.AccountPurgeMigration.preflight(account.accountId);
  var snapshot = TI.SyncVerification.snapshot();
  var backup = null;
  try {
    var record = TI.AccountPurgeMigration.backupRecord();
    backup = { name: record.backupName, suffix: TI.AccountPurgeMigration.suffix(record.backupId), createdAt: record.createdAt };
  } catch (ignoredBackup) {}
  return { ok: preflight.ok && snapshot.ok, readOnly: true, preflight: preflight, snapshot: snapshot, backup: backup };
}

function TI_ApplyExcludeAccountPurge(config) {
  return TI.AccountPurgeMigration.apply(config);
}

function TI_ResumeGateBMigration(config) {
  return TI.AccountPurgeMigration.resumeAfterTimeout(config);
}

function TI_ContinueGateBMigration() {
  return TI.AccountPurgeMigration.continueAfterTimeout();
}

function TI_GateBIncidentStatus() {
  return TI.AccountPurgeMigration.incidentStatus();
}

function TI_GateBContinuationDiagnostics() {
  return TI.AccountPurgeMigration.continuationDiagnostics();
}

function TI_ResumeGateBAllowedVolatilityValidation() {
  return TI.AccountPurgeMigration.resumeAllowedVolatilityValidation();
}

function TI_ConvergeGateBStabilization() {
  return TI.AccountPurgeMigration.convergeStabilization();
}
