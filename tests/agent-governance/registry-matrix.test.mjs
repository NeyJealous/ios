import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolve } from 'node:path';
import {
  readJsonCompatibleYaml, resolveRequiredAgents, validateMatrix, validateRegistry,
} from '../../tools/agent-governance-lib.mjs';

const root = resolve(import.meta.dirname, '../..');
const registry = readJsonCompatibleYaml(resolve(root, 'architecture/agents/agent-registry.yaml'));
const matrix = readJsonCompatibleYaml(resolve(root, 'architecture/agents/review-matrix.yaml'));

test('registry and matrix are valid', () => {
  assert.deepEqual(validateRegistry(registry), []);
  assert.deepEqual(validateMatrix(matrix, registry), []);
});

test('all governance JSON schemas are syntactically valid draft 2020-12 documents', () => {
  for (const name of [
    'agent-registry.schema.json', 'review-matrix.schema.json',
    'agent-exception.schema.json', 'review-contract.schema.json',
    'review-manifest.schema.json',
  ]) {
    const schema = JSON.parse(readFileSync(resolve(root, 'architecture/agents', name), 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.type, 'object');
  }
});

test('first wave is configured but fail-closed until runtime discovery is verified', () => {
  assert.equal(registry.PlatformState, 'FIRST_WAVE_IMPLEMENTED_AND_CONFIGURED_IN_CANONICAL');
  assert.equal(registry.ActiveCustomAgents, 0);
  assert.equal(registry.ProvisionedAgents, 5);
  assert.equal(registry.Agents.length, 5);
  assert.ok(registry.Agents.every((agent) => agent.Status === 'CONFIGURED_NOT_RUNTIME_VERIFIED' && agent.ActivationEligible === false));
  assert.equal(matrix.PlatformState, 'FIRST_WAVE_IMPLEMENTED_AND_CONFIGURED_IN_CANONICAL');
  assert.deepEqual(matrix.AlwaysRequiredAgents, []);
  assert.equal(matrix.FailClosed.RequiredAgents.length, 4);
  assert.equal(matrix.Transition.ActivationGate, 'CONFIGURED_RUNTIME_UNVERIFIED');
  const serialized = JSON.stringify({ registry, matrix });
  for (const oldId of ['APPS_SCRIPT_REVIEWER', 'ARCHITECTURE_REVIEWER', 'BOND_SPECIALIST', 'COMPANY_RATING_REVIEWER', 'DOCUMENTATION_REVIEWER', 'GOOGLE_SHEETS_REVIEWER', 'INVESTMENT_LOGIC_REVIEWER', 'PERFORMANCE_AUDITOR', 'TEST_GENERATOR', 'UX_REVIEWER']) {
    assert.equal(serialized.includes(oldId), false, `stale agent identifier: ${oldId}`);
  }
});

const cases = [
  ['production domain', 'IOS_SOURCE_SNAPSHOT/work/apps-script/Core.gs', 'no-production-write'],
  ['docs only', 'docs/guide.md', 'traceability'],
  ['governance', 'architecture/agents/review-matrix.yaml', 'governance-tamper-check'],
  ['profiles', '.codex/agents/ios-agent-orchestrator.toml', 'upstream-integrity'],
  ['tests', 'tests/agent-governance/resolver.test.mjs', 'determinism'],
];

for (const [label, path, requiredControl] of cases) {
  test(`configured resolver routes ${label} but blocks dispatch`, () => {
    const result = resolveRequiredAgents({ changedPaths: [path], matrix });
    assert.ok(result.RequiredAgents.length > 0);
    assert.equal(result.MandatoryAgentAvailability, 'CONFIGURED_RUNTIME_NOT_AVAILABLE');
    assert.equal(result.OverallResult, 'BLOCKED');
    assert.equal(result.FailClosed, true);
    assert.ok(result.BlockedByUnavailableAgents.length > 0);
    assert.ok(result.RequiredControls.includes(requiredControl));
    assert.ok(result.RequiredControls.includes('runtime-discovery-unverified'));
  });
}

test('mixed and unknown changes require governance wave and remain fail-closed', () => {
  const result = resolveRequiredAgents({
    changedPaths: ['docs/guide.md', 'IOS_SOURCE_SNAPSHOT/work/apps-script/BondEngine.gs', 'unclassified/file.weird'], matrix,
  });
  assert.equal(result.TaskType, 'mixed/unknown');
  for (const agentId of matrix.FailClosed.RequiredAgents) assert.ok(result.RequiredAgents.includes(agentId));
  assert.ok(result.RequiredAgents.includes('ios-codebase-auditor'));
  assert.deepEqual(result.UnknownPaths, ['unclassified/file.weird']);
  assert.equal(result.MandatoryAgentAvailability, 'CONFIGURED_RUNTIME_NOT_AVAILABLE');
  assert.equal(result.OverallResult, 'BLOCKED');
  assert.ok(result.BlockedByUnavailableAgents.length > 0);
});
