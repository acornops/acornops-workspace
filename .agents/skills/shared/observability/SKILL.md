---
name: acornops-observability
description: Preserve diagnosability by validating logs, metrics, health checks, and runtime event signals. Use for API behavior changes, worker/queue updates, streaming paths, retries, or timeout modifications.
---

# Inputs

- changed runtime paths and failure modes
- existing telemetry points and health endpoints
- runbooks or incident context

# Procedure

1. Identify success, failure, timeout, and retry paths affected.
2. Validate structured logs and correlation identifiers.
3. Validate metrics for throughput, latency, and errors.
4. Verify health/readiness behavior under new dependencies.
5. Document telemetry gaps and remediation plan.

# Outputs

- observability impact summary
- telemetry checklist and uncovered gaps
- follow-up instrumentation actions
