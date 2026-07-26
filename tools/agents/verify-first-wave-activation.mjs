#!/usr/bin/env node
import { resolve } from 'node:path';
import { FIRST_WAVE, listRuntimeProfiles, verifyActivationInputs } from './activation-lib.mjs';

const rootIndex = process.argv.indexOf('--root');
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : resolve(import.meta.dirname, '../..'));
const input = verifyActivationInputs(root);
const expected = FIRST_WAVE.map((id) => `${id}.toml`).sort();
const runtime = listRuntimeProfiles(root);
const exact = JSON.stringify(runtime) === JSON.stringify(expected);
const result = {
  ok: input.ok && exact,
  activationStatus: exact ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'NOT_DISPATCHED_ACTIVATION_CLOSED',
  runtimeDiscoveredPlatformAgents: runtime.length,
  runtimeProfiles: runtime,
  productionGovernanceEligible: false,
  errors: [...input.errors, ...(exact ? [] : ['RUNTIME_PROFILE_SET_NOT_EXACT'])],
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
