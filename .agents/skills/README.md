# AcornOps Workspace Skills

Shared skills in `.agents/skills/shared` are owned by the parent workspace repo.
Repo-local skills belong in each child repository under `.agents/skills/local`.
The parent workspace intentionally does not use `.agents/skills/local`; skills
kept here are syncable workspace skills unless documented otherwise.

Do not edit child repository `.agents/skills/shared` files directly. Update the
workspace copy, run `./scripts/sync/shared-skills.sh --dry-run`, review the
target repositories, then run the sync intentionally.

## Shared Skill Boundaries

- `contract-change`: API, schema, manifest, OpenAPI, DTO, generated-client, and
  cross-repository integration-boundary changes.
- `codex-goals`: drafting or refining Codex `/goal` commands with evidence,
  boundaries, iteration policy, and blocked stop conditions.
- `cross-repo-change`: branch, change-set, validation, merge-order, and PR
  coordination across multiple repositories.
- `observability`: logs, metrics, health checks, retries, timeouts, and runtime
  diagnosability.
- `open-pr`: per-repo commits, draft PRs, related PR links, and validation
  evidence.
- `pr-review`: structured pull request review and risk assessment.
- `security-baseline`: auth, secrets, RBAC, privileged operations, and unsafe
  defaults.
- `testing-validation`: choosing and running risk-appropriate validation after a
  change is implemented.
- `workspace-maintenance`: root workspace manifest, Taskfile, scripts, harness
  checks, templates, shared skills, CI policy, and setup/update tooling.
