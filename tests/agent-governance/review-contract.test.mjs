import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReview } from '../../tools/agent-governance-lib.mjs';

const base = {
  AgentId: 'DOCUMENTATION_REVIEWER', AgentVersion: '1.0.0', GateId: 'GATE',
  Branch: 'task/example', CommitSHA: 'a'.repeat(40), ReviewScope: 'docs',
  FilesReviewed: ['docs/a.md'], SpecificationReferences: ['Master Specification 23'],
  ChecksPerformed: ['traceability'], Findings: [], Severity: 'INFO',
  Evidence: ['node --test: PASS'], RequiredFixes: [], ResidualRisk: 'None known.',
  Status: 'PASS', Timestamp: '2026-07-18T00:00:00Z', ExecutionMode: 'CODEX_ROLE_SIMULATION',
};

test('valid simulated review is accepted but remains explicitly simulated', () => {
  assert.deepEqual(validateReview(base), []);
  assert.equal(base.ExecutionMode, 'CODEX_ROLE_SIMULATION');
});

test('mandatory NOT_EXECUTED blocks', () => {
  assert.match(validateReview({ ...base, Status: 'NOT_EXECUTED' }).join('\n'), /NOT_EXECUTED/);
});

test('CRITICAL finding blocks even with PASS status', () => {
  const review = { ...base, Findings: [{ Severity: 'CRITICAL', Description: 'unsafe' }] };
  assert.match(validateReview(review).join('\n'), /blocking finding/);
});

test('NOT_APPLICABLE requires justification', () => {
  const review = { ...base, Status: 'NOT_APPLICABLE', Evidence: [], ResidualRisk: '' };
  assert.match(validateReview(review).join('\n'), /lacks justification/);
});

test('REAL_SUBAGENT cannot be fabricated without thread evidence', () => {
  const review = { ...base, ExecutionMode: 'REAL_SUBAGENT' };
  assert.match(validateReview(review).join('\n'), /AgentThreadId/);
  assert.deepEqual(validateReview({ ...review, Evidence: ['AgentThreadId=agent-123'] }), []);
});

test('wrong branch and gate are rejected', () => {
  const errors = validateReview(base, { Branch: 'other', GateId: 'OTHER' }).join('\n');
  assert.match(errors, /wrong Branch/);
  assert.match(errors, /wrong GateId/);
});
