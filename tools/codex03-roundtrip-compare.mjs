import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = resolve(tmpdir(), `ios-codex03-roundtrip-${stamp}`);
mkdirSync(target, { recursive: true });
copyFileSync(resolve(source, '.clasp.json'), resolve(target, '.clasp.json'));
const clasp = resolve(process.env.APPDATA, 'npm', 'clasp.ps1');
const pull = spawnSync('powershell.exe', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', clasp,
  '--user', 'ios-dev', 'pull'
], { cwd: target, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (pull.status !== 0) {
  process.stderr.write(pull.stderr || pull.stdout || pull.error?.message || 'clasp pull failed\n');
  process.exit(pull.status || 1);
}
const normalize = (value) => value.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
const sha256 = (value) => createHash('sha256').update(normalize(value), 'utf8').digest('hex');
const localFiles = readdirSync(source).filter((name) => ['.gs', '.html', '.json'].includes(extname(name)) && name !== '.clasp.json');
const comparisons = localFiles.map((localName) => {
  const remoteName = extname(localName) === '.gs' ? `${localName.slice(0, -3)}.js` : localName;
  try {
    const local = readFileSync(resolve(source, localName), 'utf8');
    const remote = readFileSync(resolve(target, remoteName), 'utf8');
    return {
      localName,
      remoteName,
      localSha256: sha256(local),
      remoteSha256: sha256(remote),
      equal: normalize(local) === normalize(remote),
      error: '',
    };
  } catch (error) {
    return { localName, remoteName, equal: false, error: error.message };
  }
});
const mismatches = comparisons.filter((item) => !item.equal);
const report = {
  ok: mismatches.length === 0,
  canonicalFileCount: comparisons.length,
  exactMatches: comparisons.length - mismatches.length,
  mismatchCount: mismatches.length,
  temporaryPullDirectory: target,
  mismatches,
};
writeFileSync(resolve(root, 'audit', 'codex03_roundtrip.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(report.ok ? 0 : 2);
