/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Stabilization.gs
 * Версия: 2.1.0
 * Назначение:
 *   Регрессионные, UX и базовые performance-проверки проекта.
 * ============================================================
 */

var TI = TI || {};

TI.Stabilization = {

  SHEET: CORE.SHEETS.STABILIZATION,

  STATUS: Object.freeze({
    OK: "OK",
    WARNING: "Внимание",
    ERROR: "Ошибка"
  }),

  FORBIDDEN_UI_TERMS: Object.freeze([
    "Rule_ID",
    "Feature_ID",
    "Account_ID",
    "Strategy_ID",
    "cache_key",
    "payload",
    "JSON",
    "provider",
    "endpoint",
    "TTL",
    "UUID",
    "stacktrace"
  ]),

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var startedAt = Date.now();
    var rows = []
      .concat(this.regressionChecks())
      .concat(this.uxChecks())
      .concat(this.performanceChecks());
    var duration = Date.now() - startedAt;

    rows.push(this.row(
      this.STATUS.OK,
      "Стабилизация",
      "Время проверки",
      "Проверок выполнено: " + rows.length + ".",
      "",
      duration
    ));

    TI.TechLog.info(
      "Stabilization",
      "build",
      "Стабилизационные проверки выполнены.",
      "Проверок: " + rows.length,
      duration
    );

    return rows;
  },

  regressionChecks: function() {
    var critical = [
      ["Сделки", CORE.SHEETS.TRADES],
      ["Портфель", CORE.SHEETS.PORTFOLIO],
      ["Ребалансировка", CORE.SHEETS.REBALANCE],
      ["План сделок", CORE.SHEETS.TRADE_PLAN],
      ["Советник", CORE.SHEETS.ADVISOR],
      ["Главная", CORE.SHEETS.MAIN],
      ["Интеллект портфеля", CORE.SHEETS.PORTFOLIO_INTELLIGENCE]
    ];

    return critical.map(function(pair) {
      var sheet = SpreadsheetApp.getActive().getSheetByName(pair[1]);

      if (!sheet) {
        return TI.Stabilization.row(
          TI.Stabilization.STATUS.ERROR,
          "Регрессия",
          pair[0],
          "Лист не найден.",
          "Запустите Подготовить листы."
        );
      }

      var rows = Math.max(0, sheet.getLastRow() - 1);
      var status = rows > 0
        ? TI.Stabilization.STATUS.OK
        : TI.Stabilization.STATUS.WARNING;

      return TI.Stabilization.row(
        status,
        "Регрессия",
        pair[0],
        "Лист есть, строк данных: " + rows + ".",
        rows > 0 ? "" : "Запустите полную пакетную синхронизацию или соответствующий расчет."
      );
    });
  },

  uxChecks: function() {
    var rows = [];
    var advisor = TI.Data.sheetObjects(CORE.SHEETS.ADVISOR);
    var visibleSheets = [
      CORE.SHEETS.MAIN,
      CORE.SHEETS.ADVISOR,
      CORE.SHEETS.TRADE_PLAN,
      CORE.SHEETS.DECISIONS,
      CORE.SHEETS.REBALANCE,
      CORE.SHEETS.PORTFOLIO_INTELLIGENCE
    ];

    rows.push(this.checkAdvisorCompleteness(advisor));
    rows = rows.concat(this.checkForbiddenHeaders(visibleSheets));
    rows.push(this.checkHiddenDecisionRules());

    return rows;
  },

  checkAdvisorCompleteness: function(advisor) {
    if (!advisor || advisor.length === 0) {
      return this.row(
        this.STATUS.WARNING,
        "UX",
        "Советник",
        "Советник пока не содержит рекомендаций.",
        "Запустите Обновить советник."
      );
    }

    var missing = advisor.filter(function(row) {
      return !row.recommendation ||
        !row.reason ||
        !row.confidence ||
        !row.risk ||
        !row.nextStep;
    });

    return this.row(
      missing.length === 0 ? this.STATUS.OK : this.STATUS.WARNING,
      "UX",
      "Полнота рекомендаций",
      "Рекомендаций без действия, причины, уверенности, риска или следующего шага: " + missing.length + ".",
      missing.length === 0 ? "" : "Пересоберите Советник после обновления схемы."
    );
  },

  checkForbiddenHeaders: function(sheetNames) {
    var rows = [];

    sheetNames.forEach(function(sheetName) {
      var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);

      if (!sheet || sheet.getLastRow() < 1) {
        return;
      }

      var headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0]
        .map(function(value) { return String(value || ""); });
      var found = TI.Stabilization.FORBIDDEN_UI_TERMS.filter(function(term) {
        return headers.some(function(header) {
          return header.indexOf(term) >= 0;
        });
      });

      rows.push(TI.Stabilization.row(
        found.length === 0 ? TI.Stabilization.STATUS.OK : TI.Stabilization.STATUS.WARNING,
        "UX",
        "Технические термины: " + sheetName,
        found.length === 0
          ? "В заголовках не найдено запрещенных технических терминов."
          : "Найдены термины: " + found.join(", ") + ".",
        found.length === 0 ? "" : "Переименуйте или скройте технические колонки."
      ));
    });

    return rows;
  },

  checkHiddenDecisionRules: function() {
    var columns = Schema.getColumns(CORE.SHEETS.DECISIONS);
    var rules = columns.filter(function(col) {
      return col.field === "rules";
    })[0];

    return this.row(
      rules && rules.hidden
        ? this.STATUS.OK
        : this.STATUS.WARNING,
      "UX",
      "Внутренние правила в решениях",
      rules && rules.hidden
        ? "Техническая колонка правил скрыта."
        : "Колонка с внутренними правилами видима пользователю.",
      rules && rules.hidden ? "" : "Скройте колонку правил в схеме решений."
    );
  },

  performanceChecks: function() {
    var logRows = TI.Data.sheetObjects(CORE.SHEETS.TECH_LOG);
    var measured = logRows.filter(function(row) {
      return Number(row.durationMs) > 0;
    }).length;
    var cacheRows = TI.Data.sheetObjects(CORE.SHEETS.DATA_CACHE).length;

    return [
      this.row(
        measured > 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "Производительность",
        "Замеры времени",
        measured > 0
          ? "Замеры времени выполнения доступны."
          : "Замеры времени выполнения отсутствуют.",
        measured > 0 ? "" : "Запустите smoke-тесты или стабилизационные проверки."
      ),
      this.row(
        cacheRows > 0 ? this.STATUS.OK : this.STATUS.WARNING,
        "Производительность",
        "Данные источников",
        "Строк данных источников: " + cacheRows + ".",
        cacheRows > 0 ? "" : "Запустите обновление данных или проверку источников."
      )
    ];
  },

  row: function(status, area, check, message, action, durationMs) {
    return {
      status: status,
      area: area,
      check: check,
      message: message,
      action: action || "",
      durationMs: durationMs === undefined ? "" : durationMs,
      updatedAt: new Date()
    };
  },

  write: function(rows) {
    var sheet = this.prepare();

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    if (!rows || rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.STABILIZATION, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
    return values.length;
  },

  rebuild: function() {
    return this.write(this.build());
  }

};

function TI_RunStabilizationChecks() {
  var rows = TI.Stabilization.rebuild();

  SpreadsheetApp.getUi().alert(
    "Стабилизационные проверки завершены.\n\n" +
    "Проверок: " + rows
  );

  return rows;
}
