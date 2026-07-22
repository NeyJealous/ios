import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));

test('model availability registry forbids silent downgrade and records all exact slugs', () => {
  assert.equal(registry.policy.silentDowngradeAllowed, false);
  assert.equal(registry.models.length, 4);
  assert.deepEqual(registry.models.map((model) => model.requestedSlug), [
    'gpt-5.6-terra', 'gpt-5.6-sol', 'gpt-5.6-luna', 'gpt-5.6-sol-pro',
  ]);
  assert.ok(registry.models.every((model) => model.substitutionUsed === false));
});

test('unavailable Luna and Sol Pro are not silently resolved', () => {
  for (const slug of ['gpt-5.6-luna', 'gpt-5.6-sol-pro']) {
    const model = registry.models.find((candidate) => candidate.requestedSlug === slug);
    assert.equal(model.availability, 'MODEL_NOT_AVAILABLE');
    assert.equal(model.resolvedSlug, null);
  }
});

test('Terra and Sol remain candidates until trusted attestation exists', () => {
  for (const slug of ['gpt-5.6-terra', 'gpt-5.6-sol']) {
    const model = registry.models.find((candidate) => candidate.requestedSlug === slug);
    assert.equal(model.resolvedSlug, slug);
    assert.equal(model.availability, 'AVAILABLE_CANDIDATE');
    assert.equal(model.attestationStatus, 'INSUFFICIENT_EVIDENCE');
  }
});
