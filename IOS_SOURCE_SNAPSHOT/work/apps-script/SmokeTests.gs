/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: SmokeTests.gs
 * Версия: 1.0.0
 * Назначение:
 *   Быстрые проверки инфраструктуры проекта.
 * ============================================================
 */

var TI = TI || {};

TI.SmokeTests = {

  SHEET: CORE.SHEETS.SMOKE_TESTS,

  STATUS: Object.freeze({
    OK: "OK",
    WARNING: "Внимание",
    ERROR: "Ошибка"
  }),

  /**
   * Запустить все smoke-тесты.
   * @return {Object[]}
   */
  runAll: function() {
    var tests = [
      ["Ping", TI_TestPing],
      ["Чтение настроек", TI_TestReadSettings],
      ["Запись технического журнала", TI_TestWriteLog],
      ["Слой источников данных", TI_TestProviders],
      ["CacheService", TI_TestCache],
      ["Данные источников", TI_TestDataCache],
      ["Факты и оценки", TI_TestKnowledgeEngine],
      ["Счета и стратегии", TI_TestMultiAccount],
      ["Здоровье портфеля", TI_TestPortfolioHealth],
      ["Интеллект портфеля", TI_TestPortfolioIntelligence],
      ["Стабилизация", TI_TestStabilization],
      ["UI", TI_TestUI],
      ["Анализ облигаций", TI_TestBondEngine],
      ["Единая оценка активов", TI_TestAssetScoring],
      ["Индекс возможностей", TI_TestCOI],
      ["Правила", TI_TestRuleEngine],
      ["Решения", TI_TestDecisionEngine]
    ];

    return tests.map(function(test) {
      return TI.SmokeTests.runOne(test[0], test[1]);
    });
  },

  /**
   * Подготовить лист результатов smoke-тестов.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Записать результаты smoke-тестов в отдельный лист.
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

    var now = new Date();
    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.SMOKE_TESTS, {
        name: row.name,
        status: row.status,
        message: row.message,
        durationMs: row.durationMs,
        details: row.details,
        updatedAt: now
      });
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  },

  /**
   * Запустить тесты, записать результат и вернуть строки.
   * @return {Object[]}
   */
  rebuild: function() {
    var rows = this.runAll();

    this.write(rows);

    return rows;
  },

  /**
   * Запустить один тест с логированием.
   * @param {string} name
   * @param {Function} callback
   * @return {Object}
   */
  runOne: function(name, callback) {
    var startedAt = Date.now();

    try {
      var result = callback();
      var row = this.normalizeResult(name, result, Date.now() - startedAt);

      TI.TechLog.write(
        row.status === this.STATUS.OK
          ? TI.TechLog.LEVELS.INFO
          : TI.TechLog.LEVELS.WARNING,
        "SmokeTests",
        name,
        row.message,
        row.details,
        row.durationMs
      );

      return row;
    } catch (e) {
      var errorRow = {
        name: name,
        status: this.STATUS.ERROR,
        message: e.message || String(e),
        details: e.stack || "",
        durationMs: Date.now() - startedAt
      };

      TI.TechLog.error(
        "SmokeTests",
        name,
        errorRow.message,
        errorRow.details,
        errorRow.durationMs
      );

      return errorRow;
    }
  },

  normalizeResult: function(name, result, durationMs) {
    if (!result || typeof result !== "object") {
      result = {
        status: this.STATUS.OK,
        message: "Проверка выполнена.",
        details: ""
      };
    }

    return {
      name: name,
      status: result.status || this.STATUS.OK,
      message: result.message || "Проверка выполнена.",
      details: result.details || "",
      durationMs: durationMs
    };
  },

  formatSummary: function(rows) {
    var errors = rows.filter(function(row) {
      return row.status === TI.SmokeTests.STATUS.ERROR;
    }).length;
    var warnings = rows.filter(function(row) {
      return row.status === TI.SmokeTests.STATUS.WARNING;
    }).length;

    return "Smoke-тесты завершены.\n\n" +
      "Всего: " + rows.length + "\n" +
      "Ошибок: " + errors + "\n" +
      "Предупреждений: " + warnings;
  }

};

function TI_TestPing() {
  return {
    status: TI.SmokeTests.STATUS.OK,
    message: "Проект отвечает. Версия: " + CORE.PROJECT.VERSION + "."
  };
}

function TI_TestReadSettings() {
  var map = TI.Settings.readMap();

  return {
    status: TI.SmokeTests.STATUS.OK,
    message: "Лист настроек прочитан.",
    details: "Параметров найдено: " + Object.keys(map).length
  };
}

function TI_TestWriteLog() {
  var row = TI.TechLog.info(
    "SmokeTests",
    "TI_TestWriteLog",
    "Проверочная запись технического журнала.",
    ""
  );

  return {
    status: row ? TI.SmokeTests.STATUS.OK : TI.SmokeTests.STATUS.ERROR,
    message: row ? "Технический журнал доступен." : "Запись не создана."
  };
}

function TI_TestProviders() {
  var hasApi = !!(TI.Api && TI.Api.call);
  var hasProviders = !!(TI.Providers && TI.Providers.tinvest);
  var hasAccountsProvider = !!(TI.Providers && TI.Providers.users);
  var hasPortfolioProvider = !!(TI.Providers && TI.Providers.operations);

  if (hasApi && hasProviders && hasAccountsProvider && hasPortfolioProvider) {
    return {
      status: TI.SmokeTests.STATUS.OK,
      message: "Базовые источники данных доступны."
    };
  }

  return {
    status: TI.SmokeTests.STATUS.WARNING,
    message: "Часть источников данных не найдена.",
    details: "Клиент: " + hasApi +
      ", общий слой: " + hasProviders +
      ", счета: " + hasAccountsProvider +
      ", операции: " + hasPortfolioProvider
  };
}

function TI_TestCache() {
  var key = "smoke_test_" + Date.now();
  var cache = TI_GetCache();

  cache.put(key, "ok", 30);

  return {
    status: cache.get(key) === "ok"
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.ERROR,
    message: "CacheService проверен."
  };
}

function TI_TestDataCache() {
  var key = "smoke:data-cache";
  var value = {
    ok: true,
    updatedAt: new Date().toISOString()
  };

  TI.DataCache.put(
    key,
    "SmokeTests",
    value,
    60,
    "Проверка листа данных источников."
  );

  var cached = TI.DataCache.get(key);

  return {
    status: cached && cached.ok === true
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.ERROR,
    message: "Лист данных источников проверен."
  };
}

function TI_TestKnowledgeEngine() {
  var hasEngine = !!(TI.KnowledgeEngine && TI.KnowledgeEngine.buildFacts);
  var hasSheets =
    !!CORE.SHEETS.FACTS &&
    !!CORE.SHEETS.FEATURES &&
    !!CORE.SHEETS.SCORES;

  return {
    status: hasEngine && hasSheets
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasEngine
      ? "Факты и оценки доступны."
      : "Модуль фактов и оценок не найден.",
    details: "Листы фактов/признаков/оценок: " + hasSheets
  };
}

function TI_TestMultiAccount() {
  var hasModule = !!(TI.MultiAccount && TI.MultiAccount.ensureDefaults);
  var hasSheets =
    !!CORE.SHEETS.ACCOUNTS &&
    !!CORE.SHEETS.STRATEGIES &&
    !!CORE.SHEETS.ACCOUNT_STRATEGIES;

  return {
    status: hasModule && hasSheets
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Слой счетов и стратегий доступен."
      : "Слой счетов и стратегий не найден.",
    details: "Листы счетов/стратегий/связей: " + hasSheets
  };
}

function TI_TestPortfolioHealth() {
  var hasModule = !!(TI.PortfolioHealth && TI.PortfolioHealth.build);
  var hasSheet = !!CORE.SHEETS.PORTFOLIO_HEALTH;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Здоровье портфеля доступно."
      : "Здоровье портфеля не найдено.",
    details: "Лист здоровья портфеля: " + hasSheet
  };
}

function TI_TestPortfolioIntelligence() {
  var hasModule = !!(TI.PortfolioIntelligence && TI.PortfolioIntelligence.build);
  var hasSheet = !!CORE.SHEETS.PORTFOLIO_INTELLIGENCE;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Интеллект портфеля доступен."
      : "Интеллект портфеля не найден.",
    details: "Лист интеллекта портфеля: " + hasSheet
  };
}

function TI_TestStabilization() {
  var hasModule = !!(TI.Stabilization && TI.Stabilization.build);
  var hasSheet = !!CORE.SHEETS.STABILIZATION;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Стабилизационный слой доступен."
      : "Стабилизационный слой не найден.",
    details: "Лист стабилизации: " + hasSheet
  };
}

function TI_TestUI() {
  var hasModule = !!(TI.UI && TI.UI.applyAll);

  return {
    status: hasModule
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "UI-слой доступен."
      : "UI-слой не найден.",
    details: "Оформление Главной, Советника и Плана сделок: " + hasModule
  };
}

function TI_TestBondEngine() {
  var hasModule = !!(TI.BondEngine && TI.BondEngine.build);
  var hasSheet = !!CORE.SHEETS.BOND_ANALYSIS;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Анализ облигаций доступен."
      : "Анализ облигаций не найден.",
    details: "Лист анализа облигаций: " + hasSheet
  };
}

function TI_TestAssetScoring() {
  var hasModule = !!(TI.AssetScoring && TI.AssetScoring.build);
  var hasSheet = !!CORE.SHEETS.ASSET_SCORING;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Единая оценка активов доступна."
      : "Единая оценка активов не найдена.",
    details: "Лист оценки активов: " + hasSheet
  };
}

function TI_TestCOI() {
  var hasModule = !!(TI.COI && TI.COI.build);
  var hasSheet = !!CORE.SHEETS.COI;

  return {
    status: hasModule && hasSheet
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasModule
      ? "Индекс возможностей доступен."
      : "Индекс возможностей не найден.",
    details: "Лист индекса возможностей: " + hasSheet
  };
}

function TI_TestRuleEngine() {
  var hasRuleEngine = !!(TI.RuleEngine && TI.RuleEngine.evaluate);
  var defaults = hasRuleEngine ? TI.RuleEngine.defaults().length : 0;

  return {
    status: hasRuleEngine && defaults > 0
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasRuleEngine
      ? "Правила доступны."
      : "Модуль правил не найден.",
    details: "Правил по умолчанию: " + defaults
  };
}

function TI_TestDecisionEngine() {
  var hasDecisionEngine = !!(TI.DecisionEngine && TI.DecisionEngine.decide);
  var hasTradePlanIntegration = !!(TI.TradePlan && TI.TradePlan.enrichRow);

  return {
    status: hasDecisionEngine && hasTradePlanIntegration
      ? TI.SmokeTests.STATUS.OK
      : TI.SmokeTests.STATUS.WARNING,
    message: hasDecisionEngine
      ? "Решения доступны и подключены к плану сделок."
      : "Модуль решений не найден.",
    details: "Связь с планом сделок: " + hasTradePlanIntegration
  };
}

function TI_RunSmokeTests() {
  var rows = TI_RunSmokeTestsApi();
  var text = TI.SmokeTests.formatSummary(rows);

  SpreadsheetApp.getUi().alert(text);

  return rows;
}

function TI_RunSmokeTestsApi() {
  return TI.SmokeTests.rebuild();
}
