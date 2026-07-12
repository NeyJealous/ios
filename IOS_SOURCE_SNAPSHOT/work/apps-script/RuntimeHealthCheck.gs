/**
 * CODEX-00 runtime-only health check.
 * Does not call external services or mutate spreadsheet data.
 *
 * @return {Object} JSON-safe runtime status.
 */
function TI_RemoteHealthCheck() {
  var spreadsheet = SpreadsheetApp.openById('1s3l54M4sAILAd31nfMRKXS7R2NHX2SDYNaqk9nR2p_4');
  var sheets = spreadsheet.getSheets().map(function (sheet) {
    return sheet.getName();
  });

  return {
    ok: true,
    projectVersion: String(CORE.PROJECT.VERSION || 'unknown'),
    spreadsheetName: spreadsheet.getName(),
    sheetCount: sheets.length,
    sheets: sheets
  };
}
