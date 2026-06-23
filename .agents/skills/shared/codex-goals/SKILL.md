---
name: acornops-codex-goals
description: Draft and refine Codex Goals for AcornOps work from plain-language tasks. Use when a user asks to create, write, improve, evaluate, or decide whether to use a Codex `/goal`; when AcornOps work may need persistent multi-turn continuation; or when a task needs an evidence-based completion contract with verification, constraints, boundaries, iteration policy, and blocked stop conditions.
---

# Inputs

- plain-language task or existing `/goal` draft
- repository or workspace scope
- expected evidence source, if known
- constraints, budgets, and boundaries, if known

# Procedure

1. Decide whether a Goal fits the task.
2. Draft or refine the Goal using [workflow.md](workflow.md).
3. Prefer one copy-ready `/goal` command unless the user asks for alternatives.
4. Ask for missing details only when they materially change the completion standard or risk boundary.
5. Include lifecycle guidance only when it helps the user manage the active Goal.

# Outputs

- recommendation to use a Goal or a normal prompt
- copy-ready `/goal` command when a Goal is appropriate
- assumptions, missing evidence, or blocker conditions that affect the Goal
