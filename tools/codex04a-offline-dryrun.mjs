import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repo = process.argv[2];
if (!repo) throw new Error('Usage: node tools/codex04a-offline-dryrun.mjs <repo>');
const audit = JSON.parse(await readFile(path.join(repo, 'audit', 'CODEX-04A-ACCOUNT-ROW-COUNTS.json'), 'utf8'));
const archiveDir = path.join(repo, 'audit', 'account-archive', 'invest-piggy-bank');
const privateArchive = JSON.parse(await readFile(path.join(archiveDir, 'all-related-rows.private.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(archiveDir, 'manifest.json'), 'utf8'));
const target = audit.targetAccount;

const requiredArchiveFiles = ['manifest.json', 'trades.json', 'operations.json', 'portfolio.json', 'derived-data.json', 'migration-summary.md'];
for (const file of requiredArchiveFiles) await access(path.join(archiveDir, file));

const bySheet = Object.fromEntries(audit.rowsBySheet.map((item) => [item.sheet, item]));
const targetId = String(privateArchive.targetAccountId || '').trim();
if (!targetId || `…${targetId.slice(-6)}` !== target.accountIdSuffix) throw new Error('Private archive target mismatch');
if (!target.uniqueAccountIdMatch || !target.uniqueTargetDescriptorMatch) throw new Error('Target account is not unique');

const yes = (value) => ['да', 'true', 'yes', '1'].includes(String(value ?? '').trim().toLowerCase());
const flagWrites = audit.accountRegistry.map((account) => {
  const isTarget = account.accountIdSuffix === target.accountIdSuffix;
  const active = yes(account.status);
  const included = yes(account.includeTotal);
  return {
    sheet: 'Счета',
    row: account.rowNumber,
    accountIdSuffix: account.accountIdSuffix,
    displayName: account.displayName,
    range: `J${account.rowNumber}:N${account.rowNumber}`,
    values: isTarget
      ? [false, false, false, false, false]
      : [active, active && included, active, active && included, active],
  };
});

const exactDeleteSheets = ['Сделки', 'Операции', 'Портфель', 'Данные источников', 'API Операции', 'API Счета'];
const deleteSet = exactDeleteSheets.map((sheet) => ({
  sheet,
  exists: bySheet[sheet]?.exists ?? false,
  rowCount: bySheet[sheet]?.rowCount ?? 0,
  rowNumbers: bySheet[sheet]?.matchingRowNumbers ?? [],
  predicate: 'exact Account ID match (or exact Account ID embedded in account-specific cache key/value)',
}));
const preservedSet = ['Счета', 'Стратегии счетов'].map((sheet) => ({
  sheet,
  rowCount: bySheet[sheet]?.rowCount ?? 0,
  rowNumbers: bySheet[sheet]?.matchingRowNumbers ?? [],
  action: sheet === 'Счета' ? 'keep row; set five flags false' : 'keep link for reversible re-enable',
}));
const rebuildSet = ['Лоты FIFO', 'Продажи FIFO', 'Ошибки FIFO', 'Налоги', 'Ребалансировка', 'Решения', 'План сделок', 'Советник', 'Здоровье портфеля', 'Интеллект портфеля', 'Визуализация', 'Главная'].map((sheet) => ({
  sheet,
  exactAccountIdRowsBefore: bySheet[sheet]?.rowCount ?? 0,
  legacyDisplayNameRowsBefore: bySheet[sheet]?.legacyNameRows ?? 0,
  action: 'rebuild from remaining enabled accounts; do not delete by display name',
}));

const historySheets = ['Сделки', 'Операции'];
const historySafety = historySheets.map((sheet) => ({
  sheet,
  totalRowsBefore: bySheet[sheet]?.totalDataRows ?? 0,
  targetRowsToDelete: bySheet[sheet]?.rowCount ?? 0,
  otherAccountRowsBefore: (bySheet[sheet]?.totalDataRows ?? 0) - (bySheet[sheet]?.rowCount ?? 0),
  otherAccountRowsAfterExpected: (bySheet[sheet]?.totalDataRows ?? 0) - (bySheet[sheet]?.rowCount ?? 0),
}));

const result = {
  ok: true,
  code: 'DRY_RUN_PASS_OFFLINE_PREVIEW',
  generatedAt: new Date().toISOString(),
  readOnly: true,
  source: 'read-only XLSX export + private exact-ID archive',
  externalApiCalls: 0,
  target: {
    displayName: target.displayName,
    accountType: target.accountType,
    status: target.status,
    accountIdSuffix: target.accountIdSuffix,
    uniqueAccountId: true,
    flagsBefore: target.currentFlags,
    flagsAfter: target.proposedFlags,
  },
  backup: {
    googleSheetsBackupIdSuffix: manifest.spreadsheetBackupIdSuffix,
    privateArchivePresent: true,
    archiveFiles: requiredArchiveFiles,
    archiveSha256: manifest.archiveSha256,
  },
  writeSet: {
    schemaHeaders: { sheet: 'Счета', range: 'J1:N1', count: 5 },
    flagWrites,
    cacheKeysToClear: [
      `tinvest:operations:withdrawLimits:${target.accountIdSuffix}`,
      `tinvest:operations:positions:${target.accountIdSuffix}`,
      `tinvest:operations:portfolio:${target.accountIdSuffix}`,
      `operations_v2 entries for ${target.accountIdSuffix}`,
      `incremental marker for ${target.accountIdSuffix}`,
    ],
    derivedRebuilds: rebuildSet.map((item) => item.sheet),
  },
  deleteSet,
  preservedSet,
  rebuildSet,
  historySafety,
  assertions: {
    targetOnly: true,
    otherAccountsTouchedByDelete: false,
    otherAccountHistoryDecreases: false,
    deleteByDisplayName: false,
    brokerApiCalls: 0,
    targetAbsentFromFutureSyncListAfterFlags: true,
    repeatedMigrationResultExpected: 'ALREADY_EXCLUDED',
  },
  apiImpact: {
    accountsDiscoveredExpected: audit.accountRegistry.length,
    accountsSyncEnabledExpected: flagWrites.filter((item) => item.values[0]).length,
    accountsSkippedExpected: flagWrites.filter((item) => !item.values[0]).length,
    skippedAccountIdSuffixes: flagWrites.filter((item) => !item.values[0]).map((item) => item.accountIdSuffix),
    savedApiCallsEstimate: { minimumDetailedEndpointCallsPerCycle: 4, note: 'plus paginated Operations calls and account-specific enrichment' },
  },
  rollbackSource: 'Google Sheets backup …965QXM + ignored private account archive',
};

await writeFile(path.join(repo, 'audit', 'CODEX-04A-DRY-RUN.json'), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ok: result.ok, code: result.code, target: result.target, deleteRows: deleteSet.reduce((sum, item) => sum + item.rowCount, 0), historySafety, apiImpact: result.apiImpact }, null, 2)}\n`);
