/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Strategy.gs
 * Версия: 1.0.0
 * Назначение:
 *   Подготовка листа инвестиционной стратегии.
 *
 * История изменений:
 *   1.0.0 - Стартовый шаблон целей по текущей структуре портфеля.
 * ============================================================
 */

var TI = TI || {};

TI.Strategy = {

  SHEET: CORE.SHEETS.STRATEGY,
  CACHE_SHEET: CORE.SERVICE_SHEETS.CACHE,

  /**
   * Подготовить лист стратегии.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Заполнить шаблон, если стратегия ещё пустая.
   * @return {number}
   */
  ensureTemplate: function() {
    var sheet = this.prepare();
    this.refreshValidationLists();
    this.applyValueValidations(sheet);

    if (this.hasRows(sheet)) {
      return 0;
    }

    var rows = this.buildTemplateRows();

    if (rows.length === 0) {
      rows = this.fallbackTemplateRows();
    }

    this.writeRows(sheet, rows);

    return rows.length;
  },

  /**
   * Есть ли пользовательские строки стратегии.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @return {boolean}
   */
  hasRows: function(sheet) {
    if (sheet.getLastRow() <= 1) {
      return false;
    }

    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

    return values.some(function(row) {
      return String(row[0] || "").trim() ||
        String(row[1] || "").trim() ||
        row[2] !== "" ||
        row[3] !== "";
    });
  },

  /**
   * Построить шаблон по текущим долям портфеля.
   * @return {Object[]}
   */
  buildTemplateRows: function() {
    var portfolio = TI.Portfolio.build();
    var byType = this.groupShares(portfolio, "instrumentType");
    var bySector = this.groupShares(portfolio, "sector");
    var byIssuer = this.groupShares(portfolio, "issuer");
    var rows = [];

    this.pushGroupRows(rows, "Тип инструмента", byType,
      "Текущая доля типа инструмента. Измените под вашу целевую структуру.");
    this.pushGroupRows(rows, "Отрасль", bySector,
      "Текущая доля отрасли. Заполните отрасли в справочнике и измените цель.");
    this.pushGroupRows(rows, "Эмитент", byIssuer,
      "Текущая доля эмитента. Заполните эмитента в справочнике и измените цель.");

    return rows;
  },

  /**
   * Сгруппировать доли портфеля.
   * @param {Object[]} portfolio
   * @param {string} field
   * @return {Object}
   */
  groupShares: function(portfolio, field) {
    var result = {};
    var total = portfolio.reduce(function(sum, row) {
      return sum + (Number(row.marketValue) || 0);
    }, 0);

    if (total <= 0) {
      return result;
    }

    portfolio.forEach(function(row) {
      var key = String(row[field] || "").trim();

      if (!key) {
        return;
      }

      result[key] = (result[key] || 0) + (Number(row.marketValue) || 0) / total;
    });

    return result;
  },

  /**
   * Добавить строки группы в шаблон.
   * @param {Object[]} rows
   * @param {string} parameter
   * @param {Object} shares
   * @param {string} description
   */
  pushGroupRows: function(rows, parameter, shares, description) {
    Object.keys(shares).sort().forEach(function(name) {
      rows.push({
        parameter: parameter,
        value: name,
        targetShare: shares[name],
        description: description
      });
    });
  },

  /**
   * Запасной шаблон, если портфель ещё не построен.
   * @return {Object[]}
   */
  fallbackTemplateRows: function() {
    return [
      {
        parameter: "Тип инструмента",
        value: "Акции",
        targetShare: 0,
        description: "Укажите желаемую долю акций."
      },
      {
        parameter: "Тип инструмента",
        value: "Облигации",
        targetShare: 0,
        description: "Укажите желаемую долю облигаций."
      },
      {
        parameter: "Тип инструмента",
        value: "Фонды",
        targetShare: 0,
        description: "Укажите желаемую долю фондов."
      }
    ];
  },

  /**
   * Записать строки стратегии.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {Object[]} rows
   */
  writeRows: function(sheet, rows) {
    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.STRATEGY, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    this.applyValueValidations(sheet);
  },

  /**
   * Обновить скрытые списки значений для зависимых выпадающих списков.
   */
  refreshValidationLists: function() {
    var cache = this.prepareCacheSheet();
    var values = this.directoryValues();
    var maxRows = Math.max(
      values.tickers.length,
      values.instrumentTypes.length,
      values.sectors.length,
      values.issuers.length,
      values.accounts.length,
      1
    );
    var rows = [];

    for (var i = 0; i < maxRows; i++) {
      rows.push([
        values.tickers[i] || "",
        values.instrumentTypes[i] || "",
        values.sectors[i] || "",
        values.issuers[i] || "",
        values.accounts[i] || ""
      ]);
    }

    cache.clearContents();
    cache.getRange(1, 1, 1, 4)
      .setValues([["Тикер", "Тип инструмента", "Отрасль", "Эмитент"]]);
    cache.getRange(1, 5).setValue("Account");
    cache.getRange(2, 1, rows.length, 5).setValues(rows);

    try {
      cache.hideSheet();
    } catch (e) {
      Logger.log(e);
    }
  },

  /**
   * Создать или вернуть скрытый лист кэша.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepareCacheSheet: function() {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(this.CACHE_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(this.CACHE_SHEET);
    }

    if (sheet.getMaxColumns() < 5) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 5 - sheet.getMaxColumns());
    }

    return sheet;
  },

  /**
   * Собрать уникальные значения из справочника.
   * @return {{tickers:string[],instrumentTypes:string[],sectors:string[],issuers:string[]}}
   */
  directoryValues: function() {
    var rows = TI.Directory.readExisting();

    return {
      tickers: this.unique(rows, "ticker"),
      instrumentTypes: this.unique(rows, "instrumentType"),
      sectors: this.unique(rows, "sector"),
      issuers: this.unique(rows, "issuer"),
      accounts: this.accountValues()
    };
  },

  /**
   * Account values for the Strategy sheet.
   * @return {string[]}
   */
  accountValues: function() {
    try {
      return [TI.Rebalance.ALL_ACCOUNTS].concat(TI.Accounts.names());
    } catch (e) {
      Logger.log(e);
      return [TI.Rebalance.ALL_ACCOUNTS];
    }
  },

  /**
   * Уникальные непустые значения поля.
   * @param {Object[]} rows
   * @param {string} field
   * @return {string[]}
   */
  unique: function(rows, field) {
    var seen = {};
    var result = [];

    rows.forEach(function(row) {
      var value = String(row[field] || "").trim();

      if (!value || seen[value]) {
        return;
      }

      seen[value] = true;
      result.push(value);
    });

    return result.sort(function(a, b) {
      return a.localeCompare(b);
    });
  },

  /**
   * Применить зависимые списки значений ко всем строкам стратегии.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   */
  applyValueValidations: function(sheet) {
    var rowsCount = Math.max(sheet.getMaxRows() - 1, 1);
    this._validationCacheSheet = this.prepareCacheSheet();
    this._validationCacheLastRow = Math.max(this._validationCacheSheet.getLastRow(), 2);

    for (var row = 2; row <= rowsCount + 1; row++) {
      this.applyValueValidationForRow(sheet, row, false);
    }

    this.applyAccountValidations(sheet);

    this._validationCacheSheet = null;
    this._validationCacheLastRow = null;
  },

  /**
   * Apply account dropdown to Strategy rows.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   */
  applyAccountValidations: function(sheet) {
    var accountColumn = this.schemaColumn("accountName");

    if (!accountColumn) {
      return;
    }

    var rowsCount = Math.max(sheet.getMaxRows() - 1, 1);
    var cache = this._validationCacheSheet || this.prepareCacheSheet();
    var lastRow = this._validationCacheLastRow || Math.max(cache.getLastRow(), 2);
    var range = cache.getRange(2, 5, lastRow - 1, 1);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(range, true)
      .setAllowInvalid(true)
      .build();

    sheet.getRange(2, accountColumn, rowsCount, 1)
      .setDataValidation(rule);
  },

  /**
   * Find a Strategy column by schema field.
   * @param {string} field
   * @return {number}
   */
  schemaColumn: function(field) {
    var columns = Schema.getColumns(CORE.SHEETS.STRATEGY);

    for (var i = 0; i < columns.length; i++) {
      if (columns[i].field === field) {
        return i + 1;
      }
    }

    return 0;
  },

  /**
   * Применить зависимый список к одной строке.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {number} row
   * @param {boolean} clearValue
   */
  applyValueValidationForRow: function(sheet, row, clearValue) {
    var parameter = String(sheet.getRange(row, 1).getValue() || "").trim();
    var valueCell = sheet.getRange(row, 2);
    var source = this.validationSource(parameter);

    valueCell.clearDataValidations();

    if (!source) {
      return;
    }

    var cache = this._validationCacheSheet || this.prepareCacheSheet();
    var lastRow = this._validationCacheLastRow || Math.max(cache.getLastRow(), 2);
    var range = cache.getRange(2, source.column, lastRow - 1, 1);
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(range, true)
      .setAllowInvalid(false)
      .build();

    valueCell.setDataValidation(rule);

    if (clearValue) {
      valueCell.clearContent();
    }
  },

  /**
   * Источник списка для выбранного разреза.
   * @param {string} parameter
   * @return {{column:number}|null}
   */
  validationSource: function(parameter) {
    var normalized = TI.Rebalance.normalizeTargetKind(parameter);

    if (normalized === TI.Rebalance.TARGET_KINDS.TICKER) {
      return { column: 1 };
    }

    if (normalized === TI.Rebalance.TARGET_KINDS.INSTRUMENT_TYPE) {
      return { column: 2 };
    }

    if (normalized === TI.Rebalance.TARGET_KINDS.SECTOR) {
      return { column: 3 };
    }

    if (normalized === TI.Rebalance.TARGET_KINDS.ISSUER) {
      return { column: 4 };
    }

    if (normalized === TI.Rebalance.TARGET_KINDS.RESERVE) {
      return null;
    }

    return null;
  }

};

/**
 * Заполнить стартовый шаблон инвестиционной стратегии.
 * @return {number}
 */
function TI_InitializeStrategy() {
  var count = TI.Strategy.ensureTemplate();

  SpreadsheetApp.getUi().alert(
    "Инвестиционная стратегия подготовлена.\n\n" +
    "Добавлено строк: " + count
  );

  return count;
}

/**
 * Обновить зависимые списки стратегии после ручного изменения разреза.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onEdit(e) {
  if (!e || !e.range) {
    return;
  }

  var sheet = e.range.getSheet();

  if (sheet.getName() !== CORE.SHEETS.STRATEGY) {
    return;
  }

  if (e.range.getRow() < 2 || e.range.getColumn() !== 1) {
    return;
  }

  TI.Strategy.refreshValidationLists();
  TI.Strategy.applyValueValidationForRow(sheet, e.range.getRow(), true);
}
