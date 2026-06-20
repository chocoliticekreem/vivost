# Chat Moderation Middleware

An AI-governed middleman that sits between **workers** (advertisers/escorts, `app.account`)
and **customers** (`app.client`) on the Vivost platform. It screens every chat message for
scams and safety issues on either side, redacting or holding dangerous content before delivery
and flagging nuanced cases for human review.

## Architecture

Moderation is a **gateway with two tiers** running under a **hybrid** enforcement model.
`MessagingService.sendMessage` is the choke point: nothing reaches a recipient without passing
through it.

```
worker / customer
      │  POST /conversations/:id/messages
      ▼
MessagingService.sendMessage
      │
      ├─▶ Tier-1 (inline, synchronous)  ── moderation.screenInline()
      │        deterministic regex filter; may redact / hold / block / escalate
      │        BEFORE the message is delivered
      │
      ├─ persist Message (status: delivered | redacted | held | blocked)
      │
      └─▶ eventBus.publish("message.sent")   (only when not held/blocked)
                 │
                 ▼
          Tier-2 (async, off the event)  ── moderation.screenDeep()
                 nuanced LLM pass; FLAGS for review only, never blocks
```

- **Tier-1** (`moderation/tier1.ts`) is pure, no I/O. A cheap deterministic filter that runs
  **inline** and may auto-act on high-confidence mechanical cases.
- **Tier-2** (`ModerationProvider.analyze`) is a nuanced LLM pass that runs **async** off the
  `message.sent` event. It is trajectory-aware (sees the last 10 messages) and only writes to the
  review queue — it never alters or blocks a delivered message.

## Locked decisions

- **Enforcement = hybrid.** Tier-1 runs inline and can redact/hold/block before delivery; Tier-2
  runs async and only flags for human review.
- **Authority = tiered.** Tier-1 auto-acts only on high-confidence mechanical cases (redact a phone
  number, hold a payment redirection). Anything ambiguous or account-level (suspension, safety) is
  written to a review queue or escalated via a `moderation.safety_escalation` event. The system
  **never auto-suspends an account.**
- **Scope = all four categories:** `financial_scam`, `off_platform`, `harassment`, `safety_legal`.
- **Retention / privacy.** Messages are personal *content*, not identity PII, so — following the
  `app.enquiry` precedent — they live in `app.*` with RLS enabled, not `identity.*`.
  - `app.message.body` holds the **delivered** text (post-redaction if any).
  - `app.message.original_body` is populated **only when Tier-1 redacted the message**, preserving
    evidence for appeals; it is null otherwise (we do not keep a second copy of clean text).
  - `app.moderation_verdict.excerpt` stores only the **matched snippet**, never a full body copy.
  - All three tables enable row level security and cascade-delete from the participant's identity
    root (GDPR erasure).
- **Authz gap (flagged, not solved).** The backend has no auth/role middleware; actor IDs are
  passed in request bodies (existing convention). Moderation admin routes follow that convention.
  This gap is a documented known follow-up — we did not invent an auth system here.

## Action model

Tier-1 combines all matched categories and resolves a single action by precedence
(strongest wins): `escalate > block > hold > redact > flag > allow`.

| Action     | Message status | Delivered? | Side effect                                   |
| ---------- | -------------- | ---------- | --------------------------------------------- |
| `allow`    | `delivered`    | yes        | —                                             |
| `flag`     | `delivered`    | yes        | recorded for review                           |
| `escalate` | `delivered`    | yes        | publishes `moderation.safety_escalation`      |
| `redact`   | `redacted`     | yes (masked) | `original_body` retained for appeals        |
| `hold`     | `held`         | no         | queued for review; no Tier-2 pass             |
| `block`    | `blocked`      | no         | hard stop; no Tier-2 pass                     |

`held` and `blocked` messages are **not** published to `message.sent`, so the Tier-2 pass is
skipped for content that was never delivered.

## Data model

Three tables in the `app` schema, all with RLS enabled (migrations `0090_messaging.sql`,
`0091_moderation.sql`):

- **`app.conversation`** — `(account_id, client_id, listing_id?)` with `status` open/closed.
  Deduplicated by participants (listing-aware).
- **`app.message`** — `conversation_id`, `sender_role` (worker/customer), `body`, `original_body?`,
  `status` (delivered/redacted/held/blocked).
- **`app.moderation_verdict`** — `message_id`, `conversation_id`, `tier` (1/2), `categories[]`,
  `score`, `action`, `reason`, `excerpt?`, `needs_review`, `review_status`
  (open/actioned/dismissed). A partial index on `(review_status) where needs_review` backs the
  queue.

## HTTP surface

Messaging (`routes/messaging.ts`):

- `POST /conversations` → start (or dedupe) a conversation. 201.
- `GET  /conversations/:id` → fetch a conversation.
- `GET  /conversations/:id/messages` → chronological message list.
- `POST /conversations/:id/messages` → send a message (runs Tier-1 inline). 201.

Moderation admin (`routes/moderation.ts`):

- `GET  /moderation/queue` → open verdicts needing review, newest first.
- `GET  /moderation/messages/:messageId/verdicts` → all verdicts for a message.
- `POST /moderation/verdicts/:id/resolve` → resolve a verdict (`actioned` | `dismissed`).

## Provider wiring

`ModerationProvider` is the swappable Tier-2 port (`core/ports.ts`); no API keys live in the domain.

- `fakeModerationProvider()` (in `core/testing`) — deterministic, no network. Used in the in-memory
  container and all tests.
- `placeholderModerationProvider()` — always allows. Safe inert default.
- `openaiModerationProvider(apiKey, model)` — real `fetch` to the OpenAI Chat Completions API in
  JSON mode (default model `gpt-4o-mini`, overridable via `OPENAI_MODEL`). **Fails open** to `allow`
  on any error — Tier-1 already gated the message synchronously, so a failed async pass must never
  block delivery.
- `productionModerationProvider()` — `openaiModerationProvider` when `OPENAI_API_KEY` is set,
  otherwise the placeholder.

The in-memory container uses the fake; the pg container uses `productionModerationProvider()`. Both
subscribe `moderationService.screenDeep` to `message.sent` after the container is assembled.

## Known follow-ups

- **Admin authz.** Moderation routes pass actor IDs in the request body with no role enforcement.
  A real auth/role layer is needed before these endpoints are exposed to non-admins.
- **Real LLM key wiring.** Tier-2 is inert until `OPENAI_API_KEY` is provisioned in the pg
  environment (optionally set `OPENAI_MODEL`).
- **Retention sweep.** The column design enables a scheduled retention/erasure sweep, but the cron
  job itself is out of scope for this build — documented, not built.
- **Deeper safety integration.** Confirmed `safety_legal` cases currently publish a
  `moderation.safety_escalation` event; integrating that with the existing `safety` / `screening`
  domains (offender reports, check-ins) is a future step.
