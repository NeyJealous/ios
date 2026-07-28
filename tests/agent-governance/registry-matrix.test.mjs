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

test('source-authored first wave is READY for personal development', () => {
  assert.equal(registry.PlatformState, 'SOURCE_AUTHORED_DEVELOPMENT_READY');
  assert.equal(registry.ActiveCustomAgents, 5);
  assert.equal(registry.ProvisionedAgents, 5);
  assert.equal(registry.Agents.length, 5);
  assert.ok(registry.Agents.every((agent) => agent.Status === 'READY' && agent.ActivationEligible === false));
  assert.equal(matrix.PlatformState, 'SOURCE_AUTHORED_DEVELOPMENT_READY');
  assert.deepEqual(matrix.AlwaysRequiredAgents, []);
  assert.equal(matrix.FailClosed.RequiredAgents.length, 4);
  assert.equal(matrix.Transition.ActivationGate, 'NOT_REQUIRED_FOR_PERSONAL_DEVELOPMENT');
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
  test(`configured resolver routes ${label} for development use`, () => {
    const result = resolveRequiredAgents({ changedPaths: [path], matrix });
    assert.ok(result.RequiredAgents.length > 0);
    assert.equal(result.MandatoryAgentAvailability, 'READY_FOR_PERSONAL_DEVELOPMENT');
    if (label === 'production domain') {
      assert.equal(result.OverallResult, 'BLOCKED');
      assert.equal(result.FailClosed, true);
      assert.deepEqual(result.BlockedByUnavailableAgents, ['MANDATORY_DOMAIN_REVIEWER_NOT_INTEGRATED']);
    } else {
      assert.equal(result.OverallResult, 'RESOLVED');
      assert.equal(result.FailClosed, false);
      assert.deepEqual(result.BlockedByUnavailableAgents, []);
    }
    assert.ok(result.RequiredControls.includes(requiredControl));
    assert.ok(result.RequiredControls.includes('runtime-discovery') || result.RequiredControls.includes('runtime-evidence'));
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
  assert.equal(result.MandatoryAgentAvailability, 'READY_FOR_PERSONAL_DEVELOPMENT');
  assert.equal(result.OverallResult, 'BLOCKED');
  assert.deepEqual(result.BlockedByUnavailableAgents, ['MANDATORY_DOMAIN_REVIEWER_NOT_INTEGRATED']);
});
