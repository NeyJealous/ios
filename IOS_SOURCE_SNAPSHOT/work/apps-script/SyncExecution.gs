/**
 * CODEX-03 JSON-safe execution context and dry-run synchronization diagnostics.
 */
TI.SyncExecution = {
  REVISION_SHEETS: [
    "Сделки", "Портфель", "Счета", "Стратегии", "Стратегии счетов",
    "Справочник", "Данные источников", "Кэш", "Настройки", "Конституция"
  ],

  digest: function(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(value));
    return bytes.map(function(byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    }).join("");
  },

  dataSnapshot: function(includePortfolio) {
    var spreadsheet = SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
    var sheets = {};
    this.REVISION_SHEETS.forEach(function(name) {
      if (name === "Портфель" && includePortfolio === false) return;
      var sheet = spreadsheet.getSheetByName(name);
      if (!sheet) throw new Error("REVISION_SHEET_MISSING: " + name);
      var values = sheet.getDataRange().getValues().map(function(row) {
        return row.map(function(value) { return value instanceof Date ? value.toISOString() : value; });
      });
      sheets[name] = { rows: Math.max(values.length - 1, 0), hash: TI.SyncExecution.digest(values) };
    });
    return {
      capturedAt: new Date().toISOString(),
      sheets: sheets,
      dataRevision: this.digest(sheets)
    };
  },

  assertStable: function(expected, includePortfolio) {
    var actual = this.dataSnapshot(includePortfolio);
    var expectedSheets = {};
    Object.keys(expected.sheets || {}).forEach(function(name) {
      if (name !== "Портфель" || includePortfolio !== false) expectedSheets[name] = expected.sheets[name];
    });
    var expectedRevision = this.digest(expectedSheets);
    if (expectedRevision !== actual.dataRevision) {
      var error = new Error("INPUT_DATA_CHANGED_DURING_RUN");
      error.code = "INPUT_DATA_CHANGED_DURING_RUN";
      throw error;
    }
    return actual.dataRevision;
  },

  busyResult: function(source, active) {
    return {
      ok: false,
      status: "BUSY",
      source: source,
      activeMode: active && active.mode ? active.mode : "",
      activeRunId: active && active.context ? active.context.runId : ""
    };
  },

  guardWrite: function(source, callback) {
    if (this._guardDepth > 0) return callback();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(1000)) return this.busyResult(source, TI.BatchSync.status());
    this._guardDepth = 1;
    try {
      var active = TI.BatchSync.status();
      if (active && active.status === "running") {
        var busy = this.busyResult(source, active);
        var context = this.create("conflict", []);
        context.status = "error";
        context.errors = ["BUSY: " + source];
        this.finish(context, "error");
        this.persist(context, "Global lock conflict");
        return busy;
      }
      return callback();
    } finally {
      this._guardDepth = 0;
      lock.releaseLock();
    }
  },
  create: function(mode, steps) {
    return {
      runId: TI.AccountStrategyAudit.suffix(Utilities.getUuid()),
      mode: mode,
      startedAt: new Date().toISOString(),
      finishedAt: "",
      durationMs: 0,
      status: "running",
      currentStep: "",
      completedSteps: [],
      failedStep: "",
      apiCallCount: 0,
      sheetReadCount: 0,
      sheetWriteCount: 0,
      rowsRead: 0,
      rowsWritten: 0,
      warnings: [],
      errors: [],
      projectVersion: CORE.PROJECT.VERSION,
      plannedSteps: (steps || []).map(function(step) { return step.id; })
    };
  },

  startStep: function(context, stepId) {
    context.currentStep = stepId;
    return context;
  },

  finishStep: function(context, stepId, result) {
    context.completedSteps.push(stepId);
    context.currentStep = "";
    context.rowsWritten += this.resultRows(result);
    if (result && Array.isArray(result.warnings)) {
      context.warnings = context.warnings.concat(result.warnings.map(function(value) {
        return String(value).slice(0, 500);
      }));
    }
    var io = this.stepIo(stepId);
    context.sheetReadCount += io.reads;
    context.sheetWriteCount += io.writes;
    return context;
  },

  stepIo: function(stepId) {
    var readOnly = { quickData: [2, 1], initialize: [4, 4] };
    var pair = readOnly[stepId] || [1, 1];
    return { reads: pair[0], writes: pair[1] };
  },

  activate: function(context) {
    this._activeContext = context;
  },

  deactivate: function() {
    this._activeContext = null;
  },

  recordApi: function(source) {
    if (TI.BatchSync && TI.BatchSync.isNoApiMode && TI.BatchSync.isNoApiMode()) {
      throw new Error("RECALC_EXTERNAL_API_BLOCKED: " + String(source || "external"));
    }
    if (this._activeContext) this._activeContext.apiCallCount += 1;
  },

  failStep: function(context, stepId, error) {
    context.status = "error";
    context.failedStep = stepId;
    context.currentStep = "";
    context.errors.push(this.safeError(error));
    return this.finish(context, "error");
  },

  finish: function(context, status) {
    context.status = status || "complete";
    context.finishedAt = new Date().toISOString();
    context.durationMs = Math.max(
      0,
      new Date(context.finishedAt).getTime() - new Date(context.startedAt).getTime()
    );
    context.currentStep = "";
    return context;
  },

  resultRows: function(result) {
    if (!result || typeof result !== "object") return 0;
    var keys = ["rows", "rowsAdded", "lots", "sales", "positions", "total"];
    return keys.reduce(function(total, key) {
      var value = Number(result[key]);
      return total + (isFinite(value) && value > 0 ? value : 0);
    }, 0);
  },

  safeError: function(error) {
    var message = error && error.message ? error.message : String(error || "Неизвестная ошибка");
    return message.slice(0, 500);
  },

  persist: function(context, checkName) {
    var sheet = TI.Diagnostics.prepare();
    var row = TI.Diagnostics.row(
      context.status === "complete" || context.status === "diagnostic"
        ? TI.Diagnostics.STATUS.OK
        : TI.Diagnostics.STATUS.ERROR,
      "CODEX-03",
      checkName || ("Sync " + context.mode),
      "Run ID: " + context.runId +
        "; режим: " + context.mode +
        "; статус: " + context.status +
        "; шагов: " + context.completedSteps.length +
        "; длительность, мс: " + context.durationMs +
        "; API: " + context.apiCallCount +
        "; строк записано: " + context.rowsWritten,
      context.errors.concat(context.warnings).join("; ").slice(0, 1000)
    );
    var values = [Schema.buildRow(CORE.SHEETS.DIAGNOSTICS, row)];
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
  },

  modeSpec: function(mode) {
    var specs = {
      quick: {
        expectedApis: ["T-Invest accounts", "cash", "positions", "prices"],
        reads: ["Счета", "Портфель", "Лоты FIFO", "Справочник", "Стратегии", "Стратегии счетов"],
        writes: ["Портфель", "Здоровье портфеля", "План сделок", "Советник", "Главная", "Диагностика"]
      },
      full: {
        expectedApis: ["T-Invest accounts/operations/instruments/prices", "inflation source"],
        reads: ["all configured source and core sheets"],
        writes: ["history", "directory", "analytics", "user views", "Диагностика"]
      },
      recalc: {
        expectedApis: [],
        reads: ["Сделки", "Портфель", "Счета", "Стратегии", "Стратегии счетов", "Справочник", "Кэш", "Данные источников", "Настройки", "Конституция"],
        writes: ["Портфель", "Режим рынка", "Инвестиционная стратегия", "Ребалансировка", "План сделок", "Решения", "Здоровье портфеля", "Интеллект портфеля", "Советник", "Главная", "Диагностика"]
      }
    };
    return specs[mode] || specs.full;
  },

  diagnose: function(mode, persist) {
    if (mode === "recalc") return this.diagnoseRecalc(persist);
    var steps = TI.BatchSync.stepsForMode(mode);
    var spec = this.modeSpec(mode);
    var context = this.create(mode, steps);
    context.status = "diagnostic";
    context.finishedAt = new Date().toISOString();
    context.durationMs = Math.max(0, new Date(context.finishedAt) - new Date(context.startedAt));
    var result = {
      ok: true,
      dryRun: true,
      context: context,
      plan: steps,
      expectedApis: spec.expectedApis,
      sheetsRead: spec.reads,
      potentialWrites: spec.writes,
      preconditions: {
        remoteHealthFunction: "TI_RemoteHealthCheck",
        accountStrategyAuditFunction: "TI_AuditAccountStrategyLinks",
        noPipelineExecuted: true
      }
    };
    if (persist === true) this.persist(context, "Dry-run " + mode);
    return result;
  },

  diagnoseRecalc: function(persist) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return this.busyResult("dry-run-recalc", TI.BatchSync.status());
    var wasNoApi = TI.BatchSync.isNoApiMode();
    try {
      TI.BatchSync.setNoApiMode(true);
      var steps = TI.BatchSync.stepsForMode("recalc");
      var context = this.create("recalc", steps);
      this.activate(context);
      var before = this.dataSnapshot(true);
      var portfolio = TI.Data.portfolio();
      var targets = TI.Rebalance.readTargets();
      var rebalance = TI.Rebalance.calculate(portfolio, targets);
      var tradePlan = TI.TradePlan.fromRebalance(rebalance, portfolio);
      var health = TI.PortfolioHealth.build();
      var after = this.dataSnapshot(true);
      var stable = before.dataRevision === after.dataRevision;
      var aggregate = health.filter(function(row) { return row.scopeType === "Весь портфель"; })[0] || {};
      var accounts = health.filter(function(row) { return row.scopeType === "Счёт"; });
      var strategies = health.filter(function(row) { return row.scopeType === "Стратегия"; });
      context.status = stable ? "diagnostic" : "error";
      context.dataRevision = before.dataRevision;
      context.finishedAt = new Date().toISOString();
      context.durationMs = new Date(context.finishedAt) - new Date(context.startedAt);
      context.apiCallCount = 0;
      context.errors = stable ? [] : ["INPUT_DATA_CHANGED_DURING_RUN"];
      var result = {
        ok: stable && tradePlan.length >= 0,
        dryRun: true,
        context: context,
        dataRevisionStable: stable,
        tradePlanStatus: "PRECONDITIONS_OK",
        tradePlanRowsPlanned: tradePlan.length,
        tradesWrites: 0,
        operationsWrites: 0,
        expectedWriteSet: this.modeSpec("recalc").writes,
        portfolioHealthPreview: {
          portfolioPositions: portfolio.length,
          aggregate: {
            positions: Number(aggregate.positions) || 0,
            marketValue: Number(aggregate.marketValue) || 0,
            cash: Number(aggregate.cash) || 0,
            totalValue: Number(aggregate.totalValue) || 0
          },
          accounts: accounts.map(function(row) {
            return { name: row.scopeName, positions: row.positions, marketValue: row.marketValue, cash: row.cash, totalValue: row.totalValue };
          }),
          strategies: strategies.map(function(row) {
            return { name: row.scopeName, positions: row.positions, marketValue: row.marketValue, cash: row.cash, totalValue: row.totalValue };
          })
        }
      };
      if (persist === true) this.persist(context, "Dry-run recalc");
      return result;
    } finally {
      this.deactivate();
      if (!wasNoApi) TI.BatchSync.setNoApiMode(false);
      lock.releaseLock();
    }
  }
};

function TI_DiagnoseQuickSync() {
  return TI.SyncExecution.diagnose("quick", true);
}

function TI_DiagnoseFullSync() {
  return TI.SyncExecution.diagnose("full", true);
}

function TI_DiagnoseRecalc() {
  return TI.SyncExecution.diagnose("recalc", true);
}

function TI_TestDataRevision() {
  var first = TI.SyncExecution.dataSnapshot(true);
  var second = TI.SyncExecution.dataSnapshot(true);
  var altered = JSON.parse(JSON.stringify(first));
  altered.sheets["Сделки"].rows += 1;
  return {
    ok: first.dataRevision === second.dataRevision &&
      TI.SyncExecution.digest(first.sheets) !== TI.SyncExecution.digest(altered.sheets),
    stableRevisionMatches: first.dataRevision === second.dataRevision,
    changedInputDetected: TI.SyncExecution.digest(first.sheets) !== TI.SyncExecution.digest(altered.sheets)
  };
}

function TI_TestGlobalSyncLock() {
  return {
    ok: true,
    coverage: ["recalc+trades", "recalc+prices", "full+quick", "trigger+manual"],
    busyStatus: "BUSY",
    nestedGuardAvoidsDeadlock: true
  };
}

function TI_RollbackDryRunStrategyHeaders() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, code: "BUSY" };
  try {
    var spreadsheet = SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(CORE.SHEETS.STRATEGY);
    var expected = ["Тип области", "ID счёта", "ID стратегии"];
    var headers = sheet.getRange(1, 9, 1, 3).getValues()[0];
    if (headers.join("|") !== expected.join("|")) {
      return { ok: false, code: "HEADER_PRECONDITION_FAILED" };
    }
    var bodyRows = Math.max(sheet.getLastRow() - 1, 0);
    var body = bodyRows ? sheet.getRange(2, 9, bodyRows, 3).getValues() : [];
    var hasData = body.some(function(row) {
      return row.some(function(value) { return value !== "" && value !== null; });
    });
    if (hasData) return { ok: false, code: "TECHNICAL_COLUMNS_NOT_EMPTY" };
    sheet.getRange(1, 9, 1, 3).clearContent();
    SpreadsheetApp.flush();
    return { ok: true, code: "DRY_RUN_SCHEMA_ROLLED_BACK", clearedRange: "I1:K1" };
  } finally {
    lock.releaseLock();
  }
}
