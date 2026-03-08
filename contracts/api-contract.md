# Backend API Contract

Standardized HTTP contract that both Python backends (Dummy_Agent, Mislink_Agent) expose
so that Service_B can call them uniformly.

**Version:** 1.0.0-draft
**Status:** Defined, implementation in progress

## Design Principles

1. **Uniform shape** — both backends return the same response structure
2. **Workflow-aware** — the `workflow` field distinguishes which pipeline ran
3. **Slack-agnostic** — the backend contract uses `source`, `thread_id`, `user_id` instead
   of Slack-specific field names. Service_B translates Slack concepts to these generic fields.
4. **Error consistency** — all errors use `{ ok: false, error, message }`

---

## POST /api/process

Start a workflow (ticket processing or mislink resolution).

### Request

```json
{
  "workflow": "dummy" | "mislink",
  "ticket_id": "<ticket id>",
  "source": "slack",
  "thread_id": "<optional Slack thread_ts or similar>",
  "user_id": "<optional Slack user ID or similar>",
  "context": {}
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `workflow` | `"dummy"` or `"mislink"` | Yes | Routes to the correct backend |
| `ticket_id` | string | Yes | Linear ticket ID (e.g., `ENG-10423`) |
| `source` | string | Yes | Where the request originated (`slack`, `api`, `webhook`) |
| `thread_id` | string | No | Slack thread_ts or equivalent for threading replies |
| `user_id` | string | No | Requesting user's ID |
| `context` | object | No | Extra fields passed through to the pipeline |

### Response (success)

```json
{
  "ok": true,
  "workflow": "dummy" | "mislink",
  "run_id": "<unique run id>",
  "title": "<short title>",
  "summary": "<human readable summary>",
  "status": "pending_review" | "completed" | "failed",
  "confidence": 0.85,
  "details": {},
  "actions": ["approve", "reject", "modify"]
}
```

| Field | Type | Always present | Notes |
| --- | --- | --- | --- |
| `ok` | boolean | Yes | `true` on success |
| `workflow` | string | Yes | Which pipeline ran |
| `run_id` | string | Yes | Unique identifier for this run |
| `title` | string | Yes | Short summary for card header |
| `summary` | string | Yes | Human-readable description for card body |
| `status` | string | Yes | Current run state |
| `confidence` | number or null | Yes | Classification confidence (0-1), null if N/A |
| `details` | object | Yes | Structured data for rendering cards |
| `actions` | string[] | Yes | Available decision actions |

### Details object (Dummy_Agent)

```json
{
  "category": "support_bug",
  "reasoning": "...",
  "proposed_action": "create_pr",
  "target_team": "Engineering",
  "matched_known_issue": null,
  "runbook_ref": "knowledge/runbooks/support-bug.md"
}
```

### Details object (Mislink_Agent)

```json
{
  "category": "player_identity_mismatch",
  "stage": "entity",
  "severity": "high",
  "reasoning": "...",
  "proposed_action": "update_entity_mapping",
  "root_cause_summary": "...",
  "target_file": "link_transactions.json",
  "has_patch": true
}
```

---

## POST /api/decision

Record a human decision (approve / reject / modify).

### Request

```json
{
  "workflow": "dummy" | "mislink",
  "run_id": "<run id>",
  "decision": "approve" | "reject" | "modify",
  "comment": "<optional human comment>",
  "user_id": "<optional>",
  "thread_id": "<optional>"
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `workflow` | string | Yes | Which backend to call |
| `run_id` | string | Yes | Must match a valid stored run |
| `decision` | string | Yes | One of: `approve`, `reject`, `modify` |
| `comment` | string | No | Human-provided context |
| `user_id` | string | No | Who made the decision |
| `thread_id` | string | No | For threading Slack responses |

### Response (success)

```json
{
  "ok": true,
  "workflow": "dummy" | "mislink",
  "run_id": "<run id>",
  "status": "approved" | "rejected" | "modified" | "failed",
  "message": "<human readable status message>",
  "details": {}
}
```

| Field | Type | Always present | Notes |
| --- | --- | --- | --- |
| `ok` | boolean | Yes | `true` on success |
| `workflow` | string | Yes | Which pipeline was decided on |
| `run_id` | string | Yes | The run that was decided on |
| `status` | string | Yes | Outcome of the decision |
| `message` | string | Yes | Human-readable message for Slack thread |
| `details` | object | Yes | Additional context (execution outcome, etc.) |

---

## GET /api/runs/{run_id}

Retrieve run status and details.

### Response (success)

```json
{
  "ok": true,
  "workflow": "dummy" | "mislink",
  "run_id": "<run id>",
  "status": "pending_review" | "approved" | "rejected" | "completed" | "failed",
  "summary": "<human readable summary>",
  "details": {}
}
```

---

## Error Responses

All endpoints return a consistent error shape:

```json
{
  "ok": false,
  "error": "<machine_readable_error_code>",
  "message": "<human readable explanation>"
}
```

| Error Code | HTTP Status | When |
| --- | --- | --- |
| `not_found` | 404 | Ticket or run_id not found |
| `invalid_request` | 422 | Missing required fields or invalid values |
| `unauthorized` | 401 | Missing or invalid auth token |
| `internal_error` | 500 | Unexpected backend failure |
| `duplicate_decision` | 409 | Decision already recorded for this run_id |

---

## Authentication

Backends support optional bearer token auth via the `API_AUTH_TOKEN` environment variable.
When set, all requests must include `Authorization: Bearer <token>`.
When unset, auth is disabled (dev mode).

---

## Mapping from Legacy Endpoints

### Mislink_Agent (existing -> standardized)

| Legacy | Standardized | Notes |
| --- | --- | --- |
| `POST /api/process` (TicketProcessRequest) | `POST /api/process` (gateway contract) | Add `workflow`, `source`, response wrapper |
| `POST /api/decision` (DecisionRequest) | `POST /api/decision` (gateway contract) | Rename fields, add `ok` wrapper |
| `GET /api/runs/{run_id}` | `GET /api/runs/{run_id}` | Add `ok` wrapper, standardize shape |
| `POST /webhooks/slack/interactions` | Unchanged (direct Slack, legacy path) | Gated by `LEGACY_SLACK_ENABLED` |
| `POST /webhooks/linear` | Unchanged | Not part of gateway contract |

### Dummy_Agent (new)

| Legacy | Standardized | Notes |
| --- | --- | --- |
| CLI: `python -m agents.orchestrator process` | `POST /api/process` | New FastAPI wrapper |
| N/A | `POST /api/decision` | New — maps to HumanReviewInterface.apply_decision |
| N/A | `GET /api/runs/{run_id}` | New — reads from data/runs/ checkpoints |
