# Operations Guide

## Architecture

```text
Slack workspace
    │
    ├── app_mention ──────> /api/slack/events
    ├── /mislink, /support ──> /api/slack/commands
    └── button clicks ────> /api/slack/interactions
                                  │
                          ┌───────┴────────┐
                          │   Service_B    │  (Vercel, Next.js 14)
                          │   Mock or Live │
                          └───────┬────────┘
                                  │ (live mode only)
                    ┌─────────────┼──────────────┐
                    │                            │
            Dummy_Agent                  Mislink_Agent
            POST /api/process            POST /api/gateway/process
            POST /api/decision           POST /api/gateway/decision
            GET  /api/runs/{id}          GET  /api/gateway/runs/{id}
```

Service_B is a stateless serverless gateway. It does NOT contain pipeline logic.

---

## Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/slack/events` | POST | Slack Event Subscriptions (app_mention, url_verification) |
| `/api/slack/commands` | POST | Slash commands (/mislink, /support) |
| `/api/slack/interactions` | POST | Interactive component callbacks (button clicks) |
| `/api/health` | GET | Health check (returns mode, version) |

---

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SLACK_BOT_TOKEN` | Yes | — | Slack Bot OAuth Token (`xoxb-...`). Used to post messages. |
| `SLACK_SIGNING_SECRET` | Yes | — | HMAC signing secret. Verifies requests come from Slack. |
| `SLACK_APP_TOKEN` | No | — | App-level token for Socket Mode. Not needed for Vercel. |
| `NEW_CHAT_LAYER_ENABLED` | Yes | `false` | Master switch. When not `"true"`, all Slack routes acknowledge but do nothing. |
| `CHAT_BACKEND_MODE` | No | `mock` | `mock` returns fake responses. `live` calls real Python backends. |
| `DUMMY_AGENT_BASE_URL` | Live mode | `http://localhost:8000` | Base URL of Dummy_Agent's FastAPI server. |
| `MISLINK_AGENT_BASE_URL` | Live mode | `http://localhost:8001` | Base URL of Mislink_Agent's FastAPI server. |
| `REDIS_URL` | No | — | Redis connection for persistent state. Omit for in-memory (dev only). |
| `LEGACY_SLACK_ENABLED` | No | `true` | Set in Python repos. Keeps their legacy Slack code active. |

**Security:** Never log `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, or `SLACK_APP_TOKEN`. The structured logger only logs safe fields (source, workflow, ticket_id, run_id, etc.).

---

## Feature Flags

### NEW_CHAT_LAYER_ENABLED

**Master switch for the entire Slack integration.**

| Value | Behavior |
| --- | --- |
| `"true"` | All routes process normally |
| anything else | Events and interactions return `{ ok: true }` silently. Commands return "not yet active" ephemeral. |

**To disable quickly:** Set to `"false"` in Vercel env vars and redeploy.

### CHAT_BACKEND_MODE

| Value | Behavior |
| --- | --- |
| `"mock"` | Returns `[Mock] Would process...` messages. Never contacts backends. |
| `"live"` | Calls real Python backends via HTTP. Posts approval cards. |

### LEGACY_SLACK_ENABLED (Python repos only)

When `"true"`, the Python repos' own Slack integrations remain active. Set to `"false"` when
Service_B is fully handling all Slack interactions.

---

## Cutover Plan: Mock to Live

### Pre-flight checklist

- [ ] Python backends deployed and reachable from the internet
- [ ] `DUMMY_AGENT_BASE_URL` set to real Dummy_Agent URL in Vercel
- [ ] `MISLINK_AGENT_BASE_URL` set to real Mislink_Agent URL in Vercel
- [ ] Backend health checks pass: `curl <base_url>/api/health` returns 200
- [ ] `LEGACY_SLACK_ENABLED=true` still set in Python repos (dual-running)

### Cutover steps

1. In Vercel env vars, change `CHAT_BACKEND_MODE` from `mock` to `live`
2. Redeploy: `npx vercel --prod` or push a commit
3. Test in Slack:
   - `/mislink ENG-XXXXX` — should produce an approval card (not a mock message)
   - Click Approve — should show decision result with backend message
4. Check Vercel logs for `backend_response` entries with `status_code: 200`
5. If everything works, set `LEGACY_SLACK_ENABLED=false` in Python repos

### If something goes wrong

See "Rollback" section below.

---

## Rollback

### Disable Service_B Slack processing (instant)

1. Set `NEW_CHAT_LAYER_ENABLED=false` in Vercel env vars
2. Redeploy (push any commit or `npx vercel --prod`)
3. Result: All Slack routes acknowledge silently. No messages sent, no backends called.

### Revert to mock mode (keeps Slack active, disables backends)

1. Set `CHAT_BACKEND_MODE=mock` in Vercel env vars
2. Redeploy
3. Result: Slack interactions work but return mock responses.

### Re-enable legacy Python Slack

1. Set `LEGACY_SLACK_ENABLED=true` in Python repo env vars (if it was changed)
2. Restart Python services
3. Result: Python repos handle Slack directly again.

### Full rollback (nuke from orbit)

1. Set `NEW_CHAT_LAYER_ENABLED=false` in Vercel
2. Set `LEGACY_SLACK_ENABLED=true` in Python repos
3. In Slack app config, point Event Subscriptions URL back to Python backend (or remove it)
4. Redeploy everything

---

## Observability

### Vercel Logs

```bash
# Stream live logs
npx vercel logs https://pikkit-service-b.vercel.app --follow

# Or: Vercel Dashboard → project → Logs tab
```

All logs are structured JSON. Key fields:

```json
{
  "level": "info",
  "message": "mention_received",
  "service": "service-b",
  "source": "event",
  "workflow": "mislink",
  "ticket_id": "ENG-12345",
  "mode": "mock"
}
```

### Health Check

```bash
curl https://pikkit-service-b.vercel.app/api/health
# {"ok":true,"service":"service-b","version":"1.0.0","chat_backend_mode":"mock"}
```

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Bot doesn't respond at all | `NEW_CHAT_LAYER_ENABLED` not `true` | Set to `true` in Vercel env vars and redeploy |
| Bot doesn't respond at all | Slack URLs not pointing to Vercel | Check Event Subscriptions and Interactivity URLs in Slack app config |
| Bot doesn't respond at all | Bot not invited to channel | Invite the bot: `/invite @BotName` |
| `invalid_signature` in logs | `SLACK_SIGNING_SECRET` wrong or missing | Check Vercel env var matches Slack app's Signing Secret |
| `[Mock]` messages in live mode | `CHAT_BACKEND_MODE` still `mock` | Change to `live` and redeploy |
| `:warning: Error: backend_unreachable` | Python backend is down or URL wrong | Check `DUMMY_AGENT_BASE_URL` / `MISLINK_AGENT_BASE_URL`. Verify backend is running. |
| `:warning: Error: backend_http_error` | Backend returned non-200 | Check backend logs. Backend may be misconfigured or ticket not found. |
| Slash command shows "not yet active" | `NEW_CHAT_LAYER_ENABLED` not `true` | Set to `true` and redeploy |
| "Please include a ticket ID" | User didn't include a pattern like `ENG-12345` | Must match `/[A-Z]+-\d+/` (e.g., ENG-12345, FAKE-001) |
| Buttons don't appear | Only happens in mock mode | Switch to `CHAT_BACKEND_MODE=live` — mock mode posts text, not cards |
| Vercel build fails | Missing `vercel.json` or framework not detected | Ensure `vercel.json` has `{"framework":"nextjs"}` |
| `SLACK_BOT_TOKEN is required` | Missing env var | Add `SLACK_BOT_TOKEN` to Vercel env vars |

---

## Deployment

Service_B auto-deploys on push to `main` via Vercel Git integration.

### Manual deploy

```bash
cd Service_B
npx vercel --prod
```

### Check deployment status

```bash
npx vercel ls
```

### Inspect a specific deployment

```bash
npx vercel inspect <deployment-url> --logs
```
