# Shared Sync Strategy

The workspace has separate sync scripts for separate ownership surfaces:

- `scripts/sync/shared-skills.sh` syncs shared agent skills.
- `scripts/sync/github-templates.sh` syncs shared GitHub issue and pull request
  templates.

Keep these scripts separate so a change to one surface cannot accidentally
overwrite another.

## Shared Skill Sync

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

## GitHub Template Sync

`scripts/sync/github-templates.sh` distributes workspace-owned issue and pull
request templates into configured child repositories.

Preview changes first:

```bash
./scripts/sync/github-templates.sh --dry-run
```

Apply changes:

```bash
./scripts/sync/github-templates.sh
```

Limit sync to specific repositories by name:

```bash
./scripts/sync/github-templates.sh --dry-run docs-website control-plane
```

### What It Syncs

```text
.github/pull_request_template.md
.github/PULL_REQUEST_TEMPLATE/cross-repo.md
.github/PULL_REQUEST_TEMPLATE/docs-maintenance.md
.github/ISSUE_TEMPLATE/cross-repo-change.md
.github/ISSUE_TEMPLATE/docs-maintenance.md
```

`.github/pull_request_template.md` is the auto-loaded default pull request
template. Files under `.github/PULL_REQUEST_TEMPLATE/` are selected explicitly
by template name.

Synced templates intentionally avoid default labels and assignees. Labels,
assignees, branch protection, and repository settings remain child-repository
configuration.

### What It Does Not Sync

- `.github/workflows`
- branch protection or repository settings
- repository labels, milestones, projects, or assignees
- child-owned issue templates outside the allowlist
- child-owned pull request templates outside the allowlist
- generated release notes or discussion templates

The script copies only the allowlisted files and never runs `rsync --delete`
against child `.github` directories. Review child repository diffs before
committing synced template changes.

## Organization Defaults

GitHub supports a public organization-level `.github` repository for default
community health files, including issue and pull request templates. Those
defaults apply only when a repository does not define its own corresponding
template files.

AcornOps uses explicit sync for now because each child repository should carry
the active templates in its own history, and because synced files can be
reviewed with normal repository PRs. An organization-level `.github` repository
is still useful for future shared workflow templates, reusable workflows, and
fallback community health defaults.
