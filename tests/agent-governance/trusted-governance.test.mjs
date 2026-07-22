import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { runNonAgentSafety } from '../../tools/non-agent-safety-validator.mjs';
import { validateTrusted } from '../../tools/trusted-governance/validate.mjs';

const sourceRoot = resolve(import.meta.dirname, '../..');

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function commit(cwd, message) {
  git(cwd, 'add', '.');
  git(cwd, 'commit', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

function copyFixtureFile(root, repoPath) {
  const destination = join(root, ...repoPath.split('/'));
  mkdirSync(resolve(destination, '..'), { recursive: true });
  copyFileSync(join(sourceRoot, ...repoPath.split('/')), destination);
}

function createTrustedFixture() {
  const root = mkdtempSync(join(tmpdir(), 'ios-trusted-governance-'));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Agent Governance Test');
  git(root, 'config', 'user.email', 'agent-governance@example.invalid');
  for (const path of [
    'architecture/agents/agent-registry.yaml',
    'architecture/agents/review-matrix.yaml',
    'architecture/agents/agent-registry.schema.json',
    'architecture/agents/review-matrix.schema.json',
    'architecture/agents/review-contract.schema.json',
    'architecture/agents/review-manifest.schema.json',
    'tools/trusted-governance/policy-floor.json',
    'tools/non-agent-safety-validator.mjs',
  ]) copyFixtureFile(root, path);
  const sha = commit(root, 'trusted base');
  return { root, sha };
}

function trustedOptions(trustedRoot, candidateRoot, baseSha, headSha) {
  return {
    'trusted-root': trustedRoot,
    'candidate-root': candidateRoot,
    'base-sha': baseSha,
    'head-sha': headSha,
    branch: 'feature/untrusted-candidate',
  };
}

const FAIL_CLOSED_AGENTS = [
  'ARCHITECTURE_REVIEWER', 'APPS_SCRIPT_REVIEWER', 'PERFORMANCE_AUDITOR',
  'INVESTMENT_LOGIC_REVIEWER', 'GOOGLE_SHEETS_REVIEWER', 'UX_REVIEWER',
  'DOCUMENTATION_REVIEWER', 'TEST_GENERATOR', 'SECURITY_REVIEWER',
];

function writeTrustedAttestation(candidate, {
  baseSha, reviewedSha, malformedAgent, executionMode = 'CODEX_ROLE_SIMULATION',
}) {
  const gate = 'TRUSTED-FIXTURE';
  const branch = 'feature/untrusted-candidate';
  const auditDir = join(candidate, 'audit', 'agents', gate);
  const reviewDir = join(candidate, 'docs', 'reviews', gate);
  mkdirSync(auditDir, { recursive: true });
  mkdirSync(reviewDir, { recursive: true });
  for (const agent of FAIL_CLOSED_AGENTS) {
    const review = {
      AgentId: agent, AgentVersion: '1.0.0', GateId: gate, Branch: branch,
      CommitSHA: reviewedSha, ReviewScope: 'fixture', FilesReviewed: ['docs/candidate.md'],
      SpecificationReferences: ['Master Specification 24'], ChecksPerformed: ['fixture'],
      Findings: [], Severity: 'INFO', Evidence: executionMode === 'REAL_SUBAGENT'
        ? [`AgentThreadId=fixture-${agent}`] : ['fixture evidence'], RequiredFixes: [],
      ResidualRisk: 'fixture', Status: 'PASS', Timestamp: '2026-07-18T00:00:00Z',
      ExecutionMode: executionMode,
    };
    if (agent === malformedAgent) review.FilesReviewed = 'not-an-array';
    writeFileSync(join(auditDir, `${agent}.json`), `${JSON.stringify(review, null, 2)}\n`);
    writeFileSync(join(reviewDir, `${agent}.md`), '# Fixture review\n');
  }
  const manifest = {
    GateId: gate, TaskType: 'mixed/unknown', Branch: branch, BaseSHA: baseSha, HeadSHA: reviewedSha,
    ChangedPaths: ['docs/candidate.md'], ApplicableAgents: FAIL_CLOSED_AGENTS,
    RequiredAgents: FAIL_CLOSED_AGENTS, ExecutedAgents: FAIL_CLOSED_AGENTS,
    MissingAgents: [], BlockingFindings: [], Warnings: [], ArchitectureImpact: 'none',
    SecurityImpact: 'none', ProductionImpact: 'none', OverallStatus: 'PASS',
  };
  writeFileSync(join(auditDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

test('non-agent safety validator passes its mixed known/unknown fail-closed probe deterministically', () => {
  const first = runNonAgentSafety(sourceRoot);
  const second = runNonAgentSafety(sourceRoot);
  assert.equal(first.OverallStatus, 'PASS', first.errors.join('\n'));
  assert.deepEqual(second, first);
  assert.equal(first.ActiveAgentDependency, false);
  assert.equal(first.ProductionWrites, 0);
});

test('trusted validator ignores a candidate that self-weakens its local validator and blocks missing evidence', () => {
  const fixture = createTrustedFixture();
  const candidate = `${fixture.root}-candidate`;
  try {
    git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
    git(candidate, 'config', 'user.name', 'Agent Governance Test');
    git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
    writeFileSync(join(candidate, 'tools', 'non-agent-safety-validator.mjs'), 'process.exit(0);\n');
    const candidateSha = commit(candidate, 'candidate weakens local validator');

    const options = trustedOptions(fixture.root, candidate, fixture.sha, candidateSha);
    const first = validateTrusted(options);
    const second = validateTrusted(options);
    assert.equal(first.OverallStatus, 'BLOCKED');
    assert.ok(first.IntegrityErrors.some((error) => error.startsWith('Trusted manifest validation failed:')));
    assert.deepEqual(second, first);
    assert.equal(first.TrustRootChanged, false);
  } finally {
    rmSync(candidate, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('trusted validator blocks legacy manifest evidence while provisional activation is closed', () => {
  const fixture = createTrustedFixture();
  const candidate = `${fixture.root}-candidate`;
  try {
    git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
    git(candidate, 'config', 'user.name', 'Agent Governance Test');
    git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
    mkdirSync(join(candidate, 'docs'), { recursive: true });
    writeFileSync(join(candidate, 'docs', 'candidate.md'), 'candidate change\n');
    const reviewedSha = commit(candidate, 'candidate implementation');
    writeTrustedAttestation(candidate, {
      baseSha: fixture.sha, reviewedSha, malformedAgent: 'DOCUMENTATION_REVIEWER',
    });
    const candidateSha = commit(candidate, 'candidate malformed attestation');

    const result = validateTrusted(trustedOptions(fixture.root, candidate, fixture.sha, candidateSha));
    assert.equal(result.OverallStatus, 'BLOCKED');
    assert.ok(result.IntegrityErrors.includes('PROVISIONAL_PLATFORM_ACTIVATION_CLOSED'));
    assert.notEqual(result.IntegrityStatus, 'PASS');
  } finally {
    rmSync(candidate, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('trusted verifier is BLOCKED in provisional state even with fabricated legacy REAL_SUBAGENT evidence', () => {
  const fixture = createTrustedFixture();
  const candidate = `${fixture.root}-candidate`;
  try {
    git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
    git(candidate, 'config', 'user.name', 'Agent Governance Test');
    git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
    mkdirSync(join(candidate, 'docs'), { recursive: true });
    writeFileSync(join(candidate, 'docs', 'candidate.md'), 'candidate change\n');
    const reviewedSha = commit(candidate, 'candidate implementation');
    writeTrustedAttestation(candidate, {
      baseSha: fixture.sha, reviewedSha, executionMode: 'REAL_SUBAGENT',
    });
    const candidateSha = commit(candidate, 'candidate real-subagent attestation');

    const result = validateTrusted(trustedOptions(fixture.root, candidate, fixture.sha, candidateSha));
    assert.equal(result.OverallStatus, 'BLOCKED');
    assert.equal(result.AttestationStatus, 'INSUFFICIENT_EVIDENCE');
    assert.ok(result.AttestationErrors.includes('TRUSTED_EXECUTION_ATTESTATION_INSUFFICIENT_EVIDENCE'));
    assert.equal(result.TrustRootChanged, false);
    assert.ok(result.IntegrityErrors.includes('PROVISIONAL_PLATFORM_ACTIVATION_CLOSED'));
  } finally {
    rmSync(candidate, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('trusted verifier remains BLOCKED in provisional state with simulated legacy reports', () => {
  const fixture = createTrustedFixture();
  const candidate = `${fixture.root}-candidate`;
  try {
    git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
    git(candidate, 'config', 'user.name', 'Agent Governance Test');
    git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
    mkdirSync(join(candidate, 'docs'), { recursive: true });
    writeFileSync(join(candidate, 'docs', 'candidate.md'), 'candidate change\n');
    const reviewedSha = commit(candidate, 'candidate implementation');
    writeTrustedAttestation(candidate, { baseSha: fixture.sha, reviewedSha });
    const candidateSha = commit(candidate, 'candidate simulated attestation');

    const result = validateTrusted(trustedOptions(fixture.root, candidate, fixture.sha, candidateSha));
    assert.equal(result.OverallStatus, 'BLOCKED');
    assert.ok(result.IntegrityErrors.includes('PROVISIONAL_PLATFORM_ACTIVATION_CLOSED'));
  } finally {
    rmSync(candidate, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('trusted validator requires an owner gate for every trust-root modification', () => {
  const paths = [
    '.github/workflows/trusted-agent-governance.yml',
    'tools/trusted-governance/policy-floor.json',
    'tools/json-schema-validator.mjs',
    'tools/agent-governance-lib.mjs',
    'architecture/agents/review-contract.schema.json',
    'architecture/agents/schemas/execution-attestation.schema.json',
    'specification/NORMATIVE-SOURCE-REGISTER.json',
    'specification/IOS_Master_Specification_v4.0_Package/specification/v4.0/20_AGENT_GOVERNANCE.md',
  ];
  for (const path of paths) {
    const fixture = createTrustedFixture();
    const candidate = `${fixture.root}-candidate`;
    try {
      git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
      git(candidate, 'config', 'user.name', 'Agent Governance Test');
      git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
      const target = join(candidate, ...path.split('/'));
      mkdirSync(resolve(target, '..'), { recursive: true });
      writeFileSync(target, `${path.endsWith('.json') ? '{}' : '// candidate trust-root modification'}\n`);
      const candidateSha = commit(candidate, `candidate changes ${path}`);
      const result = validateTrusted(trustedOptions(fixture.root, candidate, fixture.sha, candidateSha));
      assert.equal(result.OverallStatus, 'BLOCKED', path);
      assert.equal(result.TrustRootChanged, true, path);
      assert.ok(result.IntegrityErrors.includes('TRUST_ROOT_CHANGE_REQUIRES_OWNER_GATE'), path);
    } finally {
      rmSync(candidate, { recursive: true, force: true });
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test('trusted validator rejects malformed and mismatched SHA inputs before candidate evidence is trusted', () => {
  const fixture = createTrustedFixture();
  const candidate = `${fixture.root}-candidate`;
  try {
    assert.throws(() => validateTrusted(trustedOptions(fixture.root, fixture.root, 'short', fixture.sha)), /exact 40-hex SHAs/);
    git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
    git(candidate, 'config', 'user.name', 'Agent Governance Test');
    git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
    writeFileSync(join(candidate, 'candidate-change.txt'), 'changed\n');
    const candidateSha = commit(candidate, 'candidate change');
    const result = validateTrusted(trustedOptions(fixture.root, candidate, '0'.repeat(40), candidateSha));
    assert.equal(result.OverallStatus, 'BLOCKED');
    assert.ok(result.IntegrityErrors.includes('Trusted checkout does not match base SHA'));
  } finally {
    rmSync(candidate, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('trusted validator fail-closes on symlink and submodule index modes without following filesystem links', () => {
  for (const mode of ['120000', '160000']) {
    const fixture = createTrustedFixture();
    const candidate = `${fixture.root}-candidate`;
    try {
      git(resolve(fixture.root, '..'), 'clone', '--no-local', fixture.root, candidate);
      git(candidate, 'config', 'user.name', 'Agent Governance Test');
      git(candidate, 'config', 'user.email', 'agent-governance@example.invalid');
      writeFileSync(join(candidate, 'link-target.txt'), 'target\n');
      const object = mode === '120000'
        ? git(candidate, 'hash-object', '-w', 'link-target.txt')
        : git(candidate, 'rev-parse', 'HEAD');
      git(candidate, 'update-index', '--add', '--cacheinfo', `${mode},${object},AGENTS.md`);
      git(candidate, 'commit', '-m', `candidate adds unsafe ${mode} mode`);
      const candidateSha = git(candidate, 'rev-parse', 'HEAD');
      assert.throws(
        () => validateTrusted(trustedOptions(fixture.root, candidate, fixture.sha, candidateSha)),
        /Symlink\/submodule forbidden/,
      );
    } finally {
      rmSync(candidate, { recursive: true, force: true });
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});
