#!/usr/bin/env node
import { parseRepoArgs, selectRepositories, shellCommand, workspaceRoot } from '../lib/workspace.mjs';

const usage = 'Usage: scripts/workspace/validate.mjs [--dry-run] [--platform] [repo...]';
const { repos, flags } = parseRepoArgs(process.argv.slice(2));
if (flags.has('--help')) {
  console.log(usage);
  process.exit(0);
}

const dryRun = flags.has('--dry-run');
const includePlatform = flags.has('--platform');
const repositories = selectRepositories(repos);

for (const repo of repositories) {
  if (!repo.validate) {
    console.log(`${repo.name}: no validate command configured`);
    continue;
  }
  console.log(`\n== ${repo.name}: ${repo.validate} ==`);
  if (!dryRun) {
    shellCommand(repo.validate, repo.absolutePath);
  }
}

if (includePlatform) {
  for (const command of ['node scripts/harness/check-platform-harness.mjs', 'node scripts/harness/check-platform-contracts.mjs']) {
    console.log(`\n== workspace: ${command} ==`);
    if (!dryRun) {
      shellCommand(command, workspaceRoot);
    }
  }
}
