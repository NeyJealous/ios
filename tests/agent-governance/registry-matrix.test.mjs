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

test('registry rejects duplicate, unknown status, remote permission, source and output omissions', () => {
  const copy = structuredClone(registry);
  copy.Agents.push(structuredClone(copy.Agents[0]));
  copy.Agents[0].Status = 'MAGIC';
  copy.Agents[1].CanWriteRemote = true;
  copy.Agents[2].SpecificationSources = [];
  copy.Agents[3].RequiredOutputs = [];
  const errors = validateRegistry(copy).join('\n');
  for (const expected of ['duplicate AgentId', 'unknown status', 'forbidden permission', 'missing source', 'missing output contract']) {
    assert.match(errors, new RegExp(expected));
  }
});

const cases = [
  ['Apps Script', 'IOS_SOURCE_SNAPSHOT/work/apps-script/Core.gs', ['APPS_SCRIPT_REVIEWER', 'PERFORMANCE_AUDITOR']],
  ['investment', 'IOS_SOURCE_SNAPSHOT/work/apps-script/StrategyEngine.gs', ['INVESTMENT_LOGIC_REVIEWER', 'ARCHITECTURE_REVIEWER']],
  ['bonds', 'IOS_SOURCE_SNAPSHOT/work/apps-script/BondEngine.gs', ['BOND_SPECIALIST', 'INVESTMENT_LOGIC_REVIEWER']],
  ['Sheets', 'IOS_SOURCE_SNAPSHOT/work/schema-parts/Schema_part1.gs', ['GOOGLE_SHEETS_REVIEWER', 'UX_REVIEWER', 'PERFORMANCE_AUDITOR']],
  ['Market Regime', 'IOS_SOURCE_SNAPSHOT/work/apps-script/MarketRegime.gs', ['INVESTMENT_LOGIC_REVIEWER', 'ARCHITECTURE_REVIEWER']],
  ['docs only', 'docs/guide.md', ['DOCUMENTATION_REVIEWER', 'TEST_GENERATOR']],
  ['security', 'docs/security/policy.md', ['SECURITY_REVIEWER']],
  ['workflow', '.github/workflows/check.yml', ['ARCHITECTURE_REVIEWER', 'SECURITY_REVIEWER']],
  ['governance', 'architecture/agents/review-matrix.yaml', ['ARCHITECTURE_REVIEWER', 'SECURITY_REVIEWER']],
];

for (const [label, path, expected] of cases) {
  test(`matrix resolves ${label}`, () => {
    const result = resolveRequiredAgents({ changedPaths: [path], matrix });
    for (const id of expected) assert.ok(result.RequiredAgents.includes(id), `${label} missing ${id}`);
    assert.ok(result.RequiredAgents.includes('DOCUMENTATION_REVIEWER'));
    assert.ok(result.RequiredAgents.includes('TEST_GENERATOR'));
    assert.ok(result.RequiredControls.includes('privacy'));
  });
}

test('mixed changes union every matching rule', () => {
  const result = resolveRequiredAgents({
    changedPaths: ['docs/guide.md', 'IOS_SOURCE_SNAPSHOT/work/apps-script/BondEngine.gs'], matrix,
  });
  assert.equal(result.TaskType, 'mixed/unknown');
  assert.ok(result.RequiredAgents.includes('BOND_SPECIALIST'));
  assert.ok(result.RequiredAgents.includes('APPS_SCRIPT_REVIEWER'));
});

test('unknown paths fail closed with broad agent set', () => {
  const result = resolveRequiredAgents({ changedPaths: ['unclassified/file.weird'], matrix });
  assert.equal(result.FailClosed, true);
  assert.ok(result.RequiredAgents.length >= 9);
});
