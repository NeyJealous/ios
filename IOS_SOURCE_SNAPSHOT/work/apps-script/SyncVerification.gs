/** Read-only CODEX-03 sheet/digest verification. */
TI.SyncVerification = {
  digest: function(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(value));
    return bytes.map(function(byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    }).join("");
  },

  sheetSnapshot: function(sheet) {
    var values = sheet.getDataRange().getValues();
    var formulas = sheet.getDataRange().getFormulas();
    var headers = values[0] || [];
    var volatileColumns = {};
    headers.forEach(function(value, index) {
      if (/обновлено|дата расч[её]та|updated/i.test(String(value || ""))) volatileColumns[index] = true;
    });
    var semantic = values.map(function(row) {
      return row.map(function(value, index) {
        if (volatileColumns[index]) return "<volatile>";
        return value instanceof Date ? value.toISOString() : value;
      });
    });
    return {
      rows: Math.max(values.length - 1, 0),
      columns: headers.length,
      digest: this.digest(values),
      semanticDigest: this.digest(semantic),
      formulaDigest: this.digest(formulas)
    };
  },

  snapshot: function() {
    var spreadsheet = SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
    var sheets = {};
    spreadsheet.getSheets().forEach(function(sheet) {
      sheets[sheet.getName()] = TI.SyncVerification.sheetSnapshot(sheet);
    });
    var health = TI.Data.sheetObjects(CORE.SHEETS.PORTFOLIO_HEALTH);
    var aggregate = health.filter(function(row) { return row.scopeType === "Весь портфель"; })[0] || {};
    return {
      ok: true,
      capturedAt: new Date().toISOString(),
      sheetCount: spreadsheet.getSheets().length,
      sheets: sheets,
      portfolioHealth: {
        rows: health.length,
        aggregatePositions: Number(aggregate.positions) || 0,
        aggregateMarketValue: Number(aggregate.marketValue) || 0,
        hasPassive: health.some(function(row) { return row.scopeName === "Пассивный"; }),
        hasStaleTattoo: health.some(function(row) { return row.scopeName === "На тату"; }),
        technicalIdColumns: Schema.getColumns(CORE.SHEETS.PORTFOLIO_HEALTH).filter(function(column) {
          return /(id|uid|figi)/i.test(column.field || column.title || "");
        }).length
      },
      syncState: TI.BatchSync.status()
    };
  }
};

function TI_SnapshotCodex03() {
  return TI.SyncVerification.snapshot();
}

/** Creates one full pre-test copy without changing the source spreadsheet. */
function TI_CreateCodex03FinalSyncBackup() {
  var spreadsheet = SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  var name = "CODEX-03 Final Sync Backup " + stamp;
  var backup = spreadsheet.copy(name);
  return {
    ok: true,
    code: "BACKUP_CREATED",
    createdAt: new Date().toISOString(),
    backupName: name,
    originalSpreadsheetSuffix: TI.AccountStrategyMigration.suffix(spreadsheet.getId()),
    backupSpreadsheetSuffix: TI.AccountStrategyMigration.suffix(backup.getId()),
    sheetCount: backup.getSheets().length
  };
}

function TI_StartQuickForCodex03() {
  var state = TI.BatchSync.start("codex-03", "quick");
  return state.status === "blocked" ? state : TI.BatchSync.runNext();
}

function TI_StartFullForCodex03() {
  var state = TI.BatchSync.start("codex-03", "full");
  return state.status === "blocked" ? state : TI.BatchSync.runNext();
}
