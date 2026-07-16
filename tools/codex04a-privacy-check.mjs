import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const archive = resolve(root, 'audit', 'account-archive', 'invest-piggy-bank');
const candidates = new Set();
function visit(value, key = '') {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, key));
  if (value && typeof value === 'object') return Object.entries(value).forEach(([k, v]) => visit(v, k));
  const text = String(value ?? '').trim();
  if (/account.?id/i.test(key) && /^\d{7,}$/.test(text) && text.endsWith('864109')) candidates.add(text);
}
for (const name of readdirSync(archive)) {
  if (name.endsWith('.json')) visit(JSON.parse(readFileSync(resolve(archive, name), 'utf8')));
}
if (candidates.size !== 1) throw new Error(`Expected one private target ID, found ${candidates.size}`);
const targetId = [...candidates][0];
const listed = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
if (listed.status !== 0) throw new Error(listed.stderr || 'git ls-files failed');
const files = listed.stdout.split('\0').filter(Boolean);
const leaks = [];
const secretHits = [];
const secretPatterns = [
  /ya29\.[A-Za-z0-9_-]+/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /"client_secret"\s*:\s*"[^"\r\n]+"/
];
for (const file of files) {
  try {
    const content = readFileSync(resolve(root, file), 'utf8');
    if (content.includes(targetId)) leaks.push(file);
    if (secretPatterns.some((pattern) => pattern.test(content))) secretHits.push(file);
  } catch {}
}
const forbiddenTracked = files.filter((file) => file.endsWith('.clasp.json') || file.startsWith('backups/') || file.startsWith('audit/account-archive/'));
const result = {
  ok: leaks.length === 0 && forbiddenTracked.length === 0 && secretHits.length === 0,
  fullTargetIdInGitVisibleFiles: leaks.length > 0,
  leakCount: leaks.length,
  forbiddenTracked,
  secretPatternHits: secretHits
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.ok ? 0 : 2);
