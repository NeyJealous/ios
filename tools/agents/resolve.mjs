#!/usr/bin/env node
import '../resolve-required-agents.mjs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const target = resolve(import.meta.dirname, '../resolve-required-agents.mjs');
const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exitCode = result.status ?? 2;
