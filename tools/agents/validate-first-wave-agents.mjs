#!/usr/bin/env node
import { resolve } from 'node:path';
import { validateAgentIntegrityRegistry } from './validate-agent-integrity-registry.mjs';
import { validateCapabilityEnvelopes } from './validate-capability-envelopes.mjs';
import { validateActivationBoundary } from './validate-activation-boundary.mjs';

const rootIndex = process.argv.indexOf('--root');
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.argv[2] || resolve(import.meta.dirname, '../..'));
const checks = {
  integrity: validateAgentIntegrityRegistry(root),
  capabilities: validateCapabilityEnvelopes(root),
  activationBoundary: validateActivationBoundary(root),
};
const ok = Object.values(checks).every((result) => result.ok);
console.log(JSON.stringify({
  schemaVersion: '2.0.0',
  ok,
  architecture: 'SOURCE_AUTHORED_CANONICAL_PROFILES',
  activationPerformed: false,
  checks,
}, null, 2));
process.exitCode = ok ? 0 : 2;
