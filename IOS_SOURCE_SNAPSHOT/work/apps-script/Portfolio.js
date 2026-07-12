/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Portfolio.gs
 * Версия: 1.0.0
 * Назначение:
 *   Сбор и запись текущего портфеля по открытым лотам FIFO.
 *
 * История изменений:
 *   1.0.0 - Первая версия расчёта портфеля поверх FIFO.
 * ============================================================
 */

var TI = TI || {};

TI.Portfolio = {

  SHEET: CORE.SHEETS.PORTFOLIO,

  /**
   * Подготовить лист портфеля.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить портфель на основе открытых лотов FIFO.
   * @return {Object[]}
   */
  build: function() {
    var trades = TI.Trades.toObjects(TI.Operations.trades(TI.Operations.get()));
    var fifo = TI.FIFO.calculate(trades);
    var rows = this.aggregateLots(fifo.lots);

    this.enrichMetadata(rows);

    return this.applyPrices(rows);
  },

  /**
   * Сгруппировать открытые лоты в позиции портфеля.
   * @param {Object[]} lots
   * @return {Object[]}
   */
  aggregateLots: function(lots) {
    var map = {};
    var result = [];
    var accountNames = this.accountNamesById();

    lots.forEach(function(lot) {
      var accountId = String(lot.accountId || "").trim();
      var key = accountId + "|" + TI.FIFO.instrumentKey(lot);

      if (!map[key]) {
        map[key] = {
          accountName: lot.accountName || accountNames[accountId] || accountId || "",
          accountId: accountId,
          ticker: lot.ticker || "",
          name: lot.name || "",
          quantity: 0,
          cost: 0,
          instrumentType: lot.instrumentType || "",
          assetUid: lot.assetUid || "",
          figi: lot.figi || "",
          instrumentUid: lot.instrumentUid || ""
        };
      }

      map[key].quantity += Number(lot.quantityLeft) || 0;
      map[key].cost += Number(lot.costLeft) || 0;

      if (!map[key].name && lot.name) {
        map[key].name = lot.name;
      }

      if (!map[key].accountName) {
        map[key].accountName = lot.accountName ||
          accountNames[accountId] ||
          accountId ||
          "";
      }

      if (!map[key].instrumentType && lot.instrumentType) {
        map[key].instrumentType = lot.instrumentType;
      }

      if (!map[key].assetUid && lot.assetUid) {
        map[key].assetUid = lot.assetUid;
      }

      if (!map[key].figi && lot.figi) {
        map[key].figi = lot.figi;
      }

      if (!map[key].instrumentUid && lot.instrumentUid) {
        map[key].instrumentUid = lot.instrumentUid;
      }
    });

    Object.keys(map).forEach(function(key) {
      var item = map[key];
      var quantity = item.quantity;
      var cost = item.cost;
      var averagePrice = quantity > 0 ? cost / quantity : 0;
      var marketValue = cost;
      var profit = 0;
      var profitPercent = 0;

      result.push({
        accountName: item.accountName,
        ticker: item.ticker,
        name: item.name,
        instrumentType: item.instrumentType || "",
        sector: "",
        issuer: "",
        quantity: quantity,
        averagePrice: averagePrice,
        currentPrice: "",
        lot: 1,
        marketValue: marketValue,
        cost: cost,
        profit: profit,
        profitPercent: profitPercent,
        portfolioShare: 0,
        accountId: item.accountId,
        assetUid: item.assetUid,
        figi: item.figi,
        instrumentUid: item.instrumentUid
      });
    });

    var totalMarketValue = result.reduce(function(sum, row) {
      return sum + (Number(row.marketValue) || 0);
    }, 0);

    result.forEach(function(row) {
      row.portfolioShare = totalMarketValue > 0
        ? (Number(row.marketValue) || 0) / totalMarketValue
        : 0;
    });

    return result.sort(function(a, b) {
      var accountCompare = String(a.accountName || "")
        .localeCompare(String(b.accountName || ""));

      if (accountCompare !== 0) {
        return accountCompare;
      }

      return String(a.ticker).localeCompare(String(b.ticker));
    });
  },

  /**
   * Получить названия счетов по ID, если API доступен.
   * @return {Object}
   */
  accountNamesById: function() {
    try {
      return TI.Accounts.nameMap();
    } catch (e) {
      Logger.log(e);
      return {};
    }
  },

  /**
   * Дополнить позиции типом инструмента, отраслью и эмитентом из справочника.
   * @param {Object[]} rows
   */
  enrichMetadata: function(rows) {
    var directory = this.readDirectoryMetadata();

    rows.forEach(function(row) {
      var meta =
        directory[row.instrumentUid] ||
        directory[row.assetUid] ||
        directory[row.figi] ||
        directory[String(row.ticker || "").toUpperCase()];

      if (!meta) {
        return;
      }

      row.instrumentType = meta.instrumentType || row.instrumentType || "";
      row.sector = meta.sector || row.sector || "";
      row.issuer = meta.issuer || row.issuer || "";
      row.name = row.name || meta.name || "";
      row.currentPrice = meta.lastPrice || row.currentPrice || "";
      row.lot = meta.lot || row.lot || 1;
    });
  },

  /**
   * Прочитать справочник инструментов.
   * @return {Object}
   */
  readDirectoryMetadata: function() {
    var sheet = Schema.prepareSheet(CORE.SHEETS.DIRECTORY);
    var values = sheet.getDataRange().getValues();
    var map = {};

    if (values.length <= 1) {
      return map;
    }

    var headers = values.shift();
    var fieldsByTitle = TI.FIFO.fieldsByTitle(CORE.SHEETS.DIRECTORY);

    values.forEach(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      var meta = {
        ticker: String(item.ticker || "").trim().toUpperCase(),
        name: item.name || "",
        instrumentType: item.instrumentType || "",
        sector: item.sector || "",
        issuer: item.issuer || "",
        lastPrice: TI.Utils.number(item.lastPrice),
        lot: Math.max(1, TI.Utils.number(item.lot)),
        figi: item.figi || "",
        assetUid: item.assetUid || "",
        instrumentUid: item.instrumentUid || ""
      };

      [
        meta.instrumentUid,
        meta.assetUid,
        meta.figi,
        meta.ticker
      ].forEach(function(key) {
        key = String(key || "").trim();

        if (key) {
          map[key] = meta;
        }
      });
    });

    return map;
  },

  /**
   * Применить рыночные цены к позициям.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  applyPrices: function(rows) {
    var prices = {};

    try {
      prices = TI.Prices.mapForPositions(rows);
    } catch (e) {
      Logger.log(e);
      this.recalculateShares(rows);
      return rows;
    }

    rows.forEach(function(row) {
      var currentPrice =
        Number(row.currentPrice) ||
        prices[row.instrumentUid] ||
        prices[row.figi] ||
        0;

      if (!currentPrice) {
        return;
      }

      row.currentPrice = currentPrice;
      row.marketValue = currentPrice * row.quantity;
      row.profit = row.marketValue - row.cost;
      row.profitPercent = row.cost > 0 ? row.profit / row.cost : 0;
    });

    this.recalculateShares(rows);

    return rows;
  },

  /**
   * Пересчитать доли портфеля.
   * @param {Object[]} rows
   */
  recalculateShares: function(rows) {
    var totalMarketValue = rows.reduce(function(sum, row) {
      return sum + (Number(row.marketValue) || 0);
    }, 0);

    rows.forEach(function(row) {
      row.portfolioShare = totalMarketValue > 0
        ? (Number(row.marketValue) || 0) / totalMarketValue
        : 0;
    });
  },

  /**
   * Записать позиции в лист.
   * @param {Object[]} rows
   * @return {number}
   */
  write: function(rows) {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      ).clearContent();
    }

    if (!rows || rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.PORTFOLIO, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Пересчитать портфель и вернуть количество строк.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  },

  /**
   * Проверка модуля.
   * @return {Object[]}
   */
  test: function() {
    return this.build();
  }

};

/**
 * Построить портфель.
 * @return {number}
 */
function TI_BuildPortfolio() {
  var rows = TI.Portfolio.rebuild();

  SpreadsheetApp.getUi().alert(
    "Портфель построен.\n\n" +
    "Строк: " + rows
  );

  return rows;
}

/**
 * Проверка портфеля.
 * @return {Object[]}
 */
function TI_TestPortfolio() {
  var rows = TI.Portfolio.test();

  Logger.log(JSON.stringify(rows, null, 2));

  SpreadsheetApp.getUi().alert(
    "Портфель рассчитан.\n\n" +
    "Позиции: " + rows.length
  );

  return rows;
}

