import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [outputRelative] = process.argv.slice(2);
if (!outputRelative) throw new Error('Output path is required');
const root = resolve(import.meta.dirname, '..');
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'clasp.ps1');

function call(functionName) {
  const run = spawnSync('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', clasp,
    '--user', 'ios-dev', '--json', 'run-function', functionName,
  ], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout || run.error?.message || `${functionName} failed`);
  const envelope = JSON.parse(run.stdout);
  return envelope.response ?? envelope.result ?? envelope;
}

const states = [];
let state = call('TI_StartRecalcForCodex03');
states.push(state);
for (let attempt = 0; attempt < 40 && state.status !== 'complete'; attempt += 1) {
  if (state.status === 'error') throw new Error(state.error || 'Recalc failed');
  if (state.status === 'blocked') {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
  }
  state = call('TI_BatchSyncContinue');
  states.push(state);
}
if (state.status !== 'complete') throw new Error(`Recalc did not complete: ${state.status}`);
if (Number(state.context?.apiCallCount) !== 0) throw new Error(`RECALC_API_COUNT=${state.context?.apiCallCount}`);

const result = {
  ok: true,
  mode: state.mode,
  status: state.status,
  context: state.context,
  stepResults: state.results,
  invocationCount: states.length,
};
const output = resolve(root, outputRelative);
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  ok: result.ok,
  status: result.status,
  runId: result.context.runId,
  completedSteps: result.context.completedSteps,
  apiCallCount: result.context.apiCallCount,
  durationMs: result.context.durationMs,
  output,
}, null, 2)}\n`);
