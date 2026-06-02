# Shared Skill Sync Strategy

`scripts/sync/shared-skills.sh` distributes workspace-owned shared skills into
configured child repositories.

Preview changes first:

```bash
./scripts/sync/shared-skills.sh --dry-run
```

Apply changes:

```bash
./scripts/sync/shared-skills.sh
```

## What It Syncs

```text
.agents/skills/shared/ -> <repo>/.agents/skills/shared/
```

The destination shared directory is replaced with `rsync --delete` so removed
shared skills disappear from product repositories.

After syncing, the script writes:

```text
<repo>/.agents/skills/shared/.standards-version
```

This records the workspace repository and git revision used for the sync.

## What It Does Not Sync

- repo-local `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/`
- `scripts/`
- `.agents/skills/local`
- CI workflows
- repository contracts

Those files are repository-owned and should be changed intentionally in each
standalone GitHub repository.

## Recommended Repo Setup

Each product repository should have:

```text
.agents/skills/shared  # generated from this repo
.agents/skills/local   # owned by the product repo
```

Do not edit files under `.agents/skills/shared` inside product repos. Make shared
changes in the parent workspace repo, sync, review diffs, then commit each
product repository separately.
