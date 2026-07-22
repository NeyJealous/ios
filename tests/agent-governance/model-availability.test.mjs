import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));

test('availability status comes only from actual Codex runtime smoke and forbids downgrade', () => {
  assert.equal(registry.policy.statusSource, 'ACTUAL_CODEX_RUNTIME_SMOKE_ONLY');
  assert.equal(registry.policy.silentDowngradeAllowed, false);
  assert.deepEqual(registry.models.map((model) => model.modelId), ['terra', 'luna', 'sol', 'sol-ultra']);
  assert.ok(registry.models.every((model) => model.substitutionUsed === false));
});

test('Terra, Sol and Sol Ultra have successful exact runtime execution evidence', () => {
  for (const modelId of ['terra', 'sol', 'sol-ultra']) {
    const model = registry.models.find((candidate) => candidate.modelId === modelId);
    assert.equal(model.runtimeAvailability, 'RUNTIME_AVAILABLE');
    assert.equal(model.smokeResult, 'SUCCESS');
    assert.equal(model.resolvedSlug, model.requestedSlug);
    assert.equal(model.resolvedReasoningLevel, model.requestedReasoningLevel);
    assert.equal(model.resolutionEvidence, 'EXACT_OVERRIDE_ACCEPTED_AND_EXECUTED');
    assert.match(model.executionResponse, /^MODEL_RUNTIME_SMOKE_OK /);
    assert.equal(model.agentUsableAtRuntime, true);
  }
});

test('Luna is unavailable only because the exact runtime request was rejected', () => {
  const luna = registry.models.find((model) => model.modelId === 'luna');
  assert.equal(luna.requestedSlug, 'gpt-5.6-luna');
  assert.equal(luna.resolvedSlug, null);
  assert.equal(luna.runtimeAvailability, 'MODEL_NOT_AVAILABLE');
  assert.equal(luna.smokeResult, 'FAILURE');
  assert.match(luna.providerDispatchResponse, /^Unknown model gpt-5\.6-luna/);
  assert.equal(luna.executionResponse, null);
  assert.equal(luna.agentUsableAtRuntime, false);
});

test('Sol Ultra is the tested Sol slug with ultra reasoning, not an invented slug', () => {
  const ultra = registry.models.find((model) => model.modelId === 'sol-ultra');
  assert.equal(ultra.requestedSlug, 'gpt-5.6-sol');
  assert.equal(ultra.requestedReasoningLevel, 'ultra');
  assert.equal(ultra.resolvedReasoningLevel, 'ultra');
});

test('runtime success does not fabricate trusted activation evidence', () => {
  for (const model of registry.models) {
    assert.equal(model.platformActivationEligible, false);
    assert.equal(model.attestationStatus, 'INSUFFICIENT_EVIDENCE');
    assert.ok(Number.isInteger(model.observedEndToEndLatencyMs) && model.observedEndToEndLatencyMs > 0);
  }
});
