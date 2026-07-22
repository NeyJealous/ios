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

test('zero-agent transition removes every active registry and matrix role', () => {
  assert.equal(registry.PlatformState, 'ZERO_AGENT_TRANSITION');
  assert.equal(registry.ActiveCustomAgents, 0);
  assert.deepEqual(registry.Agents, []);
  assert.equal(matrix.PlatformState, 'ZERO_AGENT_TRANSITION');
  assert.deepEqual(matrix.AlwaysRequiredAgents, []);
  assert.deepEqual(matrix.FailClosed.RequiredAgents, []);
  for (const rule of matrix.Rules) assert.deepEqual(rule.RequiredAgents, [], rule.RuleId);
  const serialized = JSON.stringify({ registry, matrix });
  for (const oldId of ['APPS_SCRIPT_REVIEWER', 'ARCHITECTURE_REVIEWER', 'BOND_SPECIALIST', 'COMPANY_RATING_REVIEWER', 'DOCUMENTATION_REVIEWER', 'GOOGLE_SHEETS_REVIEWER', 'INVESTMENT_LOGIC_REVIEWER', 'PERFORMANCE_AUDITOR', 'TEST_GENERATOR', 'UX_REVIEWER']) {
    assert.equal(serialized.includes(oldId), false, `stale agent identifier: ${oldId}`);
  }
});

const cases = [
  ['Apps Script', 'IOS_SOURCE_SNAPSHOT/work/apps-script/Core.gs', 'no-production-write'],
  ['investment', 'IOS_SOURCE_SNAPSHOT/work/apps-script/StrategyEngine.gs', 'no-investment-policy-change-without-gate'],
  ['bonds', 'IOS_SOURCE_SNAPSHOT/work/apps-script/BondEngine.gs', 'quantitative-evidence'],
  ['Sheets', 'IOS_SOURCE_SNAPSHOT/work/schema-parts/Schema_part1.gs', 'no-sheets-write'],
  ['Market Regime', 'IOS_SOURCE_SNAPSHOT/work/apps-script/MarketRegime.gs', 'no-r030-change'],
  ['docs only', 'docs/guide.md', 'traceability'],
  ['security', 'docs/security/policy.md', 'least-privilege'],
  ['workflow', '.github/workflows/check.yml', 'fork-safety'],
  ['governance', 'architecture/agents/review-matrix.yaml', 'governance-tamper-check'],
];

for (const [label, path, requiredControl] of cases) {
  test(`zero-agent resolver blocks ${label} while preserving controls`, () => {
    const result = resolveRequiredAgents({ changedPaths: [path], matrix });
    assert.deepEqual(result.RequiredAgents, []);
    assert.equal(result.MandatoryAgentAvailability, 'NOT_AVAILABLE');
    assert.equal(result.OverallResult, 'BLOCKED');
    assert.equal(result.FailClosed, true);
    assert.ok(result.BlockedByUnavailableAgents.length > 0);
    assert.ok(result.RequiredControls.includes(requiredControl));
    assert.ok(result.RequiredControls.includes('zero-agent-fail-closed'));
  });
}

test('mixed and unknown changes remain fail-closed without restoring historical agents', () => {
  const result = resolveRequiredAgents({
    changedPaths: ['docs/guide.md', 'IOS_SOURCE_SNAPSHOT/work/apps-script/BondEngine.gs', 'unclassified/file.weird'], matrix,
  });
  assert.equal(result.TaskType, 'mixed/unknown');
  assert.deepEqual(result.RequiredAgents, []);
  assert.deepEqual(result.UnknownPaths, ['unclassified/file.weird']);
  assert.equal(result.MandatoryAgentAvailability, 'NOT_AVAILABLE');
  assert.equal(result.OverallResult, 'BLOCKED');
  assert.ok(result.BlockedByUnavailableAgents.length > 0);
});
