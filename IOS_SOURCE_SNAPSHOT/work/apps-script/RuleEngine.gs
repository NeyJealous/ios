/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: RuleEngine.gs
 * Версия: 1.0.0
 * Назначение:
 *   Применение включенных правил стратегии к контексту решения.
 * ============================================================
 */

var TI = TI || {};

TI.RuleEngine = {

  SHEET: CORE.SHEETS.STRATEGY_RULES,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  defaults: function() {
    return [
      this.rule("R001", "Резерв", 100, "reserve_restore", "Восстановить резерв", "", "Если резерв ниже минимума, новые покупки получают пониженный приоритет."),
      this.rule("R010", "Рейтинг", 90, "rating_sale_check", "Проверить продажу", "", "Если рейтинг или ручной флаг указывает на фундаментальную проблему, бумагу нужно проверить вручную."),
      this.rule("R011", "Рейтинг", 80, "rating_hold_only", "Не покупать", "", "Рейтинг 50-69 означает держать, но не увеличивать позицию."),
      this.rule("R020", "Лимиты", 75, "position_limit", "Не покупать", "", "Покупка не должна нарушать лимит одной акции."),
      this.rule("R021", "Лимиты", 74, "sector_limit", "Не покупать", "", "Покупка не должна нарушать лимит сектора."),
      this.rule("R022", "Лимиты", 73, "gold_limit", "Не покупать", "", "Покупка не должна нарушать лимит золота."),
      this.rule("R023", "Лимиты", 72, "high_risk_limit", "Не покупать", "", "Покупка не должна нарушать лимит высокорисковых идей."),
      this.rule("R030", "Режим рынка", 30, "market_stock_multiplier", "Повысить приоритет", "", "При глубокой просадке рынка покупки акций получают повышенный приоритет.")
    ];
  },

  rule: function(id, category, priority, condition, action, parameter, explanation) {
    return {
      ruleId: id,
      version: CORE.PROJECT.VERSION,
      scope: "GLOBAL",
      strategy: "",
      accountName: "",
      category: category,
      priority: priority,
      enabled: "Да",
      condition: condition,
      action: action,
      parameter: parameter || "",
      explanation: explanation
    };
  },

  ensureDefaults: function() {
    var sheet = this.prepare();
    var existing = {};
    var rows = [];

    this.read().forEach(function(rule) {
      existing[String(rule.ruleId || "").trim()] = true;
    });

    this.defaults().forEach(function(rule) {
      if (!existing[rule.ruleId]) {
        rows.push(rule);
      }
    });

    if (rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.STRATEGY_RULES, row);
    });

    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, values.length, values[0].length)
      .setValues(values);

    return rows.length;
  },

  read: function() {
    return TI.Data.sheetObjects(this.SHEET);
  },

  activeRules: function() {
    return this.read().filter(function(rule) {
      return TI.CompanyRating.isYes(rule.enabled);
    }).sort(function(a, b) {
      return (Number(b.priority) || 0) - (Number(a.priority) || 0);
    });
  },

  evaluate: function(context) {
    var results = [];

    this.activeRules().forEach(function(rule) {
      if (!TI.RuleEngine.inScope(rule, context)) {
        return;
      }

      if (!TI.RuleEngine.matches(rule.condition, context)) {
        return;
      }

      results.push({
        ruleId: rule.ruleId,
        condition: rule.condition,
        category: rule.category,
        priority: Number(rule.priority) || 0,
        action: rule.action,
        explanation: rule.explanation,
        parameter: rule.parameter || ""
      });
    });

    return results;
  },

  inScope: function(rule, context) {
    var scope = String(rule.scope || "GLOBAL").trim().toUpperCase();

    if (scope === "GLOBAL") {
      return true;
    }

    if (scope === "ACCOUNT") {
      return !rule.accountName ||
        String(rule.accountName || "").trim() === String(context.accountName || "").trim();
    }

    if (scope === "STRATEGY") {
      return !rule.strategy ||
        String(rule.strategy || "").trim() === String(context.strategy || "").trim();
    }

    return true;
  },

  matches: function(condition, context) {
    var c = String(condition || "").trim();

    if (c === "reserve_restore") return context.reserveRestore === true;
    if (c === "rating_sale_check") return context.ratingDecision === "Проверить продажу";
    if (c === "rating_hold_only") return context.isBuy && context.ratingDecision === "Держать, но не увеличивать";
    if (c === "position_limit") return context.isBuy && context.positionLimit === true;
    if (c === "sector_limit") return context.isBuy && context.sectorLimit === true;
    if (c === "gold_limit") return context.isBuy && context.goldLimit === true;
    if (c === "high_risk_limit") return context.isBuy && context.highRiskLimit === true;
    if (c === "market_stock_multiplier") return context.isBuy && context.isStock && Number(context.marketMultiplier) > 1;

    return false;
  }

};

function TI_InitializeStrategyRules() {
  var count = TI.RuleEngine.ensureDefaults();

  SpreadsheetApp.getUi().alert(
    "Правила стратегии подготовлены.\n\n" +
    "Добавлено строк: " + count
  );

  return count;
}
