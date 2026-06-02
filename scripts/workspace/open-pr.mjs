#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { parseRepoArgs, repoBranch, selectRepositories } from '../lib/workspace.mjs';

const usage = 'Usage: scripts/workspace/open-pr.mjs --title <title> --body-file <file> [--ready] <repo...>';
const { repos, flags, values } = parseRepoArgs(process.argv.slice(2), {
  valueFlags: ['--title', '--body-file'],
});

if (flags.has('--help')) {
  console.log(usage);
  process.exit(0);
}

const title = values.get('--title');
const bodyFile = values.get('--body-file') ? path.resolve(values.get('--body-file')) : undefined;

if (!title || !bodyFile || repos.length === 0) {
  console.error(usage);
  process.exit(1);
}

if (!existsSync(bodyFile)) {
  console.error(`Missing body file: ${bodyFile}`);
  process.exit(1);
}

try {
  execFileSync('gh', ['--version'], { stdio: 'ignore' });
} catch {
  console.error('GitHub CLI `gh` is required for scripts/workspace/open-pr.mjs.');
  process.exit(1);
}

const draftArgs = flags.has('--ready') ? [] : ['--draft'];

for (const repo of selectRepositories(repos)) {
  const branch = repoBranch(repo);
  if (!branch || branch === 'DETACHED' || branch === repo.default_branch) {
    console.error(`${repo.name}: refusing to publish branch ${branch}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`\n== ${repo.name}: push ${branch} ==`);
  execFileSync('git', ['push', '-u', 'origin', branch], {
    cwd: repo.absolutePath,
    stdio: 'inherit',
  });

  console.log(`== ${repo.name}: gh pr create ==`);
  execFileSync('gh', ['pr', 'create', ...draftArgs, '--title', title, '--body-file', bodyFile], {
    cwd: repo.absolutePath,
    stdio: 'inherit',
  });
}
