# Testing Validation Workflow

1. Start with static checks (`typecheck`, `lint`, formatting checks).
2. Run repository unit tests.
3. Run integration tests when contracts, networking, or persistence change.
4. For deployment changes, run compose/manifests validation commands.
5. Record exact commands and non-zero exits.
6. Block completion when required checks fail.
7. Include skipped checks, reasons, and residual risk in handoff evidence.
