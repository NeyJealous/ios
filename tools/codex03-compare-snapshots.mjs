import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [beforeRelative, afterRelative] = process.argv.slice(2);
const root = resolve(import.meta.dirname, '..');
const before = JSON.parse(readFileSync(resolve(root, beforeRelative), 'utf8'));
const after = JSON.parse(readFileSync(resolve(root, afterRelative), 'utf8'));
const allowed = new Set([
  'Портфель', 'Режим рынка', 'Инвестиционная стратегия', 'Ребалансировка',
  'План сделок', 'Решения', 'Здоровье портфеля', 'Интеллект портфеля',
  'Советник', 'Главная', 'Диагностика',
]);
const names = [...new Set([...Object.keys(before.sheets || {}), ...Object.keys(after.sheets || {})])];
const changed = names.filter((name) => before.sheets?.[name]?.digest !== after.sheets?.[name]?.digest);
const semanticChanged = names.filter((name) => before.sheets?.[name]?.semanticDigest !== after.sheets?.[name]?.semanticDigest);
const unexpected = changed.filter((name) => !allowed.has(name));
const result = {
  changed,
  semanticChanged,
  unexpected,
  tradesUnchanged: before.sheets?.['Сделки']?.digest === after.sheets?.['Сделки']?.digest,
  tradesFormulaUnchanged: before.sheets?.['Сделки']?.formulaDigest === after.sheets?.['Сделки']?.formulaDigest,
  apiCallCount: after.syncState?.context?.apiCallCount,
  status: after.syncState?.status,
  failedStep: after.syncState?.context?.failedStep,
  errors: after.syncState?.context?.errors || [],
  portfolioHealth: after.portfolioHealth,
};
result.ok = unexpected.length === 0 && result.tradesUnchanged && Number(result.apiCallCount) === 0;
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok ? 0 : 2);
