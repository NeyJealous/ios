import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { validateInstructionHierarchy, validateProjectAgentFiles, readJsonCompatibleYaml } from '../../tools/agent-governance-lib.mjs';

const root = resolve(import.meta.dirname, '../..');

test('instruction hierarchy and project agent provenance pass', () => {
  assert.deepEqual(validateInstructionHierarchy(root), []);
  const registry = readJsonCompatibleYaml(resolve(root, 'architecture/agents/agent-registry.yaml'));
  assert.deepEqual(validateProjectAgentFiles(root, registry), []);
});

test('missing root and weakening scoped instruction are detected', () => {
  const temp = mkdtempSync(join(tmpdir(), 'ios-agent-instructions-'));
  try {
    assert.match(validateInstructionHierarchy(temp).join('\n'), /missing root/);
    writeFileSync(join(temp, 'AGENTS.md'), 'direct push Force push CODEX_ROLE_SIMULATION privacy/secret');
    for (const path of ['docs', 'tests', 'tools', 'architecture', 'research', 'specification', 'apps-script', 'IOS_HANDOFF_v4/master_specification', 'IOS_SOURCE_SNAPSHOT/work/apps-script']) {
      const dir = join(temp, ...path.split('/'));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'AGENTS.md'), 'Наследовать root.');
    }
    writeFileSync(join(temp, 'tools', 'AGENTS.md'), 'allow direct push');
    assert.match(validateInstructionHierarchy(temp).join('\n'), /weakens root/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('workflow is fork-safe, full-history, read-only and contains no production integration', () => {
  // Git may materialize this repository with CRLF on Windows and LF on Linux.
  // Normalize only the fixture text so the contract assertion is OS-independent.
  const workflow = readFileSync(resolve(root, '.github/workflows/agent-governance.yml'), 'utf8').replace(/\r\n/g, '\n');
  for (const required of ['pull_request:', 'workflow_dispatch:', 'fetch-depth: 0', 'persist-credentials: false', 'permissions:\n  contents: read']) {
    assert.ok(workflow.includes(required), `missing ${required}`);
  }
  for (const forbidden of ['OPENAI_API_KEY', 'clasp push', 'script.google.com', 'Google Sheets write', 'deploymentId']) {
    assert.equal(workflow.includes(forbidden), false, `workflow contains ${forbidden}`);
  }
});

test('governance checkouts are pinned to full SHAs', () => {
  for (const path of ['.github/workflows/agent-governance.yml', '.github/workflows/trusted-agent-governance.yml']) {
    const workflow = readFileSync(resolve(root, path), 'utf8').replace(/\r\n/g, '\n');
    const checkouts = workflow.match(/uses: actions\/checkout@[^\s]+/g) || [];
    assert.ok(checkouts.length > 0, `${path} has no checkout action`);
    for (const checkout of checkouts) assert.match(checkout, /@[0-9a-f]{40}$/i, `${path} checkout is not full-SHA pinned`);
  }
});

test('trusted pull_request_target workflow executes only the trusted-base validator', () => {
  const workflow = readFileSync(resolve(root, '.github/workflows/trusted-agent-governance.yml'), 'utf8').replace(/\r\n/g, '\n');
  for (const required of [
    'pull_request_target:',
    'ref: ${{ github.event.pull_request.base.sha }}',
    'path: trusted-base',
    'ref: ${{ github.event.pull_request.head.sha }}',
    'path: candidate',
    'node trusted-base/tools/trusted-governance/validate.mjs',
    'persist-credentials: false',
    'permissions:\n  contents: read',
  ]) assert.ok(workflow.includes(required), `trusted workflow missing ${required}`);
  for (const forbidden of [
    'node candidate/', 'npm --prefix candidate', 'candidate/tools/', 'clasp push', 'script.google.com',
  ]) assert.equal(workflow.includes(forbidden), false, `trusted workflow executes candidate/production code: ${forbidden}`);
});
