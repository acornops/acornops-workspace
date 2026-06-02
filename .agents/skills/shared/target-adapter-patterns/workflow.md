# Target Adapter Patterns Workflow

Use this workflow when a change introduces or modifies target-specific runtime
behavior for Kubernetes clusters, VMs, or future target types.

## Adapter Boundary

Target adapters should own:

- target-specific credential resolution
- target-specific API or SDK clients
- target-specific health probes and status translation
- target-specific lifecycle operations
- target-specific execution runners and tool implementations
- target-specific deployment or bootstrap operations

Shared orchestration should own:

- target lookup and authorization inputs
- capability selection and dispatch
- common request/response shapes
- run lifecycle coordination
- audit, telemetry, and error semantics
- fallback behavior for unsupported capabilities

## Required Checks

1. Locate the narrowest existing service, runner, or client boundary.
2. Add a target adapter interface before adding a second target implementation
   to shared orchestration code.
3. Keep the type dispatch near composition or routing code; do not scatter
   `target.type` checks across unrelated services.
4. Translate SDK/runtime errors into shared error semantics at the adapter
   boundary.
5. Add a fake or test adapter for shared orchestration tests.
6. Add target-specific tests for adapter behavior, especially credentials,
   unsupported capabilities, and failure translation.

## Handoff Evidence

Include:

- adapter interface or boundary used
- dispatch location
- target-specific files changed
- fake/test adapter coverage
- unsupported capability and error behavior
- validation commands and skipped checks
