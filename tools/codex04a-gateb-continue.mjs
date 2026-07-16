import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const archiveDir = resolve(root, 'audit', 'account-archive', 'invest-piggy-bank');
const payload = JSON.parse(readFileSync(resolve(archiveDir, 'all-related-rows.private.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(archiveDir, 'manifest.json'), 'utf8'));
const pre = JSON.parse(readFileSync(resolve(root, 'audit', 'CODEX-04A-PRE-PURGE-SNAPSHOT.json'), 'utf8'));
const targetAccountId = String(payload.targetAccountId || '').trim();
if (!targetAccountId || `…${targetAccountId.slice(-6)}` !== manifest.targetAccountIdSuffix) {
  throw new Error('Private target Account ID mismatch');
}

const sourceDir = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
const stepsOutput = resolve(root, 'audit', 'CODEX-04A-GATE-B-CONTINUATION-STEPS.json');
const finalOutput = resolve(root, 'audit', 'CODEX-04A-GATE-B-PURGE-RESULT.json');

function invoke(functionName, args = []) {
  const cliArgs = [clasp, '--user', 'ios-dev', '--json', 'run-function'];
  if (args.length) cliArgs.push('--params', JSON.stringify(args));
  cliArgs.push(functionName);
  const run = spawnSync(process.execPath, cliArgs, {
    cwd: sourceDir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
  });
  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || run.error?.message || `${functionName} failed`);
  }
  const envelope = JSON.parse(run.stdout);
  return envelope.response ?? envelope.result ?? envelope;
}

const config = {
  targetAccountId,
  archiveSha256: manifest.archiveSha256,
  expectedDirectory: {
    'Справочник': pre.snapshot.sheets['Справочник'].semanticDigest,
  },
  expectedLinks: {
    'Стратегии счетов': pre.snapshot.sheets['Стратегии счетов'].semanticDigest,
  },
};

const existing = process.argv.includes('--existing');
const records = existing && (() => {
  try { return JSON.parse(readFileSync(stepsOutput, 'utf8')); } catch { return []; }
})() || [];
let result;
if (existing) {
  result = { ok: true, code: 'CONTINUE' };
} else {
  result = invoke('TI_ResumeGateBMigration', [config]);
  records.push({ invocation: 0, functionName: 'TI_ResumeGateBMigration', result });
}
writeFileSync(stepsOutput, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

for (let invocation = records.length; result.ok && result.code === 'CONTINUE' && invocation <= 40; invocation += 1) {
  result = invoke('TI_ContinueGateBMigration');
  records.push({ invocation, functionName: 'TI_ContinueGateBMigration', result });
  writeFileSync(stepsOutput, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    invocation,
    code: result.code,
    pass: result.pass,
    stepIndex: result.stepIndex,
    nextStep: result.nextStep,
    apiCallCount: result.apiCallCount,
  })}\n`);
}

writeFileSync(finalOutput, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ result, stepsOutput, finalOutput }, null, 2)}\n`);
if (!result.ok || result.code !== 'COMMITTED') process.exit(2);
