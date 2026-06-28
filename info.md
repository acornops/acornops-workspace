# Agents and Workflows Production Direction

## Sidebar Structure

Workspace sidebar navigation should group primary resources by operator intent:

```text
Inventory
- Kubernetes
- Virtual Machines

Automation
- Agents
- Workflows
```

Kubernetes clusters and virtual machines remain infrastructure inventory: things
AcornOps inspects or operates on. Agents and workflows are workspace-level
automation resources.

## Product Model

Use this conceptual split:

- Infrastructure targets are operational objects: clusters, VMs, and future
  inventories.
- Agents are durable capability bundles with tools, MCP servers, skills, target
  scope, approval defaults, runtime identity, and audit history.
- Workflows are repeatable procedures that assign agents to work over selected
  targets or workspace context.

MCP servers, tools, and skills are configured on agents and inventory resources.
Workflows do not directly wire MCP servers, tools, or skills. A workflow selects
agents for explicit roles, then narrows those agents' capabilities for a
specific procedure or run.

The key production invariant is:

```text
effective runtime access =
  workflow permission envelope
  AND assigned agent derived capabilities
  AND target/resource permissions
  AND run mode
  AND approval constraints
```

The workflow envelope can only narrow assigned-agent capabilities. It must never
expand them.

## Agents

Agents are first-class workspace resources under Automation. An agent should
expose:

- name, description, status, version, and ownership metadata
- provider type: internal, external, or future provider-specific variants
- connected MCP servers
- enabled tools
- enabled skills
- allowed target and workspace-context scope
- default approval requirements for sensitive actions
- derived capability summary
- workflows using the agent
- audit history
- health, test, or preview surface

Agent permissions should not be a separate abstract ACL if configured tools
already define what the agent can do. In the first version, an agent's effective
capability is derived from:

- connected MCP servers
- enabled tools
- tool operation capability, such as read or write
- enabled skills
- allowed target scope
- allowed workspace-context scope
- approval rules for sensitive actions
- external-agent trust policy, when applicable

The UI can summarize this derived capability as labels such as "read-only
diagnostics", "can propose remediation", or "can execute approved actions", but
the source of truth remains structured capabilities, MCP servers, tools, skills,
scopes, approvals, and trust policy configured on the agent.

Do not introduce separate top-level delegated-worker IA initially. All reusable
agents are created from the Agents tab. Runtime delegated work is represented as
agent runs, not as separate durable worker resources.

## Agent Contract Shape

The production API and persistence model should treat agents as durable,
versioned workspace resources. A minimal agent shape should include:

```text
agent {
  id
  workspaceId
  name
  description
  status: draft | active | paused | disabled | error
  providerType: internal | external
  ownerUserId
  version
  mcpServers[]
  tools[]
  skills[]
  targetScope
  contextScope
  approvalPolicy
  trustPolicy
  capabilitySummary
  createdAt
  updatedAt
}
```

Agent capability entries should be structured, not just display labels:

```text
capability {
  source: builtin_tool | mcp_tool | skill | context | target
  providerAgentId
  resourceType
  resourceScope
  toolId?
  operation: read | write
  requiresApproval
}
```

The control plane should provide public workspace routes for listing, creating,
updating, disabling, testing, and reading audit history for agents. OpenAPI and
management-console contract docs must use those routes as the source of truth.

## Workflows

Workflows support multiple assigned agents with explicit roles:

- Primary agent: accountable owner for the workflow run and final output.
- Supporting agents: delegated specialist agents used during the run.

Both primary and supporting agent selectors list durable agents created from the
Agents tab.

Workflows own orchestration and constraints, not low-level capability wiring. A
workflow configures:

- trigger type, including manual and scheduled runs
- required inputs
- procedure or steps
- primary agent
- supporting agents
- target or context selection rules
- run mode, such as read-only or read-write
- approval requirements
- roles allowed to run the workflow
- schedule authorization, if scheduled runs are enabled

Workflow authoring should not directly configure MCP servers, tools, or skills.
Those are selected through assigned agents. The workflow can narrow what the
assigned agents may do through mode, target scope, context grants, capability
gates, and approvals.

"Supporting agent" should be the only workflow-facing term. A supporting agent
is a normal workspace agent assigned to a workflow in a supporting role. It is
not a separate resource type, and it is not created dynamically by the primary
agent.

Use this wording:

- Workflow editor: "Supporting agents"
- Run trace: "Supporting agent run" or "Delegated agent run"
- Agents tab: "Agents"

If AcornOps later introduces temporary runtime-created workers that are not
durable Agents tab resources, document that as a separate future concept instead
of overloading the workflow agent assignment model.

## Workflow Contract Shape

A workflow should store agent assignments and workflow-level gates:

```text
workflow {
  id
  workspaceId
  name
  description
  status
  triggerPolicy
  inputs[]
  steps[]
  primaryAgentId
  supportingAgents[] {
    agentId
    role
    required
  }
  targetSelectionPolicy
  contextGrantPolicy
  runMode
  approvalPolicy
  runnableRoles[]
  schedulePolicy?
  capabilityGate
  version
}
```

The workflow capability gate is a subset of capabilities available through the
selected agents. It can disable or require approval for a capability, but it
cannot add MCP servers, tools, local tools, or skills that are not already
available through assigned agents.

Workflow run state and transcript records should be explicit conceptual
resources:

```text
workflowRun {
  id
  workspaceId
  workflowId
  workflowVersion
  status: queued | running | paused | cancelling | cancelled | succeeded | failed
  triggerType: manual | scheduled
  runtimeSubject
  launchedByUserId?
  scheduleId?
  primaryAgentRunId
  compiledGrant
  cancellationRequestedAt?
  cancellationRequestedByUserId?
  cancellationReason?
  startedAt?
  completedAt?
}

workflowRunEvent {
  id
  workspaceId
  workflowRunId
  parentEventId?
  delegatedAgentRunId?
  type
  actorType: user | runtime_subject | primary_agent | supporting_agent | system
  actorId
  visibility
  summary
  payload
  createdAt
}

controlMessage {
  id
  workspaceId
  workflowRunId
  submittedByUserId
  intent: context | prompt_answer | pause | resume | redirect_next_step | cancel
  status: accepted | denied | superseded
  message
  authorizedGrant
  auditEventId
  createdAt
}
```

Cancellation status should be visible on both the workflow run and affected
delegated agent runs so callers can distinguish a user-cancelled run from a
failure, timeout, or policy denial.

## Workflow Creation Flow

Workflow creation should be a guided flow that moves from intent to agent
assignment to runtime capability review.

Step 1: Define workflow details

- workflow name
- workflow description
- expected outcome

Step 2: Configure agents and run type

- select primary agent from durable workspace agents
- select supporting agents from durable workspace agents
- configure run type, including manual and scheduled runs

Step 3: Configure targets and context

- select target types, target groups, or explicit targets
- select workspace context grants, such as audit events or selected chat
  sessions
- show unsupported target/capability combinations explicitly

Step 4: Review effective capabilities

- show aggregated capabilities available from all selected agents
- include connected MCP server tools
- include local tools, such as web search, when those tools are assigned to an
  agent
- include enabled skills
- allow users to disable individual capabilities for the workflow
- show which actions require approval

The capability review is workflow-level gating. It narrows the selected agents'
capabilities for this workflow; it does not configure new capabilities.

## Agent-To-Agent Direction

Future agent-to-agent behavior should be modeled as delegated agent runs, not as
unbounded agents calling each other directly.

Example:

```text
Workflow run: Investigate production incident
Primary agent: Incident Commander

Supporting agent run:
  Agent: Kubernetes Diagnostics
  Scope: cluster-prod
  Mode: read-only
  Output: findings summary

Supporting agent run:
  Agent: Log Investigator
  Scope: affected services only
  Mode: read-only
  Output: timeline

Supporting agent run:
  Agent: Remediation Planner
  Scope: no execution tools
  Mode: read-only
  Output: proposed action plan
```

Each delegated agent run should have:

- parent workflow run id
- parent agent run id, when delegated by another agent
- assigned agent id and role
- compiled narrowed capabilities
- input payload
- expected output contract
- timeout and cancellation policy
- trace events
- approval state
- final output or error

For v1, workflows assign primary and supporting agents statically. Later, the
primary agent may request dynamic delegation. Dynamic delegation must still pass
through control-plane policy checks before a delegated run is created:

```text
delegation request
-> workflow allows delegation?
-> requested agent is allowed?
-> requested scope is inside workflow envelope?
-> requested capabilities are inside assigned-agent capabilities?
-> approval required?
-> create delegated agent run with narrowed grant
```

This preserves auditability while enabling future agent-to-agent collaboration.

## Run Transcript And Control Channel

Workflow runs should expose a governed run transcript and control channel, not
an unrestricted shared agent chat room. The transcript is an append-only stream
of workflow run events persisted by control-plane and consumed by the UI,
execution-engine, audit systems, and authorized agents.

Run events should include:

- workflow run creation, start, pause, resume, cancellation, and final state
- primary agent output and step transitions
- delegated agent run creation, trace events, output, errors, and final state
- tool-call summaries and tool-call results appropriate for the viewer
- approval requests, approval decisions, and denied approvals
- accepted user control messages
- cancellation requests and cancellation propagation status
- runtime grant changes caused by revocation, disabled agents, or policy changes

User interjection should be modeled as a control message submitted to
control-plane, not as direct browser injection into an agent context. A control
message can express only explicit run-control intents:

- provide additional context
- answer a prompt raised by the workflow or an agent
- request pause or resume
- redirect the next step within the existing workflow envelope
- request cancellation

Control-plane must authorize each control message against the workflow run, the
workflow envelope, the user's role, and the requested intent. Accepted control
messages are persisted, audited, and forwarded through execution state. Agents
observe accepted control messages at step boundaries or explicit interrupt
points unless the active tool or external operation supports immediate
interruption.

The browser must not inject directly into primary agent, supporting agent, or
external agent contexts. The UI should present the feature as a live run trace
with a message/control composer and a cancel action. It should not present the
workflow run as an unconstrained multi-agent chat room.

Cancellation is best-effort but must close the door on new privileged work. Once
control-plane accepts cancellation for a non-terminal run, the run must not start
new delegated agent runs, new tool calls, or new approvals. In-flight tool calls
or external operations receive cancellation signals where supported. Runs that
finish before cancellation is accepted keep their existing terminal state.
Otherwise, the final state becomes `cancelled`.

Preferred public routes for the eventual implementation:

```text
POST /api/v1/workflow-runs/{runId}/control-messages
POST /api/v1/workflow-runs/{runId}/cancel
GET /api/v1/workflow-runs/{runId}/events
```

Run controls must preserve the core invariant: workflow envelopes only narrow
assigned-agent capabilities. A control message can redirect work inside the
compiled grant, pause work, resume work, answer a prompt, or cancel work. It
must not expand targets, tools, skills, MCP access, approvals, or runtime
identity beyond the workflow envelope and assigned-agent capabilities.

## External Agents

External agents are supported through the same durable Agent model with a
stricter trust boundary.

External agents should not self-authorize or self-expand capabilities. They
declare capabilities, but AcornOps grants only the approved subset during a
specific run.

External-agent runtime access should be:

```text
external agent identity
AND declared capabilities
AND workspace-approved capabilities
AND workflow envelope
AND target/context scope
AND approval constraints
```

External agents require:

- authenticated registration or connection setup
- verified provider identity
- declared capability manifest
- workspace approval of usable capabilities
- secret isolation and no browser exposure of secret values
- short-lived run-scoped tokens
- explicit data-egress policy
- revocation and disable controls
- health checks
- audit events for connection, capability changes, delegated runs, tool calls,
  failures, and revocation

External agents should receive only the context and tools required for the
current run. They should not receive broad workspace tokens or unrestricted MCP
server credentials.

## Permissions

User roles govern management and invocation:

- who can create or edit agents
- who can approve external agents
- who can create or edit workflows
- which roles can manually run a workflow
- who can configure schedules
- who can approve write-capable or sensitive delegated actions

Use explicit workspace capabilities rather than overloading tool management:

- manage_agents
- manage_external_agents
- manage_workflows
- manage_workflow_schedules
- run_workflows
- run_read_write_workflows
- interject_workflow_runs
- cancel_workflow_runs
- approve_workflow_actions

Manual runs check that the user's role can run the workflow, then execute within
the workflow envelope. The invoking user's full role must not become the runtime
permission set.

Scheduled runs execute as a workflow runtime subject, not as the full role of
the user who configured the schedule. Audit logs should record:

- who configured the workflow
- who configured or enabled the schedule
- who manually launched a run, when manual
- schedule id, when scheduled
- runtime subject
- assigned agents and delegated agent runs
- accepted and denied control messages
- cancellation requests and outcomes

Disabling a schedule, disabling an agent, revoking an external agent, or removing
a required capability must prevent future runs from using that capability.

## Target Boundary

Keep target concepts explicit:

```text
Concept               Shared target model?   Target-specific?          Notes
Target identity       yes                    no                        Stable target id/name/type.
Credentials           interface              yes                       Kubernetes, VM, and future targets differ.
Health                interface              yes                       Comparable status, target-specific probes.
Tools                 capability             yes                       Exposed through agent capabilities.
Skills                capability/context     optional                  Scoped to agent or inventory resource.
Permissions           abstract policy        yes                       Target policy narrows runtime access.
Execution support     capability             yes                       Unsupported actions fail explicitly.
```

Shared workflow and agent APIs should use target-neutral language. Target-specific
behavior belongs behind capability declarations and target adapters.

## User Experience By User Type

Admins and platform teams configure Agents:

- connect MCP servers
- enable tools and skills
- set target scope
- approve external agents
- define approval policy
- test capability previews

Operators run Workflows:

- choose a workflow
- provide required inputs
- select allowed targets or context
- review effective capability summaries
- approve sensitive actions when authorized
- follow a live run trace
- submit authorized control messages
- cancel workflow runs when authorized

Auditors and security users review evidence:

- workflow run history
- assigned agents
- delegated agent runs
- effective grants
- tool calls
- approvals
- control messages
- cancellation requests
- external-agent access
- schedule launches

This keeps MCP/tool/skill plumbing out of the main operator path while preserving
the detail required for administrators and auditors.

## Contracts And Validation

This feature crosses the management-console, control-plane, and execution-engine
boundary. Production implementation must update:

- control-plane API routes, DTOs, persistence, OpenAPI, audit events, and
  runtime grant compiler
- management-console contract docs, API client types, Agents UI, Workflow editor,
  run trace, run control composer, cancel action, and permission-aware
  navigation
- execution-engine workflow bootstrap, run/delegated-run handling, control
  message observation, and cancellation propagation
- platform contract manifests and validation checks

The eventual public API should prefer explicit workflow run resources:

- `POST /api/v1/workflow-runs/{runId}/control-messages`
- `POST /api/v1/workflow-runs/{runId}/cancel`
- `GET /api/v1/workflow-runs/{runId}/events`

Required validation should include:

- agent CRUD and permission checks
- external-agent registration, revocation, and denied access cases
- workflow creation with primary and supporting agents
- capability gate cannot expand selected-agent capabilities
- manual run uses workflow envelope rather than user full role
- scheduled run uses workflow runtime subject
- disabled agent prevents new workflow runs
- delegated agent run receives narrowed grants only
- authorized users can submit accepted control messages
- denied users cannot interject into workflow runs
- denied users cannot cancel workflow runs
- accepted cancellation prevents new delegated agent runs, tool calls, and
  approvals
- in-flight delegated agent runs and supported tool calls receive cancellation
  propagation
- cancellation is idempotent for repeated requests
- terminal-state idempotency preserves runs that already succeeded, failed, or
  were cancelled
- target-specific unsupported capabilities fail explicitly
- audit events cover configuration, launch, delegation, tool calls, approvals,
  accepted and denied control messages, cancellation requests, schedule runs,
  failures, and revocation

## Current-State Delta

Current target chat runtime access is mostly:

```text
user workspace role
-> run mode
-> target agent capabilities
-> enabled tools
-> signed gateway token
```

The target direction is:

```text
workflow or chat runtime subject
-> workflow envelope or chat envelope
-> assigned durable agent capabilities
-> target/resource scope
-> run mode
-> approvals
-> short-lived runtime grant
```

Workflow access should compile from assigned workspace agents and be narrowed by
workflow mode, target scope, context grants, approvals, and assigned workflow
role. This compiled grant is the source of truth for execution, delegated agent
runs, control messages, cancellation handling, audit logs, and external-agent
access.
