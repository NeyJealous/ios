/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: MarketRegime.gs
 * Версия: 1.1.0
 * Назначение:
 *   Расчет режима рынка и множителя покупок.
 * ============================================================
 */

var TI = TI || {};

TI.MarketRegime = {

  SHEET: CORE.SHEETS.MARKET_REGIME,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  calculate: function() {
    var config = TI.Constitution.read();
    var drawdown = this.drawdownValue(config.marketFromHigh);
    var multiplier = 1;
    var status = "Обычный рынок";
    var reservePlan = "Резерв не используется";

    if (drawdown >= 0.5) {
      multiplier = 4;
      status = "Просадка от 50%";
      reservePlan = "Можно использовать максимум резерва по плану";
    } else if (drawdown >= 0.4) {
      multiplier = 3;
      status = "Просадка от 40%";
      reservePlan = "Можно использовать значительную часть резерва";
    } else if (drawdown >= 0.3) {
      multiplier = 2;
      status = "Просадка от 30%";
      reservePlan = "Можно использовать часть резерва";
    } else if (drawdown >= 0.2) {
      multiplier = 1.5;
      status = "Просадка от 20%";
      reservePlan = "Усилить покупки акций без обязательного расходования резерва";
    }

    return {
      status: status,
      drawdown: drawdown,
      multiplier: multiplier,
      reservePlan: reservePlan,
      keyRate: config.keyRate,
      updatedAt: new Date()
    };
  },

  drawdownValue: function(value) {
    value = Number(value) || 0;

    if (value < 0) {
      return Math.min(1, Math.abs(value));
    }

    if (value > 0.5 && value <= 1) {
      return Math.min(1, 1 - value);
    }

    return Math.min(1, value);
  },

  build: function() {
    var regime = this.calculate();
    var rows = [
      this.row("Режим рынка", regime.status, regime.status, "Определяется по просадке индекса от максимума."),
      this.row("Индекс рынка от максимума", TI.Constitution.formatPercent(-regime.drawdown), regime.status, "Можно вводить как -20%, 20% просадки или 80% от максимума."),
      this.row("Множитель покупки акций", String(regime.multiplier), regime.status, "Используется для приоритета новых покупок."),
      this.row("Использование резерва", regime.reservePlan, regime.status, "Продажи автоматически не выполняются."),
      this.row("Ключевая ставка", TI.Constitution.formatPercent(regime.keyRate), regime.status, "Влияет на целевую долю облигаций.")
    ];

    this.write(rows);
    return rows;
  },

  current: function() {
    return this.calculate();
  },

  row: function(metric, value, status, comment) {
    return {
      metric: metric,
      value: value,
      status: status,
      comment: comment || "",
      updatedAt: new Date()
    };
  },

  write: function(rows) {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.MARKET_REGIME, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return rows.length;
  }

};

function TI_BuildMarketRegime() {
  var rows = TI.MarketRegime.build().length;

  SpreadsheetApp.getUi().alert(
    "Режим рынка рассчитан.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
