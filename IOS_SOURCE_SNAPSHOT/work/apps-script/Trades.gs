/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Trades.gs
 * Версия: 1.0.0
 * Назначение:
 *   Преобразование операций API во внутренние объекты сделок
 *   и запись листа "Сделки" через Schema.
 *
 * История изменений:
 *   1.0.0 - Перевод модуля на Schema.buildRow().
 * ============================================================
 */

var TI = TI || {};

TI.Trades = {

  SHEET: CORE.SHEETS.TRADES,

  BUY_TYPES: CORE.OPERATION_GROUPS.BUY,

  SELL_TYPES: CORE.OPERATION_GROUPS.SELL,

  /**
   * Подготовить лист сделок.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    Schema.prepareSheet(this.SHEET);
    return Schema.ensureSheet(this.SHEET);
  },

  /**
   * Проверить, является ли операция сделкой.
   * @param {Object} operation
   * @return {boolean}
   */
  isTradeOperation: function(operation) {
    return this.BUY_TYPES.indexOf(operation.type) !== -1 ||
           this.SELL_TYPES.indexOf(operation.type) !== -1;
  },

  /**
   * Получить человекочитаемый тип операции.
   * @param {string} type
   * @return {string}
   */
  operationTitle: function(type) {
    return getOperationTitle(type);
  },

  /**
   * Преобразовать операции во внутренние объекты сделок.
   * @param {Object[]} operations
   * @return {Object[]}
   */
  toObjects: function(operations) {
    var result = [];
    var self = this;

    operations.forEach(function(operation) {
      if (!self.isTradeOperation(operation)) {
        return;
      }

      var trades = self.getOperationTrades(operation);
      var totalQuantity = self.totalQuantity(trades);

      trades.forEach(function(trade, index) {
        result.push(
          self.buildTradeObject(operation, trade, index, totalQuantity)
        );
      });
    });

    return result;
  },

  /**
   * Получить сделки внутри операции или синтетическую сделку.
   * @param {Object} operation
   * @return {Object[]}
   */
  getOperationTrades: function(operation) {
    if (operation.trades && operation.trades.length > 0) {
      return operation.trades;
    }

    return [{
      num: operation.id,
      date: operation.date,
      quantity: operation.quantity,
      price: TI.Utils.toMoneyValue(operation.price, operation.priceCurrency),
      yield: TI.Utils.toMoneyValue(operation.yield, operation.yieldCurrency)
    }];
  },

  /**
   * Суммарное количество по сделкам операции.
   * @param {Object[]} trades
   * @return {number}
   */
  totalQuantity: function(trades) {
    return trades.reduce(function(sum, trade) {
      return sum + Math.abs(Number(trade.quantity) || 0);
    }, 0);
  },

  /**
   * Построить внутренний объект сделки.
   * @param {Object} operation
   * @param {Object} trade
   * @param {number} index
   * @param {number} totalQuantity
   * @return {Object}
   */
  buildTradeObject: function(operation, trade, index, totalQuantity) {
    var quantity = Math.abs(Number(trade.quantity) || 0);
    var price = TI.Utils.money(trade.price);
    var commission = totalQuantity > 0
      ? operation.commission * quantity / totalQuantity
      : 0;

    return {
      tradeDate: trade.date || operation.date,
      ticker: operation.ticker,
      name: operation.name || operation.description || "",
      operationType: this.operationTitle(operation.type),
      operationTypeCode: operation.type,
      quantity: quantity,
      price: price,
      tradeAmount: price * quantity,
      commission: commission,
      currency: operation.priceCurrency || operation.paymentCurrency || "",
      accountName: operation.accountName || operation.accountId,
      tradeId: trade.num || (operation.id + "_" + (index + 1)),
      operationId: operation.id,
      accountId: operation.accountId,
      instrumentType: operation.instrumentType || operation.instrumentKind || "",
      assetUid: operation.assetUid,
      figi: operation.figi,
      instrumentUid: operation.instrumentUid
    };
  },

  /**
   * Преобразовать внутренние объекты в строки листа.
   * @param {Object[]} trades
   * @return {Array[]}
   */
  rows: function(trades) {
    return trades.map(function(trade) {
      return Schema.buildRow(CORE.SHEETS.TRADES, trade);
    });
  },

  /**
   * Получить существующие ID сделок.
   * @return {Object}
   */
  existingIds: function() {
    var sheet = this.prepare();
    var tradeIdColumn = Schema.getFieldIndex(this.SHEET, "tradeId") + 1;
    var ids = {};

    if (tradeIdColumn <= 0 || sheet.getLastRow() <= 1) {
      return ids;
    }

    var values = sheet
      .getRange(2, tradeIdColumn, sheet.getLastRow() - 1, 1)
      .getValues();

    values.forEach(function(row) {
      if (row[0]) {
        ids[String(row[0])] = true;
      }
    });

    return ids;
  },

  /**
   * Записать сделки в лист.
   * @param {Object[]} trades
   * @return {number}
   */
  write: function(trades) {
    var sheet = this.prepare();

    if (!trades || trades.length === 0) {
      return 0;
    }

    var rows = this.rows(trades);
    var startRow = sheet.getLastRow() + 1;

    sheet.getRange(startRow, 1, rows.length, rows[0].length)
      .setValues(rows);

    return rows.length;
  },

  /**
   * Синхронизировать новые сделки без дублей.
   * @return {number}
   */
  sync: function() {
    var operations = TI.Operations.get();
    var trades = this.toObjects(operations);
    var exists = this.existingIds();

    var fresh = trades.filter(function(trade) {
      return !exists[String(trade.tradeId)];
    });

    return this.write(fresh);
  },

  /**
   * Полностью пересобрать лист сделок.
   * @return {number}
   */
  rebuild: function() {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      ).clearContent();
    }

    var operations = TI.Operations.get(true);
    var trades = this.toObjects(operations);

    return this.write(trades);
  }

};

/**
 * Синхронизация сделок.
 * @return {number}
 */
function TI_SyncTrades() {
  var count = TI.Trades.sync();

  SpreadsheetApp.getUi().alert(
    "Синхронизация завершена.\n\nНовых сделок: " + count
  );

  return count;
}

/**
 * Полная пересборка сделок.
 * @return {number}
 */
function TI_RebuildTrades() {
  var count = TI.Trades.rebuild();

  SpreadsheetApp.getUi().alert(
    "Лист сделок пересобран.\n\nЗагружено сделок: " + count
  );

  return count;
}

/**
 * Проверка модуля Trades.
 * @return {Object}
 */
function TI_TestTrades() {
  try {
    var operations = TI.Operations.get(true);
    var trades = TI.Trades.toObjects(operations);

    var stats = trades.reduce(function(acc, trade) {
      if (!trade.tradeId) acc.missingTradeId++;
      acc.quantity += Number(trade.quantity) || 0;
      acc.commission += Number(trade.commission) || 0;
      return acc;
    }, {
      operations: operations.length,
      trades: trades.length,
      missingTradeId: 0,
      quantity: 0,
      commission: 0
    });

    var message =
      "Операций: " + stats.operations + "\n" +
      "Сделок: " + stats.trades + "\n" +
      "Без ID сделки: " + stats.missingTradeId + "\n" +
      "Количество (сумма): " + stats.quantity + "\n" +
      "Комиссия (сумма): " + stats.commission.toFixed(2);

    Logger.log(message);
    SpreadsheetApp.getUi().alert(message);

    return stats;
  } catch (e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert("Ошибка:\n\n" + e.message);
    throw e;
  }
}

