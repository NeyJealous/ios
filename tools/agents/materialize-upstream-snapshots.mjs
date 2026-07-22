#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const FIRST_WAVE = new Set(['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor']);
const REPOSITORIES = {
  'VoltAgent/awesome-codex-subagents': { key: 'voltagent', commitSha: '5605c9c18b3687993919d6cc467af4a34898fee2' },
  'wshobson/agents': { key: 'wshobson', commitSha: 'b6af3711058190e4b5c5274b9758498fe626ec5a' },
};
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalizedSha = (bytes) => sha(Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n').normalize('NFC'), 'utf8'));

function args(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) result[argv[i].replace(/^--/, '')] = argv[i + 1];
  return result;
}
function safePath(path) {
  return typeof path === 'string' && !/^[A-Za-z]:|^[/\\]|\\/.test(path) && !path.split('/').includes('..');
}
function git(root, values, encoding = null) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', ...values], { cwd: root, encoding, shell: false });
  if (result.status !== 0) throw new Error(result.stderr?.toString() || `git ${values.join(' ')} failed`);
  return result.stdout;
}

const options = args(process.argv.slice(2));
const repoRoot = resolve(options.root || resolve(import.meta.dirname, '../..'));
const sourceRoots = {
  'VoltAgent/awesome-codex-subagents': resolve(options['voltagent-root']),
  'wshobson/agents': resolve(options['wshobson-root']),
};
const register = JSON.parse(readFileSync(resolve(repoRoot, 'architecture/agents/registry/upstream-selection-register.yaml'), 'utf8'));
const selections = register.selections.filter((row) => FIRST_WAVE.has(row.agentId));
if (selections.length !== FIRST_WAVE.size || selections.some((row) => row.status !== 'SELECTED')) throw new Error('FIRST_WAVE_SELECTION_NOT_COMPLETE');

const entries = [];
for (const [repository, descriptor] of Object.entries(REPOSITORIES)) {
  const sourceRoot = sourceRoots[repository];
  if (git(sourceRoot, ['rev-parse', 'HEAD'], 'utf8').trim() !== descriptor.commitSha) throw new Error(`${repository}: PIN_MISMATCH`);
  const licenseBytes = git(sourceRoot, ['show', `${descriptor.commitSha}:LICENSE`]);
  if (!licenseBytes.toString('utf8').startsWith('MIT License')) throw new Error(`${repository}: LICENSE_MISMATCH`);
  const licensePath = resolve(repoRoot, 'architecture/agents/upstream', descriptor.key, descriptor.commitSha, 'LICENSE');
  mkdirSync(dirname(licensePath), { recursive: true });
  writeFileSync(licensePath, licenseBytes);
}

const unique = new Map();
for (const selection of selections) for (const profile of selection.selectedProfiles) unique.set(`${profile.repository}:${profile.sourcePath}`, profile);
for (const profile of [...unique.values()].sort((a, b) => `${a.repository}:${a.sourcePath}`.localeCompare(`${b.repository}:${b.sourcePath}`))) {
  const descriptor = REPOSITORIES[profile.repository];
  if (!descriptor || profile.commitSha !== descriptor.commitSha || !safePath(profile.sourcePath)) throw new Error(`${profile.sourcePath}: UNSAFE_SELECTION`);
  const sourceRoot = sourceRoots[profile.repository];
  const mode = git(sourceRoot, ['ls-tree', profile.commitSha, '--', profile.sourcePath], 'utf8').trim().split(/\s+/)[0];
  if (!['100644', '100755'].includes(mode)) throw new Error(`${profile.sourcePath}: UNSAFE_OBJECT_MODE`);
  const bytes = git(sourceRoot, ['show', `${profile.commitSha}:${profile.sourcePath}`]);
  if (sha(bytes) !== profile.rawSha256 || normalizedSha(bytes) !== profile.normalizedSha256) throw new Error(`${profile.sourcePath}: HASH_MISMATCH`);
  const snapshotRelativePath = `architecture/agents/upstream/${descriptor.key}/${descriptor.commitSha}/${profile.sourcePath}`;
  const outputPath = resolve(repoRoot, ...snapshotRelativePath.split('/'));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  entries.push({ ...profile, snapshotPath: snapshotRelativePath, inclusionMode: 'FULL_UNMODIFIED', retrievedAt: '2026-07-22T00:00:00Z' });
}

const repositories = Object.entries(REPOSITORIES).map(([repository, descriptor]) => {
  const bytes = readFileSync(resolve(repoRoot, 'architecture/agents/upstream', descriptor.key, descriptor.commitSha, 'LICENSE'));
  return { repository, commitSha: descriptor.commitSha, snapshotRoot: `architecture/agents/upstream/${descriptor.key}/${descriptor.commitSha}`, license: 'MIT', licensePath: 'LICENSE', licenseRawSha256: sha(bytes), licenseNormalizedSha256: normalizedSha(bytes) };
});
const lock = { schemaVersion: '1.0.0', status: 'PROVISIONAL', activationAllowed: false, repositories, entries };
writeFileSync(resolve(repoRoot, 'architecture/agents/registry/upstream-lock.json'), `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ profiles: entries.length, repositories: repositories.length, status: lock.status }, null, 2));
