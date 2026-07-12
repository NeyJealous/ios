/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Income.gs
 * Версия: 1.0.0
 * Назначение:
 *   Построение листов дивидендов, купонов и денежных потоков.
 *
 * История изменений:
 *   1.0.0 - Первый расчет доходных операций и cashflow.
 * ============================================================
 */

var TI = TI || {};

TI.Income = {

  /**
   * Построить все доходные листы.
   * @return {{dividends:number, coupons:number, cashflow:number}}
   */
  rebuild: function() {
    var operations = TI.Operations.get();
    var dividends = this.writeDividends(operations);
    var coupons = this.writeCoupons(operations);
    var cashflow = this.writeCashflow(operations);

    return {
      dividends: dividends,
      coupons: coupons,
      cashflow: cashflow
    };
  },

  /**
   * Записать дивиденды.
   * @param {Object[]} operations
   * @return {number}
   */
  writeDividends: function(operations) {
    var rows = TI.Operations.dividends(operations).map(function(operation) {
      return TI.Income.incomeRow(operation);
    });

    return this.writeRows(CORE.SHEETS.DIVIDENDS, rows);
  },

  /**
   * Записать купоны.
   * @param {Object[]} operations
   * @return {number}
   */
  writeCoupons: function(operations) {
    var rows = TI.Operations.coupons(operations).map(function(operation) {
      return TI.Income.incomeRow(operation);
    });

    return this.writeRows(CORE.SHEETS.COUPONS, rows);
  },

  /**
   * Записать денежные потоки.
   * @param {Object[]} operations
   * @return {number}
   */
  writeCashflow: function(operations) {
    var rows = this.cashflowOperations(operations).map(function(operation) {
      return {
        date: operation.date,
        operationType: getOperationTitle(operation.type),
        amount: operation.payment,
        currency: operation.paymentCurrency,
        comment: TI.Income.operationComment(operation)
      };
    });

    return this.writeRows(CORE.SHEETS.CASHFLOW, rows);
  },

  /**
   * Операции, которые относятся к движению денег.
   * @param {Object[]} operations
   * @return {Object[]}
   */
  cashflowOperations: function(operations) {
    var groups = []
      .concat(CORE.OPERATION_GROUPS.DEPOSITS)
      .concat(CORE.OPERATION_GROUPS.WITHDRAWALS)
      .concat(CORE.OPERATION_GROUPS.DIVIDENDS)
      .concat(CORE.OPERATION_GROUPS.COUPONS)
      .concat(CORE.OPERATION_GROUPS.COMMISSIONS)
      .concat(CORE.OPERATION_GROUPS.TAXES);

    return TI.Operations.byTypes(groups, operations).filter(function(operation) {
      return operation.payment !== 0;
    });
  },

  /**
   * Строка доходной операции.
   * @param {Object} operation
   * @return {Object}
   */
  incomeRow: function(operation) {
    return {
      paymentDate: operation.date,
      ticker: operation.ticker,
      name: operation.name || operation.description || "",
      amount: operation.payment,
      currency: operation.paymentCurrency,
      tax: this.taxAmount(operation)
    };
  },

  /**
   * Налог, удержанный внутри операции.
   * @param {Object} operation
   * @return {number}
   */
  taxAmount: function(operation) {
    var tax = 0;
    var children = operation.childOperations || [];

    children.forEach(function(child) {
      var type = String(child.type || "");

      if (type.indexOf("TAX") === -1) {
        return;
      }

      tax += Math.abs(TI.Utils.money(child.payment));
    });

    if (CORE.OPERATION_GROUPS.TAXES.indexOf(operation.type) !== -1) {
      tax += Math.abs(operation.payment);
    }

    return tax;
  },

  /**
   * Комментарий к операции денежного потока.
   * @param {Object} operation
   * @return {string}
   */
  operationComment: function(operation) {
    var parts = [];

    if (operation.ticker) {
      parts.push(operation.ticker);
    }

    if (operation.name || operation.description) {
      parts.push(operation.name || operation.description);
    }

    return parts.join(" - ");
  },

  /**
   * Записать строки на лист.
   * @param {string} sheetName
   * @param {Object[]} rows
   * @return {number}
   */
  writeRows: function(sheetName, rows) {
    var sheet = Schema.prepareSheet(sheetName);

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
      return Schema.buildRow(sheetName, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

/**
 * Построить дивиденды, купоны и денежные потоки.
 * @return {{dividends:number, coupons:number, cashflow:number}}
 */
function TI_BuildIncome() {
  var stats = TI.Income.rebuild();

  SpreadsheetApp.getUi().alert(
    "Доходы и денежные потоки построены.\n\n" +
    "Дивидендов: " + stats.dividends + "\n" +
    "Купонов: " + stats.coupons + "\n" +
    "Денежных потоков: " + stats.cashflow
  );

  return stats;
}
