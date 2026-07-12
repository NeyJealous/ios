/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: TechLog.gs
 * Версия: 1.0.0
 * Назначение:
 *   Технический журнал выполнения функций и smoke-тестов.
 * ============================================================
 */

var TI = TI || {};

TI.TechLog = {

  SHEET: CORE.SHEETS.TECH_LOG,

  LEVELS: Object.freeze({
    INFO: "Информация",
    WARNING: "Внимание",
    ERROR: "Ошибка"
  }),

  /**
   * Подготовить лист технического журнала.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Записать строку журнала.
   * @param {string} level
   * @param {string} source
   * @param {string} action
   * @param {string} message
   * @param {*} details
   * @param {number=} durationMs
   * @return {Object}
   */
  write: function(level, source, action, message, details, durationMs) {
    var sheet = this.prepare();
    var row = {
      timestamp: new Date(),
      level: level || this.LEVELS.INFO,
      source: source || "",
      action: action || "",
      message: message || "",
      durationMs: durationMs === undefined ? "" : durationMs,
      details: this.stringifyDetails(details)
    };

    sheet.appendRow(Schema.buildRow(this.SHEET, row));

    return row;
  },

  info: function(source, action, message, details, durationMs) {
    return this.write(
      this.LEVELS.INFO,
      source,
      action,
      message,
      details,
      durationMs
    );
  },

  warning: function(source, action, message, details, durationMs) {
    return this.write(
      this.LEVELS.WARNING,
      source,
      action,
      message,
      details,
      durationMs
    );
  },

  error: function(source, action, message, details, durationMs) {
    return this.write(
      this.LEVELS.ERROR,
      source,
      action,
      message,
      details,
      durationMs
    );
  },

  /**
   * Выполнить функцию с замером времени и логированием результата.
   * @param {string} source
   * @param {string} action
   * @param {Function} callback
   * @return {*}
   */
  measure: function(source, action, callback) {
    var startedAt = Date.now();

    try {
      var result = callback();
      this.info(
        source,
        action,
        "Выполнено успешно.",
        "",
        Date.now() - startedAt
      );
      return result;
    } catch (e) {
      this.error(
        source,
        action,
        e.message || String(e),
        e.stack || "",
        Date.now() - startedAt
      );
      throw e;
    }
  },

  /**
   * Безопасно представить детали в виде текста.
   * @param {*} details
   * @return {string}
   */
  stringifyDetails: function(details) {
    if (details === undefined || details === null) {
      return "";
    }

    if (typeof details === "string") {
      return details;
    }

    try {
      return JSON.stringify(details);
    } catch (e) {
      return String(details);
    }
  }

};

