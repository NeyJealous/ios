/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: Visualization.gs
 * Версия: 1.0.0
 * Назначение:
 *   Сводные таблицы и диаграммы портфеля.
 * ============================================================
 */

var TI = TI || {};

TI.Visualization = {

  SHEET: CORE.SHEETS.VISUALIZATION,

  /**
   * Подготовить лист визуализации.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * Построить строки визуализации.
   * @return {Object[]}
   */
  build: function() {
    var portfolio = TI.AccountScope.filterDisplayRows(TI.Data.portfolio());

    if (portfolio.length === 0) {
      portfolio = TI.AccountScope.filterDisplayRows(TI.Data.portfolioFromFifoLots());
    }

    var rows = [];

    rows = rows
      .concat(this.groupRows(portfolio, "Счета", "accountName", 0))
      .concat(this.groupRows(portfolio, "Типы инструментов", "instrumentType", 0))
      .concat(this.groupRows(portfolio, "Эмитенты", "issuer", 10))
      .concat(this.positionRows(portfolio, 15));

    return rows;
  },

  /**
   * Сводка по полю портфеля.
   * @param {Object[]} portfolio
   * @param {string} section
   * @param {string} field
   * @param {number} limit
   * @return {Object[]}
   */
  groupRows: function(portfolio, section, field, limit) {
    var map = {};

    portfolio.forEach(function(position) {
      var name = String(position[field] || "").trim() || "Не указано";
      map[name] = (map[name] || 0) + (Number(position.marketValue) || 0);
    });

    return this.rowsFromMap(section, map, limit);
  },

  /**
   * Топ позиций.
   * @param {Object[]} portfolio
   * @param {number} limit
   * @return {Object[]}
   */
  positionRows: function(portfolio, limit) {
    var map = {};

    portfolio.forEach(function(position) {
      var name = String(position.ticker || "").trim() ||
        String(position.name || "").trim() ||
        "Без тикера";
      map[name] = (map[name] || 0) + (Number(position.marketValue) || 0);
    });

    return this.rowsFromMap("Топ позиций", map, limit);
  },

  /**
   * Превратить карту значений в строки.
   * @param {string} section
   * @param {Object} map
   * @param {number} limit
   * @return {Object[]}
   */
  rowsFromMap: function(section, map, limit) {
    var items = Object.keys(map).map(function(name) {
      return {
        name: name,
        value: Number(map[name]) || 0
      };
    }).filter(function(item) {
      return item.value > 0;
    });

    items.sort(function(a, b) {
      return b.value - a.value;
    });

    if (limit && items.length > limit) {
      var head = items.slice(0, limit);
      var other = items.slice(limit).reduce(function(sum, item) {
        return sum + item.value;
      }, 0);

      if (other > 0) {
        head.push({
          name: "Остальное",
          value: other
        });
      }

      items = head;
    }

    var total = items.reduce(function(sum, item) {
      return sum + item.value;
    }, 0);

    return items.map(function(item) {
      return {
        section: section,
        name: item.name,
        value: item.value,
        share: total > 0 ? item.value / total : 0,
        comment: ""
      };
    });
  },

  /**
   * Записать визуализацию и построить диаграммы.
   * @param {Object[]} rows
   * @return {number}
   */
  write: function(rows) {
    var sheet = this.prepare();

    this.clearSheet(sheet);

    if (!rows || rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(CORE.SHEETS.VISUALIZATION, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    this.buildCharts(sheet, rows);

    return values.length;
  },

  /**
   * Очистить данные и старые диаграммы.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   */
  clearSheet: function(sheet) {
    if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      ).clearContent();
    }

    sheet.getCharts().forEach(function(chart) {
      sheet.removeChart(chart);
    });
  },

  /**
   * Построить диаграммы по секциям.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @param {Object[]} rows
   */
  buildCharts: function(sheet, rows) {
    var sections = ["Счета", "Типы инструментов", "Эмитенты", "Топ позиций"];
    var startBySection = this.sectionRanges(rows);
    var anchors = [
      { row: 2, column: 7 },
      { row: 2, column: 13 },
      { row: 20, column: 7 },
      { row: 20, column: 13 }
    ];

    sections.forEach(function(section, index) {
      var rangeInfo = startBySection[section];

      if (!rangeInfo || rangeInfo.count === 0) {
        return;
      }

      var range = sheet.getRange(rangeInfo.row, 2, rangeInfo.count, 2);
      var anchor = anchors[index];
      var chart = sheet.newChart()
        .asPieChart()
        .addRange(range)
        .setOption("title", section)
        .setOption("pieSliceText", "percentage")
        .setOption("legend", { position: "right" })
        .setPosition(anchor.row, anchor.column, 0, 0)
        .build();

      sheet.insertChart(chart);
    });
  },

  /**
   * Найти диапазоны секций.
   * @param {Object[]} rows
   * @return {Object}
   */
  sectionRanges: function(rows) {
    var ranges = {};

    rows.forEach(function(row, index) {
      if (!ranges[row.section]) {
        ranges[row.section] = {
          row: index + 2,
          count: 0
        };
      }

      ranges[row.section].count += 1;
    });

    return ranges;
  },

  /**
   * Пересчитать визуализацию.
   * @return {number}
   */
  rebuild: function() {
    return this.write(this.build());
  }

};

/**
 * Обновить визуализацию портфеля.
 * @return {number}
 */
function TI_BuildVisualization() {
  var rows = TI.Visualization.rebuild();

  SpreadsheetApp.getUi().alert(
    "Визуализация обновлена.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
