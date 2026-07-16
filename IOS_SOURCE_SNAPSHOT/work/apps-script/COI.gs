/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: COI.gs
 * Версия: 2.0.0
 * Назначение:
 *   Composite Opportunity Index — индекс возможностей для новых покупок.
 * ============================================================
 */

var TI = TI || {};

TI.COI = {

  SHEET: CORE.SHEETS.COI,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var now = new Date();
    var regime = TI.MarketRegime.current();
    var reserve = TI.Constitution.reserveStatus(
      TI.AccountScope.filterCalculationRows(TI.Data.portfolio())
    );
    var bonds = TI.BondEngine.read();
    var assets = TI.AssetScoring.read();
    var rows = this.components(regime, reserve, bonds, assets, now);
    var total = this.totalScore(rows);

    rows.unshift({
      component: "Итоговый индекс",
      value: total,
      score: total,
      status: this.status(total),
      explanation: "Индекс помогает выбрать приоритет новых покупок. Он не является прогнозом рынка и не запускает автоматические продажи.",
      updatedAt: now
    });

    this.write(rows);
    return rows;
  },

  components: function(regime, reserve, bonds, assets, now) {
    var drawdown = Math.abs(Number(regime.drawdown) || 0);
    var multiplier = Number(regime.multiplier) || 1;
    var keyRate = Number(regime.keyRate) || 0;
    var bondAverage = this.averageScore(bonds);
    var assetAverage = this.averageScore(assets);
    var reservePenalty = reserve.status === "В норме" ? 0 : -20;

    return [
      {
        component: "Падение рынка",
        value: TI.Constitution.formatPercent(drawdown),
        score: drawdown >= 0.5 ? 35 : (drawdown >= 0.4 ? 28 : (drawdown >= 0.3 ? 22 : (drawdown >= 0.2 ? 15 : 5))),
        status: multiplier > 1 ? "Усилить покупки акций по плану" : "Обычный режим",
        explanation: "Множитель покупки акций: " + multiplier + ".",
        updatedAt: now
      },
      {
        component: "Ключевая ставка",
        value: TI.Constitution.formatPercent(keyRate),
        score: keyRate >= 0.18 ? 25 : (keyRate >= 0.15 ? 20 : (keyRate >= 0.12 ? 14 : (keyRate >= 0.1 ? 8 : 3))),
        status: keyRate >= 0.15 ? "Повышенный приоритет облигаций" : "Без усиления облигаций",
        explanation: "Высокая ставка повышает привлекательность облигационной части для новых денег.",
        updatedAt: now
      },
      {
        component: "Резерв",
        value: reserve.status,
        score: reservePenalty,
        status: reserve.status,
        explanation: reserve.message || "Резерв в норме.",
        updatedAt: now
      },
      {
        component: "Оценка облигаций",
        value: bondAverage,
        score: Math.round(bondAverage / 4),
        status: bondAverage >= 70 ? "Есть облигационные кандидаты" : "Требуется проверка облигаций",
        explanation: "Средняя оценка анализа облигаций по доступным облигациям.",
        updatedAt: now
      },
      {
        component: "Качество активов",
        value: assetAverage,
        score: Math.round(assetAverage / 8),
        status: assetAverage >= 70 ? "Есть качественные идеи" : "Нужно заполнить оценки",
        explanation: "Средняя единая оценка активов по справочнику.",
        updatedAt: now
      }
    ];
  },

  totalScore: function(rows) {
    var sum = rows.reduce(function(total, row) {
      return total + (Number(row.score) || 0);
    }, 0);

    return Math.max(0, Math.min(100, Math.round(sum)));
  },

  averageScore: function(rows) {
    var values = (rows || []).map(function(row) {
      return Number(row.score) || 0;
    }).filter(function(score) {
      return score > 0;
    });

    if (values.length === 0) {
      return 0;
    }

    return Math.round(values.reduce(function(sum, score) {
      return sum + score;
    }, 0) / values.length);
  },

  status: function(score) {
    if (score >= 70) return "Высокая возможность";
    if (score >= 40) return "Умеренная возможность";
    return "Обычный режим";
  },

  current: function() {
    var rows = this.read();

    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].component || "") === "Итоговый индекс") {
        return rows[i];
      }
    }

    return {
      component: "Итоговый индекс",
      value: 0,
      score: 0,
      status: "Обычный режим",
      explanation: "Индекс возможностей ещё не рассчитан."
    };
  },

  read: function() {
    return TI.Data.sheetObjects(this.SHEET);
  },

  write: function(rows) {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    if (!rows || rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.COI, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

function TI_BuildCOI() {
  var rows = TI.COI.build().length;

  SpreadsheetApp.getUi().alert(
    "Индекс возможностей рассчитан.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
