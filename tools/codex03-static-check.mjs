import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const appDir = new URL('../IOS_SOURCE_SNAPSHOT/work/apps-script/', import.meta.url);
for (const file of readdirSync(appDir).filter((name) => name.endsWith('.gs'))) {
  new vm.Script(readFileSync(new URL(file, appDir), 'utf8'), { filename: file });
}

const batch = readFileSync(new URL('BatchSync.gs', appDir), 'utf8');
const quick = batch.slice(batch.indexOf('QUICK_STEPS'), batch.indexOf('RECALC_STEPS'));
for (const forbidden of ['marketRegime', 'rebalance', 'decisions', 'portfolioIntelligence', 'ui']) {
  if (quick.includes(`id: "${forbidden}"`)) throw new Error(`Quick includes ${forbidden}`);
}

const tradesHandler = batch.slice(
  batch.indexOf('if (stepId === "trades")'),
  batch.indexOf('if (stepId === "accounts")'),
);
if (!tradesHandler.includes('fetchIncremental') || tradesHandler.includes('Trades.rebuild')) {
  throw new Error('Full history handler is not incremental');
}

const api = readFileSync(new URL('Api.gs', appDir), 'utf8');
const inflation = readFileSync(new URL('Inflation.gs', appDir), 'utf8');
if (!api.includes('recordApi') || !inflation.includes('recordApi')) {
  throw new Error('A direct HTTP boundary lacks API accounting');
}

process.stdout.write('GS_SYNTAX=PASS\nLOCAL_SYNC_ASSERTIONS=PASS\n');
