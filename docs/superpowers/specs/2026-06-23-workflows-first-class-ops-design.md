# Workflows First-Class Ops Design

## Goal

Make Workflows a first-class configurable AcornOps capability: an operator can launch a workflow from the workspace or directly from a selected cluster, answer required inputs, review the server-compiled access scope, execute governed steps through control-plane, execution-engine, and llm-gateway, then review run history, approvals, and output. Owners/admins can also create and configure new workflows, including workflow inputs, MCP servers, MCP tools, enabled skills, approval gates, and output formats.

## Scope

Affected repositories:

- `management-console`: operator UI, workflow authoring, workflow chat, MCP server configuration, access scope, run history, approval/output review.
- `control-plane`: public workflow APIs, user-authored and system template workflow definitions, sessions, server-side authorization, compiled permissions, workflow-scoped MCP inventory, run snapshots, audit events, execution dispatch.
- `execution-engine`: workspace-scoped run bootstrap, context fetch, LLM/tool execution without requiring a fake target.
- `llm-gateway`: run-scoped JWT validation and request authorization for workspace-scoped workflow runs.
- Contract docs/manifests in the same repositories.

Out of scope for the first implementation slice:

- External production MCP implementations for every sample workflow.
- Replacing existing Kubernetes/VM target chat, target runbooks, or target run execution paths.

## Architecture

Workflow runs extend the existing governed run path instead of creating a parallel executor. The control plane owns workflow templates, user-authored workflow definitions, workflow sessions, workflow messages, compiled workflow grants, workflow-scoped MCP server records, run creation, run-scoped JWT minting, approvals, and audit events. Execution-engine continues to fetch a bootstrap snapshot and invoke llm-gateway, but the snapshot can now describe `scope.type = "workspace"` with workflow identifiers and optional step target bindings. Llm-gateway enforces exactly what the signed token allows and never infers workflow access from management-console state.

The first vertical slice proves three workflow families with the same generic model:

- cluster triage: a user launches triage directly from a selected Kubernetes cluster, so the first step has a target binding for that cluster and the workflow can read cluster resources, health, events, and chat context according to compiled grants.
- operations: a user selects a repository and asks AcornOps to add or update configuration in that repository, with write-capable tools gated by approval.
- incident report generation: a user selects cluster chat sessions and output format, then AcornOps reads approved chat history and generates a PDF incident report.

The product should not center an "audit workspace" workflow as the primary example. Audit can remain a template later, but the first examples should map to triage, operations, and incident-report work.

## Data Model

Workflow definitions are workspace-scoped records with:

- identity: `id`, `workspaceId`, `name`, `description`, `status`, `version`, `source`, `templateId`, `createdBy`, `updatedAt`.
- inputs: typed required launch fields with option sources. Use dropdown-backed types wherever values are known: cluster, repository, MCP server, MCP tool, skill, chat session, output format, approval policy, retention, and runtime. Free-text inputs are reserved for prompts, descriptions, and custom values.
- workflow scope: enabled MCP servers and enabled skills. These are configured once for the workflow, not repeated on every step.
- steps: ordered step definitions with `id`, `title`, `prompt`, `requiredInputs`, `targetBinding`, `allowedTools`, `contextGrants`, `approvalRequired`, and `outputArtifacts`.
- policy: `mode`, `maxRuntime`, `retention`, `approvalRequirements`.
- presentation: category, tags, launch copy, starter prompt.

Workflow-scoped MCP servers use the same conceptual model as the current MCP servers page:

- inventory: server name, URL, enabled state, health/discovery status, last discovery, tool counts, and read/write capability counts.
- add/edit form: server name, server URL, auth type, secret/header fields, enabled switch, public headers, connection test, and post-create tool review.
- tool grants: per-server tool list with read/write labels and switches, filtered/searchable when possible.
- storage boundary: credentials stay in the MCP server store. Workflow definitions reference MCP server ids and selected tool names, not raw credentials.

Workflow configuration should reuse the MCP server configuration vocabulary and components where practical. Do not represent MCP configuration as comma-separated text boxes if the server, tool, or capability list is known.

Workflow sessions are separate from target chat sessions. A session freezes the workflow version so later workflow edits do not alter in-flight or historical runs. Workflow messages belong to workflow sessions and are never mixed with Kubernetes or VM target chat messages.

Compiled access scope is a server-generated object attached to the workflow session/run:

- role capabilities used to authorize launch.
- required workflow permissions.
- effective policy mode.
- allowed MCP servers and allowed tools.
- allowed tool operations.
- enabled skills.
- context grants and approved chat-history references.
- approval gates.
- JWT claims that will be minted for execution.

## API Contract

Public browser routes:

- `GET /api/v1/workspaces/{workspaceId}/workflows`
- `POST /api/v1/workspaces/{workspaceId}/workflows`
- `GET /api/v1/workflows/{workflowId}`
- `PATCH /api/v1/workflows/{workflowId}`
- `DELETE /api/v1/workflows/{workflowId}`
- `GET /api/v1/workflows/{workflowId}/sessions`
- `POST /api/v1/workflows/{workflowId}/sessions`
- `POST /api/v1/workflow-sessions/{sessionId}/messages`
- `GET /api/v1/workspaces/{workspaceId}/workflow-options`
- `GET /api/v1/workspaces/{workspaceId}/mcp/servers`
- `POST /api/v1/workspaces/{workspaceId}/mcp/servers`
- `PATCH /api/v1/workspaces/{workspaceId}/mcp/servers/{serverId}`
- `DELETE /api/v1/workspaces/{workspaceId}/mcp/servers/{serverId}`
- `POST /api/v1/workspaces/{workspaceId}/mcp/servers/{serverId}/test-connection`
- `GET /api/v1/workspaces/{workspaceId}/mcp/servers/{serverId}/tools`

Creation, update, and deletion routes must be implemented for workflow definitions in the first configurable slice. Server-provided templates are seed data, not the only source of workflows. The workflow options route provides dropdown sources for clusters, repositories, MCP servers, tools, skills, chat sessions, output formats, approval policies, runtime limits, and retention values.

Execution contracts:

- control-plane to execution-engine `POST /api/v1/runs` accepts `scope_type = "workspace"` and optional `target_id`/`target_type`.
- execution-engine bootstrap accepts `scope.type = "workspace"`, `workflow_id`, `workflow_session_id`, `workflow_run_id`, and `workflow_step_id`.
- llm-gateway JWT claims include `scope.type`, `workflow_id`, `workflow_run_id`, `workflow_step_id`, allowed tools, allowed tool operations, and context grants.
- target-bound steps can include `target_id` and `target_type`; pure workspace steps must omit target scope.

## Authorization

The browser never decides workflow permissions. Control-plane compiles workflow access from:

- workspace membership role capabilities.
- workflow required permissions.
- workflow policy mode.
- step-level MCP/tool grants.
- configured context/chat-history grants.
- approval gates.

Operators can run permitted workflows. Owners/admins can create, edit, pause, and delete user-authored workflow definitions and configure workflow MCP scope. Workflow launches fail closed when the current user lacks required capabilities, when a context grant references unavailable data, when a write workflow lacks `create_read_write_runs`, when a selected MCP server is unavailable, or when a selected tool is not enabled for that workflow scope.

## Auditability

The control plane writes workspace audit events for:

- workflow session created.
- workflow definition created/updated/paused/deleted.
- workflow input/message submitted.
- workflow access scope compiled.
- workflow run created.
- workflow approval requested/decided/expired.
- workflow run completed/failed/cancelled.
- workflow MCP server created/updated/deleted/tested.
- workflow MCP tool grant changed.

Audit metadata must not include raw message bodies, auth headers, provider credentials, or full tool arguments. Metadata may include workflow id, session id, run id, step id, policy mode, tool names, MCP server ids, context grant keys, and success/failure state.

## UI Behavior

The Workflows page becomes API-backed and configurable. The operator can search workflow templates and saved workflows, create a new workflow, edit its prompt and scoped configuration, start or resume a workflow session, answer required inputs in workflow chat, review the compiled access scope, and launch the run. Run history, approval state, and output are loaded from the workflow APIs. The UI must keep Workflows as a workspace route and must not reuse target runbook routes or target chat history.

The primary workflow entry points are:

- cluster triage from a selected cluster: the cluster detail surface exposes a workflow action that opens the triage workflow with the cluster preselected.
- operations from the workspace workflow library: repository and operation type are selected from dropdowns populated by the server.
- incident reports from chats: chat sessions are selected from an approved list, the output format defaults to PDF, and the generated artifact is visible in run output.

Authoring UX requirements:

- Use "Add workflow" as a first-class action. Avoid copy that implies workflows are only "server-defined."
- Do not expose a separate "Workflow definition" tab. The user-facing model is prompt plus configuration; the persisted workflow definition is an internal API/storage concern.
- Use dropdowns, searchable selects, switches, segmented controls, and tables for known choices. Free-form text is acceptable for prompts and descriptions only.
- The MCP configuration section should look and behave like the current MCP servers page: inventory summary, searchable/filterable server list, add/edit server dialog, connection test, enabled switch, and post-create tool review.
- Skill selection is a searchable multi-select sourced from installed workspace skills. The UI should show skill name, source, and scope, not require users to type skill ids from memory.
- Step configuration should progressively disclose advanced tool/context grants so common workflows can be configured without seeing every low-level field at once. MCP server and skill selection belongs in the workflow-level configuration area.

## Validation

Focused validation must include:

- management-console workflow route/API mapping tests.
- management-console workflow authoring, dropdown option, cluster triage launch, MCP server configuration, and artifact-output tests.
- control-plane workflow API, authorization, access-scope compilation, audit, and contract tests.
- execution-engine workspace-scope model/bootstrap tests.
- llm-gateway workflow JWT claim and scope mismatch tests.
- platform contract checks from the workspace root.

Completion requires an end-to-end operator launch path, not only static UI or contract prose.
