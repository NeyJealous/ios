/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: UI.gs
 * Версия: 3.0.0
 * Назначение:
 *   Визуальная полировка пользовательских листов.
 * ============================================================
 */

var TI = TI || {};

TI.UI = {

  COLORS: Object.freeze({
    OK: "#d9ead3",
    WARNING: "#fff2cc",
    ERROR: "#f4cccc",
    TEXT: "#1f2933",
    MUTED: "#f3f6f8",
    HEADER: "#1f4e78"
  }),

  applyAll: function() {
    var startedAt = Date.now();

    this.applyDashboard();
    this.applyAdvisor();
    this.applyTradePlan();
    this.applyPortfolioIntelligence();
    this.hideTechnicalSheets();

    TI.TechLog.info(
      "UI",
      "applyAll",
      "Пользовательские листы оформлены.",
      "",
      Date.now() - startedAt
    );

    return true;
  },

  applyDashboard: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.MAIN);
    if (!sheet) return;

    this.basicSheet(sheet, "#0b5394");
    this.statusColors(sheet, CORE.SHEETS.MAIN, "status");
    this.sectionBands(sheet, CORE.SHEETS.MAIN, "section");
    sheet.setTabColor("#0b5394");
    sheet.setFrozenRows(1);

    try {
      sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), sheet.getLastColumn())
        .setFontSize(10)
        .setVerticalAlignment("middle");
      sheet.setRowHeights(2, Math.max(sheet.getLastRow() - 1, 1), 28);
    } catch (e) {}
  },

  applyAdvisor: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.ADVISOR);
    if (!sheet) return;

    this.basicSheet(sheet, "#38761d");
    this.priorityColors(sheet, CORE.SHEETS.ADVISOR, "priority");
    sheet.setTabColor("#38761d");

    this.setWidths(sheet, CORE.SHEETS.ADVISOR, {
      recommendation: 460,
      reason: 360,
      risk: 300,
      nextStep: 340,
      effect: 260
    });
  },

  applyTradePlan: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.TRADE_PLAN);
    if (!sheet) return;

    this.basicSheet(sheet, "#674ea7");
    this.statusColors(sheet, CORE.SHEETS.TRADE_PLAN, "status");
    sheet.setTabColor("#674ea7");
  },

  applyPortfolioIntelligence: function() {
    var sheet = SpreadsheetApp.getActive().getSheetByName(CORE.SHEETS.PORTFOLIO_INTELLIGENCE);
    if (!sheet) return;

    this.basicSheet(sheet, "#134f5c");
    this.decisionColors(sheet, CORE.SHEETS.PORTFOLIO_INTELLIGENCE, "decision");
    sheet.setTabColor("#134f5c");
  },

  basicSheet: function(sheet, headerColor) {
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    var lastRow = Math.max(sheet.getLastRow(), 1);

    sheet.getRange(1, 1, 1, lastColumn)
      .setBackground(headerColor || this.COLORS.HEADER)
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true);

    sheet.getRange(1, 1, lastRow, lastColumn)
      .setFontFamily("Arial")
      .setFontColor(this.COLORS.TEXT);

    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastColumn)
        .setWrap(true)
        .setVerticalAlignment("middle");
    }

    sheet.setFrozenRows(1);
  },

  statusColors: function(sheet, sheetName, field) {
    var column = Schema.getFieldIndex(sheetName, field) + 1;
    if (column <= 0 || sheet.getLastRow() <= 1) return;

    var range = sheet.getRange(2, column, sheet.getLastRow() - 1, 1);
    var values = range.getValues();

    values.forEach(function(row, index) {
      var value = String(row[0] || "");
      var color = "";

      if (value === "OK" || value === "В норме" || value === "Готово") color = TI.UI.COLORS.OK;
      else if (value === "Внимание" || value === "Пониженный приоритет") color = TI.UI.COLORS.WARNING;
      else if (value === "Ошибка" || value === "Проверить продажу" || value === "Недостаточно денег") color = TI.UI.COLORS.ERROR;

      if (color) sheet.getRange(index + 2, column).setBackground(color);
    });
  },

  priorityColors: function(sheet, sheetName, field) {
    var column = Schema.getFieldIndex(sheetName, field) + 1;
    if (column <= 0 || sheet.getLastRow() <= 1) return;

    sheet.getRange(2, column, sheet.getLastRow() - 1, 1)
      .getValues()
      .forEach(function(row, index) {
        var value = String(row[0] || "");
        var color = value === "Высокий"
          ? TI.UI.COLORS.ERROR
          : value === "Средний"
            ? TI.UI.COLORS.WARNING
            : TI.UI.COLORS.OK;
        sheet.getRange(index + 2, column).setBackground(color);
      });
  },

  decisionColors: function(sheet, sheetName, field) {
    var column = Schema.getFieldIndex(sheetName, field) + 1;
    if (column <= 0 || sheet.getLastRow() <= 1) return;

    sheet.getRange(2, column, sheet.getLastRow() - 1, 1)
      .getValues()
      .forEach(function(row, index) {
        var value = String(row[0] || "");
        var color = value.indexOf("Лучший") >= 0
          ? TI.UI.COLORS.OK
          : value === "Низкий приоритет"
            ? TI.UI.COLORS.WARNING
            : "";
        if (color) sheet.getRange(index + 2, column).setBackground(color);
      });
  },

  sectionBands: function(sheet, sheetName, field) {
    var column = Schema.getFieldIndex(sheetName, field) + 1;
    if (column <= 0 || sheet.getLastRow() <= 1) return;

    var lastColumn = sheet.getLastColumn();
    var previous = "";

    sheet.getRange(2, column, sheet.getLastRow() - 1, 1)
      .getValues()
      .forEach(function(row, index) {
        var value = String(row[0] || "");

        if (value && value !== previous) {
          sheet.getRange(index + 2, 1, 1, lastColumn)
            .setBackground(TI.UI.COLORS.MUTED)
            .setFontWeight("bold");
          previous = value;
        }
      });
  },

  setWidths: function(sheet, sheetName, widths) {
    Object.keys(widths || {}).forEach(function(field) {
      var column = Schema.getFieldIndex(sheetName, field) + 1;
      if (column > 0) {
        sheet.setColumnWidth(column, widths[field]);
      }
    });
  },

  hideTechnicalSheets: function() {
    var names = [
      CORE.SHEETS.SMOKE_TESTS,
      CORE.SHEETS.TECH_LOG,
      CORE.SHEETS.DATA_CACHE,
      CORE.SERVICE_SHEETS.API_OPERATIONS,
      CORE.SERVICE_SHEETS.API_ACCOUNTS,
      CORE.SERVICE_SHEETS.CACHE,
      CORE.SERVICE_SHEETS.LOG
    ];
    var ss = SpreadsheetApp.getActive();

    names.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      if (sheet) {
        try {
          sheet.hideSheet();
        } catch (e) {}
      }
    });
  }

};

function TI_ApplyUI() {
  TI.UI.applyAll();

  SpreadsheetApp.getUi().alert(
    "Интерфейс обновлен.\n\n" +
    "Главная, Советник и План сделок оформлены."
  );
}
