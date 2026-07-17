#!/usr/bin/env node
import {
  findCheckpoint, handleCliError, listCheckpoints, nowIso, outputRussian,
  parseArgs, repoRoot, resumePlan, saveCheckpoint, verifyCheckpoint,
} from './connection-recovery-lib.mjs';

try {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRoot();
  let checkpoint;
  if (args['operation-id'] || args.operation) checkpoint = findCheckpoint(root, args);
  else {
    const active = listCheckpoints(root).filter((item) => !item.closedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    if (!active.length) throw Object.assign(new Error('Активная operation не найдена; retry запрещён до ручной проверки.'), { exitCode: 2 });
    checkpoint = active[0];
  }
  checkpoint.disconnectObserved = true;
  checkpoint.sanitizedNotes.push(`Disconnect обработан ${nowIso()}; автоматические retries остановлены.`);
  saveCheckpoint(root, checkpoint);
  checkpoint = verifyCheckpoint(root, checkpoint, args);
  outputRussian('DISCONNECT: АВТОМАТИЧЕСКИЙ RETRY ЗАПРЕЩЁН', resumePlan(checkpoint));
  process.exitCode = checkpoint.recoveryStatus === 'UNKNOWN' ? 2 : 0;
} catch (error) {
  handleCliError(error);
}
