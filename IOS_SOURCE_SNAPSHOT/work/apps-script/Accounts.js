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

    var result = TI.Api.call(
      API.USERS,
      "GetAccounts",
      {}
    );

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
      var response = TI.Api.call(
        API.OPERATIONS,
        "GetWithdrawLimits",
        { accountId: accountId }
      );
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
      var response = TI.Api.call(
        API.OPERATIONS,
        "GetPositions",
        { accountId: accountId }
      );
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

