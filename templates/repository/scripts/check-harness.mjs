import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const maxSourceLines = 650;

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

for (const file of [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'docs/index.md',
  'docs/DESIGN.md',
  'docs/PLANS.md',
  'docs/AGENT_HANDOFF.md',
  'docs/QUALITY_SCORE.md',
  'docs/RELIABILITY.md',
  'docs/SECURITY.md',
  'docs/contracts/README.md',
  'docs/contracts/manifest.json',
  '.agents/skills/README.md',
  '.agents/skills/shared/.standards-version'
]) {
  expect(existsSync(path.join(root, file)), `Missing required harness file ${file}`);
}

function expectIncludes(content, needle, message) {
  expect(content.includes(needle), `${message}: missing ${needle}`);
}

const agents = read('AGENTS.md');
const docsIndex = read('docs/index.md');
const handoff = read('docs/AGENT_HANDOFF.md');

expect(agents.split('\n').length <= 140, 'AGENTS.md should stay short enough to serve as a table of contents');
expect(!agents.includes('/Users/'), 'AGENTS.md should use portable relative links, not workstation-specific absolute paths');
expectIncludes(agents, '.agents/skills/shared', 'AGENTS shared skills guidance');
expectIncludes(agents, '.agents/skills/local', 'AGENTS local skills guidance');
expectIncludes(agents, 'docs/AGENT_HANDOFF.md', 'AGENTS handoff guidance');
expectIncludes(docsIndex, 'AGENT_HANDOFF.md', 'Docs index handoff link');
expectIncludes(handoff, 'exact commands run', 'Agent handoff evidence');
expectIncludes(handoff, 'Conventional Commits', 'Agent handoff commit policy');
expectIncludes(handoff, 'Vendor Neutrality', 'Agent handoff vendor-neutral policy');

function walkSourceFiles(directory) {
  if (!existsSync(path.join(root, directory))) return [];
  const files = [];
  for (const entry of readdirSync(path.join(root, directory))) {
    const relativePath = path.join(directory, entry);
    const absolutePath = path.join(root, relativePath);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      files.push(...walkSourceFiles(relativePath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(relativePath);
    }
  }
  return files;
}

for (const file of walkSourceFiles('src')) {
  const lineCount = read(file).split('\n').length;
  expect(
    lineCount <= maxSourceLines,
    `${file} has ${lineCount} lines; budget is ${maxSourceLines}. Extract a focused module instead of growing this file.`
  );
}

for (const metadataPath of [
  '.DS_Store',
  '.agents/.DS_Store',
  '.agents/skills/.DS_Store',
  '.agents/skills/shared/.DS_Store'
]) {
  expect(!existsSync(path.join(root, metadataPath)), `Remove generated macOS metadata file ${metadataPath}`);
}

if (failures.length > 0) {
  console.error('Harness checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Harness checks passed.');
