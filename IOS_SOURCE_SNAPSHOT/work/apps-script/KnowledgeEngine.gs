/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: KnowledgeEngine.gs
 * Версия: 1.0.0
 * Назначение:
 *   Преобразование данных источников в факты, признаки и оценки.
 * ============================================================
 */

var TI = TI || {};

TI.KnowledgeEngine = {

  FACTS_SHEET: CORE.SHEETS.FACTS,
  FEATURES_SHEET: CORE.SHEETS.FEATURES,
  SCORES_SHEET: CORE.SHEETS.SCORES,

  prepare: function() {
    Schema.prepareSheet(this.FACTS_SHEET);
    Schema.prepareSheet(this.FEATURES_SHEET);
    Schema.prepareSheet(this.SCORES_SHEET);
  },

  build: function() {
    var facts = this.buildFacts();
    var features = this.buildFeatures(facts);
    var scores = this.buildScores(features);

    this.write(this.FACTS_SHEET, facts);
    this.write(this.FEATURES_SHEET, features);
    this.write(this.SCORES_SHEET, scores);

    TI.TechLog.info(
      "KnowledgeEngine",
      "build",
      "Факты, признаки и оценки обновлены.",
      {
        facts: facts.length,
        features: features.length,
        scores: scores.length
      }
    );

    return {
      facts: facts.length,
      features: features.length,
      scores: scores.length
    };
  },

  buildFacts: function() {
    var rows = [];
    var now = new Date();
    var directory = TI.Directory.readExisting();
    var ratings = TI.CompanyRating.read();
    var regime = TI.MarketRegime.current();

    directory.forEach(function(item) {
      var ticker = String(item.ticker || "").trim().toUpperCase();

      if (!ticker) {
        return;
      }

      TI.KnowledgeEngine.pushFact(rows, ticker, "тип инструмента", item.instrumentType, "Справочник", now, "Средняя", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "отрасль", item.sector, "Справочник", now, item.sector ? "Средняя" : "Низкая", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "эмитент", item.issuer, "Справочник", now, item.issuer ? "Средняя" : "Низкая", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "валюта", item.currency, "Справочник", now, "Средняя", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "лотность", item.lot, "Справочник", now, item.lot ? "Средняя" : "Низкая", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "последняя цена", item.lastPrice, "Справочник", now, item.lastPrice ? "Средняя" : "Низкая", "Нет", "");
      TI.KnowledgeEngine.pushFact(rows, ticker, "доступен для торговли", item.tradeAvailable, "Справочник", now, "Средняя", "Нет", "Флаг не используется как жесткий фильтр в выходные.");
      TI.KnowledgeEngine.pushFact(rows, ticker, "биржа", item.exchange, "Справочник", now, item.exchange ? "Средняя" : "Низкая", "Нет", "");
    });

    ratings.forEach(function(row) {
      var ticker = String(row.ticker || "").trim().toUpperCase();

      if (!ticker) {
        return;
      }

      Object.keys(TI.CompanyRating.WEIGHTS).forEach(function(field) {
        if (row[field] !== "" && row[field] !== null && row[field] !== undefined) {
          TI.KnowledgeEngine.pushFact(rows, ticker, TI.KnowledgeEngine.ratingFactTitle(field), row[field], "Рейтинг компаний", now, "Ручная", "Нет", "Ручная оценка пользователя.");
        }
      });

      ["thesisBroken", "dangerousDebt", "noProfit", "badGovernance", "fundamentalsWorse", "highRisk"].forEach(function(field) {
        if (row[field]) {
          TI.KnowledgeEngine.pushFact(rows, ticker, TI.KnowledgeEngine.flagFactTitle(field), row[field], "Рейтинг компаний", now, "Ручная", "Нет", "Ручной флаг риска.");
        }
      });
    });

    this.pushFact(rows, "MARKET", "ключевая ставка", regime.keyRate, "Режим рынка", now, "Средняя", "Нет", "");
    this.pushFact(rows, "MARKET", "просадка рынка", regime.drawdown, "Режим рынка", now, "Средняя", "Нет", "");
    this.pushFact(rows, "MARKET", "множитель покупки акций", regime.multiplier, "Режим рынка", now, "Средняя", "Нет", regime.reservePlan);

    return rows;
  },

  buildFeatures: function(facts) {
    var byInstrument = this.groupFacts(facts);
    var rows = [];
    var now = new Date();

    Object.keys(byInstrument).forEach(function(instrument) {
      var map = byInstrument[instrument];

      if (instrument === "MARKET") {
        TI.KnowledgeEngine.marketFeatures(rows, instrument, map, now);
        return;
      }

      TI.KnowledgeEngine.securityFeatures(rows, instrument, map, now);
      TI.KnowledgeEngine.ratingFeatures(rows, instrument, map, now);
    });

    return rows;
  },

  buildScores: function(features) {
    var byInstrument = {};
    var rows = [];
    var now = new Date();

    features.forEach(function(feature) {
      var instrument = String(feature.instrument || "").trim();
      if (!byInstrument[instrument]) byInstrument[instrument] = [];
      byInstrument[instrument].push(feature);
    });

    Object.keys(byInstrument).forEach(function(instrument) {
      if (instrument === "MARKET") {
        return;
      }

      var list = byInstrument[instrument];
      var score = 50;
      var manualOverride = null;
      var confidence = "Низкая";
      var reasons = [];

      list.forEach(function(feature) {
        if (feature.featureKey === "ручной рейтинг заполнен") {
          manualOverride = Number(feature.value) || 0;
        }

        score += Number(feature.score) || 0;
        if (feature.explanation) reasons.push(feature.explanation);
        if (feature.confidence === "Средняя" || feature.confidence === "Ручная") {
          confidence = "Средняя";
        }
      });

      score = manualOverride !== null ? manualOverride : score;
      score = Math.max(0, Math.min(100, score));
      rows.push({
        scoreType: "Привлекательность",
        instrument: instrument,
        accountName: "",
        strategy: "",
        value: score,
        confidence: confidence,
        reasons: reasons.slice(0, 6).join(" "),
        decision: TI.KnowledgeEngine.decision(score, confidence),
        updatedAt: now
      });
    });

    return rows;
  },

  securityFeatures: function(rows, instrument, facts, now) {
    var type = this.factValue(facts, "тип инструмента");
    var sector = this.factValue(facts, "отрасль");
    var issuer = this.factValue(facts, "эмитент");
    var price = Number(this.factValue(facts, "последняя цена")) || 0;
    var lot = Number(this.factValue(facts, "лотность")) || 0;
    var exchange = this.factValue(facts, "биржа");

    this.pushFeature(rows, instrument, "инструмент классифицирован", type || "Нет данных", type ? 5 : -10, "тип инструмента", type ? "Тип инструмента определен." : "Недостаточно данных для уверенной оценки.", type ? "Средняя" : "Низкая", now);
    this.pushFeature(rows, instrument, "есть отрасль", sector || "Нет данных", sector ? 5 : -5, "отрасль", sector ? "Отрасль заполнена." : "Отрасль не заполнена.", sector ? "Средняя" : "Низкая", now);
    this.pushFeature(rows, instrument, "есть эмитент", issuer || "Нет данных", issuer ? 5 : -5, "эмитент", issuer ? "Эмитент заполнен." : "Эмитент не заполнен.", issuer ? "Средняя" : "Низкая", now);
    this.pushFeature(rows, instrument, "есть рыночная цена", price ? "Да" : "Нет", price ? 5 : -10, "последняя цена", price ? "Цена есть в справочнике." : "Нет последней цены.", price ? "Средняя" : "Низкая", now);
    this.pushFeature(rows, instrument, "есть лотность", lot ? "Да" : "Нет", lot ? 3 : -7, "лотность", lot ? "Лотность известна." : "Лотность не заполнена.", lot ? "Средняя" : "Низкая", now);
    this.pushFeature(rows, instrument, "биржевой инструмент", exchange || "Нет данных", exchange ? 5 : -10, "биржа", exchange ? "Биржа указана." : "Биржа не указана.", exchange ? "Средняя" : "Низкая", now);
  },

  ratingFeatures: function(rows, instrument, facts, now) {
    var manualScore = 0;
    var manualCount = 0;
    var hasSellFlag = false;

    Object.keys(TI.CompanyRating.WEIGHTS).forEach(function(field) {
      var title = TI.KnowledgeEngine.ratingFactTitle(field);
      var value = TI.KnowledgeEngine.factValue(facts, title);

      if (value !== "" && value !== null && value !== undefined) {
        manualScore += Number(value) || 0;
        manualCount++;
      }
    });

    ["тезис нарушен", "долг опасен", "нет прибыли", "проблемы управления", "фундамент ухудшился"].forEach(function(title) {
      if (TI.CompanyRating.isYes(TI.KnowledgeEngine.factValue(facts, title))) {
        hasSellFlag = true;
      }
    });

    if (manualCount > 0) {
      this.pushFeature(rows, instrument, "ручной рейтинг заполнен", manualScore, Math.round((manualScore - 50) / 5), "ручные оценки", "Ручной рейтинг уточняет автоматическую оценку.", "Ручная", now);
    } else {
      this.pushFeature(rows, instrument, "ручной рейтинг отсутствует", "Нет", -5, "ручные оценки", "Недостаточно данных для уверенной оценки.", "Низкая", now);
    }

    if (hasSellFlag) {
      this.pushFeature(rows, instrument, "есть сигнал проверки продажи", "Да", -40, "ручные флаги риска", "Есть фундаментальный сигнал для ручной проверки продажи.", "Ручная", now);
    }
  },

  marketFeatures: function(rows, instrument, facts, now) {
    var keyRate = Number(this.factValue(facts, "ключевая ставка")) || 0;
    var drawdown = Number(this.factValue(facts, "просадка рынка")) || 0;
    var multiplier = Number(this.factValue(facts, "множитель покупки акций")) || 1;

    this.pushFeature(rows, instrument, "ключевая ставка высокая", keyRate, keyRate >= 0.15 ? 10 : 0, "ключевая ставка", keyRate >= 0.15 ? "Высокая ставка повышает привлекательность облигационной части." : "Ключевая ставка не требует усиления облигаций.", "Средняя", now);
    this.pushFeature(rows, instrument, "рынок в просадке", drawdown, multiplier > 1 ? 10 : 0, "просадка рынка", multiplier > 1 ? "Просадка рынка повышает приоритет покупок акций по плану." : "Рынок без существенной просадки.", "Средняя", now);
  },

  scoreMap: function() {
    var result = {};

    TI.Data.sheetObjects(this.SCORES_SHEET).forEach(function(row) {
      var instrument = String(row.instrument || "").trim().toUpperCase();
      if (instrument) result[instrument] = row;
    });

    return result;
  },

  groupFacts: function(facts) {
    var result = {};

    facts.forEach(function(row) {
      var instrument = String(row.instrument || "").trim();
      var key = String(row.factKey || "").trim();

      if (!instrument || !key) return;
      if (!result[instrument]) result[instrument] = {};

      result[instrument][key] = row;
    });

    return result;
  },

  factValue: function(facts, key) {
    return facts[key] ? facts[key].value : "";
  },

  decision: function(score, confidence) {
    if (confidence === "Низкая") return "Недостаточно данных";
    if (score >= 85) return "Покупать активно";
    if (score >= 70) return "Покупать по плану";
    if (score >= 50) return "Держать, но не увеличивать";
    return "Проверить продажу";
  },

  pushFact: function(rows, instrument, key, value, source, updatedAt, confidence, stale, comment) {
    rows.push({
      instrument: instrument,
      factKey: key,
      value: value,
      source: source,
      updatedAt: updatedAt,
      confidence: confidence,
      stale: stale,
      comment: comment || ""
    });
  },

  pushFeature: function(rows, instrument, key, value, score, facts, explanation, confidence, updatedAt) {
    rows.push({
      instrument: instrument,
      featureKey: key,
      value: value,
      score: score,
      facts: facts,
      explanation: explanation,
      confidence: confidence,
      updatedAt: updatedAt
    });
  },

  ratingFactTitle: function(field) {
    var map = {
      dividends: "дивиденды",
      profitGrowth: "рост прибыли",
      debt: "долг",
      marketPosition: "положение на рынке",
      pricePotential: "потенциал роста",
      stability: "стабильность"
    };

    return map[field] || field;
  },

  flagFactTitle: function(field) {
    var map = {
      thesisBroken: "тезис нарушен",
      dangerousDebt: "долг опасен",
      noProfit: "нет прибыли",
      badGovernance: "проблемы управления",
      fundamentalsWorse: "фундамент ухудшился",
      highRisk: "высокий риск"
    };

    return map[field] || field;
  },

  write: function(sheetName, rows) {
    var sheet = Schema.prepareSheet(sheetName);

    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .clearContent();
    }

    if (!rows || rows.length === 0) {
      return 0;
    }

    var values = rows.map(function(row) {
      return Schema.buildRow(sheetName, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
    return values.length;
  }

};

function TI_BuildKnowledgeEngine() {
  var stats = TI.KnowledgeEngine.build();

  SpreadsheetApp.getUi().alert(
    "Факты и оценки обновлены.\n\n" +
    "Фактов: " + stats.facts + "\n" +
    "Признаков: " + stats.features + "\n" +
    "Оценок: " + stats.scores
  );

  return stats;
}
