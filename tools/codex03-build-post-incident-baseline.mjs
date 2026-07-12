import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (name) => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
const digests = read('audit/codex03_post_incident_digests.json');
const masked = read('audit/codex03_post_incident_masked_sheets.json');
const trades = read('audit/CODEX-03-NEW-TRADES-VALIDATION.json');
const suffix = (value) => value ? `…${String(value).slice(-6)}` : '';

const keys = {
  'Сделки': ['Account ID', 'Operation ID', 'Trade ID'],
  'Портфель': ['Account ID', 'Instrument UID/FIGI/Asset UID'],
  'Главная': ['Раздел', 'Показатель'],
  'Здоровье портфеля': ['Разрез', 'Название'],
  'Советник': ['Приоритет', 'Категория', 'Счёт', 'Инструмент'],
  'План сделок': ['Счёт', 'Действие', 'Тикер', 'Разрез', 'Цель'],
  'Диагностика': ['Раздел', 'Проверка', 'Обновлено'],
};
const selected = [
  'Сделки', 'Портфель', 'Главная', 'Здоровье портфеля', 'Советник',
  'План сделок', 'Диагностика', 'Конституция', 'Продажи FIFO', 'Лоты FIFO',
  'Налоги', 'Справочник', 'Кэш', 'Данные источников',
];
const sheets = {};
for (const name of selected) {
  const item = digests.sheets[name];
  if (!item) continue;
  sheets[name] = {
    rows: item.rows,
    columns: item.columns,
    digestSuffix: suffix(item.digest),
    semanticDigestSuffix: suffix(item.semanticDigest),
    formulaDigestSuffix: suffix(item.formulaDigest),
    uniqueKey: keys[name] || ['schema-defined row identity'],
  };
}

const tradeDates = trades.rows.map((row) => row.date).filter(Boolean).sort();
const payload = {
  capturedAt: digests.capturedAt,
  incidentClassification: 'CONCURRENT_MANUAL_SYNC_DURING_RECALC_TEST',
  backup: {
    name: 'CODEX-03 Post Incident Full Backup 20260712-1616',
    spreadsheetSuffix: '…RJDT0k',
    fullSpreadsheetCopy: true,
  },
  spreadsheet: {
    sheetCount: digests.sheetCount,
    originalSpreadsheetSuffix: '…nR2p_4',
  },
  trades: {
    priorAcceptedRows: 149,
    currentRows: trades.currentDataRows,
    newRows: trades.newRowsValidated,
    validNewTrades: trades.validNewTrades,
    requiresReview: trades.requiresReviewCount,
    duplicateFullRows: trades.duplicateCount,
    invalidRows: trades.invalidCount,
    latestTradeTimestamp: tradeDates.at(-1) || '',
    productionDataMustNotBeRolledBack: true,
    validationFile: 'audit/CODEX-03-NEW-TRADES-VALIDATION.json',
  },
  absentStandaloneSheets: {
    'Операции': 'No standalone sheet exists; operations are fetched/cached and normalized into Сделки.',
    'Цены': 'No standalone sheet exists; price state is represented in Портфель/Справочник/Кэш/Данные источников.',
  },
  sheets,
  maskedUserSheetSnapshot: {
    source: 'audit/codex03_post_incident_masked_sheets.json',
    sheetNames: Object.keys(masked.sheets || {}),
  },
  syncState: {
    mode: digests.syncState?.mode,
    status: digests.syncState?.status,
    failedStep: digests.syncState?.context?.failedStep,
    apiCallCount: digests.syncState?.context?.apiCallCount,
    runId: digests.syncState?.context?.runId,
  },
};

writeFileSync(resolve(root, 'audit/CODEX-03-POST-INCIDENT-DATA-BASELINE.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: true, sheets: Object.keys(sheets).length, trades: payload.trades }, null, 2)}\n`);
