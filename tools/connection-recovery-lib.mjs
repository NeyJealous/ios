import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export const STATUSES = Object.freeze([
  'NOT_STARTED', 'LOCAL_ONLY', 'PUSH_COMPLETED', 'PR_CREATED', 'MERGED',
  'REMOTE_APPLY_COMPLETED', 'UNKNOWN',
]);

export const OPERATION_TYPES = Object.freeze({
  GIT_PUSH: ['PUSH_COMPLETED', 'git'],
  PR_CREATE: ['PR_CREATED', 'github-pr'],
  PR_UPDATE: ['PR_CREATED', 'github-pr'],
  PR_MERGE: ['MERGED', 'github-pr'],
  GH_WORKFLOW_DISPATCH: ['REMOTE_APPLY_COMPLETED', 'github-run'],
  CLASP_PUSH: ['REMOTE_APPLY_COMPLETED', 'apps-script'],
  APPS_SCRIPT_DEPLOY: ['REMOTE_APPLY_COMPLETED', 'apps-script'],
  GOOGLE_SHEETS_WRITE: ['REMOTE_APPLY_COMPLETED', 'evidence'],
  BROKER_API_WRITE: ['REMOTE_APPLY_COMPLETED', 'evidence'],
  ICEPANEL_IMPORT: ['REMOTE_APPLY_COMPLETED', 'evidence'],
  ICEPANEL_SNAPSHOT: ['REMOTE_APPLY_COMPLETED', 'evidence'],
  GENERIC_REMOTE_WRITE: ['REMOTE_APPLY_COMPLETED', 'evidence'],
});

const ORDER = new Map(STATUSES.slice(0, -1).map((status, index) => [status, index]));
const FORBIDDEN_RETRIES = Object.freeze({
  GIT_PUSH: 'git push', PR_CREATE: 'gh pr create', PR_UPDATE: 'повторное обновление PR',
  PR_MERGE: 'gh pr merge', GH_WORKFLOW_DISPATCH: 'workflow dispatch',
  CLASP_PUSH: 'clasp push', APPS_SCRIPT_DEPLOY: 'deployment',
  GOOGLE_SHEETS_WRITE: 'Google Sheets write', BROKER_API_WRITE: 'broker/API write',
  ICEPANEL_IMPORT: 'IcePanel import', ICEPANEL_SNAPSHOT: 'IcePanel snapshot',
  GENERIC_REMOTE_WRITE: 'remote write',
});

export class RecoveryError extends Error {
  constructor(message, exitCode = 3) {
    super(message);
    this.exitCode = exitCode;
  }
}

export function nowIso() {
  return process.env.CRP_NOW || new Date().toISOString();
}

export function sanitizeText(input) {
  let value = String(input ?? '');
  value = value.replace(/(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi, '$1[REDACTED]@');
  value = value.replace(/\b(Authorization\s*[:=]\s*)(?:Bearer\s+|Basic\s+)?[^\s,;]+/gi, '$1[REDACTED]');
  value = value.replace(/\b(Cookie|Set-Cookie)\s*[:=]\s*[^\r\n]+/gi, '$1: [REDACTED]');
  value = value.replace(/\b(gh[opusr]_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,}|ya29\.[A-Za-z0-9_-]+)/g, '[REDACTED_TOKEN]');
  value = value.replace(/\b((?:account.?id|account_id|id\s+сч[её]та)\s*[:=]?\s*)["']?[0-9]{8,}["']?/gi, '$1[REDACTED_ACCOUNT_ID]');
  value = value.replace(/\b((?:script.?id|script_id)\s*[:=]?\s*)["']?[A-Za-z0-9_-]{20,}["']?/gi, '$1[REDACTED_SCRIPT_ID]');
  value = value.replace(/\b(refresh_token|access_token|client_secret)\b\s*[:=]\s*["']?[^\s,"']+/gi, '$1=[REDACTED]');
  value = value.replace(/[A-Za-z]:[\\/]Users[\\/][^\\/\s"']+/gi, '[LOCAL_USER_PATH]');
  return value;
}

export function sanitize(value) {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      if (/token|cookie|credential|authorization|secret|private.?payload/i.test(key)) {
        return [key, '[REDACTED]'];
      }
      return [key, sanitize(item)];
    }));
  }
  return value;
}

export function stableJson(value) {
  const sort = (item) => {
    if (Array.isArray(item)) return item.map(sort);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, sort(item[key])]));
    }
    return item;
  };
  return `${JSON.stringify(sort(sanitize(value)), null, 2)}\n`;
}

export function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) { result._.push(token); continue; }
    const key = token.slice(2);
    if (!key) throw new RecoveryError('Пустой аргумент.', 3);
    if (index + 1 < argv.length && !argv[index + 1].startsWith('--')) result[key] = argv[++index];
    else result[key] = true;
  }
  return result;
}

export function repoRoot(cwd = process.cwd()) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', windowsHide: true }).trim();
  } catch {
    throw new RecoveryError('Текущий каталог не является Git worktree.', 3);
  }
}

export function checkpointDir(root = repoRoot()) {
  return join(root, '.audit', 'connection-recovery');
}

export function atomicWriteJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(temp, stableJson(value), { encoding: 'utf8', flag: 'wx' });
    renameSync(temp, path);
  } finally {
    if (existsSync(temp)) rmSync(temp, { force: true });
  }
}

export function checkpointPath(root, operationId) {
  if (!/^crp-[a-z0-9-]{12,96}$/.test(operationId)) throw new RecoveryError('Некорректный operationId.', 3);
  return join(checkpointDir(root), `${operationId}.json`);
}

export function loadCheckpoint(root, operationId) {
  const path = checkpointPath(root, operationId);
  if (!existsSync(path)) throw new RecoveryError(`Checkpoint не найден: ${operationId}`, 3);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function saveCheckpoint(root, checkpoint) {
  const clean = sanitize(checkpoint);
  atomicWriteJson(checkpointPath(root, clean.operationId), clean);
  return clean;
}

export function listCheckpoints(root) {
  const dir = checkpointDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => /^crp-.*\.json$/.test(name)).sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')));
}

export function requireOperationArgs(args) {
  for (const key of ['operation', 'gate', 'branch', 'target']) {
    if (!args[key] || args[key] === true) throw new RecoveryError(`Требуется --${key}.`, 3);
  }
  if (!OPERATION_TYPES[args.operation]) throw new RecoveryError(`Недопустимый operation type: ${args.operation}`, 3);
}

function git(root, args, allowFailure = false) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const timedOut = error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM';
    throw new RecoveryError(timedOut ? 'Git read-only проверка завершилась timeout.' : 'Git read-only проверка не выполнена.', 2);
  }
}

export function worktreeSnapshot(root) {
  const status = git(root, ['status', '--short', '--branch']);
  const lines = status.split(/\r?\n/);
  const dirty = lines.slice(1).some((line) => line.trim());
  return {
    branch: git(root, ['branch', '--show-current']),
    head: git(root, ['rev-parse', 'HEAD']),
    status: sanitizeText(status),
    log: sanitizeText(git(root, ['log', '-n', '10', '--decorate', '--oneline'])),
    detached: !git(root, ['symbolic-ref', '-q', '--short', 'HEAD'], true),
    dirty,
  };
}

export function createOperation(root, args) {
  requireOperationArgs(args);
  const snapshot = worktreeSnapshot(root);
  const startedAt = nowIso();
  const seed = [args.operation, args.gate, args.branch, args.target, args.commit || snapshot.head, startedAt].join('|');
  const suffix = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  const date = startedAt.replace(/[^0-9]/g, '').slice(0, 14);
  const operationId = args['operation-id'] || `crp-${date}-${args.operation.toLowerCase().replaceAll('_', '-')}-${suffix}`;
  const existing = listCheckpoints(root).filter((item) => !item.closedAt && item.operationType === args.operation && item.targetRef === args.target);
  if (existing.length) throw new RecoveryError(`Обнаружена незакрытая операция того же типа/target: ${existing[0].operationId}`, existing.some((x) => x.recoveryStatus === 'UNKNOWN') ? 2 : 1);
  const [expectedState] = OPERATION_TYPES[args.operation];
  const localCommitSha = args.commit || (snapshot.head || null);
  const checkpoint = {
    schemaVersion: 1,
    operationId,
    operationType: args.operation,
    gate: args.gate,
    branch: args.branch,
    baselineSha: git(root, ['merge-base', 'HEAD', 'origin/integration/ios-current'], true) || null,
    localCommitSha,
    targetSystem: args.target,
    targetRef: args.target,
    startedAt,
    lastVerifiedAt: null,
    expectedState,
    observedState: localCommitSha ? 'LOCAL_ONLY' : 'NOT_STARTED',
    recoveryStatus: localCommitSha ? 'LOCAL_ONLY' : 'NOT_STARTED',
    idempotencyKey: args['idempotency-key'] || null,
    verificationCommands: verificationCommands(args.operation, args),
    safeNextStep: 'Выполнить pre-write guard; без PASS внешняя запись запрещена.',
    evidence: [],
    errorClass: null,
    disconnectObserved: false,
    userApprovalRequired: true,
    sanitizedNotes: args.note ? [sanitizeText(args.note)] : [],
    verificationHistory: [],
    closedAt: null,
  };
  saveCheckpoint(root, checkpoint);
  return checkpoint;
}

export function verificationCommands(operationType, args = {}) {
  if (operationType === 'GIT_PUSH') return [
    'git status --short --branch', 'git log -n 10 --decorate --oneline',
    'git rev-parse HEAD', `git ls-remote --heads origin refs/heads/${args.branch || '<branch>'}`,
  ];
  if (operationType.startsWith('PR_')) return [
    'gh pr list --state all --limit 50',
    `gh pr view ${args.pr || '<number>'} --json number,state,isDraft,mergeStateStatus,headRefName,baseRefName,url,mergeCommit`,
  ];
  if (operationType === 'GH_WORKFLOW_DISPATCH') return [
    'gh run list --limit 50',
    `gh run view ${args['run-id'] || '<run-id>'} --json status,conclusion,url,headSha,event`,
  ];
  if (operationType === 'CLASP_PUSH' || operationType === 'APPS_SCRIPT_DEPLOY') {
    return ['clasp status', 'read-only deployment list/status or project metadata get'];
  }
  return ['documented read-only GET/status/list endpoint; otherwise UNKNOWN'];
}

export function transitionAllowed(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
  if (to === 'UNKNOWN') return true;
  if (from === 'UNKNOWN') return true;
  return ORDER.get(to) >= ORDER.get(from);
}

export function classifyEvidence(operationType, evidence = {}) {
  if (evidence.errorClass || evidence.timeout || evidence.unavailable || evidence.conflict || evidence.stale) {
    return { status: 'UNKNOWN', errorClass: evidence.errorClass || (evidence.stale ? 'STALE_EVIDENCE' : evidence.conflict ? 'CONFLICTING_EVIDENCE' : 'REMOTE_STATUS_UNAVAILABLE') };
  }
  if (operationType === 'GIT_PUSH') {
    if (!evidence.localSha) return { status: 'NOT_STARTED', errorClass: null };
    if (!evidence.remoteSha) return { status: 'LOCAL_ONLY', errorClass: null };
    if (evidence.localSha === evidence.remoteSha) return { status: 'PUSH_COMPLETED', errorClass: null };
    return { status: 'UNKNOWN', errorClass: 'REMOTE_SHA_MISMATCH' };
  }
  if (operationType.startsWith('PR_')) {
    const matches = evidence.matches || [];
    if (matches.length > 1) return { status: 'UNKNOWN', errorClass: 'DUPLICATE_PR_AMBIGUITY' };
    if (matches.length === 0) return { status: evidence.remoteBranchConfirmed ? 'PUSH_COMPLETED' : 'LOCAL_ONLY', errorClass: null };
    const pr = matches[0];
    if (pr.state === 'MERGED' && pr.mergeCommit) return { status: 'MERGED', errorClass: null };
    if (pr.state === 'OPEN' || pr.state === 'CLOSED') return { status: 'PR_CREATED', errorClass: null };
    return { status: 'UNKNOWN', errorClass: 'CONFLICTING_PR_EVIDENCE' };
  }
  if (operationType === 'GH_WORKFLOW_DISPATCH') {
    if (evidence.status === 'completed' && evidence.conclusion === 'success') return { status: 'REMOTE_APPLY_COMPLETED', errorClass: null };
    return { status: 'UNKNOWN', errorClass: 'WORKFLOW_NOT_PROVED_COMPLETE' };
  }
  if (evidence.status === 'completed' && evidence.targetConfirmed === true) return { status: 'REMOTE_APPLY_COMPLETED', errorClass: null };
  return { status: 'UNKNOWN', errorClass: evidence.status ? 'REMOTE_APPLY_NOT_PROVED' : 'MISSING_EVIDENCE' };
}

function ghExecutable() {
  if (process.env.GH_PATH) return process.env.GH_PATH;
  if (process.platform === 'win32') {
    const candidates = [
      process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'gh.exe'),
      process.env.ProgramFiles && join(process.env.ProgramFiles, 'GitHub CLI', 'gh.exe'),
    ].filter(Boolean);
    for (const candidate of candidates) if (existsSync(candidate)) return candidate;
    const packages = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
    if (packages && existsSync(packages)) {
      const packageDir = readdirSync(packages).find((name) => name.startsWith('GitHub.cli_'));
      if (packageDir) {
        const candidate = join(packages, packageDir, 'bin', 'gh.exe');
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return process.platform === 'win32' ? 'gh.exe' : 'gh';
}

function gh(root, args) {
  try {
    return execFileSync(ghExecutable(), args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
  } catch (error) {
    return { errorClass: error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'GITHUB_STATUS_UNAVAILABLE' };
  }
}

export function collectEvidence(root, checkpoint, args = {}) {
  if (args['evidence-file']) {
    const raw = JSON.parse(readFileSync(resolve(root, args['evidence-file']), 'utf8'));
    const maxAge = Number(process.env.CRP_MAX_EVIDENCE_AGE_MS || 900000);
    if (raw.observedAt && Date.parse(nowIso()) - Date.parse(raw.observedAt) > maxAge) raw.stale = true;
    return sanitize(raw);
  }
  if (checkpoint.operationType === 'GIT_PUSH') {
    const localSha = git(root, ['rev-parse', checkpoint.localCommitSha || 'HEAD']);
    try {
      const output = execFileSync('git', ['ls-remote', '--heads', 'origin', `refs/heads/${checkpoint.branch}`], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
      const remoteSha = output ? output.split(/\s+/)[0] : null;
      return { kind: 'git', localSha, remoteSha, observedAt: nowIso() };
    } catch (error) {
      return { kind: 'git', localSha, remoteSha: null, observedAt: nowIso(), errorClass: error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'REMOTE_STATUS_UNAVAILABLE' };
    }
  }
  if (checkpoint.operationType.startsWith('PR_')) {
    const raw = gh(root, ['pr', 'list', '--state', 'all', '--limit', '50', '--head', checkpoint.branch, '--json', 'number,state,isDraft,mergeStateStatus,headRefName,baseRefName,url,mergeCommit']);
    if (typeof raw !== 'string') return raw;
    const matches = JSON.parse(raw).filter((pr) => !args.base || pr.baseRefName === args.base);
    return { kind: 'github-pr', matches, remoteBranchConfirmed: true, observedAt: nowIso() };
  }
  if (checkpoint.operationType === 'GH_WORKFLOW_DISPATCH' && (args['run-id'] || checkpoint.runId)) {
    const raw = gh(root, ['run', 'view', String(args['run-id'] || checkpoint.runId), '--json', 'status,conclusion,url,headSha,event']);
    return typeof raw === 'string' ? { kind: 'github-run', ...JSON.parse(raw), observedAt: nowIso() } : raw;
  }
  if (checkpoint.operationType === 'CLASP_PUSH' || checkpoint.operationType === 'APPS_SCRIPT_DEPLOY') {
    try {
      const output = execFileSync('clasp', ['status'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
      return { kind: 'apps-script', claspStatus: sanitizeText(output), observedAt: nowIso(), unavailable: true, errorClass: 'REMOTE_APPLY_STATUS_EVIDENCE_REQUIRED' };
    } catch {
      return { kind: 'apps-script', unavailable: true, errorClass: 'REMOTE_STATUS_UNAVAILABLE', observedAt: nowIso() };
    }
  }
  return { kind: 'generic', unavailable: true, errorClass: 'READ_ONLY_STATUS_ENDPOINT_REQUIRED', observedAt: nowIso() };
}

export function verifyCheckpoint(root, checkpoint, args = {}) {
  const evidence = collectEvidence(root, checkpoint, args);
  const result = classifyEvidence(checkpoint.operationType, evidence);
  if (!transitionAllowed(checkpoint.recoveryStatus, result.status)) {
    result.status = 'UNKNOWN';
    result.errorClass = 'INVALID_STATE_TRANSITION';
  }
  const verifiedAt = nowIso();
  checkpoint.lastVerifiedAt = verifiedAt;
  checkpoint.observedState = result.status;
  checkpoint.recoveryStatus = result.status;
  checkpoint.errorClass = result.errorClass;
  checkpoint.userApprovalRequired = result.status !== checkpoint.expectedState;
  checkpoint.evidence.push(sanitize(evidence));
  checkpoint.verificationHistory.push({ verifiedAt, status: result.status, errorClass: result.errorClass });
  checkpoint.safeNextStep = safeNextStep(checkpoint);
  saveCheckpoint(root, checkpoint);
  return checkpoint;
}

export function safeNextStep(checkpoint) {
  if (checkpoint.recoveryStatus === 'UNKNOWN') return 'ОСТАНОВИТЬСЯ. Не повторять write; выполнить ручную read-only проверку и запросить решение пользователя.';
  if (checkpoint.recoveryStatus === checkpoint.expectedState) return 'Доказанное post-state достигнуто; закрыть checkpoint после проверки evidence.';
  if (checkpoint.recoveryStatus === 'LOCAL_ONLY') return 'После отдельного разрешения выполнить предусмотренную write-операцию ровно один раз, затем read-only verify.';
  if (checkpoint.recoveryStatus === 'PUSH_COMPLETED') return 'Read-only проверить существующий PR; создавать PR только при однозначном отсутствии.';
  if (checkpoint.recoveryStatus === 'PR_CREATED') return 'Не выполнять merge без отдельного разрешения; сначала проверить актуальное состояние PR.';
  return 'Выполнить первый подтверждённо незавершённый идемпотентный шаг после gate approval.';
}

export function resumePlan(checkpoint) {
  const completed = [];
  if (ORDER.has(checkpoint.recoveryStatus)) {
    for (const [status, rank] of ORDER.entries()) if (rank <= ORDER.get(checkpoint.recoveryStatus) && status !== 'NOT_STARTED') completed.push(status);
  }
  return sanitize({
    operationId: checkpoint.operationId,
    recoveryStatus: checkpoint.recoveryStatus,
    provedCompleted: completed,
    notProved: checkpoint.recoveryStatus === 'UNKNOWN' ? [checkpoint.expectedState] : checkpoint.recoveryStatus === checkpoint.expectedState ? [] : [checkpoint.expectedState],
    firstSafeIncompleteStep: checkpoint.safeNextStep,
    userApprovalRequired: checkpoint.userApprovalRequired || checkpoint.recoveryStatus === 'UNKNOWN',
    forbiddenRetries: [FORBIDDEN_RETRIES[checkpoint.operationType]],
  });
}

export function assertGuard(root, checkpoint, args = {}) {
  const snapshot = worktreeSnapshot(root);
  if (snapshot.dirty) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: worktree dirty.', 1);
  if (snapshot.detached || snapshot.branch !== checkpoint.branch) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: unexpected/detached branch.', 1);
  const unknown = listCheckpoints(root).find((item) => !item.closedAt && item.operationType === checkpoint.operationType && item.recoveryStatus === 'UNKNOWN');
  if (unknown) throw new RecoveryError(`REMOTE_WRITE_GUARD=UNKNOWN: ${unknown.operationId}`, 2);
  if (!args.approved) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: требуется явный --approved для gate.', 1);
  if (checkpoint.operationType === 'GIT_PUSH' && checkpoint.localCommitSha !== snapshot.head) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: commit SHA не совпадает с HEAD.', 1);
  if (!checkpoint.targetSystem || !checkpoint.targetRef) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: target не определён.', 1);
  if (checkpoint.operationType.includes('WRITE') && !checkpoint.idempotencyKey) throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: target не поддерживает/не получил idempotency key.', 1);
  if (checkpoint.operationType === 'GIT_PUSH') {
    const evidence = collectEvidence(root, checkpoint, args);
    if (evidence.remoteSha && evidence.localSha && evidence.remoteSha !== evidence.localSha) {
      let remoteIsAncestor = false;
      try {
        execFileSync('git', ['merge-base', '--is-ancestor', evidence.remoteSha, evidence.localSha], {
          cwd: root, windowsHide: true, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        remoteIsAncestor = true;
      } catch {
        remoteIsAncestor = false;
      }
      const verifiedAt = nowIso();
      checkpoint.lastVerifiedAt = verifiedAt;
      checkpoint.evidence.push(sanitize({ ...evidence, remoteIsAncestor }));
      if (remoteIsAncestor) {
        checkpoint.observedState = 'LOCAL_ONLY';
        checkpoint.recoveryStatus = 'LOCAL_ONLY';
        checkpoint.errorClass = null;
        checkpoint.verificationHistory.push({ verifiedAt, status: 'LOCAL_ONLY', errorClass: null, remoteIsAncestor: true });
        checkpoint.safeNextStep = 'Доказан fast-forward: remote SHA является предком exact local SHA; разрешена одна guarded update write.';
        saveCheckpoint(root, checkpoint);
      } else {
        checkpoint.observedState = 'UNKNOWN';
        checkpoint.recoveryStatus = 'UNKNOWN';
        checkpoint.errorClass = 'REMOTE_SHA_DIVERGENCE';
        checkpoint.userApprovalRequired = true;
        checkpoint.verificationHistory.push({ verifiedAt, status: 'UNKNOWN', errorClass: checkpoint.errorClass });
        checkpoint.safeNextStep = safeNextStep(checkpoint);
        saveCheckpoint(root, checkpoint);
        throw new RecoveryError('REMOTE_WRITE_GUARD=UNKNOWN: remote SHA не является предком local SHA.', 2);
      }
    } else {
      checkpoint = verifyCheckpoint(root, checkpoint, args);
    }
    if (checkpoint.recoveryStatus === 'UNKNOWN') throw new RecoveryError(`REMOTE_WRITE_GUARD=UNKNOWN: ${checkpoint.errorClass}`, 2);
    if (checkpoint.recoveryStatus === checkpoint.expectedState) throw new RecoveryError(`REMOTE_WRITE_GUARD=FAIL: expected state ${checkpoint.expectedState} уже доказан; duplicate write запрещена.`, 1);
  }
  if (['PR_CREATE', 'PR_MERGE'].includes(checkpoint.operationType)) {
    checkpoint = verifyCheckpoint(root, checkpoint, args);
    if (checkpoint.recoveryStatus === 'UNKNOWN') throw new RecoveryError(`REMOTE_WRITE_GUARD=UNKNOWN: ${checkpoint.errorClass}`, 2);
    if (checkpoint.recoveryStatus === checkpoint.expectedState) throw new RecoveryError(`REMOTE_WRITE_GUARD=FAIL: expected state ${checkpoint.expectedState} уже доказан; duplicate write запрещена.`, 1);
    if (checkpoint.operationType === 'PR_MERGE' && checkpoint.recoveryStatus !== 'PR_CREATED') throw new RecoveryError('REMOTE_WRITE_GUARD=FAIL: единственный PR перед merge не доказан.', 1);
  }
  checkpoint.userApprovalRequired = false;
  checkpoint.safeNextStep = 'Разрешена ровно одна показанная write-операция; затем обязательный post-write verify без retry.';
  saveCheckpoint(root, checkpoint);
  return checkpoint;
}

export function closeCheckpoint(root, checkpoint) {
  if (checkpoint.recoveryStatus === 'UNKNOWN') throw new RecoveryError('UNKNOWN checkpoint закрывать запрещено.', 2);
  if (checkpoint.recoveryStatus !== checkpoint.expectedState) throw new RecoveryError('Expected post-state не доказан; checkpoint не закрыт.', 1);
  checkpoint.closedAt = nowIso();
  checkpoint.safeNextStep = 'Операция доказана и checkpoint закрыт.';
  return saveCheckpoint(root, checkpoint);
}

export function supersedeCheckpoint(root, checkpoint, args = {}) {
  if (!args.approved) throw new RecoveryError('SUPERSEDE=FAIL: требуется явный --approved.', 1);
  if (!args.reason || args.reason === true || sanitizeText(args.reason).trim().length < 8) throw new RecoveryError('SUPERSEDE=FAIL: требуется санитизированный --reason.', 3);
  if (!args['superseded-by'] || args['superseded-by'] === true) throw new RecoveryError('SUPERSEDE=FAIL: требуется --superseded-by.', 3);
  if (checkpoint.closedAt) throw new RecoveryError('SUPERSEDE=FAIL: checkpoint уже закрыт.', 1);
  if (!['NOT_STARTED', 'LOCAL_ONLY'].includes(checkpoint.recoveryStatus)) throw new RecoveryError('SUPERSEDE=FAIL: разрешены только NOT_STARTED/LOCAL_ONLY.', checkpoint.recoveryStatus === 'UNKNOWN' ? 2 : 1);

  const sourceEvidence = checkpoint.evidence.some((item) =>
    item.localSha === checkpoint.localCommitSha && !item.remoteSha && !item.errorClass && !item.timeout && !item.unavailable);
  const sourceHistory = checkpoint.verificationHistory.some((item) =>
    ['NOT_STARTED', 'LOCAL_ONLY'].includes(item.status) && !item.errorClass);
  if (!sourceEvidence || !sourceHistory) throw new RecoveryError('SUPERSEDE=FAIL: невыполненный исходный remote result не доказан.', 2);

  const successor = loadCheckpoint(root, args['superseded-by']);
  if (successor.operationId === checkpoint.operationId) throw new RecoveryError('SUPERSEDE=FAIL: operation не может supersede сама себя.', 1);
  if (successor.operationType !== checkpoint.operationType || successor.branch !== checkpoint.branch) throw new RecoveryError('SUPERSEDE=FAIL: successor имеет другой type/branch.', 1);
  if (successor.startedAt <= checkpoint.startedAt) throw new RecoveryError('SUPERSEDE=FAIL: successor должен быть создан позже.', 1);
  if (!successor.closedAt || successor.recoveryStatus !== successor.expectedState) throw new RecoveryError('SUPERSEDE=FAIL: successor не закрыт с доказанным expected state.', 2);
  const successorEvidence = successor.evidence.some((item) =>
    item.localSha === successor.localCommitSha && item.remoteSha === successor.localCommitSha && !item.errorClass);
  if (!successorEvidence) throw new RecoveryError('SUPERSEDE=FAIL: exact remote post-state successor не доказан.', 2);

  const closedAt = nowIso();
  checkpoint.closedAt = closedAt;
  checkpoint.supersededAt = closedAt;
  checkpoint.supersededBy = successor.operationId;
  checkpoint.closureReason = sanitizeText(args.reason).trim();
  checkpoint.userApprovalRequired = false;
  checkpoint.safeNextStep = `Operation закрыта как superseded доказанным successor ${successor.operationId}; remote write не выполнялась.`;
  checkpoint.sanitizedNotes.push(`Superseded ${closedAt}: ${checkpoint.closureReason}`);
  return saveCheckpoint(root, checkpoint);
}

export function findCheckpoint(root, args) {
  if (args['operation-id']) return loadCheckpoint(root, args['operation-id']);
  requireOperationArgs(args);
  const matches = listCheckpoints(root).filter((item) => !item.closedAt && item.operationType === args.operation && item.gate === args.gate && item.branch === args.branch && item.targetRef === args.target);
  if (matches.length !== 1) throw new RecoveryError(matches.length ? 'Найдено несколько активных checkpoints.' : 'Активный checkpoint не найден.', matches.length ? 1 : 3);
  return matches[0];
}

export function report(checkpoint) {
  return {
    operationId: checkpoint.operationId,
    operationType: checkpoint.operationType,
    recoveryStatus: checkpoint.recoveryStatus,
    expectedState: checkpoint.expectedState,
    safeNextStep: checkpoint.safeNextStep,
    errorClass: checkpoint.errorClass,
    disconnectObserved: checkpoint.disconnectObserved,
    userApprovalRequired: checkpoint.userApprovalRequired,
  };
}

export function exitCodeFor(checkpoint) {
  if (checkpoint.recoveryStatus === 'UNKNOWN') return 2;
  if (checkpoint.errorClass) return 1;
  return 0;
}

export function outputRussian(title, payload) {
  process.stdout.write(`${title}\n${stableJson(payload)}`);
}

export function handleCliError(error) {
  process.stderr.write(`ОШИБКА: ${sanitizeText(error?.message || error)}\n`);
  process.exitCode = error?.exitCode ?? 3;
}

export function operationFileName(checkpoint) {
  return basename(checkpointPath(repoRoot(), checkpoint.operationId));
}
