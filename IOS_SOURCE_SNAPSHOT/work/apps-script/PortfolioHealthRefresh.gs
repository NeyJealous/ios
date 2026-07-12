/**
 * CODEX-03 preview and backup helpers. Refresh itself must run through Recalc/Quick.
 */
TI.PortfolioHealthRefresh = {
  preview: function() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return { ok: false, code: "LOCK_TIMEOUT", dryRun: true };
    try {
      var active = TI.BatchSync.status();
      if (active && active.status === "running") {
        return { ok: false, code: "SYNC_ALREADY_RUNNING", dryRun: true };
      }
      TI.BatchSync.setNoApiMode(true);
      var proposedObjects = TI.PortfolioHealth.build();
      var proposed = proposedObjects.map(function(row) {
        return Schema.buildRow(CORE.SHEETS.PORTFOLIO_HEALTH, row);
      });
      var sheet = Schema.ensureSheet(CORE.SHEETS.PORTFOLIO_HEALTH);
      var current = sheet.getLastRow() > 1
        ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
        : [];
      var headers = Schema.getColumns(CORE.SHEETS.PORTFOLIO_HEALTH).map(function(field) {
        return field.title;
      });
      var changes = [];
      var rowCount = Math.max(current.length, proposed.length);
      var columnCount = headers.length;
      for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
          var oldValue = this.jsonValue(current[r] ? current[r][c] : "");
          var newValue = this.jsonValue(proposed[r] ? proposed[r][c] : "");
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ row: r + 2, column: headers[c], before: oldValue, after: newValue });
          }
        }
      }
      var aggregate = proposedObjects.filter(function(row) { return row.scopeType === "Весь портфель"; })[0] || {};
      return {
        ok: proposedObjects.length > 0 && Number(aggregate.positions) === 1 && Number(aggregate.marketValue) > 10000,
        dryRun: true,
        sourceSheet: "Портфель",
        targetSheet: "Здоровье портфеля",
        currentRows: current.length,
        proposedRows: proposed.length,
        changedCells: changes.length,
        changes: changes,
        aggregate: {
          positions: Number(aggregate.positions) || 0,
          marketValue: Number(aggregate.marketValue) || 0
        },
        accountStrategyIdsValid: TI.AccountStrategyAudit.snapshot().ok,
        refreshPipeline: "recalc"
      };
    } finally {
      TI.BatchSync.setNoApiMode(false);
      lock.releaseLock();
    }
  },

  jsonValue: function(value) {
    return value instanceof Date ? value.toISOString() : value;
  },

  backup: function() {
    var preview = this.preview();
    if (!preview.ok) return preview;
    var source = SpreadsheetApp.openById(TI.AccountStrategyMigration.SPREADSHEET_ID);
    var sourceSheet = source.getSheetByName("Здоровье портфеля");
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    var name = "CODEX-03 Portfolio Health Backup " + stamp;
    var backup = SpreadsheetApp.create(name);
    var copied = sourceSheet.copyTo(backup).setName("Здоровье портфеля");
    backup.getSheets().forEach(function(sheet) {
      if (sheet.getSheetId() !== copied.getSheetId()) backup.deleteSheet(sheet);
    });
    return {
      ok: true,
      code: "PORTFOLIO_HEALTH_BACKUP_CREATED",
      backupName: name,
      backupSpreadsheetSuffix: TI.AccountStrategyAudit.suffix(backup.getId()),
      sourceSpreadsheetSuffix: TI.AccountStrategyAudit.suffix(source.getId()),
      sheet: "Здоровье портфеля",
      rowCount: sourceSheet.getLastRow() - 1,
      changedCellsPlanned: preview.changedCells
    };
  }
};

function TI_PreviewPortfolioHealthRefresh() {
  return TI.PortfolioHealthRefresh.preview();
}

function TI_BackupPortfolioHealthForCodex03() {
  return TI.PortfolioHealthRefresh.backup();
}

function TI_StartRecalcForCodex03() {
  var state = TI.BatchSync.start("codex-03", "recalc");
  return state.status === "blocked" ? state : TI.BatchSync.runNext();
}
