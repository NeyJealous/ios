import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  loadFirstWaveFixtures,
  runFixtureValidation,
  validateFirstWave,
  validateFirstWaveStatic,
} from '../../tools/agents/first-wave-validation-lib.mjs';

const root = resolve(import.meta.dirname, '../..');
const firstWave = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor'];

test('all five static contracts are valid and remain outside runtime discovery', () => {
  const result = validateFirstWaveStatic(root);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.agents.map((agent) => agent.agentId), firstWave);
  assert.ok(result.agents.every((agent) => agent.executionMode === 'STATIC_VALIDATION'));
});

test('fixture packs contain seven required classes for each agent', () => {
  const fixtures = loadFirstWaveFixtures(root);
  assert.equal(fixtures.length, 35);
  for (const agentId of firstWave) {
    assert.deepEqual(fixtures.filter((item) => item.fixture.agentId === agentId).map((item) => item.kind).sort(),
      ['blocker', 'fail', 'forbidden-action', 'insufficient-evidence', 'pass', 'spoofed-evidence', 'stale-sha']);
  }
});

test('fixture harness matches every expected verdict and keeps Windows symlink explicit', () => {
  const result = runFixtureValidation(root, 'win32');
  assert.equal(result.ok, true, JSON.stringify(result.results.filter((item) => !item.matchesExpected)));
  assert.equal(result.total, 35);
  assert.equal(result.fail, 0);
  assert.equal(result.skip, 1);
  const symlink = result.results.find((item) => item.findings.includes('SYMLINK_ESCAPE'));
  assert.equal(symlink.verdict, 'SKIP');
});

test('Linux symlink fixture is a blocker rather than a pass', () => {
  const result = runFixtureValidation(root, 'linux');
  const symlink = result.results.find((item) => item.findings.includes('SYMLINK_ESCAPE'));
  assert.equal(symlink.verdict, 'BLOCKER');
  assert.equal(result.skip, 0);
});

test('profile mutation fails static contract and prevents fixture/runtime execution', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'ios-first-wave-profile-'));
  try {
    cpSync(resolve(root, 'architecture'), resolve(temporary, 'architecture'), { recursive: true });
    mkdirSync(resolve(temporary, '.codex/agents'), { recursive: true });
    const profile = resolve(temporary, 'architecture/agents/generated/provisional/ios-agent-orchestrator.toml');
    writeFileSync(profile, `${readFileSync(profile, 'utf8')}\n# mutation\n`);
    const result = validateFirstWaveStatic(temporary);
    assert.equal(result.ok, false);
    assert.ok(result.agents.find((agent) => agent.agentId === 'ios-agent-orchestrator').errors.includes('GENERATED:ios-agent-orchestrator:GENERATED_HASH_MISMATCH'));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('copying a provisional profile into discovery path is blocked', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'ios-first-wave-discovery-'));
  try {
    cpSync(resolve(root, 'architecture'), resolve(temporary, 'architecture'), { recursive: true });
    mkdirSync(resolve(temporary, '.codex/agents'), { recursive: true });
    cpSync(resolve(temporary, 'architecture/agents/generated/provisional/ios-codebase-auditor.toml'), resolve(temporary, '.codex/agents/ios-codebase-auditor.toml'));
    const result = validateFirstWaveStatic(temporary);
    assert.equal(result.ok, false);
    assert.ok(result.agents.every((agent) => agent.errors.some((error) => error.includes('RUNTIME_DISCOVERY_CONTAINS_PROVISIONAL_PROFILE'))));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('isolated runtime remains NOT_AVAILABLE without a trusted profile-bound invoker', () => {
  const result = validateFirstWave(root);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.activationBoundary.runtimeDiscoveredPlatformAgents, 0);
  assert.ok(result.runtime.every((item) => item.executionMode === 'NOT_AVAILABLE'));
  assert.ok(result.runtime.every((item) => item.status === 'RUNTIME_VALIDATION_NOT_AVAILABLE'));
  assert.ok(result.runtime.every((item) => item.resolvedModel === null && item.filesModified === 0));
  assert.ok(result.runtime.every((item) => item.canonicalDiscoveryTouched === false));
});
