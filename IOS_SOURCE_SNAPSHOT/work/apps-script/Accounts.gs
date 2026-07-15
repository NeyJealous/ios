/**
 * ==========================================
 * TInvest Sync v2
 * Работа со счетами
 * ==========================================
 */

var TI = TI || {};

TI.Accounts = {

  /**
   * Получить список всех счетов
   */
  list: function () {

    var result = TI.Providers.users.getAccounts();

    return result.accounts || [];

  },

  /**
   * Только открытые счета
   */
  active: function () {

    var accounts = this.list();

    return accounts.filter(function (account) {

      return account.status === "ACCOUNT_STATUS_OPEN";

    });

  },

  /**
   * Первый открытый счет
   */
  first: function () {

    var accounts = this.active();

    if (accounts.length === 0) {
      throw new Error("Не найдено открытых счетов.");
    }

    return accounts[0];

  },

  /**
   * ID первого счета
   */
  firstId: function () {

    return this.first().id;

  },

  /**
   * Найти счет по ID
   */
  byId: function (accountId) {

    var accounts = this.list();

    for (var i = 0; i < accounts.length; i++) {

      if (accounts[i].id === accountId) {
        return accounts[i];
      }

    }

    return null;

  },

  /**
   * Получить все ID открытых счетов
   */
  ids: function () {

    var ids = [];

    this.active().forEach(function (account) {

      ids.push(account.id);

    });

    return ids;

  },

  /**
   * Отображаемое название счета.
   * @param {Object} account
   * @return {string}
   */
  displayName: function(account) {

    if (!account) {
      return "";
    }

    return account.name ||
      account.id ||
      "";

  },

  /**
   * Карта названий счетов по ID.
   * @return {Object}
   */
  nameMap: function() {

    var map = {};

    this.active().forEach(function(account) {

      map[account.id] = TI.Accounts.displayName(account);

    });

    return map;

  },

  /**
   * Список названий счетов для выпадающих списков.
   * @return {string[]}
   */
  names: function() {

    return this.active().map(function(account) {

      return TI.Accounts.displayName(account);

    }).filter(function(name) {

      return !!name;

    });

  },

  /**
   * Свободные деньги по счетам в базовой валюте.
   * @return {Object}
   */
  cashByAccountName: function() {

    var result = {};
    var total = 0;

    this.active().forEach(function(account) {

      var name = TI.Accounts.displayName(account);
      var cash = TI.Accounts.cashForAccount(account.id);

      result[name] = cash;
      result[account.id] = cash;
      total += cash;

    });

    result[TI.Rebalance.ALL_ACCOUNTS] = total;

    return result;

  },

  /**
   * Прочитать локально сохранённый денежный остаток счёта без provider fallback.
   * @param {string} accountId
   * @return {number}
   */
  cashForAccountCachedOnly: function(accountId) {
    accountId = String(accountId || "").trim();
    if (!accountId) {
      var missingId = new Error("CACHED_CASH_NOT_AVAILABLE: account ID is empty");
      missingId.code = "CACHED_CASH_NOT_AVAILABLE";
      throw missingId;
    }

    var keys = [
      TI.Providers.cacheKey(["tinvest", "operations", "withdrawLimits", accountId]),
      TI.Providers.cacheKey(["tinvest", "operations", "positions", accountId])
    ];
    var localRecordFound = false;

    for (var i = 0; i < keys.length; i++) {
      var cached = TI.DataCache.get(keys[i], { allowStale: true });
      if (cached !== null && cached !== undefined) localRecordFound = true;
      var money = cached && Array.isArray(cached.money) ? cached.money : [];
      var hasBaseCurrency = money.some(function(value) {
        return String(value.currency || "").trim().toUpperCase() === CORE.CURRENCIES.BASE;
      });
      if (hasBaseCurrency) return this.moneyByCurrency(money, CORE.CURRENCIES.BASE);
    }

    if (localRecordFound) return 0;

    var error = new Error(
      "CACHED_CASH_NOT_AVAILABLE: " + TI.AccountStrategyAudit.suffix(accountId)
    );
    error.code = "CACHED_CASH_NOT_AVAILABLE";
    throw error;
  },

  /**
   * Карта локальных денежных остатков с Account ID как единственным ключом.
   * @return {Object}
   */
  cashByAccountIdCachedOnly: function() {
    var result = {};
    TI.MultiAccount.accounts().filter(function(account) {
      return TI.CompanyRating.isYes(account.active);
    }).forEach(function(account) {
      var accountId = String(account.accountId || "").trim();
      if (!accountId) throw new Error("Активный счёт без Account ID в листе Счета.");
      if (result.hasOwnProperty(accountId)) {
        throw new Error("Дубликат Account ID в листе Счета: " + TI.AccountStrategyAudit.suffix(accountId));
      }
      result[accountId] = TI.Accounts.cashForAccountCachedOnly(accountId);
    });
    return result;
  },

  /**
   * Legacy display adapter поверх ID-keyed cached-only карты.
   * @return {Object}
   */
  cashByAccountNameCachedOnly: function() {
    var byId = this.cashByAccountIdCachedOnly();
    var result = {};
    var total = 0;
    TI.MultiAccount.accounts().filter(function(account) {
      return TI.CompanyRating.isYes(account.active);
    }).forEach(function(account) {
      var accountId = String(account.accountId || "").trim();
      var accountName = String(account.accountName || "").trim();
      if (!byId.hasOwnProperty(accountId)) {
        throw new Error("CACHED_CASH_NOT_AVAILABLE: " + TI.AccountStrategyAudit.suffix(accountId));
      }
      if (accountName && result.hasOwnProperty(accountName)) {
        throw new Error("Неоднозначное имя счёта в локальном реестре: " + accountName);
      }
      result[accountId] = byId[accountId];
      if (accountName) result[accountName] = byId[accountId];
      total += byId[accountId];
    });
    result[TI.Rebalance.ALL_ACCOUNTS] = total;
    return result;
  },

  /**
   * Свободные деньги одного счета в базовой валюте.
   * @param {string} accountId
   * @return {number}
   */
  cashForAccount: function(accountId) {

    var withdrawCash = this.withdrawLimitsCash(accountId);

    if (withdrawCash !== null) {
      return withdrawCash;
    }

    var positionsCash = this.positionsCash(accountId);

    if (positionsCash !== null) {
      return positionsCash;
    }

    return 0;

  },

  /**
   * Доступные к выводу деньги счета.
   * @param {string} accountId
   * @return {number|null}
   */
  withdrawLimitsCash: function(accountId) {

    try {
      var response = TI.Providers.operations.getWithdrawLimits(accountId);
      var values = response.money || [];

      if (!values.length) {
        return null;
      }

      return this.moneyByCurrency(values, CORE.CURRENCIES.BASE);
    } catch (e) {
      Logger.log(e);
      return null;
    }

  },

  /**
   * Денежные позиции счета.
   * @param {string} accountId
   * @return {number|null}
   */
  positionsCash: function(accountId) {

    try {
      var response = TI.Providers.operations.getPositions(accountId);
      var values = response.money || [];

      if (!values.length) {
        return null;
      }

      return this.moneyByCurrency(values, CORE.CURRENCIES.BASE);
    } catch (e) {
      Logger.log(e);
      return null;
    }

  },

  /**
   * Сумма MoneyValue по валюте.
   * @param {Object[]} values
   * @param {string} currency
   * @return {number}
   */
  moneyByCurrency: function(values, currency) {

    currency = String(currency || "").trim().toUpperCase();

    return (values || []).reduce(function(sum, value) {

      var valueCurrency = String(value.currency || "")
        .trim()
        .toUpperCase();

      return valueCurrency === currency
        ? sum + TI.Utils.money(value)
        : sum;

    }, 0);

  }

};

function TI_TestCachedOnlyCashReader() {
  var getAccounts = TI.Providers.users.getAccounts;
  var getWithdrawLimits = TI.Providers.operations.getWithdrawLimits;
  var getPositions = TI.Providers.operations.getPositions;
  var providerCalled = false;
  try {
    TI.Providers.users.getAccounts = function() { providerCalled = true; throw new Error("PROVIDER_CALLED"); };
    TI.Providers.operations.getWithdrawLimits = function() { providerCalled = true; throw new Error("PROVIDER_CALLED"); };
    TI.Providers.operations.getPositions = function() { providerCalled = true; throw new Error("PROVIDER_CALLED"); };
    var cash = TI.Accounts.cashByAccountIdCachedOnly();
    var missingError = "";
    try {
      TI.Accounts.cashForAccountCachedOnly("codex03-missing-account");
    } catch (e) {
      missingError = e && e.code ? e.code : "";
    }
    return {
      ok: !providerCalled && Object.keys(cash).length > 0 && missingError === "CACHED_CASH_NOT_AVAILABLE",
      providerCalled: providerCalled,
      accounts: Object.keys(cash).length,
      totalCash: Object.keys(cash).reduce(function(total, accountId) { return total + cash[accountId]; }, 0),
      missingCacheCode: missingError
    };
  } finally {
    TI.Providers.users.getAccounts = getAccounts;
    TI.Providers.operations.getWithdrawLimits = getWithdrawLimits;
    TI.Providers.operations.getPositions = getPositions;
  }
}

function TI_AuditCachedCashAvailability() {
  return {
    ok: true,
    readOnly: true,
    accounts: TI.MultiAccount.accounts().filter(function(account) {
      return TI.CompanyRating.isYes(account.active);
    }).map(function(account) {
      var accountId = String(account.accountId || "").trim();
      var entries = {};
      ["withdrawLimits", "positions", "portfolio"].forEach(function(kind) {
        var value = TI.DataCache.get(
          TI.Providers.cacheKey(["tinvest", "operations", kind, accountId]),
          { allowStale: true }
        );
        entries[kind] = {
          available: value !== null && value !== undefined,
          moneyRows: value && Array.isArray(value.money) ? value.money.length : 0,
          fields: value && typeof value === "object" ? Object.keys(value).sort().slice(0, 30) : []
        };
      });
      return {
        accountId: TI.AccountStrategyAudit.suffix(accountId),
        sources: entries
      };
    })
  };
}

/**
 * Совместимость
 */
function TI_GetAccounts() {

  return TI.Accounts.active();

}

/**
 * Проверка Accounts.gs
 */
function TI_TestAccounts() {

  var accounts = TI.Accounts.active();

  Logger.log(accounts);

  SpreadsheetApp
    .getUi()
    .alert(
      "Найдено счетов: " + accounts.length
    );

}

