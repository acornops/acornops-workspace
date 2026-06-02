#!/usr/bin/env node
import { gitOutput, loadWorkspace, repoStatus, workspaceRoot } from '../lib/workspace.mjs';

console.log('== workspace ==');
console.log(gitOutput(['status', '--short', '--branch'], workspaceRoot) || '(clean)');

for (const repo of loadWorkspace()) {
  console.log(`\n== ${repo.name} ==`);
  try {
    console.log(repoStatus(repo) || '(clean)');
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
  }
}
