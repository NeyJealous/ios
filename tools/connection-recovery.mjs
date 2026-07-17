#!/usr/bin/env node
import {
  closeCheckpoint, createOperation, exitCodeFor, findCheckpoint, handleCliError,
  listCheckpoints, outputRussian, parseArgs, report, repoRoot, resumePlan,
  saveCheckpoint, safeNextStep, supersedeCheckpoint, verifyCheckpoint,
} from './connection-recovery-lib.mjs';

const usage = `Использование:
  node tools/connection-recovery.mjs start|verify|classify|resume-plan|close|status
  обязательные для start: --operation --gate --branch --target
  для остальных: --operation-id либо полный набор обязательных аргументов
  дополнительные: --commit --pr --run-id --deployment-id --evidence-file`;

try {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const root = repoRoot();
  if (!['start', 'verify', 'classify', 'resume-plan', 'close', 'status'].includes(command)) throw Object.assign(new Error(usage), { exitCode: 3 });

  if (command === 'start') {
    const checkpoint = createOperation(root, args);
    outputRussian('CHECKPOINT СОЗДАН', report(checkpoint));
    process.exitCode = 0;
  } else if (command === 'status' && !args['operation-id'] && !args.operation) {
    const checkpoints = listCheckpoints(root).map(report);
    outputRussian('СТАТУС CONNECTION RECOVERY', checkpoints);
    process.exitCode = checkpoints.some((item) => item.recoveryStatus === 'UNKNOWN') ? 2 : 0;
  } else {
    let checkpoint = findCheckpoint(root, args);
    if (command === 'verify') checkpoint = verifyCheckpoint(root, checkpoint, args);
    if (command === 'classify') {
      checkpoint.safeNextStep = safeNextStep(checkpoint);
      saveCheckpoint(root, checkpoint);
    }
    if (command === 'resume-plan') outputRussian('ПЛАН БЕЗОПАСНОГО ВОЗОБНОВЛЕНИЯ', resumePlan(checkpoint));
    else if (command === 'close') {
      checkpoint = args.supersede ? supersedeCheckpoint(root, checkpoint, args) : closeCheckpoint(root, checkpoint);
      outputRussian('CHECKPOINT ЗАКРЫТ', report(checkpoint));
    } else outputRussian(command === 'status' ? 'СТАТУС ОПЕРАЦИИ' : 'РЕЗУЛЬТАТ КЛАССИФИКАЦИИ', report(checkpoint));
    process.exitCode = exitCodeFor(checkpoint);
  }
} catch (error) {
  handleCliError(error);
}
