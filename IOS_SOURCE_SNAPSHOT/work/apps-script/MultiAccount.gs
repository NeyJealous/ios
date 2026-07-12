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

    if (existing[this.DEFAULT_STRATEGY]) {
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
      strategyId: "default"
    };

    this.appendRows(CORE.SHEETS.STRATEGIES, [row]);
    return 1;
  },

  syncAccounts: function() {
    var existing = this.accountMap();
    var discovered = this.discoverAccounts();
    var rows = [];

    discovered.forEach(function(account) {
      var old = existing[account.accountId] ||
        existing[String(account.accountName || "").trim()] ||
        {};

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
      var name = String(old.accountName || "").trim();
      var found = rows.some(function(row) {
        return (id && row.accountId === id) ||
          (!id && name && row.accountName === name);
      });

      if (!found && name) {
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
      var accountName = String(account.accountName || "").trim();

      if (!accountName || links[accountName]) {
        return;
      }

      rows.push({
        accountName: accountName,
        strategy: account.strategy || TI.MultiAccount.DEFAULT_STRATEGY,
        startDate: new Date(),
        active: "Да",
        limits: account.limits || "",
        reserve: "",
        comment: "",
        accountId: account.accountId || ""
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
      var name = String(position.accountName || "").trim();

      if (!name || seen[name]) {
        return;
      }

      seen[name] = true;
      rows.push({
        accountName: name,
        accountId: position.accountId || "",
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
      var name = String(row.accountName || "").trim();

      if (id) result[id] = row;
      if (name) result[name] = row;
    });

    return result;
  },

  strategyMap: function() {
    var result = {};

    this.strategies().forEach(function(row) {
      var name = String(row.strategyName || "").trim();
      if (name) result[name] = row;
    });

    return result;
  },

  accountStrategyMap: function() {
    var result = {};

    this.accountStrategies().forEach(function(row) {
      if (TI.CompanyRating.isYes(row.active)) {
        result[String(row.accountName || "").trim()] =
          String(row.strategy || "").trim();
      }
    });

    this.accounts().forEach(function(row) {
      var name = String(row.accountName || "").trim();

      if (name && !result[name]) {
        result[name] = String(row.strategy || "").trim() ||
          TI.MultiAccount.DEFAULT_STRATEGY;
      }
    });

    return result;
  },

  strategyForAccount: function(accountName) {
    return this.accountStrategyMap()[String(accountName || "").trim()] ||
      this.DEFAULT_STRATEGY;
  },

  isIncludedAccount: function(accountName) {
    var map = this.accountMap();
    var row = map[String(accountName || "").trim()];

    if (!row) {
      return true;
    }

    return !row.includeTotal || TI.CompanyRating.isYes(row.includeTotal);
  },

  uniqueAccountRows: function(rows) {
    var seen = {};
    var result = [];

    rows.forEach(function(row) {
      var key = String(row.accountId || row.accountName || "").trim();

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
