/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Prices.gs
 * Версия: 1.0.0
 * Назначение:
 *   Получение последних рыночных цен инструментов.
 *
 * История изменений:
 *   1.0.0 - Первый сервис цен для расчета портфеля.
 * ============================================================
 */

var TI = TI || {};

TI.Prices = {

  _CACHE_KEY: "last_prices_v1",

  /**
   * Получить карту цен для позиций портфеля.
   * @param {Object[]} positions
   * @return {Object}
   */
  mapForPositions: function(positions) {
    var ids = this.collectInstrumentIds(positions);
    var figis = this.collectFigis(positions);
    var prices = this.fromCache() || {};
    var missingIds = this.missingValues(ids, prices);
    var missingFigis = this.missingValues(figis, prices);

    if (missingIds.length > 0 || missingFigis.length > 0) {
      prices = this.mergePrices(
        prices,
        this.fetchLastPrices(missingIds, missingFigis)
      );
      this.toCache(prices);
    }

    return prices;
  },

  /**
   * Собрать UID инструментов.
   * @param {Object[]} positions
   * @return {string[]}
   */
  collectInstrumentIds: function(positions) {
    return this.uniqueValues(positions.map(function(position) {
      return position.instrumentUid;
    }));
  },

  /**
   * Собрать FIGI.
   * @param {Object[]} positions
   * @return {string[]}
   */
  collectFigis: function(positions) {
    return this.uniqueValues(positions.map(function(position) {
      return position.figi;
    }));
  },

  /**
   * Уникальные непустые значения.
   * @param {string[]} values
   * @return {string[]}
   */
  uniqueValues: function(values) {
    var seen = {};
    var result = [];

    values.forEach(function(value) {
      value = String(value || "").trim();

      if (!value || seen[value]) {
        return;
      }

      seen[value] = true;
      result.push(value);
    });

    return result;
  },

  /**
   * Значения, для которых в карте еще нет цены.
   * @param {string[]} values
   * @param {Object} prices
   * @return {string[]}
   */
  missingValues: function(values, prices) {
    return values.filter(function(value) {
      return prices[value] === undefined || prices[value] === null;
    });
  },

  /**
   * Объединить карты цен.
   * @param {Object} base
   * @param {Object} extra
   * @return {Object}
   */
  mergePrices: function(base, extra) {
    base = base || {};
    extra = extra || {};

    Object.keys(extra).forEach(function(key) {
      base[key] = extra[key];
    });

    return base;
  },

  /**
   * Получить последние цены.
   * @param {string[]} instrumentIds
   * @param {string[]} figis
   * @return {Object}
   */
  fetchLastPrices: function(instrumentIds, figis) {
    if (instrumentIds.length === 0 && figis.length === 0) {
      return {};
    }

    try {
      return this.fetchByInstrumentIds(instrumentIds);
    } catch (e) {
      Logger.log(e);
    }

    return this.fetchByFigis(figis);
  },

  /**
   * Получить цены по UID инструментов.
   * @param {string[]} instrumentIds
   * @return {Object}
   */
  fetchByInstrumentIds: function(instrumentIds, forceRefresh) {
    if (instrumentIds.length === 0) {
      return {};
    }

    var response = TI.Providers.marketData
      .getLastPricesByInstrumentIds(instrumentIds, forceRefresh === true);

    return this.normalizeResponse(response);
  },

  /**
   * Получить цены по FIGI как запасной вариант.
   * @param {string[]} figis
   * @return {Object}
   */
  fetchByFigis: function(figis, forceRefresh) {
    if (figis.length === 0) {
      return {};
    }

    var response = TI.Providers.marketData.getLastPricesByFigis(
      figis,
      forceRefresh === true
    );

    return this.normalizeResponse(response);
  },

  /**
   * Принудительно обновить цены текущих позиций.
   * @param {Object[]} positions
   * @return {number}
   */
  refreshForPositions: function(positions) {
    var ids = this.collectInstrumentIds(positions || []);
    var figis = this.collectFigis(positions || []);
    var prices = {};

    try {
      prices = this.mergePrices(
        prices,
        this.fetchByInstrumentIds(ids, true)
      );
    } catch (e) {
      Logger.log(e);
    }

    try {
      prices = this.mergePrices(
        prices,
        this.fetchByFigis(figis, true)
      );
    } catch (e2) {
      Logger.log(e2);
    }

    this.toCache(this.mergePrices(this.fromCache() || {}, prices));

    return Object.keys(prices).length;
  },

  /**
   * Нормализовать ответ API в карту цен.
   * @param {Object} response
   * @return {Object}
   */
  normalizeResponse: function(response) {
    var map = {};
    var items = response.lastPrices || [];

    items.forEach(function(item) {
      var price = TI.Utils.quotation(item.price);

      if (item.instrumentUid) {
        map[item.instrumentUid] = price;
      }

      if (item.figi) {
        map[item.figi] = price;
      }
    });

    return map;
  },

  /**
   * Прочитать цены из кэша.
   * @return {Object|null}
   */
  fromCache: function() {
    try {
      var raw = TI_GetCache().get(this._CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      Logger.log(e);
      return null;
    }
  },

  /**
   * Сохранить цены в кэш.
   * @param {Object} prices
   */
  toCache: function(prices) {
    try {
      TI_GetCache().put(
        this._CACHE_KEY,
        JSON.stringify(prices || {}),
        TI.Settings.getPriceCacheSeconds()
      );
    } catch (e) {
      Logger.log(e);
    }
  },

  /**
   * Очистить кэш цен.
   */
  clearCache: function() {
    TI_GetCache().remove(this._CACHE_KEY);
  }

};

/**
 * Обновить цены и пересчитать портфель.
 * @return {number}
 */
function TI_UpdatePrices() {
  TI.Prices.clearCache();

  var rows = TI.Portfolio.rebuild({
    forcePrices: true
  });

  SpreadsheetApp.getUi().alert(
    "Цены обновлены.\n\n" +
    "Строк портфеля: " + rows
  );

  return rows;
}

