---
name: acornops-pr-review
description: Perform structured AcornOps reviews of existing pull requests across architecture, testing, documentation, and security. Use when asked to review a PR, inspect a diff, assess requested changes, or evaluate an integration-sensitive change. Do not use to commit, push, publish, or open PRs; use acornops-open-pr instead.
---

# Inputs

- pull request diff or changed files
- repository architecture and AGENTS guidance
- test and validation outputs

# Procedure

1. Classify changes by risk and impacted subsystem.
2. Validate architecture boundary alignment.
3. Verify tests and validation evidence for changed behavior.
4. Check docs, runbooks, and migration notes for contract changes.
5. Flag security, secret-handling, and rollback risks.

# Outputs

- review report ordered by severity
- blocking issues with remediation actions
- residual risks and test gaps
