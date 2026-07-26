import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateSelectionRegister, verifySelectionSources } from '../../tools/agents/validate-upstream-selection.mjs';
import { listPinnedCatalogPaths } from '../../tools/agents/build-upstream-selection-register.mjs';

const root = resolve(import.meta.dirname, '../..');
const register = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/upstream-selection-register.yaml'), 'utf8'));

test('upstream selection register contains exact pinned provenance for all 44 rows', () => {
  const result = validateSelectionRegister(register);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { SELECTED: 18, UPSTREAM_PROFILE_NOT_FOUND: 0, REQUIRES_OWNER_DECISION: 26 });
});

test('remaining unresolved compositions are owner-blocked without activation', () => {
  const blocked = register.selections.filter((selection) => selection.status === 'REQUIRES_OWNER_DECISION');
  assert.equal(blocked.length, 26);
  assert.equal(register.activationAllowed, false);
  assert.ok(blocked.every((selection) => selection.selectedProfiles.length === 0 && selection.candidateProfiles.length > 0));
});

test('first-wave selections are exact, owner-bound and remain non-activating', () => {
  const ids = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor'];
  for (const agentId of ids) {
    const selection = register.selections.find((row) => row.agentId === agentId);
    assert.equal(selection.status, 'SELECTED');
    assert.equal(selection.decisionReference, 'OWNER_DECISION_FIRST_WAVE_20260722');
    assert.equal(selection.ownerDecisionCommit, '6da06f7f0a32c343f565e4f0a36354538087236a');
    assert.equal(selection.compositionOrder.length, selection.selectedProfiles.length);
    assert.ok(selection.restrictions.length > 0);
    assert.deepEqual(selection.compositionOrder, selection.selectedProfiles.map((profile) => `${profile.repository}:${profile.sourcePath}`));
  }
  assert.equal(register.activationAllowed, false);
});

test('duplicate upstream basenames retain distinct exact paths and profile IDs', () => {
  const qa = register.selections.find((selection) => selection.agentId === 'qa-expert');
  const testAutomators = qa.candidateProfiles.filter((profile) => profile.sourcePath.endsWith('/test-automator.md'));
  assert.ok(testAutomators.length > 1);
  assert.equal(new Set(testAutomators.map((profile) => profile.sourcePath)).size, testAutomators.length);
  assert.equal(new Set(testAutomators.map((profile) => profile.profileId)).size, testAutomators.length);
});

test('register contains no legacy unresolved status and no generated paths in provenance', () => {
  const text = JSON.stringify(register);
  assert.doesNotMatch(text, /"status":"UNRESOLVED"/);
  for (const selection of register.selections) {
    for (const profile of [...selection.selectedProfiles, ...selection.candidateProfiles]) {
      assert.doesNotMatch(profile.sourcePath, /^\.codex\/agents\//);
    }
  }
});

test('selection validator fails closed on mutated pin and content hash', () => {
  const mutated = structuredClone(register);
  const selected = mutated.selections.find((selection) => selection.status === 'SELECTED');
  selected.selectedProfiles[0].commitSha = '0'.repeat(40);
  selected.selectedProfiles[1].rawSha256 = 'not-a-hash';
  const result = validateSelectionRegister(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('unapproved repository/commit')));
  assert.ok(result.errors.some((error) => error.includes('invalid hash')));
});

test('selection validator rejects Windows paths, duplicate profiles and malformed collections', () => {
  const mutated = structuredClone(register);
  const selected = mutated.selections.find((selection) => selection.status === 'SELECTED');
  selected.selectedProfiles[0].sourcePath = '\\\\server\\share\\profile.toml';
  selected.selectedProfiles.push(structuredClone(selected.selectedProfiles[1]));
  const ownerBlocked = mutated.selections.find((selection) => selection.status === 'REQUIRES_OWNER_DECISION');
  ownerBlocked.candidateProfiles = 'not-an-array';
  const result = validateSelectionRegister(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('unsafe sourcePath')));
  assert.ok(result.errors.some((error) => error.includes('duplicate profile path')));
  assert.ok(result.errors.some((error) => error.includes('profile collections must be arrays')));
});

test('selection validator requires exactly both unique approved repository descriptors', () => {
  const missing = structuredClone(register); missing.repositories = [];
  assert.ok(validateSelectionRegister(missing).errors.some((error) => error.includes('exactly two')));
  const duplicate = structuredClone(register); duplicate.repositories[1] = structuredClone(duplicate.repositories[0]);
  const result = validateSelectionRegister(duplicate);
  assert.ok(result.errors.includes('duplicate repository descriptor'));
  assert.ok(result.errors.some((error) => error.includes('repository descriptor missing')));
});

function git(cwd, args, input) {
  const result = spawnSync('git', args, { cwd, input, encoding: input === undefined ? 'utf8' : null, shell: false });
  assert.equal(result.status, 0, result.stderr?.toString() || result.stdout?.toString());
  return result.stdout?.toString().trim();
}

function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

function provenanceFixture() {
  const repo = mkdtempSync(join(tmpdir(), 'ios-upstream-provenance-'));
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.email', 'fixture@example.invalid']);
  git(repo, ['config', 'user.name', 'Fixture']);
  mkdirSync(join(repo, 'categories'));
  writeFileSync(join(repo, 'LICENSE'), 'MIT License\n\nfixture\n');
  writeFileSync(join(repo, 'categories', 'fixture.toml'), 'name = "fixture-profile"\n');
  git(repo, ['add', '.']); git(repo, ['commit', '-m', 'fixture']);
  const commitSha = git(repo, ['rev-parse', 'HEAD']);
  const license = readFileSync(join(repo, 'LICENSE'));
  const profile = readFileSync(join(repo, 'categories', 'fixture.toml'));
  const repository = 'Fixture/upstream';
  const fixtureRegister = {
    repositories: [{ repository, commitSha, license: 'MIT', licensePath: 'LICENSE', licenseRawSha256: sha(license), licenseNormalizedSha256: sha(license) }],
    selections: [{ agentId: 'fixture', status: 'SELECTED', selectedProfiles: [{ repository, commitSha, sourcePath: 'categories/fixture.toml', profileId: 'fixture-profile', rawSha256: sha(profile), normalizedSha256: sha(profile), license: 'MIT' }], candidateProfiles: [] }],
  };
  return { repo, repository, fixtureRegister };
}

test('source verifier recomputes profile and license provenance from exact commit blobs', () => {
  const fixture = provenanceFixture();
  try {
    const clean = verifySelectionSources(fixture.fixtureRegister, { [fixture.repository]: fixture.repo });
    assert.equal(clean.ok, true, clean.errors.join('\n'));
    assert.equal(clean.verifiedProfiles, 1);
    const noRoots = verifySelectionSources(fixture.fixtureRegister, {});
    assert.equal(noRoots.ok, false);
    assert.equal(noRoots.verifiedProfiles, 0);
    assert.ok(noRoots.errors.some((error) => error.includes('source root required')));
    const modified = structuredClone(fixture.fixtureRegister);
    modified.selections[0].selectedProfiles[0].rawSha256 = '0'.repeat(64);
    assert.ok(verifySelectionSources(modified, { [fixture.repository]: fixture.repo }).errors.some((error) => error.includes('content hash mismatch')));
    const missing = structuredClone(fixture.fixtureRegister);
    missing.selections[0].selectedProfiles[0].sourcePath = 'categories/missing.toml';
    assert.ok(verifySelectionSources(missing, { [fixture.repository]: fixture.repo }).errors.some((error) => error.includes('unsafe or missing object mode')));
  } finally { rmSync(fixture.repo, { recursive: true, force: true }); }
});

test('pinned catalog enumeration ignores dirty or deleted working-tree files', () => {
  const fixture = provenanceFixture();
  try {
    unlinkSync(join(fixture.repo, 'categories', 'fixture.toml'));
    const paths = listPinnedCatalogPaths(fixture.repo, fixture.fixtureRegister.repositories[0].commitSha, 'categories', '.toml');
    assert.deepEqual(paths, ['categories/fixture.toml']);
  } finally { rmSync(fixture.repo, { recursive: true, force: true }); }
});

test('source verifier rejects symlink and submodule Git object modes', () => {
  const fixture = provenanceFixture();
  try {
    const blob = git(fixture.repo, ['hash-object', '-w', '--stdin'], Buffer.from('fixture.toml'));
    git(fixture.repo, ['update-index', '--add', '--cacheinfo', `120000,${blob},categories/link.toml`]);
    const commit = git(fixture.repo, ['rev-parse', 'HEAD']);
    git(fixture.repo, ['update-index', '--add', '--cacheinfo', `160000,${commit},categories/submodule.toml`]);
    git(fixture.repo, ['commit', '-m', 'unsafe modes']);
    const unsafeCommit = git(fixture.repo, ['rev-parse', 'HEAD']);
    const unsafe = structuredClone(fixture.fixtureRegister);
    unsafe.repositories[0].commitSha = unsafeCommit;
    unsafe.selections[0].selectedProfiles = ['link.toml', 'submodule.toml'].map((name) => ({ repository: fixture.repository, commitSha: unsafeCommit, sourcePath: `categories/${name}`, profileId: 'fixture-profile', rawSha256: '0'.repeat(64), normalizedSha256: '0'.repeat(64), license: 'MIT' }));
    const result = verifySelectionSources(unsafe, { [fixture.repository]: fixture.repo });
    assert.equal(result.ok, false);
    assert.equal(result.errors.filter((error) => error.includes('unsafe or missing object mode')).length, 2);
  } finally { rmSync(fixture.repo, { recursive: true, force: true }); }
});
