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

  buildTradeKey: function(accountId, operationId, tradeId) {
    return [accountId, operationId, tradeId].map(function(value) {
      var text = String(value === null || value === undefined ? "" : value);
      return text.length + ":" + text;
    }).join("|");
  },

  tradeChecksum: function(trade) {
    var rawDate = trade.tradeDate;
    var parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
    var normalizedDate = rawDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : String(rawDate || "");
    var significant = [
      normalizedDate,
      String(trade.ticker || ""),
      String(trade.operationTypeCode || trade.operationType || ""),
      Number(trade.quantity) || 0,
      Number(trade.price) || 0,
      Number(trade.tradeAmount) || 0,
      Number(trade.commission) || 0,
      String(trade.currency || "")
    ];
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(significant));
    return bytes.map(function(byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    }).join("");
  },

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
  existingIndex: function() {
    var sheet = this.prepare();
    var index = {};

    if (sheet.getLastRow() <= 1) {
      return index;
    }

    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var fieldsByTitle = TI.FIFO.fieldsByTitle(this.SHEET);
    values.forEach(function(row) {
      var trade = {};
      headers.forEach(function(title, column) {
        trade[fieldsByTitle[title] || title] = row[column];
      });
      var key = TI.Trades.buildTradeKey(trade.accountId, trade.operationId, trade.tradeId);
      if (index[key] && index[key].checksum !== TI.Trades.tradeChecksum(trade)) {
        throw new Error("TRADE_KEY_CONFLICT: " + TI.AccountStrategyAudit.suffix(trade.tradeId));
      }
      index[key] = { checksum: TI.Trades.tradeChecksum(trade) };
    });

    return index;
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
  sync: function(operations) {
    operations = operations || TI.Operations.get();
    var trades = TI.AccountScope.filterHistoryRows(this.toObjects(operations));
    var exists = this.existingIndex();
    var conflicts = [];

    var fresh = trades.filter(function(trade) {
      var key = TI.Trades.buildTradeKey(trade.accountId, trade.operationId, trade.tradeId);
      var checksum = TI.Trades.tradeChecksum(trade);
      if (!exists[key]) {
        exists[key] = { checksum: checksum };
        return true;
      }
      if (exists[key].checksum !== checksum) conflicts.push(TI.AccountStrategyAudit.suffix(trade.tradeId));
      return false;
    });

    if (conflicts.length) {
      TI.TechLog.error("Trades", "sync", "TRADE_KEY_CONFLICT", conflicts.join(", "));
      throw new Error("TRADE_KEY_CONFLICT: " + conflicts.join(", "));
    }

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
    var trades = TI.AccountScope.filterHistoryRows(this.toObjects(operations));

    return this.write(trades);
  }

};

/**
 * Синхронизация сделок.
 * @return {number}
 */
function TI_SyncTrades() {
  return TI.SyncExecution.guardWrite("manual:trades-sync", function() {
    var count = TI.Trades.sync();

    SpreadsheetApp.getUi().alert(
      "Синхронизация завершена.\n\nНовых сделок: " + count
    );

    return count;
  });
}

/**
 * Полная пересборка сделок.
 * @return {number}
 */
function TI_RebuildTrades() {
  return TI.SyncExecution.guardWrite("manual:trades-rebuild", function() {
    var count = TI.Trades.rebuild();

    SpreadsheetApp.getUi().alert(
      "Лист сделок пересобран.\n\nЗагружено сделок: " + count
    );

    return count;
  });
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

function TI_TestTradeKey() {
  var first = TI.Trades.buildTradeKey("account", "operation-old", "1094");
  var second = TI.Trades.buildTradeKey("account", "operation-new", "1094");
  var same = TI.Trades.buildTradeKey("account", "operation-old", "1094");
  var apiTimestamp = TI.Trades.tradeChecksum({ tradeDate: "2026-07-12T07:45:44.337500Z" });
  var sheetDate = TI.Trades.tradeChecksum({ tradeDate: new Date("2026-07-12T07:45:44.337Z") });
  return {
    ok: first !== second && first === same && apiTimestamp === sheetDate,
    repeatedTradeIdAllowedAcrossOperations: first !== second,
    exactCompositeDuplicateDetected: first === same,
    timestampPrecisionNormalized: apiTimestamp === sheetDate
  };
}

function TI_AuditTradeHistory() {
  var sheet = TI.Trades.prepare();
  var values = sheet.getDataRange().getValues();
  var headers = values.shift() || [];
  var fieldsByTitle = TI.FIFO.fieldsByTitle(TI.Trades.SHEET);
  var keys = {};
  var shortIds = {};
  var duplicates = 0;
  var conflicts = 0;
  var missingRequiredIds = 0;
  values.forEach(function(row) {
    var trade = {};
    headers.forEach(function(title, column) {
      trade[fieldsByTitle[title] || title] = row[column];
    });
    if (!String(trade.accountId || "").trim() ||
        !String(trade.operationId || "").trim() ||
        !String(trade.tradeId || "").trim()) missingRequiredIds += 1;
    var key = TI.Trades.buildTradeKey(trade.accountId, trade.operationId, trade.tradeId);
    var checksum = TI.Trades.tradeChecksum(trade);
    if (keys[key]) {
      if (keys[key] === checksum) duplicates += 1;
      else conflicts += 1;
    } else {
      keys[key] = checksum;
    }
    var shortId = String(trade.tradeId || "");
    shortIds[shortId] = (shortIds[shortId] || 0) + 1;
  });
  var repeatedShortTradeIds = Object.keys(shortIds).filter(function(id) {
    return id && shortIds[id] > 1;
  }).length;
  return {
    ok: duplicates === 0 && conflicts === 0 && missingRequiredIds === 0,
    rows: values.length,
    uniqueCompositeKeys: Object.keys(keys).length,
    duplicateCompositeKeys: duplicates,
    tradeKeyConflicts: conflicts,
    missingRequiredIds: missingRequiredIds,
    repeatedShortTradeIds: repeatedShortTradeIds
  };
}

