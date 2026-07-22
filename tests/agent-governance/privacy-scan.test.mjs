import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

test('privacy scan denies prohibited credential paths even without recognizable secret syntax', () => {
  const prohibited = ['.env', '.env.local', '.clasprc.json', 'credentials.json', 'client-secret.txt', 'service_account.json', 'id_rsa', 'certificate.pem', 'private.key', 'secret.p12', 'store.pfx', 'artifact.zip', 'export.csv'];
  for (const name of prohibited) {
    const root = mkdtempSync(join(tmpdir(), 'ios-privacy-path-'));
    try {
      git(root, 'init', '-b', 'main');
      writeFileSync(join(root, name), 'opaque fixture without recognizable credential syntax\n');
      const result = scanPublicationPrivacy(root);
      assert.equal(result.ok, false, name);
      assert.deepEqual(result.prohibitedPaths, [name], name);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test('privacy scan blocks tracked and untracked secret content in ordinary filenames', () => {
  const fixtures = [
    ['authorization', ['Authorization', ': Bearer ', 'fixtureTokenValue123456789'].join('')],
    ['cookie', ['Cookie', ': session=', 'fixtureSessionValue12345'].join('')],
    ['assignment', ['API', '_KEY=', 'fixtureApiValue123456'].join('')],
    ['github', ['gh', 'p_', 'FixtureTokenValue1234567890'].join('')],
    ['openai', ['s', 'k-', 'FixtureTokenValue1234567890'].join('')],
    ['aws', ['AK', 'IA', 'FIXTUREVALUE123456'].join('')],
    ['jwt', ['eyJfixtureHeader', 'fixtureSegment123', 'fixtureSignature123'].join('.')],
    ['credential-url', ['https', '://fixture-user:', 'fixturePassword123@example.invalid'].join('')],
  ];
  for (const [kind, content] of fixtures) {
    const root = mkdtempSync(join(tmpdir(), 'ios-privacy-content-'));
    try {
      git(root, 'init', '-b', 'main');
      writeFileSync(join(root, 'tracked.txt'), `${content}\n`);
      git(root, 'add', 'tracked.txt');
      assert.deepEqual(scanPublicationPrivacy(root).findings.secrets, ['tracked.txt'], kind);
      rmSync(join(root, 'tracked.txt'));
      git(root, 'rm', '--cached', '--ignore-unmatch', 'tracked.txt');
      writeFileSync(join(root, 'untracked.txt'), `${content}\n`);
      assert.deepEqual(scanPublicationPrivacy(root).findings.secrets, ['untracked.txt'], kind);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test('privacy scan fails closed on oversized publication inputs', () => {
  const root = mkdtempSync(join(tmpdir(), 'ios-privacy-input-'));
  try {
    git(root, 'init', '-b', 'main');
    writeFileSync(join(root, 'large.txt'), Buffer.alloc(5 * 1024 * 1024 + 1, 0x61));
    const result = scanPublicationPrivacy(root);
    assert.equal(result.ok, false);
    assert.ok(result.unsafeInputs.some((item) => item.file === 'large.txt' && item.reason === 'FILE_TOO_LARGE'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('privacy scan fails closed on publication symlinks', { skip: process.platform === 'win32' }, () => {
  const root = mkdtempSync(join(tmpdir(), 'ios-privacy-symlink-'));
  try {
    git(root, 'init', '-b', 'main');
    writeFileSync(join(root, 'target.txt'), 'fixture\n');
    symlinkSync(join(root, 'target.txt'), join(root, 'link.txt'));
    const result = scanPublicationPrivacy(root);
    assert.equal(result.ok, false);
    assert.ok(result.unsafeInputs.some((item) => item.file === 'link.txt' && item.reason === 'SYMLINK'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
