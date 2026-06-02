#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { gitOutput, loadWorkspace, workspaceRoot } from '../lib/workspace.mjs';

function commandStatus(command, args = []) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || '',
  };
}

function normalizeRemote(remote) {
  return remote.trim().replace(/\.git$/, '');
}

function logCheck(ok, label, detail = '') {
  const prefix = ok ? 'OK  ' : 'FAIL';
  console.log(`${prefix} ${label}${detail ? ` - ${detail}` : ''}`);
}

function logWarn(label, detail = '') {
  console.log(`WARN ${label}${detail ? ` - ${detail}` : ''}`);
}

let failures = 0;
let warnings = 0;

console.log('== tools ==');

for (const [command, args, required] of [
  ['git', ['--version'], true],
  ['node', ['--version'], true],
  ['npm', ['--version'], true],
  ['task', ['--version'], false],
  ['gh', ['--version'], false],
  ['docker', ['--version'], false],
  ['python3', ['--version'], false],
]) {
  const status = commandStatus(command, args);
  if (status.ok) {
    logCheck(true, command, status.output);
  } else if (required) {
    failures += 1;
    logCheck(false, command, 'required for workspace development');
  } else {
    warnings += 1;
    logWarn(command, 'optional; needed only for matching repository workflows');
  }
}

console.log('\n== parent ==');
try {
  const parentStatus = gitOutput(['status', '--short', '--branch'], workspaceRoot);
  logCheck(true, 'workspace git status', parentStatus || '(clean)');
} catch (error) {
  failures += 1;
  logCheck(false, 'workspace git status', error.message);
}

console.log('\n== child repositories ==');

for (const repo of loadWorkspace()) {
  const relativePath = path.relative(workspaceRoot, repo.absolutePath);
  const gitDir = path.join(repo.absolutePath, '.git');

  if (!existsSync(repo.absolutePath)) {
    failures += 1;
    logCheck(false, repo.name, `missing ${relativePath}; run ./scripts/workspace/bootstrap.mjs ${repo.name}`);
    continue;
  }

  if (!existsSync(gitDir)) {
    failures += 1;
    logCheck(false, repo.name, `${relativePath} is not a Git repository`);
    continue;
  }

  try {
    const remote = gitOutput(['remote', 'get-url', 'origin'], repo.absolutePath);
    const branch = gitOutput(['branch', '--show-current'], repo.absolutePath) || 'DETACHED';
    const status = gitOutput(['status', '--short'], repo.absolutePath);
    const remoteMatches = normalizeRemote(remote) === normalizeRemote(repo.remote || '');

    if (!remoteMatches) {
      failures += 1;
      logCheck(false, repo.name, `origin is ${remote}; expected ${repo.remote}`);
      continue;
    }

    logCheck(true, repo.name, `${relativePath} on ${branch}${status ? ' with local changes' : ''}`);
  } catch (error) {
    failures += 1;
    logCheck(false, repo.name, error.message);
  }
}

console.log('\n== result ==');
if (failures > 0) {
  console.log(`${failures} failure(s), ${warnings} warning(s).`);
  process.exit(1);
}

console.log(warnings > 0 ? `Ready with ${warnings} warning(s).` : 'Ready.');
