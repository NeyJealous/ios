import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyEvidence } from '../../tools/connection-recovery-lib.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const f = JSON.parse(readFileSync(join(here, 'fixtures', 'evidence-states.json'), 'utf8'));

test('PR absent remains PUSH_COMPLETED when branch is confirmed', () => assert.equal(classifyEvidence('PR_CREATE', f.prAbsent).status, 'PUSH_COMPLETED'));
test('PR exists/open is PR_CREATED', () => assert.equal(classifyEvidence('PR_CREATE', f.prOpen).status, 'PR_CREATED'));
test('duplicate matching PR is UNKNOWN', () => assert.equal(classifyEvidence('PR_CREATE', f.prDuplicate).errorClass, 'DUPLICATE_PR_AMBIGUITY'));
test('PR merged with merge commit is MERGED', () => assert.equal(classifyEvidence('PR_MERGE', f.prMerged).status, 'MERGED'));
test('PR closed unmerged remains PR_CREATED', () => assert.equal(classifyEvidence('PR_MERGE', f.prClosed).status, 'PR_CREATED'));
test('API timeout after successful create remains UNKNOWN', () => assert.equal(classifyEvidence('PR_CREATE', { ...f.prOpen, timeout: true }).status, 'UNKNOWN'));
test('API timeout after successful merge remains UNKNOWN', () => assert.equal(classifyEvidence('PR_MERGE', { ...f.prMerged, timeout: true }).status, 'UNKNOWN'));

test('deployment apply completed', () => assert.equal(classifyEvidence('APPS_SCRIPT_DEPLOY', f.deploymentCompleted).status, 'REMOTE_APPLY_COMPLETED'));
test('deployment pending is UNKNOWN', () => assert.equal(classifyEvidence('APPS_SCRIPT_DEPLOY', f.deploymentPending).status, 'UNKNOWN'));
test('deployment failed is UNKNOWN', () => assert.equal(classifyEvidence('APPS_SCRIPT_DEPLOY', f.deploymentFailed).status, 'UNKNOWN'));
test('deployment status unavailable is UNKNOWN', () => assert.equal(classifyEvidence('APPS_SCRIPT_DEPLOY', f.statusUnavailable).status, 'UNKNOWN'));
test('timeout after write is UNKNOWN and therefore blocks retry', () => assert.equal(classifyEvidence('GENERIC_REMOTE_WRITE', f.timeout).status, 'UNKNOWN'));
