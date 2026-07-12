/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Rebalance.gs
 * Версия: 1.1.0
 * Назначение:
 *   Расчет отклонений портфеля от целевых долей стратегии.
 *
 * История изменений:
 *   1.1.0 - Добавлены цели по тикеру, типу инструмента, отрасли и эмитенту.
 *   1.0.0 - Первый расчет рекомендаций по ребалансировке.
 * ============================================================
 */

var TI = TI || {};

TI.Rebalance = {

  SHEET: CORE.SHEETS.REBALANCE,
  STRATEGY_SHEET: CORE.SHEETS.STRATEGY,

  TARGET_KINDS: Object.freeze({
    TICKER: "Тикер",
    INSTRUMENT_TYPE: "Тип инструмента",
    SECTOR: "Отрасль",
    ISSUER: "Эмитент",
    RESERVE: "Резерв"
  }),

  ALL_ACCOUNTS: "Все счета",

  TARGET_ALIASES: Object.freeze({
    "тикер": "Тикер",
    "бумага": "Тикер",
    "инструмент": "Тикер",
    "тип": "Тип инструмента",
    "тип инструмента": "Тип инструмента",
    "класс": "Тип инструмента",
    "отрасль": "Отрасль",
    "сектор": "Отрасль",
    "эмитент": "Эмитент",
    "эмитенты": "Эмитент",
    "резерв": "Резерв",
    "свободные деньги": "Резерв",
    "кэш": "Резерв"
  }),

  TYPE_ALIASES: Object.freeze({
    "share": "Акции",
    "stock": "Акции",
    "акция": "Акции",
    "акции": "Акции",
    "bond": "Облигации",
    "облигация": "Облигации",
    "облигации": "Облигации",
    "etf": "Фонды",
    "fund": "Фонды",
    "фонды": "Фонды",
    "фонд": "Фонды"
  }),

  /**
   * Подготовить лист ребалансировки.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить рекомендации по ребалансировке.
   * @return {Object[]}
   */
  build: function() {
    var portfolio = TI.Data.portfolio();

    if (portfolio.length === 0) {
      portfolio = TI.Data.portfolioFromFifoLots();
    }

    var targets = this.readTargets();

    return this.calculate(portfolio, targets);
  },

  /**
   * Прочитать целевые доли из листа стратегии.
   * Новый формат: Разрез / Значение / Целевая доля.
   * Старый формат тоже поддерживается: Тикер / Доля.
   * @return {Object[]}
   */
  readTargets: function() {
    var sheet = Schema.prepareSheet(this.STRATEGY_SHEET);
    var values = sheet.getDataRange().getValues();
    var targets = [];

    if (values.length <= 1) {
      return targets;
    }

    var headers = values.shift();
    var fieldsByTitle = TI.FIFO.fieldsByTitle(this.STRATEGY_SHEET);

    values.forEach(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      var target = TI.Rebalance.parseTarget(item);

      if (target) {
        targets.push(target);
      }
    });

    return targets;
  },

  /**
   * Преобразовать строку стратегии в цель.
   * @param {Object} item
   * @return {Object|null}
   */
  parseTarget: function(item) {
    var parameter = String(item.parameter || "").trim();
    var value = String(item.value || "").trim();
    var manualShare = this.parseShare(item.manualTargetShare);
    var share = manualShare !== null
      ? manualShare
      : this.parseShare(item.targetShare);
    var kind = this.normalizeTargetKind(parameter);
    var name = value;

    if (!kind) {
      kind = this.TARGET_KINDS.TICKER;
      name = parameter;
      share = this.parseShare(item.value);
    }

    if (!name || share === null) {
      return null;
    }

    return {
      accountName: this.normalizeAccountName(item.accountName),
      kind: kind,
      name: this.normalizeTargetName(kind, name),
      targetShare: share,
      manual: manualShare !== null
    };
  },

  /**
   * Нормализовать название разреза.
   * @param {string} value
   * @return {string}
   */
  normalizeTargetKind: function(value) {
    var key = String(value || "").trim().toLowerCase();

    return this.TARGET_ALIASES[key] || "";
  },

  /**
   * Нормализовать счет стратегии.
   * @param {string} value
   * @return {string}
   */
  normalizeAccountName: function(value) {
    value = String(value || "").trim();

    if (!value || value.toLowerCase() === "все счета") {
      return "";
    }

    return value;
  },

  /**
   * Нормализовать значение цели.
   * @param {string} kind
   * @param {string} value
   * @return {string}
   */
  normalizeTargetName: function(kind, value) {
    value = String(value || "").trim();

    if (kind === this.TARGET_KINDS.TICKER) {
      return value.toUpperCase();
    }

    if (kind === this.TARGET_KINDS.INSTRUMENT_TYPE) {
      return this.normalizeInstrumentType(value);
    }

    return value;
  },

  /**
   * Нормализовать тип инструмента.
   * @param {string} value
   * @return {string}
   */
  normalizeInstrumentType: function(value) {
    var key = String(value || "").trim().toLowerCase();

    return this.TYPE_ALIASES[key] || value;
  },

  /**
   * Преобразовать значение доли в число.
   * @param {*} value
   * @return {number|null}
   */
  parseShare: function(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return value > 1 ? value / 100 : value;
    }

    var text = String(value)
      .trim()
      .replace(",", ".")
      .replace("%", "");

    if (text === "") {
      return null;
    }

    var number = Number(text);

    if (isNaN(number)) {
      return null;
    }

    return number > 1 ? number / 100 : number;
  },

  /**
   * Рассчитать отклонения от стратегии.
   * @param {Object[]} portfolio
   * @param {Object[]} targets
   * @return {Object[]}
   */
  calculate: function(portfolio, targets) {
    var cashByAccount = this.cashByAccountName();

    return targets.map(function(target) {
      var scope = TI.Rebalance.portfolioForTarget(portfolio, target);
      var accountName = target.accountName || TI.Rebalance.ALL_ACCOUNTS;
      var availableCash = cashByAccount.hasOwnProperty(accountName)
        ? cashByAccount[accountName]
        : "";
      var currentCash = availableCash !== ""
        ? Number(availableCash) || 0
        : 0;
      var portfolioValue = TI.Rebalance.totalMarketValue(scope);
      var isReserve = target.kind === TI.Rebalance.TARGET_KINDS.RESERVE;
      var totalMarketValue = isReserve
        ? portfolioValue + currentCash
        : portfolioValue;
      var currentValue = isReserve
        ? currentCash
        : TI.Rebalance.currentValue(scope, target);
      var actualShare = totalMarketValue > 0
        ? currentValue / totalMarketValue
        : 0;
      var deviation = actualShare - target.targetShare;
      var targetValue = totalMarketValue * target.targetShare;
      var amount = targetValue - currentValue;
      var tradePlan = isReserve
        ? { currentPrice: "", lot: "", lots: "", units: "", amount: "", ambiguous: false }
        : TI.Rebalance.tradePlan(scope, target, amount);

      return {
        accountName: accountName,
        targetKind: target.kind,
        targetName: target.name,
        targetShare: target.targetShare,
        targetValue: targetValue,
        currentValue: currentValue,
        actualShare: actualShare,
        deviation: deviation,
        tradeAmount: amount,
        currentPrice: tradePlan.currentPrice,
        lot: tradePlan.lot,
        lotsToTrade: tradePlan.lots,
        unitsToTrade: tradePlan.units,
        roundedAmount: tradePlan.amount,
        availableCash: availableCash,
        action: TI.Rebalance.actionText(amount, deviation, availableCash, tradePlan)
      };
    });
  },

  /**
   * Рассчитать количество бумаг и лотов для рекомендации.
   * @param {Object[]} portfolio
   * @param {Object} target
   * @param {number} amount
   * @return {{currentPrice:(number|string),lot:(number|string),lots:(number|string),units:(number|string),amount:(number|string),ambiguous:boolean}}
   */
  tradePlan: function(portfolio, target, amount) {
    var positions = portfolio.filter(function(position) {
      return TI.Rebalance.matchesTarget(position, target);
    });

    if (target.kind !== this.TARGET_KINDS.TICKER && positions.length !== 1) {
      return {
        currentPrice: "",
        lot: "",
        lots: "",
        units: "",
        amount: "",
        ambiguous: positions.length > 1
      };
    }

    if (positions.length === 0) {
      return this.tradePlanFromDirectory(target, amount);
    }

    return this.tradePlanFromPosition(positions[0], amount);
  },

  /**
   * Рассчитать заявку по позиции портфеля.
   * @param {Object} position
   * @param {number} amount
   * @return {Object}
   */
  tradePlanFromPosition: function(position, amount) {
    return this.roundByLot(
      amount,
      Number(position.currentPrice) || 0,
      Number(position.lot) || 1
    );
  },

  /**
   * Рассчитать заявку по справочнику для тикера, которого нет в портфеле.
   * @param {Object} target
   * @param {number} amount
   * @return {Object}
   */
  tradePlanFromDirectory: function(target, amount) {
    if (target.kind !== this.TARGET_KINDS.TICKER) {
      return {
        currentPrice: "",
        lot: "",
        lots: "",
        units: "",
        amount: "",
        ambiguous: false
      };
    }

    var meta = this.directoryByTicker()[target.name];

    if (!meta) {
      return {
        currentPrice: "",
        lot: "",
        lots: "",
        units: "",
        amount: "",
        ambiguous: false
      };
    }

    return this.roundByLot(amount, meta.currentPrice, meta.lot);
  },

  /**
   * Округлить сумму операции до целых лотов.
   * @param {number} amount
   * @param {number} currentPrice
   * @param {number} lot
   * @return {Object}
   */
  roundByLot: function(amount, currentPrice, lot) {
    currentPrice = Number(currentPrice) || 0;
    lot = Math.max(1, Number(lot) || 1);

    if (!currentPrice || !amount) {
      return {
        currentPrice: currentPrice || "",
        lot: lot,
        lots: "",
        units: "",
        amount: "",
        ambiguous: false
      };
    }

    var lotAmount = currentPrice * lot;
    var rawLots = Math.abs(amount) / lotAmount;
    var lots = amount > 0
      ? Math.floor(rawLots)
      : Math.ceil(rawLots);

    if (lots < 1) {
      lots = amount > 0 && rawLots > 0 ? 1 : 0;
    }

    var units = lots * lot;
    var roundedAmount = units * currentPrice * (amount < 0 ? -1 : 1);

    return {
      currentPrice: currentPrice,
      lot: lot,
      lots: lots,
      units: units,
      amount: roundedAmount,
      ambiguous: false
    };
  },

  /**
   * Справочник по тикеру для расчета бумаг вне портфеля.
   * @return {Object}
   */
  directoryByTicker: function() {
    if (this._directoryByTicker) {
      return this._directoryByTicker;
    }

    var map = {};

    try {
      TI.Directory.readExisting().forEach(function(row) {
        var ticker = String(row.ticker || "").trim().toUpperCase();

        if (!ticker) {
          return;
        }

        map[ticker] = {
          currentPrice: TI.Utils.number(row.lastPrice),
          lot: Math.max(1, TI.Utils.number(row.lot))
        };
      });
    } catch (e) {
      Logger.log(e);
    }

    this._directoryByTicker = map;
    return map;
  },

  /**
   * Свободные деньги по счетам без падения расчета при ошибке API.
   * @return {Object}
   */
  cashByAccountName: function() {
    if (TI.BatchSync && TI.BatchSync.isNoApiMode && TI.BatchSync.isNoApiMode()) {
      return {};
    }

    try {
      return TI.Accounts.cashByAccountName();
    } catch (e) {
      Logger.log(e);
      return {};
    }
  },

  /**
   * Портфель, к которому относится цель стратегии.
   * @param {Object[]} portfolio
   * @param {Object} target
   * @return {Object[]}
   */
  portfolioForTarget: function(portfolio, target) {
    if (!target.accountName) {
      return portfolio;
    }

    return portfolio.filter(function(position) {
      return String(position.accountName || "").trim().toLowerCase() ===
        String(target.accountName || "").trim().toLowerCase();
    });
  },

  /**
   * Рыночная стоимость выбранной части портфеля.
   * @param {Object[]} portfolio
   * @return {number}
   */
  totalMarketValue: function(portfolio) {
    return portfolio.reduce(function(sum, position) {
      return sum + (Number(position.marketValue) || 0);
    }, 0);
  },

  /**
   * Текущая стоимость группы.
   * @param {Object[]} portfolio
   * @param {Object} target
   * @return {number}
   */
  currentValue: function(portfolio, target) {
    return portfolio.reduce(function(sum, position) {
      return TI.Rebalance.matchesTarget(position, target)
        ? sum + (Number(position.marketValue) || 0)
        : sum;
    }, 0);
  },

  /**
   * Проверить, входит ли позиция в цель стратегии.
   * @param {Object} position
   * @param {Object} target
   * @return {boolean}
   */
  matchesTarget: function(position, target) {
    var value = "";

    if (target.kind === this.TARGET_KINDS.RESERVE) {
      return false;
    }

    if (target.kind === this.TARGET_KINDS.TICKER) {
      value = String(position.ticker || "").trim().toUpperCase();
    } else if (target.kind === this.TARGET_KINDS.INSTRUMENT_TYPE) {
      value = this.normalizeInstrumentType(position.instrumentType || "");
    } else if (target.kind === this.TARGET_KINDS.SECTOR) {
      value = String(position.sector || "").trim();
    } else if (target.kind === this.TARGET_KINDS.ISSUER) {
      value = String(position.issuer || "").trim();
    }

    return this.compareValue(value, target.name, target.kind);
  },

  /**
   * Сравнить значение портфеля и цель стратегии.
   * @param {string} actual
   * @param {string} target
   * @param {string} kind
   * @return {boolean}
   */
  compareValue: function(actual, target, kind) {
    if (kind === this.TARGET_KINDS.TICKER) {
      return String(actual || "").trim().toUpperCase() ===
        String(target || "").trim().toUpperCase();
    }

    if (kind === this.TARGET_KINDS.INSTRUMENT_TYPE) {
      return this.normalizeInstrumentType(actual) ===
        this.normalizeInstrumentType(target);
    }

    return String(actual || "").trim().toLowerCase() ===
      String(target || "").trim().toLowerCase();
  },

  /**
   * Сформировать текст рекомендации.
   * @param {number} amount
   * @param {number} deviation
   * @param {number|string=} availableCash
   * @param {Object=} tradePlan
   * @return {string}
   */
  actionText: function(amount, deviation, availableCash, tradePlan) {
    var threshold = TI.Settings.getRebalanceThreshold();
    var lotText = this.tradePlanText(tradePlan);

    if (Math.abs(deviation) <= threshold) {
      return "В пределах допуска";
    }

    if (amount > 0) {
      var cashAmount = tradePlan && Number(tradePlan.amount) > 0
        ? Number(tradePlan.amount)
        : amount;

      if (availableCash !== "" && Number(availableCash) < cashAmount) {
        return "Докупить примерно на " + this.formatMoney(amount) +
          lotText +
          ", свободно на счёте " + this.formatMoney(availableCash);
      }

      return "Докупить примерно на " + this.formatMoney(amount) + lotText;
    }

    return "Сократить примерно на " + this.formatMoney(Math.abs(amount)) +
      lotText;
  },

  /**
   * Текст по количеству бумаг и лотов.
   * @param {Object=} tradePlan
   * @return {string}
   */
  tradePlanText: function(tradePlan) {
    if (!tradePlan) {
      return "";
    }

    if (tradePlan.ambiguous) {
      return ", распределите сумму между бумагами группы";
    }

    if (!tradePlan.units) {
      return "";
    }

    return ", " + tradePlan.units + " шт. (" +
      tradePlan.lots + " лот.)";
  },

  /**
   * Отформатировать сумму для рекомендации.
   * @param {number} value
   * @return {string}
   */
  formatMoney: function(value) {
    return Utilities.formatString("%.2f RUB", Number(value) || 0);
  },

  /**
   * Записать рекомендации в лист.
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
      return Schema.buildRow(CORE.SHEETS.REBALANCE, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Пересчитать ребалансировку и вернуть количество строк.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  },

  /**
   * Проверка модуля.
   * @return {Object[]}
   */
  test: function() {
    return this.build();
  }

};

/**
 * Рассчитать ребалансировку.
 * @return {number}
 */
function TI_BuildRebalance() {
  var rows = TI.Rebalance.rebuild();

  SpreadsheetApp.getUi().alert(
    "Ребалансировка рассчитана.\n\n" +
    "Строк: " + rows
  );

  return rows;
}

/**
 * Проверка ребалансировки.
 * @return {Object[]}
 */
function TI_TestRebalance() {
  var rows = TI.Rebalance.test();

  Logger.log(JSON.stringify(rows, null, 2));

  SpreadsheetApp.getUi().alert(
    "Ребалансировка рассчитана.\n\n" +
    "Строк: " + rows.length
  );

  return rows;
}

