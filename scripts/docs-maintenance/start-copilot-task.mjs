#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const API_VERSION = '2026-03-10';

function usage() {
  console.error(`Usage: node scripts/docs-maintenance/start-copilot-task.mjs --evidence <dir> --model <model> --base-ref <ref> [--token-env <name>] [--dry-run]

Environment:
  GITHUB_REPOSITORY     owner/repo target repository
  COPILOT_AGENT_PAT     fine-grained PAT with Agent tasks read/write, unless --token-env overrides it
`);
}

function parseArgs(argv) {
  const values = new Map();
  const flags = new Set();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      flags.add(arg);
      continue;
    }
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument ${arg}`);
    }
    const value = argv[++i];
    if (!value) {
      throw new Error(`${arg} requires a value`);
    }
    values.set(arg, value);
  }

  return { values, flags };
}

function readLimited(file, maxChars = 12000) {
  try {
    const text = readFileSync(file, 'utf8').trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}\n\n[truncated at ${maxChars} characters]`;
  } catch {
    return '';
  }
}

function buildPrompt({ evidenceDir, baseRef, model }) {
  const requiredFiles = ['harness-findings.md', 'commits.txt', 'diff-name-status.txt', 'diff-stat.txt', 'summary.json'];
  const missingFiles = requiredFiles.filter((file) => !existsSync(path.join(evidenceDir, file)));
  if (missingFiles.length > 0) {
    throw new Error(`Evidence bundle is incomplete. Missing: ${missingFiles.join(', ')}`);
  }

  const summary = readLimited(path.join(evidenceDir, 'harness-findings.md'), 16000);
  const commits = readLimited(path.join(evidenceDir, 'commits.txt'), 8000);
  const nameStatus = readLimited(path.join(evidenceDir, 'diff-name-status.txt'), 12000);
  const diffStat = readLimited(path.join(evidenceDir, 'diff-stat.txt'), 8000);
  const summaryJson = readLimited(path.join(evidenceDir, 'summary.json'), 12000);

  return [
    'You are the AcornOps docs maintenance agent.',
    '',
    'Goal: review the evidence below, compare current documentation and agent guidance against the current implementation, make only evidence-backed documentation or agent-guidance updates, and create a pull request.',
    '',
    'Scope:',
    '- Treat the evidence below as temporary workflow context; it is not committed to the repository and is not uploaded as an artifact.',
    '- Prefer docs, README, CONTRIBUTING, AGENTS.md, architecture, operations, development, contract, and harness guidance updates.',
    '- Do not rewrite docs for style alone.',
    '- Do not edit product implementation code unless a documentation example or generated reference requires a narrowly scoped fix.',
    '- If no updates are needed, leave the task with a concise explanation and do not fabricate changes.',
    '',
    'Pull request requirements:',
    '- Use a Conventional Commit title beginning with `docs:`.',
    '- Use the docs-maintenance pull request template when available.',
    '- Include evidence reviewed, docs impact, validation commands run, skipped checks, and residual risk.',
    '- Run the repository validation command when discoverable. If validation cannot run, explain why.',
    '',
    `Base branch: ${baseRef}`,
    `Requested model: ${model}`,
    '',
    '## Evidence Summary',
    summary || 'No harness findings were provided.',
    '',
    '## Commits',
    commits || 'No commits were provided.',
    '',
    '## Changed Files',
    nameStatus || 'No changed files were provided.',
    '',
    '## Diff Stat',
    diffStat || 'No diff stat was provided.',
    '',
    '## Machine Summary',
    summaryJson || 'No summary JSON was provided.',
  ].join('\n');
}

async function main() {
  const { values, flags } = parseArgs(process.argv.slice(2));
  const evidenceDir = values.get('--evidence');
  const model = values.get('--model');
  const baseRef = values.get('--base-ref');
  const tokenEnv = values.get('--token-env') || 'COPILOT_AGENT_PAT';
  const dryRun = flags.has('--dry-run');
  const repository = process.env.GITHUB_REPOSITORY;

  if (!evidenceDir || !model || !baseRef) {
    usage();
    process.exit(1);
  }

  if (!repository || !repository.includes('/')) {
    throw new Error('GITHUB_REPOSITORY must be set to owner/repo.');
  }

  const prompt = buildPrompt({ evidenceDir, baseRef, model });
  const body = {
    prompt,
    model,
    create_pull_request: true,
    base_ref: baseRef,
  };

  if (dryRun) {
    console.log(JSON.stringify({ repository, body }, null, 2));
    return;
  }

  const token = process.env[tokenEnv];
  if (!token) {
    throw new Error(`${tokenEnv} is not set. Configure a repository or organization secret containing a fine-grained PAT with Agent tasks read/write.`);
  }

  const response = await fetch(`https://api.github.com/agents/repos/${repository}/tasks`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'acornops-docs-maintenance',
      'X-GitHub-Api-Version': API_VERSION,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Copilot task request failed (${response.status}): ${text.slice(0, 2000)}`);
  }

  const parsed = JSON.parse(text);
  console.log(`Started Copilot docs maintenance task: ${parsed.html_url || parsed.url || parsed.id}`);
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(1);
});
