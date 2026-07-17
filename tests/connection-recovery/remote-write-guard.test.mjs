import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertGuard, createOperation, saveCheckpoint,
} from '../../tools/connection-recovery-lib.mjs';
import { args, tempGitRepo } from './helpers.mjs';

const genericArgs = () => ({ ...args('GENERIC_REMOTE_WRITE'), 'idempotency-key': 'fixture-key' });

test('guard PASS requires clean expected branch and explicit approval', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, genericArgs());
  const guarded = assertGuard(root, checkpoint, { approved: true });
  assert.equal(guarded.userApprovalRequired, false);
});

test('guard blocks without approval', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, genericArgs());
  assert.throws(() => assertGuard(root, checkpoint, {}), /явный --approved/);
});

test('guard blocks dirty tree', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, genericArgs());
  writeFileSync(join(root, 'dirty.txt'), 'dirty');
  assert.throws(() => assertGuard(root, checkpoint, { approved: true }), /worktree dirty/);
});

test('duplicate active operation is rejected', () => {
  const root = tempGitRepo();
  createOperation(root, genericArgs());
  assert.throws(() => createOperation(root, genericArgs()), /незакрытая операция/);
});

test('active UNKNOWN blocks a new write', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, genericArgs());
  checkpoint.recoveryStatus = 'UNKNOWN';
  saveCheckpoint(root, checkpoint);
  assert.throws(() => assertGuard(root, checkpoint, { approved: true }), /REMOTE_WRITE_GUARD=UNKNOWN/);
});

test('generic write requires idempotency key', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, args('GENERIC_REMOTE_WRITE'));
  assert.throws(() => assertGuard(root, checkpoint, { approved: true }), /idempotency key/);
});

test('guard prevents duplicate push when remote SHA is already confirmed', () => {
  const root = tempGitRepo();
  const checkpoint = createOperation(root, args());
  const evidence = join(root, '.audit', 'connection-recovery', 'remote-evidence.json');
  writeFileSync(evidence, JSON.stringify({ localSha: checkpoint.localCommitSha, remoteSha: checkpoint.localCommitSha, observedAt: new Date().toISOString() }));
  assert.throws(() => assertGuard(root, checkpoint, { approved: true, 'evidence-file': evidence }), /duplicate write запрещена/);
});
