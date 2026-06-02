#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { git, parseRepoArgs, selectRepositories, workspaceRoot } from '../lib/workspace.mjs';

function usage() {
  console.log(`Usage: ./scripts/workspace/fetch.mjs [--dry-run] [--children-only] [repo...]

Fetch remote refs for the workspace and child repositories.

Defaults:
  - includes the parent workspace repo and all child repos
  - runs git fetch --prune
  - never merges or changes branches

Examples:
  ./scripts/workspace/fetch.mjs --dry-run
  ./scripts/workspace/fetch.mjs
  ./scripts/workspace/fetch.mjs control-plane docs-website
`);
}

function repoTargets(requestedRepos, flags) {
  const children = selectRepositories(requestedRepos);
  if (requestedRepos.length > 0 || flags.has('--children-only')) return children;
  return [
    {
      name: 'workspace',
      absolutePath: workspaceRoot,
    },
    ...children,
  ];
}

const { repos: requestedRepos, flags } = parseRepoArgs(process.argv.slice(2));

if (flags.has('--help') || flags.has('-h')) {
  usage();
  process.exit(0);
}

const dryRun = flags.has('--dry-run');
const targets = repoTargets(requestedRepos, flags);
const failures = [];
let skipped = 0;
let fetched = 0;

for (const target of targets) {
  const relativePath = path.relative(workspaceRoot, target.absolutePath) || '.';
  const gitDir = path.join(target.absolutePath, '.git');

  if (!existsSync(target.absolutePath) || !existsSync(gitDir)) {
    skipped += 1;
    console.log(`SKIP ${target.name}: ${relativePath} is not a Git repository`);
    continue;
  }

  const command = 'git fetch --prune';
  if (dryRun) {
    console.log(`PLAN ${target.name}: ${command}`);
    continue;
  }

  const result = git(['fetch', '--prune'], target.absolutePath, { allowFailure: true });
  if (result.status === 0) {
    fetched += 1;
    console.log(`OK   ${target.name}: fetched`);
  } else {
    failures.push(`${target.name}: ${result.stderr?.trim() || result.stdout?.trim() || command}`);
  }
}

if (failures.length > 0) {
  console.error('\nFetch failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`\nFetch complete. fetched=${fetched} skipped=${skipped} dryRun=${dryRun}`);
