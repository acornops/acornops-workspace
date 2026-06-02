# Agent Handoff Policy

This policy defines the vendor-neutral handoff contract for AcornOps agent work.
It applies to any coding agent or engineer working in an AcornOps repository.

## Before Handoff

Run the repository's canonical validation command before handing off work. Also
run targeted unit, integration, contract, smoke, or platform checks when the
change touches behavior covered by those checks.

Tests and CI gates are part of the harness. Markdown guidance tells agents what
matters; executable checks prove the work still satisfies the repository's
contracts.

## Handoff Evidence

Every handoff must report:

- exact commands run
- pass or fail result for each command
- skipped checks and the reason they were skipped
- residual risks or follow-up work
- commit hash, branch, or pull request link when applicable

Do not claim validation passed without naming the command that passed.

## Commit Message Guidance

Use Conventional Commits 1.0.0 for local commits and pull request titles:

```text
type(scope): summary
```

Recommended default types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `build`
- `perf`
- `style`
- `revert`

Examples:

```text
docs(harness): standardize agent handoff
ci(validation): enforce conventional PR titles
```

For breaking changes, use `!` after the type or scope, or include a
`BREAKING CHANGE:` footer.

Repositories may document additional types when the team needs them. Existing
historical commits are not rewritten, but new commits and pull request titles
must follow this convention.

## Vendor Neutrality

`AGENTS.md` is the repository-tracked agent entrypoint. Child repositories should
not add required vendor-specific instruction files such as `CLAUDE.md`,
`.cursor/rules`, or `GEMINI.md` as part of the standard harness.

The parent workspace may include thin vendor compatibility files, such as a
root `CLAUDE.md` that imports `AGENTS.md`, when they keep `AGENTS.md` as the
source of truth.
