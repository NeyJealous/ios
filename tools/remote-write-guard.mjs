#!/usr/bin/env node
import {
  assertGuard, createOperation, findCheckpoint, handleCliError, outputRussian,
  parseArgs, repoRoot,
} from './connection-recovery-lib.mjs';

try {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRoot();
  let checkpoint;
  try { checkpoint = findCheckpoint(root, args); }
  catch (error) {
    if (error.exitCode === 3 && !args['operation-id']) checkpoint = createOperation(root, args);
    else throw error;
  }
  checkpoint = assertGuard(root, checkpoint, args);
  process.stdout.write([
    'REMOTE_WRITE_GUARD=PASS',
    `OPERATION_ID=${checkpoint.operationId}`,
    `TARGET=${checkpoint.targetSystem}`,
    `OPERATION=${checkpoint.operationType}`,
    `EXPECTED_POST_STATE=${checkpoint.expectedState}`,
    `PREVIEW=${checkpoint.safeNextStep}`,
  ].join('\n') + '\n');
  process.exitCode = 0;
} catch (error) {
  outputRussian('REMOTE_WRITE_GUARD=STOP', { reason: error.message, writeExecuted: false });
  handleCliError(error);
}
