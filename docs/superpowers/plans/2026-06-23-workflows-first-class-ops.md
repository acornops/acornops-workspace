# Workflows First-Class Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an API-backed, user-configurable workflow launch/run/review/authoring path across management-console, control-plane, execution-engine, and llm-gateway while preserving target chat/runbook separation and server-side authorization.

**Architecture:** Extend the existing governed run path with an explicit workspace workflow scope instead of faking a Kubernetes/VM target. Control-plane owns workflow templates, user-authored definitions, workflow-scoped MCP servers, sessions, compiled grants, JWT claims, audit events, and execution dispatch. Execution-engine and llm-gateway accept and enforce signed workspace workflow scope while keeping existing target-scope behavior unchanged.

**Tech Stack:** TypeScript/Express/Postgres-style repository patterns in `control-plane`, React/Vite/Vitest in `management-console`, Python/FastAPI/Pydantic/Pytest in `execution-engine` and `llm-gateway`, AcornOps contract docs/manifests.

---

## File Structure

- Create `control-plane/src/types/workflows.ts`: public workflow API/domain shapes.
- Create `control-plane/src/services/workflow-access.ts`: server-side workflow permission and grant compiler.
- Create `control-plane/src/store/repository-workflows.ts`: workflow templates, user-authored definitions, sessions, messages, workflow MCP server references, and run linkage storage facade.
- Create `control-plane/src/controllers/workflows-controller.ts`: public workflow route handlers.
- Create `control-plane/src/routes/workflows.ts`: workflow routes mounted by `src/app.ts` or the existing route index.
- Modify control-plane MCP server store/controllers as needed: add workspace-scoped MCP server inventory routes parallel to existing target MCP server routes.
- Modify `control-plane/src/services/token-service.ts`: add scope type and workflow claims to run JWT signing/verification.
- Modify `control-plane/src/controllers/internal-execution-controller.ts`: bootstrap workflow runs from compiled workflow scope.
- Modify `control-plane/src/services/execution-engine-client.ts`: dispatch workspace workflow run scope without target fields.
- Modify `control-plane/src/types/domain.ts`: add workflow audit/event/scope types where needed.
- Modify `execution-engine/execution_engine/models.py`, `run_registry.py`, `app.py`, `worker.py`, `gateway_client.py`, and `agent/tools.py`: support `scope.type = "workspace"` with optional target fields.
- Modify `llm-gateway/app/auth/claims.py`, `app/api/handlers_llm_stream.py`, and `app/api/handlers_tool_call.py`: validate workflow-scope JWTs and reject mismatched scope.
- Create `management-console/src/services/control-plane/workflowApi.ts`: workflow client and mappers.
- Modify `management-console/src/pages/workflows/workflowModel.ts` and `WorkspaceWorkflowsPage.tsx`: consume API definitions/sessions/runs, support add/edit workflow authoring, and use dropdown-backed configuration.
- Modify `management-console/src/features/kubernetes-cluster-detail/...`: expose cluster triage workflow launch from a selected cluster.
- Reuse/refactor MCP server UI components from `management-console/src/features/kubernetes-cluster-detail/components/detail/views/McpServers*` for workflow-scoped MCP server configuration.
- Update contract docs/manifests in `management-console`, `control-plane`, `execution-engine`, and `llm-gateway`.

## Task 1: Control-Plane Workflow Access Compiler

**Files:**
- Create: `control-plane/src/services/workflow-access.test.ts`
- Create: `control-plane/src/services/workflow-access.ts`
- Create: `control-plane/src/types/workflows.ts`

- [ ] **Step 1: Write the failing test**

Add tests proving that an operator can run a read-only workflow, cannot run a write workflow without `create_read_write_runs`, and receives a deterministic compiled access scope containing permissions, MCP/tool grants, context grants, approval gates, and JWT claim preview.
Also cover a target-bound cluster triage step, a repository operation step, and an incident-report step that grants selected chat history and PDF output artifact creation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/services/workflow-access.test.ts`
Expected: fail because `compileWorkflowAccessScope` is not implemented.

- [ ] **Step 3: Implement the compiler**

Implement:

```ts
export function compileWorkflowAccessScope(input: CompileWorkflowAccessInput): CompiledWorkflowAccessScope
```

The function must fail closed for missing capabilities and must return sorted/deduplicated grants for stable UI, audit, and tests.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/services/workflow-access.test.ts`
Expected: pass.

## Task 2: Control-Plane Workflow Public API

**Files:**
- Create: `control-plane/src/controllers/workflows-controller.test.ts`
- Create: `control-plane/src/controllers/workflows-controller.ts`
- Create: `control-plane/src/routes/workflows.ts`
- Create: `control-plane/src/store/repository-workflows.ts`
- Modify: `control-plane/src/app.ts`
- Modify: `control-plane/src/store/repository.ts`

- [ ] **Step 1: Write failing route tests**

Cover:

- `GET /api/v1/workspaces/:workspaceId/workflows` returns system templates and user-authored workflow definitions only to users with workspace data access.
- `POST /api/v1/workspaces/:workspaceId/workflows` creates a user-authored workflow from dropdown-backed option ids.
- `PATCH /api/v1/workflows/:workflowId` updates editable workflow metadata, inputs, steps, policy, workflow-level enabled skills, workflow-level MCP servers, and tool grants.
- `DELETE /api/v1/workflows/:workflowId` deletes or archives user-authored workflows while rejecting deletion of system templates.
- `POST /api/v1/workflows/:workflowId/sessions` creates a workflow session, freezes definition version, compiles access, writes audit event, and returns session plus compiled scope.
- `POST /api/v1/workflow-sessions/:sessionId/messages` stores workflow-chat input separately from target sessions and creates a governed run when required inputs are complete.
- `GET /api/v1/workspaces/:workspaceId/workflow-options` returns dropdown sources for clusters, repositories, MCP servers, MCP tools, skills, chat sessions, output formats, approval policies, runtime limits, and retention values.

- [ ] **Step 2: Run route tests to verify failure**

Run: `npm run test -- src/controllers/workflows-controller.test.ts`
Expected: fail because routes and repository methods do not exist.

- [ ] **Step 3: Implement in-memory/dev-backed workflow repository facade**

Use deterministic seeded templates plus user-authored definitions first so API behavior is real while persistent migrations can follow. Replace the old workspace-audit-centered default with templates for cluster triage, repository operations, and incident report generation. Keep the repository boundary shaped for later SQL storage.

- [ ] **Step 4: Implement route handlers and mount routes**

Handlers must use existing `requireWorkspaceDataRead`, capability checks, CSRF/session middleware, audit helpers, and run dispatch helpers. They must not read or write target chat tables for workflow sessions.
Authoring handlers must require owner/admin workflow-management capability, validate option ids against server-provided option sources, and reject free-form MCP server/tool/skill ids when a known option source exists.

- [ ] **Step 5: Implement workflow option sources**

Expose cluster, repository, MCP server, tool, skill, chat-session, output-format, approval-policy, runtime, and retention options through `GET /api/v1/workspaces/:workspaceId/workflow-options`. Returned options must include stable `value`, display `label`, and optional `description`, `disabled`, and `disabledReason`.

- [ ] **Step 6: Run focused API tests**

Run: `npm run test -- src/controllers/workflows-controller.test.ts src/services/workflow-access.test.ts`
Expected: pass.

## Task 2A: Control-Plane Workspace MCP Server Configuration

**Files:**
- Create/modify: control-plane MCP server controller tests for workspace-scoped routes
- Modify: control-plane MCP server route/controller/store modules used by target MCP servers
- Modify: `control-plane/src/types/workflows.ts`

- [ ] **Step 1: Write failing workspace MCP route tests**

Cover:

- `GET /api/v1/workspaces/:workspaceId/mcp/servers` returns workflow-visible MCP servers.
- `POST /api/v1/workspaces/:workspaceId/mcp/servers` creates a workspace-scoped MCP server with name, URL, auth, enabled state, and public headers.
- `PATCH /api/v1/workspaces/:workspaceId/mcp/servers/:serverId` updates metadata, auth, enabled state, and public headers.
- `POST /api/v1/workspaces/:workspaceId/mcp/servers/:serverId/test-connection` returns connection health.
- `GET /api/v1/workspaces/:workspaceId/mcp/servers/:serverId/tools` returns discovered tools with read/write labels.

- [ ] **Step 2: Run tests to verify failure**

Run the focused control-plane MCP server test command for the touched controller.
Expected: fail because workspace-scoped MCP routes do not exist yet.

- [ ] **Step 3: Implement workspace MCP routes by reusing target MCP semantics**

Keep credentials in the MCP server store and expose only ids/tool names to workflow definitions. Preserve existing target MCP server routes unchanged.

- [ ] **Step 4: Run focused MCP tests**

Run the same focused test command.
Expected: pass.

## Task 3: Run JWT Workflow Scope

**Files:**
- Modify: `control-plane/src/services/token-service.test.ts`
- Modify: `control-plane/src/services/token-service.ts`
- Modify: `llm-gateway/test/test_jwt_validator_service.py`
- Modify: `llm-gateway/app/auth/claims.py`

- [ ] **Step 1: Write failing token tests**

Control-plane tests must assert signed workflow tokens include `scope.type = "workspace"`, `workflow_id`, `workflow_run_id`, `workflow_step_id`, allowed tools, allowed operations, and context grants. Gateway tests must parse the same claims.

- [ ] **Step 2: Run token tests to verify failure**

Run:

```bash
npm run test -- src/services/token-service.test.ts
pytest test/test_jwt_validator_service.py -q
```

Expected: fail because workflow claims are unsupported.

- [ ] **Step 3: Implement token shape**

Add a discriminated run scope:

- target run: existing required target fields.
- workflow run: required workflow fields and optional target binding.

- [ ] **Step 4: Run token tests**

Run the same commands. Expected: pass.

## Task 4: Execution-Engine Workspace Scope

**Files:**
- Modify: `execution-engine/tests/test_unit.py`
- Modify: `execution-engine/tests/test_integration.py`
- Modify: `execution-engine/execution_engine/models.py`
- Modify: `execution-engine/execution_engine/run_registry.py`
- Modify: `execution-engine/execution_engine/app.py`
- Modify: `execution-engine/execution_engine/worker.py`
- Modify: `execution-engine/execution_engine/gateway_client.py`
- Modify: `execution-engine/execution_engine/agent/tools.py`

- [ ] **Step 1: Write failing workspace-scope tests**

Cover accepting `POST /api/v1/runs` with `scope_type = "workspace"` and no target id/type, bootstrap scope comparison using workflow identifiers, and preserving existing target run behavior.

- [ ] **Step 2: Run engine tests to verify failure**

Run: `pytest tests/test_unit.py tests/test_integration.py -q`
Expected: fail on required target fields.

- [ ] **Step 3: Implement workspace scope**

Make target fields optional only when `scope_type = "workspace"`. Existing target runs must still require target id/type and keep the current idempotency key semantics.

- [ ] **Step 4: Run engine tests**

Run: `pytest tests/test_unit.py tests/test_integration.py -q`
Expected: pass.

## Task 5: LLM Gateway Workflow Scope Enforcement

**Files:**
- Modify: `llm-gateway/test/test_llm_stream.py`
- Modify: `llm-gateway/test/test_tool_call.py`
- Modify: `llm-gateway/app/api/handlers_llm_stream.py`
- Modify: `llm-gateway/app/api/handlers_tool_call.py`

- [ ] **Step 1: Write failing authorization tests**

Cover workflow-scope LLM stream allowed by matching token/request scope, rejected when workflow id/run id/step id differs, and tool-call enforcement using allowed tools without target headers for pure workspace steps.

- [ ] **Step 2: Run gateway tests to verify failure**

Run: `pytest test/test_llm_stream.py test/test_tool_call.py -q`
Expected: fail because handlers require target scope.

- [ ] **Step 3: Implement workflow scope checks**

Handlers must compare request body to token workflow claims and only include target metadata for target-bound workflow steps.

- [ ] **Step 4: Run gateway tests**

Run: `pytest test/test_llm_stream.py test/test_tool_call.py -q`
Expected: pass.

## Task 6: Management Console API-Backed Workflows

**Files:**
- Create: `management-console/src/services/control-plane/workflowApi.test.ts`
- Create: `management-console/src/services/control-plane/workflowApi.ts`
- Modify: `management-console/src/pages/WorkspaceWorkflowsPage.test.ts`
- Modify: `management-console/src/pages/WorkspaceWorkflowsPage.tsx`
- Modify: `management-console/src/pages/workflows/workflowModel.ts`

- [ ] **Step 1: Write failing UI/client tests**

Tests must assert the page calls workflow APIs, renders compiled server access scope, collects required input messages, launches a workflow session/run, renders run history/output from API payloads, exposes "Add workflow", supports editing workflow metadata/steps/policy, configures MCP servers and skills at workflow scope, and uses server-provided dropdown options for clusters, repositories, MCP servers, MCP tools, skills, chat sessions, and output formats.

- [ ] **Step 2: Run UI tests to verify failure**

Run: `npm run test -- src/services/control-plane/workflowApi.test.ts src/pages/WorkspaceWorkflowsPage.test.ts`
Expected: fail because API client and live page behavior are missing.

- [ ] **Step 3: Implement workflow API client and page state**

Replace static-only behavior with API-backed data and keep static definitions only as a development fallback when the app is explicitly in mock mode. Seed the mock workflow library with cluster triage, repository operation, and incident report generation examples; do not make "audit workspace" the primary example.

- [ ] **Step 4: Implement workflow authoring UI**

Add an authoring path that lets owners/admins create and edit workflows. Use searchable selects/dropdowns for known fields; use text inputs only for name, description, prompt copy, and custom values. MCP servers and skills are selected once at workflow scope, while steps configure required inputs, allowed tools, context grants, approvals, and artifacts. Persist through `POST /api/v1/workspaces/:workspaceId/workflows` and `PATCH /api/v1/workflows/:workflowId`.

- [ ] **Step 5: Reuse MCP server configuration UI for workflow scope**

Refactor or wrap the existing MCP server inventory/add/edit/test/review components so workflow-scoped MCP configuration has the same interaction model as the current MCP servers page, including adding MCP servers.

- [ ] **Step 6: Add selected-cluster triage launch**

Expose a cluster detail action that opens the Workflows route with the triage workflow selected and the cluster id prefilled. The workflow session request must preserve that selected target binding rather than relying on client-only state.

- [ ] **Step 7: Run UI tests**

Run: `npm run test -- src/services/control-plane/workflowApi.test.ts src/pages/WorkspaceWorkflowsPage.test.ts`
Expected: pass.

## Task 7: Contracts, OpenAPI, and Platform Validation

**Files:**
- Modify: `control-plane/docs/contracts/README.md`
- Modify: `control-plane/docs/contracts/manifest.json`
- Modify: `management-console/docs/contracts/README.md`
- Modify: `management-console/docs/contracts/manifest.json`
- Modify: `execution-engine/docs/contracts/README.md`
- Modify: `llm-gateway/docs/contracts/README.md`
- Modify OpenAPI files under `control-plane/src/docs/openapi/` as needed.

- [ ] **Step 1: Update contracts from planned to active for implemented routes**

Document implemented list/create/update/delete/session/message/run behavior, workflow option sources, workspace-scoped MCP server routes, active workflow-scope JWT fields, and any remaining limitations.

- [ ] **Step 2: Run focused contract checks**

Run:

```bash
npm run contracts:check
python3 scripts/check-contracts.py
task contracts:check
```

in the affected child repos using their local command availability.

- [ ] **Step 3: Run workspace platform checks**

Run:

```bash
node scripts/harness/check-platform-contracts.mjs
./scripts/workspace/status.mjs
```

Expected: pass or report exact external dependency if a command cannot run.

## Task 8: End-to-End Focused Validation

**Files:**
- Modify validation scripts only if existing route/API smoke coverage needs the Workflows route.

- [ ] **Step 1: Run smallest meaningful checks after each fix**

Use targeted tests from the task that changed.

- [ ] **Step 2: Run repo validation**

Run:

```bash
npm run validate
task validate
```

for affected repos where prerequisites are available.

- [ ] **Step 3: Run operator path smoke**

Start the local management-console against a control-plane dev/stub backend that supports workflow APIs, then verify the Workflows route loads, a new workflow can be authored from dropdown-backed fields, workflow MCP server configuration can add/test/review a server, cluster triage launches with the selected cluster prefilled, incident report generation produces a PDF artifact entry, session creation works, compiled access scope appears, run history/output appears, and existing cluster/VM routes still load.

## Self-Review

- Spec coverage: tasks cover route launch, user workflow authoring, dropdown option sources, workflow-scoped MCP server configuration, cluster triage launch, repository operations, incident report PDF output, workflow chat input, compiled server access, run-scope JWTs, execution/gateway enforcement, UI history/output, approvals foundation, contracts, audit, and validation.
- Placeholder scan: no task relies on an unspecified "add tests" or "handle errors" placeholder; every task names behavior and commands.
- Type consistency: `scope.type`, `workflow_id`, `workflow_run_id`, `workflow_session_id`, and `workflow_step_id` are used consistently as the cross-service workflow identifiers.
