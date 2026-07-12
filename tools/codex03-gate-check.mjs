import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { resolve } from 'node:path';

const app = resolve(import.meta.dirname, '..', 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const files = readdirSync(app).filter((name) => name.endsWith('.gs'));
const contents = new Map();
const topLevel = new Map();
for (const file of files) {
  const source = readFileSync(resolve(app, file), 'utf8');
  contents.set(file, source);
  new vm.Script(source, { filename: file });
  for (const match of source.matchAll(/^function\s+([A-Za-z0-9_]+)\s*\(/gm)) {
    const list = topLevel.get(match[1]) || [];
    list.push(file);
    topLevel.set(match[1], list);
  }
}
const duplicates = [...topLevel].filter(([, owners]) => owners.length > 1);
if (duplicates.length) throw new Error(`Top-level duplicates: ${JSON.stringify(duplicates)}`);

const requireText = (file, text) => {
  if (!contents.get(file)?.includes(text)) throw new Error(`${file} lacks ${text}`);
};
requireText('Trades.gs', 'buildTradeKey');
requireText('Trades.gs', 'TRADE_KEY_CONFLICT');
if (contents.get('Trades.gs').includes('existingIds: function')) throw new Error('Legacy Trade ID-only index remains');
requireText('TradePlan.gs', 'scopeIdentity');
if (contents.get('TradePlan.gs').includes('strategyForAccount(row.accountName)')) throw new Error('Display-name lookup remains in TradePlan');
requireText('SyncExecution.gs', 'dataSnapshot');
requireText('SyncExecution.gs', 'INPUT_DATA_CHANGED_DURING_RUN');
requireText('SyncExecution.gs', 'guardWrite');
for (const file of ['Trades.gs', 'Prices.gs', 'Directory.gs', 'DirectoryBatch.gs']) requireText(file, 'guardWrite');

const batch = contents.get('BatchSync.gs');
const recalc = batch.slice(batch.indexOf('RECALC_STEPS'), batch.indexOf('MAINTENANCE_STEPS'));
for (const forbidden of ['trades', 'accounts', 'quickData', 'directoryShares', 'inflation']) {
  if (recalc.includes(`id: "${forbidden}"`)) throw new Error(`Recalc contains ${forbidden}`);
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  canonicalGsFiles: files.length,
  topLevelDuplicates: duplicates.length,
  checks: ['syntax', 'tradeKey', 'tradePlanScope', 'globalGuard', 'dataRevision', 'recalcZeroApiPath'],
}, null, 2)}\n`);
