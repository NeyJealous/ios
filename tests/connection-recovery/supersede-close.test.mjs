import test from 'node:test';
import assert from 'node:assert/strict';
import { createOperation, saveCheckpoint, supersedeCheckpoint } from '../../tools/connection-recovery-lib.mjs';
import { args, tempGitRepo } from './helpers.mjs';

function pair() {
  const root = tempGitRepo();
  const original = createOperation(root, args());
  original.evidence.push({ kind: 'git', localSha: original.localCommitSha, remoteSha: null, observedAt: '2026-01-01T00:00:01.000Z' });
  original.verificationHistory.push({ verifiedAt: '2026-01-01T00:00:01.000Z', status: 'LOCAL_ONLY', errorClass: null });
  saveCheckpoint(root, original);
  const successor = structuredClone(original);
  successor.operationId = 'crp-successor-git-push-0001';
  successor.targetRef = 'MockTarget:exact-branch';
  successor.startedAt = '2099-01-01T00:00:00.000Z';
  successor.lastVerifiedAt = '2099-01-01T00:00:01.000Z';
  successor.observedState = 'PUSH_COMPLETED';
  successor.recoveryStatus = 'PUSH_COMPLETED';
  successor.evidence = [{ kind: 'git', localSha: successor.localCommitSha, remoteSha: successor.localCommitSha, observedAt: '2099-01-01T00:00:01.000Z' }];
  successor.verificationHistory = [{ verifiedAt: '2099-01-01T00:00:01.000Z', status: 'PUSH_COMPLETED', errorClass: null }];
  successor.closedAt = '2099-01-01T00:00:02.000Z';
  saveCheckpoint(root, successor);
  return { root, original, successor };
}

test('LOCAL_ONLY closes only as audited superseded operation', () => {
  const { root, original, successor } = pair();
  const closed = supersedeCheckpoint(root, original, { approved: true, reason: 'Заменена более поздней доказанной операцией.', 'superseded-by': successor.operationId });
  assert.equal(closed.recoveryStatus, 'LOCAL_ONLY');
  assert.equal(closed.supersededBy, successor.operationId);
  assert.ok(closed.closedAt);
  assert.equal(closed.userApprovalRequired, false);
});

test('supersede requires explicit approval and reason', () => {
  const { root, original, successor } = pair();
  assert.throws(() => supersedeCheckpoint(root, original, { reason: 'Достаточная причина.', 'superseded-by': successor.operationId }), /--approved/);
  assert.throws(() => supersedeCheckpoint(root, original, { approved: true, 'superseded-by': successor.operationId }), /--reason/);
});

test('UNKNOWN can never be superseded', () => {
  const { root, original, successor } = pair();
  original.recoveryStatus = 'UNKNOWN';
  assert.throws(() => supersedeCheckpoint(root, original, { approved: true, reason: 'Достаточная причина.', 'superseded-by': successor.operationId }), /NOT_STARTED\/LOCAL_ONLY/);
});

test('unclosed or unproved successor blocks supersede', () => {
  const { root, original, successor } = pair();
  successor.closedAt = null;
  saveCheckpoint(root, successor);
  assert.throws(() => supersedeCheckpoint(root, original, { approved: true, reason: 'Достаточная причина.', 'superseded-by': successor.operationId }), /successor не закрыт/);
});

test('successor with another branch blocks supersede', () => {
  const { root, original, successor } = pair();
  successor.branch = 'another/branch';
  saveCheckpoint(root, successor);
  assert.throws(() => supersedeCheckpoint(root, original, { approved: true, reason: 'Достаточная причина.', 'superseded-by': successor.operationId }), /другой type\/branch/);
});
