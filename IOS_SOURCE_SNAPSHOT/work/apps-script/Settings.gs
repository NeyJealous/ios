/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Settings.gs
 * Версия: 1.0.0
 * Назначение:
 *   Чтение пользовательских настроек из листа "Настройки".
 *
 * История изменений:
 *   1.0.0 - Перенос ключевых параметров из кода в лист настроек.
 * ============================================================
 */

var TI = TI || {};

TI.Settings = {

  SHEET: CORE.SHEETS.SETTINGS,

  KEYS: Object.freeze({
    START_DATE: "Дата начала истории",
    CACHE_SECONDS: "Кэш операций, секунд",
    PRICE_CACHE_SECONDS: "Кэш цен, секунд",
    AUTO_QUICK_REFRESH_MINUTES: "Автообновление быстрых данных, минут",
    PAGE_LIMIT: "Размер страницы загрузки",
    TAX_RATE: "Ставка НДФЛ",
    INFLATION_RATE: "Инфляция",
    INFLATION_SOURCE_URL: "URL источника инфляции",
    REBALANCE_THRESHOLD: "Допуск ребалансировки"
  }),

  /**
   * Подготовить лист настроек.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Настройки по умолчанию.
   * @return {Object[]}
   */
  defaults: function() {
    return [
      {
        parameter: this.KEYS.START_DATE,
        value: CONFIG.START_DATE
      },
      {
        parameter: this.KEYS.CACHE_SECONDS,
        value: CONFIG.CACHE_SECONDS
      },
      {
        parameter: this.KEYS.PRICE_CACHE_SECONDS,
        value: CORE.SETTINGS.PRICE_CACHE_SECONDS
      },
      {
        parameter: this.KEYS.AUTO_QUICK_REFRESH_MINUTES,
        value: 15
      },
      {
        parameter: this.KEYS.PAGE_LIMIT,
        value: CONFIG.PAGE_LIMIT
      },
      {
        parameter: this.KEYS.TAX_RATE,
        value: CORE.SETTINGS.TAX_RATE
      },
      {
        parameter: this.KEYS.INFLATION_RATE,
        value: CORE.SETTINGS.INFLATION_RATE
      },
      {
        parameter: this.KEYS.INFLATION_SOURCE_URL,
        value: "https://cbr.ru/hd_base/infl/"
      },
      {
        parameter: "Формат источника инфляции",
        value: "Страница ЦБ или таблица с колонками: год, инфляция"
      },
      {
        parameter: this.KEYS.REBALANCE_THRESHOLD,
        value: CORE.SETTINGS.REBALANCE_THRESHOLD
      }
    ];
  },

  /**
   * Добавить отсутствующие настройки по умолчанию.
   * @return {number}
   */
  ensureDefaults: function() {
    var sheet = this.prepare();
    var existing = this.readMap();
    var rows = [];

    this.defaults().forEach(function(item) {
      if (existing[item.parameter] === undefined) {
        rows.push(item);
      }
    });

    if (rows.length === 0) {
      this.replaceTechnicalLabels();
      return 0;
    }

    var startRow = Math.max(sheet.getLastRow() + 1, 2);
    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.SETTINGS, row);
    });

    sheet.getRange(startRow, 1, values.length, values[0].length)
      .setValues(values);

    this.replaceTechnicalLabels();

    return rows.length;
  },

  replaceTechnicalLabels: function() {
    var sheet = this.prepare();

    if (sheet.getLastRow() <= 1) {
      return 0;
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    var changed = 0;

    values.forEach(function(row, index) {
      if (String(row[0] || "") === "Формат источника инфляции" &&
          String(row[1] || "") === "CBR HTML, CSV/JSON: year, inflation") {
        sheet.getRange(index + 2, 2)
          .setValue("Страница ЦБ или таблица с колонками: год, инфляция");
        changed += 1;
      }
    });

    return changed;
  },

  /**
   * Прочитать настройки в карту.
   * @return {Object}
   */
  readMap: function() {
    var sheet = this.prepare();
    var values = sheet.getDataRange().getValues();
    var result = {};

    if (values.length <= 1) {
      return result;
    }

    var headers = values.shift();
    var fieldsByTitle = this.fieldsByTitle();

    values.forEach(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      var key = String(item.parameter || "").trim();

      if (key) {
        result[key] = item.value;
      }
    });

    return result;
  },

  /**
   * Карта заголовков листа настроек.
   * @return {Object}
   */
  fieldsByTitle: function() {
    var result = {};

    Schema.getColumns(this.SHEET).forEach(function(column) {
      result[column.title] = column.field;
    });

    return result;
  },

  /**
   * Получить значение.
   * @param {string} key
   * @param {*} fallback
   * @return {*}
   */
  get: function(key, fallback) {
    var map = this.readMap();
    var value = map[key];

    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    return value;
  },

  /**
   * Получить число.
   * @param {string} key
   * @param {number} fallback
   * @return {number}
   */
  getNumber: function(key, fallback) {
    var value = this.get(key, fallback);

    if (typeof value === "number") {
      return value;
    }

    var text = String(value || "")
      .trim()
      .replace(",", ".")
      .replace("%", "");
    var number = Number(text);

    return isNaN(number) ? fallback : number;
  },

  /**
   * Получить процент.
   * @param {string} key
   * @param {number} fallback
   * @return {number}
   */
  getPercent: function(key, fallback) {
    var value = this.get(key, fallback);

    if (typeof value === "number") {
      return value > 1 ? value / 100 : value;
    }

    var text = String(value || "").trim();
    var hasPercent = text.indexOf("%") !== -1;
    var number = this.getNumber(key, fallback);

    if (isNaN(number)) {
      return fallback;
    }

    return hasPercent || number > 1 ? number / 100 : number;
  },

  getStartDate: function() {
    return this.get(this.KEYS.START_DATE, CONFIG.START_DATE);
  },

  getCacheSeconds: function() {
    return Math.max(
      1,
      Math.floor(this.getNumber(this.KEYS.CACHE_SECONDS, CONFIG.CACHE_SECONDS))
    );
  },

  getPriceCacheSeconds: function() {
    return Math.max(
      1,
      Math.floor(this.getNumber(
        this.KEYS.PRICE_CACHE_SECONDS,
        CORE.SETTINGS.PRICE_CACHE_SECONDS
      ))
    );
  },

  getAutoQuickRefreshMinutes: function() {
    var minutes = Math.floor(this.getNumber(
      this.KEYS.AUTO_QUICK_REFRESH_MINUTES,
      15
    ));
    var allowed = [1, 5, 10, 15, 30];

    for (var i = 0; i < allowed.length; i++) {
      if (minutes <= allowed[i]) {
        return allowed[i];
      }
    }

    return 30;
  },

  getPageLimit: function() {
    return Math.max(
      1,
      Math.floor(this.getNumber(this.KEYS.PAGE_LIMIT, CONFIG.PAGE_LIMIT))
    );
  },

  getTaxRate: function() {
    return this.getPercent(this.KEYS.TAX_RATE, CORE.SETTINGS.TAX_RATE);
  },

  getInflationRate: function() {
    return this.getPercent(
      this.KEYS.INFLATION_RATE,
      CORE.SETTINGS.INFLATION_RATE
    );
  },

  getInflationSourceUrl: function() {
    return String(this.get(this.KEYS.INFLATION_SOURCE_URL, "") || "").trim();
  },

  getRebalanceThreshold: function() {
    return this.getPercent(
      this.KEYS.REBALANCE_THRESHOLD,
      CORE.SETTINGS.REBALANCE_THRESHOLD
    );
  }

};

/**
 * Заполнить отсутствующие настройки по умолчанию.
 * @return {number}
 */
function TI_InitializeSettings() {
  var count = TI.Settings.ensureDefaults();

  SpreadsheetApp.getUi().alert(
    "Настройки подготовлены.\n\n" +
    "Добавлено строк: " + count
  );

  return count;
}
