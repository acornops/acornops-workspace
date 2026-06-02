---
name: acornops-target-adapter-patterns
description: Keep AcornOps target-specific logic modular behind explicit adapters. Use when adding or changing Kubernetes, VM, or future target-specific SDK clients, credential handlers, health checks, lifecycle handlers, deployment backends, execution runners, capability implementations, or routing branches. Do not use for target-neutral refactors that do not touch adapter boundaries.
---

# Inputs

- shared orchestration path that calls target-specific behavior
- target type, capabilities, credentials, and lifecycle requirements
- existing adapter, runner, client, or service boundaries in the affected repo
- tests that cover shared orchestration and target-specific behavior

# Procedure

1. Keep shared orchestration target-neutral and capability-driven.
2. Put Kubernetes, VM, and future target-specific behavior behind explicit adapters, runners, or clients.
3. Avoid spreading target-type conditionals through business logic; centralize dispatch at the boundary.
4. Keep persistence records, API DTOs, and UI view models separate from provider SDK and runtime client types.
5. Define unsupported capability behavior at the adapter boundary.
6. Add or update fake/test adapters for shared orchestration tests.
7. Prefer small target adapters with clear inputs and outputs over shared helpers that know every target type.
8. Check whether target adapter changes also require `acornops-target-boundary-design`, `acornops-contract-change`, `acornops-security-baseline`, or `acornops-observability`.

# Outputs

- adapter boundary summary
- shared orchestration files and target-specific adapter files changed
- dispatch and unsupported-capability behavior
- fake/test adapter coverage
- validation commands and remaining target-specific risks
