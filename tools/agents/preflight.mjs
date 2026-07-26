#!/usr/bin/env node
import { runCli } from './orchestrate.mjs';
try { runCli(process.argv.slice(2), 'PRE_CHANGE'); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
