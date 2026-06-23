# Codex Goals Workflow

Use this workflow to turn uncertain AcornOps work into a strong Codex `/goal` only when a persistent objective is a better fit than a normal prompt. A Goal is thread-scoped durable state with lifecycle controls and evidence-based completion, not global memory, project instructions, or unbounded autonomy.

## Decision Rule

Use a Goal when the task has all three properties:

- A durable objective that should persist across turns.
- An evidence-based finish line such as tests, benchmarks, logs, generated artifacts, command output, reports, or inspectable source material.
- An uncertain path that may require several rounds of investigation, implementation, measurement, or repair.

Prefer a normal prompt for one-line edits, simple explanations, short code reviews, direct questions, or any request where one answer should be enough.

Do not use a Goal when the finish line is vague. First tighten requests like "make this better" or "refactor this code" into a specific end state, evidence surface, and constraints.

## Drafting Steps

1. Restate the desired end state in one concrete sentence.
2. Identify the verification surface that can prove or falsify completion.
3. Name constraints that must remain intact, including correctness, public APIs, contracts, security posture, docs accuracy, operational visibility, or performance budgets.
4. Set boundaries for files, repositories, data, tools, external services, and time or token budgets.
5. Define the iteration policy: how Codex should choose the next useful action after each failed or partial attempt.
6. Define the blocked stop condition: when Codex should stop, what evidence it should report, and what user input would unlock progress.
7. Return a single copy-ready `/goal` command unless the user asks for alternatives.

Use this structure:

```text
/goal <desired end state> verified by <specific evidence> while preserving <constraints>. Use <allowed inputs, tools, or boundaries>. Between iterations, <how Codex should choose the next best action>. If blocked or no valid paths remain, <what Codex should report and what would unlock progress>.
```

## Lifecycle Guidance

Mention lifecycle commands only when useful to the user's task:

```text
/goal        View the current Goal
/goal pause  Pause an active Goal
/goal resume Resume a paused Goal
/goal clear  Remove the current Goal
```

Treat completion as evidence-based. Do not mark or describe a Goal as complete unless the objective has been checked against concrete evidence. If a budget is reached, stop substantive work, summarize progress and blockers, and name the next useful step; budget exhaustion is not completion.

## Strong Goal Patterns

Performance:

```text
/goal Reduce p95 checkout latency below 120 ms, verified by the checkout benchmark, while keeping the correctness suite green. Use only the checkout service, benchmark fixtures, and related tests. Between iterations, record what changed, what the benchmark showed, and the next best experiment to try. If the benchmark cannot run or no valid paths remain, stop with the attempted paths, evidence gathered, blocker, and next input needed.
```

Flaky test:

```text
/goal Fix or explain the flaky checkout test with evidence, verified by reproducing the failure or by repeated passing runs of the relevant test command after a targeted fix. Preserve public API behavior and avoid broad unrelated refactors. Between iterations, inspect the newest failure evidence, form the smallest plausible hypothesis, test it, and record the result. If the failure cannot be reproduced or no defensible fix remains, stop with attempted paths, logs, remaining uncertainty, and the input needed to continue.
```

Documentation:

```text
/goal Produce a docs page for the feature that explains lifecycle, command surface, and two examples, verified by the local docs build and by checking every referenced command against current behavior. Preserve existing docs style and do not change unrelated pages. Between iterations, fix the highest-confidence build or accuracy issue first. If command behavior cannot be verified, stop with the unverified claims, evidence gathered, and the command output or product detail needed.
```

Research:

```text
/goal Produce the strongest evidence-backed reproduction of the target result using available materials and local resources. Attempt feasible headline claims, verify outputs where possible, and end with a report separating confirmed findings, approximate reconstructions, blocked claims, and remaining uncertainty. Between iterations, map each claim to the best available evidence and test the highest-value unresolved claim next. If exact replay is impossible, stop with the missing materials, proxy evidence, and what would be needed for stronger proof.
```

## Quality Checks

Before giving the user a Goal, check that it:

- Names a measurable or auditable outcome.
- Identifies the evidence Codex should use to decide completion.
- Preserves important constraints.
- Gives enough boundaries to avoid uncontrolled exploration.
- Leaves room for Codex to choose the next action when evidence changes.
- Defines what honest blockage or uncertainty looks like.

If key information is missing but a reasonable draft is still possible, make the assumption explicit and provide the draft. Ask a question only when the missing detail changes the completion standard or risk boundary materially.
