#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalizedSha = (bytes) => sha(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n').normalize('NFC'), 'utf8'));
const normalize = (path) => path.replaceAll('\\', '/');
function walk(root, current = root, files = []) {
  for (const item of readdirSync(current, { withFileTypes: true })) {
    const path = resolve(current, item.name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`UPSTREAM_SYMLINK_REJECTED:${normalize(relative(root, path))}`);
    if (stat.isDirectory()) walk(root, path, files);
    else if (stat.isFile()) files.push(normalize(relative(root, path)));
    else throw new Error(`UPSTREAM_UNSAFE_FILE_TYPE:${normalize(relative(root, path))}`);
  }
  return files;
}

export function validateUpstreamIntegrity(root) {
  const errors = [];
  try {
    const lock = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/upstream-lock.json'), 'utf8'));
    if (lock.status !== 'PROVISIONAL' || lock.activationAllowed !== false) errors.push('UPSTREAM_LOCK_ACTIVATION_INVALID');
    const expected = new Set();
    for (const repository of lock.repositories || []) {
      if (!/^[0-9a-f]{40}$/.test(repository.commitSha || '') || repository.license !== 'MIT') errors.push(`${repository.repository}:LOCK_INVALID`);
      const path = resolve(root, ...`${repository.snapshotRoot}/${repository.licensePath}`.split('/'));
      const bytes = readFileSync(path);
      expected.add(normalize(relative(resolve(root, 'architecture/agents/upstream'), path)));
      if (!bytes.toString('utf8').startsWith('MIT License')) errors.push(`${repository.repository}:LICENSE_CONTENT_MISMATCH`);
      if (sha(bytes) !== repository.licenseRawSha256 || normalizedSha(bytes) !== repository.licenseNormalizedSha256) errors.push(`${repository.repository}:LICENSE_HASH_MISMATCH`);
    }
    const keys = new Set();
    for (const entry of lock.entries || []) {
      if (entry.inclusionMode !== 'FULL_UNMODIFIED' || !entry.snapshotPath?.startsWith('architecture/agents/upstream/') || entry.snapshotPath.includes('..') || entry.snapshotPath.includes('\\')) errors.push(`${entry.profileId}:SNAPSHOT_PATH_INVALID`);
      const key = `${entry.repository}:${entry.sourcePath}`;
      if (keys.has(key)) errors.push(`${key}:DUPLICATE_LOCK_ENTRY`);
      keys.add(key);
      const path = resolve(root, ...entry.snapshotPath.split('/'));
      const bytes = readFileSync(path);
      expected.add(normalize(relative(resolve(root, 'architecture/agents/upstream'), path)));
      if (sha(bytes) !== entry.rawSha256) errors.push(`${key}:UPSTREAM_BASE_MODIFIED`);
      if (normalizedSha(bytes) !== entry.normalizedSha256) errors.push(`${key}:UPSTREAM_NORMALIZED_HASH_MISMATCH`);
    }
    const actual = new Set(walk(resolve(root, 'architecture/agents/upstream')));
    for (const path of actual) if (!expected.has(path)) errors.push(`${path}:UPSTREAM_UNEXPECTED_FILE`);
    for (const path of expected) if (!actual.has(path)) errors.push(`${path}:UPSTREAM_MISSING_FILE`);
    return { ok: errors.length === 0, entries: lock.entries?.length || 0, files: actual.size, errors };
  } catch (error) {
    errors.push(error.message);
    return { ok: false, entries: 0, files: 0, errors };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateUpstreamIntegrity(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
