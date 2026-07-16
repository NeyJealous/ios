import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const controlPath = resolve(source, 'AccountControl.gs');
const menu = readFileSync(resolve(source, 'Menu.gs'), 'utf8');
const html = readFileSync(resolve(source, 'AccountControlDialog.html'), 'utf8');
const control = readFileSync(controlPath, 'utf8');
let auditData = [];

const digest = (value) => JSON.stringify(value);
const context = {
  console,
  CORE: {
    SHEETS: { ACCOUNTS: 'Счета', ACCOUNT_SCOPE_AUDIT: 'История настроек счетов', PORTFOLIO: 'Портфель' },
    SERVICE_SHEETS: { API_OPERATIONS: 'API Операции' },
  },
  TI: {
    SyncVerification: { digest },
    AccountStrategyAudit: { suffix: (value) => value ? `…${String(value).slice(-6)}` : '' },
    AccountScope: {
      isTrue: (value) => value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'да',
    },
    AccountPurgeMigration: {
      COMMIT_KEY: 'commit',
      directCaptures: () => ({}),
      directCounts: () => ({ total: 1 }),
    },
    Data: { portfolio: () => [], trades: () => [], sheetObjects: () => auditData.slice() },
    MultiAccount: { accounts: () => [], accountStrategies: () => [], strategyMap: () => ({}) },
    CompanyRating: { isYes: () => true },
  },
  SpreadsheetApp: {
    getActive: () => ({
      getSheetByName: () => ({ getLastRow: () => auditData.length + 1 }),
    }),
  },
};
vm.createContext(context);
vm.runInContext(control, context, { filename: controlPath });
const contract = context.TI_TestAccountControlContract();
const emptyHistory = context.TI.AccountControl.auditHistory();
auditData = [
  {
    timestamp: new Date('2026-07-16T18:00:00.000Z'),
    runId: '…apply1',
    accountIdMasked: '…111111',
    beforeDisplay: true,
    afterDisplay: false,
    reason: 'apply',
    previewHash: 'hash-apply',
    scopeRevisionBefore: 'before',
    scopeRevisionAfter: 'after',
    result: 'APPLIED',
    rollbackAvailable: true,
  },
  {
    timestamp: new Date(Number.NaN),
    runId: '…roll01',
    accountIdMasked: '…111111',
    beforeDisplay: false,
    afterDisplay: true,
    reason: 'rollback',
    previewHash: 'hash-rollback',
    scopeRevisionBefore: 'after',
    scopeRevisionAfter: 'before',
    result: 'ROLLED_BACK',
    rollbackAvailable: false,
  },
];
const history = context.TI.AccountControl.auditHistory();
const historyJson = JSON.stringify(history);

const requiredMenu = [
  'Настроить счета',
  'Проверить настройки счетов',
  'Предпросмотр влияния',
  'История изменений',
  'Восстановить предыдущие настройки',
];
const requiredFunctions = [
  'TI_PreviewAccountScopeChanges',
  'TI_ApplyAccountScopeChanges',
  'TI_PreviewAccountScopeRollback',
  'TI_ApplyAccountScopeRollback',
  'TI_AccountScopeDiagnostics',
];
const assertions = {
  contract: contract.ok,
  menuItems: requiredMenu.every((item) => menu.includes(item)),
  topLevelFunctions: requiredFunctions.every((name) => control.includes(`function ${name}`)),
  noRawAccountIdInput: !/<input[^>]+account.?id/i.test(html),
  optimisticLock: control.includes('ACCOUNT_SCOPE_REVISION_CONFLICT'),
  globalLock: control.includes('LockService.getScriptLock()'),
  exactCellWrites: control.includes('writeChangedFlagCells') &&
    control.includes('getRangeList(trueRanges).setValue(true)'),
  idempotencyGuard: control.includes('ACCOUNT_SCOPE_IDEMPOTENCY_CONFLICT'),
  rollbackTargetGuard: control.includes('ACCOUNT_SCOPE_ROLLBACK_TARGET_CONFLICT'),
  rollbackSnapshotNotOverwritten: control.includes('suppressRollbackSnapshot: true'),
  repeatedRollbackSafe: control.includes('deleteProperty(this.SNAPSHOT_KEY)'),
  historyDateIso: history[1].timestamp === '2026-07-16T18:00:00.000Z',
  invalidDateSafe: history[0].timestamp === null,
  historyJsonSafe: JSON.parse(historyJson).length === 2,
  historyMasked: history.every((row) => /^…\d{6}$/.test(row.accountIdMasked)),
  historyReadOnly: auditData.length === 2,
  emptyHistory: Array.isArray(emptyHistory) && emptyHistory.length === 0,
  historyUiContract: history.every((row) =>
    Object.hasOwn(row, 'timestamp') &&
    Object.hasOwn(row, 'runId') &&
    Object.hasOwn(row, 'result') &&
    Object.hasOwn(row, 'rollbackAvailable')),
  noAutomaticPurge: !/TI_ApplyExcludeAccountPurge\s*\(/.test(control),
  noArchiveRestore: !/restoreCapturedRows\s*\(/.test(control),
  marketRegimeUntouched: !/TI_BuildMarketRegime|MarketRegime\./.test(control),
  noForcePushInstructions: !/clasp push --force/.test(control + html),
  auditSheet: control.includes('CORE.SHEETS.ACCOUNT_SCOPE_AUDIT'),
  maskedIds: contract.fullIdsMasked,
  presets: contract.presets === 5,
  invalidRecommendationsRejected: contract.recommendationsWithoutCalculationRejected,
  displayWithoutCalculation: contract.displayWithoutCalculationSupported,
};
const result = { ok: Object.values(assertions).every(Boolean), assertions, contract };
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 2);
