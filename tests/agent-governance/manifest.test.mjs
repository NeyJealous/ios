import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateManifest } from '../../tools/agent-governance-lib.mjs';

function run(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function commit(cwd, message) {
  run(cwd, 'add', '.');
  run(cwd, 'commit', '-m', message);
  return run(cwd, 'rev-parse', 'HEAD');
}

test('old agent manifest cannot pass in zero-agent transition and still rejects stale code tail', () => {
  const root = mkdtempSync(join(tmpdir(), 'ios-agent-manifest-'));
  try {
    run(root, 'init', '-b', 'main');
    run(root, 'config', 'user.name', 'Agent Governance Test');
    run(root, 'config', 'user.email', 'agent-governance@example.invalid');
    writeFileSync(join(root, 'README.md'), 'baseline\n');
    const base = commit(root, 'baseline');
    writeFileSync(join(root, 'feature.txt'), 'implementation\n');
    const reviewed = commit(root, 'implementation');

    const gate = 'TEST-GATE';
    const branch = 'task/test';
    const auditDir = join(root, 'audit', 'agents', gate);
    const reviewDir = join(root, 'docs', 'reviews', gate);
    mkdirSync(auditDir, { recursive: true });
    mkdirSync(reviewDir, { recursive: true });
    const agent = 'DOCUMENTATION_REVIEWER';
    const review = {
      AgentId: agent, AgentVersion: '1.0.0', GateId: gate, Branch: branch,
      CommitSHA: reviewed, ReviewScope: 'test', FilesReviewed: ['feature.txt'],
      SpecificationReferences: ['test requirement'], ChecksPerformed: ['static'],
      Findings: [], Severity: 'INFO', Evidence: ['test evidence'], RequiredFixes: [],
      ResidualRisk: 'none', Status: 'PASS', Timestamp: '2026-07-18T00:00:00Z',
      ExecutionMode: 'CODEX_ROLE_SIMULATION',
    };
    writeFileSync(join(auditDir, `${agent}.json`), `${JSON.stringify(review, null, 2)}\n`);
    writeFileSync(join(reviewDir, `${agent}.md`), '# Review\n');
    const manifest = {
      GateId: gate, TaskType: 'documentation only', Branch: branch,
      BaseSHA: base, HeadSHA: reviewed, ChangedPaths: ['feature.txt'],
      ApplicableAgents: [agent], RequiredAgents: [agent], ExecutedAgents: [agent],
      MissingAgents: [], BlockingFindings: [], Warnings: [],
      ArchitectureImpact: 'none', SecurityImpact: 'none', ProductionImpact: 'none',
      OwnerBypass: {
        ReviewMode: 'SOLO_MAINTAINER_OWNER_BYPASS',
        IndependentReviewer: 'NOT_AVAILABLE', CIEvidence: 'PASS',
        HumanAuthorization: 'received from repository owner', AuthorizedActor: 'owner',
        Reason: 'no other active authorized reviewer', Scope: 'APPROVAL_REQUIREMENT_ONLY',
        OtherProtectionsBypassed: false, ProductionDeploymentAuthorized: false,
        UnresolvedConversations: 0, Timestamp: '2026-07-18T00:00:00Z',
      },
      OverallStatus: 'PASS',
    };
    const manifestPath = join(auditDir, 'manifest.json');
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const attestedHead = commit(root, 'attestation');
    const required = { TaskType: 'documentation only', RequiredAgents: [agent], ApplicableAgents: [agent] };
    const oldManifestErrors = validateManifest({ manifestPath, required, root, branch, base, actualHead: attestedHead }).errors;
    assert.ok(oldManifestErrors.length > 0);
    assert.match(oldManifestErrors.join('\n'), /RequiredAgents|ApplicableAgents|ExecutedAgents|NOT_AVAILABLE|BLOCKED/i);

    manifest.OwnerBypass.ProductionDeploymentAuthorized = true;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    assert.match(validateManifest({ manifestPath, required, root, branch, base, actualHead: attestedHead }).errors.join('\n'), /production\/deployment cannot be authorized/);
    manifest.OwnerBypass.ProductionDeploymentAuthorized = false;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    writeFileSync(join(root, 'feature.txt'), 'changed after review\n');
    const staleHead = commit(root, 'unsafe tail');
    const errors = validateManifest({ manifestPath, required, root, branch, base, actualHead: staleHead }).errors.join('\n');
    assert.match(errors, /stale review/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
