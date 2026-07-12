/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: TradePlan.gs
 * Версия: 1.0.0
 * Назначение:
 *   Рабочий план сделок на основе ребалансировки.
 * ============================================================
 */

var TI = TI || {};

TI.TradePlan = {

  SHEET: CORE.SHEETS.TRADE_PLAN,

  scopeIdentity: function(row) {
    var scopeType = String(row.scopeType || "").trim().toUpperCase();
    if (scopeType === TI.Rebalance.SCOPE_TYPES.AGGREGATE) {
      var defaultStrategy = TI.MultiAccount.strategyMap()[TI.MultiAccount.DEFAULT_STRATEGY_ID];
      if (!defaultStrategy) throw new Error("DEFAULT_STRATEGY_ID_NOT_FOUND");
      return {
        scopeType: scopeType,
        accountId: "",
        accountName: TI.Rebalance.ALL_ACCOUNTS,
        strategyId: TI.MultiAccount.DEFAULT_STRATEGY_ID,
        strategyName: String(defaultStrategy.strategyName || "").trim()
      };
    }
    if (scopeType !== TI.Rebalance.SCOPE_TYPES.ACCOUNT) throw new Error("UNKNOWN_SCOPE_TYPE");
    var accountId = String(row.accountId || "").trim();
    if (!accountId) throw new Error("ACCOUNT_SCOPE_REQUIRES_ACCOUNT_ID");
    var accounts = TI.MultiAccount.accountMap();
    if (!accounts[accountId]) throw new Error("UNKNOWN_ACCOUNT_ID: " + TI.AccountStrategyAudit.suffix(accountId));
    var strategyId = String(row.strategyId || TI.MultiAccount.accountStrategyMap()[accountId] || "").trim();
    var strategy = TI.MultiAccount.strategyMap()[strategyId];
    if (!strategy) throw new Error("UNKNOWN_STRATEGY_ID: " + TI.AccountStrategyAudit.suffix(strategyId));
    return {
      scopeType: scopeType,
      accountId: accountId,
      accountName: String(accounts[accountId].accountName || "").trim(),
      strategyId: strategyId,
      strategyName: String(strategy.strategyName || "").trim()
    };
  },

  applyIdentity: function(result, row) {
    var identity = this.scopeIdentity(row);
    result.scopeType = identity.scopeType;
    result.accountId = identity.accountId;
    result.accountName = identity.accountName;
    result.strategyId = identity.strategyId;
    result.strategy = identity.strategyName;
    return result;
  },

  /**
   * Подготовить лист плана сделок.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить план сделок.
   * @return {Object[]}
   */
  build: function() {
    var portfolio = TI.Data.portfolio();

    if (portfolio.length === 0) {
      portfolio = TI.Data.portfolioFromFifoLots();
    }

    var targets = TI.Rebalance.readTargets();
    var rebalance = TI.Rebalance.calculate(portfolio, targets);

    return this.fromRebalance(rebalance, portfolio);
  },

  /**
   * Преобразовать строки ребалансировки в рабочие действия.
   * @param {Object[]} rebalance
   * @param {Object[]=} portfolio
   * @return {Object[]}
   */
  fromRebalance: function(rebalance, portfolio) {
    var threshold = TI.Settings.getRebalanceThreshold();
    var rows = [];
    var scope = portfolio || [];

    (rebalance || []).forEach(function(row) {
      if (Math.abs(Number(row.deviation) || 0) <= threshold) {
        return;
      }

      rows = rows.concat(
        TI.TradePlan.rowsForRebalanceRow(row, scope)
      );
    });

    return this.enrich(rows, scope);
  },

  /**
   * Добавить к плану сделок стратегические ограничения v1.1.
   * @param {Object[]} rows
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  enrich: function(rows, portfolio) {
    var ratings = this.ratingMap();
    var constitution = TI.Constitution.read();
    var reserve = TI.Constitution.reserveStatus(portfolio);
    var regime = TI.MarketRegime.current();
    var total = TI.Constitution.actual(portfolio).total || 0;

    return (rows || []).map(function(row) {
      return TI.TradePlan.enrichRow(
        row,
        portfolio || [],
        ratings,
        constitution,
        reserve,
        regime,
        total
      );
    });
  },

  ratingMap: function() {
    var result = {};
    var assets = TI.AssetScoring && TI.AssetScoring.mapByTicker
      ? TI.AssetScoring.mapByTicker()
      : {};
    var company = TI.CompanyRating.mapByTicker();

    Object.keys(assets).forEach(function(ticker) {
      var row = assets[ticker] || {};

      result[ticker] = {
        ticker: ticker,
        name: row.name || "",
        instrumentType: row.instrumentType || "",
        sector: "",
        totalRating: Number(row.score) || 0,
        decision: row.decision || "",
        comment: row.reasons || "",
        highRisk: String(row.risks || "").indexOf("высокий риск") >= 0 ? "Да" : ""
      };
    });

    Object.keys(company).forEach(function(ticker) {
      result[ticker] = company[ticker];
    });

    return result;
  },

  enrichRow: function(row, portfolio, ratings, constitution, reserve, regime, total) {
    return TI.DecisionEngine.applyToTradePlanRow(
      row,
      portfolio,
      ratings,
      constitution,
      reserve,
      regime,
      total
    );
  },

  isStockPurchase: function(row, ticker, portfolio, ratings) {
    if (TI.Rebalance.normalizeInstrumentType(row.targetName || "") === "Акции") {
      return true;
    }

    var position = ticker ? this.positionByTicker(ticker, portfolio) : {};

    if (TI.Rebalance.normalizeInstrumentType(position.instrumentType || "") === "Акции") {
      return true;
    }

    var rating = ticker ? ratings[ticker] : null;
    return rating &&
      TI.Rebalance.normalizeInstrumentType(rating.instrumentType || "") === "Акции";
  },

  exceedsPositionLimit: function(ticker, portfolio, row, total, constitution, ratings) {
    if (!total || !constitution.maxOneStockShare) {
      return false;
    }

    var position = this.positionByTicker(ticker, portfolio);
    var rating = ratings[ticker] || {};
    var instrumentType = position.instrumentType || rating.instrumentType || "";

    if (TI.Rebalance.normalizeInstrumentType(instrumentType) !== "Акции") {
      return false;
    }

    var after = (Number(position.marketValue) || 0) + (Number(row.amount) || 0);
    return after / total > constitution.maxOneStockShare;
  },

  exceedsSectorLimit: function(ticker, portfolio, row, total, constitution, ratings) {
    if (!total || !constitution.maxOneSectorShare) {
      return false;
    }

    var position = this.positionByTicker(ticker, portfolio);
    var rating = ratings[ticker] || {};
    var sector = String(position.sector || rating.sector || "").trim();

    if (!sector) {
      return false;
    }

    var sectorValue = portfolio.reduce(function(sum, item) {
      return String(item.sector || "").trim().toLowerCase() === sector.toLowerCase()
        ? sum + (Number(item.marketValue) || 0)
        : sum;
    }, 0);

    return (sectorValue + (Number(row.amount) || 0)) / total >
      constitution.maxOneSectorShare;
  },

  exceedsGoldLimit: function(ticker, portfolio, row, total, constitution, ratings) {
    if (!total || !constitution.maxGoldShare || !this.isGoldIdea(ticker, portfolio, ratings)) {
      return false;
    }

    var goldValue = this.sumByPredicate(portfolio, function(position) {
      return TI.TradePlan.isGoldPosition(position);
    });

    return (goldValue + (Number(row.amount) || 0)) / total >
      constitution.maxGoldShare;
  },

  exceedsHighRiskLimit: function(ticker, portfolio, row, total, constitution, ratings) {
    if (!total || !constitution.maxHighRiskShare) {
      return false;
    }

    var rating = ratings[ticker] || {};

    if (!TI.CompanyRating.isYes(rating.highRisk)) {
      return false;
    }

    var highRiskValue = this.sumByPredicate(portfolio, function(position) {
      var positionTicker = String(position.ticker || "").trim().toUpperCase();
      var positionRating = ratings[positionTicker] || {};
      return TI.CompanyRating.isYes(positionRating.highRisk);
    });

    return (highRiskValue + (Number(row.amount) || 0)) / total >
      constitution.maxHighRiskShare;
  },

  isGoldIdea: function(ticker, portfolio, ratings) {
    var position = this.positionByTicker(ticker, portfolio);

    if (this.isGoldPosition(position)) {
      return true;
    }

    var rating = ratings[ticker] || {};
    return this.hasGoldText([
      ticker,
      rating.name,
      rating.sector,
      rating.instrumentType
    ]);
  },

  isGoldPosition: function(position) {
    return this.hasGoldText([
      position && position.ticker,
      position && position.name,
      position && position.sector,
      position && position.issuer,
      position && position.instrumentType
    ]);
  },

  hasGoldText: function(values) {
    return (values || []).some(function(value) {
      var text = String(value || "").trim().toLowerCase();
      return text.indexOf("золото") !== -1 ||
        text.indexOf("gold") !== -1 ||
        text === "gld" ||
        text === "gold";
    });
  },

  sumByPredicate: function(portfolio, predicate) {
    return (portfolio || []).reduce(function(sum, position) {
      return predicate(position)
        ? sum + (Number(position.marketValue) || 0)
        : sum;
    }, 0);
  },

  positionByTicker: function(ticker, portfolio) {
    ticker = String(ticker || "").trim().toUpperCase();

    for (var i = 0; i < (portfolio || []).length; i++) {
      if (String(portfolio[i].ticker || "").trim().toUpperCase() === ticker) {
        return portfolio[i];
      }
    }

    return {};
  },

  /**
   * Раскрыть строку ребалансировки в одну или несколько сделок.
   * @param {Object} row
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  rowsForRebalanceRow: function(row, portfolio) {
    if (row.targetKind === TI.Rebalance.TARGET_KINDS.RESERVE) {
      return this.reserveRow(row);
    }

    if (row.targetKind === TI.Rebalance.TARGET_KINDS.TICKER) {
      var tickerRow = this.fromRebalanceRow(row, row.targetName);
      return tickerRow ? [tickerRow] : [];
    }

    var amount = Number(row.tradeAmount) || 0;

    if (amount < 0) {
      return this.sellRowsForGroup(row, portfolio);
    }

    return this.buyRowsForGroup(row, portfolio);
  },

  reserveRow: function(row) {
    var amount = Number(row.tradeAmount) || 0;

    if (amount <= 0) {
      return [];
    }

    return [this.applyIdentity({
      accountName: row.accountName,
      action: "Пополнить резерв",
      ticker: "",
      targetKind: row.targetKind,
      targetName: row.targetName,
      currentPrice: "",
      lot: "",
      lots: "",
      units: "",
      amount: amount,
      availableCash: row.availableCash,
      rating: "",
      reason: "Фактический резерв ниже целевой доли.",
      status: "Резерв",
      comment: "Новые пополнения сначала оставить свободными деньгами."
    }, row)];
  },

  /**
   * Строки продажи для групповой цели.
   * @param {Object} row
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  sellRowsForGroup: function(row, portfolio) {
    var positions = this.matchingPositions(row, portfolio);
    var excess = Math.abs(Number(row.tradeAmount) || 0);

    if (positions.length === 0) {
      var fallback = this.fromRebalanceRow(row, "");
      return fallback ? [fallback] : [];
    }

    positions.sort(function(a, b) {
      return (Number(b.marketValue) || 0) - (Number(a.marketValue) || 0);
    });

    var rows = [];

    positions.forEach(function(position) {
      if (excess <= 0) {
        return;
      }

      var plan = TI.Rebalance.roundByLot(
        -Math.min(excess, Number(position.marketValue) || 0),
        Number(position.currentPrice) || 0,
        Number(position.lot) || 1
      );

      if (!plan.amount) {
        return;
      }

      excess -= Math.abs(Number(plan.amount) || 0);
      rows.push(TI.TradePlan.fromPosition(row, position, plan, "Продать"));
    });

    return rows;
  },

  /**
   * Строки покупки для групповой цели.
   * @param {Object} row
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  buyRowsForGroup: function(row, portfolio) {
    var positions = this.matchingPositions(row, portfolio);
    var budget = Number(row.tradeAmount) || 0;

    if (positions.length > 1) {
      return this.distributeBuyRows(row, positions, budget);
    }

    if (positions.length === 1) {
      var plan = TI.Rebalance.roundByLot(
        Number(row.tradeAmount) || 0,
        Number(positions[0].currentPrice) || 0,
        Number(positions[0].lot) || 1
      );

      return [this.fromPosition(row, positions[0], plan, "Купить")];
    }

    var fallback = this.fromRebalanceRow(row, "");
    return fallback ? [fallback] : [];
  },

  /**
   * Распределить покупку между бумагами группы.
   * @param {Object} row
   * @param {Object[]} positions
   * @param {number} budget
   * @return {Object[]}
   */
  distributeBuyRows: function(row, positions, budget) {
    var cashLimit = row.availableCash !== ""
      ? Number(row.availableCash) || 0
      : budget;
    var remaining = Math.max(0, Math.min(budget, cashLimit || budget));
    var tradable = positions.filter(function(position) {
      return Number(position.currentPrice) > 0 &&
        Number(position.lot || 1) > 0;
    });

    if (remaining <= 0 || tradable.length === 0) {
      var fallback = this.fromRebalanceRow(row, "");
      return fallback ? [fallback] : [];
    }

    tradable.sort(function(a, b) {
      return (Number(a.marketValue) || 0) - (Number(b.marketValue) || 0);
    });

    var totalValue = tradable.reduce(function(sum, position) {
      return sum + (Number(position.marketValue) || 0);
    }, 0);
    var targetAverage = (totalValue + remaining) / tradable.length;
    var rows = [];

    tradable.forEach(function(position) {
      if (remaining <= 0) {
        return;
      }

      var currentValue = Number(position.marketValue) || 0;
      var need = Math.max(0, targetAverage - currentValue);

      if (!need) {
        return;
      }

      var plan = TI.Rebalance.roundByLot(
        Math.min(need, remaining),
        Number(position.currentPrice) || 0,
        Number(position.lot) || 1
      );

      if (!plan.amount || Number(plan.amount) > remaining) {
        return;
      }

      remaining -= Number(plan.amount) || 0;
      rows.push(TI.TradePlan.fromPosition(
        row,
        position,
        plan,
        "Купить"
      ));
    });

    if (rows.length === 0) {
      return [this.groupBuyFallback(row, tradable)];
    }

    return rows;
  },

  /**
   * Строка, если бюджет меньше минимального лота по группе.
   * @param {Object} row
   * @param {Object[]} positions
   * @return {Object}
   */
  groupBuyFallback: function(row, positions) {
    positions.sort(function(a, b) {
      return (Number(a.marketValue) || 0) - (Number(b.marketValue) || 0);
    });

    var position = positions[0] || {};
    var lotAmount =
      (Number(position.currentPrice) || 0) *
      Math.max(1, Number(position.lot) || 1);

    return this.applyIdentity({
      accountName: row.accountName,
      action: "Купить",
      ticker: position.ticker || "",
      targetKind: row.targetKind,
      targetName: row.targetName,
      currentPrice: position.currentPrice || "",
      lot: position.lot || "",
      lots: "",
      units: "",
      amount: Math.abs(Number(row.tradeAmount) || 0),
      availableCash: row.availableCash,
      status: "Меньше минимального лота",
      comment: lotAmount
        ? "Для ближайшей недовзвешенной бумаги нужен минимум " +
          TI.Rebalance.formatMoney(lotAmount) + "."
        : "Проверьте цену и лотность в справочнике."
    }, row);
  },

  /**
   * Позиции портфеля, подходящие под строку ребалансировки.
   * @param {Object} row
   * @param {Object[]} portfolio
   * @return {Object[]}
   */
  matchingPositions: function(row, portfolio) {
    var accountName = String(row.accountName || "").trim();
    var target = {
      scopeType: row.scopeType,
      accountId: row.accountId || "",
      accountName: accountName === TI.Rebalance.ALL_ACCOUNTS ? "" : accountName,
      kind: row.targetKind,
      name: row.targetName
    };
    var scoped = TI.Rebalance.portfolioForTarget(portfolio || [], target);

    return scoped.filter(function(position) {
      return TI.Rebalance.matchesTarget(position, target);
    });
  },

  /**
   * Одна строка плана сделок.
   * @param {Object} row
   * @param {string=} ticker
   * @return {Object|null}
   */
  fromRebalanceRow: function(row, ticker) {
    var amount = Number(row.roundedAmount) || 0;
    var targetAmount = Number(row.tradeAmount) || 0;
    var action = targetAmount > 0 ? "Купить" : "Продать";
    var units = Number(row.unitsToTrade) || 0;
    var lots = Number(row.lotsToTrade) || 0;
    ticker = ticker !== undefined ? ticker : (
      row.targetKind === TI.Rebalance.TARGET_KINDS.TICKER
      ? row.targetName
      : ""
    );
    var status = "Готово";
    var comment = "";

    if (!amount && targetAmount) {
      status = ticker ? "Нет цены или лота" : "Нужно распределить";
      comment = ticker
        ? "Проверьте цену и лотность в справочнике."
        : "Групповую цель нужно распределить между конкретными тикерами.";
    }

    if (this.isBuyAction(action) &&
        amount > 0 &&
        row.availableCash !== "" &&
        Number(row.availableCash) < amount) {
      status = "Недостаточно денег";
      comment = "Сумма по лотам больше свободных денег на счёте.";
    }

    if (!targetAmount) {
      return null;
    }

    return this.applyIdentity({
      accountName: row.accountName,
      action: action,
      ticker: ticker,
      targetKind: row.targetKind,
      targetName: row.targetName,
      currentPrice: row.currentPrice,
      lot: row.lot,
      lots: lots || "",
      units: units || "",
      amount: amount ? Math.abs(amount) : Math.abs(targetAmount),
      availableCash: row.availableCash,
      status: status,
      comment: comment
    }, row);
  },

  /**
   * Построить строку плана по конкретной позиции.
   * @param {Object} row
   * @param {Object} position
   * @param {Object} plan
   * @param {string} action
   * @return {Object}
   */
  fromPosition: function(row, position, plan, action) {
    var amount = Math.abs(Number(plan.amount) || 0);
    var status = amount ? "Готово" : "Нет цены или лота";
    var comment = amount ? "" : "Проверьте цену и лотность в справочнике.";

    if (this.isBuyAction(action) &&
        amount > 0 &&
        row.availableCash !== "" &&
        Number(row.availableCash) < amount) {
      status = "Недостаточно денег";
      comment = "Сумма по лотам больше свободных денег на счёте.";
    }

    return this.applyIdentity({
      accountName: row.accountName,
      action: action,
      ticker: position.ticker,
      targetKind: row.targetKind,
      targetName: row.targetName,
      currentPrice: plan.currentPrice,
      lot: plan.lot,
      lots: plan.lots || "",
      units: plan.units || "",
      amount: amount,
      availableCash: row.availableCash,
      status: status,
      comment: comment
    }, row);
  },

  /**
   * Проверить, что действие является покупкой.
   * @param {string} action
   * @return {boolean}
   */
  isBuyAction: function(action) {
    return String(action || "").trim().toLowerCase() === "купить";
  },

  /**
   * Записать план сделок.
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
      return Schema.buildRow(CORE.SHEETS.TRADE_PLAN, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    if (TI.UI && TI.UI.applyTradePlan) {
      TI.UI.applyTradePlan();
    }

    return values.length;
  },

  /**
   * Пересчитать план сделок.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  }

};

/**
 * Построить план сделок.
 * @return {number}
 */
function TI_BuildTradePlan() {
  var rows = TI.TradePlan.rebuild();

  SpreadsheetApp.getUi().alert(
    "План сделок построен.\n\n" +
    "Строк: " + rows
  );

  return rows;
}

function TI_TestTradePlanScopes() {
  var aggregate = TI.TradePlan.scopeIdentity({
    scopeType: TI.Rebalance.SCOPE_TYPES.AGGREGATE,
    accountId: "",
    accountName: TI.Rebalance.ALL_ACCOUNTS
  });
  var links = TI.MultiAccount.accountStrategyMap();
  var accountIds = Object.keys(links);
  var validAccountId = accountIds[0] || "";
  var account = TI.TradePlan.scopeIdentity({
    scopeType: TI.Rebalance.SCOPE_TYPES.ACCOUNT,
    accountId: validAccountId,
    strategyId: links[validAccountId]
  });
  function fails(row) {
    try { TI.TradePlan.scopeIdentity(row); return false; } catch (e) { return true; }
  }
  return {
    ok: aggregate.accountId === "" && account.accountId === validAccountId &&
      fails({ scopeType: "ACCOUNT", accountId: "" }) &&
      fails({ scopeType: "ACCOUNT", accountId: "unknown" }) &&
      fails({ scopeType: "ACCOUNT", accountId: "Пассивный" }),
    aggregateScope: aggregate.scopeType,
    validAccountScope: account.scopeType,
    emptyAccountIdRejected: fails({ scopeType: "ACCOUNT", accountId: "" }),
    unknownAccountIdRejected: fails({ scopeType: "ACCOUNT", accountId: "unknown" }),
    russianNameNotUsedAsKey: fails({ scopeType: "ACCOUNT", accountId: "Пассивный" })
  };
}
