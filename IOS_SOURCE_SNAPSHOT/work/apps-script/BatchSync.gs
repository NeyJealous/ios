/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: BatchSync.gs
 * Версия: 1.0.0
 * Назначение:
 *   Пакетная полная синхронизация без упора в лимит времени.
 * ============================================================
 */

var TI = TI || {};

TI.BatchSync = {

  STATE_KEY: "TI_BATCH_SYNC_STATE",
  NO_API_KEY: "TI_BATCH_SYNC_NO_API",
  STEP_HANDLER: "TI_BatchSyncContinue",
  DAILY_HANDLER: "TI_AutoFullSync",
  MAINTENANCE_HANDLER: "TI_AutoMaintenanceSync",
  LOCK_TIMEOUT_MS: 5000,

  FULL_STEPS: [
    { id: "initialize", title: "Подготовка листов" },
    { id: "accounts", title: "Счета" },
    { id: "trades", title: "Сделки" },
    { id: "directoryShares", title: "Справочник: акции" },
    { id: "directoryBonds", title: "Справочник: облигации" },
    { id: "directoryEtfs", title: "Справочник: фонды" },
    { id: "directoryPrices", title: "Цены в справочнике" },
    { id: "fifo", title: "FIFO" },
    { id: "portfolioFreshPrices", title: "Портфель и цены" },
    { id: "visualization", title: "Визуализация" },
    { id: "income", title: "Доходы и денежные потоки" },
    { id: "inflation", title: "Инфляция" },
    { id: "multiAccount", title: "Счета и стратегии" },
    { id: "strategy", title: "Стратегия" },
    { id: "marketRegime", title: "Режим рынка" },
    { id: "knowledge", title: "Факты и оценки" },
    { id: "companyRating", title: "Рейтинг компаний" },
    { id: "bondAnalysis", title: "Анализ облигаций" },
    { id: "assetScoring", title: "Оценка активов" },
    { id: "coi", title: "Индекс возможностей" },
    { id: "strategyTargets", title: "Стратегические цели" },
    { id: "tax", title: "Налоги" },
    { id: "rebalance", title: "Ребалансировка" },
    { id: "tradePlan", title: "План сделок" },
    { id: "decisions", title: "Решения" },
    { id: "portfolioHealth", title: "Здоровье портфеля" },
    { id: "portfolioIntelligence", title: "Интеллект портфеля" },
    { id: "advisor", title: "Советник" },
    { id: "stabilization", title: "Стабилизация" },
    { id: "diagnostics", title: "Диагностика" },
    { id: "main", title: "Главная" },
    { id: "ui", title: "Оформление интерфейса" }
  ],

  QUICK_STEPS: [
    { id: "quickData", title: "Быстрые данные" },
    { id: "portfolioFreshPrices", title: "Портфель и цены" },
    { id: "portfolioHealth", title: "Здоровье портфеля" },
    { id: "tradePlan", title: "План сделок" },
    { id: "advisor", title: "Советник" },
    { id: "main", title: "Главная" }
  ],

  RECALC_STEPS: [
    { id: "portfolioNoApi", title: "Портфель" },
    { id: "marketRegime", title: "Режим рынка" },
    { id: "strategyTargets", title: "Стратегические цели" },
    { id: "rebalance", title: "Ребалансировка" },
    { id: "tradePlan", title: "План сделок" },
    { id: "decisions", title: "Решения" },
    { id: "portfolioHealth", title: "Здоровье портфеля" },
    { id: "portfolioIntelligence", title: "Интеллект портфеля" },
    { id: "advisor", title: "Советник" },
    { id: "main", title: "Главная" }
  ],

  /**
   * Запустить пакетную синхронизацию.
   * @param {string=} source
   * @return {Object}
   */
  MAINTENANCE_STEPS: [
    { id: "initialize", title: "Подготовка листов" },
    { id: "directoryShares", title: "Справочник: акции" },
    { id: "directoryBonds", title: "Справочник: облигации" },
    { id: "directoryEtfs", title: "Справочник: фонды" },
    { id: "inflation", title: "Инфляция" },
    { id: "knowledge", title: "Факты и оценки" },
    { id: "companyRating", title: "Рейтинг компаний" },
    { id: "bondAnalysis", title: "Анализ облигаций" },
    { id: "assetScoring", title: "Оценка активов" },
    { id: "coi", title: "Индекс возможностей" },
    { id: "strategyTargets", title: "Стратегические цели" },
    { id: "diagnostics", title: "Диагностика" },
    { id: "main", title: "Главная" },
    { id: "ui", title: "Оформление интерфейса" }
  ],

  start: function(source, mode) {
    mode = mode || "full";
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(this.LOCK_TIMEOUT_MS)) {
      return this.blocked("LOCK_TIMEOUT", mode);
    }

    try {
      var active = this.loadState();
      if (active && active.status === "running") {
        return this.blocked("SYNC_ALREADY_RUNNING", mode, active);
      }

      var state = {
      status: "running",
      source: source || "manual",
      mode: mode,
      steps: this.stepsForMode(mode),
      index: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: {},
      error: "",
      context: TI.SyncExecution.create(mode, this.stepsForMode(mode))
    };
      if (mode === "recalc") {
        state.context.inputSnapshot = TI.SyncExecution.dataSnapshot(true);
        state.context.dataRevision = state.context.inputSnapshot.dataRevision;
      }

      this.clearStepTriggers();
      this.setNoApiMode(mode === "recalc");
      this.saveState(state);

      return state;
    } finally {
      lock.releaseLock();
    }
  },

  blocked: function(code, requestedMode, active) {
    return {
      status: "blocked",
      code: code,
      requestedMode: requestedMode,
      activeMode: active && active.mode ? active.mode : "",
      activeRunId: active && active.context ? active.context.runId : "",
      message: code === "SYNC_ALREADY_RUNNING"
        ? "Уже выполняется другой режим синхронизации."
        : "Не удалось получить lock синхронизации."
    };
  },

  /**
   * Выполнить следующий шаг.
   * @return {Object}
   */
  runNext: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(this.LOCK_TIMEOUT_MS)) {
      return this.blocked("LOCK_TIMEOUT", "continue");
    }
    try {
      return this.runNextUnlocked();
    } finally {
      TI.SyncExecution.deactivate();
      lock.releaseLock();
    }
  },

  runNextUnlocked: function() {
    var state = this.loadState();

    if (!state || state.status !== "running") {
      return state || { status: "idle" };
    }

    var steps = this.stateSteps(state);

    if (state.index >= steps.length) {
      return this.finish(state);
    }

    var step = steps[state.index];

    try {
      if (state.mode === "recalc") {
        TI.SyncExecution.assertStable(state.context.inputSnapshot, state.index === 0);
      }
      TI.SyncExecution.startStep(state.context, step.id);
      TI.SyncExecution.activate(state.context);
      this.saveState(state);
      state.results[step.id] = this.executeStep(step.id, state.mode);
      TI.SyncExecution.finishStep(state.context, step.id, state.results[step.id]);
      state.index += 1;
      state.updatedAt = new Date().toISOString();
      state.error = "";
      this.saveState(state);

      if (state.index >= steps.length) {
        return this.finish(state);
      }

      this.scheduleNext();
      return state;
    } catch (e) {
      state.status = "error";
      state.updatedAt = new Date().toISOString();
      state.error = step.title + ": " + e.toString();
      TI.SyncExecution.failStep(state.context, step.id, e);
      this.saveState(state);
      this.clearStepTriggers();
      this.setNoApiMode(false);
      TI.SyncExecution.persist(state.context);
      throw e;
    }
  },

  /**
   * Выполнить шаг по ID.
   * @param {string} stepId
   * @return {Object}
   */
  executeStep: function(stepId, mode) {
    if (stepId === "initialize") {
      Schema.initialize();
      return {
        settingsAdded: TI.Settings.ensureDefaults(),
        constitutionSettingsAdded: TI.Constitution.ensureDefaults(),
        rulesAdded: TI.RuleEngine.ensureDefaults(),
        multiAccount: TI.MultiAccount.ensureDefaults()
      };
    }

    if (stepId === "trades") {
      var incremental = TI.Operations.fetchIncremental();
      var tradeRows = TI.Trades.sync(incremental.operations);
      TI.Operations.commitIncrementalMarkers(incremental.markers);
      return {
        rows: tradeRows,
        fetchedOperations: incremental.operations.length,
        accounts: incremental.accountCount,
        incremental: true
      };
    }

    if (stepId === "accounts") {
      return TI.MultiAccount.syncAccounts();
    }

    if (stepId === "directory") {
      var directory = TI.Directory.refresh({
        market: false,
        prices: false
      });
      return directory;
    }

    if (stepId === "directoryShares") {
      return this.refreshDirectoryGroup("Shares", "shares", "Акции", false);
    }

    if (stepId === "directoryBonds") {
      return this.refreshDirectoryGroup("Bonds", "bonds", "Облигации", false);
    }

    if (stepId === "directoryEtfs") {
      return this.refreshDirectoryGroup("Etfs", "instruments", "Фонды", false);
    }

    if (stepId === "directoryPrices") {
      var existing = TI.Directory.readExisting();
      var priced = TI.Directory.enrichLastPrices(existing);
      TI.Directory.write(priced);
      return { rows: priced.length };
    }

    if (stepId === "quickData") {
      return this.refreshQuickData();
    }

    if (stepId === "fifo") {
      var fifo = TI.FIFO.build();
      return {
        lots: fifo.lots.length,
        sales: fifo.sales.length,
        errors: fifo.errors.length
      };
    }

    if (stepId === "portfolio") {
      return { rows: TI.Portfolio.rebuild() };
    }

    if (stepId === "portfolioFreshPrices") {
      return { rows: TI.Portfolio.rebuild({ forcePrices: true }) };
    }

    if (stepId === "portfolioNoApi") {
      return { rows: TI.Portfolio.rebuild({ skipPriceFetch: true }) };
    }

    if (stepId === "visualization") {
      return { rows: TI.Visualization.rebuild() };
    }

    if (stepId === "income") {
      return TI.Income.rebuild();
    }

    if (stepId === "inflation") {
      return TI.Inflation.refresh();
    }

    if (stepId === "multiAccount") {
      return TI.MultiAccount.ensureDefaults();
    }

    if (stepId === "strategy") {
      return { rowsAdded: TI.Strategy.ensureTemplate() };
    }

    if (stepId === "marketRegime") {
      return { rows: TI.MarketRegime.build().length };
    }

    if (stepId === "knowledge") {
      return TI.KnowledgeEngine.build();
    }

    if (stepId === "companyRating") {
      return { rows: TI.CompanyRating.build().length };
    }

    if (stepId === "bondAnalysis") {
      return { rows: TI.BondEngine.build().length };
    }

    if (stepId === "assetScoring") {
      return { rows: TI.AssetScoring.build().length };
    }

    if (stepId === "coi") {
      return { rows: TI.COI.build().length };
    }

    if (stepId === "strategyTargets") {
      return { targets: TI.StrategyEngine.updateTargets(mode === "recalc" ? {
        skipDefaults: true,
        skipValidationRefresh: true
      } : {}) };
    }

    if (stepId === "tax") {
      return { rows: TI.Tax.rebuild() };
    }

    if (stepId === "rebalance") {
      return { rows: TI.Rebalance.rebuild() };
    }

    if (stepId === "tradePlan") {
      return { rows: TI.TradePlan.rebuild() };
    }

    if (stepId === "decisions") {
      return { rows: TI.DecisionEngine.rebuild() };
    }

    if (stepId === "portfolioHealth") {
      return { rows: TI.PortfolioHealth.rebuild() };
    }

    if (stepId === "portfolioIntelligence") {
      return { rows: TI.PortfolioIntelligence.rebuild() };
    }

    if (stepId === "advisor") {
      return { rows: TI.Advisor.rebuild() };
    }

    if (stepId === "stabilization") {
      return { rows: TI.Stabilization.rebuild() };
    }

    if (stepId === "diagnostics") {
      return { rows: TI.Diagnostics.rebuild() };
    }

    if (stepId === "main") {
      return { rows: TI.Main.rebuild() };
    }

    if (stepId === "ui") {
      return { ok: TI.UI.applyAll() };
    }

    throw new Error("Неизвестный шаг синхронизации: " + stepId);
  },

  refreshDirectoryGroup: function(method, responseField, instrumentType, updatePrices) {
    var existing = TI.Directory.readExisting();
    var discovered = TI.Directory.fetchMarketGroup(
      method,
      responseField,
      instrumentType
    );
    var stats = TI.Directory.merge(existing, discovered);

    stats.rows = stats.rows.filter(function(row) {
      return TI.Directory.isExchangeTradable(row);
    });

    if (updatePrices === true) {
      stats.rows = TI.Directory.enrichLastPrices(stats.rows);
    }

    TI.Directory.write(stats.rows);

    if (TI.Strategy && TI.Strategy.refreshValidationLists) {
      TI.Strategy.refreshValidationLists();
    }

    return {
      total: stats.rows.length,
      added: stats.added,
      updated: stats.updated
    };
  },

  refreshQuickData: function() {
    var sources = TI.AutoDataRefresh.refreshFastSources();
    var accounts = TI.MultiAccount.syncAccounts();
    return {
      accounts: accounts.total,
      cashAccounts: sources.cash,
      positions: sources.positions,
      portfolios: sources.portfolios,
      prices: sources.prices,
      accountsDiscovered: sources.accountsDiscovered,
      accountsSyncEnabled: sources.accountsSyncEnabled,
      accountsSkipped: sources.accountsSkipped,
      skippedAccountIdSuffixes: sources.skippedAccountIdSuffixes,
      savedApiCallsEstimate: sources.savedApiCallsEstimate,
      warnings: sources.warnings || []
    };
  },

  stepsForMode: function(mode) {
    if (mode === "quick") {
      return this.QUICK_STEPS.slice();
    }

    if (mode === "recalc") {
      return this.RECALC_STEPS.slice();
    }

    if (mode === "maintenance") {
      return this.MAINTENANCE_STEPS.slice();
    }

    return this.FULL_STEPS.slice();
  },

  stateSteps: function(state) {
    return state && state.steps && state.steps.length
      ? state.steps
      : this.stepsForMode(state && state.mode ? state.mode : "full");
  },

  modeTitle: function(mode) {
    var map = {
      quick: "Быстрое обновление портфеля",
      recalc: "Пересчёт рекомендаций",
      full: "Полная синхронизация данных"
    };

    return map[mode] || map.full;
  },

  /**
   * Завершить синхронизацию.
   * @param {Object} state
   * @return {Object}
   */
  finish: function(state) {
    if (state.mode === "recalc" && state.context && state.context.inputSnapshot) {
      TI.SyncExecution.assertStable(state.context.inputSnapshot, false);
    }
    state.status = "complete";
    state.finishedAt = new Date().toISOString();
    state.updatedAt = state.finishedAt;
    TI.SyncExecution.finish(state.context, "complete");
    this.saveState(state);
    this.clearStepTriggers();
    this.setNoApiMode(false);
    TI.SyncExecution.persist(state.context);
    return state;
  },

  setNoApiMode: function(enabled) {
    if (enabled) {
      PropertiesService
        .getScriptProperties()
        .setProperty(this.NO_API_KEY, "Да");
      return;
    }

    PropertiesService
      .getScriptProperties()
      .deleteProperty(this.NO_API_KEY);
  },

  isNoApiMode: function() {
    return PropertiesService
      .getScriptProperties()
      .getProperty(this.NO_API_KEY) === "Да";
  },

  /**
   * Поставить следующий шаг через 10 секунд.
   */
  scheduleNext: function() {
    this.clearStepTriggers();

    ScriptApp.newTrigger(this.STEP_HANDLER)
      .timeBased()
      .at(new Date(Date.now() + 10 * 1000))
      .create();
  },

  /**
   * Включить ежедневное быстрое обновление в 21:00.
   * @return {number}
   */
  enableDaily: function() {
    this.clearDailyTriggers();

    ScriptApp.newTrigger(this.DAILY_HANDLER)
      .timeBased()
      .atHour(21)
      .nearMinute(0)
      .everyDays(1)
      .create();

    return this.countTriggers(this.DAILY_HANDLER);
  },

  /**
   * Отключить ежедневную синхронизацию.
   * @return {number}
   */
  disableDaily: function() {
    this.clearDailyTriggers();
    return this.countTriggers(this.DAILY_HANDLER);
  },

  enableMaintenance: function() {
    var days = TI.AutoMaintenance && TI.AutoMaintenance.days
      ? TI.AutoMaintenance.days()
      : 7;

    this.clearMaintenanceTriggers();

    ScriptApp.newTrigger(this.MAINTENANCE_HANDLER)
      .timeBased()
      .atHour(5)
      .nearMinute(0)
      .everyDays(days)
      .create();

    return this.countTriggers(this.MAINTENANCE_HANDLER);
  },

  disableMaintenance: function() {
    this.clearMaintenanceTriggers();
    return this.countTriggers(this.MAINTENANCE_HANDLER);
  },

  /**
   * Запустить ежедневную синхронизацию, если сейчас нет активной.
   * @return {Object}
   */
  runDaily: function() {
    var state = this.loadState();

    if (state && state.status === "running") {
      return state;
    }

    var started = this.start("daily", "quick");
    if (started.status === "blocked") return started;
    return this.runNext();
  },

  runMaintenance: function() {
    var state = this.loadState();

    if (state && state.status === "running") {
      return state;
    }

    var started = this.start("maintenance", "maintenance");
    if (started.status === "blocked") return started;
    return this.runNext();
  },

  /**
   * Текущий статус.
   * @return {Object}
   */
  status: function() {
    return this.loadState() || { status: "idle" };
  },

  /**
   * Остановить пакетную синхронизацию.
   * @return {Object}
   */
  stop: function() {
    var state = this.loadState() || {};
    state.status = "stopped";
    state.updatedAt = new Date().toISOString();
    this.saveState(state);
    this.clearStepTriggers();
    this.setNoApiMode(false);
    return state;
  },

  /**
   * Сохранить состояние.
   * @param {Object} state
   */
  saveState: function(state) {
    PropertiesService
      .getScriptProperties()
      .setProperty(this.STATE_KEY, JSON.stringify(state));
  },

  /**
   * Прочитать состояние.
   * @return {Object|null}
   */
  loadState: function() {
    var raw = PropertiesService
      .getScriptProperties()
      .getProperty(this.STATE_KEY);

    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Удалить временные триггеры шагов.
   */
  clearStepTriggers: function() {
    this.clearTriggers(this.STEP_HANDLER);
  },

  /**
   * Удалить ежедневные триггеры.
   */
  clearDailyTriggers: function() {
    this.clearTriggers(this.DAILY_HANDLER);
  },

  clearMaintenanceTriggers: function() {
    this.clearTriggers(this.MAINTENANCE_HANDLER);
  },

  /**
   * Удалить триггеры обработчика.
   * @param {string} handler
   */
  clearTriggers: function(handler) {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === handler) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  },

  /**
   * Посчитать триггеры обработчика.
   * @param {string} handler
   * @return {number}
   */
  countTriggers: function(handler) {
    return ScriptApp.getProjectTriggers().filter(function(trigger) {
      return trigger.getHandlerFunction() === handler;
    }).length;
  },

  /**
   * Текст статуса для пользователя.
   * @param {Object} state
   * @return {string}
   */
  statusText: function(state) {
    state = state || this.status();

    if (state.status === "idle") {
      return "Синхронизация ещё не запускалась.";
    }

    if (state.status === "blocked") {
      return state.message || "Другой режим синхронизации уже выполняется.";
    }

    var done = Number(state.index) || 0;
    var steps = this.stateSteps(state);
    var total = steps.length;
    var next = done < total ? steps[done].title : "готово";
    var title = this.modeTitle(state.mode);

    if (state.status === "complete") {
      return title + " завершено.\n\n" +
        "Шагов выполнено: " + total + " из " + total;
    }

    if (state.status === "error") {
      return title + " остановлено с ошибкой.\n\n" +
        state.error;
    }

    if (state.status === "stopped") {
      return title + " остановлено.";
    }

    return title + " запущено.\n\n" +
      "Выполнено шагов: " + done + " из " + total + "\n" +
      "Следующий шаг: " + next;
  }

};

/**
 * Продолжить пакетную синхронизацию.
 * @return {Object}
 */
function TI_BatchSyncContinue() {
  return TI.BatchSync.runNext();
}

/**
 * Запуск ежедневной автосинхронизации.
 * @return {Object}
 */
function TI_AutoFullSync() {
  return TI.BatchSync.runDaily();
}

function TI_AutoMaintenanceSync() {
  return TI.BatchSync.runMaintenance();
}

function TI_MaintenanceSync() {
  var state = TI.BatchSync.start("manual", "maintenance");
  if (state.status !== "blocked") state = TI.BatchSync.runNext();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

/**
 * Быстро обновить портфель.
 */
function TI_QuickSync() {
  var state = TI.BatchSync.start("manual", "quick");
  if (state.status !== "blocked") state = TI.BatchSync.runNext();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

/**
 * Пересчитать рекомендации без загрузки внешних данных.
 */
function TI_RecalculateRecommendations() {
  var state = TI.BatchSync.start("manual", "recalc");
  if (state.status !== "blocked") state = TI.BatchSync.runNext();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

/**
 * Показать статус пакетной синхронизации.
 */
function TI_ShowBatchSyncStatus() {
  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText());
}

/**
 * Остановить пакетную синхронизацию.
 */
function TI_StopBatchSync() {
  var state = TI.BatchSync.stop();

  SpreadsheetApp.getUi().alert(TI.BatchSync.statusText(state));
}

function TI_TestSyncLock() {
  return TI_ProbeSyncLockTest();
}

function TI_HoldSyncLockTest() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return { ok: false, code: "TEST_LOCK_UNAVAILABLE", acquired: false };
  }
  try {
    Utilities.sleep(8000);
    return { ok: true, heldMs: 8000, acquired: true };
  } finally {
    lock.releaseLock();
  }
}

function TI_ProbeSyncLockTest() {
  var lock = LockService.getScriptLock();
  var acquired = lock.tryLock(1000);
  if (acquired) lock.releaseLock();
  return {
    ok: acquired === false,
    parallelStartBlocked: acquired === false
  };
}

/**
 * Включить ежедневную синхронизацию в 21:00.
 */
function TI_EnableDailySync() {
  var count = TI.BatchSync.enableDaily();

  SpreadsheetApp.getUi().alert(
    "Ежедневное быстрое обновление включено.\n\n" +
    "Время запуска: около 21:00\n" +
    "Активных триггеров: " + count
  );
}

/**
 * Отключить ежедневную синхронизацию.
 */
function TI_DisableDailySync() {
  TI.BatchSync.disableDaily();

  SpreadsheetApp.getUi().alert(
    "Ежедневное быстрое обновление отключено."
  );
}
