#!/usr/bin/env node
import { resolve } from 'node:path';
import { activateFirstWave } from './activation-lib.mjs';

const rootIndex = process.argv.indexOf('--root');
const root = resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : resolve(import.meta.dirname, '../..'));
const result = activateFirstWave(root, { dryRun: process.argv.includes('--dry-run') });
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 2;
