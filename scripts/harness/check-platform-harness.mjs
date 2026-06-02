import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const repos = [
  'acornops-deployment',
  'control-plane',
  'management-console',
  'execution-engine',
  'llm-gateway',
  'k8s-agent',
  'vm-agent'
];

const requiredFiles = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'docs/index.md',
  'docs/DESIGN.md',
  'docs/PLANS.md',
  'docs/AGENT_HANDOFF.md',
  'docs/QUALITY_SCORE.md',
  'docs/RELIABILITY.md',
  'docs/SECURITY.md',
  'docs/design-docs/index.md',
  'docs/design-docs/core-beliefs.md',
  'docs/product-specs/index.md',
  'docs/product-specs/component-charter.md',
  'docs/references/index.md',
  'docs/generated/README.md',
  'docs/exec-plans/active/README.md',
  'docs/exec-plans/completed/README.md',
  'docs/exec-plans/tech-debt-tracker.md',
  'docs/contracts/README.md',
  'docs/contracts/manifest.json',
  '.agents/skills/README.md',
  '.agents/skills/shared/.standards-version'
];

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

for (const repo of repos) {
  for (const file of requiredFiles) {
    expect(existsSync(path.join(root, repo, file)), `Missing required harness file ${repo}/${file}`);
  }

  const agents = read(path.join(repo, 'AGENTS.md'));
  const readme = read(path.join(repo, 'README.md'));
  const docsIndex = read(path.join(repo, 'docs/index.md'));
  const handoff = read(path.join(repo, 'docs/AGENT_HANDOFF.md'));
  expect(agents.split('\n').length <= 140, `${repo}/AGENTS.md should remain short`);
  expect(!agents.includes('/Users/'), `${repo}/AGENTS.md should use portable relative links`);
  expect(agents.includes('Agent-Assisted Development'), `${repo}/AGENTS.md should describe agent-assisted development entrypoints`);
  expect(agents.includes('acornops-workspace'), `${repo}/AGENTS.md should point cross-repo agent work to the workspace root`);
  expect(!agents.includes('acornops-agent-standards'), `${repo}/AGENTS.md must not reference the retired standards repository`);
  expect(agents.includes('.agents/skills/shared'), `${repo}/AGENTS.md should describe shared skills`);
  expect(agents.includes('.agents/skills/local'), `${repo}/AGENTS.md should describe local skills`);
  expect(agents.includes('docs/AGENT_HANDOFF.md'), `${repo}/AGENTS.md should link agent handoff policy`);
  expect(readme.includes('Agent-Assisted Development'), `${repo}/README.md should describe agent-assisted development entrypoints`);
  expect(docsIndex.includes('docs/AGENT_HANDOFF.md'), `${repo}/docs/index.md should link agent handoff policy`);
  expect(handoff.includes('Use Conventional Commits 1.0.0'), `${repo}/docs/AGENT_HANDOFF.md should require commit policy`);
  expect(handoff.includes('exact commands run'), `${repo}/docs/AGENT_HANDOFF.md should include handoff evidence`);
  expect(handoff.includes('Vendor Neutrality'), `${repo}/docs/AGENT_HANDOFF.md should include vendor-neutrality policy`);
  expect(docsIndex.includes('docs/QUALITY_SCORE.md'), `${repo}/docs/index.md should link quality score`);
  expect(docsIndex.includes('docs/RELIABILITY.md'), `${repo}/docs/index.md should link reliability doc`);
  expect(docsIndex.includes('docs/SECURITY.md'), `${repo}/docs/index.md should link security doc`);
  for (const metadataPath of ['.DS_Store', '.agents/.DS_Store', '.agents/skills/.DS_Store']) {
    expect(!existsSync(path.join(root, repo, metadataPath)), `Remove generated metadata file ${repo}/${metadataPath}`);
  }
  for (const vendorPath of ['CLAUDE.md', 'GEMINI.md', '.cursor', '.cursorrules']) {
    expect(!existsSync(path.join(root, repo, vendorPath)), `Do not add required vendor-specific agent instruction file ${repo}/${vendorPath}`);
  }
}

if (failures.length > 0) {
  console.error('Platform harness checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Platform harness checks passed.');
