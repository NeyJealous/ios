import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script', 'AccountControl.gs');
const source = readFileSync(sourcePath, 'utf8');
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const flagFields = [
  'Sync_Enabled', 'Calculation_Enabled', 'Display_Enabled',
  'Recommendations_Enabled', 'History_Enabled',
];
const flagTitles = [
  'Синхронизировать', 'Учитывать в расчётах', 'Показывать',
  'Использовать в рекомендациях', 'Хранить историю',
];
const headers = ['ID счёта', 'Название', ...flagTitles];
const rows = [
  ['111111', 'Тестовый display-счёт', true, false, true, false, true],
  ['222222', 'Тестовый calculation-счёт', true, true, true, true, true],
  ['333333', 'Тестовый исключённый счёт', false, false, false, false, false],
];
const properties = new Map();
const auditRows = [];
const physicalWrites = [];
const columnName = (column) => {
  let value = column;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
};
const parseA1 = (a1) => {
  const match = /^([A-Z]+)(\d+)$/.exec(a1);
  let column = 0;
  for (const char of match[1]) column = column * 26 + char.charCodeAt(0) - 64;
  return { row: Number(match[2]), column };
};
const sheet = {
  getDataRange: () => ({ getValues: () => [headers.slice(), ...rows.map((row) => row.slice())] }),
  getRange: (row, column) => ({ getA1Notation: () => `${columnName(column)}${row}` }),
  getRangeList: (ranges) => ({
    setValue: (value) => {
      for (const a1 of ranges) {
        const cell = parseA1(a1);
        rows[cell.row - 2][cell.column - 1] = value;
        physicalWrites.push({ a1, value });
      }
    },
  }),
};
const accountObjects = () => rows.map((row) => {
  const account = { accountId: row[0], accountName: row[1] };
  flagFields.forEach((field, index) => { account[field] = row[index + 2]; });
  return account;
});
const context = {
  console,
  Date,
  JSON,
  CORE: {
    SHEETS: { ACCOUNTS: 'Счета', ACCOUNT_SCOPE_AUDIT: 'История настроек счетов', PORTFOLIO: 'Портфель' },
    SERVICE_SHEETS: { API_OPERATIONS: 'API Операции' },
  },
  TI: {
    SyncVerification: { digest },
    AccountStrategyAudit: { suffix: (value) => `…${String(value).slice(-6)}` },
    AccountScope: {
      isTrue: (value) => value === true || value === 1 || String(value).toLowerCase() === 'true',
      resetExecutionCache: () => {},
    },
    AccountPurgeMigration: {
      COMMIT_KEY: 'commit',
      directCaptures: () => ({}),
      directCounts: () => ({ total: 1 }),
    },
    Data: { portfolio: () => [], trades: () => [], sheetObjects: () => [] },
    MultiAccount: {
      accounts: accountObjects,
      accountStrategies: () => [],
      strategyMap: () => ({}),
    },
    CompanyRating: { isYes: () => true },
    BatchSync: { status: () => ({ status: 'complete' }) },
    TechLog: { info: () => {} },
  },
  LockService: {
    getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
  },
  Utilities: { getUuid: () => 'test-run-abcdef' },
  PropertiesService: {
    getDocumentProperties: () => ({
      getProperty: (key) => properties.get(key) ?? null,
      setProperty: (key, value) => properties.set(key, value),
      deleteProperty: (key) => properties.delete(key),
    }),
  },
  SpreadsheetApp: {
    getActive: () => ({ getSheetByName: (name) => name === 'Счета' ? sheet : null }),
    flush: () => {},
  },
  Schema: {
    prepareSheet: () => ({
      getLastRow: () => auditRows.length + 1,
      getRange: () => ({ setValues: (values) => auditRows.push(...values) }),
    }),
    buildRow: (_name, row) => row,
  },
  Session: { getActiveUser: () => ({ getEmail: () => 'test@example.invalid' }) },
};
vm.createContext(context);
vm.runInContext(source, context, { filename: sourcePath });

const control = context.TI.AccountControl;
const initial = control.scopeSnapshot();
const target = accountObjects()[0];
const request = {
  scopeRevision: initial.revision,
  reason: 'CODEX-04B Gate B controlled Display-only test',
  criticalConfirmation: false,
  idempotencyKey: 'gate-b-display-off',
  changes: [{
    accountRef: control.accountRef(target.accountId),
    flags: {
      Sync_Enabled: true,
      Calculation_Enabled: false,
      Display_Enabled: false,
      Recommendations_Enabled: false,
      History_Enabled: true,
    },
  }],
};
const preview = control.preview(request);
request.previewHash = preview.previewHash;
const apply = control.apply(request);
const writesAfterApply = physicalWrites.length;
const replay = control.apply(request);
const rollbackPreview = control.previewRollback({ rollbackRunId: apply.runId });
const rollbackRequest = {
  rollbackRunId: apply.runId,
  scopeRevision: control.scopeSnapshot().revision,
  previewHash: rollbackPreview.previewHash,
  idempotencyKey: 'gate-b-display-rollback',
  reason: 'CODEX-04B Gate B rollback',
};
const rollback = control.applyRollback(rollbackRequest);
const writesAfterRollback = physicalWrites.length;
const repeatedRollback = control.applyRollback(rollbackRequest);
const stale = control.preview({ scopeRevision: 'stale', changes: [] });
const finalFlags = control.flagArray(accountObjects()[0]).join('/');
const snapshotRaw = properties.get(control.SNAPSHOT_KEY);

const assertions = {
  previewReadOnly: preview.ok && preview.writes === 0 && preview.apiCalls === 0,
  previewOneCell: preview.changes.length === 1 && preview.changes[0].changedFlags.join('/') === 'Display_Enabled',
  exactApplyWrite: apply.ok && apply.writes === 1 && writesAfterApply === 1,
  onlyDisplayWritten: physicalWrites[0]?.a1 === 'E2' && physicalWrites[0]?.value === false,
  idempotentApply: replay.ok && replay.idempotent === true && replay.writes === 0 && physicalWrites.length === 2,
  rollbackBoundToRun: rollbackPreview.ok && rollbackPreview.changes.length === 1,
  exactRollbackWrite: rollback.ok && rollback.code === 'ROLLED_BACK' &&
    rollback.writes === 1 && writesAfterRollback === 2,
  rollbackConsumed: snapshotRaw === undefined && rollback.rollbackAvailable === false,
  repeatedRollbackSafe: !repeatedRollback.ok &&
    repeatedRollback.code === 'ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE' &&
    repeatedRollback.writes === 0 && physicalWrites.length === 2,
  revisionConflict: !stale.ok && stale.code === 'ACCOUNT_SCOPE_REVISION_CONFLICT',
  finalSemanticsRestored: finalFlags === 'true/false/true/false/true',
  auditApplyAndRollback: auditRows.length === 2 &&
    auditRows[0].result === 'APPLIED' && auditRows[1].result === 'ROLLED_BACK',
};
const result = {
  ok: Object.values(assertions).every(Boolean),
  assertions,
  metrics: {
    applyPhysicalWrites: writesAfterApply,
    rollbackPhysicalWrites: writesAfterRollback - writesAfterApply,
    repeatedApplyWrites: replay.writes,
    repeatedRollbackWrites: repeatedRollback.writes,
    auditRows: auditRows.length,
  },
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 2);
