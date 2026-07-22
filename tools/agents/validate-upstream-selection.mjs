#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ALLOWED = new Set(['SELECTED', 'UPSTREAM_PROFILE_NOT_FOUND', 'REQUIRES_OWNER_DECISION']);
const PINS = new Map([
  ['VoltAgent/awesome-codex-subagents', '5605c9c18b3687993919d6cc467af4a34898fee2'],
  ['wshobson/agents', 'b6af3711058190e4b5c5274b9758498fe626ec5a'],
]);

export function validateSelectionRegister(register) {
  const errors = [];
  if (register.schemaVersion !== '1.0.0') errors.push('unsupported schemaVersion');
  if (register.activationAllowed !== false) errors.push('activation must remain disabled');
  if (!Array.isArray(register.selections) || register.selections.length !== 44) errors.push('register must contain 44 IOS agents');
  const ids = new Set();
  for (const selection of register.selections || []) {
    if (!selection.agentId || ids.has(selection.agentId)) errors.push(`duplicate/missing agentId: ${selection.agentId || '<missing>'}`);
    ids.add(selection.agentId);
    if (!ALLOWED.has(selection.status)) errors.push(`${selection.agentId}: invalid status ${selection.status}`);
    const selected = selection.selectedProfiles || [];
    const candidates = selection.candidateProfiles || [];
    if (selection.status === 'SELECTED' && (!selected.length || candidates.length)) errors.push(`${selection.agentId}: invalid selected composition`);
    if (selection.status === 'REQUIRES_OWNER_DECISION' && (selected.length || !candidates.length)) errors.push(`${selection.agentId}: owner decision must expose candidates only`);
    if (selection.status === 'UPSTREAM_PROFILE_NOT_FOUND' && (selected.length || candidates.length)) errors.push(`${selection.agentId}: not-found row must not contain profiles`);
    for (const profile of [...selected, ...candidates]) {
      if (PINS.get(profile.repository) !== profile.commitSha) errors.push(`${selection.agentId}: unapproved repository/commit`);
      if (!profile.sourcePath || /^[A-Za-z]:|^\//.test(profile.sourcePath) || profile.sourcePath.includes('..')) errors.push(`${selection.agentId}: unsafe sourcePath`);
      if (!profile.profileId) errors.push(`${selection.agentId}: missing profileId`);
      if (!/^[0-9a-f]{64}$/.test(profile.rawSha256 || '') || !/^[0-9a-f]{64}$/.test(profile.normalizedSha256 || '')) errors.push(`${selection.agentId}: invalid hash`);
      if (profile.license !== 'MIT') errors.push(`${selection.agentId}: unexpected license`);
    }
  }
  const computed = Object.fromEntries([...ALLOWED].map((status) => [status, (register.selections || []).filter((item) => item.status === status).length]));
  for (const [status, count] of Object.entries(computed)) if (register.counts?.[status] !== count) errors.push(`count mismatch: ${status}`);
  return { ok: errors.length === 0, counts: computed, errors };
}

function main() {
  const path = resolve(process.argv[2] || 'architecture/agents/registry/upstream-selection-register.yaml');
  const result = validateSelectionRegister(JSON.parse(readFileSync(path, 'utf8')));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
