import { lstatSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function gitFiles(root, args, label) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error(result.stderr || `${label} failed`);
  return result.stdout.split('\0').filter(Boolean);
}

export function scanPublicationPrivacy(root) {
  const trackedFiles = gitFiles(root, ['ls-files', '-z'], 'git ls-files');
  const deletedFiles = new Set(gitFiles(root, ['ls-files', '--deleted', '-z'], 'git deleted listing'));
  const untrackedFiles = gitFiles(root, ['ls-files', '--others', '--exclude-standard', '-z'], 'git untracked listing');
  const files = [...new Set([...trackedFiles.filter((file) => !deletedFiles.has(file)), ...untrackedFiles])];
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
    /(?:^|\n)\s*authorization\s*:\s*[a-z][a-z0-9_-]*\s+\S+/im,
    /(?:^|\n)\s*(?:cookie|set-cookie)\s*:\s*\S+/im,
    /(?:^|[\s"'`{,])(?:api[_-]?key|client[_-]?secret|password|passwd|private[_-]?token|access[_-]?token|refresh[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9._~+\/-]{12,}/im,
    /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[A-Za-z0-9-]{12,})/,
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    /[a-z][a-z0-9+.-]*:\/\/[^\s\/:@]+:[^\s\/@]+@/i,
  ];
  const findings = { personalizedPaths: [], fullAccountIds: [], scriptIds: [], secrets: [] };
  const prohibitedPaths = [];
  const unsafeInputs = [];
  const maximumFileBytes = 5 * 1024 * 1024;
  const prohibitedBasename = /^(?:\.env(?:\..+)?|\.clasprc\.json|\.clasp\.json|credentials?(?:\.[^.]+)?|client[_-]?secret(?:\.[^.]+)?|service[_-]?account(?:\.[^.]+)?|id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?)$/i;
  const prohibitedExtension = /\.(?:pem|key|p12|pfx|jks|keystore|kdbx|zip|xlsx?|csv|tsv)$/i;
  const prohibitedDirectory = /^(?:backups|audit\/account-archive)(?:\/|$)/i;
  for (const file of files) {
    const normalized = file.replaceAll('\\', '/');
    if (prohibitedBasename.test(basename(normalized)) || prohibitedExtension.test(normalized) || prohibitedDirectory.test(normalized)) {
      prohibitedPaths.push(file);
      continue;
    }
    let content;
    try {
      const stat = lstatSync(resolve(root, file));
      if (stat.isSymbolicLink() || !stat.isFile()) {
        unsafeInputs.push({ file, reason: stat.isSymbolicLink() ? 'SYMLINK' : 'NON_REGULAR_FILE' });
        continue;
      }
      if (stat.size > maximumFileBytes) {
        unsafeInputs.push({ file, reason: 'FILE_TOO_LARGE' });
        continue;
      }
      content = readFileSync(resolve(root, file), 'utf8');
    } catch {
      unsafeInputs.push({ file, reason: 'UNREADABLE' });
      continue;
    }
    if (windowsUserPath.test(content) || slashUserPath.test(content) || privateWorktreeName.test(content)) findings.personalizedPaths.push(file);
    accountId.lastIndex = 0;
    if (accountId.test(content)) findings.fullAccountIds.push(file);
    scriptId.lastIndex = 0;
    if (scriptId.test(content)) findings.scriptIds.push(file);
    if (secrets.some((pattern) => { pattern.lastIndex = 0; return pattern.test(content); })) findings.secrets.push(file);
  }
  const trackedClasp = trackedFiles.filter((file) => /(^|\/)\.clasp\.json$/i.test(file));
  const trackedArchives = trackedFiles.filter((file) => /\.(?:zip|xlsx?|csv|tsv)$/i.test(file));
  const trackedPrivate = trackedFiles.filter((file) => prohibitedDirectory.test(file.replaceAll('\\', '/')));
  const ok = prohibitedPaths.length === 0 && unsafeInputs.length === 0 && Object.values(findings).every((items) => items.length === 0);
  return { ok, trackedFiles: trackedFiles.length, deletedFiles: deletedFiles.size, untrackedFiles: untrackedFiles.length, scannedFiles: files.length, maximumFileBytes, prohibitedPaths, unsafeInputs, trackedClasp, trackedArchives, trackedPrivate, findings };
}

function main() {
  const root = resolve(import.meta.dirname, '..');
  const result = scanPublicationPrivacy(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
