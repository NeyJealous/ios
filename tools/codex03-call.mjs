import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [functionName, outputRelative] = process.argv.slice(2);
if (!functionName || !outputRelative) throw new Error('Usage: codex03-call.mjs FUNCTION OUTPUT');
const root = resolve(import.meta.dirname, '..');
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'clasp.ps1');
const run = spawnSync('powershell.exe', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', clasp,
  '--user', 'ios-dev', '--json', 'run-function', functionName,
], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (run.status !== 0) {
  process.stderr.write(run.stderr || run.stdout || run.error?.message || 'clasp failed\n');
  process.exit(run.status || 1);
}
const envelope = JSON.parse(run.stdout);
const result = envelope.response ?? envelope.result ?? envelope;
const output = resolve(root, outputRelative);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ functionName, output, ok: result.ok, code: result.code }, null, 2)}\n`);
