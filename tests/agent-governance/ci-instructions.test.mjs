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
  const workflow = readFileSync(resolve(root, '.github/workflows/agent-governance.yml'), 'utf8');
  for (const required of ['pull_request:', 'workflow_dispatch:', 'fetch-depth: 0', 'persist-credentials: false', 'permissions:\n  contents: read']) {
    assert.ok(workflow.includes(required), `missing ${required}`);
  }
  for (const forbidden of ['OPENAI_API_KEY', 'clasp push', 'script.google.com', 'Google Sheets write', 'deploymentId']) {
    assert.equal(workflow.includes(forbidden), false, `workflow contains ${forbidden}`);
  }
});
