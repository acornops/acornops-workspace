import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

const doc = read('docs/contracts/README.md');
const manifest = JSON.parse(read('docs/contracts/manifest.json'));

expect(typeof manifest.repo === 'string' && manifest.repo.length > 0, 'Manifest repo is required');
expect(manifest.version === 1, 'Manifest version must be 1');
expect(doc.includes('## Dependency Matrix'), 'Contract doc missing dependency matrix');
expect(doc.includes('## Shared Invariants'), 'Contract doc missing shared invariants');
expect(doc.includes('## Validation'), 'Contract doc missing validation section');

if (failures.length > 0) {
  console.error('Contract checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Contract checks passed.');
