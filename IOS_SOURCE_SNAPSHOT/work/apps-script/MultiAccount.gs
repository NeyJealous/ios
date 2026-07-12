/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: MultiAccount.gs
 * Версия: 1.0.0
 * Назначение:
 *   Управление счетами, стратегиями и связью счет-стратегия.
 * ============================================================
 */

var TI = TI || {};

TI.MultiAccount = {

  DEFAULT_STRATEGY: "Базовая стратегия",
  DEFAULT_STRATEGY_ID: "default",

  prepare: function() {
    Schema.prepareSheet(CORE.SHEETS.ACCOUNTS);
    Schema.prepareSheet(CORE.SHEETS.STRATEGIES);
    Schema.prepareSheet(CORE.SHEETS.ACCOUNT_STRATEGIES);
  },

  ensureDefaults: function(options) {
    options = options || {};

    this.prepare();
    var strategiesAdded = this.ensureStrategies();
    var accountsStats = this.accounts().length > 0 && options.forceApi !== true
      ? { total: this.accounts().length, source: "sheet" }
      : this.syncAccounts();
    var linksAdded = this.ensureAccountStrategies();

    return {
      strategiesAdded: strategiesAdded,
      accounts: accountsStats,
      accountStrategiesAdded: linksAdded
    };
  },

  ensureStrategies: function() {
    var existing = this.strategyMap();

    if (existing[this.DEFAULT_STRATEGY_ID]) {
      return 0;
    }

    var row = {
      strategyName: this.DEFAULT_STRATEGY,
      version: CORE.PROJECT.VERSION,
      goal: "Долгосрочное накопление капитала и пассивного дохода.",
      riskProfile: "Умеренный",
      allocationModel: "Инвестиционная конституция",
      active: "Да",
      comment: "Базовая стратегия по умолчанию.",
      strategyId: this.DEFAULT_STRATEGY_ID
    };

    this.appendRows(CORE.SHEETS.STRATEGIES, [row]);
    return 1;
  },

  syncAccounts: function() {
    var existing = this.accountMap();
    var discovered = this.discoverAccounts();
    var rows = [];

    discovered.forEach(function(account) {
      var old = existing[account.accountId] || {};

      rows.push({
        accountName: old.accountName || account.accountName,
        broker: old.broker || account.broker || "Т-Инвестиции",
        accountType: old.accountType || account.accountType || "",
        active: old.active || "Да",
        includeTotal: old.includeTotal || "Да",
        strategy: old.strategy || TI.MultiAccount.DEFAULT_STRATEGY,
        limits: old.limits || "",
        comment: old.comment || "",
        accountId: account.accountId || old.accountId || ""
      });
    });

    Object.keys(existing).forEach(function(key) {
      var old = existing[key];
      var id = String(old.accountId || "").trim();
      var found = rows.some(function(row) {
        return id && row.accountId === id;
      });

      if (!found && id) {
        rows.push(old);
      }
    });

    this.writeRows(CORE.SHEETS.ACCOUNTS, this.uniqueAccountRows(rows));

    return {
      total: rows.length
    };
  },

  ensureAccountStrategies: function() {
    var links = this.accountStrategyMap();
    var rows = [];

    this.accounts().forEach(function(account) {
      var accountId = String(account.accountId || "").trim();

      if (!accountId || links[accountId]) {
        return;
      }

      rows.push({
        accountName: String(account.accountName || "").trim(),
        strategy: account.strategy || TI.MultiAccount.DEFAULT_STRATEGY,
        startDate: new Date(),
        active: "Да",
        limits: account.limits || "",
        reserve: "",
        comment: "",
        accountId: accountId,
        strategyId: TI.MultiAccount.DEFAULT_STRATEGY_ID
      });
    });

    if (rows.length > 0) {
      this.appendRows(CORE.SHEETS.ACCOUNT_STRATEGIES, rows);
    }

    return rows.length;
  },

  discoverAccounts: function() {
    try {
      return TI.Accounts.active().map(function(account) {
        return {
          accountName: TI.Accounts.displayName(account),
          accountId: account.id || "",
          broker: "Т-Инвестиции",
          accountType: TI.MultiAccount.accountTypeTitle(account)
        };
      });
    } catch (e) {
      TI.TechLog.warning(
        "MultiAccount",
        "discoverAccounts",
        "API счетов недоступен, используем названия счетов из портфеля.",
        e.message || String(e)
      );

      return this.discoverAccountsFromPortfolio();
    }
  },

  discoverAccountsFromPortfolio: function() {
    var seen = {};
    var rows = [];

    TI.Data.portfolio().forEach(function(position) {
      var id = String(position.accountId || "").trim();

      if (!id || seen[id]) {
        return;
      }

      seen[id] = true;
      rows.push({
        accountName: String(position.accountName || "").trim(),
        accountId: id,
        broker: "Т-Инвестиции",
        accountType: ""
      });
    });

    return rows;
  },

  accountTypeTitle: function(account) {
    var type = String(account.type || account.accountType || "").trim();
    var map = {
      "ACCOUNT_TYPE_TINKOFF": "Брокерский",
      "ACCOUNT_TYPE_TINKOFF_IIS": "ИИС",
      "ACCOUNT_TYPE_INVEST_BOX": "Инвесткопилка"
    };

    return map[type] || type || "";
  },

  accounts: function() {
    return TI.Data.sheetObjects(CORE.SHEETS.ACCOUNTS);
  },

  strategies: function() {
    return TI.Data.sheetObjects(CORE.SHEETS.STRATEGIES);
  },

  accountStrategies: function() {
    return TI.Data.sheetObjects(CORE.SHEETS.ACCOUNT_STRATEGIES);
  },

  accountMap: function() {
    var result = {};

    this.accounts().forEach(function(row) {
      var id = String(row.accountId || "").trim();
      if (!id) throw new Error("Счёт без Account ID в листе Счета.");
      if (result[id]) throw new Error("Дубликат Account ID в листе Счета: " + TI.AccountStrategyAudit.suffix(id));
      result[id] = row;
    });

    return result;
  },

  strategyMap: function() {
    var result = {};

    this.strategies().forEach(function(row) {
      var id = String(row.strategyId || "").trim();
      if (!id) throw new Error("Стратегия без Strategy ID в листе Стратегии.");
      if (result[id]) throw new Error("Дубликат Strategy ID в листе Стратегии: " + TI.AccountStrategyAudit.suffix(id));
      result[id] = row;
    });

    return result;
  },

  accountStrategyMap: function() {
    var result = {};
    var accounts = this.accountMap();
    var strategies = this.strategyMap();

    this.accountStrategies().forEach(function(row) {
      if (TI.CompanyRating.isYes(row.active)) {
        var accountId = String(row.accountId || "").trim();
        var strategyId = String(row.strategyId || "").trim();
        if (!accountId || !strategyId) throw new Error("Активная связь без обязательного Account ID / Strategy ID.");
        if (!accounts[accountId]) throw new Error("Связь с неизвестным Account ID: " + TI.AccountStrategyAudit.suffix(accountId));
        if (!strategies[strategyId]) throw new Error("Связь с неизвестным Strategy ID: " + TI.AccountStrategyAudit.suffix(strategyId));
        if (result[accountId]) throw new Error("Дублирующая активная связь Account ID: " + TI.AccountStrategyAudit.suffix(accountId));
        result[accountId] = strategyId;
      }
    });

    return result;
  },

  strategyForAccount: function(accountId) {
    accountId = String(accountId || "").trim();
    var strategyId = this.accountStrategyMap()[accountId];
    if (!strategyId) throw new Error("Для Account ID не найдена активная стратегия: " + TI.AccountStrategyAudit.suffix(accountId));
    return this.strategyMap()[strategyId].strategyName;
  },

  isIncludedAccount: function(accountId) {
    var map = this.accountMap();
    var key = String(accountId || "").trim();
    var row = map[key];

    if (!row) {
      throw new Error("Неизвестный Account ID: " + TI.AccountStrategyAudit.suffix(key));
    }

    return !row.includeTotal || TI.CompanyRating.isYes(row.includeTotal);
  },

  uniqueAccountRows: function(rows) {
    var seen = {};
    var result = [];

    rows.forEach(function(row) {
      var key = String(row.accountId || "").trim();

      if (!key || seen[key]) {
        return;
      }

      seen[key] = true;
      result.push(row);
    });

    return result;
  },

  appendRows: function(sheetName, rows) {
    if (!rows || rows.length === 0) {
      return 0;
    }

    var sheet = Schema.prepareSheet(sheetName);
    var values = rows.map(function(row) {
      return Schema.buildRow(sheetName, row);
    });

    sheet.getRange(Math.max(sheet.getLastRow() + 1, 2), 1, values.length, values[0].length)
      .setValues(values);

    return rows.length;
  },

  writeRows: function(sheetName, rows) {
    var sheet = Schema.prepareSheet(sheetName);

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    return this.appendRows(sheetName, rows);
  }

};

function TI_InitializeMultiAccount() {
  var stats = TI.MultiAccount.ensureDefaults({
    forceApi: true
  });

  SpreadsheetApp.getUi().alert(
    "Счета и стратегии подготовлены.\n\n" +
    "Стратегий добавлено: " + stats.strategiesAdded + "\n" +
    "Счетов найдено: " + stats.accounts.total + "\n" +
    "Связей добавлено: " + stats.accountStrategiesAdded
  );

  return stats;
}
