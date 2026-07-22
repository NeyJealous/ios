import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function gitFiles(root, args, label) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error(result.stderr || `${label} failed`);
  return result.stdout.split('\0').filter(Boolean);
}

export function scanPublicationPrivacy(root) {
  const trackedFiles = gitFiles(root, ['ls-files', '-z'], 'git ls-files');
  const untrackedFiles = gitFiles(root, ['ls-files', '--others', '--exclude-standard', '-z'], 'git untracked listing');
  const files = [...new Set([...trackedFiles, ...untrackedFiles])];
  const windowsUserPath = new RegExp('C:' + String.raw`\\Users\\`, 'i');
  const slashUserPath = new RegExp('C:' + '/Users/', 'i');
  const privateWorktreeName = new RegExp(['IOS', 'CODEX'].join('_') + '_', 'i');
  const accountId = /(?:account.?id|account_id|id\s+сч[её]та)[^0-9]{0,40}["']?([0-9]{10,})/gi;
  const scriptId = /(?:script.?id|script_id)\s*["']?\s*[:=]\s*["']([A-Za-z0-9_-]{20,})["']/gi;
  const secrets = [
    /ya29\.[A-Za-z0-9_-]+/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /"client_secret"\s*:\s*"[^"\r\n]+"/,
    /"refresh_token"\s*:\s*"[^"\r\n]+"/,
    /"access_token"\s*:\s*"[^"\r\n]+"/,
  ];
  const findings = { personalizedPaths: [], fullAccountIds: [], scriptIds: [], secrets: [] };
  for (const file of files) {
    let content;
    try { content = readFileSync(resolve(root, file), 'utf8'); } catch { continue; }
    if (windowsUserPath.test(content) || slashUserPath.test(content) || privateWorktreeName.test(content)) findings.personalizedPaths.push(file);
    accountId.lastIndex = 0;
    if (accountId.test(content)) findings.fullAccountIds.push(file);
    scriptId.lastIndex = 0;
    if (scriptId.test(content)) findings.scriptIds.push(file);
    if (secrets.some((pattern) => pattern.test(content))) findings.secrets.push(file);
  }
  const trackedClasp = trackedFiles.filter((file) => /(^|\/)\.clasp\.json$/i.test(file));
  const trackedArchives = trackedFiles.filter((file) => /\.(?:zip|xlsx?|csv|tsv)$/i.test(file));
  const trackedPrivate = trackedFiles.filter((file) => file.startsWith('backups/') || file.startsWith('audit/account-archive/'));
  const ok = trackedClasp.length === 0 && trackedArchives.length === 0 && trackedPrivate.length === 0 && Object.values(findings).every((items) => items.length === 0);
  return { ok, trackedFiles: trackedFiles.length, untrackedFiles: untrackedFiles.length, scannedFiles: files.length, trackedClasp, trackedArchives, trackedPrivate, findings };
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const result = scanPublicationPrivacy(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
