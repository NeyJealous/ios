/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Operations.gs
 * Версия: 1.0.0
 * Назначение:
 *   Получение и нормализация операций из API Т-Инвестиций.
 *
 * История изменений:
 *   1.0.0 - Очистка старой версии и перевод на Core/Cache.
 * ============================================================
 */

var TI = TI || {};

TI.Operations = {

  _CACHE_KEY: "operations_v2",

  /**
   * Получить операции.
   * @param {boolean} forceRefresh
   * @return {Object[]}
   */
  get: function(forceRefresh) {
    if (!forceRefresh) {
      var cached = this.fromCache();
      if (cached) {
        return cached;
      }
    }

    var operations = this.fetchAll();
    this.toCache(operations);
    return operations;
  },

  /**
   * Принудительно обновить операции.
   * @return {Object[]}
   */
  refresh: function() {
    return this.get(true);
  },

  /**
   * Сохранить операции в кэш.
   * @param {Object[]} operations
   */
  toCache: function(operations) {
    try {
      TI_GetCache().put(
        this._CACHE_KEY,
        JSON.stringify(operations || []),
        TI.Settings.getCacheSeconds()
      );
    } catch (e) {
      Logger.log(e);
    }
  },

  /**
   * Прочитать операции из кэша.
   * @return {Object[]|null}
   */
  fromCache: function() {
    try {
      var raw = TI_GetCache().get(this._CACHE_KEY);
      if (!raw) {
        return null;
      }

      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : null;
    } catch (e) {
      Logger.log(e);
      return null;
    }
  },

  /**
   * Получить операции по всем открытым счетам.
   * @return {Object[]}
   */
  fetchAll: function() {
    var accounts = TI.Accounts.active();
    var result = [];
    var from = new Date(TI.Settings.getStartDate());
    var to = new Date();

    for (var i = 0; i < accounts.length; i++) {
      result = result.concat(
        this.fetchAccount(
          accounts[i].id,
          from,
          to,
          TI.Accounts.displayName(accounts[i])
        )
      );
    }

    return this.sort(this.unique(result));
  },

  /**
   * Получить операции одного счета.
   * @param {string} accountId
   * @param {Date} from
   * @param {Date} to
   * @param {string=} accountName
   * @return {Object[]}
   */
  fetchAccount: function(accountId, from, to, accountName) {
    var data = [];
    var cursor = "";
    var hasNext = true;

    while (hasNext) {
      var response = TI.Api.call(
        API.OPERATIONS,
        "GetOperationsByCursor",
        {
          accountId: accountId,
          from: from.toISOString(),
          to: to.toISOString(),
          cursor: cursor,
          limit: TI.Settings.getPageLimit(),
          state: "OPERATION_STATE_EXECUTED",
          withoutCommissions: false,
          withoutTrades: false,
          withoutOvernights: true
        }
      );

      var items = response.items || [];

      for (var i = 0; i < items.length; i++) {
        data.push(this.normalizeOperation(accountId, items[i], accountName));
      }

      hasNext = response.hasNext === true;
      cursor = response.nextCursor || "";
    }

    return data;
  },

  /**
   * Нормализация операции.
   * @param {string} accountId
   * @param {Object} item
   * @param {string=} accountName
   * @return {Object}
   */
  normalizeOperation: function(accountId, item, accountName) {
    return {
      accountId: accountId,
      accountName: accountName || accountId,
      id: item.id || "",
      parentOperationId: item.parentOperationId || "",
      date: item.date ? new Date(item.date) : null,
      type: item.type || "",
      name: item.name || "",
      description: item.description || "",
      state: item.state || "",
      ticker: item.ticker || "",
      figi: item.figi || "",
      instrumentUid: item.instrumentUid || "",
      assetUid: item.assetUid || "",
      instrumentType: item.instrumentType || "",
      instrumentKind: item.instrumentKind || "",
      classCode: item.classCode || "",
      quantity: TI.Utils.number(item.quantity),
      quantityDone: TI.Utils.number(item.quantityDone),
      quantityRest: TI.Utils.number(item.quantityRest),
      payment: TI.Utils.money(item.payment),
      paymentCurrency: TI.Utils.currency(item.payment),
      price: TI.Utils.money(item.price),
      priceCurrency: TI.Utils.currency(item.price),
      commission: TI.Utils.money(item.commission),
      commissionCurrency: TI.Utils.currency(item.commission),
      yield: TI.Utils.money(item.yield),
      yieldCurrency: TI.Utils.currency(item.yield),
      yieldRelative: TI.Utils.quotation(item.yieldRelative),
      accruedInt: TI.Utils.money(item.accruedInt),
      accruedCurrency: TI.Utils.currency(item.accruedInt),
      trades: item.tradesInfo && item.tradesInfo.trades ? item.tradesInfo.trades : [],
      childOperations: item.childOperations || []
    };
  },

  /**
   * Удалить дубликаты.
   * @param {Object[]} list
   * @return {Object[]}
   */
  unique: function(list) {
    var map = {};

    list.forEach(function(op) {
      var key = op.id ||
        (op.accountId + "_" + op.date + "_" + op.type + "_" + op.payment);

      map[key] = op;
    });

    var result = [];

    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        result.push(map[k]);
      }
    }

    return result;
  },

  /**
   * Сортировка по дате.
   * @param {Object[]} list
   * @return {Object[]}
   */
  sort: function(list) {
    list.sort(function(a, b) {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return a.date.getTime() - b.date.getTime();
    });

    return list;
  },

  /**
   * Фильтр по группам типов операций.
   * @param {string[]} types
   * @param {Object[]} list
   * @return {Object[]}
   */
  byTypes: function(types, list) {
    list = list || this.get();

    return list.filter(function(op) {
      return types.indexOf(op.type) !== -1;
    });
  },

  /**
   * Все сделки.
   * @param {Object[]} list
   * @return {Object[]}
   */
  trades: function(list) {
    return this.byTypes(
      CORE.OPERATION_GROUPS.BUY.concat(CORE.OPERATION_GROUPS.SELL),
      list
    );
  },

  /**
   * Покупки.
   * @param {Object[]} list
   * @return {Object[]}
   */
  buys: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.BUY, list);
  },

  /**
   * Продажи.
   * @param {Object[]} list
   * @return {Object[]}
   */
  sells: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.SELL, list);
  },

  /**
   * Дивиденды.
   * @param {Object[]} list
   * @return {Object[]}
   */
  dividends: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.DIVIDENDS, list);
  },

  /**
   * Купоны.
   * @param {Object[]} list
   * @return {Object[]}
   */
  coupons: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.COUPONS, list);
  },

  /**
   * Комиссии.
   * @param {Object[]} list
   * @return {Object[]}
   */
  commissions: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.COMMISSIONS, list);
  },

  /**
   * Пополнения.
   * @param {Object[]} list
   * @return {Object[]}
   */
  deposits: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.DEPOSITS, list);
  },

  /**
   * Вывод денежных средств.
   * @param {Object[]} list
   * @return {Object[]}
   */
  withdrawals: function(list) {
    return this.byTypes(CORE.OPERATION_GROUPS.WITHDRAWALS, list);
  },

  /**
   * Поиск по FIGI.
   * @param {string} figi
   * @param {Object[]} list
   * @return {Object[]}
   */
  byFigi: function(figi, list) {
    list = list || this.get();

    return list.filter(function(op) {
      return op.figi === figi;
    });
  },

  /**
   * Поиск по UID инструмента.
   * @param {string} uid
   * @param {Object[]} list
   * @return {Object[]}
   */
  byInstrumentUid: function(uid, list) {
    list = list || this.get();

    return list.filter(function(op) {
      return op.instrumentUid === uid;
    });
  },

  /**
   * Поиск по счету.
   * @param {string} accountId
   * @param {Object[]} list
   * @return {Object[]}
   */
  byAccount: function(accountId, list) {
    list = list || this.get();

    return list.filter(function(op) {
      return op.accountId === accountId;
    });
  }

};

/**
 * Проверка Operations.gs.
 */
function TI_TestOperations() {
  try {
    var operations = TI.Operations.get(true);

    Logger.log(JSON.stringify(operations, null, 2));

    SpreadsheetApp.getUi().alert(
      "Получено операций: " + operations.length
    );
  } catch (e) {
    Logger.log(e);

    SpreadsheetApp.getUi().alert(
      "Ошибка:\n\n" + e.message
    );

    throw e;
  }
}

