#!/usr/bin/env node
import { repoBranch, repoChangedFiles, repoSlug, selectRepositories } from '../lib/workspace.mjs';

const usage = 'Usage: scripts/workspace/pr-plan.mjs <repo...>';
const repoNames = process.argv.slice(2);

if (repoNames.length === 0 || repoNames.includes('--help')) {
  console.error(usage);
  process.exit(repoNames.includes('--help') ? 0 : 1);
}

const repositories = selectRepositories(repoNames);

console.log('# Workspace PR Plan\n');

console.log('## Related PRs\n');
for (const repo of repositories) {
  console.log(`- ${repoSlug(repo)}: TBD`);
}

console.log('\n## Merge Order\n');
repositories.forEach((repo, index) => {
  console.log(`${index + 1}. ${repo.name}`);
});

for (const repo of repositories) {
  const files = repoChangedFiles(repo);
  console.log(`\n---\n\n# ${repo.name}\n`);
  console.log(`- GitHub repo: ${repoSlug(repo)}`);
  console.log(`- Branch: ${repoBranch(repo)}`);
  console.log(`- Validation: \`${repo.validate || 'TBD'}\``);
  console.log('\n## Changed Files\n');
  if (files.length === 0) {
    console.log('- None');
  } else {
    for (const file of files) console.log(`- \`${file}\``);
  }
  console.log('\n## PR Body Draft\n');
  console.log('```markdown');
  console.log('## Summary\n- TBD\n');
  console.log('## Cross-Repo Change Set\nTracking issue: TBD\n');
  console.log('Related PRs:');
  for (const related of repositories) console.log(`- ${repoSlug(related)}: TBD`);
  console.log('\nMerge order:');
  repositories.forEach((related, index) => console.log(`${index + 1}. ${related.name}`));
  console.log('\n## Validation\n- TBD\n');
  console.log('## Docs Impact\n- TBD\n');
  console.log('## Residual Risk\n- TBD');
  console.log('```');
}
