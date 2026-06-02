# Workspace Agent Harness Development

## Scope

The parent workspace repository owns shared AcornOps agent harness standards,
reusable skills, repository templates, workspace validation, and sync tooling.

It does not own repository-specific architecture, contracts, product behavior, or local validation commands.

## Local Development

Bootstrap missing child repositories:

```bash
task setup
task workspace:bootstrap -- --dry-run
./scripts/workspace/bootstrap.mjs --dry-run
./scripts/workspace/bootstrap.mjs
```

Check local tools, remotes, and checkout readiness:

```bash
./scripts/workspace/doctor.mjs
```

Validate standards:

```bash
./scripts/harness/check-agent-harness.sh
```

Or with Task:

```bash
task validate
```

Preview shared skill sync:

```bash
./scripts/sync/shared-skills.sh --dry-run
```

Apply shared skill sync:

```bash
./scripts/sync/shared-skills.sh
```

## Change Rules

- Update templates when changing required repository harness shape.
- Update `scripts/harness/check-agent-harness.sh` when adding required template files or policy text.
- Update `docs/agent-harness/harness-adoption-guide.md` when the product-repo adoption model changes.
- Do not put product-specific decisions in the parent workspace repository.

## Documentation Harness

The workspace repo is the upstream source for doc structure. Product repos should enforce the adopted structure with their own `harness:check` or `task harness-test` command.

## Documentation Drift Control

Treat documentation as part of feature acceptance. When a standards change affects repo shape, shared skills, validation flow, agent handoff, sync behavior, or required files, update the relevant docs and templates in the same change.

If docs are intentionally unchanged, record `Docs impact: none` and the reason in handoff evidence.
