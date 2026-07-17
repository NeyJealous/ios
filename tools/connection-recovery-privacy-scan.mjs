#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { outputRussian, repoRoot } from './connection-recovery-lib.mjs';

const root = repoRoot();
const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true })
  .split('\0').filter(Boolean).filter((file) => /^(?:tools\/connection-|tools\/remote-write-|governance\/connection-recovery\/|docs\/governance\/|\.github\/workflows\/connection-recovery-)/.test(file.replaceAll('\\', '/')));
const patterns = [
  ['GitHub token', /\b(?:gh[opusr]_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,})\b/],
  ['OAuth token', /\bya29\.[A-Za-z0-9_-]+\b/],
  ['Authorization value', /Authorization\s*[:=]\s*(?:Bearer|Basic)\s+[A-Za-z0-9._~+\/-]+/i],
  ['Cookie value', /(?:Cookie|Set-Cookie)\s*[:=]\s*[^\r\n\[]+/i],
  ['embedded credentials', /https?:\/\/[^\s/@:]+:[^\s/@]+@/i],
  ['absolute user path', /[A-Za-z]:[\\/]Users[\\/][^\\/\s"']+/i],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];
const findings = [];
for (const file of files) {
  let content;
  try { content = readFileSync(resolve(root, file), 'utf8'); } catch { continue; }
  for (const [name, pattern] of patterns) if (pattern.test(content)) findings.push({ file, finding: name });
}
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true }).split('\0').filter(Boolean);
const realCheckpoints = tracked.filter((file) => file.replaceAll('\\', '/').startsWith('.audit/connection-recovery/'));
const forbiddenTracked = tracked.filter((file) => /(^|\/)(?:\.clasprc\.json|\.env(?:\..*)?)$/i.test(file));
const result = { ok: findings.length === 0 && realCheckpoints.length === 0 && forbiddenTracked.length === 0, scannedFiles: files.length, findings, realCheckpoints, forbiddenTracked };
outputRussian(result.ok ? 'PRIVACY PASS' : 'PRIVACY FAIL', result);
process.exitCode = result.ok ? 0 : 2;
