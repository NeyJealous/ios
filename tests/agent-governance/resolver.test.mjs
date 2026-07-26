import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  changedPathsFromGit, normalizeRepoPath, parseNameStatusZ, readJsonCompatibleYaml,
  resolveRequiredAgents, validateException,
} from '../../tools/agent-governance-lib.mjs';

const root = resolve(import.meta.dirname, '../..');
const matrix = readJsonCompatibleYaml(resolve(root, 'architecture/agents/review-matrix.yaml'));

test('Windows and Linux paths normalize to the same deterministic result', () => {
  assert.equal(normalizeRepoPath('tests\\agent-governance\\x.test.mjs'), 'tests/agent-governance/x.test.mjs');
  const a = resolveRequiredAgents({ changedPaths: ['tests\\agent-governance\\x.test.mjs'], matrix });
  const b = resolveRequiredAgents({ changedPaths: ['tests/agent-governance/x.test.mjs'], matrix });
  assert.deepEqual(a.RequiredAgents, b.RequiredAgents);
  assert.deepEqual(a.MatchedRules, b.MatchedRules);
});

test('name-status parser handles add, delete and rename', () => {
  const parsed = parseNameStatusZ('A\0new.txt\0D\0old.txt\0R100\0before.txt\0after.txt\0');
  assert.deepEqual(parsed, [
    { status: 'A', path: 'new.txt' },
    { status: 'D', path: 'old.txt' },
    { status: 'R100', oldPath: 'before.txt', path: 'after.txt' },
  ]);
});

const valid = {
  ExceptionId: 'EX-TEST-1', RfcAdrReference: 'RFC-TEST', OwnerApproval: 'github-review',
  Reason: 'Scoped non-baseline role is demonstrably irrelevant.',
  Expiry: '2099-01-01T00:00:00Z', RiskAcceptance: 'Owner accepts documented residual risk.',
  ExcludedAgents: ['UX_REVIEWER'],
};

test('valid exception requires verified owner approval', () => {
  assert.equal(validateException(valid, matrix, { ownerApproved: true }).valid, true);
  assert.equal(validateException(valid, matrix, { ownerApproved: false }).valid, false);
});

test('expired exception fails', () => {
  const expired = { ...valid, Expiry: '2020-01-01T00:00:00Z' };
  assert.equal(validateException(expired, matrix, { ownerApproved: true }).valid, false);
});

test('a valid exception preserves active-development availability', () => {
  const result = resolveRequiredAgents({
    changedPaths: ['docs/guide.md'], matrix, exceptions: [valid], ownerApproved: true,
  });
  assert.equal(result.ExceptionResults[0].valid, true);
  assert.equal(result.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');
  assert.equal(result.OverallResult, 'RESOLVED');
  assert.equal(result.FailClosed, false);
  assert.deepEqual(result.BlockedByUnavailableAgents, []);
});

test('empty diff is blocked', () => {
  assert.throws(() => resolveRequiredAgents({ changedPaths: [], matrix }), /Empty diff/);
});

test('resolver is deterministic', () => {
  const input = ['docs/z.md', 'tests/a.test.mjs', 'architecture/agents/x.json'];
  const a = resolveRequiredAgents({ changedPaths: input, matrix });
  const b = resolveRequiredAgents({ changedPaths: [...input].reverse(), matrix });
  assert.deepEqual(a.RequiredAgents, b.RequiredAgents);
  assert.deepEqual(a.ChangedPaths, b.ChangedPaths);
});

test('a mixed known and unknown path always blocks with mandatory active agents', () => {
  const result = resolveRequiredAgents({
    changedPaths: ['docs/known.md', 'unclassified/unknown.bin'], matrix,
  });
  assert.equal(result.FailClosed, true);
  assert.equal(result.TaskType, 'mixed/unknown');
  assert.deepEqual(result.RequiredAgents, matrix.FailClosed.RequiredAgents.slice().sort());
  assert.equal(result.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');
  assert.equal(result.OverallResult, 'BLOCKED');
  assert.deepEqual(result.BlockedByUnavailableAgents, []);
});

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function commit(cwd, message) {
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

function write(root, path, content = 'fixture\n') {
  const target = join(root, ...path.split('/'));
  mkdirSync(resolve(target, '..'), { recursive: true });
  writeFileSync(target, content);
}

test('Git add, delete, and rename changes are classified from both affected paths', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'ios-agent-resolver-'));
  try {
    git(fixture, 'init', '-b', 'main');
    git(fixture, 'config', 'user.name', 'Agent Governance Test');
    git(fixture, 'config', 'user.email', 'agent-governance@example.invalid');
    write(fixture, 'README.md');
    const initial = commit(fixture, 'initial');

    write(fixture, 'docs/added.md');
    const afterAdd = commit(fixture, 'add docs');
    const addDiff = changedPathsFromGit(fixture, initial, afterAdd);
    assert.deepEqual(addDiff.changes, [{ status: 'A', path: 'docs/added.md' }]);
    const addResolution = resolveRequiredAgents({ changedPaths: addDiff.paths, matrix });
    assert.equal(addResolution.OverallResult, 'RESOLVED');
    assert.equal(addResolution.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');

    git(fixture, 'rm', 'docs/added.md');
    const afterDelete = commit(fixture, 'delete docs');
    const deleteDiff = changedPathsFromGit(fixture, afterAdd, afterDelete);
    assert.deepEqual(deleteDiff.changes, [{ status: 'D', path: 'docs/added.md' }]);
    const deleteResolution = resolveRequiredAgents({ changedPaths: deleteDiff.paths, matrix });
    assert.equal(deleteResolution.OverallResult, 'RESOLVED');
    assert.equal(deleteResolution.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');

    write(fixture, 'docs/before.md');
    const beforeRename = commit(fixture, 'rename source');
    mkdirSync(join(fixture, 'IOS_SOURCE_SNAPSHOT', 'work', 'apps-script'), { recursive: true });
    git(fixture, 'mv', 'docs/before.md', 'IOS_SOURCE_SNAPSHOT/work/apps-script/Core.gs');
    const afterRename = commit(fixture, 'rename docs to Apps Script');
    const renameDiff = changedPathsFromGit(fixture, beforeRename, afterRename);
    assert.deepEqual(renameDiff.changes, [{
      status: 'R100', oldPath: 'docs/before.md', path: 'IOS_SOURCE_SNAPSHOT/work/apps-script/Core.gs',
    }]);
    const resolved = resolveRequiredAgents({ changedPaths: renameDiff.paths, matrix });
    assert.ok(resolved.RequiredAgents.includes('ios-agent-orchestrator'));
    assert.equal(resolved.OverallResult, 'BLOCKED');
    assert.equal(resolved.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');
    assert.ok(resolved.RequiredControls.includes('development-activation-owner-authorized'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('resolver CLI resolves HEAD to an exact SHA for active development', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'ios-agent-resolver-cli-'));
  try {
    git(fixture, 'init', '-b', 'main');
    git(fixture, 'config', 'user.name', 'Agent Governance Test');
    git(fixture, 'config', 'user.email', 'agent-governance@example.invalid');
    write(fixture, 'architecture/agents/review-matrix.yaml', `${JSON.stringify(matrix, null, 2)}\n`);
    write(fixture, 'README.md');
    const base = commit(fixture, 'baseline');
    write(fixture, 'docs/cli-change.md');
    const head = commit(fixture, 'documentation change');

    const result = spawnSync(process.execPath, [
      resolve(root, 'tools/resolve-required-agents.mjs'), '--root', fixture,
      '--base', base, '--head', 'HEAD', '--branch', 'feature/cli-fixture',
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.match(output.BaseSHA, /^[0-9a-f]{40}$/i);
    assert.match(output.HeadSHA, /^[0-9a-f]{40}$/i);
    assert.equal(output.HeadSHA, head);
    assert.equal(output.OverallResult, 'RESOLVED');
    assert.equal(output.MandatoryAgentAvailability, 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
