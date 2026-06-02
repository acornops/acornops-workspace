---
name: acornops-target-boundary-design
description: Preserve AcornOps target model boundaries. Use when adding or changing target types such as Kubernetes clusters, VMs, or future runtimes; target registration, identity, health, credentials, capabilities, lifecycle, routing, UI/API naming, or deployment behavior. Do not use for changes that are purely internal to one existing target implementation with no shared target model impact.
---

# Inputs

- affected target concepts, APIs, UI flows, persistence models, deployment files, and runtime paths
- current Kubernetes cluster behavior and any proposed VM or future target behavior
- producer/consumer repositories from `workspace.yaml` when the boundary crosses repositories
- compatibility requirements for existing cluster workflows

# Procedure

1. Identify whether each changed concept belongs to the shared target model, a Kubernetes-specific implementation, a VM-specific implementation, or a future extension point.
2. Build a short boundary table before editing shared model, API, or UI code.
3. Keep target-neutral language in shared surfaces unless the behavior is genuinely Kubernetes-only.
4. Preserve existing Kubernetes cluster compatibility or document the migration and rollout path.
5. Represent target-specific behavior as explicit capabilities instead of implicit type checks.
6. Check whether target model changes also require `acornops-contract-change`, `acornops-target-adapter-patterns`, `acornops-security-baseline`, or `acornops-observability`.
7. Record unsupported target behavior as explicit product or API behavior, not as an accidental runtime failure.

# Boundary Table

Use this format for target-sensitive changes:

```text
Concept                  Shared target model?   Kubernetes-specific?   VM-specific?   Notes
Identity/display name    yes                    no                     no             Stable user-facing target identity.
Credentials              interface              kubeconfig/service acct SSH/cloud auth Target-specific secret handling.
Health                   interface              agent heartbeat        VM probe/agent  Comparable status semantics.
Execution capability     capability             k8s runner/tooling     VM runner       Fail explicitly when unsupported.
Permissions              abstract policy        Kubernetes RBAC        OS/cloud policy Keep enforcement boundary clear.
```

# Outputs

- target boundary table with shared, Kubernetes-specific, VM-specific, and future-extension decisions
- compatibility and naming impact for existing cluster behavior
- contract, security, observability, and validation follow-ups
- explicit unsupported capability behavior and residual risks
