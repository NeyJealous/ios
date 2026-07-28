#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonSchema } from '../json-schema-validator.mjs';

const FORBIDDEN_KEYS = new Set([
  'overlayPath', 'overlayHash', 'compositionPath', 'compositionHash',
  'upstreamCompositionHash', 'generatedPath', 'generatedHash',
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function topLevelString(text, key) {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"\\s*$`, 'm'));
  return match?.[1] ?? null;
}

function comments(text) {
  const result = {};
  for (const key of ['upstream_repository', 'upstream_path', 'upstream_commit', 'ios_profile_version']) {
    result[key] = text.match(new RegExp(`^#\\s*${key}\\s*=\\s*"([^"]+)"\\s*$`, 'm'))?.[1] ?? null;
  }
  return result;
}

function walkKeys(value, errors, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) errors.push(`${path}.${key}:LEGACY_KEY_FORBIDDEN`);
    walkKeys(child, errors, `${path}.${key}`);
  }
}

export function validateAgentIntegrityRegistry(root) {
  const errors = [];
  const registryPath = resolve(root, 'architecture/agents/registry/agent-integrity-registry.yaml');
  const schemaPath = resolve(root, 'architecture/agents/schemas/agent-integrity-registry.schema.json');
  try {
    if (lstatSync(registryPath).isSymbolicLink() || lstatSync(schemaPath).isSymbolicLink()) {
      errors.push('REGISTRY_OR_SCHEMA_SYMLINK_REJECTED');
    }
    const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    errors.push(...validateJsonSchema(registry, schema, { path: '$' }));
    walkKeys(registry, errors);
    const ids = new Set();
    const names = new Set();
    for (const entry of registry.agents || []) {
      if (ids.has(entry.agentId)) errors.push(`${entry.agentId}:DUPLICATE_AGENT_ID`);
      ids.add(entry.agentId);
      const expectedProfilePath = `.codex/agents/${entry.agentId}.toml`;
      if (entry.profilePath !== expectedProfilePath) {
        errors.push(`${entry.agentId}:PROFILE_PATH_MUST_EQUAL:${expectedProfilePath}`);
        continue;
      }
      const profile = resolve(root, entry.profilePath);
      if (!existsSync(profile)) {
        errors.push(`${entry.agentId}:PROFILE_MISSING`);
        continue;
      }
      if (lstatSync(profile).isSymbolicLink()) errors.push(`${entry.agentId}:PROFILE_SYMLINK_REJECTED`);
      const bytes = readFileSync(profile);
      const text = bytes.toString('utf8');
      const metadata = comments(text);
      const name = topLevelString(text, 'name');
      if (names.has(name)) errors.push(`${entry.agentId}:DUPLICATE_PROFILE_NAME`);
      names.add(name);
      if (name !== entry.agentId) errors.push(`${entry.agentId}:PROFILE_NAME_MISMATCH`);
      if (!topLevelString(text, 'description')) errors.push(`${entry.agentId}:DESCRIPTION_MISSING`);
      if (!text.match(/^developer_instructions\s*=\s*"""/m)) errors.push(`${entry.agentId}:DEVELOPER_INSTRUCTIONS_MISSING`);
      if (sha256(bytes) !== entry.profileSha256) errors.push(`${entry.agentId}:PROFILE_SHA256_MISMATCH`);
      if (topLevelString(text, 'model') !== entry.model) errors.push(`${entry.agentId}:MODEL_MISMATCH`);
      if (topLevelString(text, 'model_reasoning_effort') !== entry.reasoning) errors.push(`${entry.agentId}:REASONING_MISMATCH`);
      if (topLevelString(text, 'sandbox_mode') !== entry.sandboxMode) errors.push(`${entry.agentId}:SANDBOX_MISMATCH`);
      if (metadata.upstream_repository !== entry.upstream.repository ||
          metadata.upstream_path !== entry.upstream.path ||
          metadata.upstream_commit !== entry.upstream.commit ||
          metadata.ios_profile_version !== entry.profileVersion) {
        errors.push(`${entry.agentId}:PROVENANCE_MISMATCH`);
      }
      if (!existsSync(resolve(root, entry.capabilityContractPath))) errors.push(`${entry.agentId}:CAPABILITY_CONTRACT_MISSING`);
      const body = text.slice(text.indexOf('developer_instructions'));
      for (const [label, pattern] of [
        ['DIRECT_MODEL_SLUG', /gpt-5\.6-(?:sol|luna)/i],
        ['LEGACY_SOL_ROUTE', /\bSol\s+(?:High|Ultra|Max)\b/i],
        ['LEGACY_LUNA_ROUTE', /\bLuna\b/i],
        ['DIRECT_ESCALATION_APPROVAL', /APPROVE_SOL_/i],
      ]) if (pattern.test(body)) errors.push(`${entry.agentId}:${label}`);
      for (const field of [
        'escalation_status: ESCALATION_REQUIRED', 'reason', 'unresolved_questions',
        'evidence_collected', 'evidence_missing', 'risk_if_not_escalated',
        'recommended_escalation_class', 'owner_approval_required',
        'prohibited_next_actions',
      ]) if (!body.includes(field)) errors.push(`${entry.agentId}:ESCALATION_FIELD_MISSING:${field}`);
      if (entry.status === 'READY') {
        if (entry.discoveryStatus !== 'PASS' || entry.positiveSmokeStatus !== 'PASS' ||
            entry.negativeSmokeStatus !== 'PASS' || !entry.lastVerifiedAt ||
            !entry.runtimeEvidencePath || !existsSync(resolve(root, entry.runtimeEvidencePath))) {
          errors.push(`${entry.agentId}:READY_WITHOUT_SMOKE_EVIDENCE`);
        }
      }
    }
  } catch (error) {
    errors.push(error.message);
  }
  return {
    schemaVersion: '1.0.0',
    ok: errors.length === 0,
    status: errors.length ? 'FAIL' : 'PASS',
    activationPerformed: false,
    errors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateAgentIntegrityRegistry(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
