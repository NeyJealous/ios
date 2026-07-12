/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: PortfolioHealth.gs
 * Версия: 1.0.0
 * Назначение:
 *   Оценка здоровья портфеля по счетам, стратегиям и всему капиталу.
 * ============================================================
 */

var TI = TI || {};

TI.PortfolioHealth = {

  SHEET: CORE.SHEETS.PORTFOLIO_HEALTH,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var portfolio = TI.Data.portfolio();

    if (portfolio.length === 0) {
      portfolio = TI.Data.portfolioFromFifoLots();
    }

    TI.MultiAccount.ensureDefaults();

    var cash = TI.Rebalance.cashByAccountName();
    var rows = [];
    var included = portfolio.filter(function(position) {
      return TI.MultiAccount.isIncludedAccount(position.accountName);
    });

    rows.push(this.row("Весь портфель", "Все счета", "", included, cash[TI.Rebalance.ALL_ACCOUNTS] || 0));
    rows = rows.concat(this.accountRows(portfolio, cash));
    rows = rows.concat(this.strategyRows(portfolio, cash));

    return rows;
  },

  accountRows: function(portfolio, cash) {
    var map = {};
    var rows = [];

    portfolio.forEach(function(position) {
      var name = String(position.accountName || "").trim() || "Без счета";
      if (!map[name]) map[name] = [];
      map[name].push(position);
    });

    Object.keys(map).sort().forEach(function(accountName) {
      rows.push(TI.PortfolioHealth.row(
        "Счёт",
        accountName,
        TI.MultiAccount.strategyForAccount(accountName),
        map[accountName],
        cash[accountName] || 0
      ));
    });

    return rows;
  },

  strategyRows: function(portfolio, cash) {
    var accountStrategies = TI.MultiAccount.accountStrategyMap();
    var map = {};
    var rows = [];

    portfolio.forEach(function(position) {
      var accountName = String(position.accountName || "").trim();
      var strategy = accountStrategies[accountName] || TI.MultiAccount.DEFAULT_STRATEGY;

      if (!map[strategy]) {
        map[strategy] = {
          positions: [],
          cash: 0,
          accounts: {}
        };
      }

      map[strategy].positions.push(position);
      map[strategy].accounts[accountName] = true;
    });

    Object.keys(map).forEach(function(strategy) {
      Object.keys(map[strategy].accounts).forEach(function(accountName) {
        map[strategy].cash += Number(cash[accountName]) || 0;
      });
    });

    Object.keys(map).sort().forEach(function(strategy) {
      rows.push(TI.PortfolioHealth.row(
        "Стратегия",
        strategy,
        strategy,
        map[strategy].positions,
        map[strategy].cash
      ));
    });

    return rows;
  },

  row: function(scopeType, scopeName, strategy, positions, cash) {
    positions = positions || [];
    cash = Number(cash) || 0;

    var marketValue = this.sum(positions, "marketValue");
    var totalValue = marketValue + cash;
    var maxShare = this.maxPositionShare(positions, totalValue);
    var reserveShare = totalValue > 0 ? cash / totalValue : 0;
    var deviation = this.strategyDeviation(positions, scopeType, scopeName);
    var risks = this.risks(maxShare, reserveShare, deviation, positions);
    var status = risks ? "Внимание" : "OK";

    return {
      scopeType: scopeType,
      scopeName: scopeName,
      strategy: strategy || "",
      marketValue: marketValue,
      cash: cash,
      totalValue: totalValue,
      positions: positions.length,
      maxPositionShare: maxShare,
      reserveShare: reserveShare,
      strategyDeviation: deviation,
      risks: risks,
      status: status,
      updatedAt: new Date()
    };
  },

  strategyDeviation: function(positions, scopeType, scopeName) {
    var targets = TI.Rebalance.readTargets();

    if (scopeType === "Счёт") {
      targets = targets.filter(function(target) {
        return !target.accountName || target.accountName === scopeName;
      });
    }

    if (targets.length === 0 || positions.length === 0) {
      return 0;
    }

    var rows = TI.Rebalance.calculate(positions, targets);
    var relevant = rows.filter(function(row) {
      return row.targetKind !== TI.Rebalance.TARGET_KINDS.RESERVE;
    });

    if (relevant.length === 0) {
      return 0;
    }

    return relevant.reduce(function(sum, row) {
      return sum + Math.abs(Number(row.deviation) || 0);
    }, 0) / relevant.length;
  },

  risks: function(maxShare, reserveShare, deviation, positions) {
    var risks = [];
    var constitution = TI.Constitution.read();
    var missingMeta = positions.filter(function(position) {
      return !position.instrumentType || !position.issuer;
    }).length;

    if (maxShare > constitution.maxOneStockShare) {
      risks.push("Высокая концентрация одной позиции");
    }

    if (reserveShare < constitution.minReserveShare) {
      risks.push("Резерв ниже минимума");
    }

    if (deviation > TI.Settings.getRebalanceThreshold() * 2) {
      risks.push("Заметное отклонение от стратегии");
    }

    if (missingMeta > 0) {
      risks.push("Есть позиции с неполными данными");
    }

    return risks.join("; ");
  },

  maxPositionShare: function(positions, totalValue) {
    if (!totalValue) {
      return 0;
    }

    return positions.reduce(function(max, position) {
      return Math.max(max, (Number(position.marketValue) || 0) / totalValue);
    }, 0);
  },

  sum: function(rows, field) {
    return (rows || []).reduce(function(total, row) {
      return total + (Number(row[field]) || 0);
    }, 0);
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
      return Schema.buildRow(CORE.SHEETS.PORTFOLIO_HEALTH, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
    return values.length;
  },

  rebuild: function() {
    return this.write(this.build());
  }

};

function TI_BuildPortfolioHealth() {
  var rows = TI.PortfolioHealth.rebuild();

  SpreadsheetApp.getUi().alert(
    "Здоровье портфеля обновлено.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
