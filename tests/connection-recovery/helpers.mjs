import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function tempGitRepo(branch = 'feature/test') {
  const root = mkdtempSync(join(tmpdir(), 'crp-test-'));
  execFileSync('git', ['init', '-b', branch], { cwd: root, stdio: 'ignore', windowsHide: true });
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root, windowsHide: true });
  execFileSync('git', ['config', 'user.name', 'Connection Recovery Test'], { cwd: root, windowsHide: true });
  writeFileSync(join(root, 'README.md'), 'fixture\n');
  writeFileSync(join(root, '.gitignore'), '.audit/connection-recovery/\n');
  execFileSync('git', ['add', 'README.md', '.gitignore'], { cwd: root, windowsHide: true });
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: root, stdio: 'ignore', windowsHide: true });
  return root;
}

export function args(operation = 'GIT_PUSH', branch = 'feature/test') {
  return { operation, gate: 'TEST', branch, target: 'MockTarget' };
}
