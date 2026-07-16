import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const archive = resolve(root, 'audit', 'account-archive', 'invest-piggy-bank');
const payload = JSON.parse(readFileSync(resolve(archive, 'all-related-rows.private.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(archive, 'manifest.json'), 'utf8'));
const targetAccountId = String(payload.targetAccountId || '').trim();
if (!targetAccountId || `…${targetAccountId.slice(-6)}` !== manifest.targetAccountIdSuffix) {
  throw new Error('Private target Account ID mismatch');
}
const params = JSON.stringify([{
  targetAccountId,
  archiveSha256: manifest.archiveSha256,
}]);
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
const run = spawnSync(process.execPath, [clasp,
  '--user', 'ios-dev', '--json', 'run-function', '--params', params,
  'TI_ApplyExcludeAccountPurge',
], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 });
if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || run.error?.message || 'clasp failed\n');
  process.exit(run.status || 1);
}
const envelope = JSON.parse(run.stdout);
const result = envelope.response ?? envelope.result ?? envelope;
const output = resolve(root, 'audit', 'CODEX-04A-GATE-B-PURGE-RESULT.json');
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  ok: result.ok,
  code: result.code,
  runId: result.runId,
  deleted: result.deleted,
  apiCallCount: result.apiCallCount,
  idempotent: result.idempotent,
  failedStage: result.failedStage,
  rollback: result.rollback,
  output,
}, null, 2)}\n`);
process.exit(result.ok ? 0 : 2);
