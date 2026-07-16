/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: FIFO.gs
 * Версия: 1.0.0
 * Назначение:
 *   Расчёт FIFO по сделкам с объектами Lot, Sale и Error.
 *
 * История изменений:
 *   1.0.0 - Реализация FIFO_v2 через Schema.
 * ============================================================
 */

var TI = TI || {};

TI.FIFO = {

  BUY_TYPES: CORE.OPERATION_GROUPS.BUY,

  SELL_TYPES: CORE.OPERATION_GROUPS.SELL,

  /**
   * Прочитать сделки из листа по схеме.
   * @return {Object[]}
   */
  readTrades: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.TRADES);

    if (!sheet) {
      throw new Error('Лист "Сделки" не найден.');
    }

    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    var headers = values.shift();
    var fieldsByTitle = this.fieldsByTitle(CORE.SHEETS.TRADES);

    return values.map(function(row) {
      var trade = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        trade[field] = row[index];
      });

      return trade;
    }).filter(function(trade) {
      return trade.tradeId;
    });
  },

  /**
   * Построить карту "русский заголовок -> внутреннее поле".
   * @param {string} sheetName
   * @return {Object}
   */
  fieldsByTitle: function(sheetName) {
    var result = {};

    Schema.getColumns(sheetName).forEach(function(column) {
      result[column.title] = column.field;
    });

    return result;
  },

  /**
   * Отсортировать сделки для FIFO.
   * @param {Object[]} trades
   * @return {Object[]}
   */
  sortTrades: function(trades) {
    return trades.sort(function(a, b) {
      var groupCompare = TI.FIFO.groupKey(a).localeCompare(TI.FIFO.groupKey(b));

      if (groupCompare !== 0) {
        return groupCompare;
      }

      var da = new Date(a.tradeDate).getTime();
      var db = new Date(b.tradeDate).getTime();

      if (da !== db) {
        return da - db;
      }

      return String(a.tradeId).localeCompare(String(b.tradeId));
    });
  },

  /**
   * Ключ группировки assetUid -> figi -> instrumentUid.
   * @param {Object} trade
   * @return {string}
   */
  groupKey: function(trade) {
    return "ACCOUNT|" + String(trade.accountId || "") + "|" +
      this.instrumentKey(trade);
  },

  /**
   * Единый ключ инструмента для FIFO.
   * API иногда отдаёт разные служебные идентификаторы для одной бумаги,
   * поэтому тикер используем как главный стабильный ключ портфельного учёта.
   * @param {Object} item
   * @return {string}
   */
  instrumentKey: function(item) {
    var ticker = String(item.ticker || "").trim().toUpperCase();

    if (ticker) {
      return "TICKER|" + ticker;
    }

    if (item.assetUid) {
      return "ASSET|" + item.assetUid;
    }

    if (item.figi) {
      return "FIGI|" + item.figi;
    }

    if (item.instrumentUid) {
      return "UID|" + item.instrumentUid;
    }

    return "";
  },

  isBuy: function(trade) {
    return this.BUY_TYPES.indexOf(trade.operationTypeCode) !== -1;
  },

  isSell: function(trade) {
    return this.SELL_TYPES.indexOf(trade.operationTypeCode) !== -1;
  },

  /**
   * Построить лот покупки.
   * @param {Object} trade
   * @return {Object}
   */
  createLot: function(trade) {
    var quantity = Number(trade.quantity) || 0;
    var buyPrice = Number(trade.price) || 0;
    var commission = Number(trade.commission) || 0;
    var cost = (buyPrice * quantity) + commission;

    return {
      ticker: trade.ticker,
      name: trade.name || "",
      buyDate: trade.tradeDate,
      quantity: quantity,
      quantityLeft: quantity,
      buyPrice: buyPrice,
      costLeft: cost,
      marketPrice: "",
      profit: "",
      ageDays: this.ageDays(trade.tradeDate),
      lotId: trade.tradeId,
      tradeId: trade.tradeId,
      operationId: trade.operationId,
      accountName: trade.accountName || trade.accountId || "",
      accountId: trade.accountId,
      instrumentType: trade.instrumentType || "",
      assetUid: trade.assetUid,
      figi: trade.figi,
      instrumentUid: trade.instrumentUid
    };
  },

  /**
   * Возраст лота в днях.
   * @param {Date|string} date
   * @return {number}
   */
  ageDays: function(date) {
    if (!date) {
      return 0;
    }

    var start = new Date(date).getTime();
    var now = new Date().getTime();

    if (!start) {
      return 0;
    }

    return Math.max(0, Math.floor((now - start) / 86400000));
  },

  /**
   * Выполнить FIFO-расчёт.
   * @param {Object[]} trades
   * @return {{lots:Object[], sales:Object[], errors:Object[]}}
   */
  calculate: function(trades) {
    var queues = {};
    var sales = [];
    var errors = [];
    var self = this;

    this.sortTrades(trades).forEach(function(trade) {
      if (!trade.instrumentUid && !trade.figi && !trade.assetUid) {
        return;
      }

      var key = self.groupKey(trade);

      if (!queues[key]) {
        queues[key] = [];
      }

      if (self.isBuy(trade)) {
        queues[key].push(self.createLot(trade));
        return;
      }

      if (self.isSell(trade)) {
        self.applySale(trade, queues[key], sales, errors);
      }
    });

    return {
      lots: this.openLots(queues),
      sales: sales,
      errors: errors
    };
  },

  /**
   * Применить продажу к очереди лотов.
   * @param {Object} trade
   * @param {Object[]} queue
   * @param {Object[]} sales
   * @param {Object[]} errors
   */
  applySale: function(trade, queue, sales, errors) {
    var remain = Number(trade.quantity) || 0;
    var sellPrice = Number(trade.price) || 0;

    while (remain > 0 && queue.length > 0) {
      var lot = queue[0];
      var quantity = Math.min(remain, lot.quantityLeft);
      var cost = lot.quantityLeft > 0
        ? lot.costLeft * quantity / lot.quantityLeft
        : 0;
      var proceeds = sellPrice * quantity;
      var profit = proceeds - cost;

      sales.push({
        ticker: trade.ticker,
        buyDate: lot.buyDate,
        sellDate: trade.tradeDate,
        quantity: quantity,
        buyPrice: lot.buyPrice,
        sellPrice: sellPrice,
        cost: cost,
        proceeds: proceeds,
        profit: profit,
        ndflBase: Math.max(0, profit),
        lotId: lot.lotId,
        buyTradeId: lot.tradeId,
        sellTradeId: trade.tradeId,
        accountName: trade.accountName || trade.accountId || "",
        accountId: trade.accountId,
        assetUid: trade.assetUid,
        figi: trade.figi,
        instrumentUid: trade.instrumentUid
      });

      lot.quantityLeft -= quantity;
      lot.costLeft -= cost;
      remain -= quantity;

      if (lot.quantityLeft <= 0.000000001) {
        queue.shift();
      }
    }

    if (remain > 0) {
      queue.push(this.createOpeningLot(trade, remain, sellPrice));
      this.applySale(trade, queue, sales, errors);
    }
  },

  /**
   * Синтетический стартовый лот для бумаги, которая была в портфеле
   * до даты начала загружаемой истории.
   * @param {Object} trade
   * @param {number} quantity
   * @param {number} price
   * @return {Object}
   */
  createOpeningLot: function(trade, quantity, price) {
    var startDate = TI.Settings.getStartDate();
    var lotId = "OPENING_BALANCE_" +
      this.instrumentKey(trade).replace(/[^A-Z0-9_|\-]/gi, "_") +
      "_" + String(trade.tradeId || "");

    return {
      ticker: trade.ticker,
      name: trade.name || "",
      buyDate: startDate,
      quantity: quantity,
      quantityLeft: quantity,
      buyPrice: price,
      costLeft: price * quantity,
      marketPrice: "",
      profit: "",
      ageDays: this.ageDays(startDate),
      lotId: lotId,
      tradeId: lotId,
      operationId: "OPENING_BALANCE",
      accountName: trade.accountName || trade.accountId || "",
      accountId: trade.accountId,
      instrumentType: trade.instrumentType || "",
      assetUid: trade.assetUid,
      figi: trade.figi,
      instrumentUid: trade.instrumentUid
    };
  },

  /**
   * Получить открытые лоты из очередей.
   * @param {Object} queues
   * @return {Object[]}
   */
  openLots: function(queues) {
    var lots = [];

    Object.keys(queues).forEach(function(key) {
      queues[key].forEach(function(lot) {
        if (lot.quantityLeft > 0.000000001) {
          lots.push(lot);
        }
      });
    });

    return lots;
  },

  /**
   * Записать объекты в лист по схеме.
   * @param {string} sheetName
   * @param {Object[]} items
   * @return {number}
   */
  writeObjects: function(sheetName, items) {
    var sheet = Schema.prepareSheet(sheetName);

    if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      ).clearContent();
    }

    if (!items || items.length === 0) {
      return 0;
    }

    var rows = items.map(function(item) {
      return Schema.buildRow(sheetName, item);
    });

    sheet.getRange(2, 1, rows.length, rows[0].length)
      .setValues(rows);

    return rows.length;
  },

  /**
   * Записать результаты FIFO.
   * @param {{lots:Object[], sales:Object[], errors:Object[]}} result
   */
  writeResults: function(result) {
    this.writeObjects(CORE.SHEETS.FIFO_LOTS, result.lots);
    this.writeObjects(CORE.SHEETS.FIFO_SALES, result.sales);
    this.writeObjects(CORE.SHEETS.FIFO_ERRORS, result.errors);
  },

  /**
   * Построить FIFO.
   * @return {{lots:Object[], sales:Object[], errors:Object[]}}
   */
  build: function() {
    var trades = TI.AccountScope.filterCalculationRows(
      TI.AccountScope.filterHistoryRows(this.readTrades())
    );
    var result = this.calculate(trades);

    this.writeResults(result);

    return result;
  }

};

/**
 * Построить FIFO.
 * @return {Object}
 */
function TI_BuildFIFO() {
  var result = TI.FIFO.build();

  SpreadsheetApp.getUi().alert(
    "FIFO построен.\n\n" +
    "Открытых лотов: " + result.lots.length + "\n" +
    "Продаж обработано: " + result.sales.length + "\n" +
    "Ошибок: " + result.errors.length
  );

  return result;
}

/**
 * Тест FIFO.
 * @return {Object}
 */
function TI_TestFIFO() {
  var result = TI.FIFO.build();

  Logger.log("Открытых лотов: " + result.lots.length);
  Logger.log("Продаж: " + result.sales.length);
  Logger.log("Ошибок: " + result.errors.length);

  return result;
}

