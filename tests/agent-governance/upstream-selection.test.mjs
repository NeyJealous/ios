import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { validateSelectionRegister } from '../../tools/agents/validate-upstream-selection.mjs';

const root = resolve(import.meta.dirname, '../..');
const register = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/upstream-selection-register.yaml'), 'utf8'));

test('upstream selection register contains exact pinned provenance for all 44 rows', () => {
  const result = validateSelectionRegister(register);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { SELECTED: 13, UPSTREAM_PROFILE_NOT_FOUND: 0, REQUIRES_OWNER_DECISION: 31 });
});

test('every formerly unresolved composition is explicitly owner-blocked without activation', () => {
  const blocked = register.selections.filter((selection) => selection.status === 'REQUIRES_OWNER_DECISION');
  assert.equal(blocked.length, 31);
  assert.equal(register.activationAllowed, false);
  assert.ok(blocked.every((selection) => selection.selectedProfiles.length === 0 && selection.candidateProfiles.length > 0));
});

test('duplicate upstream basenames retain distinct exact paths and profile IDs', () => {
  const qa = register.selections.find((selection) => selection.agentId === 'qa-expert');
  const testAutomators = qa.candidateProfiles.filter((profile) => profile.sourcePath.endsWith('/test-automator.md'));
  assert.ok(testAutomators.length > 1);
  assert.equal(new Set(testAutomators.map((profile) => profile.sourcePath)).size, testAutomators.length);
  assert.equal(new Set(testAutomators.map((profile) => profile.profileId)).size, testAutomators.length);
});

test('register contains no legacy unresolved status and no generated agent paths', () => {
  const text = JSON.stringify(register);
  assert.doesNotMatch(text, /"status":"UNRESOLVED"/);
  assert.doesNotMatch(text, /\.codex\/agents/);
});

test('selection validator fails closed on mutated pin and content hash', () => {
  const mutated = structuredClone(register);
  const selected = mutated.selections.find((selection) => selection.status === 'SELECTED');
  selected.selectedProfiles[0].commitSha = '0'.repeat(40);
  selected.selectedProfiles[1].rawSha256 = 'not-a-hash';
  const result = validateSelectionRegister(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('unapproved repository/commit')));
  assert.ok(result.errors.some((error) => error.includes('invalid hash')));
});

test('selection validator rejects Windows paths, duplicate profiles and malformed collections', () => {
  const mutated = structuredClone(register);
  const selected = mutated.selections.find((selection) => selection.status === 'SELECTED');
  selected.selectedProfiles[0].sourcePath = '\\\\server\\share\\profile.toml';
  selected.selectedProfiles.push(structuredClone(selected.selectedProfiles[1]));
  const ownerBlocked = mutated.selections.find((selection) => selection.status === 'REQUIRES_OWNER_DECISION');
  ownerBlocked.candidateProfiles = 'not-an-array';
  const result = validateSelectionRegister(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('unsafe sourcePath')));
  assert.ok(result.errors.some((error) => error.includes('duplicate profile path')));
  assert.ok(result.errors.some((error) => error.includes('profile collections must be arrays')));
});
