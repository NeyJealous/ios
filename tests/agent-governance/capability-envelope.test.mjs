import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  FIRST_WAVE, validateCapabilityEnvelope, validateCapabilityEnvelopes,
} from '../../tools/agents/validate-capability-envelopes.mjs';

const root = resolve(import.meta.dirname, '../..');
const schema = JSON.parse(readFileSync(resolve(root, 'architecture/agents/schemas/capability-envelope.schema.json'), 'utf8'));
const envelope = (agentId) => JSON.parse(readFileSync(resolve(root, 'architecture/agents/contracts/capabilities', `${agentId}.json`), 'utf8'));

test('all first-wave capability envelopes are locally valid without runtime-enforcement claim', () => {
  const result = validateCapabilityEnvelopes(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.agents, 5);
  assert.equal(result.contractStatus, 'LOCALLY_VALIDATED');
  assert.equal(result.evidenceStatus, 'RUNTIME_ENFORCEMENT_UNVERIFIED');
});

test('network, MCP and write authority are denied by default', () => {
  for (const agentId of FIRST_WAVE) {
    const value = envelope(agentId);
    assert.equal(value.networkAccess, false);
    assert.equal(value.mcpAccess, false);
    assert.equal(value.filesystemWrite, false);
    assert.equal(value.productionWrite, false);
    assert.equal(value.sheetsWrite, false);
    assert.equal(value.appsScriptWrite, false);
    assert.equal(value.brokerApiWrite, false);
  }
});

test('every deny-by-default authority field rejects enablement', () => {
  const value = envelope('security-privacy-auditor');
  for (const field of [
    'filesystemWrite', 'networkAccess', 'mcpAccess', 'shellAccess', 'gitWrite',
    'remoteWrite', 'productionWrite', 'sheetsWrite', 'appsScriptWrite',
    'brokerApiWrite', 'deploy', 'merge', 'push',
  ]) {
    const errors = validateCapabilityEnvelope({ ...value, [field]: true }, schema, value.agentId);
    assert.ok(errors.some((error) => error.includes(field)), `${field} was accepted`);
  }
});

test('every mandatory denied tool and asserted runtime enforcement are rejected', () => {
  const value = envelope('agent-governance-auditor');
  for (const denial of [
    'network', 'mcp', 'shell', 'filesystem.write', 'git.write', 'remote.write',
    'production.write', 'sheets.write', 'apps-script.write', 'broker-api.write',
    'deploy', 'merge', 'push', 'secrets.modify', 'agent.install', 'agent.remove',
    'package.install', 'model.switch', 'model.fallback', 'model.override',
    'reasoning.override', 'model.escalation.spawn',
  ]) {
    const missing = { ...value, deniedTools: value.deniedTools.filter((item) => item !== denial) };
    assert.ok(validateCapabilityEnvelope(missing, schema, value.agentId).some((error) => error.includes(`DENIED_TOOL_MISSING:${denial}`)), `${denial} removal was accepted`);
  }
  assert.ok(validateCapabilityEnvelope({ ...value, evidenceStatus: 'RUNTIME_ENFORCED' }, schema, value.agentId).some((error) => error.includes('RUNTIME_ENFORCEMENT')));
});

test('orchestrator cannot install agents, packages or issue subject-matter writes', () => {
  const value = envelope('ios-agent-orchestrator');
  for (const denial of ['agent.install', 'agent.remove', 'package.install', 'subject-matter.write']) {
    assert.ok(value.deniedTools.includes(denial));
  }
});

test('canonical profiles use hash and deny-by-default enforcement layers', () => {
  for (const agentId of FIRST_WAVE) {
    const value = envelope(agentId);
    assert.ok(value.enforcementLayer.includes('CANONICAL_SOURCE_PROFILE_HASH'));
    assert.ok(value.enforcementLayer.includes('PROFILE_SANDBOX_READ_ONLY'));
    assert.ok(value.enforcementLayer.includes('CAPABILITY_CONTRACT_DENY_BY_DEFAULT'));
  }
});
