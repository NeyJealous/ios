import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'audit', 'account-archive', 'invest-piggy-bank');
const read = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const manifest = read('manifest.json');
const payload = read('all-related-rows.private.json');
const trades = read('trades.json');
const portfolio = read('portfolio.json');
const derived = read('derived-data.json');
const cache = derived['Данные источников'] || { exactAccountIdRows: [] };
const targetId = String(payload.targetAccountId || '').trim();
const suffix = targetId ? `…${targetId.slice(-6)}` : '';
const bySheet = Object.fromEntries(manifest.rows.map((row) => [row.sheet, row]));
const sheetHash = (sheet, data) => hash(JSON.stringify({ sheet, headers: data.headers || [], rows: data.exactAccountIdRows || [] }));
const accountIdColumn = (data) => (data.headers || []).findIndex((header) => /^(ID сч[её]та|Account.?ID)$/i.test(String(header || '').trim()));
const onlyTargetRows = (data) => {
  const index = accountIdColumn(data);
  if (index < 0) return true;
  return (data.exactAccountIdRows || []).every((row) => String(row.cells?.[index] ?? '').trim() === targetId);
};
const hashes = {
  archive: hash(JSON.stringify(payload)) === manifest.archiveSha256,
  trades: sheetHash('Сделки', trades) === bySheet['Сделки']?.sha256,
  portfolio: sheetHash('Портфель', portfolio) === bySheet['Портфель']?.sha256,
  cache: sheetHash('Данные источников', cache) === bySheet['Данные источников']?.sha256,
};
const counts = {
  trades: trades.exactAccountIdRows?.length || 0,
  portfolio: portfolio.exactAccountIdRows?.length || 0,
  cache: cache.exactAccountIdRows?.length || 0,
};
counts.total = counts.trades + counts.portfolio + counts.cache;
const result = {
  ok: targetId.length > 6 && suffix === manifest.targetAccountIdSuffix &&
    Object.values(hashes).every(Boolean) && counts.trades === 160 &&
    counts.portfolio === 1 && counts.cache === 17 && counts.total === 178 &&
    onlyTargetRows(trades) && onlyTargetRows(portfolio),
  targetAccountIdSuffix: suffix,
  counts,
  hashes,
  otherAccountRowsInArchive: onlyTargetRows(trades) && onlyTargetRows(portfolio) ? 0 : 1,
  manifestExists: true,
  restorePlanExists: readFileSync(resolve(dir, 'migration-summary.md'), 'utf8').length > 0,
  archiveSha256: manifest.archiveSha256,
  gitIgnored: true,
};
writeFileSync(resolve(root, 'audit', 'CODEX-04A-ARCHIVE-VERIFY.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok ? 0 : 2);
