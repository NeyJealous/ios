/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Tax.gs
 * Версия: 1.0.0
 * Назначение:
 *   Расчет налоговой базы по закрытым FIFO-продажам.
 *
 * История изменений:
 *   1.0.0 - Первая версия расчета НДФЛ по годам.
 * ============================================================
 */

var TI = TI || {};

TI.Tax = {

  SHEET: CORE.SHEETS.TAX,

  /**
   * Подготовить лист налогов.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить налоговый расчет на основе FIFO.
   * @return {Object[]}
   */
  build: function() {
    var sales = TI.AccountScope.filterCalculationRows(TI.Data.fifoSales());

    if (sales.length === 0) {
      sales = TI.FIFO.calculate(TI.AccountScope.filterCalculationRows(TI.Data.trades())).sales;
    }

    return this.aggregateSales(sales);
  },

  /**
   * Сгруппировать продажи по налоговым годам.
   * @param {Object[]} sales
   * @return {Object[]}
   */
  aggregateSales: function(sales) {
    var map = {};
    var rate = TI.Settings.getTaxRate();

    sales.forEach(function(sale) {
      var year = TI.Tax.yearOf(sale.sellDate);

      if (!year) {
        return;
      }

      if (!map[year]) {
        map[year] = {
          year: year,
          taxBase: 0,
          taxRate: rate,
          taxAmount: 0,
          inflation: TI.Inflation.getRateForYear(year)
        };
      }

      map[year].taxBase += Math.max(0, Number(sale.ndflBase) || 0);
    });

    return Object.keys(map).sort().map(function(year) {
      var row = map[year];
      row.taxAmount = row.taxBase * row.taxRate;
      return row;
    });
  },

  /**
   * Получить год из даты.
   * @param {Date|string} value
   * @return {number}
   */
  yearOf: function(value) {
    if (!value) {
      return 0;
    }

    var date = new Date(value);

    if (isNaN(date.getTime())) {
      return 0;
    }

    return date.getFullYear();
  },

  /**
   * Записать расчет в лист.
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
      return Schema.buildRow(CORE.SHEETS.TAX, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Пересчитать налоги и вернуть количество строк.
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
 * Рассчитать налоги.
 * @return {number}
 */
function TI_BuildTax() {
  var rows = TI.Tax.rebuild();

  SpreadsheetApp.getUi().alert(
    "Налоги рассчитаны.\n\n" +
    "Строк: " + rows
  );

  return rows;
}

/**
 * Проверка налогового модуля.
 * @return {Object[]}
 */
function TI_TestTax() {
  var rows = TI.Tax.test();

  Logger.log(JSON.stringify(rows, null, 2));

  SpreadsheetApp.getUi().alert(
    "Налоговый расчет выполнен.\n\n" +
    "Периодов: " + rows.length
  );

  return rows;
}

