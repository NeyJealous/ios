import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [functionName, payloadRelative, outputRelative] = process.argv.slice(2);
if (!functionName || !payloadRelative || !outputRelative) {
  throw new Error('Usage: codex04b-remote-call.mjs FUNCTION PAYLOAD_JSON OUTPUT_JSON');
}
const root = resolve(import.meta.dirname, '..');
const payload = JSON.parse(readFileSync(resolve(root, payloadRelative), 'utf8'));
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
const run = spawnSync(process.execPath, [
  clasp, '--user', 'ios-dev', '--json', 'run-function',
  '--params', JSON.stringify([payload]), functionName,
], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 });
if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || run.error?.message || 'clasp failed\n');
  process.exit(run.status || 1);
}
const envelope = JSON.parse(run.stdout);
const result = envelope.response ?? envelope.result ?? envelope;
const output = resolve(root, outputRelative);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  functionName, output, ok: result.ok, code: result.code,
  writes: result.writes, apiCalls: result.apiCalls,
}, null, 2)}\n`);
