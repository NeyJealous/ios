/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Diagnostics.gs
 * Версия: 1.0.0
 * Назначение:
 *   Проверка готовности и качества данных проекта.
 *
 * История изменений:
 *   1.0.0 - Базовые проверки токена, счетов, стратегии, FIFO, цен и справочника.
 * ============================================================
 */

var TI = TI || {};

TI.Diagnostics = {

  SHEET: CORE.SHEETS.DIAGNOSTICS,

  STATUS: Object.freeze({
    OK: "OK",
    WARNING: "Внимание",
    ERROR: "Ошибка"
  }),

  /**
   * Подготовить лист диагностики.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Выполнить диагностику.
   * @return {Object[]}
   */
  build: function() {
    var checks = [];
    var context = this.context();

    checks = checks
      .concat(this.tokenChecks())
      .concat(this.accountChecks())
      .concat(this.sheetChecks())
      .concat(this.strategyChecks())
      .concat(this.directoryChecks(context.portfolio))
      .concat(this.fifoChecks(context.fifo))
      .concat(this.portfolioChecks(context.portfolio))
      .concat(this.tradePlanChecks())
      .concat(this.batchSyncChecks())
      .concat(this.directoryBatchChecks())
      .concat(this.inflationChecks());

    return this.sort(checks);
  },

  /**
   * Общий контекст, чтобы не пересчитывать тяжелые блоки несколько раз.
   * @return {{portfolio:Object[], fifo:Object}}
   */
  context: function() {
    var cachedPortfolio = TI.Data.portfolio();

    if (cachedPortfolio.length > 0) {
      return {
        portfolio: cachedPortfolio,
        fifo: {
          lots: TI.Data.fifoLots(),
          sales: TI.Data.fifoSales(),
          errors: TI.Data.fifoErrors()
        }
      };
    }

    var trades = TI.Trades.toObjects(TI.Operations.trades(TI.Operations.get()));
    var fifo = TI.FIFO.calculate(trades);
    var portfolio = TI.Portfolio.aggregateLots(fifo.lots);

    TI.Portfolio.enrichMetadata(portfolio);
    TI.Portfolio.applyPrices(portfolio);

    return {
      portfolio: portfolio,
      fifo: fifo
    };
  },

  /**
   * Проверить токен.
   * @return {Object[]}
   */
  tokenChecks: function() {
    return [this.row(
      TI_HasToken() ? this.STATUS.OK : this.STATUS.ERROR,
      "API",
      "Токен",
      TI_HasToken()
        ? "Токен Т-Инвестиций сохранён."
        : "Токен Т-Инвестиций не найден.",
      TI_HasToken()
        ? ""
        : "Откройте меню проекта и выберите Настроить токен."
    )];
  },

  /**
   * Проверить счета.
   * @return {Object[]}
   */
  accountChecks: function() {
    if (!TI_HasToken()) {
      return [this.row(
        this.STATUS.WARNING,
        "API",
        "Счета",
        "Проверка счетов пропущена, потому что токен не задан.",
        "Сначала сохраните токен."
      )];
    }

    try {
      var accounts = TI.Accounts.active();

      return [this.row(
        accounts.length > 0 ? this.STATUS.OK : this.STATUS.ERROR,
        "API",
        "Открытые счета",
        "Открытых счетов найдено: " + accounts.length + ".",
        accounts.length > 0
          ? ""
          : "Проверьте токен и наличие открытого брокерского счёта."
      )];
    } catch (e) {
      return [this.row(
        this.STATUS.ERROR,
        "API",
        "Открытые счета",
        e.message || String(e),
        "Проверьте токен и доступность API."
      )];
    }
  },

  /**
   * Проверить наличие ключевых листов.
   * @return {Object[]}
   */
  sheetChecks: function() {
    var ss = SpreadsheetApp.getActive();
    var names = [
      CORE.SHEETS.TRADES,
      CORE.SHEETS.PORTFOLIO,
      CORE.SHEETS.STRATEGY,
      CORE.SHEETS.DIRECTORY,
      CORE.SHEETS.INFLATION
    ];

    return names.map(function(name) {
      var exists = !!ss.getSheetByName(name);

      return TI.Diagnostics.row(
        exists ? TI.Diagnostics.STATUS.OK : TI.Diagnostics.STATUS.WARNING,
        "Листы",
        name,
        exists ? "Лист найден." : "Лист отсутствует.",
        exists ? "" : "Запустите Подготовить листы."
      );
    });
  },

  /**
   * Проверить стратегию.
   * @return {Object[]}
   */
  strategyChecks: function() {
    var targets = TI.Rebalance.readTargets();
    var rows = [];

    rows.push(this.row(
      targets.length > 0 ? this.STATUS.OK : this.STATUS.WARNING,
      "Стратегия",
      "Целевые доли",
      "Целей стратегии найдено: " + targets.length + ".",
      targets.length > 0
        ? ""
        : "Заполните лист Инвестиционная стратегия."
    ));

    rows = rows.concat(this.strategySumChecks(targets));

    return rows;
  },

  /**
   * Проверить суммы целевых долей по разрезам.
   * @param {Object[]} targets
   * @return {Object[]}
   */
  strategySumChecks: function(targets) {
    var sums = {};

    targets.forEach(function(target) {
      var account = target.accountName || TI.Rebalance.ALL_ACCOUNTS;
      var key = account + " / " + target.kind;

      sums[key] = (sums[key] || 0) +
        (Number(target.targetShare) || 0);
    });

    return Object.keys(sums).map(function(key) {
      var sum = sums[key];
      var valid = sum <= 1.000001;

      return TI.Diagnostics.row(
        valid ? TI.Diagnostics.STATUS.OK : TI.Diagnostics.STATUS.WARNING,
        "Стратегия",
        "Сумма долей: " + key,
        "Сумма целевых долей: " + TI.Diagnostics.formatPercent(sum) + ".",
        valid ? "" : "Уменьшите цели по этому разрезу до 100% или ниже."
      );
    });
  },

  /**
   * Проверить справочник.
   * @return {Object[]}
   */
  directoryChecks: function(portfolio) {
    var missing = portfolio.filter(function(position) {
      return !position.instrumentType || !position.sector || !position.issuer;
    });

    return [this.row(
      missing.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
      "Справочник",
      "Тип, отрасль, эмитент",
      missing.length === 0
        ? "Все позиции портфеля имеют данные для группировок."
        : "Позиций с неполными данными: " + missing.length + ".",
      missing.length === 0
        ? ""
        : "Дополните лист Справочник: " + this.tickersText(missing) + "."
    )];
  },

  /**
   * Проверить FIFO.
   * @return {Object[]}
   */
  fifoChecks: function(fifo) {
    return [this.row(
      fifo.errors.length === 0 ? this.STATUS.OK : this.STATUS.ERROR,
      "FIFO",
      "Ошибки покрытия продаж",
      "Ошибок FIFO: " + fifo.errors.length + ".",
      fifo.errors.length === 0
        ? ""
        : "Откройте лист Ошибки FIFO и проверьте продажи без покупок."
    )];
  },

  /**
   * Проверить портфель и цены.
   * @return {Object[]}
   */
  portfolioChecks: function(portfolio) {
    var missingPrices = portfolio.filter(function(position) {
      return Number(position.quantity) > 0 && !position.currentPrice;
    });
    var missingLots = portfolio.filter(function(position) {
      return Number(position.quantity) > 0 && !Number(position.lot);
    });

    return [
      this.row(
        portfolio.length > 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "Портфель",
        "Позиции",
        "Позиций в портфеле: " + portfolio.length + ".",
        portfolio.length > 0 ? "" : "Проверьте сделки и FIFO."
      ),
      this.row(
        missingPrices.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "Портфель",
        "Рыночные цены",
        "Позиций без текущей цены: " + missingPrices.length + ".",
        missingPrices.length === 0
          ? ""
          : "Запустите Обновить цены или проверьте FIGI/UID: " +
            this.tickersText(missingPrices) + "."
      ),
      this.row(
        missingLots.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "Портфель",
        "Лотность",
        "Позиций без лотности: " + missingLots.length + ".",
        missingLots.length === 0
          ? ""
          : "Проверьте лотность в справочнике: " +
            this.tickersText(missingLots) + "."
      )
    ];
  },

  /**
   * Проверить план сделок.
   * @return {Object[]}
   */
  tradePlanChecks: function() {
    var rows = [];

    try {
      rows = TI.TradePlan.build();
    } catch (e) {
      return [this.row(
        this.STATUS.WARNING,
        "План сделок",
        "Построение",
        e.message || String(e),
        "Проверьте ребалансировку, цены и свободные деньги по счетам."
      )];
    }

    var missingTickers = rows.filter(function(row) {
      return !String(row.ticker || "").trim();
    });
    var moneyProblems = rows.filter(function(row) {
      return String(row.status || "").trim() === "Недостаточно денег";
    });
    var lotProblems = rows.filter(function(row) {
      return String(row.status || "").trim() === "Меньше минимального лота";
    });

    return [
      this.row(
        rows.length > 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "План сделок",
        "Строки",
        "Строк плана сделок: " + rows.length + ".",
        rows.length > 0 ? "" : "Постройте план сделок или проверьте стратегию."
      ),
      this.row(
        missingTickers.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "План сделок",
        "Тикеры",
        "Строк без тикера: " + missingTickers.length + ".",
        missingTickers.length === 0
          ? ""
          : "Нужно распределить групповые цели между конкретными бумагами."
      ),
      this.row(
        moneyProblems.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "План сделок",
        "Свободные деньги",
        "Строк с нехваткой денег: " + moneyProblems.length + ".",
        moneyProblems.length === 0
          ? ""
          : "Пополните нужный счёт, уменьшите цель или выберите другой счёт."
      ),
      this.row(
        lotProblems.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "План сделок",
        "Минимальный лот",
        "Строк меньше минимального лота: " + lotProblems.length + ".",
        lotProblems.length === 0
          ? ""
          : "Накопите кэш или измените целевые доли."
      )
    ];
  },

  /**
   * Проверить состояние пакетной синхронизации.
   * @return {Object[]}
   */
  batchSyncChecks: function() {
    var state = TI.BatchSync.status();

    if (state.status === "error") {
      return [this.row(
        this.STATUS.ERROR,
        "Синхронизация",
        "Пакетная синхронизация",
        state.error || "Пакетная синхронизация завершилась с ошибкой.",
        "Откройте статус пакетной синхронизации или запустите её заново."
      )];
    }

    if (state.status === "running") {
      return [this.row(
        this.STATUS.WARNING,
        "Синхронизация",
        "Пакетная синхронизация",
        TI.BatchSync.statusText(state).replace(/\n/g, " "),
        "Дождитесь завершения или остановите пакетную синхронизацию."
      )];
    }

    return [this.row(
      this.STATUS.OK,
      "Синхронизация",
      "Пакетная синхронизация",
      TI.BatchSync.statusText(state).replace(/\n/g, " "),
      ""
    )];
  },

  /**
   * Проверить состояние пакетного обновления рыночного справочника.
   * @return {Object[]}
   */
  directoryBatchChecks: function() {
    var state = TI.DirectoryBatch.status();

    if (state.status === "error") {
      return [this.row(
        this.STATUS.ERROR,
        "Справочник",
        "Пакетное обновление рынка",
        state.error || "Пакетное обновление рынка завершилось с ошибкой.",
        "Откройте статус обновления рынка или запустите его заново."
      )];
    }

    if (state.status === "running") {
      return [this.row(
        this.STATUS.WARNING,
        "Справочник",
        "Пакетное обновление рынка",
        TI.DirectoryBatch.statusText(state).replace(/\n/g, " "),
        "Дождитесь завершения или остановите обновление рынка."
      )];
    }

    if (state.status === "stopped") {
      return [this.row(
        this.STATUS.WARNING,
        "Справочник",
        "Пакетное обновление рынка",
        TI.DirectoryBatch.statusText(state).replace(/\n/g, " "),
        "Запустите обновление всего рынка пакетно, если нужен полный справочник."
      )];
    }

    return [this.row(
      this.STATUS.OK,
      "Справочник",
      "Пакетное обновление рынка",
      TI.DirectoryBatch.statusText(state).replace(/\n/g, " "),
      ""
    )];
  },

  /**
   * Проверить инфляцию.
   * @return {Object[]}
   */
  inflationChecks: function() {
    var rows = TI.Inflation.readRows();
    var currentYear = new Date().getFullYear();
    var hasCurrentYear = rows.some(function(row) {
      return Number(row.year) === currentYear &&
        (row.usedInflation !== "" || row.officialInflation !== "");
    });

    return [this.row(
      hasCurrentYear ? this.STATUS.OK : this.STATUS.WARNING,
      "Инфляция",
      "Текущий год",
      hasCurrentYear
        ? "Инфляция за текущий год есть в таблице."
        : "Инфляция за " + currentYear + " год не заполнена.",
      hasCurrentYear
        ? ""
        : "Запустите Обновить инфляцию или введите инфляцию по ощущениям вручную."
    )];
  },

  /**
   * Создать строку диагностики.
   */
  row: function(status, area, check, message, action) {
    return {
      status: status,
      area: area,
      check: check,
      message: message,
      action: action || "",
      updatedAt: new Date()
    };
  },

  /**
   * Формат процента.
   * @param {number} value
   * @return {string}
   */
  formatPercent: function(value) {
    return Utilities.formatString("%.2f%%", (Number(value) || 0) * 100);
  },

  /**
   * Список тикеров.
   * @param {Object[]} rows
   * @return {string}
   */
  tickersText: function(rows) {
    var seen = {};
    var tickers = [];

    rows.forEach(function(row) {
      var ticker = String(row.ticker || "").trim();

      if (ticker && !seen[ticker]) {
        seen[ticker] = true;
        tickers.push(ticker);
      }
    });

    return tickers.slice(0, 10).join(", ") +
      (tickers.length > 10 ? " и ещё " + (tickers.length - 10) : "");
  },

  /**
   * Сортировка проверок.
   * @param {Object[]} rows
   * @return {Object[]}
   */
  sort: function(rows) {
    var weight = {
      "Ошибка": 1,
      "Внимание": 2,
      "OK": 3
    };

    return rows.sort(function(a, b) {
      var status = (weight[a.status] || 9) - (weight[b.status] || 9);

      if (status !== 0) {
        return status;
      }

      return String(a.area).localeCompare(String(b.area));
    });
  },

  /**
   * Записать диагностику.
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
      return Schema.buildRow(CORE.SHEETS.DIAGNOSTICS, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Пересчитать диагностику.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  }

};

/**
 * Запустить диагностику проекта.
 * @return {number}
 */
function TI_RunDiagnostics() {
  var rows = TI.Diagnostics.rebuild();

  SpreadsheetApp.getUi().alert(
    "Диагностика завершена.\n\n" +
    "Проверок: " + rows
  );

  return rows;
}

