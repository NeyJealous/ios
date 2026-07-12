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

    TI.MultiAccount.accountMap();
    TI.MultiAccount.strategyMap();
    TI.MultiAccount.accountStrategyMap();

    var cash = TI.Rebalance.cashByAccountName();
    var rows = [];
    var included = portfolio.filter(function(position) {
      return TI.MultiAccount.isIncludedAccount(position.accountId);
    });

    rows.push(this.row("Весь портфель", "Все счета", "", included, cash[TI.Rebalance.ALL_ACCOUNTS] || 0));
    rows = rows.concat(this.accountRows(portfolio, cash));
    rows = rows.concat(this.strategyRows(included, cash));

    return rows;
  },

  accountRows: function(portfolio, cash) {
    var map = {};
    var rows = [];
    var accounts = TI.MultiAccount.accountMap();
    var links = TI.MultiAccount.accountStrategyMap();
    var strategies = TI.MultiAccount.strategyMap();

    portfolio.forEach(function(position) {
      var accountId = String(position.accountId || "").trim();
      if (!accountId || !accounts[accountId]) throw new Error("Позиция с неизвестным Account ID: " + TI.AccountStrategyAudit.suffix(accountId));
      if (!map[accountId]) map[accountId] = [];
      map[accountId].push(position);
    });

    Object.keys(map).sort().forEach(function(accountId) {
      var accountName = String(accounts[accountId].accountName || "").trim();
      var strategyId = links[accountId] || "";
      var included = TI.MultiAccount.isIncludedAccount(accountId);
      if (included && (!strategyId || !strategies[strategyId])) {
        throw new Error("Для включённого Account ID не назначена Strategy ID: " + TI.AccountStrategyAudit.suffix(accountId));
      }
      var healthRow = TI.PortfolioHealth.row(
        "Счёт",
        accountName,
        strategyId && strategies[strategyId] ? String(strategies[strategyId].strategyName || "").trim() : "",
        map[accountId],
        cash[accountName] || 0
      );
      if (!strategyId) {
        healthRow.risks = [healthRow.risks, "Для исключённого счёта не назначена стратегия"].filter(Boolean).join("; ");
        healthRow.status = "Внимание";
      }
      rows.push(healthRow);
    });

    return rows;
  },

  strategyRows: function(portfolio, cash) {
    var accountStrategies = TI.MultiAccount.accountStrategyMap();
    var accounts = TI.MultiAccount.accountMap();
    var strategies = TI.MultiAccount.strategyMap();
    var map = {};
    var rows = [];

    portfolio.forEach(function(position) {
      var accountId = String(position.accountId || "").trim();
      var strategyId = accountStrategies[accountId];
      if (!accountId || !accounts[accountId]) throw new Error("Позиция с неизвестным Account ID: " + TI.AccountStrategyAudit.suffix(accountId));
      if (!strategyId || !strategies[strategyId]) throw new Error("Для позиции не найдена стратегия по Strategy ID.");

      if (!map[strategyId]) {
        map[strategyId] = {
          positions: [],
          cash: 0,
          accounts: {}
        };
      }

      map[strategyId].positions.push(position);
      map[strategyId].accounts[accountId] = true;
    });

    Object.keys(map).forEach(function(strategyId) {
      Object.keys(map[strategyId].accounts).forEach(function(accountId) {
        var accountName = String(accounts[accountId].accountName || "").trim();
        map[strategyId].cash += Number(cash[accountName]) || 0;
      });
    });

    Object.keys(map).sort().forEach(function(strategyId) {
      var strategyName = String(strategies[strategyId].strategyName || "").trim();
      rows.push(TI.PortfolioHealth.row(
        "Стратегия",
        strategyName,
        strategyName,
        map[strategyId].positions,
        map[strategyId].cash
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

function TI_TestPortfolioHealthAggregate() {
  var portfolio = TI.Data.portfolio();
  if (portfolio.length === 0) portfolio = TI.Data.portfolioFromFifoLots();
  var included = portfolio.filter(function(position) {
    return TI.MultiAccount.isIncludedAccount(position.accountId);
  });
  var marketValue = TI.PortfolioHealth.sum(included, "marketValue");
  return {
    ok: included.length > 0 && marketValue > 0,
    portfolioPositions: portfolio.length,
    includedPositions: included.length,
    excludedPositions: portfolio.length - included.length,
    marketValue: marketValue,
    nonZeroMarketValue: marketValue > 0
  };
}

function TI_TestPortfolioHealthByAccount() {
  var portfolio = TI.Data.portfolio();
  if (portfolio.length === 0) portfolio = TI.Data.portfolioFromFifoLots();
  var links = TI.MultiAccount.accountStrategyMap();
  var strategies = TI.MultiAccount.strategyMap();
  var rows = TI.MultiAccount.accounts().map(function(account) {
    var accountId = String(account.accountId || "").trim();
    var positions = portfolio.filter(function(position) {
      return String(position.accountId || "").trim() === accountId;
    });
    var strategyId = links[accountId] || "";
    return {
      accountId: TI.AccountStrategyAudit.suffix(accountId),
      accountName: String(account.accountName || "").trim(),
      includedInAggregate: TI.MultiAccount.isIncludedAccount(accountId),
      reportAvailable: true,
      positions: positions.length,
      marketValue: TI.PortfolioHealth.sum(positions, "marketValue"),
      strategyId: TI.AccountStrategyAudit.suffix(strategyId),
      strategyName: strategyId && strategies[strategyId]
        ? String(strategies[strategyId].strategyName || "").trim()
        : ""
    };
  });
  return {
    ok: rows.length === 3 && rows.every(function(row) { return row.reportAvailable; }),
    portfolioPositions: portfolio.length,
    accountReports: rows
  };
}
