import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { buildModelAvailabilityJson, buildModelAvailabilityMarkdown } from '../../tools/agents/render-model-availability-report.mjs';

const root = resolve(import.meta.dirname, '../..');
const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));
const reportPath = resolve(root, 'audit/agents/MODEL_RUNTIME_SMOKE_20260722/model-availability-report.json');
const markdownPath = resolve(root, 'audit/agents/MODEL_RUNTIME_SMOKE_20260722/model-availability-report.md');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

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

test('JSON and Markdown reports are deterministic full projections of registry evidence', () => {
  assert.deepEqual(report, buildModelAvailabilityJson(registry));
  assert.equal(report.overallStatus, 'RUNTIME_SMOKE_COMPLETE_WITH_UNAVAILABLE_MODELS');
  assert.equal(readFileSync(markdownPath, 'utf8'), buildModelAvailabilityMarkdown(registry));
});

test('current policy uses Sol Ultra while historical Phase 3A evidence remains byte-preserved', () => {
  for (const path of ['rfc/RFC-AGENT-PLATFORM-V2.md', 'adr/ADR-AGENT-PLATFORM-V2.md', 'audit/agents/MODEL_RUNTIME_SMOKE_20260722/acceptance-report.md']) {
    const text = readFileSync(resolve(root, path), 'utf8');
    assert.match(text, /Sol Ultra/);
    assert.doesNotMatch(text, /Luna\/Sol Pro|Luna и Sol Pro/);
  }
  const historical = new Map([
    ['audit/agents/model-availability-report.json', '7fffc248a9cc65f64fbb44bb7f77504544f31070c57797b63fdcc27985ef43f9'],
    ['audit/agents/model-availability-report.md', '5969d1b5dbad2159be3d4d76ab5716d81518d49a4d0929ea8d0e9155f68cb727'],
    ['audit/agents/phase-3a-acceptance-report.md', '107bc414de1786be504cc386b08b57865c7fdd326e0d92fdbf3ef1f9bffdfe1a'],
  ]);
  for (const [path, expectedHash] of historical) {
    const actualHash = createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
    assert.equal(actualHash, expectedHash, path);
  }
});
