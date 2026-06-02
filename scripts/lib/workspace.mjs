import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = path.resolve(thisDir, '..', '..');

function stripQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export function loadWorkspace() {
  const manifestPath = path.join(workspaceRoot, 'workspace.yaml');
  const text = readFileSync(manifestPath, 'utf8');
  const repositories = [];
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '');
    const nameMatch = line.match(/^\s*-\s+name:\s*(.+?)\s*$/);
    if (nameMatch) {
      if (current) repositories.push(current);
      current = { name: stripQuotes(nameMatch[1]) };
      continue;
    }

    if (!current) continue;

    const fieldMatch = line.match(/^\s+([a-zA-Z_]+):\s*(.+?)\s*$/);
    if (fieldMatch) {
      current[fieldMatch[1]] = stripQuotes(fieldMatch[2]);
    }
  }

  if (current) repositories.push(current);

  return repositories.map((repo) => ({
    ...repo,
    absolutePath: path.resolve(workspaceRoot, repo.path || repo.name),
  }));
}

export function selectRepositories(names) {
  const repositories = loadWorkspace();
  if (names.length === 0) return repositories;

  const selected = [];
  const missing = [];

  for (const name of names) {
    const repo = repositories.find((candidate) => candidate.name === name);
    if (repo) selected.push(repo);
    else missing.push(name);
  }

  if (missing.length > 0) {
    throw new Error(`Unknown repositories: ${missing.join(', ')}`);
  }

  return selected;
}

export function git(args, cwd, options = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  });

  if (options.allowFailure) return result;
  if (result.status !== 0) {
    const message = result.stderr?.trim() || result.stdout?.trim() || `git ${args.join(' ')} failed`;
    throw new Error(message);
  }
  return result;
}

export function gitOutput(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

export function ensureChildRepo(repo) {
  if (!existsSync(repo.absolutePath)) {
    throw new Error(`${repo.name}: missing directory ${repo.absolutePath}`);
  }
  if (!existsSync(path.join(repo.absolutePath, '.git'))) {
    throw new Error(`${repo.name}: ${repo.absolutePath} is not a Git repository`);
  }
}

export function repoBranch(repo) {
  ensureChildRepo(repo);
  return gitOutput(['branch', '--show-current'], repo.absolutePath) || 'DETACHED';
}

export function repoStatus(repo) {
  ensureChildRepo(repo);
  return gitOutput(['status', '--short', '--branch'], repo.absolutePath);
}

export function repoChangedFiles(repo) {
  ensureChildRepo(repo);
  const output = gitOutput(['status', '--short'], repo.absolutePath);
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean);
}

export function shellCommand(command, cwd, options = {}) {
  const result = spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    stdio: options.stdio || 'inherit',
  });
  if (options.allowFailure) return result;
  if (result.status !== 0) {
    throw new Error(`${command} failed in ${cwd}`);
  }
  return result;
}

export function repoSlug(repo) {
  return remoteSlug(repo.remote || '') || repo.name;
}

export function remoteSlug(remote) {
  const withoutGit = remote.trim().replace(/\.git$/, '');
  const match = withoutGit.match(/github\.com[:/](.+?\/.+)$/);
  return match ? match[1] : '';
}

export function parseRepoArgs(argv, options = {}) {
  const repos = [];
  const flags = new Set();
  const values = new Map();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [flag, inlineValue] = arg.split('=', 2);
      if (options.valueFlags?.includes(flag)) {
        const value = inlineValue ?? argv[++i];
        if (!value) throw new Error(`${flag} requires a value`);
        values.set(flag, value);
      } else {
        flags.add(flag);
      }
      continue;
    }
    repos.push(arg);
  }

  return { repos, flags, values };
}
