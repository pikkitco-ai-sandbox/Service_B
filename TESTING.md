# Testing Guide

## Unit Tests

```bash
npm test             # run all tests
npm run test:watch   # watch mode
```

38 tests across 4 files:

| File | Tests | What it covers |
| --- | --- | --- |
| `tests/router.test.ts` | 13 | routeCommand, inferWorkflow, extractTicketId |
| `tests/parse.test.ts` | 8 | parseSlashCommand, parseMention |
| `tests/contracts.test.ts` | 7 | Type shape validation for all gateway contracts |
| `tests/actions.test.ts` | 10 | ActionPayload encoding, approval cards, decision results, error cards |

---

## Mock-Mode Slack Tests

**Prerequisites:**
- Service_B deployed to Vercel
- `NEW_CHAT_LAYER_ENABLED=true` in Vercel env vars
- `CHAT_BACKEND_MODE=mock` in Vercel env vars (default)
- Slack app installed to dev workspace with correct URLs

### Test 1: App mention — dummy workflow (default)

**Input:** In any channel where the bot is invited, type:

```
@PikkitBot check ENG-12345
```

**Expected Slack output:**

> [Mock] Would process `ENG-12345` via `dummy` workflow.

Appears as a threaded reply. Workflow defaults to `dummy` because "check" is not a mislink keyword.

### Test 2: App mention — mislink workflow

**Input:**

```
@PikkitBot mislink ENG-99999
```

**Expected Slack output:**

> [Mock] Would process `ENG-99999` via `mislink` workflow.

Appears as a threaded reply. "mislink" triggers the mislink keyword detector.

**Other trigger words:** `mismatch`, `linked incorrectly`, `wrong player`, `wrong event`, `wrong market`, `wrong outcome`, `mislinked`

### Test 3: App mention — missing ticket ID

**Input:**

```
@PikkitBot hello
```

**Expected Slack output:**

> Please include a ticket ID (e.g., `ENG-12345`) in your message.

Appears as a threaded reply.

### Test 4: /mislink command

**Input:** In any channel, type:

```
/mislink ENG-12345
```

**Expected Slack output (two messages):**

1. **Ephemeral** (only you see): `Processing ENG-12345 via mislink workflow...`
2. **Channel message** (everyone sees): `[Mock] Would process ENG-12345 via mislink workflow.` followed by `Command: /mislink ENG-12345`

### Test 5: /support command

**Input:**

```
/support ENG-12345
```

**Expected Slack output (two messages):**

1. **Ephemeral**: `Processing ENG-12345 via dummy workflow...`
2. **Channel message**: `[Mock] Would process ENG-12345 via dummy workflow.` followed by `Command: /support ENG-12345`

### Test 6: Command without ticket ID

**Input:**

```
/mislink
```

**Expected Slack output (ephemeral only):**

> Please provide a ticket ID. Usage: `/mislink ENG-12345`

### What mock mode does NOT test

- Approval cards with Approve/Reject/Modify buttons (only appear in live mode)
- Button click interactions (requires an approval card to exist first)
- Backend HTTP calls (mock mode never contacts Python backends)
- State persistence (mock mode doesn't save run context)

---

## Live-Mode Slack Tests

**Prerequisites:**
- Python backends (Dummy_Agent, Mislink_Agent) running and reachable from Vercel
- `CHAT_BACKEND_MODE=live` in Vercel env vars
- `DUMMY_AGENT_BASE_URL` and `MISLINK_AGENT_BASE_URL` set to real backend URLs

### Test 7: Live mention — produces approval card

**Input:**

```
@PikkitBot check ENG-10423
```

**Expected Slack output (approval card):**

```
┌──────────────────────────────────────────┐
│ [Title from backend]                      │
│──────────────────────────────────────────│
│ [Summary from backend] (XX% confidence)   │
│                                           │
│ *Category:* `support_bug`                 │
│ *Severity:* high                          │
│ *Status:* pending_review                  │
│                                           │
│──────────────────────────────────────────│
│ Run ID: `ENG-10423_xxx` | Workflow: `dummy`│
│                                           │
│ [Approve] [Reject] [Modify]              │
└──────────────────────────────────────────┘
```

The exact fields depend on backend response. Category, Severity, Team, Root Cause only appear if the backend includes them in `details`.

### Test 8: Click Approve button

**Expected Slack output (threaded reply):**

> :white_check_mark: **Decision: approve** by @YourName
> [Message from backend]
>
> Run ID: `ENG-10423_xxx`

### Test 9: Click Reject button

**Expected:**

> :x: **Decision: reject** by @YourName
> [Message from backend]
>
> Run ID: `ENG-10423_xxx`

### Test 10: Click Modify button

**Expected:**

> :pencil2: **Decision: modify** by @YourName
> [Message from backend]
>
> Run ID: `ENG-10423_xxx`

### Test 11: Backend unreachable

If the Python backend is down:

> :warning: **Error:** `backend_unreachable`
> Failed to reach backend

### Test 12: Backend returns error

If the backend returns `{ ok: false, error: "not_found", message: "..." }`:

> :warning: **Error:** `not_found`
> [error message from backend]

---

## Verifying Logs

After each Slack interaction, check Vercel logs:

```bash
npx vercel logs https://pikkit-service-b.vercel.app --follow
```

Or: Vercel Dashboard → project → **Logs** tab.

Every request produces structured JSON logs with these fields:

| Field | Example | Meaning |
| --- | --- | --- |
| `source` | `event`, `command`, `interaction` | Which route handled the request |
| `workflow` | `dummy`, `mislink` | Which backend workflow was selected |
| `mode` | `mock`, `live` | Whether mock or live mode is active |
| `ticket_id` | `ENG-12345` | Extracted ticket ID |
| `run_id` | `ENG-12345_xxx` | Backend-assigned run ID (live mode only) |
| `action` | `approve`, `reject`, `modify` | Decision action (interactions only) |
| `backend_url` | `http://localhost:8000/api/process` | Which backend URL was called |
| `duration_ms` | `234` | Backend response time |

### Key log messages to look for

| Message | Meaning |
| --- | --- |
| `mention_received` | Bot was mentioned, parsed successfully |
| `command_received` | Slash command received |
| `interaction_received` | Button was clicked |
| `mock_response` | Mock mode returned a fake response |
| `backend_response` | Live backend returned a response |
| `backend_unreachable` | Live backend could not be reached |
| `process_success` | Backend processed ticket successfully |
| `decision_success` | Backend recorded decision successfully |
| `gate_disabled` | `NEW_CHAT_LAYER_ENABLED` is not `true` |
| `signature_failed` | Slack signature verification failed |
