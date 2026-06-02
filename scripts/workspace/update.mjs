#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  git,
  gitOutput,
  parseRepoArgs,
  selectRepositories,
  workspaceRoot,
} from '../lib/workspace.mjs';

function usage() {
  console.log(`Usage: ./scripts/workspace/update.mjs [--dry-run] [--children-only] [repo...]

Safely update the workspace and child repositories.

The update is intentionally conservative:
  - fetches with --prune first
  - updates only clean repositories
  - updates only repositories on their default branch
  - refuses divergent history or unpushed local commits
  - uses fast-forward only

Examples:
  ./scripts/workspace/update.mjs --dry-run
  ./scripts/workspace/update.mjs
  ./scripts/workspace/update.mjs control-plane docs-website
`);
}

function repoTargets(requestedRepos, flags) {
  const children = selectRepositories(requestedRepos);
  if (requestedRepos.length > 0 || flags.has('--children-only')) return children;
  return [
    {
      name: 'workspace',
      absolutePath: workspaceRoot,
      default_branch: 'main',
    },
    ...children,
  ];
}

function outputOrNull(args, cwd) {
  const result = git(args, cwd, { allowFailure: true });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function isAncestor(ancestor, descendant, cwd) {
  const result = git(['merge-base', '--is-ancestor', ancestor, descendant], cwd, { allowFailure: true });
  return result.status === 0;
}

const { repos: requestedRepos, flags } = parseRepoArgs(process.argv.slice(2));

if (flags.has('--help') || flags.has('-h')) {
  usage();
  process.exit(0);
}

const dryRun = flags.has('--dry-run');
const targets = repoTargets(requestedRepos, flags);
const failures = [];
let updated = 0;
let current = 0;
let skipped = 0;

for (const target of targets) {
  const relativePath = path.relative(workspaceRoot, target.absolutePath) || '.';
  const gitDir = path.join(target.absolutePath, '.git');
  const defaultBranch = target.default_branch || 'main';
  const remoteRef = `origin/${defaultBranch}`;

  if (!existsSync(target.absolutePath) || !existsSync(gitDir)) {
    skipped += 1;
    console.log(`SKIP ${target.name}: ${relativePath} is not a Git repository`);
    continue;
  }

  if (dryRun) {
    console.log(`PLAN ${target.name}: git fetch --prune`);
  } else {
    const fetch = git(['fetch', '--prune'], target.absolutePath, { allowFailure: true });
    if (fetch.status !== 0) {
      failures.push(`${target.name}: fetch failed: ${fetch.stderr?.trim() || fetch.stdout?.trim()}`);
      continue;
    }
  }

  const branch = outputOrNull(['branch', '--show-current'], target.absolutePath) || 'DETACHED';
  if (branch !== defaultBranch) {
    skipped += 1;
    console.log(`SKIP ${target.name}: on ${branch}, expected ${defaultBranch}`);
    continue;
  }

  const dirty = gitOutput(['status', '--porcelain'], target.absolutePath);
  if (dirty) {
    skipped += 1;
    console.log(`SKIP ${target.name}: local changes present`);
    continue;
  }

  const remoteSha = outputOrNull(['rev-parse', '--verify', remoteRef], target.absolutePath);
  if (!remoteSha) {
    skipped += 1;
    console.log(`SKIP ${target.name}: missing ${remoteRef}`);
    continue;
  }

  const localSha = gitOutput(['rev-parse', 'HEAD'], target.absolutePath);
  if (localSha === remoteSha) {
    current += 1;
    console.log(`OK   ${target.name}: already current`);
    continue;
  }

  if (isAncestor(localSha, remoteSha, target.absolutePath)) {
    if (dryRun) {
      updated += 1;
      console.log(`PLAN ${target.name}: fast-forward ${branch} to ${remoteRef}`);
      continue;
    }

    const merge = git(['merge', '--ff-only', remoteRef], target.absolutePath, { allowFailure: true });
    if (merge.status === 0) {
      updated += 1;
      console.log(`OK   ${target.name}: fast-forwarded to ${remoteRef}`);
    } else {
      failures.push(`${target.name}: fast-forward failed: ${merge.stderr?.trim() || merge.stdout?.trim()}`);
    }
    continue;
  }

  skipped += 1;
  if (isAncestor(remoteSha, localSha, target.absolutePath)) {
    console.log(`SKIP ${target.name}: local branch has unpushed commits`);
  } else {
    console.log(`SKIP ${target.name}: local and remote histories diverged`);
  }
}

if (failures.length > 0) {
  console.error('\nUpdate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`\nUpdate complete. updated=${updated} current=${current} skipped=${skipped} dryRun=${dryRun}`);
