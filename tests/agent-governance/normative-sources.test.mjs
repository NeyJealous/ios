import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const register = JSON.parse(readFileSync(resolve(root, 'specification/NORMATIVE-SOURCE-REGISTER.json'), 'utf8'));

test('authoritative v4 and target v2.1 sources are versioned without machine paths', () => {
  const v4Root = resolve(root, register.authoritativeBaseline.repositoryRoot);
  const v21 = resolve(root, register.agentPlatformSpecification.repositoryPath);
  assert.equal(existsSync(resolve(v4Root, 'IOS_Master_Specification_v4.0_Audit_Baseline.md')), true);
  assert.equal(existsSync(resolve(v4Root, 'specification/v4.0/20_AGENT_GOVERNANCE.md')), true);
  assert.equal(existsSync(resolve(v4Root, 'specification/v4.0/26_RFC_ADR_GOVERNANCE.md')), true);
  assert.equal(existsSync(v21), true);
  assert.doesNotMatch(JSON.stringify(register), /[A-Za-z]:\\|\/Users\//);
});

test('versioned Agent Platform v2.1 source matches owner-provided SHA-256', () => {
  const bytes = readFileSync(resolve(root, register.agentPlatformSpecification.repositoryPath));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), register.agentPlatformSpecification.sha256);
});

test('RFC and ADR remain linked while ADR is not accepted', () => {
  const rfc = readFileSync(resolve(root, register.traceability.rfc), 'utf8');
  const adr = readFileSync(resolve(root, register.traceability.adr), 'utf8');
  assert.match(rfc, /NORMATIVE-SOURCE-REGISTER\.json/);
  assert.match(adr, /DRAFT_NOT_ACCEPTED/);
  assert.match(adr, /NORMATIVE-SOURCE-REGISTER\.json/);
});
