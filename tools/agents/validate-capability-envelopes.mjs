#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonSchema } from '../json-schema-validator.mjs';

export const FIRST_WAVE = [
  'ios-agent-orchestrator',
  'agent-governance-auditor',
  'security-privacy-auditor',
  'audit-traceability-reviewer',
  'ios-codebase-auditor',
];
const REQUIRED_DENIALS = [
  'network', 'mcp', 'shell', 'filesystem.write', 'git.write', 'remote.write',
  'production.write', 'sheets.write', 'apps-script.write', 'broker-api.write',
  'deploy', 'merge', 'push', 'secrets.modify', 'agent.install', 'agent.remove',
  'package.install',
];
const FALSE_FIELDS = [
  'filesystemWrite', 'networkAccess', 'mcpAccess', 'shellAccess', 'gitWrite',
  'remoteWrite', 'productionWrite', 'sheetsWrite', 'appsScriptWrite',
  'brokerApiWrite', 'deploy', 'merge', 'push',
];

export function validateCapabilityEnvelope(envelope, schema, expectedAgentId) {
  const errors = validateJsonSchema(envelope, schema, { path: '$' });
  if (envelope.agentId !== expectedAgentId) errors.push('AGENT_ID_MISMATCH');
  for (const field of FALSE_FIELDS) if (envelope[field] !== false) errors.push(`${field}:DENY_BY_DEFAULT_REQUIRED`);
  for (const denial of REQUIRED_DENIALS) if (!envelope.deniedTools?.includes(denial)) errors.push(`DENIED_TOOL_MISSING:${denial}`);
  if (envelope.evidenceStatus !== 'RUNTIME_ENFORCEMENT_UNVERIFIED') errors.push('RUNTIME_ENFORCEMENT_CLAIM_REJECTED');
  if (envelope.contractStatus !== 'LOCALLY_VALIDATED') errors.push('CONTRACT_STATUS_INVALID');
  if (!envelope.enforcementLayer?.includes('NON_DISCOVERY_STAGING_BOUNDARY')) errors.push('STAGING_BOUNDARY_LAYER_MISSING');
  if (!envelope.enforcementLayer?.includes('PROFILE_SANDBOX_READ_ONLY')) errors.push('READ_ONLY_SANDBOX_LAYER_MISSING');
  if (expectedAgentId === 'ios-agent-orchestrator') {
    for (const denial of ['agent.install', 'agent.remove', 'package.install', 'subject-matter.write']) {
      if (!envelope.deniedTools?.includes(denial)) errors.push(`ORCHESTRATOR_DENIAL_MISSING:${denial}`);
    }
  }
  return errors;
}

export function validateCapabilityEnvelopes(root) {
  const errors = [];
  const schemaPath = resolve(root, 'architecture/agents/schemas/capability-envelope.schema.json');
  const directory = resolve(root, 'architecture/agents/contracts/capabilities');
  try {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    if (lstatSync(schemaPath).isSymbolicLink() || lstatSync(directory).isSymbolicLink()) errors.push('CAPABILITY_SCHEMA_OR_DIRECTORY_SYMLINK');
    const actual = existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith('.json')).sort() : [];
    const expected = FIRST_WAVE.map((id) => `${id}.json`).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push('CAPABILITY_ENVELOPE_SET_INVALID');
    for (const agentId of FIRST_WAVE) {
      const path = resolve(directory, `${agentId}.json`);
      if (lstatSync(path).isSymbolicLink()) {
        errors.push(`${agentId}:SYMLINK_REJECTED`);
        continue;
      }
      const envelope = JSON.parse(readFileSync(path, 'utf8'));
      for (const error of validateCapabilityEnvelope(envelope, schema, agentId)) errors.push(`${agentId}:${error}`);
    }
  } catch (error) {
    errors.push(error.message);
  }
  return {
    ok: errors.length === 0,
    agents: FIRST_WAVE.length,
    contractStatus: errors.length ? 'INVALID' : 'LOCALLY_VALIDATED',
    evidenceStatus: 'RUNTIME_ENFORCEMENT_UNVERIFIED',
    errors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateCapabilityEnvelopes(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
