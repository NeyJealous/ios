import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { scanPublicationPrivacy } from '../../tools/publication-privacy-check.mjs';

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('privacy scan fails closed on untracked secret and excludes ignored local files', () => {
  const root = mkdtempSync(join(tmpdir(), 'ios-privacy-scan-'));
  try {
    git(root, 'init', '-b', 'main');
    writeFileSync(join(root, '.gitignore'), 'ignored-secret.txt\n');
    writeFileSync(join(root, 'clean.txt'), 'clean fixture\n');
    git(root, 'add', '.gitignore', 'clean.txt');
    const secretKey = ['client', 'secret'].join('_');
    writeFileSync(join(root, 'untracked-secret.txt'), `${JSON.stringify({ [secretKey]: 'fixture-secret' })}\n`);
    writeFileSync(join(root, 'ignored-secret.txt'), `${JSON.stringify({ [secretKey]: 'ignored-local-fixture' })}\n`);
    const blocked = scanPublicationPrivacy(root);
    assert.equal(blocked.ok, false);
    assert.deepEqual(blocked.findings.secrets, ['untracked-secret.txt']);
    assert.equal(blocked.untrackedFiles, 1);
    rmSync(join(root, 'untracked-secret.txt'));
    const clean = scanPublicationPrivacy(root);
    assert.equal(clean.ok, true);
    assert.equal(clean.untrackedFiles, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
