#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { repoBranch, repoChangedFiles, selectRepositories, workspaceRoot } from '../lib/workspace.mjs';

const usage = 'Usage: scripts/workspace/change-set.mjs <slug> <repo...>';
const [slug, ...repoNames] = process.argv.slice(2);

if (!slug || repoNames.length === 0) {
  console.error(usage);
  process.exit(1);
}

const repositories = selectRepositories(repoNames);
const targetDir = path.join(workspaceRoot, 'change-sets', 'active');
const targetFile = path.join(targetDir, `${slug}.md`);

if (existsSync(targetFile)) {
  console.error(`Change set already exists: ${targetFile}`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const repoRows = repositories.map((repo) => {
  const files = repoChangedFiles(repo);
  return `| ${repo.name} | ${repoBranch(repo)} | ${files.length > 0 ? 'yes' : 'no'} | TBD |`;
});

const body = `# Change Set: ${slug}

## Summary

TBD

## Tracking

- Issue: TBD
- Branch slug: ${slug}

## Affected Repositories

| Repository | Branch | Dirty | Reason |
| --- | --- | --- | --- |
${repoRows.join('\n')}

## Related PRs

| Repository | PR | Status |
| --- | --- | --- |
${repositories.map((repo) => `| ${repo.name} | TBD | draft |`).join('\n')}

## Merge Order

1. TBD

## Validation

| Repository | Command | Result |
| --- | --- | --- |
${repositories.map((repo) => `| ${repo.name} | \`${repo.validate || 'TBD'}\` | not run |`).join('\n')}

## Docs Impact

TBD

## Residual Risk

TBD
`;

writeFileSync(targetFile, body);
console.log(targetFile);
