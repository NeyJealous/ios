import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cwd = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const clasp = resolve(process.env.APPDATA, 'npm', 'clasp.ps1');
const base = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', clasp, '--user', 'ios-dev', '--json', 'run-function'];

const holder = spawn('powershell.exe', [...base, 'TI_HoldSyncLockTest'], {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
let holderOut = '';
let holderErr = '';
holder.stdout.on('data', (chunk) => { holderOut += chunk; });
holder.stderr.on('data', (chunk) => { holderErr += chunk; });

await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
const probe = spawnSync('powershell.exe', [...base, 'TI_ProbeSyncLockTest'], {
  cwd,
  encoding: 'utf8',
  maxBuffer: 4 * 1024 * 1024,
});
const holderCode = await new Promise((resolveExit) => holder.on('close', resolveExit));

if (holderCode !== 0 || probe.status !== 0) {
  process.stderr.write(holderErr || holderOut || probe.stderr || probe.stdout || 'lock test failed\n');
  process.exit(1);
}

const holderJson = JSON.parse(holderOut);
const probeJson = JSON.parse(probe.stdout);
const result = {
  ok: holderJson.response?.acquired === true && probeJson.response?.parallelStartBlocked === true,
  holder: holderJson.response,
  probe: probeJson.response,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok ? 0 : 2);
