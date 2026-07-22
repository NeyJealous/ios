import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateGeneratedAgents } from '../../tools/agents/validate-generated-agents.mjs';
import { validateUpstreamIntegrity } from '../../tools/agents/validate-upstream-integrity.mjs';

const root = resolve(import.meta.dirname, '../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function copyPlatformFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'ios-first-wave-'));
  cpSync(resolve(root, 'architecture/agents'), resolve(fixture, 'architecture/agents'), { recursive: true });
  cpSync(resolve(root, '.codex/agents'), resolve(fixture, '.codex/agents'), { recursive: true });
  return fixture;
}

function walkFiles(directory, current = directory, files = []) {
  for (const item of readdirSync(current, { withFileTypes: true })) {
    const path = resolve(current, item.name);
    if (item.isDirectory()) walkFiles(directory, path, files);
    else files.push(path);
  }
  return files;
}

function treeHash(directory) {
  const entries = walkFiles(directory).sort().map((path) => `${relative(directory, path).replaceAll('\\', '/')}:${sha(readFileSync(path))}`);
  return sha(Buffer.from(entries.join('\n'), 'utf8'));
}

test('immutable upstream detects mutation, unexpected files and traversal locks', () => {
  const fixture = copyPlatformFixture();
  try {
    const snapshot = resolve(fixture, 'architecture/agents/upstream/voltagent/5605c9c18b3687993919d6cc467af4a34898fee2/categories/09-meta-orchestration/agent-organizer.toml');
    writeFileSync(snapshot, `${readFileSync(snapshot, 'utf8')}mutation\n`);
    assert.ok(validateUpstreamIntegrity(fixture).errors.some((error) => error.includes('UPSTREAM_BASE_MODIFIED')));
    cpSync(resolve(root, 'architecture/agents/upstream'), resolve(fixture, 'architecture/agents/upstream'), { recursive: true, force: true });
    writeFileSync(resolve(fixture, 'architecture/agents/upstream/unexpected.txt'), 'unexpected\n');
    assert.ok(validateUpstreamIntegrity(fixture).errors.some((error) => error.includes('UPSTREAM_UNEXPECTED_FILE')));
    rmSync(resolve(fixture, 'architecture/agents/upstream/unexpected.txt'));
    const lockPath = resolve(fixture, 'architecture/agents/registry/upstream-lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    lock.entries[0].snapshotPath = 'architecture/agents/upstream/../registry/upstream-lock.json';
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    assert.ok(validateUpstreamIntegrity(fixture).errors.some((error) => error.includes('SNAPSHOT_PATH_INVALID')));
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('upstream symlinks are rejected on a platform that can create the fixture', { skip: process.platform === 'win32' }, () => {
  const fixture = copyPlatformFixture();
  try {
    symlinkSync('/etc/hosts', resolve(fixture, 'architecture/agents/upstream/escape-link'));
    assert.ok(validateUpstreamIntegrity(fixture).errors.some((error) => error.includes('UPSTREAM_SYMLINK_REJECTED')));
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('append-only overlays, composition order and conflict contracts fail closed', () => {
  const fixture = copyPlatformFixture();
  try {
    const overlayPath = resolve(fixture, 'architecture/agents/overlays/ios-agent-orchestrator.yaml');
    const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
    overlay.remove = ['upstream responsibility'];
    writeFileSync(overlayPath, `${JSON.stringify(overlay)}\n`);
    assert.ok(validateGeneratedAgents(fixture).errors.some((error) => error.includes('OVERLAY_NOT_APPEND_ONLY')));
    cpSync(resolve(root, 'architecture/agents/overlays'), resolve(fixture, 'architecture/agents/overlays'), { recursive: true, force: true });
    const compositionPath = resolve(fixture, 'architecture/agents/compositions/ios-agent-orchestrator.yaml');
    const composition = JSON.parse(readFileSync(compositionPath, 'utf8'));
    composition.compositionOrder.reverse();
    composition.conflictResolution = [];
    writeFileSync(compositionPath, `${JSON.stringify(composition, null, 2)}\n`);
    const errors = validateGeneratedAgents(fixture).errors;
    assert.ok(errors.some((error) => error.includes('COMPOSITION_ORDER_MISMATCH')));
    assert.ok(errors.some((error) => error.includes('CONFLICT_RESOLUTION_MISSING')));
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('profile generation is deterministic and byte-reproducible', () => {
  const fixture = copyPlatformFixture();
  try {
    const script = resolve(root, 'tools/agents/compose-agents.mjs');
    const run = () => spawnSync(process.execPath, [script, '--root', fixture, '--generate-profiles'], { encoding: 'utf8' });
    const firstRun = run();
    assert.equal(firstRun.status, 0, firstRun.stderr || firstRun.stdout);
    const first = treeHash(resolve(fixture, '.codex/agents'));
    const firstCompositions = treeHash(resolve(fixture, 'architecture/agents/compositions'));
    const secondRun = run();
    assert.equal(secondRun.status, 0, secondRun.stderr || secondRun.stdout);
    assert.equal(treeHash(resolve(fixture, '.codex/agents')), first);
    assert.equal(treeHash(resolve(fixture, 'architecture/agents/compositions')), firstCompositions);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test('model registry uses only exact smoke-tested first-wave routes', () => {
  const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-registry.yaml'), 'utf8'));
  const availability = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8'));
  assert.equal(registry.agents.length, 5);
  assert.ok(registry.agents.every((contract) => contract.silentDowngradeAllowed === false));
  assert.equal(registry.lunaPolicy.spawnAgentAvailability, 'MODEL_NOT_AVAILABLE');
  assert.equal(registry.lunaPolicy.automaticDispatchEligible, false);
  for (const contract of registry.agents) {
    const runtime = availability.models.find((item) => item.requestedSlug === contract.primaryModel && item.requestedReasoningLevel === contract.primaryReasoning);
    assert.equal(runtime?.runtimeAvailability, 'RUNTIME_AVAILABLE', contract.agentId);
    assert.equal(runtime?.substitutionUsed, false, contract.agentId);
  }
  const ultra = availability.models.find((item) => item.modelId === 'sol-ultra');
  assert.equal(ultra.requestedSlug, 'gpt-5.6-sol');
  assert.equal(ultra.requestedReasoningLevel, 'ultra');
});

test('fresh checkout supports npm ci, offline bootstrap, checks and zero diff', { skip: process.env.IOS_CLEAN_CLONE_CHILD === '1' }, () => {
  const parent = mkdtempSync(join(tmpdir(), 'ios-clean-clone-parent-'));
  const clone = resolve(parent, 'checkout');
  try {
    let run = spawnSync('git', ['clone', '--no-local', root, clone], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const options = { cwd: clone, encoding: 'utf8', env: { ...process.env, IOS_CLEAN_CLONE_CHILD: '1', npm_config_ignore_scripts: 'true' } };
    const runNpm = (args) => process.platform === 'win32'
      ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], options)
      : spawnSync('npm', args, options);
    run = runNpm(['ci']);
    assert.equal(run.status, 0, run.stderr || run.stdout);
    run = runNpm(['run', 'agents:bootstrap']);
    assert.equal(run.status, 0, run.stderr || run.stdout);
    run = runNpm(['run', 'agents:check']);
    assert.equal(run.status, 0, run.stderr || run.stdout);
    run = spawnSync('git', ['diff', '--exit-code'], options);
    assert.equal(run.status, 0, run.stderr || run.stdout);
    assert.equal(lstatSync(resolve(clone, '.codex/agents')).isDirectory(), true);
  } finally { rmSync(parent, { recursive: true, force: true }); }
});
