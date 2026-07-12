/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Schema.gs
 * Версия: 1.0.0
 * Часть: 6 из N
 *
 * Подготовка листов Google Sheets
 * ============================================================
 */

/**
 * Создать или вернуть лист.
 * @param {string} sheetName
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
Schema.ensureSheet = function(sheetName) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
};

/**
 * Подготовить лист по схеме.
 * @param {string} sheetName
 */
Schema.prepareSheet = function(sheetName) {

  var sheet = Schema.ensureSheet(sheetName);
  var cols = Schema.getColumns(sheetName);

  sheet.clear();

  var headers = cols.map(function(c){ return c.title; });
  sheet.getRange(1,1,1,headers.length).setValues([headers]);

  sheet.setFrozenRows(1);

  for (var i=0;i<cols.length;i++){
    sheet.setColumnWidth(i+1, cols[i].width || 100);
    if (cols[i].hidden){
      sheet.hideColumns(i+1);
    } else {
      try { sheet.showColumns(i+1); } catch(e){}
    }
  }

  var range = sheet.getRange(1,1,Math.max(sheet.getMaxRows(),2),headers.length);
  if (!sheet.getFilter()) {
    range.createFilter();
  }
};

/**
 * Подготовить все пользовательские листы.
 */
Schema.initialize = function() {

  [
    CORE.SHEETS.TRADES,
    CORE.SHEETS.FIFO_LOTS,
    CORE.SHEETS.FIFO_SALES,
    CORE.SHEETS.PORTFOLIO,
    CORE.SHEETS.DIVIDENDS,
    CORE.SHEETS.COUPONS,
    CORE.SHEETS.CASHFLOW,
    CORE.SHEETS.TAX,
    CORE.SHEETS.REBALANCE,
    CORE.SHEETS.ADVISOR,
    CORE.SHEETS.STRATEGY,
    CORE.SHEETS.SETTINGS,
    CORE.SHEETS.DIRECTORY
  ].forEach(function(name){
    Schema.prepareSheet(name);
  });

  SpreadsheetApp.flush();
};

