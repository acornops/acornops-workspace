# Agent Handoff

This repository follows the AcornOps vendor-neutral handoff policy.

## Before Handoff

Run the repository's canonical validation command before handing off work. Run
targeted unit, integration, contract, smoke, or platform checks when the change
touches behavior covered by those checks.

## Required Evidence

Every handoff must include:

- exact commands run
- pass or fail result for each command
- skipped checks and why they were skipped
- docs changed, or `Docs impact: none` with the reason
- residual risks or follow-up work
- commit hash, branch, or pull request link when applicable

## Commit Message Guidance

Use Conventional Commits 1.0.0 for commits and pull request titles:

```text
type(scope): summary
```

Recommended default types are `feat`, `fix`, `docs`, `refactor`, `test`,
`chore`, `ci`, `build`, `perf`, `style`, and `revert`.

Use `!` or a `BREAKING CHANGE:` footer for breaking changes.

Repository teams may document additional types when needed. Existing historical
commits are not rewritten, but new commits and pull request titles must follow
this convention.

## Vendor Neutrality

`AGENTS.md` is the repository-tracked agent entrypoint. Do not add required
vendor-specific instruction files such as `CLAUDE.md`, `.cursor/rules`, or
`GEMINI.md` as part of this repository's harness.
