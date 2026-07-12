import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const appDir = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'clasp.ps1');
const jsonPath = resolve(root, 'audit', 'live_account_strategy_snapshot.json');
const mdPath = resolve(root, 'audit', 'live_account_strategy_snapshot.md');

const run = spawnSync('powershell.exe', [
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  clasp,
  '--json',
  '--user',
  'ios-dev',
  'run-function',
  'TI_AuditAccountStrategyLinks',
], {
  cwd: appDir,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || run.error?.message || `clasp exited with ${run.status}\n`);
  process.exit(run.status || 1);
}

let envelope;
try {
  envelope = JSON.parse(run.stdout);
} catch (error) {
  process.stderr.write(`Unable to parse clasp JSON: ${error.message}\n`);
  process.exit(2);
}

const result = envelope.result ?? envelope.response?.result ?? envelope.response ?? envelope;
mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const counts = result.counts ?? {};
const warnings = Array.isArray(result.warnings) ? result.warnings : [];
const errors = Array.isArray(result.errors) ? result.errors : [];
const lines = [
  '# CODEX-02 live account/strategy audit',
  '',
  `- Generated: ${new Date().toISOString()}`,
  '- Mode: read-only (`persist=false`)',
  `- ok: ${String(result.ok)}`,
  `- warnings: ${warnings.length}`,
  `- errors: ${errors.length}`,
  '',
  '## Counts',
  '',
  '```json',
  JSON.stringify(counts, null, 2),
  '```',
  '',
  '## Warnings',
  '',
  ...(warnings.length ? warnings.map((item) => `- ${typeof item === 'string' ? item : JSON.stringify(item)}`) : ['- None']),
  '',
  '## Errors',
  '',
  ...(errors.length ? errors.map((item) => `- ${typeof item === 'string' ? item : JSON.stringify(item)}`) : ['- None']),
  '',
];
writeFileSync(mdPath, lines.join('\n'), 'utf8');

process.stdout.write(`${JSON.stringify({
  ok: result.ok,
  counts,
  warningCount: warnings.length,
  errorCount: errors.length,
  jsonPath,
  mdPath,
}, null, 2)}\n`);
