/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: DirectoryBatch.gs
 * Версия: 1.0.0
 * Назначение:
 *   Пакетное обновление полного рыночного справочника.
 * ============================================================
 */

var TI = TI || {};

TI.DirectoryBatch = {

  STATE_KEY: "TI_DIRECTORY_BATCH_STATE",
  HANDLER: "TI_DirectoryBatchContinue",

  /**
   * Запустить пакетное обновление справочника.
   * @return {Object}
   */
  start: function() {
    var state = {
      status: "running",
      index: 0,
      groups: TI.Directory.marketGroups(),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      total: 0,
      added: 0,
      updated: 0,
      error: ""
    };

    this.clearTriggers();
    this.saveState(state);
    return state;
  },

  /**
   * Выполнить следующую группу инструментов.
   * @return {Object}
   */
  runNext: function() {
    var state = this.loadState();

    if (!state || state.status !== "running") {
      return state || { status: "idle" };
    }

    if (state.index >= state.groups.length) {
      return this.finish(state);
    }

    var group = state.groups[state.index];

    try {
      var existing = TI.Directory.readExisting();
      var discovered = TI.Directory.fetchMarketGroup(
        group.method,
        group.responseField,
        group.instrumentType
      );
      var stats = TI.Directory.merge(existing, discovered);
      stats.rows = stats.rows.filter(function(row) {
        return TI.Directory.isExchangeTradable(row);
      });
      TI.Directory.write(stats.rows);

      if (TI.Strategy && TI.Strategy.refreshValidationLists) {
        TI.Strategy.refreshValidationLists();
      }

      state.index += 1;
      state.total = stats.rows.length;
      state.added += stats.added;
      state.updated += stats.updated;
      state.updatedAt = new Date().toISOString();
      this.saveState(state);

      if (state.index >= state.groups.length) {
        return this.finish(state);
      }

      this.scheduleNext();
      return state;
    } catch (e) {
      state.status = "error";
      state.error = group.instrumentType + ": " + e.toString();
      state.updatedAt = new Date().toISOString();
      this.saveState(state);
      this.clearTriggers();
      throw e;
    }
  },

  /**
   * Завершить обновление.
   * @param {Object} state
   * @return {Object}
   */
  finish: function(state) {
    state.status = "complete";
    state.finishedAt = new Date().toISOString();
    state.updatedAt = state.finishedAt;
    this.saveState(state);
    this.clearTriggers();
    return state;
  },

  /**
   * Остановить обновление.
   * @return {Object}
   */
  stop: function() {
    var state = this.loadState() || {};
    state.status = "stopped";
    state.updatedAt = new Date().toISOString();
    this.saveState(state);
    this.clearTriggers();
    return state;
  },

  /**
   * Поставить следующий шаг.
   */
  scheduleNext: function() {
    this.clearTriggers();

    ScriptApp.newTrigger(this.HANDLER)
      .timeBased()
      .at(new Date(Date.now() + 10 * 1000))
      .create();
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
   * Текущий статус.
   * @return {Object}
   */
  status: function() {
    return this.loadState() || { status: "idle" };
  },

  /**
   * Удалить временные триггеры.
   */
  clearTriggers: function() {
    var handler = this.HANDLER;

    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === handler) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  },

  /**
   * Текст статуса.
   * @param {Object=} state
   * @return {string}
   */
  statusText: function(state) {
    state = state || this.status();

    if (state.status === "idle") {
      return "Пакетное обновление справочника ещё не запускалось.";
    }

    if (state.status === "error") {
      return "Пакетное обновление справочника остановилось с ошибкой.\n\n" +
        state.error;
    }

    if (state.status === "stopped") {
      return "Пакетное обновление справочника остановлено.";
    }

    if (state.status === "complete") {
      return "Пакетное обновление справочника завершено.\n\n" +
        "Всего инструментов: " + state.total + "\n" +
        "Добавлено: " + state.added + "\n" +
        "Дополнено: " + state.updated;
    }

    var done = Number(state.index) || 0;
    var total = state.groups ? state.groups.length : 0;
    var next = done < total ? state.groups[done].instrumentType : "готово";

    return "Пакетное обновление справочника запущено.\n\n" +
      "Выполнено групп: " + done + " из " + total + "\n" +
      "Следующая группа: " + next + "\n" +
      "Инструментов сейчас: " + (state.total || 0);
  }

};

/**
 * Продолжить пакетное обновление справочника.
 * @return {Object}
 */
function TI_DirectoryBatchContinue() {
  return TI.SyncExecution.guardWrite("trigger:directory-batch", function() {
    return TI.DirectoryBatch.runNext();
  });
}

/**
 * Запустить пакетное обновление справочника.
 */
function TI_StartDirectoryBatch() {
  return TI.SyncExecution.guardWrite("manual:directory-batch", function() {
    TI.DirectoryBatch.start();
    var state = TI.DirectoryBatch.runNext();

    SpreadsheetApp.getUi().alert(TI.DirectoryBatch.statusText(state));
    return state;
  });
}

/**
 * Показать статус пакетного обновления справочника.
 */
function TI_ShowDirectoryBatchStatus() {
  SpreadsheetApp.getUi().alert(TI.DirectoryBatch.statusText());
}

/**
 * Остановить пакетное обновление справочника.
 */
function TI_StopDirectoryBatch() {
  var state = TI.DirectoryBatch.stop();

  SpreadsheetApp.getUi().alert(TI.DirectoryBatch.statusText(state));
}
