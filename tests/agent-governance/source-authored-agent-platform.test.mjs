import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateAgentIntegrityRegistry } from '../../tools/agents/validate-agent-integrity-registry.mjs';
import { validateActivationBoundary, validateActivationRequest } from '../../tools/agents/validate-activation-boundary.mjs';

const root = resolve(import.meta.dirname, '../..');

test('five canonical source-authored profiles pass integrity validation', () => {
  const result = validateAgentIntegrityRegistry(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.activationPerformed, false);
});

test('profile byte drift is rejected by the integrity registry', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'ios-integrity-'));
  cpSync(resolve(root, '.codex'), resolve(fixture, '.codex'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/registry'), resolve(fixture, 'architecture/agents/registry'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/schemas'), resolve(fixture, 'architecture/agents/schemas'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/contracts'), resolve(fixture, 'architecture/agents/contracts'), { recursive: true });
  const profile = resolve(fixture, '.codex/agents/ios-agent-orchestrator.toml');
  writeFileSync(profile, `${readFileSync(profile, 'utf8')}\n# drift\n`);
  const result = validateAgentIntegrityRegistry(fixture);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('ios-agent-orchestrator:PROFILE_SHA256_MISMATCH'));
});

test('runtime-verified status requires complete current evidence', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'ios-evidence-'));
  cpSync(resolve(root, '.codex'), resolve(fixture, '.codex'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/registry'), resolve(fixture, 'architecture/agents/registry'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/schemas'), resolve(fixture, 'architecture/agents/schemas'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/contracts'), resolve(fixture, 'architecture/agents/contracts'), { recursive: true });
  const path = resolve(fixture, 'architecture/agents/registry/agent-integrity-registry.yaml');
  const registry = JSON.parse(readFileSync(path, 'utf8'));
  registry.agents[0].canonicalStatus = 'CANONICAL_SOURCE_RUNTIME_VERIFIED';
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
  const result = validateAgentIntegrityRegistry(fixture);
  assert.ok(result.errors.includes('ios-agent-orchestrator:RUNTIME_VERIFIED_WITHOUT_COMPLETE_EVIDENCE'));
});

test('activation boundary is validation-only and remains closed', () => {
  const boundary = validateActivationBoundary(root);
  assert.equal(boundary.ok, true, boundary.errors.join('\n'));
  assert.equal(boundary.activationMutationImplemented, false);
  assert.equal(boundary.productionWrites, 0);
  const errors = validateActivationRequest({}, { expectedHead: 'a'.repeat(40) });
  assert.ok(errors.includes('ACTIVATION_STATUS_MUTATION_NOT_IMPLEMENTED'));
  assert.ok(errors.includes('OWNER_APPROVAL_MISSING'));
  assert.ok(errors.includes('ADR_NOT_ACCEPTED'));
});
