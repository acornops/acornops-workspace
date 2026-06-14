#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/docs-maintenance/collect-evidence.mjs --base <sha> --head <sha> --out <dir>');
}

function parseArgs(argv) {
  const values = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument ${arg}`);
    }
    const value = argv[++i];
    if (!value) {
      throw new Error(`${arg} requires a value`);
    }
    values.set(arg, value);
  }
  return values;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gitMaybe(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function readMaybe(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function changedPath(line) {
  const fields = line.split(/\t/);
  if (fields[0]?.startsWith('R') || fields[0]?.startsWith('C')) {
    return fields[2] || fields[1] || '';
  }
  return fields[1] || '';
}

function categorize(file) {
  if (
    file.endsWith('.md') ||
    file.startsWith('docs/') ||
    file === 'README.md' ||
    file === 'CONTRIBUTING.md' ||
    file === 'AGENTS.md' ||
    file === 'ARCHITECTURE.md'
  ) {
    return 'docs';
  }

  if (file.startsWith('.github/workflows/')) return 'workflows';
  if (file.startsWith('.github/')) return 'github';
  if (file.startsWith('scripts/')) return 'scripts';
  if (file.includes('/contracts/') || file.startsWith('contracts/')) return 'contracts';
  if (file.includes('openapi') || file.includes('schema')) return 'api-schema';
  if (file.includes('config') || file.endsWith('.env.example')) return 'config';
  if (file.includes('deploy') || file.includes('Dockerfile') || file.includes('helm')) return 'deployment';
  if (file.match(/(^|\/)(src|app|lib|test|tests|migrations)\//)) return 'implementation';
  return 'other';
}

function parsePackageScripts() {
  const packageJson = readMaybe('package.json');
  if (!packageJson) return {};

  try {
    const parsed = JSON.parse(packageJson);
    return parsed.scripts || {};
  } catch {
    return { error: 'package.json could not be parsed' };
  }
}

function parseTaskfileTasks() {
  const text = readMaybe('Taskfile.yml') || readMaybe('Taskfile.yaml');
  if (!text) return [];

  const tasks = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^  ([a-zA-Z0-9:_-]+):\s*$/);
    if (match) tasks.push(match[1]);
  }
  return tasks;
}

function parseWorkspaceValidations() {
  const text = readMaybe('workspace.yaml');
  if (!text) return [];

  const validations = [];
  let currentRepo = '';
  for (const line of text.split(/\r?\n/)) {
    const repoMatch = line.match(/^\s*-\s+name:\s*(.+?)\s*$/);
    if (repoMatch) {
      currentRepo = repoMatch[1].replace(/^['"]|['"]$/g, '');
      continue;
    }

    const validateMatch = line.match(/^\s+validate:\s*(.+?)\s*$/);
    if (validateMatch) {
      validations.push({
        repository: currentRepo,
        command: validateMatch[1].replace(/^['"]|['"]$/g, ''),
      });
    }
  }
  return validations;
}

function write(file, contents) {
  writeFileSync(file, `${contents.replace(/\s+$/g, '')}\n`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const base = args.get('--base');
  const head = args.get('--head');
  const outDir = args.get('--out');

  if (!base || !head || !outDir) {
    usage();
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const commitRange = `${base}..${head}`;
  const nameStatus = gitMaybe(['diff', '--name-status', commitRange]);
  const changedFiles = nameStatus
    .split(/\r?\n/)
    .filter(Boolean)
    .map(changedPath)
    .filter(Boolean);

  const categories = new Map();
  for (const file of changedFiles) {
    const category = categorize(file);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(file);
  }

  const summary = {
    repository: process.env.GITHUB_REPOSITORY || path.basename(process.cwd()),
    workflow: process.env.GITHUB_WORKFLOW || 'docs-maintenance',
    base,
    head,
    generatedAt: new Date().toISOString(),
    changedFileCount: changedFiles.length,
    categories: Object.fromEntries([...categories.entries()].sort()),
    validationSignals: {
      packageScripts: parsePackageScripts(),
      taskfileTasks: parseTaskfileTasks(),
      workspaceValidations: parseWorkspaceValidations(),
    },
  };

  write(path.join(outDir, 'base.txt'), base);
  write(path.join(outDir, 'head.txt'), head);
  write(path.join(outDir, 'commits.txt'), gitMaybe(['log', '--oneline', commitRange]) || 'No commits in range.');
  write(path.join(outDir, 'diff-name-status.txt'), nameStatus || 'No changed files in range.');
  write(path.join(outDir, 'diff-stat.txt'), gitMaybe(['diff', '--stat', commitRange]) || 'No diff in range.');
  write(path.join(outDir, 'changed-files.txt'), changedFiles.join('\n') || 'No changed files in range.');
  write(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const markdown = [
    '# Docs Maintenance Evidence',
    '',
    `- Repository: ${summary.repository}`,
    `- Base: \`${base}\``,
    `- Head: \`${head}\``,
    `- Changed files: ${changedFiles.length}`,
    '',
    '## Categories',
    '',
    ...Object.entries(summary.categories).flatMap(([category, files]) => [
      `### ${category}`,
      '',
      ...files.map((file) => `- \`${file}\``),
      '',
    ]),
    '## Validation Signals',
    '',
    `- package.json scripts: ${Object.keys(summary.validationSignals.packageScripts).length}`,
    `- Taskfile tasks: ${summary.validationSignals.taskfileTasks.length}`,
    `- workspace.yaml validations: ${summary.validationSignals.workspaceValidations.length}`,
  ].join('\n');

  write(path.join(outDir, 'harness-findings.md'), markdown);
  console.log(`Docs maintenance evidence written to ${outDir}`);
} catch (error) {
  console.error(error.message);
  usage();
  process.exit(1);
}
