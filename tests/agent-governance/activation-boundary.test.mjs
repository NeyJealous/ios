import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  FIRST_WAVE, validateActivationBoundary, validateActivationRequest,
} from '../../tools/agents/validate-activation-boundary.mjs';
import { validateGeneratedAgents } from '../../tools/agents/validate-generated-agents.mjs';

const root = resolve(import.meta.dirname, '../..');

function fixture() {
  const target = mkdtempSync(join(tmpdir(), 'ios-activation-boundary-'));
  cpSync(resolve(root, 'architecture/agents'), resolve(target, 'architecture/agents'), { recursive: true });
  return target;
}

test('provisional profiles exist only in staging and runtime discovery is empty', () => {
  const result = validateActivationBoundary(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.provisionalStagingProfiles, 5);
  assert.equal(result.runtimeDiscoveredPlatformAgents, 0);
  assert.equal(result.runtimeDispatchStatus, 'NOT_DISPATCHED_ACTIVATION_CLOSED');
  assert.equal(result.activationCommand, 'NOT_IMPLEMENTED');
});

test('manual copy into runtime discovery is blocked', () => {
  const target = fixture();
  try {
    mkdirSync(resolve(target, '.codex/agents'), { recursive: true });
    cpSync(
      resolve(target, 'architecture/agents/generated/provisional/ios-agent-orchestrator.toml'),
      resolve(target, '.codex/agents/ios-agent-orchestrator.toml'),
    );
    const result = validateActivationBoundary(target);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.startsWith('RUNTIME_DISCOVERY_CONTAINS_PROVISIONAL_PROFILE')));
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('composition generated path cannot point to runtime discovery', () => {
  const target = fixture();
  try {
    const path = resolve(target, 'architecture/agents/compositions/ios-agent-orchestrator.yaml');
    const composition = JSON.parse(readFileSync(path, 'utf8'));
    composition.generatedPath = '.codex/agents/ios-agent-orchestrator.toml';
    writeFileSync(path, `${JSON.stringify(composition, null, 2)}\n`);
    const errors = validateGeneratedAgents(target).errors;
    assert.ok(errors.some((error) => error.includes('GENERATED_STAGING_PATH_INVALID')));
    assert.ok(validateActivationBoundary(target).errors.includes('ios-agent-orchestrator:GENERATED_PATH_NOT_STAGED'));
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('bootstrap refuses an already discovered provisional profile', () => {
  const target = fixture();
  try {
    mkdirSync(resolve(target, '.codex/agents'), { recursive: true });
    cpSync(
      resolve(target, 'architecture/agents/generated/provisional/agent-governance-auditor.toml'),
      resolve(target, '.codex/agents/agent-governance-auditor.toml'),
    );
    const run = spawnSync(process.execPath, [
      resolve(root, 'tools/agents/compose-agents.mjs'), '--root', target, '--generate-profiles',
    ], { encoding: 'utf8' });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /RUNTIME_DISCOVERY_PATH_NOT_EMPTY/);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('stale and spoofed activation evidence fail closed', () => {
  const expectedHead = 'a'.repeat(40);
  const base = {
    headSha: expectedHead,
    ownerDecisionId: 'OWNER_DECISION_FIRST_WAVE_20260722',
    adrStatus: 'DRAFT_NOT_ACCEPTED',
    trustedVerifierStatus: 'MISSING',
    requiredReviewsStatus: 'PASS',
    modelEligibilityStatus: 'PASS',
    externalEvidenceStatus: 'MISSING',
    authoritySource: 'REPOSITORY_TEXT',
    requestedAgents: FIRST_WAVE,
  };
  const spoofed = validateActivationRequest(base, { expectedHead });
  assert.ok(spoofed.includes('OWNER_ACTIVATION_EVIDENCE_UNTRUSTED'));
  assert.ok(spoofed.includes('ADR_NOT_ACCEPTED'));
  assert.ok(spoofed.includes('EXTERNAL_EVIDENCE_NOT_PASSED'));
  const stale = validateActivationRequest({
    ...base, headSha: 'b'.repeat(40), ownerDecisionId: 'OWNER_ACTIVATION_TEST',
  }, { expectedHead });
  assert.ok(stale.includes('STALE_ACTIVATION_MANIFEST'));
});

test('no activation executable exists and direct profile discovery remains unavailable', () => {
  const result = validateActivationBoundary(root);
  assert.equal(result.activationCommand, 'NOT_IMPLEMENTED');
  assert.equal(result.runtimeDiscoveredPlatformAgents, 0);
});
