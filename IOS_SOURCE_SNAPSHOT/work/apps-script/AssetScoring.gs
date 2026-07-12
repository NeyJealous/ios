/**
 * ============================================================
 * Инвестиционный помощник
 * ------------------------------------------------------------
 * Модуль: AssetScoring.gs
 * Версия: 2.0.0
 * Назначение:
 *   Единая оценка активов для советника и будущих решений.
 * ============================================================
 */

var TI = TI || {};

TI.AssetScoring = {

  SHEET: CORE.SHEETS.ASSET_SCORING,

  prepare: function() {
    return Schema.prepareSheet(this.SHEET);
  },

  build: function() {
    var directory = TI.Directory.readExisting();
    var ratings = TI.CompanyRating.mapByTicker();
    var bonds = TI.BondEngine.mapByTicker();
    var knowledge = TI.KnowledgeEngine.scoreMap();
    var now = new Date();
    var rows = [];

    directory.forEach(function(item) {
      var ticker = String(item.ticker || "").trim().toUpperCase();

      if (!ticker) {
        return;
      }

      rows.push(TI.AssetScoring.rowForInstrument(item, ratings[ticker], bonds[ticker], knowledge[ticker], now));
    });

    rows.sort(function(a, b) {
      var type = String(a.instrumentType).localeCompare(String(b.instrumentType));
      return type !== 0 ? type : String(a.ticker).localeCompare(String(b.ticker));
    });

    this.write(rows);
    return rows;
  },

  rowForInstrument: function(item, rating, bond, knowledge, now) {
    var type = TI.Rebalance.normalizeInstrumentType(item.instrumentType || "");

    if (type === "Облигации") {
      return this.bondRow(item, bond, now);
    }

    if (rating) {
      return this.ratingRow(item, rating, now);
    }

    if (knowledge) {
      return this.knowledgeRow(item, knowledge, now);
    }

    return this.emptyRow(item, now);
  },

  bondRow: function(item, bond, now) {
    bond = bond || {};

    return {
      ticker: String(item.ticker || "").trim().toUpperCase(),
      name: item.name || bond.name || "",
      instrumentType: "Облигации",
      scoreType: "Облигационная оценка",
      score: Number(bond.score) || 0,
      decision: bond.decision || "Заполнить параметры",
      confidence: bond.confidence || "Низкая",
      reasons: bond.reasons || "Сначала рассчитайте анализ облигаций.",
      risks: bond.creditRisk ? "Кредитный риск: " + bond.creditRisk : "Нет полной оценки риска.",
      source: "Анализ облигаций",
      updatedAt: now
    };
  },

  ratingRow: function(item, rating, now) {
    return {
      ticker: String(item.ticker || rating.ticker || "").trim().toUpperCase(),
      name: item.name || rating.name || "",
      instrumentType: TI.Rebalance.normalizeInstrumentType(item.instrumentType || rating.instrumentType || ""),
      scoreType: "Рейтинг компании",
      score: Number(rating.totalRating) || 0,
      decision: rating.decision || "Заполнить рейтинг",
      confidence: rating.decision === "Заполнить рейтинг" ? "Низкая" : "Средняя",
      reasons: rating.comment || rating.investmentThesis || "Ручной рейтинг компании.",
      risks: this.ratingRisks(rating),
      source: "Рейтинг компаний",
      updatedAt: now
    };
  },

  knowledgeRow: function(item, knowledge, now) {
    return {
      ticker: String(item.ticker || knowledge.instrument || "").trim().toUpperCase(),
      name: item.name || "",
      instrumentType: TI.Rebalance.normalizeInstrumentType(item.instrumentType || ""),
      scoreType: knowledge.scoreType || "Факты и оценки",
      score: Number(knowledge.value) || 0,
      decision: knowledge.decision || "Недостаточно данных",
      confidence: knowledge.confidence || "Низкая",
      reasons: knowledge.reasons || "Оценка рассчитана из фактов и признаков.",
      risks: "",
      source: "Факты и оценки",
      updatedAt: now
    };
  },

  emptyRow: function(item, now) {
    return {
      ticker: String(item.ticker || "").trim().toUpperCase(),
      name: item.name || "",
      instrumentType: TI.Rebalance.normalizeInstrumentType(item.instrumentType || ""),
      scoreType: "Нет оценки",
      score: 0,
      decision: "Недостаточно данных",
      confidence: "Низкая",
      reasons: "Нет рейтинга компании, облигационной оценки или оценки фактов.",
      risks: "",
      source: "Справочник",
      updatedAt: now
    };
  },

  ratingRisks: function(rating) {
    var risks = [];

    [
      ["thesisBroken", "тезис нарушен"],
      ["dangerousDebt", "долг опасен"],
      ["noProfit", "нет прибыли"],
      ["badGovernance", "проблемы управления"],
      ["fundamentalsWorse", "фундамент ухудшился"],
      ["highRisk", "высокий риск"]
    ].forEach(function(pair) {
      if (TI.CompanyRating.isYes(rating[pair[0]])) {
        risks.push(pair[1]);
      }
    });

    return risks.join(", ");
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
      return Schema.buildRow(CORE.SHEETS.ASSET_SCORING, row);
    });

    sheet.getRange(2, 1, values.length, values[0].length)
      .setValues(values);

    return values.length;
  }

};

function TI_BuildAssetScoring() {
  var rows = TI.AssetScoring.build().length;

  SpreadsheetApp.getUi().alert(
    "Оценка активов рассчитана.\n\n" +
    "Строк: " + rows
  );

  return rows;
}
