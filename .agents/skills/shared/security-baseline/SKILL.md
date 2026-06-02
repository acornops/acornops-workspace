---
name: acornops-security-baseline
description: Enforce baseline AcornOps security controls for code and infrastructure changes. Use when auth, secrets, access control, RBAC, external integrations, or privileged operations are involved.
---

# Inputs

- changed files touching auth, secrets, permissions, and network boundaries
- runtime configuration and deployment manifests
- repository security and operational rules

# Procedure

1. Scan changes for secret exposure and unsafe defaults.
2. Validate authentication and authorization behavior.
3. Verify least-privilege access for services and RBAC.
4. Confirm dangerous operations require explicit opt-in.
5. Document security-impacting deltas and required remediations.

# Outputs

- security checklist with pass/fail controls
- blocking security findings and fixes
- follow-up hardening tasks
