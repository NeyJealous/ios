import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const archive = resolve(root, 'audit', 'account-archive', 'invest-piggy-bank');
const candidates = new Set();

function visit(value, key = '') {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, key));
  if (value && typeof value === 'object') {
    return Object.entries(value).forEach(([childKey, child]) => visit(child, childKey));
  }
  const text = String(value ?? '').trim();
  if (/account.?id/i.test(key) && /^\d{7,}$/.test(text) && text.endsWith('864109')) {
    candidates.add(text);
  }
}

for (const name of readdirSync(archive)) {
  if (!name.endsWith('.json')) continue;
  visit(JSON.parse(readFileSync(resolve(archive, name), 'utf8')));
}
if (candidates.size !== 1) throw new Error(`Expected one private target Account ID, found ${candidates.size}`);
const targetAccountId = [...candidates][0];
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
const params = JSON.stringify([{ targetAccountId, otherAccountPolicy: 'PRESERVE_LEGACY' }]);
const run = spawnSync(process.execPath, [clasp,
  '--user', 'ios-dev', '--json', 'run-function', '--params', params,
  'TI_InitializeAccountScopeFlags',
], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || run.error?.message || 'clasp failed\n');
  process.exit(run.status || 1);
}
const envelope = JSON.parse(run.stdout);
const result = envelope.response ?? envelope.result ?? envelope;
const output = resolve(root, 'audit', 'CODEX-04A-FLAG-INITIALIZATION.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: result.ok, cellsWritten: result.cellsWritten, output }, null, 2)}\n`);
