/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: BondEngine.gs
 * Версия: 2.0.0
 * Назначение:
 *   Базовая оценка облигаций без прямых API-запросов.
 * ============================================================
 */

var TI = TI || {};

TI.BondEngine = {

  SHEET: CORE.SHEETS.BOND_ANALYSIS,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var existing = this.mapByTicker();
    var now = new Date();
    var rows = TI.Directory.readExisting()
      .filter(function(item) {
        return TI.Rebalance.normalizeInstrumentType(item.instrumentType || "") === "Облигации";
      })
      .map(function(item) {
        return TI.BondEngine.buildRow(item, existing, now);
      })
      .sort(function(a, b) {
        return String(a.ticker).localeCompare(String(b.ticker));
      });

    this.write(rows);
    return rows;
  },

  buildRow: function(item, existing, now) {
    var ticker = String(item.ticker || "").trim().toUpperCase();
    var old = existing[ticker] || {};
    var lastPrice = Number(item.lastPrice || old.lastPrice) || 0;
    var maturityDate = old.maturityDate || "";
    var yearsToMaturity = this.yearsToMaturity(maturityDate);
    var row = {
      ticker: ticker,
      name: item.name || old.name || "",
      bondType: this.bondType(item, old),
      couponType: this.couponType(item, old),
      currency: item.currency || old.currency || "",
      lastPrice: lastPrice,
      priceToNominal: this.priceToNominal(lastPrice),
      couponRate: this.keepPercent(old.couponRate),
      ytm: this.keepPercent(old.ytm),
      duration: old.duration || "",
      maturityDate: maturityDate,
      yearsToMaturity: yearsToMaturity,
      creditRisk: "",
      liquidity: lastPrice > 0 ? "Цена есть" : "Нет цены",
      score: 0,
      decision: "",
      confidence: "",
      reasons: "",
      updatedAt: now,
      figi: item.figi || old.figi || "",
      instrumentUid: item.instrumentUid || old.instrumentUid || ""
    };

    var result = this.score(row);
    row.creditRisk = result.creditRisk;
    row.score = result.score;
    row.decision = result.decision;
    row.confidence = result.confidence;
    row.reasons = result.reasons.join("; ");

    return row;
  },

  bondType: function(item, old) {
    var text = this.text([item.ticker, item.name, item.issuer, old.bondType]);

    if (text.indexOf("офз") >= 0 || text.indexOf("ofz") >= 0) {
      return "ОФЗ";
    }

    if (text.indexOf("замещ") >= 0) {
      return "Замещающая";
    }

    if (text.indexOf("муницип") >= 0) {
      return "Муниципальная";
    }

    return old.bondType || "Корпоративная";
  },

  couponType: function(item, old) {
    var text = this.text([item.name, item.issuer, old.couponType]);

    if (text.indexOf("флоат") >= 0 ||
        text.indexOf("float") >= 0 ||
        text.indexOf("перем") >= 0) {
      return "Флоатер";
    }

    return old.couponType || "Нет данных";
  },

  priceToNominal: function(lastPrice) {
    var price = Number(lastPrice) || 0;

    if (price <= 0) {
      return "";
    }

    return price <= 200 ? price / 100 : "";
  },

  keepPercent: function(value) {
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    var number = Number(value);
    return isNaN(number) ? "" : number;
  },

  yearsToMaturity: function(value) {
    if (!value) {
      return "";
    }

    var date = value instanceof Date ? value : new Date(value);
    var time = date.getTime();

    if (isNaN(time)) {
      return "";
    }

    return Math.max(0, (time - Date.now()) / (365.25 * 24 * 60 * 60 * 1000));
  },

  score: function(row) {
    var score = 50;
    var reasons = [];
    var missing = 0;

    if (row.bondType === "ОФЗ") {
      score += 15;
      reasons.push("ОФЗ снижает кредитный риск");
    } else if (row.bondType === "Муниципальная") {
      score += 8;
      reasons.push("Муниципальная облигация требует отдельной проверки региона");
    } else if (row.bondType === "Замещающая") {
      score -= 5;
      reasons.push("Замещающая облигация требует проверки валютного и правового риска");
    } else {
      reasons.push("Корпоративная облигация требует оценки эмитента");
    }

    if (row.couponType === "Флоатер") {
      score += 8;
      reasons.push("Флоатер лучше адаптируется к высокой ставке");
    }

    if (row.priceToNominal !== "") {
      if (Number(row.priceToNominal) <= 0.98) {
        score += 7;
        reasons.push("Цена ниже номинала");
      } else if (Number(row.priceToNominal) > 1.05) {
        score -= 7;
        reasons.push("Цена заметно выше номинала");
      } else {
        reasons.push("Цена около номинала");
      }
    } else {
      missing += 1;
      score -= 5;
      reasons.push("Нет цены к номиналу");
    }

    if (row.ytm === "") {
      missing += 1;
      reasons.push("Доходность к погашению можно заполнить вручную");
    }

    if (row.duration === "") {
      missing += 1;
      reasons.push("Дюрация не заполнена");
    }

    if (row.maturityDate === "") {
      missing += 1;
      reasons.push("Дата погашения не заполнена");
    }

    var normalized = Math.max(0, Math.min(100, Math.round(score)));
    var confidence = missing >= 3 ? "Низкая" : (missing > 0 ? "Средняя" : "Высокая");

    return {
      score: normalized,
      creditRisk: row.bondType === "ОФЗ" ? "Низкий" : "Проверить",
      confidence: confidence,
      decision: this.decision(normalized, confidence),
      reasons: reasons
    };
  },

  decision: function(score, confidence) {
    if (confidence === "Низкая") {
      return "Заполнить параметры";
    }

    if (score >= 80) return "Покупать по плану";
    if (score >= 60) return "Держать";
    if (score >= 40) return "Не докупать без проверки";
    return "Проверить риск";
  },

  text: function(values) {
    return values.map(function(value) {
      return String(value || "").toLowerCase();
    }).join(" ");
  },

  read: function() {
    return TI.Data.sheetObjects(this.SHEET);
  },

  mapByTicker: function() {
    var map = {};

    this.read().forEach(function(row) {
      var ticker = String(row.ticker || "").trim().toUpperCase();

      if (ticker) {
        map[ticker] = row;
      }
    });

    return map;
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
      return Schema.buildRow(CORE.SHEETS.BOND_ANALYSIS, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

function TI_BuildBondAnalysis() {
  var rows = TI.BondEngine.build().length;

  SpreadsheetApp.getUi().alert(
    "Анализ облигаций рассчитан.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
