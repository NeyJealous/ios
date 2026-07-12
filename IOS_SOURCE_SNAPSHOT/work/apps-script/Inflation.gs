/**
 * ============================================================
 * РРЅРІРµСЃС‚РёС†РёРѕРЅРЅС‹Р№ РїРѕРјРѕС‰РЅРёРє
 * ------------------------------------------------------------
 * РњРѕРґСѓР»СЊ: Inflation.gs
 * Р’РµСЂСЃРёСЏ: 1.0.0
 * РќР°Р·РЅР°С‡РµРЅРёРµ:
 *   РРјРїРѕСЂС‚ РѕС„РёС†РёР°Р»СЊРЅРѕР№ РёРЅС„Р»СЏС†РёРё Рё СѓС‡РµС‚ Р»РёС‡РЅРѕР№ РёРЅС„Р»СЏС†РёРё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
 *
 * РСЃС‚РѕСЂРёСЏ РёР·РјРµРЅРµРЅРёР№:
 *   1.0.0 - Р›РёСЃС‚ РёРЅС„Р»СЏС†РёРё СЃ РѕС„РёС†РёР°Р»СЊРЅРѕР№ Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕР№ СЃС‚Р°РІРєРѕР№ РїРѕ РіРѕРґР°Рј.
 * ============================================================
 */

var TI = TI || {};

TI.Inflation = {

  SHEET: CORE.SHEETS.INFLATION,

  /**
   * Р‘Р°Р·РѕРІР°СЏ С‚Р°Р±Р»РёС†Р° РѕС„РёС†РёР°Р»СЊРЅРѕР№ РёРЅС„Р»СЏС†РёРё Р Р¤ РїРѕ РґР°РЅРЅС‹Рј Р РѕСЃСЃС‚Р°С‚Р°.
   * РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє Р·Р°РїР°СЃРЅРѕР№ РёСЃС‚РѕС‡РЅРёРє, РµСЃР»Рё РІРЅРµС€РЅРёР№ URL РЅРµ Р·Р°РґР°РЅ РёР»Рё РЅРµРґРѕСЃС‚СѓРїРµРЅ.
   */
  FALLBACK_OFFICIAL: Object.freeze({
    2014: 0.1136,
    2015: 0.1291,
    2016: 0.0538,
    2017: 0.0252,
    2018: 0.0427,
    2019: 0.0305,
    2020: 0.0491,
    2021: 0.0839,
    2022: 0.1194,
    2023: 0.0742,
    2024: 0.0952
  }),

  /**
   * РџРѕРґРіРѕС‚РѕРІРёС‚СЊ Р»РёСЃС‚ РёРЅС„Р»СЏС†РёРё.
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  /**
   * РћР±РЅРѕРІРёС‚СЊ РѕС„РёС†РёР°Р»СЊРЅСѓСЋ РёРЅС„Р»СЏС†РёСЋ, СЃРѕС…СЂР°РЅРёРІ СЂСѓС‡РЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ.
   * @return {{total:number, imported:number, source:string}}
   */
  refresh: function() {
    var existing = this.readRows();
    var perceived = this.perceivedByYear(existing);
    var imported = this.fetchOfficial();
    var rows = this.mergeRows(imported.rows, perceived, imported.source);

    this.write(rows);

    return {
      total: rows.length,
      imported: imported.rows.length,
      source: imported.source
    };
  },

  /**
   * РџРѕР»СѓС‡РёС‚СЊ СЃС‚Р°РІРєСѓ РёРЅС„Р»СЏС†РёРё РґР»СЏ СЂР°СЃС‡РµС‚РѕРІ.
   * РџСЂРёРѕСЂРёС‚РµС‚: Р»РёС‡РЅР°СЏ РёРЅС„Р»СЏС†РёСЏ -> РѕС„РёС†РёР°Р»СЊРЅР°СЏ -> РЅР°СЃС‚СЂРѕР№РєР° РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.
   * @param {number} year
   * @return {number}
   */
  getRateForYear: function(year) {
    var rows = this.readRows();

    for (var i = 0; i < rows.length; i++) {
      if (Number(rows[i].year) !== Number(year)) {
        continue;
      }

      if (rows[i].perceivedInflation !== "") {
        return this.parseRate(rows[i].perceivedInflation, 0);
      }

      if (rows[i].officialInflation !== "") {
        return this.parseRate(rows[i].officialInflation, 0);
      }
    }

    return TI.Settings.getInflationRate();
  },

  /**
   * РџСЂРѕС‡РёС‚Р°С‚СЊ СЃС‚СЂРѕРєРё Р»РёСЃС‚Р°.
   * @return {Object[]}
   */
  readRows: function() {
    var sheet = this.prepare();
    var values = sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return [];
    }

    var headers = values.shift();
    var fieldsByTitle = this.fieldsByTitle();

    return values.map(function(row) {
      var item = {};

      headers.forEach(function(title, index) {
        var field = fieldsByTitle[title] || title;
        item[field] = row[index];
      });

      return item;
    }).filter(function(item) {
      return item.year;
    });
  },

  /**
   * РљР°СЂС‚Р° "Р·Р°РіРѕР»РѕРІРѕРє -> РїРѕР»Рµ".
   * @return {Object}
   */
  fieldsByTitle: function() {
    var result = {};

    Schema.getColumns(this.SHEET).forEach(function(column) {
      result[column.title] = column.field;
    });

    return result;
  },

  /**
   * РљР°СЂС‚Р° СЂСѓС‡РЅРѕР№ РёРЅС„Р»СЏС†РёРё РїРѕ РіРѕРґР°Рј.
   * @param {Object[]} rows
   * @return {Object}
   */
  perceivedByYear: function(rows) {
    var map = {};

    rows.forEach(function(row) {
      if (row.perceivedInflation !== "") {
        map[Number(row.year)] = row.perceivedInflation;
      }
    });

    return map;
  },

  /**
   * Р—Р°РіСЂСѓР·РёС‚СЊ РѕС„РёС†РёР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ.
   * @return {{rows:Object[], source:string}}
   */
  fetchOfficial: function() {
    var url = TI.Settings.getInflationSourceUrl() || "https://cbr.ru/hd_base/infl/";

    if (url) {
      try {
        return {
          rows: this.fetchFromUrl(url),
          source: url
        };
      } catch (e) {
        Logger.log(e);
      }
    }

    return {
      rows: this.fallbackRows(),
      source: "Р’СЃС‚СЂРѕРµРЅРЅР°СЏ С‚Р°Р±Р»РёС†Р° Р РѕСЃСЃС‚Р°С‚Р°"
    };
  },

  /**
   * Р—Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ РёР· РІРЅРµС€РЅРµРіРѕ URL.
   * РџРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ CSV Рё JSON.
   * @param {string} url
   * @return {Object[]}
   */
  fetchFromUrl: function(url) {
    var fetchUrl = this.normalizeCbrUrl(url);
    var response = UrlFetchApp.fetch(fetchUrl, {
      method: "get",
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var text = response.getContentText();

    if (code < 200 || code >= 300) {
      throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РёРЅС„Р»СЏС†РёСЋ: HTTP " + code);
    }

    var first = text.trim().charAt(0);

    if (this.isCbrUrl(url)) {
      return this.parseCbrHtml(text);
    }

    if (/<table[\s>]/i.test(text) && /infl/i.test(text)) {
      return this.parseCbrHtml(text);
    }

    return first === "{" || first === "["
      ? this.parseJson(text)
      : this.parseCsv(text);
  },

  /**
   * РЇРІР»СЏРµС‚СЃСЏ Р»Рё URL СЃС‚СЂР°РЅРёС†РµР№ РёРЅС„Р»СЏС†РёРё Р‘Р°РЅРєР° Р РѕСЃСЃРёРё.
   * @param {string} url
   * @return {boolean}
   */
  isCbrUrl: function(url) {
    return /:\/\/(?:www\.)?cbr\.ru\/hd_base\/infl\/?/i.test(String(url || ""));
  },

  /**
   * Р”РѕР±Р°РІРёС‚СЊ РґРёР°РїР°Р·РѕРЅ РґР°С‚ Рє URL Р¦Р‘, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СѓРєР°Р·Р°Р» Р±Р°Р·РѕРІСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ.
   * @param {string} url
   * @return {string}
   */
  normalizeCbrUrl: function(url) {
    if (!this.isCbrUrl(url)) {
      return url;
    }

    if (String(url).indexOf("UniDbQuery.") !== -1) {
      return url;
    }

    var currentYear = new Date().getFullYear();
    var separator = String(url).indexOf("?") === -1 ? "?" : "&";

    return String(url) +
      separator +
      "UniDbQuery.Posted=True" +
      "&UniDbQuery.From=01.01.2014" +
      "&UniDbQuery.To=31.12." + currentYear;
  },

  /**
   * Р Р°Р·РѕР±СЂР°С‚СЊ HTML-С‚Р°Р±Р»РёС†Сѓ Р¦Р‘ Р Р¤ "РРЅС„Р»СЏС†РёСЏ Рё РєР»СЋС‡РµРІР°СЏ СЃС‚Р°РІРєР°".
   * Р‘РµСЂС‘Рј РёРЅС„Р»СЏС†РёСЋ Рі/Рі Р·Р° РїРѕСЃР»РµРґРЅРёР№ РґРѕСЃС‚СѓРїРЅС‹Р№ РјРµСЃСЏС† РєР°Р¶РґРѕРіРѕ РіРѕРґР°.
   * Р”Р»СЏ Р·Р°РІРµСЂС€С‘РЅРЅС‹С… Р»РµС‚ СЌС‚Рѕ РѕР±С‹С‡РЅРѕ РґРµРєР°Р±СЂСЊ, РґР»СЏ С‚РµРєСѓС‰РµРіРѕ РіРѕРґР° - РїРѕСЃР»РµРґРЅРёР№ РјРµСЃСЏС†.
   * @param {string} text
   * @return {Object[]}
   */
  parseCbrHtml: function(text) {
    var byYear = {};
    var rowMatch;
    var rowRe = /<tr[\s\S]*?<\/tr>/gi;

    while ((rowMatch = rowRe.exec(text)) !== null) {
      var rowHtml = rowMatch[0];
      var cells = [];
      var cellMatch;
      var cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

      while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
        cells.push(this.cleanHtmlCell(cellMatch[1]));
      }

      if (cells.length < 3) {
        continue;
      }

      var date = this.parseCbrMonth(cells[0]);
      var rate = this.parseRate(cells[2], "");

      if (!date || rate === "") {
        continue;
      }

      var existing = byYear[date.year];

      if (!existing || date.month > existing.month) {
        byYear[date.year] = {
          year: date.year,
          month: date.month,
          rate: rate
        };
      }
    }

    return Object.keys(byYear).sort().map(function(year) {
      return TI.Inflation.officialRow(year, byYear[year].rate);
    });
  },

  /**
   * РћС‡РёСЃС‚РёС‚СЊ HTML-СЏС‡РµР№РєСѓ С‚Р°Р±Р»РёС†С‹ Р¦Р‘.
   * @param {string} html
   * @return {string}
   */
  cleanHtmlCell: function(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#160;/g, " ")
      .replace(/&minus;/g, "-")
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  },

  /**
   * Р Р°Р·РѕР±СЂР°С‚СЊ РјРµСЃСЏС† Р¦Р‘ РІРёРґР° MM.YYYY РёР»Рё DD.MM.YYYY.
   * @param {string} value
   * @return {{month:number, year:number}|null}
   */
  parseCbrMonth: function(value) {
    var text = String(value || "").trim();
    var monthYear = text.match(/^(\d{2})\.(\d{4})$/);

    if (monthYear) {
      return {
        month: Number(monthYear[1]),
        year: Number(monthYear[2])
      };
    }

    var dayMonthYear = text.match(/^\d{2}\.(\d{2})\.(\d{4})$/);

    if (dayMonthYear) {
      return {
        month: Number(dayMonthYear[1]),
        year: Number(dayMonthYear[2])
      };
    }

    return null;
  },

  /**
   * Р Р°Р·РѕР±СЂР°С‚СЊ JSON.
   * Р¤РѕСЂРјР°С‚С‹: [{"year":2024,"inflation":9.52}] РёР»Рё {"2024":9.52}.
   * @param {string} text
   * @return {Object[]}
   */
  parseJson: function(text) {
    var data = JSON.parse(text);
    var rows = [];

    if (Array.isArray(data)) {
      data.forEach(function(item) {
        rows.push(TI.Inflation.officialRow(
          item.year,
          item.inflation !== undefined ? item.inflation :
            item.officialInflation !== undefined ? item.officialInflation :
              item.value
        ));
      });
    } else {
      Object.keys(data).forEach(function(year) {
        rows.push(TI.Inflation.officialRow(year, data[year]));
      });
    }

    return rows.filter(function(row) {
      return row.year && row.officialInflation !== "";
    });
  },

  /**
   * Р Р°Р·РѕР±СЂР°С‚СЊ CSV.
   * Р¤РѕСЂРјР°С‚: year,inflation РёР»Рё Р“РѕРґ;РРЅС„Р»СЏС†РёСЏ.
   * @param {string} text
   * @return {Object[]}
   */
  parseCsv: function(text) {
    var lines = text.split(/\r?\n/);
    var rows = [];

    lines.forEach(function(line, index) {
      if (!line.trim()) {
        return;
      }

      var delimiter = line.indexOf(";") !== -1 ? ";" : ",";
      var parts = line.split(delimiter);

      if (index === 0 && !/^\d{4}$/.test(String(parts[0]).trim())) {
        return;
      }

      rows.push(TI.Inflation.officialRow(parts[0], parts[1]));
    });

    return rows.filter(function(row) {
      return row.year && row.officialInflation !== "";
    });
  },

  /**
   * Р—Р°РїР°СЃРЅС‹Рµ СЃС‚СЂРѕРєРё РѕС„РёС†РёР°Р»СЊРЅРѕР№ РёРЅС„Р»СЏС†РёРё.
   * @return {Object[]}
   */
  fallbackRows: function() {
    return Object.keys(this.FALLBACK_OFFICIAL).map(function(year) {
      return TI.Inflation.officialRow(year, TI.Inflation.FALLBACK_OFFICIAL[year]);
    });
  },

  /**
   * РЎС‚СЂРѕРєР° РѕС„РёС†РёР°Р»СЊРЅРѕР№ РёРЅС„Р»СЏС†РёРё.
   * @param {*} year
   * @param {*} rate
   * @return {Object}
   */
  officialRow: function(year, rate) {
    return {
      year: Number(year) || "",
      officialInflation: this.parseRate(rate, ""),
      perceivedInflation: "",
      usedInflation: "",
      source: "",
      updatedAt: "",
      comment: ""
    };
  },

  /**
   * РћР±СЉРµРґРёРЅРёС‚СЊ РѕС„РёС†РёР°Р»СЊРЅС‹Рµ Рё СЂСѓС‡РЅС‹Рµ РґР°РЅРЅС‹Рµ.
   * @param {Object[]} officialRows
   * @param {Object} perceived
   * @param {string} source
   * @return {Object[]}
   */
  mergeRows: function(officialRows, perceived, source) {
    var years = {};

    officialRows.forEach(function(row) {
      years[Number(row.year)] = row;
    });

    Object.keys(perceived).forEach(function(year) {
      if (!years[Number(year)]) {
        years[Number(year)] = TI.Inflation.officialRow(year, "");
      }
    });

    return Object.keys(years).sort().map(function(year) {
      var row = years[year];
      var perceivedRate = perceived[Number(year)] !== undefined
        ? TI.Inflation.parseRate(perceived[Number(year)], "")
        : "";

      row.perceivedInflation = perceivedRate;
      row.usedInflation = perceivedRate !== ""
        ? perceivedRate
        : row.officialInflation;
      row.source = source;
      row.updatedAt = new Date();

      if (perceivedRate !== "") {
        row.comment = "Р’ СЂР°СЃС‡С‘С‚Р°С… РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РёРЅС„Р»СЏС†РёСЏ РїРѕ РѕС‰СѓС‰РµРЅРёСЏРј.";
      } else {
        row.comment = "Р’ СЂР°СЃС‡С‘С‚Р°С… РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РѕС„РёС†РёР°Р»СЊРЅР°СЏ РёРЅС„Р»СЏС†РёСЏ.";
      }

      return row;
    });
  },

  /**
   * РџСЂРµРѕР±СЂР°Р·РѕРІР°С‚СЊ СЃС‚Р°РІРєСѓ РІ РґРѕР»СЋ.
   * @param {*} value
   * @param {*} fallback
   * @return {*}
   */
  parseRate: function(value, fallback) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "number") {
      return value > 1 ? value / 100 : value;
    }

    var text = String(value)
      .trim()
      .replace(",", ".")
      .replace("%", "");
    var number = Number(text);

    if (isNaN(number)) {
      return fallback;
    }

    return number > 1 ? number / 100 : number;
  },

  /**
   * Р—Р°РїРёСЃР°С‚СЊ СЃС‚СЂРѕРєРё.
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
      return Schema.buildRow(CORE.SHEETS.INFLATION, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

/**
 * РћР±РЅРѕРІРёС‚СЊ РёРЅС„Р»СЏС†РёСЋ.
 * @return {{total:number, imported:number, source:string}}
 */
function TI_UpdateInflation() {
  var stats = TI.Inflation.refresh();

  SpreadsheetApp.getUi().alert(
    "РРЅС„Р»СЏС†РёСЏ РѕР±РЅРѕРІР»РµРЅР°.\n\n" +
    "РЎС‚СЂРѕРє: " + stats.total + "\n" +
    "РРјРїРѕСЂС‚РёСЂРѕРІР°РЅРѕ: " + stats.imported + "\n" +
    "РСЃС‚РѕС‡РЅРёРє: " + stats.source
  );

  return stats;
}
