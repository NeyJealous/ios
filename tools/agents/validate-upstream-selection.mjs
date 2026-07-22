#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

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
  for (const repository of register.repositories || []) {
    if (PINS.get(repository.repository) !== repository.commitSha) errors.push(`${repository.repository}: invalid repository pin`);
    if (repository.license !== 'MIT' || repository.licensePath !== 'LICENSE') errors.push(`${repository.repository}: invalid license declaration`);
    if (!/^[0-9a-f]{64}$/.test(repository.licenseRawSha256 || '') || !/^[0-9a-f]{64}$/.test(repository.licenseNormalizedSha256 || '')) errors.push(`${repository.repository}: invalid license hash`);
  }
  for (const selection of register.selections || []) {
    if (!selection.agentId || ids.has(selection.agentId)) errors.push(`duplicate/missing agentId: ${selection.agentId || '<missing>'}`);
    ids.add(selection.agentId);
    if (!ALLOWED.has(selection.status)) errors.push(`${selection.agentId}: invalid status ${selection.status}`);
    const selected = Array.isArray(selection.selectedProfiles) ? selection.selectedProfiles : [];
    const candidates = Array.isArray(selection.candidateProfiles) ? selection.candidateProfiles : [];
    if (!Array.isArray(selection.selectedProfiles) || !Array.isArray(selection.candidateProfiles)) errors.push(`${selection.agentId}: profile collections must be arrays`);
    if (selection.status === 'SELECTED' && (!selected.length || candidates.length)) errors.push(`${selection.agentId}: invalid selected composition`);
    if (selection.status === 'REQUIRES_OWNER_DECISION' && (selected.length || !candidates.length)) errors.push(`${selection.agentId}: owner decision must expose candidates only`);
    if (selection.status === 'UPSTREAM_PROFILE_NOT_FOUND' && (selected.length || candidates.length)) errors.push(`${selection.agentId}: not-found row must not contain profiles`);
    const rowPaths = new Set();
    const rowIds = new Set();
    for (const profile of [...selected, ...candidates]) {
      if (PINS.get(profile.repository) !== profile.commitSha) errors.push(`${selection.agentId}: unapproved repository/commit`);
      if (!profile.sourcePath || /^[A-Za-z]:|^\/|^\\|\\/.test(profile.sourcePath) || profile.sourcePath.split('/').includes('..')) errors.push(`${selection.agentId}: unsafe sourcePath`);
      if (!profile.profileId) errors.push(`${selection.agentId}: missing profileId`);
      if (!/^[0-9a-f]{64}$/.test(profile.rawSha256 || '') || !/^[0-9a-f]{64}$/.test(profile.normalizedSha256 || '')) errors.push(`${selection.agentId}: invalid hash`);
      if (profile.license !== 'MIT') errors.push(`${selection.agentId}: unexpected license`);
      const pathKey = `${profile.repository}:${profile.sourcePath}`;
      const idKey = `${profile.repository}:${profile.profileId}`;
      if (rowPaths.has(pathKey)) errors.push(`${selection.agentId}: duplicate profile path`);
      if (rowIds.has(idKey)) errors.push(`${selection.agentId}: duplicate profile ID`);
      rowPaths.add(pathKey);
      rowIds.add(idKey);
    }
  }
  const computed = Object.fromEntries([...ALLOWED].map((status) => [status, (register.selections || []).filter((item) => item.status === status).length]));
  for (const [status, count] of Object.entries(computed)) if (register.counts?.[status] !== count) errors.push(`count mismatch: ${status}`);
  return { ok: errors.length === 0, counts: computed, errors };
}

function git(root, args, encoding = 'utf8') {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', ...args], { cwd: root, encoding, shell: false });
  if (result.status !== 0) throw new Error(result.stderr?.toString() || `git ${args.join(' ')} failed`);
  return result.stdout;
}

function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function normalizedHash(bytes) { return hash(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n').normalize('NFC'), 'utf8')); }

export function verifySelectionSources(register, repositoryRoots) {
  const errors = [];
  const verified = new Set();
  const roots = new Map(Object.entries(repositoryRoots || {}));
  for (const repository of register.repositories || []) {
    const root = roots.get(repository.repository);
    if (!root) { errors.push(`${repository.repository}: source root required`); continue; }
    try {
      const resolvedCommit = git(root, ['rev-parse', `${repository.commitSha}^{commit}`]).trim();
      if (resolvedCommit !== repository.commitSha) errors.push(`${repository.repository}: pinned commit unavailable`);
      const licenseMode = git(root, ['ls-tree', repository.commitSha, '--', repository.licensePath]).trim().split(/\s+/)[0];
      if (licenseMode !== '100644' && licenseMode !== '100755') errors.push(`${repository.repository}: unsafe license object mode ${licenseMode || '<missing>'}`);
      const license = git(root, ['show', `${repository.commitSha}:${repository.licensePath}`], null);
      if (!license.toString('utf8').startsWith('MIT License')) errors.push(`${repository.repository}: license content mismatch`);
      if (hash(license) !== repository.licenseRawSha256 || normalizedHash(license) !== repository.licenseNormalizedSha256) errors.push(`${repository.repository}: license hash mismatch`);
    } catch (error) { errors.push(`${repository.repository}: ${error.message}`); }
  }
  for (const selection of register.selections || []) {
    for (const profile of [...(selection.selectedProfiles || []), ...(selection.candidateProfiles || [])]) {
      const key = `${profile.repository}:${profile.sourcePath}`;
      if (verified.has(key)) continue;
      verified.add(key);
      const root = roots.get(profile.repository);
      if (!root) continue;
      try {
        const mode = git(root, ['ls-tree', profile.commitSha, '--', profile.sourcePath]).trim().split(/\s+/)[0];
        if (mode !== '100644' && mode !== '100755') { errors.push(`${key}: unsafe or missing object mode ${mode || '<missing>'}`); continue; }
        const raw = git(root, ['show', `${profile.commitSha}:${profile.sourcePath}`], null);
        if (hash(raw) !== profile.rawSha256 || normalizedHash(raw) !== profile.normalizedSha256) errors.push(`${key}: content hash mismatch`);
        const text = raw.toString('utf8');
        const actualId = profile.sourcePath.endsWith('.toml') ? /^name\s*=\s*["']([^"']+)["']/m.exec(text)?.[1] : /^name:\s*(.+?)\s*$/m.exec(text)?.[1];
        if (actualId?.trim() !== profile.profileId) errors.push(`${key}: profile ID mismatch`);
      } catch (error) { errors.push(`${key}: ${error.message}`); }
    }
  }
  return { ok: errors.length === 0, verifiedProfiles: verified.size, errors };
}

function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((rows, item, index, all) => index % 2 === 0 ? [...rows, [item.replace(/^--/, ''), all[index + 1]]] : rows, []));
  const path = resolve(args.register || 'architecture/agents/registry/upstream-selection-register.yaml');
  const register = JSON.parse(readFileSync(path, 'utf8'));
  const structural = validateSelectionRegister(register);
  const source = verifySelectionSources(register, {
    'VoltAgent/awesome-codex-subagents': args['voltagent-root'],
    'wshobson/agents': args['wshobson-root'],
  });
  const result = { ok: structural.ok && source.ok, structural, source };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) main();
