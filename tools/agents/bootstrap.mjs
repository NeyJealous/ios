#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
const root = resolve(rootArg >= 0 ? process.argv[rootArg + 1] : resolve(import.meta.dirname, '../..'));
const steps = [
  ['validate locked upstream snapshots', 'tools/agents/validate-upstream-integrity.mjs', []],
  ['compose immutable bases and overlays', 'tools/agents/compose-agents.mjs', ['--root', root, '--generate-profiles']],
  ['build provisional registry and matrix', 'tools/agents/build-first-wave-registry.mjs', [root]],
  ['validate generated profiles', 'tools/agents/validate-generated-agents.mjs', [root]],
  ['validate runtime activation boundary', 'tools/agents/validate-activation-boundary.mjs', [root]],
];

const results = [];
for (const [name, script, args] of steps) {
  const run = spawnSync(process.execPath, [resolve(root, script), ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_ignore_scripts: 'true' },
  });
  results.push({ name, status: run.status, stdout: run.stdout.trim(), stderr: run.stderr.trim() });
  if (run.status !== 0) break;
}
const ok = results.length === steps.length && results.every((item) => item.status === 0);
const boundary = results.find((item) => item.name === 'validate runtime activation boundary');
let runtimeDiscoveredPlatformAgents = null;
try { runtimeDiscoveredPlatformAgents = JSON.parse(boundary?.stdout || '{}').runtimeDiscoveredPlatformAgents ?? null; } catch {}
console.log(JSON.stringify({
  schemaVersion: '1.0.0', ok, mode: 'PROJECT_LOCAL_OFFLINE_LOCKED',
  networkUpdate: false, downloadedCodeExecuted: false, productionWrites: 0,
  runtimeDiscoveredPlatformAgents, activationCommand: 'NOT_IMPLEMENTED', results,
}, null, 2));
process.exitCode = ok ? 0 : 2;
