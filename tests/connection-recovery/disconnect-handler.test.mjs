import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createOperation, resumePlan, saveCheckpoint, verifyCheckpoint } from '../../tools/connection-recovery-lib.mjs';
import { args, tempGitRepo } from './helpers.mjs';

for (const scenario of ['disconnect before write', 'disconnect during write', 'disconnect after write before response', 'application crash']) {
  test(`${scenario}: no evidence means no retry`, () => {
    const root = tempGitRepo();
    const checkpoint = createOperation(root, args('GENERIC_REMOTE_WRITE'));
    checkpoint.disconnectObserved = true;
    checkpoint.recoveryStatus = 'UNKNOWN';
    checkpoint.errorClass = 'REMOTE_STATUS_UNAVAILABLE';
    checkpoint.safeNextStep = 'ОСТАНОВИТЬСЯ';
    saveCheckpoint(root, checkpoint);
    const plan = resumePlan(checkpoint);
    assert.equal(plan.recoveryStatus, 'UNKNOWN');
    assert.equal(plan.userApprovalRequired, true);
    assert.equal(plan.forbiddenRetries.length, 1);
  });
}

test('network restored: read-only evidence can prove completion', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, args('GENERIC_REMOTE_WRITE'));
  checkpoint.disconnectObserved = true;
  const evidencePath = `${root}/evidence.json`;
  writeFileSync(evidencePath, JSON.stringify({ status: 'completed', targetConfirmed: true, observedAt: new Date().toISOString() }));
  const verified = verifyCheckpoint(root, checkpoint, { 'evidence-file': evidencePath });
  assert.equal(verified.recoveryStatus, 'REMOTE_APPLY_COMPLETED');
});

test('repeated handler classification is idempotent', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, args('GENERIC_REMOTE_WRITE'));
  checkpoint.disconnectObserved = true;
  checkpoint.recoveryStatus = 'UNKNOWN';
  checkpoint.safeNextStep = 'ОСТАНОВИТЬСЯ';
  const first = resumePlan(checkpoint);
  const second = resumePlan(checkpoint);
  assert.deepEqual(second, first);
});
