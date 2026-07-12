/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: CompanyRating.gs
 * Версия: 1.1.0
 * Назначение:
 *   Ручной рейтинг компаний и сигнал проверки продажи.
 * ============================================================
 */

var TI = TI || {};

TI.CompanyRating = {

  SHEET: CORE.SHEETS.COMPANY_RATING,

  WEIGHTS: Object.freeze({
    dividends: 30,
    profitGrowth: 20,
    debt: 15,
    marketPosition: 15,
    pricePotential: 10,
    stability: 10
  }),

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var existing = this.mapByTicker();
    var directory = TI.Directory.readExisting();
    var scores = TI.KnowledgeEngine.scoreMap();
    var source = this.ratingSource(directory, existing);
    var rows = [];

    source.forEach(function(item) {
      if (!TI.CompanyRating.isRatingCandidate(item)) {
        return;
      }

      var ticker = String(item.ticker || "").trim().toUpperCase();
      var old = existing[ticker] || {};
      var row = {
        ticker: ticker,
        name: item.name || old.name || "",
        instrumentType: item.instrumentType || old.instrumentType || "",
        sector: item.sector || old.sector || "",
        dividends: TI.CompanyRating.keepValue(old.dividends),
        profitGrowth: TI.CompanyRating.keepValue(old.profitGrowth),
        debt: TI.CompanyRating.keepValue(old.debt),
        marketPosition: TI.CompanyRating.keepValue(old.marketPosition),
        pricePotential: TI.CompanyRating.keepValue(old.pricePotential),
        stability: TI.CompanyRating.keepValue(old.stability),
        investmentThesis: old.investmentThesis || "",
        comment: old.comment || "",
        thesisBroken: TI.CompanyRating.normalizeFlag(old.thesisBroken),
        dangerousDebt: TI.CompanyRating.normalizeFlag(old.dangerousDebt),
        noProfit: TI.CompanyRating.normalizeFlag(old.noProfit),
        badGovernance: TI.CompanyRating.normalizeFlag(old.badGovernance),
        fundamentalsWorse: TI.CompanyRating.normalizeFlag(old.fundamentalsWorse),
        highRisk: TI.CompanyRating.normalizeFlag(old.highRisk),
        updatedAt: new Date()
      };

      if (TI.CompanyRating.hasManualScores(row) ||
          TI.CompanyRating.hasSellCheckFlag(row)) {
        row.totalRating = TI.CompanyRating.total(row);
        row.decision = TI.CompanyRating.decision(row);
      } else if (scores[ticker]) {
        row.totalRating = Number(scores[ticker].value) || 0;
        row.decision = scores[ticker].decision || "Недостаточно данных";
        row.comment = row.comment ||
          "Оценка рассчитана по фактам и признакам. Ручные поля можно заполнить как уточнение.";
      } else {
        row.totalRating = TI.CompanyRating.total(row);
        row.decision = TI.CompanyRating.decision(row);
      }

      rows.push(row);
    });

    rows.sort(function(a, b) {
      return String(a.ticker).localeCompare(String(b.ticker));
    });

    this.write(rows);
    return rows;
  },

  ratingSource: function(directory, existing) {
    var map = {};

    (directory || []).forEach(function(item) {
      var ticker = String(item.ticker || "").trim().toUpperCase();

      if (ticker) {
        map[ticker] = item;
      }
    });

    Object.keys(existing || {}).forEach(function(ticker) {
      if (!map[ticker]) {
        map[ticker] = existing[ticker];
      }
    });

    return Object.keys(map).map(function(ticker) {
      return map[ticker];
    });
  },

  isRatingCandidate: function(item) {
    var type = TI.Rebalance.normalizeInstrumentType(item.instrumentType || "");
    return !!item.ticker && (type === "Акции" || type === "Фонды");
  },

  keepValue: function(value) {
    return value === null || value === undefined ? "" : value;
  },

  normalizeFlag: function(value) {
    if (value instanceof Date) {
      return "";
    }

    var text = String(value || "").trim().toLowerCase();

    if (!text) {
      return "";
    }

    if (this.isYes(text)) {
      return "Да";
    }

    if (text === "нет" || text === "no" || text === "n" || text === "false" || text === "0") {
      return "Нет";
    }

    return "";
  },

  read: function() {
    return TI.Data.sheetObjects(this.SHEET);
  },

  mapByTicker: function() {
    var result = {};

    this.read().forEach(function(row) {
      var ticker = String(row.ticker || "").trim().toUpperCase();
      if (ticker) {
        result[ticker] = row;
      }
    });

    return result;
  },

  total: function(row) {
    return Object.keys(this.WEIGHTS).reduce(function(sum, field) {
      var value = Number(row[field]) || 0;
      var max = TI.CompanyRating.WEIGHTS[field];
      return sum + Math.max(0, Math.min(max, value));
    }, 0);
  },

  hasManualScores: function(row) {
    return Object.keys(this.WEIGHTS).some(function(field) {
      return row[field] !== "" &&
        row[field] !== null &&
        row[field] !== undefined;
    });
  },

  decision: function(row) {
    if (this.hasSellCheckFlag(row)) {
      return "Проверить продажу";
    }

    if (!this.hasManualScores(row)) {
      return "Заполнить рейтинг";
    }

    var rating = Number(row.totalRating) || 0;

    if (rating >= 85) return "Покупать активно";
    if (rating >= 70) return "Покупать по плану";
    if (rating >= 50) return "Держать, но не увеличивать";
    return "Проверить продажу";
  },

  hasSellCheckFlag: function(row) {
    return this.isYes(row.thesisBroken) ||
      this.isYes(row.dangerousDebt) ||
      this.isYes(row.noProfit) ||
      this.isYes(row.badGovernance) ||
      this.isYes(row.fundamentalsWorse);
  },

  isYes: function(value) {
    var text = String(value || "").trim().toLowerCase();
    return text === "да" ||
      text === "yes" ||
      text === "y" ||
      text === "true" ||
      text === "истина" ||
      text === "1";
  },

  saleCheckRows: function() {
    return this.read().filter(function(row) {
      return String(row.decision || "").trim() === "Проверить продажу";
    });
  },

  incompleteRows: function() {
    return this.read().filter(function(row) {
      var decision = String(row.decision || "").trim();
      return decision === "Заполнить рейтинг" ||
        decision === "Недостаточно данных";
    });
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
      return Schema.buildRow(CORE.SHEETS.COMPANY_RATING, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

function TI_BuildCompanyRating() {
  var rows = TI.CompanyRating.build().length;

  SpreadsheetApp.getUi().alert(
    "Рейтинг компаний рассчитан.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
