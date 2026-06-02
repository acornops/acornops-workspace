# Repository Agent Entry Point

Use this file as a map, not as the full source of truth. Durable repository
knowledge belongs in the linked docs.

## Agent-Assisted Development

This repository supports human and agent-assisted development. When using a
coding agent directly inside this repo, start from this repository root and read
this file before editing files.

For work that touches multiple AcornOps repositories, start the agent from the
`acornops-workspace` root instead. The workspace root contains the cross-repo
manifest, shared skills, validation helpers, and PR coordination workflow.

## Start Here

- [Architecture](ARCHITECTURE.md)
- [Docs Index](docs/index.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Operations Guide](docs/OPERATIONS.md)
- [Contracts](docs/contracts/README.md)
- [Design Notes](docs/design-docs/index.md)
- [Product Scope](docs/product-specs/index.md)
- [Plans](docs/PLANS.md)
- [Agent Handoff](docs/AGENT_HANDOFF.md)
- [Quality Score](docs/QUALITY_SCORE.md)
- [Reliability Rules](docs/RELIABILITY.md)
- [Security Rules](docs/SECURITY.md)

## Component Map

- `src/`: replace with repository source layout
- `scripts/`: validation and maintenance scripts
- `docs/`: durable repository knowledge
- `docs/contracts/`: public and cross-service contracts

## Working Rules

- Treat `docs/` as the system of record for repository knowledge.
- Keep this file short. Push durable details into linked docs.
- If a change affects public or cross-service contracts, update contract docs and manifests.
- If a task spans multiple steps or decisions, create an execution plan in `docs/exec-plans/active/`.
- Shared skills live in `.agents/skills/shared`; repository-owned skills live in `.agents/skills/local`.
- Agent tools may not auto-discover nested skills. When a task matches a skill description, open the relevant `SKILL.md` from `.agents/skills/shared` or `.agents/skills/local` and follow it before editing.
- Do not edit files under `.agents/skills/shared` in this repository; update shared skills in the parent AcornOps workspace and sync them.
- Follow [Agent Handoff](docs/AGENT_HANDOFF.md) before final response, commit, or pull request handoff.
- Keep this harness vendor-neutral; do not add required vendor-specific instruction files.

## Required Validation

- Replace this list with exact repository commands.
- Include one canonical full validation command.
- Include unit, integration, contract, smoke, or platform checks required by risk.

## High-Risk Areas

- Replace with repository-specific risk areas.
- Include auth, persistence, deployment, migrations, user-facing UI, infrastructure, or external integrations when applicable.

## Documentation Hygiene

- Document new or changed features in the same change; if docs do not change, include `Docs impact: none` and the reason in handoff evidence.
- Update [docs/index.md](docs/index.md) when adding or moving durable knowledge.
- Keep [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and [docs/OPERATIONS.md](docs/OPERATIONS.md) current when setup or runtime behavior changes.
- Keep [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) current when lasting gaps are discovered.
- Keep [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md) current for deferred work.
