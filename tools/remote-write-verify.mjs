#!/usr/bin/env node
import {
  exitCodeFor, findCheckpoint, handleCliError, outputRussian, parseArgs, report,
  repoRoot, verifyCheckpoint,
} from './connection-recovery-lib.mjs';

try {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRoot();
  const checkpoint = verifyCheckpoint(root, findCheckpoint(root, args), args);
  outputRussian('POST-WRITE READ-ONLY VERIFICATION', {
    ...report(checkpoint),
    writeRetried: false,
    exitCodeTrustedAlone: false,
  });
  process.exitCode = exitCodeFor(checkpoint);
} catch (error) {
  handleCliError(error);
}
