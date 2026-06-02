# Agent Skills

Additional agent workflows live under this directory.

```text
.agents/skills/shared  # synced from acornops-workspace
.agents/skills/local   # owned by this repository
```

Tools may not automatically discover nested skills. The repository `AGENTS.md`
should point agents here and instruct them to open the relevant `SKILL.md` when a
task matches a skill description.

Do not edit `.agents/skills/shared` directly in product repositories. Change
shared skills in the parent AcornOps workspace, sync them, review the diff, and
commit the destination repository separately.
