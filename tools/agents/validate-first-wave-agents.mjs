#!/usr/bin/env node
import { resolve } from 'node:path';
import { validateFirstWave } from './first-wave-validation-lib.mjs';

const rootIndex = process.argv.indexOf('--root');
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : resolve(import.meta.dirname, '../..'));
const result = validateFirstWave(root);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
