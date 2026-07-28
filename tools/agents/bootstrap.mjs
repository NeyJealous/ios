#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
const root = resolve(rootArg >= 0 ? process.argv[rootArg + 1] : resolve(import.meta.dirname, '../..'));
const steps = [
  ['validate locked upstream provenance', 'tools/agents/validate-upstream-integrity.mjs'],
  ['validate canonical profile integrity', 'tools/agents/validate-agent-integrity-registry.mjs'],
  ['validate capability envelopes', 'tools/agents/validate-capability-envelopes.mjs'],
];
const results = [];
for (const [name, script] of steps) {
  const run = spawnSync(process.execPath, [resolve(root, script), root], {
    cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_ignore_scripts: 'true' },
  });
  results.push({ name, status: run.status, stdout: run.stdout.trim(), stderr: run.stderr.trim() });
  if (run.status !== 0) break;
}
const ok = results.length === steps.length && results.every((item) => item.status === 0);
console.log(JSON.stringify({
  schemaVersion: '2.0.0',
  ok,
  mode: 'SOURCE_AUTHORED_VALIDATION_ONLY',
  filesGenerated: 0,
  profilesCopied: 0,
  networkUpdate: false,
  productionWrites: 0,
  activationPerformed: false,
  results,
}, null, 2));
process.exitCode = ok ? 0 : 2;
