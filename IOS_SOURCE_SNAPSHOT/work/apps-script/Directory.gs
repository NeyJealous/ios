/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Directory.gs
 * Версия: 1.0.0
 * Назначение:
 *   Ведение справочника инструментов для группировок стратегии.
 *
 * История изменений:
 *   1.2.0 - Справочник расширен до торгового списка акций, облигаций и фондов.
 *   1.1.0 - Добавлены текущие позиции Т-Инвестиций в источник справочника.
 *   1.0.1 - Инструменты с одним тикером объединяются в одну строку.
 *   1.0.0 - Автодобавление инструментов из сделок с сохранением ручных полей.
 * ============================================================
 */

var TI = TI || {};

TI.Directory = {

  SHEET: CORE.SHEETS.DIRECTORY,
  PRICE_BATCH_SIZE: 250,

  SECTOR_TITLES: Object.freeze({
    "consumer": "Потребительский сектор",
    "consumer_discretionary": "Потребительские товары и услуги",
    "consumer staples": "Потребительские товары первой необходимости",
    "consumer_staples": "Потребительские товары первой необходимости",
    "cyclical consumer goods": "Потребительские циклические товары",
    "non-cyclical consumer goods": "Потребительские защитные товары",
    "energy": "Энергетика",
    "sector_energy": "Энергетика",
    "financial": "Финансы",
    "financials": "Финансы",
    "sector_financial": "Финансы",
    "sector_financials": "Финансы",
    "health care": "Здравоохранение",
    "health_care": "Здравоохранение",
    "healthcare": "Здравоохранение",
    "sector_health_care": "Здравоохранение",
    "sector_healthcare": "Здравоохранение",
    "industrials": "Промышленность",
    "industrial": "Промышленность",
    "sector_industrials": "Промышленность",
    "sector_industrial": "Промышленность",
    "it": "Информационные технологии",
    "information technology": "Информационные технологии",
    "information_technology": "Информационные технологии",
    "sector_it": "Информационные технологии",
    "sector_information_technology": "Информационные технологии",
    "materials": "Материалы",
    "basic materials": "Материалы",
    "sector_materials": "Материалы",
    "sector_basic_materials": "Материалы",
    "real estate": "Недвижимость",
    "real_estate": "Недвижимость",
    "sector_real_estate": "Недвижимость",
    "telecom": "Телекоммуникации",
    "telecommunication": "Телекоммуникации",
    "telecommunications": "Телекоммуникации",
    "sector_telecom": "Телекоммуникации",
    "sector_telecommunication": "Телекоммуникации",
    "sector_telecommunications": "Телекоммуникации",
    "communication services": "Коммуникационные услуги",
    "communication_services": "Коммуникационные услуги",
    "sector_communication_services": "Коммуникационные услуги",
    "utilities": "Коммунальные услуги",
    "sector_utilities": "Коммунальные услуги",
    "municipal": "Муниципальные облигации",
    "government": "Государственные облигации",
    "sovereign": "Государственные облигации",
    "corporate": "Корпоративные облигации",
    "other": "Другое",
    "sector_other": "Другое"
  }),

  EXCHANGE_TITLES: Object.freeze({
    "MOEX": "Московская биржа",
    "MOEX_PLUS": "Московская биржа",
    "MOEX_MORNING": "Московская биржа",
    "SPB": "СПБ Биржа",
    "SPB_DE": "СПБ Биржа",
    "FORTS": "Московская биржа: срочный рынок",
    "NASDAQ": "NASDAQ",
    "NYSE": "NYSE",
    "AMEX": "NYSE American",
    "OTC": "Внебиржевой рынок",
    "OTC_NCC": "Внебиржевой рынок",
    "DEALER_INT_EXCHANGE": "Внебиржевой рынок",
    "DEALER_OPIF_ERA": "Внебиржевой рынок",
    "DEALER_REALESTATE": "Внебиржевой рынок",
    "DEALER_THIRDPARTY_INDIVIDUALS": "Внебиржевой рынок",
    "DEALER_FX_OTC": "Внебиржевой рынок",
    "ISSUANCE": "Первичное размещение",
    "FX": "Валютный рынок",
    "FX_MTL": "Валютный рынок",
    "FORTS_EVENING": "Московская биржа: срочный рынок",
    "FORTS_FUTURES_WEEKEND": "Московская биржа: срочный рынок",
    "SBP_ETF_RU_WEEKEND": "СПБ Биржа",
    "LSE": "Лондонская биржа",
    "HKEX": "Гонконгская биржа",
    "UNKNOWN": "Не указана"
  }),

  /**
   * Подготовить лист справочника.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Обновить справочник.
   * @param {{market:boolean=, prices:boolean=}=} options
   * @return {{total:number, added:number, updated:number}}
   */
  refresh: function(options) {
    options = options || {};

    var includeMarket = options.market === true;
    var updatePrices = options.prices === true;
    var existing = this.readExisting();
    var discovered = []
      .concat(includeMarket ? this.discoverFromMarket() : [])
      .concat(this.discoverFromTrades())
      .concat(this.discoverFromPortfolios());
    var stats = this.merge(existing, discovered);

    stats.rows = stats.rows.filter(function(row) {
      return TI.Directory.isExchangeTradable(row);
    });

    if (updatePrices) {
      stats.rows = this.enrichLastPrices(stats.rows);
    }

    this.write(stats.rows);

    if (TI.Strategy && TI.Strategy.refreshValidationLists) {
      TI.Strategy.refreshValidationLists();
    }

    return {
      total: stats.rows.length,
      added: stats.added,
      updated: stats.updated
    };
  },

  /**
   * Найти биржевые акции, облигации и фонды в Т-Инвестициях.
   * @return {Object[]}
   */
  discoverFromMarket: function() {
    return []
      .concat(this.fetchMarketGroup("Shares", "shares", "Акции"))
      .concat(this.fetchMarketGroup("Bonds", "bonds", "Облигации"))
      .concat(this.fetchMarketGroup("Etfs", "instruments", "Фонды"));
  },

  /**
   * Группы рынка для пакетного обновления справочника.
   * @return {Object[]}
   */
  marketGroups: function() {
    return [
      { method: "Shares", responseField: "shares", instrumentType: "Акции" },
      { method: "Bonds", responseField: "bonds", instrumentType: "Облигации" },
      { method: "Etfs", responseField: "instruments", instrumentType: "Фонды" }
    ];
  },

  /**
   * Получить группу инструментов из InstrumentsService.
   * @param {string} method
   * @param {string} responseField
   * @param {string} instrumentType
   * @return {Object[]}
   */
  fetchMarketGroup: function(method, responseField, instrumentType) {
    try {
      var providerByMethod = {
        Shares: TI.Providers.instruments.shares,
        Bonds: TI.Providers.instruments.bonds,
        Etfs: TI.Providers.instruments.etfs
      };
      var loader = providerByMethod[method];
      var response = loader ? loader.call(TI.Providers.instruments) : {};
      var list = response[responseField] ||
        response.instruments ||
        response.shares ||
        response.bonds ||
        response.etfs ||
        [];

      return list
        .map(function(instrument) {
          return TI.Directory.normalizeMarketInstrument(instrument, instrumentType);
        })
        .filter(function(item) {
          return TI.Directory.isExchangeTradable(item);
        });
    } catch (e) {
      Logger.log(e);
      return [];
    }
  },

  /**
   * Преобразовать карточку инструмента API в строку справочника.
   * @param {Object} instrument
   * @param {string} instrumentType
   * @return {Object}
   */
  normalizeMarketInstrument: function(instrument, instrumentType) {
    return {
      ticker: String(instrument.ticker || "").trim().toUpperCase(),
      name: instrument.name || "",
      currency: instrument.currency || "",
      isin: instrument.isin || "",
      instrumentType: this.normalizeInstrumentType(instrumentType),
      sector: this.normalizeSector(instrument.sector || ""),
      issuer: this.instrumentIssuer(instrument),
      lastPrice: "",
      lot: Number(instrument.lot || 0),
      tradeAvailable: this.tradeAvailableTitle(instrument),
      exchange: this.normalizeExchange(instrument.exchange || ""),
      country: instrument.countryOfRiskName || instrument.countryOfRisk || "",
      updatedAt: new Date(),
      figi: instrument.figi || "",
      assetUid: instrument.assetUid || "",
      instrumentUid: instrument.uid || instrument.instrumentUid || ""
    };
  },

  /**
   * Название эмитента из карточки инструмента.
   * @param {Object} instrument
   * @return {string}
   */
  instrumentIssuer: function(instrument) {
    if (instrument.brand && instrument.brand.name) {
      return instrument.brand.name;
    }

    if (instrument.brandName) {
      return instrument.brandName;
    }

    return instrument.name || "";
  },

  /**
   * Признак торговой доступности.
   * @param {Object} instrument
   * @return {boolean}
   */
  tradeAvailable: function(instrument) {
    if (instrument.apiTradeAvailableFlag === true) {
      return true;
    }

    return instrument.buyAvailableFlag === true ||
      instrument.sellAvailableFlag === true;
  },

  /**
   * Проверить наличие биржевого тикера.
   * @param {Object} item
   * @return {boolean}
   */
  isTradable: function(item) {
    return !!item.ticker;
  },

  /**
   * Оставить только биржевые акции, облигации и фонды.
   * Флаг доступности торгов не используется как фильтр:
   * в выходные API может временно считать инструмент недоступным.
   * @param {Object} item
   * @return {boolean}
   */
  isExchangeTradable: function(item) {
    return this.isTradable(item) &&
      this.isSupportedMarketType(item.instrumentType) &&
      this.hasExchange(item);
  },

  /**
   * Поддерживаемые типы инструментов справочника.
   * @param {string} value
   * @return {boolean}
   */
  isSupportedMarketType: function(value) {
    return [
      "Акции",
      "Облигации",
      "Фонды"
    ].indexOf(this.normalizeInstrumentType(value || "")) !== -1;
  },

  /**
   * Проверить, что инструмент относится к нормальной бирже.
   * @param {Object} item
   * @return {boolean}
   */
  hasExchange: function(item) {
    var exchange = this.normalizeExchange(item.exchange || "");

    return [
      "Московская биржа",
      "СПБ Биржа"
    ].indexOf(exchange) !== -1;
  },

  /**
   * Прочитать текущий справочник.
   * @return {Object[]}
   */
  readExisting: function() {
    var sheet = this.prepare();
    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    return this.rowsToObjects(values);
  },

  /**
   * Найти инструменты в листе сделок.
   * @return {Object[]}
   */
  discoverFromTrades: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.TRADES);

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var trades = this.rowsToObjects(values, CORE.SHEETS.TRADES);
    var map = {};

    trades.forEach(function(trade) {
      var item = {
        ticker: String(trade.ticker || "").trim().toUpperCase(),
        name: trade.name || "",
        currency: trade.currency || "",
        isin: "",
        instrumentType: TI.Directory.normalizeInstrumentType(trade.instrumentType || ""),
        sector: "",
        issuer: "",
        lastPrice: "",
        lot: "",
        tradeAvailable: "",
        exchange: "",
        country: "",
        updatedAt: new Date(),
        figi: trade.figi || "",
        assetUid: trade.assetUid || "",
        instrumentUid: trade.instrumentUid || ""
      };
      var key = TI.Directory.key(item);

      if (!key) {
        return;
      }

      if (!map[key]) {
        map[key] = item;
        return;
      }

      map[key] = TI.Directory.mergeItem(map[key], item);
    });

    return Object.keys(map).map(function(key) {
      var item = map[key];
      var info = TI.Directory.fetchInstrumentInfo(item);

      return info && TI.Directory.key(info)
        ? TI.Directory.mergeItem(item, info)
        : item;
    });
  },

  /**
   * Найти инструменты в текущих портфелях всех открытых счетов.
   * @return {Object[]}
   */
  discoverFromPortfolios: function() {
    var accounts = this.directoryAccounts();
    var map = {};

    accounts.forEach(function(account) {
      var accountId = account.id || account.accountId || "";
      var positions = TI.Directory.fetchPortfolioPositions(accountId);

      positions.forEach(function(position) {
        var item = TI.Directory.normalizePortfolioPosition(position);
        var key = TI.Directory.key(item);

        if (!key) {
          return;
        }

        if (!map[key]) {
          map[key] = item;
          return;
        }

        map[key] = TI.Directory.mergeItem(map[key], item);
      });
    });

    return Object.keys(map).map(function(key) {
      var item = map[key];
      var info = TI.Directory.fetchInstrumentInfo(item);

      return info && TI.Directory.key(info)
        ? TI.Directory.mergeItem(item, info)
        : item;
    });
  },

  /**
   * Счета для обновления справочника.
   * Источник - лист счетов, чтобы не обновлять список счетов при каждом расчете.
   * @return {Object[]}
   */
  directoryAccounts: function() {
    return TI.AccountScope.accounts(TI.AccountScope.FLAGS.SYNC)
      .map(function(account) {
        return {
          id: account.accountId || "",
          accountId: account.accountId || "",
          accountName: account.accountName || ""
        };
      })
      .filter(function(account) {
        return !!account.accountId;
      });
  },

  /**
   * Получить позиции одного счёта.
   * @param {string} accountId
   * @return {Object[]}
   */
  fetchPortfolioPositions: function(accountId) {
    if (!accountId || !TI.AccountScope.isSyncEnabled(accountId)) {
      return [];
    }

    var response = TI.Providers.operations.getPortfolio(accountId);

    return response.positions || [];
  },

  /**
   * Преобразовать позицию портфеля API в строку справочника.
   * @param {Object} position
   * @return {Object}
   */
  normalizePortfolioPosition: function(position) {
    return {
      ticker: String(position.ticker || "").trim().toUpperCase(),
      name: position.name || "",
      currency: position.currentPrice && position.currentPrice.currency
        ? position.currentPrice.currency
        : "",
      isin: "",
      instrumentType: this.normalizeInstrumentType(position.instrumentType || ""),
      sector: "",
      issuer: "",
      lastPrice: "",
      lot: "",
      tradeAvailable: "Да",
      exchange: "",
      country: "",
      updatedAt: new Date(),
      figi: position.figi || "",
      assetUid: position.assetUid || "",
      instrumentUid: position.instrumentUid || ""
    };
  },

  /**
   * Получить карточку инструмента по UID или FIGI.
   * @param {Object} item
   * @return {Object}
   */
  fetchInstrumentInfo: function(item) {
    var info = {};

    if (item.instrumentUid) {
      info = this.fetchInstrumentBy("INSTRUMENT_ID_TYPE_UID", item.instrumentUid);
    }

    if ((!info || !info.ticker) && item.figi) {
      info = this.fetchInstrumentBy("INSTRUMENT_ID_TYPE_FIGI", item.figi);
    }

    return info || {};
  },

  /**
   * Получить инструмент по идентификатору.
   * @param {string} idType
   * @param {string} id
   * @return {Object}
   */
  fetchInstrumentBy: function(idType, id) {
    try {
      var response = TI.Providers.instruments.getInstrumentBy(idType, id);
      var instrument = response.instrument || {};

      return {
        ticker: String(instrument.ticker || "").trim().toUpperCase(),
        name: instrument.name || "",
        currency: instrument.currency || "",
        isin: instrument.isin || "",
        instrumentType: this.normalizeInstrumentType(
          instrument.instrumentType || instrument.instrumentKind || ""
        ),
        sector: this.normalizeSector(instrument.sector || ""),
        issuer: this.instrumentIssuer(instrument),
        lastPrice: "",
        lot: Number(instrument.lot || 0),
        tradeAvailable: this.tradeAvailableTitle(instrument),
        exchange: this.normalizeExchange(instrument.exchange || ""),
        country: instrument.countryOfRiskName || instrument.countryOfRisk || "",
        updatedAt: new Date(),
        figi: instrument.figi || "",
        assetUid: instrument.assetUid || "",
        instrumentUid: instrument.uid || instrument.instrumentUid || ""
      };
    } catch (e) {
      Logger.log(e);
      return {};
    }
  },

  /**
   * Преобразовать строки листа в объекты.
   * @param {Array[]} values
   * @param {string=} sheetName
   * @return {Object[]}
   */
  rowsToObjects: function(values, sheetName) {
    sheetName = sheetName || this.SHEET;

    var headers = values.shift();
    var fieldsByTitle = this.fieldsByTitle(sheetName);

    return values.map(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      return item;
    }).filter(function(item) {
      return TI.Directory.key(item);
    });
  },

  /**
   * Построить карту заголовков.
   * @param {string} sheetName
   * @return {Object}
   */
  fieldsByTitle: function(sheetName) {
    var result = {};

    Schema.getColumns(sheetName).forEach(function(column) {
      result[column.title] = column.field;
    });

    return result;
  },

  /**
   * Объединить существующий справочник и найденные инструменты.
   * @param {Object[]} existing
   * @param {Object[]} discovered
   * @return {{rows:Object[], added:number, updated:number}}
   */
  merge: function(existing, discovered) {
    var map = {};
    var added = 0;
    var updated = 0;

    existing.forEach(function(item) {
      var normalized = TI.Directory.normalizeItem(item);
      var key = TI.Directory.key(normalized);

      if (!key) {
        return;
      }

      if (!map[key]) {
        map[key] = normalized;
        return;
      }

      map[key] = TI.Directory.mergeItem(map[key], normalized);
    });

    discovered.forEach(function(item) {
      var normalized = TI.Directory.normalizeItem(item);
      var key = TI.Directory.key(normalized);

      if (!key) {
        return;
      }

      if (!map[key]) {
        map[key] = normalized;
        added++;
        return;
      }

      var before = JSON.stringify(map[key]);
      map[key] = TI.Directory.mergeItem(map[key], normalized);

      if (JSON.stringify(map[key]) !== before) {
        updated++;
      }
    });

    return {
      rows: Object.keys(map).map(function(key) {
        return map[key];
      }).sort(this.sortItems),
      added: added,
      updated: updated
    };
  },

  /**
   * Нормализовать строку справочника.
   * @param {Object} item
   * @return {Object}
   */
  normalizeItem: function(item) {
    return {
      ticker: String(item.ticker || "").trim().toUpperCase(),
      name: item.name || "",
      currency: item.currency || "",
      isin: item.isin || "",
      instrumentType: this.normalizeInstrumentType(item.instrumentType || ""),
      sector: this.normalizeSector(item.sector || ""),
      issuer: item.issuer || "",
      lastPrice: item.lastPrice || "",
      lot: item.lot || "",
      tradeAvailable: this.normalizeTradeAvailable(item.tradeAvailable),
      exchange: this.normalizeExchange(item.exchange || ""),
      country: item.country || "",
      updatedAt: item.updatedAt || "",
      figi: item.figi || "",
      assetUid: item.assetUid || "",
      instrumentUid: item.instrumentUid || ""
    };
  },

  /**
   * Объединить две строки без перезаписи ручных данных пустыми значениями.
   * @param {Object} base
   * @param {Object} extra
   * @return {Object}
   */
  mergeItem: function(base, extra) {
    Object.keys(extra).forEach(function(field) {
      if (
        [
          "tradeAvailable",
          "exchange",
          "lot",
          "lastPrice",
          "updatedAt",
          "figi",
          "assetUid",
          "instrumentUid"
        ].indexOf(field) !== -1 &&
        extra[field]
      ) {
        base[field] = extra[field];
        return;
      }

      if (!base[field] && extra[field]) {
        base[field] = extra[field];
      }
    });

    return base;
  },

  /**
   * Добавить последние цены к строкам справочника.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  enrichLastPrices: function(rows) {
    var prices = this.fetchPricesForRows(rows);
    var now = new Date();

    rows.forEach(function(row) {
      var price =
        prices[row.instrumentUid] ||
        prices[row.figi] ||
        "";

      if (price !== "") {
        row.lastPrice = price;
        row.updatedAt = now;
      }
    });

    return rows;
  },

  /**
   * Получить последние цены для строк справочника.
   * @param {Object[]} rows
   * @return {Object}
   */
  fetchPricesForRows: function(rows) {
    var instrumentIds = TI.Prices.uniqueValues(rows.map(function(row) {
      return row.instrumentUid;
    }));
    var figis = TI.Prices.uniqueValues(rows.map(function(row) {
      return row.figi;
    }));
    var prices = {};

    this.chunk(instrumentIds, this.PRICE_BATCH_SIZE).forEach(function(chunk) {
      prices = TI.Prices.mergePrices(
        prices,
        TI.Prices.fetchByInstrumentIds(chunk)
      );
    });

    this.chunk(figis, this.PRICE_BATCH_SIZE).forEach(function(chunk) {
      prices = TI.Prices.mergePrices(
        prices,
        TI.Prices.fetchByFigis(chunk)
      );
    });

    return prices;
  },

  /**
   * Разбить массив на части.
   * @param {Array} values
   * @param {number} size
   * @return {Array[]}
   */
  chunk: function(values, size) {
    var result = [];

    for (var i = 0; i < values.length; i += size) {
      result.push(values.slice(i, i + size));
    }

    return result;
  },

  /**
   * Ключ инструмента.
   * Для пользовательского справочника один тикер должен быть одной строкой,
   * даже если API прислал разные технические идентификаторы.
   * @param {Object} item
   * @return {string}
   */
  key: function(item) {
    var ticker = String(item.ticker || "").trim().toUpperCase();

    if (ticker) {
      return "TICKER|" + ticker;
    }

    return String(
      item.instrumentUid ||
      item.assetUid ||
      item.figi ||
      ""
    ).trim();
  },

  /**
   * Нормализовать тип инструмента.
   * @param {string} value
   * @return {string}
   */
  normalizeInstrumentType: function(value) {
    var text = String(value || "").trim();
    var key = text.toLowerCase();
    var map = {
      "currency": "Валюта",
      "currencies": "Валюта",
      "валюта": "Валюта",
      "future": "Фьючерсы",
      "futures": "Фьючерсы",
      "фьючерс": "Фьючерсы",
      "фьючерсы": "Фьючерсы"
    };

    if (map[key]) {
      return map[key];
    }

    return TI.Rebalance
      ? TI.Rebalance.normalizeInstrumentType(text)
      : text;
  },

  /**
   * Нормализовать отрасль на русский язык.
   * @param {string} value
   * @return {string}
   */
  normalizeSector: function(value) {
    value = String(value || "").trim();

    if (!value) {
      return "";
    }

    var key = value.toLowerCase()
      .replace(/-/g, "_")
      .replace(/\s+/g, " ");

    return this.SECTOR_TITLES[key] ||
      this.SECTOR_TITLES[key.replace(/\s+/g, "_")] ||
      value;
  },

  /**
   * Нормализовать название биржи.
   * @param {string} value
   * @return {string}
   */
  normalizeExchange: function(value) {
    value = String(value || "").trim();

    if (!value) {
      return "";
    }

    var key = value.toUpperCase().replace(/-/g, "_");

    if (this.EXCHANGE_TITLES[key]) {
      return this.EXCHANGE_TITLES[key];
    }

    if (key.indexOf("MOEX") !== -1) {
      return "Московская биржа";
    }

    if (key.indexOf("SPB") !== -1) {
      return "СПБ Биржа";
    }

    return value;
  },

  /**
   * Русский признак доступности торгов.
   * @param {Object} instrument
   * @return {string}
   */
  tradeAvailableTitle: function(instrument) {
    return this.tradeAvailable(instrument) ? "Да" : "Нет";
  },

  /**
   * Нормализовать значение доступности торгов.
   * @param {*} value
   * @return {string}
   */
  normalizeTradeAvailable: function(value) {
    if (value === true || value === "TRUE" || value === "true" || value === "Да") {
      return "Да";
    }

    if (value === false || value === "FALSE" || value === "false" || value === "Нет") {
      return "Нет";
    }

    return value || "";
  },

  /**
   * Сортировка строк справочника.
   * @param {Object} a
   * @param {Object} b
   * @return {number}
   */
  sortItems: function(a, b) {
    return String(a.ticker || "").localeCompare(String(b.ticker || ""));
  },

  /**
   * Записать справочник.
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
      return Schema.buildRow(CORE.SHEETS.DIRECTORY, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Очистить справочник от не биржевых и недоступных инструментов.
   * @return {{before:number, after:number, removed:number}}
   */
  optimizeExchangeOnly: function() {
    var rows = this.readExisting();
    var optimized = rows
      .map(function(row) {
        return TI.Directory.normalizeItem(row);
      })
      .filter(function(row) {
        return TI.Directory.isExchangeTradable(row);
      });

    this.write(optimized);

    if (TI.Strategy && TI.Strategy.refreshValidationLists) {
      TI.Strategy.refreshValidationLists();
    }

    return {
      before: rows.length,
      after: optimized.length,
      removed: rows.length - optimized.length
    };
  }

};

/**
 * Обновить справочник инструментов.
 * @return {{total:number, added:number, updated:number}}
 */
function TI_UpdateDirectory() {
  return TI.SyncExecution.guardWrite("manual:directory-update", function() {
    var stats = TI.Directory.refresh({
      market: false,
      prices: false
    });

    SpreadsheetApp.getUi().alert(
      "Справочник обновлён.\n\n" +
      "Всего инструментов: " + stats.total + "\n" +
      "Добавлено: " + stats.added + "\n" +
      "Дополнено: " + stats.updated
    );

    return stats;
  });
}

/**
 * Оптимизировать справочник: оставить только биржевые торговые инструменты.
 * @return {{before:number, after:number, removed:number}}
 */
function TI_OptimizeDirectoryExchangeOnly() {
  return TI.SyncExecution.guardWrite("manual:directory-optimize", function() {
    var stats = TI.Directory.optimizeExchangeOnly();

    SpreadsheetApp.getUi().alert(
      "Справочник оптимизирован.\n\n" +
      "Было строк: " + stats.before + "\n" +
      "Стало строк: " + stats.after + "\n" +
      "Удалено: " + stats.removed
    );

    return stats;
  });
}

