#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OPERATION_TYPES, STATUSES, outputRussian, repoRoot } from './connection-recovery-lib.mjs';

const root = repoRoot();
const schema = JSON.parse(readFileSync(resolve(root, 'governance/connection-recovery/schema.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'governance/connection-recovery/operation-types.json'), 'utf8'));
const example = JSON.parse(readFileSync(resolve(root, 'governance/connection-recovery/templates/operation-checkpoint.example.json'), 'utf8'));
const required = new Set(schema.required || []);
const missing = [...required].filter((key) => !(key in example));
const schemaStatuses = schema.$defs?.status?.enum || [];
const schemaOperations = schema.properties?.operationType?.enum || [];
const errors = [];
if (missing.length) errors.push(`Example missing: ${missing.join(', ')}`);
if (JSON.stringify(schemaStatuses) !== JSON.stringify(STATUSES)) errors.push('Status enum расходится с runtime.');
if (JSON.stringify(schemaOperations.sort()) !== JSON.stringify(Object.keys(OPERATION_TYPES).sort())) errors.push('Operation enum расходится с runtime.');
if (JSON.stringify(Object.keys(manifest.operationTypes).sort()) !== JSON.stringify(Object.keys(OPERATION_TYPES).sort())) errors.push('operation-types.json расходится с runtime.');
if (!schema.$schema?.includes('2020-12')) errors.push('Требуется JSON Schema draft 2020-12.');
outputRussian(errors.length ? 'SCHEMA FAIL' : 'SCHEMA PASS', { ok: errors.length === 0, errors });
process.exitCode = errors.length ? 2 : 0;
