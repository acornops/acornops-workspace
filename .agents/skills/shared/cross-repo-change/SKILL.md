---
name: acornops-cross-repo-change
description: Coordinate AcornOps changes that touch more than one child repository. Use when a task spans multiple repos, needs a shared branch slug, requires related PRs with merge order, or needs workspace-level tracking. For API/schema/manifest boundary changes, also use acornops-contract-change. Do not use for single-repo implementation work unless it creates cross-repo coordination needs.
---

# Inputs

- user request and acceptance criteria
- `workspace.yaml`
- affected child repo `AGENTS.md` files
- current branch and dirty state for each affected repo
- contract, deployment, and validation impact

# Procedure

1. Identify affected repositories from `workspace.yaml` and confirm each is a child Git repo.
2. Inspect dirty state before editing; never overwrite unrelated user changes.
3. Choose one branch slug for all affected repos unless the user supplied one.
4. Read each affected repo's `AGENTS.md` before changing files there.
5. Map cross-repo dependencies, contract changes, deployment impact, and required merge order.
6. Invoke acornops-contract-change for API, schema, manifest, or other integration-boundary changes.
7. Run repo-local validation for every affected repo and platform checks when contracts or deployment paths changed.
8. Prepare handoff evidence with branch names, validation outcomes, related PR plan, merge order, docs impact, and residual risk.

# Outputs

- affected repository list with reason for inclusion
- shared branch slug and per-repo branch status
- cross-repo dependency and merge-order summary
- validation matrix with exact commands and outcomes
- PR coordination notes for acornops-open-pr
