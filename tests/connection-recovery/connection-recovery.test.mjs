import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  atomicWriteJson, classifyEvidence, createOperation, sanitize, sanitizeText,
  transitionAllowed, worktreeSnapshot,
} from '../../tools/connection-recovery-lib.mjs';
import { args, tempGitRepo } from './helpers.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, 'fixtures', 'evidence-states.json'), 'utf8'));

test('status model: NOT_STARTED', () => assert.equal(classifyEvidence('GIT_PUSH', {}).status, 'NOT_STARTED'));
test('status model: LOCAL_ONLY', () => assert.equal(classifyEvidence('GIT_PUSH', fixtures.gitRemoteAbsent).status, 'LOCAL_ONLY'));
test('status model: PUSH_COMPLETED', () => assert.equal(classifyEvidence('GIT_PUSH', fixtures.gitRemoteMatches).status, 'PUSH_COMPLETED'));
test('status model: PR_CREATED', () => assert.equal(classifyEvidence('PR_CREATE', fixtures.prOpen).status, 'PR_CREATED'));
test('status model: MERGED', () => assert.equal(classifyEvidence('PR_MERGE', fixtures.prMerged).status, 'MERGED'));
test('status model: REMOTE_APPLY_COMPLETED', () => assert.equal(classifyEvidence('APPS_SCRIPT_DEPLOY', fixtures.deploymentCompleted).status, 'REMOTE_APPLY_COMPLETED'));
test('status model: UNKNOWN for missing evidence', () => assert.equal(classifyEvidence('GENERIC_REMOTE_WRITE', {}).status, 'UNKNOWN'));
test('conflicting evidence is UNKNOWN', () => assert.equal(classifyEvidence('GIT_PUSH', fixtures.conflicting).errorClass, 'CONFLICTING_EVIDENCE'));
test('stale evidence is UNKNOWN', () => assert.equal(classifyEvidence('PR_CREATE', fixtures.stale).errorClass, 'STALE_EVIDENCE'));
test('remote SHA mismatch is UNKNOWN', () => assert.equal(classifyEvidence('GIT_PUSH', fixtures.gitRemoteDiffers).errorClass, 'REMOTE_SHA_MISMATCH'));
test('ls-remote timeout is UNKNOWN', () => assert.equal(classifyEvidence('GIT_PUSH', fixtures.timeout).status, 'UNKNOWN'));

test('checkpoint atomic write leaves no temp file', () => {
  const root = tempGitRepo();
  const path = join(root, 'checkpoint.json');
  atomicWriteJson(path, { b: 2, a: 1 });
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { a: 1, b: 2 });
  assert.equal(readdirSync(root).some((name) => name.endsWith('.tmp')), false);
});

test('secret masking covers tokens, cookies, Authorization and identifiers', () => {
  const syntheticAccountId = String(123456).repeat(2);
  const syntheticToken = ['gh', 'p_', 'abcdefghijklmnopqrstuvwxyz'].join('');
  const input = `${['Authorization', ': Bearer '].join('')}${syntheticToken} ${['Cookie', ': sid=', 'private'].join('')} accountId=${syntheticAccountId} scriptId=abcdefghijklmnopqrstuvwx`;
  const masked = sanitizeText(input);
  assert.equal(masked.includes(syntheticAccountId), false);
  assert.doesNotMatch(masked, /ghp_|sid=private|abcdefghijklmnopqrstuvwx/);
  assert.match(masked, /REDACTED/);
});

test('embedded credential URL and local user path are masked', () => {
  const masked = sanitize({ url: ['https', '://alice:', 'secret@example.invalid/repo'].join(''), path: 'C:\\Users\\Someone\\repo' });
  assert.equal(masked.url, 'https://[REDACTED]@example.invalid/repo');
  assert.match(masked.path, /LOCAL_USER_PATH/);
});

test('invalid operation type is rejected', () => {
  const root = tempGitRepo();
  assert.throws(() => createOperation(root, args('INVALID')), /Недопустимый operation type/);
});

test('invalid backward state transition is rejected', () => {
  assert.equal(transitionAllowed('MERGED', 'LOCAL_ONLY'), false);
  assert.equal(transitionAllowed('UNKNOWN', 'MERGED'), true);
});

test('dirty tree and detached HEAD are detected', () => {
  const root = tempGitRepo();
  const before = worktreeSnapshot(root);
  assert.equal(before.dirty, false);
  writeFileSync(join(root, 'dirty.txt'), 'dirty');
  assert.equal(worktreeSnapshot(root).dirty, true);
  execFileSync('git', ['checkout', '--detach'], { cwd: root, stdio: 'ignore', windowsHide: true });
  assert.equal(worktreeSnapshot(root).detached, true);
});

test('CLI lifecycle start/status/verify/classify/resume-plan/close', () => {
  const root = tempGitRepo();
  const cli = fileURLToPath(new URL('../../tools/connection-recovery.mjs', import.meta.url));
  const env = { ...process.env, CRP_NOW: '2026-01-01T00:00:00.000Z' };
  const common = ['--operation', 'GENERIC_REMOTE_WRITE', '--gate', 'TEST', '--branch', 'feature/test', '--target', 'MockTarget', '--idempotency-key', 'fixture-key'];
  const start = execFileSync(process.execPath, [cli, 'start', ...common], { cwd: root, env, encoding: 'utf8', windowsHide: true });
  const operationId = start.match(/crp-[a-z0-9-]{12,96}/)?.[0];
  assert.ok(operationId);
  const status = execFileSync(process.execPath, [cli, 'status', '--operation-id', operationId], { cwd: root, env, encoding: 'utf8', windowsHide: true });
  assert.match(status, /LOCAL_ONLY/);
  const evidence = join(root, 'evidence.json');
  writeFileSync(evidence, JSON.stringify({ status: 'completed', targetConfirmed: true, observedAt: '2026-01-01T00:00:00.000Z' }));
  assert.match(execFileSync(process.execPath, [cli, 'verify', '--operation-id', operationId, '--evidence-file', evidence], { cwd: root, env, encoding: 'utf8', windowsHide: true }), /REMOTE_APPLY_COMPLETED/);
  assert.match(execFileSync(process.execPath, [cli, 'classify', '--operation-id', operationId], { cwd: root, env, encoding: 'utf8', windowsHide: true }), /REMOTE_APPLY_COMPLETED/);
  assert.match(execFileSync(process.execPath, [cli, 'resume-plan', '--operation-id', operationId], { cwd: root, env, encoding: 'utf8', windowsHide: true }), /forbiddenRetries/);
  assert.match(execFileSync(process.execPath, [cli, 'close', '--operation-id', operationId], { cwd: root, env, encoding: 'utf8', windowsHide: true }), /CHECKPOINT ЗАКРЫТ/);
});
