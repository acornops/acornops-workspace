#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseRepoArgs, remoteSlug, selectRepositories, workspaceRoot } from '../lib/workspace.mjs';

function usage() {
  console.log(`Usage: ./scripts/workspace/bootstrap.mjs [--dry-run] [repo...]

Clone missing child repositories declared in workspace.yaml and normalize matching
GitHub remotes to the configured SSH URLs.

Examples:
  ./scripts/workspace/bootstrap.mjs --dry-run
  ./scripts/workspace/bootstrap.mjs
  ./scripts/workspace/bootstrap.mjs control-plane docs-website
`);
}

function run(command, args, cwd = workspaceRoot) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

function gitOutput(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function sameGitHubRepository(left, right) {
  const leftSlug = remoteSlug(left);
  const rightSlug = remoteSlug(right);
  return leftSlug !== '' && leftSlug === rightSlug;
}

const { repos: requestedRepos, flags } = parseRepoArgs(process.argv.slice(2));

if (flags.has('--help') || flags.has('-h')) {
  usage();
  process.exit(0);
}

const dryRun = flags.has('--dry-run');
const repositories = selectRepositories(requestedRepos);
const failures = [];

console.log(`Workspace: ${workspaceRoot}`);
console.log(dryRun ? 'Mode: dry run' : 'Mode: clone missing repositories and normalize remotes');

for (const repo of repositories) {
  const relativePath = path.relative(workspaceRoot, repo.absolutePath);
  const gitDir = path.join(repo.absolutePath, '.git');

  if (!repo.remote) {
    failures.push(`${repo.name}: missing remote in workspace.yaml`);
    continue;
  }

  if (existsSync(repo.absolutePath)) {
    if (existsSync(gitDir)) {
      const origin = gitOutput(['remote', 'get-url', 'origin'], repo.absolutePath);
      if (origin && origin !== repo.remote && sameGitHubRepository(origin, repo.remote)) {
        console.log(`${dryRun ? 'PLAN' : 'DO  '} ${repo.name}: git remote set-url origin ${repo.remote}`);
        if (!dryRun) run('git', ['remote', 'set-url', 'origin', repo.remote], repo.absolutePath);
        if (!dryRun) console.log(`OK   ${repo.name}: origin uses ${repo.remote}`);
      } else {
        console.log(`OK   ${repo.name}: ${relativePath} already exists`);
      }
    } else {
      failures.push(`${repo.name}: ${relativePath} exists but is not a Git repository`);
    }
    continue;
  }

  const cloneArgs = ['clone', repo.remote, repo.absolutePath];
  console.log(`${dryRun ? 'PLAN' : 'DO  '} ${repo.name}: git ${cloneArgs.join(' ')}`);
  if (!dryRun) run('git', cloneArgs);
}

if (failures.length > 0) {
  console.error('\nBootstrap failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('\nBootstrap check complete.');
if (dryRun) {
  console.log('Run without --dry-run to clone any missing repositories.');
}
