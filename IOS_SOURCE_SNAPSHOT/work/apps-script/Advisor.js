/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Advisor.gs
 * Версия: 1.0.0
 * Назначение:
 *   Формирование практических рекомендаций по портфелю.
 *
 * История изменений:
 *   1.0.0 - Первый советник на базе портфеля, стратегии и ребалансировки.
 * ============================================================
 */

var TI = TI || {};

TI.Advisor = {

  SHEET: CORE.SHEETS.ADVISOR,

  PRIORITY: Object.freeze({
    HIGH: "Высокий",
    MEDIUM: "Средний",
    LOW: "Низкий"
  }),

  CATEGORY: Object.freeze({
    STRATEGY: "Стратегия",
    REBALANCE: "Ребалансировка",
    DIRECTORY: "Справочник",
    RISK: "Риск",
    TAX: "Налоги"
  }),

  /**
   * Подготовить лист советника.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить рекомендации.
   * @return {Object[]}
   */
  build: function() {
    var portfolio = TI.Data.portfolio();

    if (portfolio.length === 0) {
      portfolio = TI.Portfolio.build();
    }

    var targets = TI.Rebalance.readTargets();
    var rebalance = TI.Rebalance.calculate(portfolio, targets);
    var tradePlan = TI.TradePlan.fromRebalance(rebalance, portfolio);
    var taxes = TI.Data.taxes();

    if (taxes.length === 0) {
      taxes = TI.Tax.build();
    }

    var recommendations = [];

    recommendations = recommendations
      .concat(this.constitutionRecommendations(portfolio))
      .concat(this.marketRegimeRecommendations())
      .concat(this.companyRatingRecommendations())
      .concat(this.strategyRecommendations(targets))
      .concat(this.directoryRecommendations(portfolio))
      .concat(this.rebalanceRecommendations(rebalance))
      .concat(this.tradePlanRecommendations(tradePlan))
      .concat(this.riskRecommendations(portfolio))
      .concat(this.taxRecommendations(taxes));

    if (recommendations.length === 0) {
      recommendations.push(this.okRecommendation());
    }

    return this.sort(recommendations);
  },

  /**
   * Рекомендации по инвестиционной конституции и резерву.
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  constitutionRecommendations: function(portfolio) {
    var targets = TI.Constitution.targets();
    var reserve = TI.Constitution.reserveStatus(portfolio);
    var rows = [{
      priority: this.PRIORITY.LOW,
      category: "Стратегия",
      recommendation: "Целевые доли: акции " +
        TI.Constitution.formatPercent(targets.stocks) +
        ", облигации " + TI.Constitution.formatPercent(targets.bonds) +
        ", резерв " + TI.Constitution.formatPercent(targets.reserve) + ".",
      reason: "Рассчитано по возрасту инвестора, целевой доле резерва и ключевой ставке.",
      effect: "Новые покупки получают приоритет в сторону недовесов стратегии."
    }];

    if (reserve.status !== "В норме") {
      rows.push({
        priority: reserve.priority === "Высокий" ? this.PRIORITY.HIGH : this.PRIORITY.MEDIUM,
        category: "Резерв",
        recommendation: reserve.message + ".",
        reason: "Фактический резерв ниже целевого уровня или включен режим восстановления.",
        effect: "Новые пополнения сначала направляются в свободные деньги."
      });
    }

    return rows;
  },

  /**
   * Рекомендации по режиму рынка.
   * @return {Object[]}
   */
  marketRegimeRecommendations: function() {
    var regime = TI.MarketRegime.current();

    return [{
      priority: Number(regime.multiplier) > 1 ? this.PRIORITY.MEDIUM : this.PRIORITY.LOW,
      category: "Режим рынка",
      recommendation: regime.status + ".",
      reason: "Множитель покупки акций: " + regime.multiplier +
        ". " + regime.reservePlan + ".",
      effect: "Режим влияет на приоритет новых покупок, но не запускает автоматические продажи."
    }];
  },

  /**
   * Рекомендации по рейтингу компаний.
   * @return {Object[]}
   */
  companyRatingRecommendations: function() {
    var recommendations = TI.CompanyRating.saleCheckRows().map(function(row) {
      return {
        priority: TI.Advisor.PRIORITY.HIGH,
        category: "Проверка продажи",
        recommendation: "Проверить инвестиционный тезис по " + row.ticker + ".",
        reason: "Рейтинг " + (row.totalRating || 0) + ": " + row.decision + ".",
        effect: "Решение о продаже принимается вручную, без автоматического исполнения."
      };
    });

    var incomplete = TI.CompanyRating.incompleteRows();

    if (incomplete.length > 0) {
      recommendations.push({
        priority: TI.Advisor.PRIORITY.MEDIUM,
        category: "Покупки",
        recommendation: "Заполнить ручной рейтинг компаний.",
        reason: "Без оценки пока не заполнены: " +
          incomplete.slice(0, 10).map(function(row) { return row.ticker; }).join(", ") +
          (incomplete.length > 10 ? " и ещё " + (incomplete.length - 10) : "") + ".",
        effect: "План сделок сможет учитывать качество идей, а не только целевые доли."
      });
    }

    return recommendations;
  },

  /**
   * Рекомендации по заполнению стратегии.
   * @param {Object[]} targets
   * @return {Object[]}
   */
  strategyRecommendations: function(targets) {
    if (targets.length > 0) {
      return [];
    }

    return [{
      priority: this.PRIORITY.HIGH,
      category: this.CATEGORY.STRATEGY,
      recommendation: "Заполнить целевые доли в листе Инвестиционная стратегия.",
      reason: "Без целевых долей система не может оценить соответствие портфеля плану.",
      effect: "Появятся рекомендации по ребалансировке."
    }];
  },

  /**
   * Рекомендации по справочнику.
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  directoryRecommendations: function(portfolio) {
    var missing = portfolio.filter(function(position) {
      return !position.instrumentType || !position.sector || !position.issuer;
    });

    if (missing.length === 0) {
      return [];
    }

    return [{
      priority: this.PRIORITY.MEDIUM,
      category: this.CATEGORY.DIRECTORY,
      recommendation: "Дополнить тип инструмента, отрасль и эмитента в справочнике.",
      reason: "Не хватает данных по позициям: " + this.tickersText(missing) + ".",
      effect: "Групповая стратегия по типам, отраслям и эмитентам станет точнее."
    }];
  },

  /**
   * Рекомендации по ребалансировке.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  rebalanceRecommendations: function(rows) {
    var threshold = TI.Settings.getRebalanceThreshold();

    return rows.filter(function(row) {
      return Math.abs(Number(row.deviation) || 0) > threshold;
    }).map(function(row) {
      var deviation = Math.abs(Number(row.deviation) || 0);

      return {
        priority: deviation >= threshold * 2
          ? TI.Advisor.PRIORITY.HIGH
          : TI.Advisor.PRIORITY.MEDIUM,
        category: TI.Advisor.CATEGORY.REBALANCE,
        recommendation: row.action,
        reason: row.targetKind + " " + row.targetName +
          ": цель " + TI.Advisor.formatPercent(row.targetShare) +
          ", факт " + TI.Advisor.formatPercent(row.actualShare) + ".",
        effect: "Снижение отклонения от инвестиционной стратегии."
      };
    });
  },

  /**
   * Recommendations based on the executable trade plan.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  tradePlanRecommendations: function(rows) {
    var recommendations = [];

    (rows || []).forEach(function(row) {
      var status = String(row.status || "").trim();
      var ticker = String(row.ticker || "").trim();
      var action = String(row.action || "").trim();
      var amount = Number(row.amount) || 0;
      var target = row.targetKind + " " + row.targetName;

      if (status === "Проверить продажу") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.HIGH,
          category: "Проверка продажи",
          recommendation: "Проверить продажу " + (ticker || row.targetName) + ".",
          reason: row.reason || row.comment || "Бумага получила сигнал проверки по рейтингу или тезису.",
          effect: "Продажа не выполняется автоматически."
        });
        return;
      }

      if (action === "Не покупать") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.MEDIUM,
          category: "Покупки",
          recommendation: "Не докупать " + (ticker || row.targetName) + ".",
          reason: row.reason || row.comment || "Покупка ограничена стратегией.",
          effect: "Снижается риск концентрации или покупки слабой идеи."
        });
        return;
      }

      if (status === "Пониженный приоритет") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.MEDIUM,
          category: "Резерв",
          recommendation: "Понизить приоритет покупки " + (ticker || row.targetName) + ".",
          reason: row.reason || "Сначала восстановить резерв.",
          effect: "Резерв вернется к минимальному уровню конституции."
        });
        return;
      }

      if (status === "Готово" && ticker && amount > 0) {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.MEDIUM,
          category: "План сделок",
          recommendation: action + " " + ticker + ": " +
            (row.units || 0) + " шт. (" + (row.lots || 0) + " лот.)",
          reason: target + ", сумма " + TI.Advisor.formatMoney(amount) + ".",
          effect: "Портфель приблизится к целевой структуре стратегии."
        });
        return;
      }

      if (status === "Недостаточно денег") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.HIGH,
          category: "План сделок",
          recommendation: "Не хватает свободных денег для " +
            action.toLowerCase() + " " + (ticker || row.targetName) + ".",
          reason: row.comment || "Сумма сделки больше свободных денег на счёте.",
          effect: "Нужно пополнить счёт, уменьшить цель или выбрать другой счёт."
        });
        return;
      }

      if (status === "Меньше минимального лота") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.LOW,
          category: "План сделок",
          recommendation: "Сумма докупки меньше минимального лота " +
            (ticker || row.targetName) + ".",
          reason: row.comment || "Покупка невозможна целым лотом.",
          effect: "Можно накопить кэш или поднять целевую долю."
        });
        return;
      }

      if (status === "Нужно распределить") {
        recommendations.push({
          priority: TI.Advisor.PRIORITY.MEDIUM,
          category: "План сделок",
          recommendation: "Распределить групповую цель между тикерами: " +
            target + ".",
          reason: row.comment || "Система не выбрала однозначный тикер.",
          effect: "После выбора тикеров план сделок станет исполнимым."
        });
      }
    });

    return recommendations;
  },

  /**
   * Рекомендации по концентрации.
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  riskRecommendations: function(portfolio) {
    return portfolio.filter(function(position) {
      return Number(position.portfolioShare) > 0.25;
    }).map(function(position) {
      return {
        priority: Number(position.portfolioShare) > 0.35
          ? TI.Advisor.PRIORITY.HIGH
          : TI.Advisor.PRIORITY.MEDIUM,
        category: TI.Advisor.CATEGORY.RISK,
        recommendation: "Проверить концентрацию позиции " + position.ticker + ".",
        reason: "Доля позиции составляет " +
          TI.Advisor.formatPercent(position.portfolioShare) + ".",
        effect: "Снижение зависимости портфеля от одного инструмента."
      };
    });
  },

  /**
   * Рекомендации по налогам.
   * @param {Object[]} taxes
   * @return {Object[]}
   */
  taxRecommendations: function(taxes) {
    var year = new Date().getFullYear();

    return taxes.filter(function(row) {
      return Number(row.year) === year && Number(row.taxAmount) > 0;
    }).map(function(row) {
      return {
        priority: TI.Advisor.PRIORITY.MEDIUM,
        category: TI.Advisor.CATEGORY.TAX,
        recommendation: "Учесть ожидаемый НДФЛ за " + row.year + " год.",
        reason: "Расчетная сумма налога: " + TI.Advisor.formatMoney(row.taxAmount) + ".",
        effect: "Меньше риска неожиданного кассового разрыва."
      };
    });
  },

  /**
   * Рекомендация при отсутствии проблем.
   * @return {Object}
   */
  okRecommendation: function() {
    return {
      priority: this.PRIORITY.LOW,
      category: this.CATEGORY.STRATEGY,
      recommendation: "Критичных действий не требуется.",
      reason: "Портфель не показывает заметных отклонений по текущим правилам советника.",
      effect: "Можно продолжать плановое ведение портфеля."
    };
  },

  /**
   * Текст со списком тикеров.
   * @param {Object[]} positions
   * @return {string}
   */
  tickersText: function(positions) {
    var seen = {};
    var tickers = [];

    positions.forEach(function(position) {
      var ticker = String(position.ticker || "").trim();

      if (ticker && !seen[ticker]) {
        seen[ticker] = true;
        tickers.push(ticker);
      }
    });

    return tickers.slice(0, 10).join(", ") +
      (tickers.length > 10 ? " и ещё " + (tickers.length - 10) : "");
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
   * Формат суммы.
   * @param {number} value
   * @return {string}
   */
  formatMoney: function(value) {
    return Utilities.formatString("%.2f RUB", Number(value) || 0);
  },

  /**
   * Сортировка рекомендаций.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  sort: function(rows) {
    var weight = {
      "Высокий": 1,
      "Средний": 2,
      "Низкий": 3
    };

    return rows.sort(function(a, b) {
      var priority = (weight[a.priority] || 9) - (weight[b.priority] || 9);

      if (priority !== 0) {
        return priority;
      }

      return String(a.category).localeCompare(String(b.category));
    });
  },

  /**
   * Записать рекомендации.
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
      return Schema.buildRow(CORE.SHEETS.ADVISOR, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Пересчитать советник.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  }

};

/**
 * Построить рекомендации советника.
 * @return {number}
 */
function TI_BuildAdvisor() {
  var rows = TI.Advisor.rebuild();

  SpreadsheetApp.getUi().alert(
    "Советник обновлён.\n\n" +
    "Рекомендаций: " + rows
  );

  return rows;
}
