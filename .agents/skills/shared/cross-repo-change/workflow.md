# Cross-Repo Change Workflow

Use this deterministic workflow when coordinating work across AcornOps child
repositories.

## Workspace Status

Run from the parent workspace:

```bash
./scripts/workspace/status.mjs
```

Treat existing dirty child repo changes as user work unless the current task
clearly created them.

## Branching

- Use one branch slug across all affected repos.
- Prefer `feat/<short-topic>` for features, `fix/<short-topic>` for defects,
  `docs/<short-topic>` for documentation-only work, and `chore/<short-topic>`
  for harness or maintenance changes.
- Do not branch untouched repos.
- Use `./scripts/workspace/branch.mjs <branch-slug> <repo...>` for matching branches.

## Change Set

Create a change-set record when more than one child repo is affected:

```bash
./scripts/workspace/change-set.mjs <slug> <repo...>
```

## Validation

- Run each affected repo's canonical validation from `workspace.yaml` or the
  repo-local `AGENTS.md`.
- Use `./scripts/workspace/validate.mjs <repo...>` to run configured repo checks.
- Use `acornops-contract-change` when contract manifests, client/server API
  shapes, or cross-service interfaces change.
- Run `node scripts/harness/check-platform-contracts.mjs` when contract artifacts
  or integration boundaries change.
- Run `node scripts/harness/check-platform-harness.mjs` when harness files or shared
  skills change.

## Handoff

Report:

- affected repos and why
- branch slug and per-repo branch names
- exact validation commands and outcomes
- related PRs or planned PRs
- required merge order
- docs impact and residual risk
