/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: DecisionEngine.gs
 * Версия: 1.0.0
 * Назначение:
 *   Итоговые решения на основе правил, рейтингов и лимитов.
 * ============================================================
 */

var TI = TI || {};

TI.DecisionEngine = {

  SHEET: CORE.SHEETS.DECISIONS,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  applyToTradePlanRow: function(row, portfolio, ratings, constitution, reserve, regime, total) {
    var context = this.contextForTradeRow(row, portfolio, ratings, constitution, reserve, regime, total);
    var fired = TI.RuleEngine.evaluate(context);
    var decision = this.decide(context, fired);

    row.rating = context.ratingValue || row.rating || "";
    row.reason = decision.reasons;

    if (decision.action === "Проверить продажу") {
      row.action = "Проверить продажу";
      row.status = "Проверить продажу";
      row.comment = row.comment || "Продажа не выполняется автоматически. Нужна ручная проверка тезиса.";
      return row;
    }

    if (decision.action === "Не покупать") {
      row.action = "Не покупать";
      row.status = decision.status || "Ограничено стратегией";
      return row;
    }

    if (decision.action === "Восстановить резерв") {
      row.status = row.status === "Готово" ? "Пониженный приоритет" : row.status;
      return row;
    }

    if (decision.action === "Повысить приоритет") {
      row.reason = decision.reasons;
      return row;
    }

    row.reason = decision.reasons;
    return row;
  },

  contextForTradeRow: function(row, portfolio, ratings, constitution, reserve, regime, total) {
    var ticker = String(row.ticker || "").trim().toUpperCase();
    var rating = ratings[ticker] || null;
    var action = String(row.action || "").trim();
    var isReserveAction = row.targetKind === TI.Rebalance.TARGET_KINDS.RESERVE;
    var isBuy = !isReserveAction && TI.TradePlan.isBuyAction(action);

    return {
      accountName: row.accountName || "",
      strategy: row.strategy || TI.MultiAccount.strategyForAccount(row.accountName),
      ticker: ticker,
      row: row,
      rating: rating,
      ratingValue: rating ? Number(rating.totalRating) || 0 : "",
      ratingDecision: rating ? String(rating.decision || "").trim() : "",
      isBuy: isBuy,
      isStock: isBuy && TI.TradePlan.isStockPurchase(row, ticker, portfolio, ratings),
      reserveRestore: isBuy && reserve.status === "Восстановить резерв",
      marketMultiplier: Number(regime.multiplier) || 1,
      positionLimit: ticker ? TI.TradePlan.exceedsPositionLimit(ticker, portfolio, row, total, constitution, ratings) : false,
      sectorLimit: ticker ? TI.TradePlan.exceedsSectorLimit(ticker, portfolio, row, total, constitution, ratings) : false,
      goldLimit: ticker ? TI.TradePlan.exceedsGoldLimit(ticker, portfolio, row, total, constitution, ratings) : false,
      highRiskLimit: ticker ? TI.TradePlan.exceedsHighRiskLimit(ticker, portfolio, row, total, constitution, ratings) : false
    };
  },

  decide: function(context, fired) {
    var first = (fired || [])[0] || null;
    var explanations = (fired || []).map(function(rule) {
      return rule.explanation;
    }).filter(function(text) { return !!text; });
    var reason = explanations.join(" ");

    if (!reason && context.ratingDecision) {
      reason = "Рейтинг: " + context.ratingDecision + ".";
    }

    if (!first) {
      return {
        action: "Нет действия",
        status: "",
        score: 0,
        confidence: context.rating ? "Средняя" : "Низкая",
        reasons: reason,
        risks: "",
        rules: "",
        nextStep: ""
      };
    }

    return {
      action: first.action,
      status: this.statusFor(first),
      score: first.priority,
      confidence: "Средняя",
      reasons: reason,
      risks: this.risksFor(first, context),
      rules: (fired || []).map(function(rule) { return rule.ruleId; }).join(", "),
      nextStep: this.nextStepFor(first)
    };
  },

  statusFor: function(rule) {
    if (rule.condition === "rating_hold_only") return "Ограничено рейтингом";
    if (rule.condition === "position_limit") return "Лимит позиции";
    if (rule.condition === "sector_limit") return "Лимит сектора";
    if (rule.condition === "gold_limit") return "Лимит золота";
    if (rule.condition === "high_risk_limit") return "Лимит риска";
    return "";
  },

  risksFor: function(rule) {
    if (!rule) return "";
    if (rule.category === "Лимиты") return "Риск концентрации портфеля.";
    if (rule.category === "Рейтинг") return "Фундаментальный риск инструмента.";
    if (rule.category === "Резерв") return "Риск нехватки свободных денег.";
    return "";
  },

  nextStepFor: function(rule) {
    if (!rule) return "";
    if (rule.action === "Проверить продажу") return "Проверить инвестиционный тезис вручную.";
    if (rule.action === "Не покупать") return "Выбрать другую идею или изменить лимиты осознанно.";
    if (rule.action === "Восстановить резерв") return "Оставить пополнение свободными деньгами.";
    if (rule.action === "Повысить приоритет") return "Проверить, есть ли свободные деньги на покупку акций.";
    return "";
  },

  build: function() {
    var rows = TI.TradePlan.build();
    var now = new Date();

    return rows.map(function(row) {
      return {
        accountName: row.accountName || "",
        strategy: row.strategy || TI.MultiAccount.strategyForAccount(row.accountName),
        ticker: row.ticker || row.targetName || "",
        action: row.action || "",
        score: row.rating || "",
        confidence: row.rating ? "Средняя" : "Низкая",
        reasons: row.reason || row.comment || "",
        risks: TI.DecisionEngine.riskText(row),
        rules: "",
        nextStep: TI.DecisionEngine.nextStepText(row),
        updatedAt: now
      };
    });
  },

  riskText: function(row) {
    var status = String(row.status || "");
    if (status.indexOf("Лимит") !== -1) return "Риск концентрации.";
    if (status === "Проверить продажу") return "Фундаментальный риск.";
    if (status === "Пониженный приоритет") return "Резерв ниже нормы.";
    return "";
  },

  nextStepText: function(row) {
    var action = String(row.action || "");
    if (action === "Проверить продажу") return "Проверить вручную, не продавать автоматически.";
    if (action === "Не покупать") return "Не добавлять в ближайший план покупок.";
    if (String(row.status || "") === "Готово") return "Можно использовать как рабочий план сделки.";
    return row.comment || "";
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
      return Schema.buildRow(CORE.SHEETS.DECISIONS, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
    return values.length;
  },

  rebuild: function() {
    TI.RuleEngine.ensureDefaults();
    return this.write(this.build());
  }

};

function TI_BuildDecisions() {
  var rows = TI.DecisionEngine.rebuild();

  SpreadsheetApp.getUi().alert(
    "Решения пересчитаны.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
