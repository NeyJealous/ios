#!/usr/bin/env node
import { resolve } from 'node:path';
import { FIRST_WAVE, listRuntimeProfiles, verifyActivationInputs } from './activation-lib.mjs';
import { readFileSync } from 'node:fs';

const rootIndex = process.argv.indexOf('--root');
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : resolve(import.meta.dirname, '../..'));
const input = verifyActivationInputs(root);
const expected = FIRST_WAVE.map((id) => `${id}.toml`).sort();
const runtime = listRuntimeProfiles(root);
const exact = JSON.stringify(runtime) === JSON.stringify(expected);
const register = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/activation-register.json'), 'utf8'));
const configured = register.activationGate === 'CONFIGURED_RUNTIME_UNVERIFIED';
const result = {
  ok: input.ok && exact,
  activationStatus: exact
    ? configured
      ? 'FIRST_WAVE_IMPLEMENTED_AND_CONFIGURED_RUNTIME_UNVERIFIED'
      : 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT'
    : 'NOT_DISPATCHED_ACTIVATION_CLOSED',
  runtimeDiscoveredPlatformAgents: runtime.length,
  runtimeDiscoveryVerified: configured ? false : null,
  runtimeActivationComplete: configured ? false : null,
  runtimeProfiles: runtime,
  productionGovernanceEligible: false,
  errors: [...input.errors, ...(exact ? [] : ['RUNTIME_PROFILE_SET_NOT_EXACT'])],
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
