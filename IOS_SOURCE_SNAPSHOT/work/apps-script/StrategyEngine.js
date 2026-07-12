/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: StrategyEngine.gs
 * Версия: 1.1.0
 * Назначение:
 *   Адаптивные целевые доли на основе инвестиционной конституции.
 * ============================================================
 */

var TI = TI || {};

TI.StrategyEngine = {

  SOURCE: "Конституция v1.1",

  updateTargets: function() {
    TI.Constitution.ensureDefaults();
    TI.MarketRegime.build();

    var sheet = TI.Strategy.prepare();
    var rows = this.readStrategyRows(sheet);
    var targets = TI.Constitution.targets();
    var updates = [
      this.targetRow("Тип инструмента", "Акции", targets.stocks,
        "Цель рассчитана стратегией по возрасту, резерву и ключевой ставке. Ручная доля имеет приоритет."),
      this.targetRow("Тип инструмента", "Облигации", targets.bonds,
        "Цель рассчитана стратегией по возрасту, резерву и ключевой ставке. Ручная доля имеет приоритет."),
      this.targetRow("Резерв", "Свободные деньги", targets.reserve,
        "Цель рассчитана стратегией. Резерв учитывается как свободные деньги. Ручная доля имеет приоритет.")
    ];

    updates.forEach(function(update) {
      TI.StrategyEngine.upsert(rows, update);
    });

    this.writeStrategyRows(sheet, rows);
    TI.Strategy.refreshValidationLists();
    TI.Strategy.applyValueValidations(sheet);
    return updates.length;
  },

  rebuildAll: function() {
    var result = {};

    TI.Constitution.ensureDefaults();
    result.marketRegimeRows = TI.MarketRegime.build().length;
    result.companyRatingRows = TI.CompanyRating.build().length;
    result.strategyTargets = this.updateTargets();
    result.rebalanceRows = TI.Rebalance.rebuild();
    result.tradePlanRows = TI.TradePlan.rebuild();
    result.advisorRows = TI.Advisor.rebuild();
    result.mainRows = TI.Main.rebuild();

    return result;
  },

  targetRow: function(parameter, value, targetShare, description) {
    return {
      parameter: parameter,
      value: value,
      targetShare: targetShare,
      manualTargetShare: "",
      description: description,
      accountName: TI.Rebalance.ALL_ACCOUNTS,
      source: this.SOURCE,
      updatedAt: new Date()
    };
  },

  readStrategyRows: function(sheet) {
    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    var headers = values.shift();
    var fieldsByTitle = TI.FIFO.fieldsByTitle(CORE.SHEETS.STRATEGY);

    return values.map(function(row) {
      var item = {};
      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });
      return item;
    }).filter(function(item) {
      return String(item.parameter || "").trim() ||
        String(item.value || "").trim() ||
        item.targetShare !== "";
    });
  },

  writeStrategyRows: function(sheet, rows) {
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.STRATEGY, row);
    });

    if (values.length > 0) {
      sheet.getRange(2, 1, values.length, values[0].length)
        .setValues(values);
    }
  },

  upsert: function(rows, update) {
    var key = this.key(update);

    for (var i = 0; i < rows.length; i++) {
      if (this.key(rows[i]) === key) {
        rows[i].targetShare = update.targetShare;
        rows[i].description = update.description;
        rows[i].accountName = rows[i].accountName || update.accountName;
        rows[i].manualTargetShare = rows[i].manualTargetShare || update.manualTargetShare;
        rows[i].source = update.source;
        rows[i].updatedAt = update.updatedAt;
        return;
      }
    }

    rows.push(update);
  },

  key: function(row) {
    var accountName = String(row.accountName || "").trim();

    if (!accountName || accountName.toLowerCase() === "все счета") {
      accountName = "";
    }

    return [
      String(row.parameter || "").trim().toLowerCase(),
      String(row.value || "").trim().toLowerCase(),
      accountName.toLowerCase()
    ].join("|");
  }

};

function TI_UpdateStrategyTargets() {
  var count = TI.StrategyEngine.updateTargets();

  SpreadsheetApp.getUi().alert(
    "Стратегические цели обновлены.\n\n" +
    "Обновлено целей: " + count
  );

  return count;
}

function TI_BuildStrategyAdvisor() {
  var result = TI.StrategyEngine.rebuildAll();

  SpreadsheetApp.getUi().alert(
    "Стратегический советник обновлен.\n\n" +
    "Рекомендаций: " + result.advisorRows +
    "\nПлан сделок: " + result.tradePlanRows
  );

  return result.advisorRows;
}
