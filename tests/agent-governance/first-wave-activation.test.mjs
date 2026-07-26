import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  FIRST_WAVE, activateFirstWave, deactivateFirstWave, listRuntimeProfiles,
  verifyActivationInputs,
} from '../../tools/agents/activation-lib.mjs';
import { validateActivationBoundary } from '../../tools/agents/validate-activation-boundary.mjs';

const root = resolve(import.meta.dirname, '../..');
const expected = FIRST_WAVE.map((id) => `${id}.toml`).sort();

function clone() {
  const target = mkdtempSync(resolve(tmpdir(), 'ios-first-wave-activation-'));
  for (const path of ['architecture/agents', 'tools/agents']) cpSync(resolve(root, path), resolve(target, path), { recursive: true });
  mkdirSync(resolve(target, '.codex/agents'), { recursive: true });
  return target;
}

test('activation dry-run verifies exact approved inputs without discovery writes', () => {
  const target = clone();
  try {
    deactivateFirstWave(target);
    const before = listRuntimeProfiles(target);
    const result = activateFirstWave(target, { dryRun: true });
    assert.equal(result.ok, true);
    assert.deepEqual(before, []);
    assert.deepEqual(listRuntimeProfiles(target), []);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('activation is idempotent and discovers exactly five approved profiles', () => {
  const target = clone();
  try {
    deactivateFirstWave(target);
    assert.equal(activateFirstWave(target).ok, true);
    assert.equal(activateFirstWave(target).ok, true);
    assert.deepEqual(listRuntimeProfiles(target), expected);
    assert.equal(validateActivationBoundary(target).ok, true);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('rollback removes only approved profiles and restores fail-closed state', () => {
  const target = clone();
  try {
    deactivateFirstWave(target);
    assert.equal(activateFirstWave(target).ok, true);
    assert.equal(deactivateFirstWave(target).ok, true);
    assert.deepEqual(listRuntimeProfiles(target), []);
    const boundary = validateActivationBoundary(target);
    assert.equal(boundary.ok, true);
    assert.equal(boundary.runtimeDispatchStatus, 'NOT_DISPATCHED_ACTIVATION_CLOSED');
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('additional runtime profile blocks activation and rollback', () => {
  const target = clone();
  try {
    deactivateFirstWave(target);
    writeFileSync(resolve(target, '.codex/agents/unapproved.toml'), 'name=\"unapproved\"', 'utf8');
    assert.equal(activateFirstWave(target).ok, false);
    assert.equal(deactivateFirstWave(target).ok, false);
  } finally { rmSync(target, { recursive: true, force: true }); }
});

test('profile mutation and spoofed owner decision block activation', () => {
  const target = clone();
  try {
    deactivateFirstWave(target);
    const profile = resolve(target, 'architecture/agents/generated/provisional/ios-agent-orchestrator.toml');
    writeFileSync(profile, `${readFileSync(profile, 'utf8')}\n# mutation\n`, 'utf8');
    assert.ok(verifyActivationInputs(target).errors.includes('ios-agent-orchestrator:PROFILE_HASH_MISMATCH'));
    cpSync(resolve(root, 'architecture/agents/generated/provisional/ios-agent-orchestrator.toml'), profile);
    const manifestPath = resolve(target, 'architecture/agents/activation/first-wave-activation-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.ownerDecisionId = 'SPOOFED';
    writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
    assert.ok(verifyActivationInputs(target).errors.includes('OWNER_DECISION_INVALID'));
  } finally { rmSync(target, { recursive: true, force: true }); }
});
