import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));
const report = JSON.parse(readFileSync(resolve(root, 'audit/agents/model-availability-report.json'), 'utf8'));

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

test('machine-readable report is a deterministic projection of the registry evidence', () => {
  assert.equal(report.repositoryHeadAtProbe, registry.probeWindow.repositoryHead);
  assert.equal(report.results.length, registry.models.length);
  for (const model of registry.models) {
    const row = report.results.find((candidate) => candidate.modelId === model.modelId);
    assert.ok(row, model.modelId);
    assert.equal(row.requestedModel, model.requestedSlug);
    assert.equal(row.requestedReasoning, model.requestedReasoningLevel);
    assert.equal(row.resolvedModel, model.resolvedSlug);
    assert.equal(row.resolvedReasoning, model.resolvedReasoningLevel);
    assert.equal(row.success, model.smokeResult === 'SUCCESS');
    assert.deepEqual(row.providerResponse, model.providerDispatchResponse);
    assert.equal(row.executionResponse, model.executionResponse);
    assert.equal(row.latencyMs, model.observedEndToEndLatencyMs);
    assert.equal(row.agentUsable, model.agentUsableAtRuntime);
    assert.equal(row.trustedAttestation, model.attestationStatus);
  }
});

test('current RFC and draft ADR use the owner-declared Sol Ultra model set without rewriting historical evidence', () => {
  for (const path of ['rfc/RFC-AGENT-PLATFORM-V2.md', 'adr/ADR-AGENT-PLATFORM-V2.md', 'audit/agents/phase-3a-acceptance-report.md']) {
    const text = readFileSync(resolve(root, path), 'utf8');
    assert.match(text, /Sol Ultra/);
    assert.doesNotMatch(text, /Luna\/Sol Pro|Luna и Sol Pro/);
  }
});
