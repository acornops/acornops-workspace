#!/usr/bin/env node
import { git, parseRepoArgs, selectRepositories } from '../lib/workspace.mjs';

const usage = 'Usage: scripts/workspace/branch.mjs [--dry-run] <branch-slug> <repo...>';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter((arg) => arg !== '--dry-run');

if (positional.length < 2) {
  console.error(usage);
  process.exit(1);
}

const [branchSlug, ...repoNames] = positional;
const repositories = selectRepositories(repoNames);

for (const repo of repositories) {
  const current = git(['branch', '--show-current'], repo.absolutePath).stdout.trim();
  const exists = git(['rev-parse', '--verify', '--quiet', branchSlug], repo.absolutePath, {
    allowFailure: true,
  }).status === 0;

  if (current === branchSlug) {
    console.log(`${repo.name}: already on ${branchSlug}`);
    continue;
  }

  const command = exists ? ['switch', branchSlug] : ['switch', '-c', branchSlug];
  console.log(`${repo.name}: git ${command.join(' ')}`);
  if (!dryRun) {
    git(command, repo.absolutePath, { stdio: 'inherit' });
  }
}
