import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateAgentIntegrityRegistry } from '../../tools/agents/validate-agent-integrity-registry.mjs';

const root = resolve(import.meta.dirname, '../..');

test('five canonical source-authored profiles pass integrity validation', () => {
  const result = validateAgentIntegrityRegistry(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.activationPerformed, false);
});

test('profile byte drift is rejected by the integrity registry', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'ios-integrity-'));
  cpSync(resolve(root, '.codex'), resolve(fixture, '.codex'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/registry'), resolve(fixture, 'architecture/agents/registry'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/schemas'), resolve(fixture, 'architecture/agents/schemas'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/contracts'), resolve(fixture, 'architecture/agents/contracts'), { recursive: true });
  const profile = resolve(fixture, '.codex/agents/ios-agent-orchestrator.toml');
  writeFileSync(profile, `${readFileSync(profile, 'utf8')}\n# drift\n`);
  const result = validateAgentIntegrityRegistry(fixture);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('ios-agent-orchestrator:PROFILE_SHA256_MISMATCH'));
});

function registryFixture(label) {
  const fixture = mkdtempSync(resolve(tmpdir(), `ios-${label}-`));
  cpSync(resolve(root, '.codex'), resolve(fixture, '.codex'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/registry'), resolve(fixture, 'architecture/agents/registry'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/schemas'), resolve(fixture, 'architecture/agents/schemas'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/contracts'), resolve(fixture, 'architecture/agents/contracts'), { recursive: true });
  return fixture;
}

test('READY status requires complete smoke evidence', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'ios-evidence-'));
  cpSync(resolve(root, '.codex'), resolve(fixture, '.codex'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/registry'), resolve(fixture, 'architecture/agents/registry'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/schemas'), resolve(fixture, 'architecture/agents/schemas'), { recursive: true });
  cpSync(resolve(root, 'architecture/agents/contracts'), resolve(fixture, 'architecture/agents/contracts'), { recursive: true });
  const path = resolve(fixture, 'architecture/agents/registry/agent-integrity-registry.yaml');
  const registry = JSON.parse(readFileSync(path, 'utf8'));
  registry.agents[0].status = 'READY';
  registry.agents[0].runtimeEvidencePath = null;
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
  const result = validateAgentIntegrityRegistry(fixture);
  assert.ok(result.errors.includes('ios-agent-orchestrator:READY_WITHOUT_SMOKE_EVIDENCE'));
});

for (const [label, profilePath, valid] of [
  ['canonical path', '.codex/agents/ios-agent-orchestrator.toml', true],
  ['forward traversal', '.codex/agents/../ios-agent-orchestrator.toml', false],
  ['backslash traversal', '.codex/agents/..\\ios-agent-orchestrator.toml', false],
  ['absolute path', 'C:\\temp\\ios-agent-orchestrator.toml', false],
  ['wrong filename', '.codex/agents/security-privacy-auditor.toml', false],
]) {
  test(`profile path validation rejects unsafe path: ${label}`, () => {
    const fixture = registryFixture(`path-${label.replaceAll(' ', '-')}`);
    const path = resolve(fixture, 'architecture/agents/registry/agent-integrity-registry.yaml');
    const registry = JSON.parse(readFileSync(path, 'utf8'));
    for (const agent of registry.agents) {
      agent.status = 'DRAFT';
      agent.runtimeEvidencePath = null;
      agent.lastVerifiedAt = null;
    }
    registry.agents[0].profilePath = profilePath;
    writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
    const result = validateAgentIntegrityRegistry(fixture);
    if (valid) {
      assert.equal(result.ok, true, result.errors.join('\n'));
    } else {
      assert.ok(result.errors.some((error) =>
        error.startsWith('ios-agent-orchestrator:PROFILE_PATH_MUST_EQUAL:')));
    }
  });
}
