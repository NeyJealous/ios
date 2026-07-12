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
  STEP_HANDLER: "TI_BatchSyncContinue",
  DAILY_HANDLER: "TI_AutoFullSync",

  STEPS: [
    { id: "initialize", title: "Подготовка листов" },
    { id: "trades", title: "Сделки" },
    { id: "directory", title: "Справочник" },
    { id: "fifo", title: "FIFO" },
    { id: "portfolio", title: "Портфель" },
    { id: "visualization", title: "Визуализация" },
    { id: "income", title: "Доходы и денежные потоки" },
    { id: "inflation", title: "Инфляция" },
    { id: "strategy", title: "Стратегия" },
    { id: "marketRegime", title: "Режим рынка" },
    { id: "companyRating", title: "Рейтинг компаний" },
    { id: "strategyTargets", title: "Стратегические цели" },
    { id: "tax", title: "Налоги" },
    { id: "rebalance", title: "Ребалансировка" },
    { id: "tradePlan", title: "План сделок" },
    { id: "advisor", title: "Советник" },
    { id: "diagnostics", title: "Диагностика" },
    { id: "main", title: "Главная" }
  ],

  /**
   * Запустить пакетную синхронизацию.
   * @param {string=} source
   * @return {Object}
   */
  start: function(source) {
    var state = {
      status: "running",
      source: source || "manual",
      index: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      results: {},
      error: ""
    };

    this.clearStepTriggers();
    this.saveState(state);

    return state;
  },

  /**
   * Выполнить следующий шаг.
   * @return {Object}
   */
  runNext: function() {
    var state = this.loadState();

    if (!state || state.status !== "running") {
      return state || { status: "idle" };
    }

    if (state.index >= this.STEPS.length) {
      return this.finish(state);
    }

    var step = this.STEPS[state.index];

    try {
      state.results[step.id] = this.executeStep(step.id);
      state.index += 1;
      state.updatedAt = new Date().toISOString();
      state.error = "";
      this.saveState(state);

      if (state.index >= this.STEPS.length) {
        return this.finish(state);
      }

      this.scheduleNext();
      return state;
    } catch (e) {
      state.status = "error";
      state.updatedAt = new Date().toISOString();
      state.error = step.title + ": " + e.toString();
      this.saveState(state);
      this.clearStepTriggers();
      throw e;
    }
  },

  /**
   * Выполнить шаг по ID.
   * @param {string} stepId
   * @return {Object}
   */
  executeStep: function(stepId) {
    if (stepId === "initialize") {
      Schema.initialize();
      return {
        settingsAdded: TI.Settings.ensureDefaults(),
        constitutionSettingsAdded: TI.Constitution.ensureDefaults()
      };
    }

    if (stepId === "trades") {
      return { rows: TI.Trades.rebuild() };
    }

    if (stepId === "directory") {
      var directory = TI.Directory.refresh({
        market: false,
        prices: false
      });
      return directory;
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

    if (stepId === "visualization") {
      return { rows: TI.Visualization.rebuild() };
    }

    if (stepId === "income") {
      return TI.Income.rebuild();
    }

    if (stepId === "inflation") {
      return TI.Inflation.refresh();
    }

    if (stepId === "strategy") {
      return { rowsAdded: TI.Strategy.ensureTemplate() };
    }

    if (stepId === "marketRegime") {
      return { rows: TI.MarketRegime.build().length };
    }

    if (stepId === "companyRating") {
      return { rows: TI.CompanyRating.build().length };
    }

    if (stepId === "strategyTargets") {
      return { targets: TI.StrategyEngine.updateTargets() };
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

    if (stepId === "advisor") {
      return { rows: TI.Advisor.rebuild() };
    }

    if (stepId === "diagnostics") {
      return { rows: TI.Diagnostics.rebuild() };
    }

    if (stepId === "main") {
      return { rows: TI.Main.rebuild() };
    }

    throw new Error("Неизвестный шаг синхронизации: " + stepId);
  },

  /**
   * Завершить синхронизацию.
   * @param {Object} state
   * @return {Object}
   */
  finish: function(state) {
    state.status = "complete";
    state.finishedAt = new Date().toISOString();
    state.updatedAt = state.finishedAt;
    this.saveState(state);
    this.clearStepTriggers();
    return state;
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
   * Включить ежедневную синхронизацию в 21:00.
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

  /**
   * Запустить ежедневную синхронизацию, если сейчас нет активной.
   * @return {Object}
   */
  runDaily: function() {
    var state = this.loadState();

    if (state && state.status === "running") {
      return state;
    }

    this.start("daily");
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
      return "Пакетная синхронизация ещё не запускалась.";
    }

    var done = Number(state.index) || 0;
    var total = this.STEPS.length;
    var next = done < total ? this.STEPS[done].title : "готово";

    if (state.status === "complete") {
      return "Пакетная синхронизация завершена.\n\n" +
        "Шагов выполнено: " + total + " из " + total;
    }

    if (state.status === "error") {
      return "Пакетная синхронизация остановилась с ошибкой.\n\n" +
        state.error;
    }

    if (state.status === "stopped") {
      return "Пакетная синхронизация остановлена.";
    }

    return "Пакетная синхронизация запущена.\n\n" +
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

/**
 * Включить ежедневную синхронизацию в 21:00.
 */
function TI_EnableDailySync() {
  var count = TI.BatchSync.enableDaily();

  SpreadsheetApp.getUi().alert(
    "Ежедневная синхронизация включена.\n\n" +
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
    "Ежедневная синхронизация отключена."
  );
}
