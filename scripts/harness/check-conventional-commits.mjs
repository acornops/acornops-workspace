#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { workspaceRoot } from '../lib/workspace.mjs';

const conventionalHeader = /^[a-z][a-z0-9-]*(\([a-z0-9._/-]+\))?!?: .+$/;
const mergeHeader = /^Merge\b/;

function usage() {
  console.log(`Usage: node scripts/harness/check-conventional-commits.mjs [source]

Sources:
  --message <text>   Validate one message.
  --file <path>      Validate a commit message file, such as a commit-msg hook input.
  --env <name>       Validate a message from an environment variable.
  --range <range>    Validate git commit messages in a range.
  --last <n>         Validate the last n git commit messages. Defaults to 1.
`);
}

function parseArgs(argv) {
  const values = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      values.set(arg, true);
      continue;
    }
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const value = argv[++i];
    if (!value) throw new Error(`${arg} requires a value`);
    values.set(arg, value);
  }
  return values;
}

function gitLogMessages(args) {
  const output = execFileSync('git', ['log', '--format=%H%x1f%B%x1e', ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  return output
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha, ...messageParts] = record.split('\x1f');
      return { id: sha.slice(0, 12), message: messageParts.join('\x1f').trim() };
    });
}

function messagesFromArgs(values) {
  if (values.has('--message')) {
    return [{ id: 'message', message: values.get('--message') }];
  }

  if (values.has('--file')) {
    return [{ id: values.get('--file'), message: readFileSync(values.get('--file'), 'utf8') }];
  }

  if (values.has('--env')) {
    const name = values.get('--env');
    return [{ id: name, message: process.env[name] || '' }];
  }

  if (values.has('--range')) {
    const range = values.get('--range');
    if (/^0{40}\.\./.test(range)) {
      return gitLogMessages(['-1', range.split('..')[1]]);
    }
    return gitLogMessages([range]);
  }

  const count = values.get('--last') || '1';
  return gitLogMessages([`-${count}`]);
}

function validateMessage({ id, message }) {
  const lines = message.replace(/\r\n/g, '\n').split('\n');
  const header = lines[0]?.trim() || '';
  const failures = [];

  if (!header) {
    failures.push(`${id}: message subject is empty`);
    return failures;
  }

  if (mergeHeader.test(header)) return failures;

  if (!conventionalHeader.test(header)) {
    failures.push(`${id}: subject must match Conventional Commits format: type(scope): summary`);
  }

  if (lines.length > 1 && lines[1] !== '') {
    failures.push(`${id}: body or footers must begin after a blank line`);
  }

  return failures;
}

try {
  const values = parseArgs(process.argv.slice(2));
  if (values.has('--help') || values.has('-h')) {
    usage();
    process.exit(0);
  }

  const messages = messagesFromArgs(values);
  const failures = messages.flatMap(validateMessage);

  if (failures.length > 0) {
    console.error('Conventional commit checks failed:');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exit(1);
  }

  console.log(`Conventional commit checks passed (${messages.length} message${messages.length === 1 ? '' : 's'}).`);
} catch (error) {
  console.error(`Conventional commit check failed: ${error.message}`);
  process.exit(1);
}
