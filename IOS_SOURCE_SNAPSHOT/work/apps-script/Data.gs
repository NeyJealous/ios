/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Data.gs
 * Версия: 1.0.0
 * Назначение:
 *   Быстрое чтение уже рассчитанных листов без повторных API-запросов.
 * ============================================================
 */

var TI = TI || {};

TI.Data = {

  /**
   * Прочитать лист в объекты по схеме.
   * @param {string} sheetName
   * @return {Object[]}
   */
  sheetObjects: function(sheetName) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var fieldsByTitle = TI.FIFO.fieldsByTitle(sheetName);

    return values.map(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      return item;
    }).filter(function(item) {
      return TI.Data.hasValue(item);
    });
  },

  /**
   * Есть ли в объекте непустые значения.
   * @param {Object} item
   * @return {boolean}
   */
  hasValue: function(item) {
    return Object.keys(item).some(function(key) {
      return item[key] !== "" && item[key] !== null && item[key] !== undefined;
    });
  },

  /**
   * Прочитать портфель из листа, если он уже построен.
   * @return {Object[]}
   */
  portfolio: function() {
    return this.sheetObjects(CORE.SHEETS.PORTFOLIO);
  },

  /**
   * Прочитать сделки из листа.
   * @return {Object[]}
   */
  trades: function() {
    return this.sheetObjects(CORE.SHEETS.TRADES);
  },

  /**
   * Прочитать ребалансировку из листа.
   * @return {Object[]}
   */
  rebalance: function() {
    return this.sheetObjects(CORE.SHEETS.REBALANCE);
  },

  /**
   * Прочитать план сделок из листа.
   * @return {Object[]}
   */
  tradePlan: function() {
    return this.sheetObjects(CORE.SHEETS.TRADE_PLAN);
  },

  /**
   * Прочитать налоги из листа.
   * @return {Object[]}
   */
  taxes: function() {
    return this.sheetObjects(CORE.SHEETS.TAX);
  },

  /**
   * Прочитать диагностику из листа.
   * @return {Object[]}
   */
  diagnostics: function() {
    return this.sheetObjects(CORE.SHEETS.DIAGNOSTICS);
  },

  /**
   * Прочитать советник из листа.
   * @return {Object[]}
   */
  advisor: function() {
    return this.sheetObjects(CORE.SHEETS.ADVISOR);
  },

  /**
   * Прочитать продажи FIFO из листа.
   * @return {Object[]}
   */
  fifoSales: function() {
    return this.sheetObjects(CORE.SHEETS.FIFO_SALES);
  },

  /**
   * Прочитать открытые лоты FIFO из листа.
   * @return {Object[]}
   */
  fifoLots: function() {
    return this.sheetObjects(CORE.SHEETS.FIFO_LOTS);
  },

  /**
   * Прочитать ошибки FIFO из листа.
   * @return {Object[]}
   */
  fifoErrors: function() {
    return this.sheetObjects(CORE.SHEETS.FIFO_ERRORS);
  },

  /**
   * Построить портфель из уже рассчитанных FIFO-лотов без API.
   * @return {Object[]}
   */
  portfolioFromFifoLots: function() {
    var lots = this.fifoLots();

    if (lots.length === 0) {
      return [];
    }

    var rows = TI.Portfolio.aggregateLots(lots);
    TI.Portfolio.enrichMetadata(rows);

    return TI.Portfolio.applyPrices(rows);
  }

};
