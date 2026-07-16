import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [repo, unpacked, backupIdSuffix = null] = process.argv.slice(2);
if (!repo || !unpacked) throw new Error('Usage: node tools/codex04a-audit-unpacked-xlsx.mjs <repo> <unpacked-xlsx-dir>');
const coreSource = await readFile(path.join(repo, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script', 'Core.gs'), 'utf8');
const projectVersion = coreSource.match(/VERSION:\s*"([^"]+)"/)?.[1] || 'unknown';

const xmlDecode = (value) => String(value ?? '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
const attr = (tag, name) => {
  const match = tag.match(new RegExp(`(?:^|\\s)${name.replace(':', '\\:')}="([^"]*)"`));
  return match ? xmlDecode(match[1]) : '';
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('ru-RU');
const suffix = (value) => {
  const text = String(value ?? '').trim();
  return text ? `…${text.slice(-6)}` : '';
};
const colIndex = (ref) => {
  const letters = String(ref).match(/^[A-Z]+/i)?.[0]?.toUpperCase() || '';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};
const textRuns = (xml) => [...String(xml).matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => xmlDecode(match[1])).join('');

let sharedStrings = [];
try {
  const sharedXml = await readFile(path.join(unpacked, 'xl', 'sharedStrings.xml'), 'utf8');
  sharedStrings = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) => textRuns(match[1]));
} catch {
  sharedStrings = [];
}

const workbookXml = await readFile(path.join(unpacked, 'xl', 'workbook.xml'), 'utf8');
const relsXml = await readFile(path.join(unpacked, 'xl', '_rels', 'workbook.xml.rels'), 'utf8');
const relTargets = Object.fromEntries([...relsXml.matchAll(/<Relationship\b[^>]*\/>/g)].map((match) => [attr(match[0], 'Id'), attr(match[0], 'Target')]));
const sheets = [...workbookXml.matchAll(/<sheet\b[^>]*\/>/g)].map((match) => ({
  name: attr(match[0], 'name'),
  target: relTargets[attr(match[0], 'r:id')],
}));

const parseSheet = async ({ name, target }) => {
  const targetPath = target.startsWith('/') ? target.slice(1) : path.posix.join('xl', target);
  const xml = await readFile(path.join(unpacked, ...targetPath.split('/')), 'utf8');
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(attr(`<row ${rowMatch[1]}>`, 'r')) || rows.length + 1;
    const cells = [];
    const formulas = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cellTag = `<c ${cellMatch[1]}>`;
      const index = colIndex(attr(cellTag, 'r'));
      const type = attr(cellTag, 't');
      const body = cellMatch[2] || '';
      const formula = body.match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/)?.[1];
      const raw = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1] ?? '';
      let value = xmlDecode(raw);
      if (type === 's') value = sharedStrings[Number(value)] ?? '';
      else if (type === 'inlineStr') value = textRuns(body.match(/<is>([\s\S]*?)<\/is>/)?.[1] ?? '');
      else if (type === 'b') value = value === '1';
      cells[index] = value;
      formulas[index] = formula == null ? '' : `=${xmlDecode(formula)}`;
    }
    if (cells.some((value) => String(value ?? '').trim() !== '') || formulas.some(Boolean)) rows.push({ rowNumber, cells, formulas });
  }
  return { name, rows };
};

const parsed = [];
for (const sheet of sheets) parsed.push(await parseSheet(sheet));
const accounts = parsed.find((sheet) => sheet.name === 'Счета');
if (!accounts || !accounts.rows.length) throw new Error('Счета sheet is missing or empty');
const headers = accounts.rows[0].cells.map((value) => String(value ?? '').trim());
const accountIdCol = headers.findIndex((header) => /^(id сч[её]та|account id)$/i.test(header));
if (accountIdCol < 0) throw new Error('ID счёта column is missing');

const targetCandidates = accounts.rows.slice(1).filter((row) => row.cells.some((value) => normalize(value) === 'инвесткопилка'));
if (targetCandidates.length !== 1) throw new Error(`Expected one account row containing Инвесткопилка, found ${targetCandidates.length}`);
const targetRow = targetCandidates[0];
const targetAccountId = String(targetRow.cells[accountIdCol] ?? '').trim();
if (!targetAccountId) {
  const diagnostic = targetRow.cells.map((value, index) => ({
    column: headers[index] || index,
    value: /^\d{7,}$/.test(String(value ?? '').trim()) ? suffix(value) : value,
    formula: targetRow.formulas[index] || '',
  }));
  throw new Error(`Target Account ID is empty: ${JSON.stringify(diagnostic)}`);
}
const accountIdMatches = accounts.rows.slice(1).filter((row) => String(row.cells[accountIdCol] ?? '').trim() === targetAccountId);
if (accountIdMatches.length !== 1) throw new Error(`Target Account ID is not unique: ${accountIdMatches.length}`);

const headerIndex = (names) => headers.findIndex((header) => names.includes(normalize(header)));
const accountNameCol = headerIndex(['счёт', 'счет', 'название', 'account']);
const typeCol = headerIndex(['тип', 'тип счёта', 'тип счета']);
const statusCol = headerIndex(['статус', 'активен', 'активна']);
const displayName = accountNameCol >= 0 ? String(targetRow.cells[accountNameCol] ?? '').trim() : '';
const flagTitles = ['Синхронизировать', 'Учитывать в расчётах', 'Показывать', 'Использовать в рекомендациях', 'Хранить историю'];
const currentFlags = Object.fromEntries(flagTitles.map((title) => {
  const index = headers.findIndex((header) => normalize(header) === normalize(title));
  return [title, index >= 0 ? (targetRow.cells[index] ?? '') : null];
}));
const accountRegistry = accounts.rows.slice(1).map((row) => ({
  rowNumber: row.rowNumber,
  accountIdSuffix: suffix(row.cells[accountIdCol]),
  displayName: accountNameCol >= 0 ? String(row.cells[accountNameCol] ?? '').trim() : '',
  accountType: typeCol >= 0 ? (row.cells[typeCol] ?? '') : '',
  status: statusCol >= 0 ? (row.cells[statusCol] ?? '') : '',
  includeTotal: (() => {
    const index = headers.findIndex((header) => normalize(header) === 'включать в общий портфель');
    return index >= 0 ? (row.cells[index] ?? '') : '';
  })(),
}));
const historySheets = new Set(['Сделки', 'Операции']);
const currentSheets = new Set(['Портфель', 'Стратегии счетов', 'Данные источников', 'Кэш', 'API Операции', 'API Счета']);
const neverDelete = new Set(['Счета', 'Стратегии счетов', 'Справочник', 'Рейтинг компаний']);
const manualSheets = new Set(['Счета', 'Стратегии', 'Стратегии счетов', 'Настройки', 'Конституция', 'Инвестиционная стратегия']);
const rowsBySheet = [];
const privateArchive = {};

for (const sheet of parsed) {
  const sheetHeaders = (sheet.rows[0]?.cells || []).map((value) => String(value ?? '').trim());
  const dataRows = sheet.rows.slice(1);
  const accountIdColumns = sheetHeaders.map((header, index) => /^(id сч[её]та|account\s*_?id)$/i.test(header) ? index : -1).filter((index) => index >= 0);
  const exactRows = dataRows.filter((row) => row.cells.some((value, index) => {
    const text = String(value ?? '').trim();
    return accountIdColumns.includes(index) ? text === targetAccountId : text === targetAccountId || text.includes(targetAccountId);
  }));
  const legacyNameRows = displayName ? dataRows.filter((row) => !exactRows.includes(row) && row.cells.some((value) => String(value ?? '').trim() === displayName)) : [];
  const classification = historySheets.has(sheet.name) ? 'business' : (currentSheets.has(sheet.name) ? 'current' : 'derived');
  const serialized = JSON.stringify({ sheet: sheet.name, headers: sheetHeaders, rows: exactRows });
  const formulaCount = exactRows.reduce((count, row) => count + row.formulas.filter(Boolean).length, 0);
  rowsBySheet.push({
    sheet: sheet.name,
    exists: true,
    totalDataRows: dataRows.length,
    rowCount: exactRows.length,
    legacyNameRows: legacyNameRows.length,
    businessRows: classification === 'business' ? exactRows.length : 0,
    derivedRows: classification === 'derived' ? exactRows.length : 0,
    currentRows: classification === 'current' ? exactRows.length : 0,
    hasFormulas: formulaCount > 0,
    hasManualData: manualSheets.has(sheet.name) && exactRows.some((row) => row.cells.some((value) => String(value ?? '').trim() !== '')),
    deleteAllowed: exactRows.length > 0 && !neverDelete.has(sheet.name),
    rebuildRequired: classification === 'derived' && (exactRows.length > 0 || legacyNameRows.length > 0),
    accountIdColumns: accountIdColumns.map((index) => sheetHeaders[index]),
    matchingRowNumbers: exactRows.map((row) => row.rowNumber),
    legacyNameRowNumbers: legacyNameRows.map((row) => row.rowNumber),
    sha256: hash(serialized),
  });
  if (exactRows.length || legacyNameRows.length) privateArchive[sheet.name] = {
    headers: sheetHeaders,
    exactAccountIdRows: exactRows,
    legacyDisplayNameRows: legacyNameRows,
    sha256: hash(serialized),
  };
}

const requiredSheets = [
  'Сделки', 'Операции', 'Портфель', 'Стратегии счетов', 'Налоги', 'Ребалансировка',
  'План сделок', 'Решения', 'Советник', 'Здоровье портфеля', 'Интеллект портфеля',
  'Главная', 'Факты', 'Признаки', 'Оценки', 'Данные источников', 'Кэш',
  'Диагностика', 'API Операции', 'API Счета'
];
requiredSheets.forEach((sheet) => {
  if (rowsBySheet.some((item) => item.sheet === sheet)) return;
  rowsBySheet.push({
    sheet, exists: false, totalDataRows: 0, rowCount: 0, legacyNameRows: 0,
    businessRows: 0, derivedRows: 0, currentRows: 0, hasFormulas: false,
    hasManualData: false, deleteAllowed: false, rebuildRequired: false,
    accountIdColumns: [], matchingRowNumbers: [], legacyNameRowNumbers: [], sha256: null,
  });
});

const generatedAt = new Date().toISOString();
const summary = {
  generatedAt,
  source: 'local read-only XLSX export of production Google Sheet',
  readOnly: true,
  externalBrokerApiCalls: 0,
  targetAccount: {
    displayName,
    accountType: typeCol >= 0 ? (targetRow.cells[typeCol] ?? '') : '',
    status: statusCol >= 0 ? (targetRow.cells[statusCol] ?? '') : '',
    accountIdSuffix: suffix(targetAccountId),
    accountRowNumber: targetRow.rowNumber,
    uniqueTargetDescriptorMatch: targetCandidates.length === 1,
    uniqueAccountIdMatch: accountIdMatches.length === 1,
    currentFlags,
    proposedFlags: Object.fromEntries(flagTitles.map((title) => [title, false])),
  },
  accountRegistry,
  totals: {
    relatedRowsByAccountId: rowsBySheet.reduce((sum, item) => sum + item.rowCount, 0),
    legacyDisplayNameRows: rowsBySheet.reduce((sum, item) => sum + item.legacyNameRows, 0),
    sheetsWithAccountIdRows: rowsBySheet.filter((item) => item.rowCount > 0).length,
    historyRows: rowsBySheet.reduce((sum, item) => sum + item.businessRows, 0),
    currentRows: rowsBySheet.reduce((sum, item) => sum + item.currentRows, 0),
    derivedRows: rowsBySheet.reduce((sum, item) => sum + item.derivedRows, 0),
  },
  rowsBySheet,
};

const auditDir = path.join(repo, 'audit');
const archiveDir = path.join(auditDir, 'account-archive', 'invest-piggy-bank');
await mkdir(archiveDir, { recursive: true });
await writeFile(path.join(auditDir, 'CODEX-04A-ACCOUNT-ROW-COUNTS.json'), `${JSON.stringify(summary, null, 2)}\n`);
const privatePayload = { generatedAt, targetAccountId, targetAccountIdSuffix: suffix(targetAccountId), sheets: privateArchive };
await writeFile(path.join(archiveDir, 'all-related-rows.private.json'), `${JSON.stringify(privatePayload, null, 2)}\n`);
const archiveManifest = {
  generatedAt,
  targetAccountIdSuffix: suffix(targetAccountId),
  sourceWorkbook: path.basename(unpacked),
  spreadsheetBackupIdSuffix: backupIdSuffix,
  projectVersion,
  rows: rowsBySheet.filter((item) => item.rowCount || item.legacyNameRows).map((item) => ({ sheet: item.sheet, rowCount: item.rowCount, legacyNameRows: item.legacyNameRows, sha256: item.sha256 })),
  archiveSha256: hash(JSON.stringify(privatePayload)),
};
const derivedArchive = Object.fromEntries(Object.entries(privateArchive).filter(([name]) => !['Сделки', 'Операции', 'Портфель'].includes(name)));
await writeFile(path.join(archiveDir, 'manifest.json'), `${JSON.stringify(archiveManifest, null, 2)}\n`);
await writeFile(path.join(archiveDir, 'trades.json'), `${JSON.stringify(privateArchive['Сделки'] || { headers: [], exactAccountIdRows: [] }, null, 2)}\n`);
await writeFile(path.join(archiveDir, 'operations.json'), `${JSON.stringify(privateArchive['Операции'] || { headers: [], exactAccountIdRows: [] }, null, 2)}\n`);
await writeFile(path.join(archiveDir, 'portfolio.json'), `${JSON.stringify(privateArchive['Портфель'] || { headers: [], exactAccountIdRows: [] }, null, 2)}\n`);
await writeFile(path.join(archiveDir, 'derived-data.json'), `${JSON.stringify(derivedArchive, null, 2)}\n`);
await writeFile(path.join(archiveDir, 'migration-summary.md'), [
  '# CODEX-04A private account archive', '',
  `- Generated: ${generatedAt}`,
  `- Target Account ID suffix: ${suffix(targetAccountId)}`,
  `- Google Sheets backup suffix: ${backupIdSuffix || 'pending'}`,
  `- Exact Account ID rows: ${summary.totals.relatedRowsByAccountId}`,
  `- Legacy display-name-only rows: ${summary.totals.legacyDisplayNameRows}`,
  '- Git status: ignored; do not commit.', ''
].join('\n'));

process.stdout.write(`${JSON.stringify({ ok: true, readOnly: true, targetAccount: summary.targetAccount, totals: summary.totals, impacted: rowsBySheet.filter((item) => item.rowCount || item.legacyNameRows).map(({ sheet, rowCount, legacyNameRows }) => ({ sheet, rowCount, legacyNameRows })) }, null, 2)}\n`);
