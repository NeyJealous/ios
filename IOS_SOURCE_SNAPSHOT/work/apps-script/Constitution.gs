/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Constitution.gs
 * Версия: 1.1.0
 * Назначение:
 *   Инвестиционная конституция, резерв и базовые цели стратегии.
 * ============================================================
 */

var TI = TI || {};

TI.Constitution = {

  SHEET: CORE.SHEETS.CONSTITUTION,

  KEYS: Object.freeze({
    INVESTOR_AGE: "Возраст инвестора",
    TARGET_RESERVE_SHARE: "Целевая доля резерва",
    MIN_RESERVE_SHARE: "Минимальная доля резерва",
    MAX_ONE_STOCK_SHARE: "Максимальная доля одной акции",
    MAX_ONE_SECTOR_SHARE: "Максимальная доля одного сектора",
    MAX_HIGH_RISK_SHARE: "Максимальная доля высокорисковых идей",
    MAX_GOLD_SHARE: "Максимальная доля золота",
    KEY_RATE: "Ключевая ставка",
    MARKET_FROM_HIGH: "Индекс рынка от максимума, %",
    OIL_PRICE: "Цена нефти",
    RUBLE_RATE: "Курс рубля",
    RESERVE_RESTORE_MODE: "Режим восстановления резерва"
  }),

  DEFAULTS: Object.freeze({
    INVESTOR_AGE: 35,
    TARGET_RESERVE_SHARE: "10%",
    MIN_RESERVE_SHARE: "5%",
    MAX_ONE_STOCK_SHARE: "10%",
    MAX_ONE_SECTOR_SHARE: "30%",
    MAX_HIGH_RISK_SHARE: "10%",
    MAX_GOLD_SHARE: "10%",
    KEY_RATE: "0%",
    MARKET_FROM_HIGH: "0%",
    OIL_PRICE: "",
    RUBLE_RATE: "",
    RESERVE_RESTORE_MODE: "Нет"
  }),

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  ensureDefaults: function() {
    TI.Settings.ensureDefaults();

    var sheet = TI.Settings.prepare();
    var existing = TI.Settings.readMap();
    var rows = [];

    Object.keys(this.KEYS).forEach(function(key) {
      var parameter = TI.Constitution.KEYS[key];

      if (existing[parameter] === undefined) {
        rows.push({
          parameter: parameter,
          value: TI.Constitution.DEFAULTS[key]
        });
      }
    });

    if (rows.length > 0) {
      var values = rows.map(function(row) {
        return Schema.buildRow(CORE.SHEETS.SETTINGS, row);
      });
      var startRow = Math.max(sheet.getLastRow() + 1, 2);
      sheet.getRange(startRow, 1, values.length, values[0].length)
        .setValues(values);
    }

    this.writeSummary();
    return rows.length;
  },

  read: function() {
    return {
      investorAge: this.number(this.KEYS.INVESTOR_AGE, 35, 0, 100),
      targetReserveShare: this.percent(this.KEYS.TARGET_RESERVE_SHARE, 0.1),
      minReserveShare: this.percent(this.KEYS.MIN_RESERVE_SHARE, 0.05),
      maxOneStockShare: this.percent(this.KEYS.MAX_ONE_STOCK_SHARE, 0.1),
      maxOneSectorShare: this.percent(this.KEYS.MAX_ONE_SECTOR_SHARE, 0.3),
      maxHighRiskShare: this.percent(this.KEYS.MAX_HIGH_RISK_SHARE, 0.1),
      maxGoldShare: this.percent(this.KEYS.MAX_GOLD_SHARE, 0.1),
      keyRate: this.percent(this.KEYS.KEY_RATE, 0),
      marketFromHigh: this.percent(this.KEYS.MARKET_FROM_HIGH, 0),
      oilPrice: TI.Settings.get(this.KEYS.OIL_PRICE, ""),
      rubleRate: TI.Settings.get(this.KEYS.RUBLE_RATE, ""),
      reserveRestoreMode: String(
        TI.Settings.get(this.KEYS.RESERVE_RESTORE_MODE, "Нет") || "Нет"
      ).trim()
    };
  },

  number: function(key, fallback, min, max) {
    var value = TI.Settings.getNumber(key, fallback);
    value = isNaN(value) ? fallback : value;

    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);

    return value;
  },

  percent: function(key, fallback) {
    var value = TI.Settings.getPercent(key, fallback);
    return Math.max(0, Math.min(1, value));
  },

  keyRateBondBonus: function(rate) {
    if (rate > 0.18) return 0.2;
    if (rate >= 0.15) return 0.15;
    if (rate >= 0.12) return 0.1;
    if (rate >= 0.1) return 0.05;
    return 0;
  },

  targets: function() {
    var config = this.read();
    var reserve = Math.max(0, Math.min(0.9, config.targetReserveShare));
    var investable = 1 - reserve;
    var bondBase = config.investorAge / 100;
    var stockBase = 1 - bondBase;
    var bonds = investable * bondBase;
    var stocks = investable * stockBase;
    var bonus = Math.min(stocks, investable * this.keyRateBondBonus(config.keyRate));

    bonds += bonus;
    stocks -= bonus;

    return {
      stocks: Math.max(0, stocks),
      bonds: Math.max(0, bonds),
      reserve: reserve,
      keyRateBonus: bonus,
      config: config
    };
  },

  actual: function(portfolio) {
    portfolio = TI.AccountScope.filterCalculationRows(portfolio || TI.Data.portfolio());

    var portfolioValue = this.sum(portfolio, "marketValue");
    var cash = this.totalCash();
    var total = portfolioValue + cash;
    var stocks = this.sumByType(portfolio, "Акции");
    var bonds = this.sumByType(portfolio, "Облигации");

    return {
      total: total,
      cash: cash,
      reserveShare: total > 0 ? cash / total : 0,
      stocksShare: total > 0 ? stocks / total : 0,
      bondsShare: total > 0 ? bonds / total : 0
    };
  },

  reserveStatus: function(portfolio) {
    var config = this.read();
    var actual = this.actual(portfolio);
    var restoreMode = this.isYes(config.reserveRestoreMode);

    if (actual.reserveShare < config.minReserveShare || restoreMode) {
      return {
        status: "Восстановить резерв",
        priority: "Высокий",
        message: "Сначала восстановить резерв"
      };
    }

    if (actual.reserveShare < config.targetReserveShare) {
      return {
        status: "Ниже цели",
        priority: "Средний",
        message: "Часть новых пополнений направлять в резерв"
      };
    }

    return {
      status: "В норме",
      priority: "Низкий",
      message: "Резерв соответствует конституции"
    };
  },

  totalCash: function() {
    try {
      var cashByAccount = TI.Rebalance.cashByAccountName();

      if (cashByAccount.hasOwnProperty(TI.Rebalance.ALL_ACCOUNTS)) {
        return Number(cashByAccount[TI.Rebalance.ALL_ACCOUNTS]) || 0;
      }

      return Object.keys(cashByAccount).reduce(function(sum, accountName) {
        if (accountName === TI.Rebalance.ALL_ACCOUNTS) {
          return sum;
        }
        return sum + (Number(cashByAccount[accountName]) || 0);
      }, 0);
    } catch (e) {
      Logger.log(e);
      return 0;
    }
  },

  sum: function(rows, field) {
    return (rows || []).reduce(function(sum, row) {
      return sum + (Number(row[field]) || 0);
    }, 0);
  },

  sumByType: function(rows, instrumentType) {
    return (rows || []).reduce(function(sum, row) {
      return TI.Rebalance.normalizeInstrumentType(row.instrumentType || "") === instrumentType
        ? sum + (Number(row.marketValue) || 0)
        : sum;
    }, 0);
  },

  isYes: function(value) {
    var text = String(value || "").trim().toLowerCase();
    return text === "да" || text === "yes" || text === "true" || text === "1";
  },

  formatPercent: function(value) {
    return Utilities.formatString("%.2f%%", (Number(value) || 0) * 100);
  },

  writeSummary: function() {
    var sheet = this.prepare();
    var targets = this.targets();
    var config = targets.config;
    var rows = [
      this.row("Возраст инвестора", config.investorAge, "Базовая доля облигаций равна возрасту инвестора."),
      this.row("Ключевая ставка", this.formatPercent(config.keyRate), "Высокая ставка увеличивает целевую долю облигаций для новых покупок."),
      this.row("Целевая доля акций", this.formatPercent(targets.stocks), "Рассчитано по возрасту, резерву и ключевой ставке."),
      this.row("Целевая доля облигаций", this.formatPercent(targets.bonds), "Рассчитано по возрасту, резерву и ключевой ставке."),
      this.row("Целевая доля резерва", this.formatPercent(targets.reserve), "Свободные деньги считаются отдельным стратегическим блоком."),
      this.row("Минимальная доля резерва", this.formatPercent(config.minReserveShare), "Ниже этого уровня новые пополнения идут в резерв.")
    ];

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.CONSTITUTION, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return rows.length;
  },

  row: function(parameter, value, comment) {
    return {
      parameter: parameter,
      value: value,
      comment: comment || "",
      updatedAt: new Date()
    };
  }

};

function TI_InitializeConstitution() {
  var added = TI.Constitution.ensureDefaults();

  SpreadsheetApp.getUi().alert(
    "Инвестиционная конституция подготовлена.\n\n" +
    "Добавлено настроек: " + added
  );

  return added;
}
