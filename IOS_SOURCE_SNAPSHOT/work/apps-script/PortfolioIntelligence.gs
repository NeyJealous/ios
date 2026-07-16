/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: PortfolioIntelligence.gs
 * Версия: 2.3.0
 * Назначение:
 *   Выбор лучшего счета, стратегии и распределения капитала.
 * ============================================================
 */

var TI = TI || {};

TI.PortfolioIntelligence = {

  SHEET: CORE.SHEETS.PORTFOLIO_INTELLIGENCE,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var health = TI.PortfolioHealth.build();
    var accounts = TI.AccountScope.accounts(TI.AccountScope.FLAGS.RECOMMENDATIONS)
      .filter(function(account) { return TI.AccountScope.isDisplayEnabled(account.accountId); });
    var strategies = TI.MultiAccount.strategies();
    var rows = [];
    var now = new Date();
    var accountRows = this.accountRows(accounts, health, now);
    var strategyRows = this.strategyRows(strategies, health, now);

    rows = rows
      .concat(this.allocate(accountRows))
      .concat(this.allocate(strategyRows));

    rows.sort(function(a, b) {
      var scope = String(a.scopeType).localeCompare(String(b.scopeType));
      return scope !== 0 ? scope : (Number(a.rank) || 999) - (Number(b.rank) || 999);
    });

    return rows;
  },

  accountRows: function(accounts, health, now) {
    var healthMap = this.healthMap(health, "Счёт");
    var cash = TI.Rebalance.cashByAccountName();
    var rows = [];

    (accounts || []).forEach(function(account) {
      var accountId = String(account.accountId || "").trim();
      var accountName = String(account.accountName || "").trim();

      if (!accountName || !TI.CompanyRating.isYes(account.active || "Да")) {
        return;
      }

      var healthRow = healthMap[accountName] || {};
      var score = TI.PortfolioIntelligence.accountScore(account, healthRow);
      var reasons = TI.PortfolioIntelligence.reasonsFor(account, healthRow);

      rows.push({
        scopeType: "Счёт",
        scopeName: accountName,
        accountId: accountId,
        strategy: account.strategy || TI.MultiAccount.strategyForAccount(accountId),
        rank: 0,
        score: score,
        availableCash: Number(cash[accountName]) || Number(healthRow.cash) || 0,
        totalValue: Number(healthRow.totalValue) || 0,
        reserveShare: Number(healthRow.reserveShare) || 0,
        strategyDeviation: Number(healthRow.strategyDeviation) || 0,
        recommendedShare: 0,
        recommendedAmount: 0,
        decision: "",
        reason: reasons.join("; "),
        nextStep: "",
        updatedAt: now
      });
    });

    return rows;
  },

  strategyRows: function(strategies, health, now) {
    var healthMap = this.healthMap(health, "Стратегия");
    var rows = [];

    (strategies || []).forEach(function(strategy) {
      var strategyName = String(strategy.strategyName || "").trim();

      if (!strategyName || !TI.CompanyRating.isYes(strategy.active || "Да")) {
        return;
      }

      var healthRow = healthMap[strategyName] || {};
      var score = TI.PortfolioIntelligence.strategyScore(strategy, healthRow);
      var reasons = TI.PortfolioIntelligence.strategyReasons(strategy, healthRow);

      rows.push({
        scopeType: "Стратегия",
        scopeName: strategyName,
        strategy: strategyName,
        rank: 0,
        score: score,
        availableCash: Number(healthRow.cash) || 0,
        totalValue: Number(healthRow.totalValue) || 0,
        reserveShare: Number(healthRow.reserveShare) || 0,
        strategyDeviation: Number(healthRow.strategyDeviation) || 0,
        recommendedShare: 0,
        recommendedAmount: 0,
        decision: "",
        reason: reasons.join("; "),
        nextStep: "",
        updatedAt: now
      });
    });

    return rows;
  },

  allocate: function(rows) {
    var sorted = (rows || []).sort(function(a, b) {
      return (Number(b.score) || 0) - (Number(a.score) || 0);
    });
    var totalScore = sorted.reduce(function(sum, row) {
      return sum + Math.max(0, Number(row.score) || 0);
    }, 0);
    var totalCash = sorted.reduce(function(sum, row) {
      return sum + (Number(row.availableCash) || 0);
    }, 0);

    sorted.forEach(function(row, index) {
      var positiveScore = Math.max(0, Number(row.score) || 0);
      var share = totalScore > 0 ? positiveScore / totalScore : 0;

      row.rank = index + 1;
      row.recommendedShare = share;
      row.recommendedAmount = totalCash * share;
      row.decision = TI.PortfolioIntelligence.decision(row, index);
      row.nextStep = TI.PortfolioIntelligence.nextStep(row, index);
    });

    return sorted;
  },

  accountScore: function(account, healthRow) {
    var score = 50;
    var type = String(account.accountType || "").toLowerCase();
    var risks = String(healthRow.risks || "");
    var reserveShare = Number(healthRow.reserveShare) || 0;
    var deviation = Number(healthRow.strategyDeviation) || 0;
    var constitution = TI.Constitution.read();

    if (TI.CompanyRating.isYes(account.includeTotal || "Да")) {
      score += 5;
    }

    if (type.indexOf("иис") >= 0) {
      score += 8;
    }

    if (reserveShare < constitution.minReserveShare) {
      score += 12;
    }

    score += Math.min(20, deviation * 100);

    if (risks) {
      score -= 18;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  strategyScore: function(strategy, healthRow) {
    var score = 50;
    var risk = String(strategy.riskProfile || "").toLowerCase();
    var deviation = Number(healthRow.strategyDeviation) || 0;
    var risks = String(healthRow.risks || "");

    if (risk.indexOf("умер") >= 0) {
      score += 5;
    }

    if (risk.indexOf("агресс") >= 0) {
      score += 3;
    }

    score += Math.min(25, deviation * 100);

    if (risks) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  reasonsFor: function(account, healthRow) {
    var reasons = [];
    var constitution = TI.Constitution.read();
    var reserveShare = Number(healthRow.reserveShare) || 0;
    var deviation = Number(healthRow.strategyDeviation) || 0;

    if (String(account.accountType || "").toLowerCase().indexOf("иис") >= 0) {
      reasons.push("ИИС получает небольшой приоритет из-за налогового потенциала");
    }

    if (reserveShare < constitution.minReserveShare) {
      reasons.push("резерв на счете ниже минимального уровня");
    }

    if (deviation > TI.Settings.getRebalanceThreshold()) {
      reasons.push("есть отклонение от стратегии");
    }

    if (healthRow.risks) {
      reasons.push("есть предупреждения здоровья портфеля: " + healthRow.risks);
    }

    if (reasons.length === 0) {
      reasons.push("счет подходит для планового распределения капитала");
    }

    return reasons;
  },

  strategyReasons: function(strategy, healthRow) {
    var reasons = [];

    if (strategy.goal) {
      reasons.push("цель стратегии: " + strategy.goal);
    }

    if (Number(healthRow.strategyDeviation) > TI.Settings.getRebalanceThreshold()) {
      reasons.push("стратегия имеет недовесы, которые можно закрыть новым капиталом");
    }

    if (healthRow.risks) {
      reasons.push("есть предупреждения: " + healthRow.risks);
    }

    if (reasons.length === 0) {
      reasons.push("стратегия активна и может получать плановое пополнение");
    }

    return reasons;
  },

  decision: function(row, index) {
    if (index === 0) {
      return row.scopeType === "Счёт" ? "Лучший счет для пополнения" : "Лучшая стратегия для пополнения";
    }

    if (Number(row.score) >= 60) {
      return "Пополнять по доле";
    }

    return "Низкий приоритет";
  },

  nextStep: function(row, index) {
    if (index === 0) {
      return "Сначала направить новый капитал сюда, затем распределить остаток по рекомендованным долям.";
    }

    if (Number(row.recommendedShare) > 0) {
      return "Использовать как второй эшелон пополнения после счета или стратегии с первым местом.";
    }

    return "Проверить настройки стратегии и предупреждения здоровья портфеля.";
  },

  healthMap: function(rows, scopeType) {
    var map = {};

    (rows || []).forEach(function(row) {
      if (String(row.scopeType || "") !== scopeType) {
        return;
      }

      var name = String(row.scopeName || "").trim();
      if (name) {
        map[name] = row;
      }
    });

    return map;
  },

  read: function() {
    return TI.Data.sheetObjects(this.SHEET);
  },

  bestAccount: function() {
    return this.read().filter(function(row) {
      return String(row.scopeType || "") === "Счёт" &&
        TI.AccountScope.isRecommendationEnabled(row.accountId) &&
        TI.AccountScope.isDisplayEnabled(row.accountId);
    }).sort(function(a, b) {
      return (Number(a.rank) || 999) - (Number(b.rank) || 999);
    })[0] || null;
  },

  bestStrategy: function() {
    return this.read().filter(function(row) {
      return String(row.scopeType || "") === "Стратегия";
    }).sort(function(a, b) {
      return (Number(a.rank) || 999) - (Number(b.rank) || 999);
    })[0] || null;
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
      return Schema.buildRow(CORE.SHEETS.PORTFOLIO_INTELLIGENCE, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length).setValues(values);

    if (TI.UI && TI.UI.applyPortfolioIntelligence) {
      TI.UI.applyPortfolioIntelligence();
    }

    return values.length;
  },

  rebuild: function() {
    return this.write(this.build());
  }

};

function TI_BuildPortfolioIntelligence() {
  var rows = TI.PortfolioIntelligence.rebuild();

  SpreadsheetApp.getUi().alert(
    "Интеллект портфеля обновлен.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
