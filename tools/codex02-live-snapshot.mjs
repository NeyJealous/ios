import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initAuth } from 'file:///C:/Users/NeyJealous/AppData/Roaming/npm/node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'file:///C:/Users/NeyJealous/AppData/Roaming/npm/node_modules/@google/clasp/node_modules/googleapis/build/src/index.js';

const repo = process.argv[2];
if (!repo) throw new Error('Usage: node tools/codex02-live-snapshot.mjs <repo>');

const appDir = path.join(repo, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = JSON.parse(await readFile(path.join(appDir, '.clasp.json'), 'utf8'));
const auth = await initAuth({
  authFilePath: 'C:/Users/NeyJealous/.clasprc.json',
  userKey: 'ios-dev',
  useApplicationDefaultCredentials: false,
});
if (!auth.credentials) throw new Error('Named clasp credentials ios-dev are unavailable');

const sheets = google.sheets({ version: 'v4', auth: auth.credentials });
const names = ['Счета', 'Стратегии', 'Стратегии счетов', 'Портфель', 'Здоровье портфеля', 'Главная', 'Советник', 'План сделок'];
const suffix = (value) => {
  const text = String(value ?? '').trim();
  return text ? `…${text.slice(-6)}` : '';
};

const result = {
  generatedAt: new Date().toISOString(),
  spreadsheetIdSuffix: suffix(clasp.parentId),
  readOnly: true,
  sheets: {},
};

for (const name of names) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: clasp.parentId,
    range: `'${name.replaceAll("'", "''")}'!A:AZ`,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });
  const values = response.data.values || [];
  const headers = (values[0] || []).map((value) => String(value ?? '').trim());
  const idColumns = headers.map((header, index) => /(^|\s)ID($|\s)|ID сч|ID стратег/i.test(header) ? index : -1).filter((index) => index >= 0);
  const rows = values.slice(1).filter((row) => row.some((value) => String(value ?? '').trim() !== '')).map((row) =>
    headers.reduce((item, header, index) => {
      if (!header) return item;
      item[header] = idColumns.includes(index) ? suffix(row[index]) : (row[index] ?? '');
      return item;
    }, {}));
  result.sheets[name] = { headers, rowCount: rows.length, rows };
}

await writeFile(path.join(repo, 'audit', 'live_account_strategy_snapshot.json'), JSON.stringify(result, null, 2) + '\n');

const md = ['# Live Account / Strategy Snapshot', '', '- Read-only: yes', `- Generated: ${result.generatedAt}`, `- Spreadsheet suffix: ${result.spreadsheetIdSuffix}`, '',
  '| Sheet | Rows | Headers |', '|---|---:|---|',
  ...names.map((name) => `| ${name} | ${result.sheets[name].rowCount} | ${result.sheets[name].headers.join(', ')} |`), '',
  'Full IDs are not stored; ID-like columns contain suffixes only.', ''];
await writeFile(path.join(repo, 'audit', 'live_account_strategy_snapshot.md'), md.join('\n'));
