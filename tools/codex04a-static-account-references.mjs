import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repo = process.argv[2];
if (!repo) throw new Error('Usage: node tools/codex04a-static-account-references.mjs <repo>');
const sourceDir = path.join(repo, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const patterns = [
  /accountId/i, /accountName/i, /ID сч[её]та/i, /Сч[её]т/i,
  /includeTotal/i, /isIncludedAccount/i, /\.active\b/i,
  /getAccounts/i, /getOperationsByCursor/i, /getWithdrawLimits/i,
  /getPositions/i, /getPortfolio/i, /TI\.Data\.portfolio/i,
];
const flagsByFile = {
  'Accounts.gs': ['Sync_Enabled', 'Calculation_Enabled', 'Display_Enabled'],
  'Operations.gs': ['Sync_Enabled', 'History_Enabled'],
  'Trades.gs': ['History_Enabled'],
  'Portfolio.gs': ['Calculation_Enabled'],
  'Prices.gs': ['Sync_Enabled', 'Calculation_Enabled'],
  'Tax.gs': ['Calculation_Enabled'],
  'FIFO.gs': ['Calculation_Enabled', 'History_Enabled'],
  'Rebalance.gs': ['Calculation_Enabled', 'Recommendations_Enabled'],
  'TradePlan.gs': ['Recommendations_Enabled', 'Display_Enabled'],
  'DecisionEngine.gs': ['Recommendations_Enabled', 'Display_Enabled'],
  'Advisor.gs': ['Recommendations_Enabled', 'Display_Enabled'],
  'PortfolioHealth.gs': ['Calculation_Enabled', 'Display_Enabled'],
  'PortfolioIntelligence.gs': ['Calculation_Enabled', 'Recommendations_Enabled', 'Display_Enabled'],
  'Main.gs': ['Display_Enabled'],
  'BatchSync.gs': ['Sync_Enabled'],
  'DataCache.gs': ['Sync_Enabled'],
  'KnowledgeEngine.gs': ['Calculation_Enabled'],
  'AssetScoring.gs': ['Calculation_Enabled'],
  'CompanyRating.gs': ['Calculation_Enabled'],
  'Diagnostics.gs': ['Calculation_Enabled', 'Display_Enabled'],
  'Constitution.gs': ['Calculation_Enabled'],
  'StrategyEngine.gs': ['Calculation_Enabled', 'Recommendations_Enabled'],
  'MultiAccount.gs': ['all flags; registry owner'],
  'Menu.gs': ['delegates only'],
  'AutoMaintenance.gs': ['delegates only'],
};

const files = (await readdir(sourceDir)).filter((name) => name.endsWith('.gs')).sort();
const references = [];
for (const file of files) {
  const lines = (await readFile(path.join(sourceDir, file), 'utf8')).split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!patterns.some((pattern) => pattern.test(line))) return;
    references.push({ file, line: index + 1, text: line.trim().slice(0, 300) });
  });
}

const result = {
  generatedAt: new Date().toISOString(),
  sourceRoot: 'IOS_SOURCE_SNAPSHOT/work/apps-script',
  readOnlyAnalysis: true,
  referenceCount: references.length,
  filesWithReferences: [...new Set(references.map((item) => item.file))].length,
  expectedFlagsByModule: flagsByFile,
  legacyPatterns: {
    activeAccountFilter: 'account.active / TI.Accounts.active()',
    aggregateFilter: 'includeTotal / TI.MultiAccount.isIncludedAccount()',
    displayKeyLeakage: 'accountName used as lookup or strategy key',
    providerFallbackRisk: 'TI.Accounts.active() fallback when sheet registry is empty or unreadable',
  },
  references,
};
await writeFile(path.join(repo, 'audit', 'CODEX-04A-ACCOUNT-SCOPE-REFERENCES.json'), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ok: true, referenceCount: result.referenceCount, filesWithReferences: result.filesWithReferences }, null, 2)}\n`);
