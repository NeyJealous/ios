/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Main.gs
 * Версия: 1.0.0
 * Назначение:
 *   Сводная панель состояния проекта на листе "Главная".
 *
 * История изменений:
 *   1.0.0 - Первые KPI по портфелю, доходам, налогам, диагностике и советнику.
 * ============================================================
 */

var TI = TI || {};

TI.Main = {

  SHEET: CORE.SHEETS.MAIN,

  STATUS: Object.freeze({
    OK: "OK",
    WARNING: "Внимание",
    ERROR: "Ошибка"
  }),

  /**
   * Подготовить лист.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить строки главной панели.
   * @return {Object[]}
   */
  build: function() {
    var portfolio = TI.Data.portfolio();
    var taxes = TI.Data.taxes();
    var diagnostics = TI.Data.diagnostics();
    var advisor = TI.Data.advisor();

    var income = this.incomeCounts();
    var totalMarketValue = this.sum(portfolio, "marketValue");
    var totalCost = this.sum(portfolio, "cost");
    var totalProfit = totalMarketValue - totalCost;
    var diagnosticsStats = this.statusCounts(diagnostics);
    var advisorStats = this.priorityCounts(advisor);
    var strategyTargets = TI.Constitution.targets();
    var strategyActual = TI.Constitution.actual(portfolio);
    var marketRegime = TI.MarketRegime.current();
    var reserveStatus = TI.Constitution.reserveStatus(portfolio);
    var saleCheckCount = TI.CompanyRating.saleCheckRows().length;
    var coi = TI.COI.current();
    var bestAccount = TI.PortfolioIntelligence.bestAccount();
    var bestStrategy = TI.PortfolioIntelligence.bestStrategy();
    var rows = [];

    rows.push(this.row(
      "Стратегия",
      "Режим рынка",
      marketRegime.status,
      Number(marketRegime.multiplier) > 1 ? this.STATUS.WARNING : this.STATUS.OK,
      "Множитель покупки акций: " + marketRegime.multiplier + "."
    ));

    rows.push(this.row(
      "Стратегия",
      "Индекс возможностей",
      String(coi.score || coi.value || 0),
      Number(coi.score || coi.value) >= 70 ? this.STATUS.WARNING : this.STATUS.OK,
      (coi.status || "Обычный режим") + "."
    ));

    rows.push(this.row(
      "Счета",
      "Лучший счет для пополнения",
      bestAccount ? bestAccount.scopeName : "Не рассчитано",
      bestAccount ? this.STATUS.OK : this.STATUS.WARNING,
      bestAccount ? "Оценка: " + bestAccount.score + " из 100." : "Запустите Рассчитать интеллект портфеля."
    ));

    rows.push(this.row(
      "Счета",
      "Лучшая стратегия для пополнения",
      bestStrategy ? bestStrategy.scopeName : "Не рассчитано",
      bestStrategy ? this.STATUS.OK : this.STATUS.WARNING,
      bestStrategy ? "Оценка: " + bestStrategy.score + " из 100." : "Запустите Рассчитать интеллект портфеля."
    ));

    rows.push(this.row(
      "Стратегия",
      "Целевая доля акций",
      this.formatPercent(strategyTargets.stocks),
      this.STATUS.OK,
      "Рассчитано по инвестиционной конституции."
    ));

    rows.push(this.row(
      "Стратегия",
      "Целевая доля облигаций",
      this.formatPercent(strategyTargets.bonds),
      this.STATUS.OK,
      "Учитывает возраст инвестора и ключевую ставку."
    ));

    rows.push(this.row(
      "Стратегия",
      "Целевая доля резерва",
      this.formatPercent(strategyTargets.reserve),
      this.STATUS.OK,
      "Свободные деньги считаются стратегическим резервом."
    ));

    rows.push(this.row(
      "Стратегия",
      "Фактическая доля акций",
      this.formatPercent(strategyActual.stocksShare),
      this.STATUS.OK,
      "По текущему портфелю и свободным деньгам."
    ));

    rows.push(this.row(
      "Стратегия",
      "Фактическая доля облигаций",
      this.formatPercent(strategyActual.bondsShare),
      this.STATUS.OK,
      "По текущему портфелю и свободным деньгам."
    ));

    rows.push(this.row(
      "Стратегия",
      "Фактическая доля резерва",
      this.formatPercent(strategyActual.reserveShare),
      reserveStatus.status === "В норме" ? this.STATUS.OK : this.STATUS.WARNING,
      reserveStatus.message + "."
    ));

    rows.push(this.row(
      "Стратегия",
      "Количество бумаг на проверку продажи",
      String(saleCheckCount),
      saleCheckCount > 0 ? this.STATUS.WARNING : this.STATUS.OK,
      "По листу Рейтинг компаний."
    ));

    rows.push(this.row(
      "Стратегия",
      "Статус резерва",
      reserveStatus.status,
      reserveStatus.status === "В норме" ? this.STATUS.OK : this.STATUS.WARNING,
      reserveStatus.message + "."
    ));

    rows.push(this.row(
      "Проект",
      "Состояние",
      diagnosticsStats.errors > 0
        ? "Есть ошибки"
        : diagnosticsStats.warnings > 0
          ? "Есть предупреждения"
          : "В норме",
      diagnosticsStats.errors > 0
        ? this.STATUS.ERROR
        : diagnosticsStats.warnings > 0
          ? this.STATUS.WARNING
          : this.STATUS.OK,
      "Ошибок: " + diagnosticsStats.errors +
        ", предупреждений: " + diagnosticsStats.warnings + "."
    ));

    rows.push(this.row(
      "Портфель",
      "Рыночная стоимость",
      this.formatMoney(totalMarketValue),
      portfolio.length > 0 ? this.STATUS.OK : this.STATUS.WARNING,
      portfolio.length > 0
        ? "Позиций: " + portfolio.length + "."
        : "Портфель не пересчитан. Запустите пакетную синхронизацию."
    ));

    rows.push(this.row(
      "Портфель",
      "Прибыль / убыток",
      this.formatMoney(totalProfit),
      totalProfit >= 0 ? this.STATUS.OK : this.STATUS.WARNING,
      "Доходность: " + this.formatPercent(totalCost > 0 ? totalProfit / totalCost : 0) + "."
    ));

    rows.push(this.row(
      "Доходы",
      "Дивиденды и купоны",
      "Дивиденды: " + income.dividends + ", купоны: " + income.coupons,
      this.STATUS.OK,
      "Денежных потоков: " + income.cashflow + "."
    ));

    rows.push(this.row(
      "Налоги",
      "Расчётные строки",
      String(taxes.length),
      taxes.length > 0 ? this.STATUS.OK : this.STATUS.WARNING,
      taxes.length > 0
        ? "Налоговая база рассчитана по закрытым FIFO-продажам."
        : "Нет закрытых продаж, налоговой базы или лист Налоги ещё не построен."
    ));

    rows.push(this.row(
      "Советник",
      "Рекомендации",
      String(advisor.length),
      advisorStats.high > 0
        ? this.STATUS.ERROR
        : advisorStats.medium > 0
          ? this.STATUS.WARNING
          : this.STATUS.OK,
      "Высокий приоритет: " + advisorStats.high +
        ", средний: " + advisorStats.medium + "."
    ));

    rows.push(this.row(
      "Обновление",
      "Дата и время",
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "dd.MM.yyyy HH:mm"
      ),
      this.STATUS.OK,
      "Главная панель обновлена."
    ));

    return rows;
  },

  /**
   * Сумма поля.
   * @param {Object[]} rows
   * @param {string} field
   * @return {number}
   */
  sum: function(rows, field) {
    return rows.reduce(function(total, row) {
      return total + (Number(row[field]) || 0);
    }, 0);
  },

  /**
   * Подсчитать статусы диагностики.
   * @param {Object[]} rows
   * @return {{errors:number,warnings:number,ok:number}}
   */
  statusCounts: function(rows) {
    return rows.reduce(function(acc, row) {
      if (row.status === "Ошибка") acc.errors++;
      else if (row.status === "Внимание") acc.warnings++;
      else acc.ok++;
      return acc;
    }, {
      errors: 0,
      warnings: 0,
      ok: 0
    });
  },

  /**
   * Подсчитать приоритеты советника.
   * @param {Object[]} rows
   * @return {{high:number,medium:number,low:number}}
   */
  priorityCounts: function(rows) {
    return rows.reduce(function(acc, row) {
      if (row.priority === "Высокий") acc.high++;
      else if (row.priority === "Средний") acc.medium++;
      else acc.low++;
      return acc;
    }, {
      high: 0,
      medium: 0,
      low: 0
    });
  },

  /**
   * Количество строк доходных листов.
   * @return {{dividends:number,coupons:number,cashflow:number}}
   */
  incomeCounts: function() {
    return {
      dividends: this.dataRowsCount(CORE.SHEETS.DIVIDENDS),
      coupons: this.dataRowsCount(CORE.SHEETS.COUPONS),
      cashflow: this.dataRowsCount(CORE.SHEETS.CASHFLOW)
    };
  },

  /**
   * Количество строк данных на листе.
   * @param {string} sheetName
   * @return {number}
   */
  dataRowsCount: function(sheetName) {
    var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);

    if (!sheet) {
      return 0;
    }

    return Math.max(0, sheet.getLastRow() - 1);
  },

  /**
   * Формат суммы.
   * @param {number} value
   * @return {string}
   */
  formatMoney: function(value) {
    return Utilities.formatString("%.2f RUB", Number(value) || 0);
  },

  /**
   * Формат процента.
   * @param {number} value
   * @return {string}
   */
  formatPercent: function(value) {
    return Utilities.formatString("%.2f%%", (Number(value) || 0) * 100);
  },

  /**
   * Строка панели.
   */
  row: function(section, metric, value, status, comment) {
    return {
      section: section,
      metric: metric,
      value: value,
      status: status,
      comment: comment || "",
      updatedAt: new Date()
    };
  },

  /**
   * Записать главную панель.
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
      return Schema.buildRow(CORE.SHEETS.MAIN, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    if (TI.UI && TI.UI.applyDashboard) {
      TI.UI.applyDashboard();
    }

    return values.length;
  },

  /**
   * Пересчитать главную панель.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  }

};

/**
 * Обновить главную панель.
 * @return {number}
 */
function TI_UpdateMain() {
  var rows = TI.Main.rebuild();

  SpreadsheetApp.getUi().alert(
    "Главная обновлена.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
