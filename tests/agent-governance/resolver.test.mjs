import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import {
  normalizeRepoPath, parseNameStatusZ, readJsonCompatibleYaml,
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

test('exception cannot remove global mandatory agents', () => {
  const forbidden = { ...valid, ExcludedAgents: ['DOCUMENTATION_REVIEWER'] };
  const result = validateException(forbidden, matrix, { ownerApproved: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /cannot exclude/);
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
