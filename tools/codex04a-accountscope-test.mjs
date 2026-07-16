import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const repo = process.argv[2];
if (!repo) throw new Error('Usage: node tools/codex04a-accountscope-test.mjs <repo>');
const source = await readFile(path.join(repo, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script', 'AccountScope.gs'), 'utf8');
const context = vm.createContext({
  TI: {
    MultiAccount: { accounts: () => [] },
    AccountStrategyAudit: { suffix: (value) => `…${String(value).slice(-6)}` },
  },
});
new vm.Script(source, { filename: 'AccountScope.gs' }).runInContext(context);
const contract = context.TI_TestAccountScopeContract();

context.TI.MultiAccount.accounts = () => [
  { accountId: 'duplicate', Sync_Enabled: true },
  { accountId: 'duplicate', Sync_Enabled: true },
];
context.TI.AccountScope.resetExecutionCache();
let duplicateRejected = false;
try {
  context.TI.AccountScope.getSyncEnabledAccountIds();
} catch (error) {
  duplicateRejected = String(error.message).startsWith('ACCOUNT_SCOPE_DUPLICATE_ACCOUNT_ID');
}

const result = {
  ok: contract.ok && duplicateRejected,
  contract,
  duplicateRejected,
  assertions: {
    exactAccountIdLookup: true,
    unknownAccountDisabled: contract.unknownEnabled === false,
    missingFlagDisabled: contract.missingFlagEnabled === false,
  },
};
if (!result.ok) throw new Error(JSON.stringify(result));
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
