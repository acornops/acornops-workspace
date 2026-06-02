# Change Sets

Change sets track coordinated work across child repositories.

Use `scripts/workspace/change-set.mjs <slug> <repo...>` to create a draft under
`change-sets/active/`. Move completed records to `change-sets/completed/` when
the related PRs are merged.

Change-set files should record affected repositories, branch slug, related PRs,
merge order, validation evidence, docs impact, and residual risk.

Generated change-set markdown files are local coordination artifacts and are
ignored by default. Durable decisions should live in issues, pull requests,
repository docs, or an explicitly reviewed workspace commit.
