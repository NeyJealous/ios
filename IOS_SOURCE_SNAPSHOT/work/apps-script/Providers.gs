/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Providers.gs
 * Версия: 1.0.0
 * Назначение:
 *   Единая точка доступа к внешним источникам данных.
 * ============================================================
 */

var TI = TI || {};

TI.Providers = {

  /**
   * Вызов T-Invest API с опциональным кэшированием в листе данных источников.
   * @param {string} service
   * @param {string} method
   * @param {Object} body
   * @param {Object=} options
   * @return {Object}
   */
  tinvest: function(service, method, body, options) {
    options = options || {};
    body = body || {};

    if (!options.cacheKey) {
      return TI.Api.call(service, method, body);
    }

    return TI.DataCache.remember({
      key: options.cacheKey,
      source: "T-Invest " + method,
      ttlSeconds: options.ttlSeconds || 0,
      forceRefresh: options.forceRefresh === true,
      allowStale: options.allowStale === true,
      comment: options.comment || "",
      loader: function() {
        return TI.Api.call(service, method, body);
      }
    });
  },

  cacheKey: function(parts) {
    return parts.map(function(part) {
      if (typeof part === "string") {
        return part;
      }

      return JSON.stringify(part || {});
    }).join(":");
  },

  users: {
    getAccounts: function(forceRefresh) {
      return TI.Providers.tinvest(
        API.USERS,
        "GetAccounts",
        {},
        {
          cacheKey: "tinvest:users:getAccounts",
          ttlSeconds: TI.DataCache.TTL.ACCOUNTS,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Список брокерских счетов."
        }
      );
    }
  },

  operations: {
    getPortfolio: function(accountId, forceRefresh) {
      return TI.Providers.tinvest(
        API.OPERATIONS,
        "GetPortfolio",
        {
          accountId: accountId,
          currency: CORE.CURRENCIES.BASE
        },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "operations",
            "portfolio",
            accountId
          ]),
          ttlSeconds: TI.DataCache.TTL.PORTFOLIO,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Портфель по счету."
        }
      );
    },

    getWithdrawLimits: function(accountId, forceRefresh) {
      return TI.Providers.tinvest(
        API.OPERATIONS,
        "GetWithdrawLimits",
        { accountId: accountId },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "operations",
            "withdrawLimits",
            accountId
          ]),
          ttlSeconds: TI.DataCache.TTL.PORTFOLIO,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Свободные деньги по счету."
        }
      );
    },

    getPositions: function(accountId, forceRefresh) {
      return TI.Providers.tinvest(
        API.OPERATIONS,
        "GetPositions",
        { accountId: accountId },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "operations",
            "positions",
            accountId
          ]),
          ttlSeconds: TI.DataCache.TTL.PORTFOLIO,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Позиции и денежные остатки по счету."
        }
      );
    },

    getOperationsByCursor: function(body, forceRefresh) {
      body = body || {};

      return TI.Providers.tinvest(
        API.OPERATIONS,
        "GetOperationsByCursor",
        body,
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "operations",
            "byCursor",
            body.accountId || "",
            body.from || "",
            body.to || "",
            body.cursor || "",
            body.limit || ""
          ]),
          ttlSeconds: TI.DataCache.TTL.PORTFOLIO,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Операции по счету."
        }
      );
    }
  },

  instruments: {
    shares: function(forceRefresh) {
      return TI.Providers.instrumentList("Shares", {
        instrumentStatus: "INSTRUMENT_STATUS_BASE"
      }, forceRefresh);
    },

    bonds: function(forceRefresh) {
      return TI.Providers.instrumentList("Bonds", {
        instrumentStatus: "INSTRUMENT_STATUS_BASE"
      }, forceRefresh);
    },

    etfs: function(forceRefresh) {
      return TI.Providers.instrumentList("Etfs", {
        instrumentStatus: "INSTRUMENT_STATUS_BASE"
      }, forceRefresh);
    },

    getInstrumentBy: function(idType, id, forceRefresh) {
      return TI.Providers.tinvest(
        API.INSTRUMENTS,
        "GetInstrumentBy",
        {
          idType: idType,
          id: id
        },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "instruments",
            "getInstrumentBy",
            idType,
            id
          ]),
          ttlSeconds: TI.DataCache.TTL.INSTRUMENTS,
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Карточка инструмента."
        }
      );
    }
  },

  instrumentList: function(method, body, forceRefresh) {
    return TI.Providers.tinvest(
      API.INSTRUMENTS,
      method,
      body || {},
      {
        cacheKey: TI.Providers.cacheKey([
          "tinvest",
          "instruments",
          method,
          body || {}
        ]),
        ttlSeconds: TI.DataCache.TTL.INSTRUMENTS,
        forceRefresh: forceRefresh === true,
        allowStale: true,
        comment: "Биржевые инструменты."
      }
    );
  },

  marketData: {
    getLastPricesByInstrumentIds: function(instrumentIds, forceRefresh) {
      instrumentIds = (instrumentIds || []).slice().sort();

      return TI.Providers.tinvest(
        API.MARKET_DATA,
        "GetLastPrices",
        { instrumentId: instrumentIds },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "marketData",
            "lastPricesByInstrumentIds",
            instrumentIds
          ]),
          ttlSeconds: TI.Settings.getPriceCacheSeconds(),
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Последние цены по UID инструментов."
        }
      );
    },

    getLastPricesByFigis: function(figis, forceRefresh) {
      figis = (figis || []).slice().sort();

      return TI.Providers.tinvest(
        API.MARKET_DATA,
        "GetLastPrices",
        { figi: figis },
        {
          cacheKey: TI.Providers.cacheKey([
            "tinvest",
            "marketData",
            "lastPricesByFigis",
            figis
          ]),
          ttlSeconds: TI.Settings.getPriceCacheSeconds(),
          forceRefresh: forceRefresh === true,
          allowStale: true,
          comment: "Последние цены по FIGI."
        }
      );
    }
  }

};
