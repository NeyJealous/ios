import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const workflow = readFileSync(resolve(root, '.github/workflows/trusted-agent-governance.yml'), 'utf8').replace(/\r\n/g, '\n');

test('trusted workflow executes verifier and regression tests only from exact PR base checkout', () => {
  assert.match(workflow, /pull_request_target:/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(workflow, /path: trusted-base/);
  assert.match(workflow, /node trusted-base\/tools\/trusted-governance\/validate\.mjs/);
  assert.match(workflow, /node --test trusted-base\/tests\/agent-governance\/\*\.test\.mjs/);
  assert.doesNotMatch(workflow, /node candidate\//);
  assert.doesNotMatch(workflow, /npm (?:ci|install)/);
});

test('candidate checkout is exact head data with credentials disabled', () => {
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /path: candidate/);
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
});

test('trusted workflow is read-only and action references are full commit SHAs', () => {
  assert.match(workflow, /permissions:\n  contents: read/);
  for (const line of workflow.split('\n').filter((value) => value.trim().startsWith('uses:'))) assert.match(line, /@[0-9a-f]{40}$/);
});
