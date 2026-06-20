# Chat Moderation Middleware — Build Spec

AI-governed middleman that sits between **workers** (advertisers/escorts, `app.account`) and
**customers** (`app.client`) to detect scams and safety issues on either side. Hybrid enforcement,
full scope, tiered AI authority. This document is the single source of truth for the build.

## Decisions (locked)

- **Enforcement = hybrid.** A cheap deterministic Tier-1 filter runs **inline** inside
  `MessagingService.sendMessage` and may redact/hold/block before delivery. A nuanced Tier-2 LLM
  pass runs **async** off the `message.sent` event and only flags for human review.
- **Authority = tiered.** Tier-1 may auto-act on high-confidence mechanical cases (redact a phone
  number, hold a payment-redirection). Anything ambiguous or account-level (suspension, safety) is
  written to a review queue / escalated — **never auto-suspends an account**.
- **Scope = all four categories:** `financial_scam`, `off_platform`, `harassment`, `safety_legal`.
- **Retention / privacy.** Messages are personal *content* (not identity PII like email), so —
  following the `app.enquiry` precedent — they live in `app.*` with RLS enabled, not `identity.*`.
  - `app.message.body` holds the **delivered** text (post-redaction if any).
  - `app.message.original_body` is populated **only when Tier-1 altered the message** (redaction),
    preserving evidence for appeals; null otherwise — we do not keep a second copy of clean text.
  - `app.moderation_verdict.excerpt` stores only the **matched snippet**, never a full body copy.
  - All three tables `enable row level security` and cascade-delete from the participant's identity
    root (GDPR erasure). A scheduled retention sweep is **out of scope** for this build; the column
    design enables it later. Document, do not build.
- **Authz gap (flagged, not solved).** The backend has no auth/role middleware; actor IDs are passed
  in request bodies (existing convention). Moderation admin routes follow that convention and the
  gap is documented as a known follow-up — we do **not** invent an auth system here.

## Conventions to mirror (read these before writing)

- Domain template: `src/accounts/*` (enum fields) and `src/clients/*` (status-only).
- Multi-entity domain (multiple repos in one service): `src/referrals/*`, wired in `container.ts`.
- EventBus publisher precedent: `src/safety/checkInService.ts` (`eventBus.publish`).
- Migration template: `migrations/0070_enquiries.sql` (+ `0050_clients.sql`, `0000_foundation.sql`).
- Route template: `src/app/routes/clients.ts`; registrar list `src/app/routes/index.ts`.
- Core barrel `src/core` re-exports ids/clock/errors/hasher/repository/db/ports. Import shared
  primitives from `"../core"`. Split value vs `import type`.
- Errors: throw `NotFoundError` / `ConflictError` / `ValidationError` from `../core`.
- IDs via `newId()`; timestamps via `this.clock.now()` (never `new Date()` in services).
- Tests: vitest, module-level `NOW`, `fixedClock(NOW)` from `../core`, in-memory repos,
  `await expect(p).rejects.toBeInstanceOf(...)`.
- **AGENTS.md Zod rule:** never `.optional()` without `.nullable()`; never `z.record()`.

## Shared contract — `src/core/ports.ts` (ADD, do not remove existing)

```ts
export type ModerationCategory =
  | "financial_scam"
  | "off_platform"
  | "harassment"
  | "safety_legal";

export type ModerationAction =
  | "allow"     // deliver unchanged
  | "redact"    // deliver with matched spans masked
  | "hold"      // do not deliver; queue for review
  | "block"     // do not deliver; hard stop
  | "flag"      // deliver, but record for review
  | "escalate"; // deliver, raise a safety escalation (never auto-block)

/**
 * AI moderation port. Tier-2 nuanced analysis lives behind this interface so the
 * real LLM call is swappable and no API keys live in the domain. context is the
 * recent conversation (oldest→newest) for trajectory-aware judgement.
 */
export interface ModerationProvider {
  analyze(input: {
    body: string;
    context: { senderRole: "worker" | "customer"; body: string }[];
    focus: ModerationCategory[];
  }): Promise<{
    flagged: boolean;
    categories: ModerationCategory[];
    score: number; // 0..1
    action: ModerationAction;
    reason: string;
  }>;
}
```

## `src/core/testing/index.ts` (ADD)

`fakeModerationProvider(): ModerationProvider` — deterministic, no network:
- `/traffick|under ?age|under ?18|coerc|\b1[0-5]\b/i` → `{ flagged:true, categories:["safety_legal"], score:0.95, action:"escalate" }`
- else `/bitcoin|crypto|wire transfer|gift ?card|western union/i` → `{ flagged:true, categories:["financial_scam"], score:0.8, action:"hold" }`
- else `{ flagged:false, categories:[], score:0, action:"allow", reason:"" }`

## Domain: `src/moderation/`

### types.ts
```ts
export interface ModerationVerdict {
  id: UUID;
  messageId: UUID;
  conversationId: UUID;
  tier: 1 | 2;
  categories: ModerationCategory[];
  score: number;
  action: ModerationAction;
  reason: string;
  excerpt: string | null;
  needsReview: boolean;
  reviewStatus: "open" | "actioned" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}
export interface Tier1Result {
  categories: ModerationCategory[];
  action: ModerationAction;
  redactedBody: string;   // === input body when nothing was redacted
  excerpt: string | null;
}
export interface InlineResult {
  verdict: ModerationVerdict;
  redactedBody: string;
}
// resolveVerdictSchema = z.object({ status: z.enum(["actioned","dismissed"]) })
```
Re-export `ModerationCategory`, `ModerationAction` from `../core` for convenience.

### tier1.ts — pure, no I/O
`export function screenTier1(body: string): Tier1Result`
- Detectors (case-insensitive):
  - **off_platform** → action `redact`: UK/intl phone numbers (`/(?:\+?\d[\s().-]?){10,}/`),
    email addresses, `t.me/…`, `wa.me/…`, and the app words `whatsapp|telegram|signal|kik|viber`.
    Mask each match with `[redacted]` in `redactedBody`.
  - **financial_scam** → action `hold`: `cashapp|venmo|paypal|zelle|revolut|bank transfer|sort code|`
    `iban|bitcoin|btc|crypto|gift ?card|western union|wire transfer`.
  - **harassment** → action `flag`: a small threat/abuse list (keep professional/minimal, e.g.
    `\b(kill you|rape|i know where you live)\b`).
  - **safety_legal** → action `escalate`: `\b1[0-5]\b|under ?age|under ?18|minor|school ?girl|`
    `coerc|forced|against (?:your|her|his) will|traffick`.
- Combine all matched categories. **Action precedence (strongest wins):**
  `escalate > block > hold > redact > flag > allow`.
- `excerpt` = first ~120 chars around the strongest match, else null.
- Only `redact` mutates `redactedBody`; otherwise `redactedBody === body`.

### moderationRepository.ts (port)
```ts
export interface ModerationRepository extends Repository<ModerationVerdict> {
  listByMessage(messageId: UUID): Promise<ModerationVerdict[]>;
  listQueue(): Promise<ModerationVerdict[]>; // needsReview && reviewStatus==='open', newest first
}
```

### inMemoryModerationRepository.ts
`extends InMemoryRepository<ModerationVerdict> implements ModerationRepository`; finders via `this.list()`.

### pgModerationRepository.ts
- Single table `app.moderation_verdict` (no identity split → single-step upsert, no join).
- Row interface snake_case; `categories text[]` ↔ `string[]`; `score numeric` ↔ `Number(row.score)`;
  `tier smallint` ↔ `(row.tier as 1|2)`; `needs_review`↔`needsReview`; `review_status`↔`reviewStatus`.
- `save` = `insert … on conflict (id) do update set tier, categories, score, action, reason, excerpt, needs_review, review_status, updated_at`.
- `listByMessage` where message_id; `listQueue` where needs_review and review_status='open' order by created_at desc.

### moderationService.ts
Constructor `(repo: ModerationRepository, provider: ModerationProvider, clock: Clock, eventBus: EventBus)`.
- `async screenInline({ messageId, conversationId, senderRole, body }): Promise<InlineResult>`
  - `const t1 = screenTier1(body)`
  - build `ModerationVerdict` (tier 1) with `t1.categories/action/excerpt`,
    `needsReview = action==='hold' || action==='escalate' || action==='block'`, `reviewStatus:'open'`,
    `score: t1.action==='allow' ? 0 : 0.7`, `reason` describing the match.
  - if `action==='escalate'` → `await eventBus.publish({ type:'moderation.safety_escalation', payload:{ messageId, conversationId, categories:t1.categories } })`.
  - `await repo.save(verdict)`; return `{ verdict, redactedBody: t1.redactedBody }`.
- `async screenDeep({ messageId, conversationId, senderRole, body, context }): Promise<void>`
  - `const r = await provider.analyze({ body, context, focus:["financial_scam","off_platform","harassment","safety_legal"] })`
  - if `!r.flagged` return.
  - persist a tier-2 `ModerationVerdict` (`needsReview:true`, `reviewStatus:'open'`, fields from `r`).
  - if `r.categories.includes("safety_legal")` → publish `moderation.safety_escalation`.
- `listQueue()` → `repo.listQueue()`.
- `async resolve(id, status: "actioned"|"dismissed")` → getById (NotFoundError) → set reviewStatus,
  needsReview=false, updatedAt=clock.now() → save.

### moderation.test.ts (vitest, in-memory repo + fakeModerationProvider)
Cover: phone/email/app-word → redact + redactedBody masked; payment word → hold + needsReview;
safety word → escalate + publishes `moderation.safety_escalation` (subscribe a spy on the bus);
clean → allow, score 0, needsReview false; `screenDeep` with a safety body persists a tier-2 verdict
and escalates; `listQueue` returns only open+needsReview; `resolve` flips reviewStatus and clears
needsReview; resolve on missing id → NotFoundError.

## Domain: `src/messaging/`

Two entities → two repos (referrals precedent).

### types.ts
```ts
export interface Conversation {
  id: UUID; accountId: UUID; clientId: UUID; listingId: UUID | null;
  status: "open" | "closed"; createdAt: Date; updatedAt: Date;
}
export type MessageStatus = "delivered" | "redacted" | "held" | "blocked";
export interface Message {
  id: UUID; conversationId: UUID; senderRole: "worker" | "customer";
  body: string; originalBody: string | null; status: MessageStatus;
  createdAt: Date; updatedAt: Date;
}
// startConversationSchema = z.object({ accountId: z.string().uuid(), clientId: z.string().uuid(),
//   listingId: z.string().uuid().nullable().default(null) })
// sendMessageSchema = z.object({ senderRole: z.enum(["worker","customer"]),
//   body: z.string().min(1).max(4000) })
```

### conversationRepository.ts / messageRepository.ts (ports)
- `ConversationRepository extends Repository<Conversation>` + `findByParticipants(accountId, clientId, listingId: UUID|null): Promise<Conversation|undefined>`.
- `MessageRepository extends Repository<Message>` + `listByConversation(conversationId): Promise<Message[]>` (oldest→newest).

### in-memory + pg adapters
- pg conversation table `app.conversation`; message table `app.message`. Single-step upserts, no
  identity join. `findByParticipants` matches account_id, client_id, and listing_id (use `is not
  distinct from` for the nullable listing_id). `listByConversation` order by created_at asc.

### messagingService.ts
Constructor `(conversations: ConversationRepository, messages: MessageRepository, moderation: ModerationService, clock: Clock, eventBus: EventBus)`.
- `async startConversation(input)`: parse; `findByParticipants` → return existing if found; else build
  Conversation (`status:'open'`, listingId from input) + save.
- `async sendMessage({ conversationId, ...input })`:
  - load conversation (NotFoundError if missing); parse input.
  - `messageId = newId()`, `now = clock.now()`.
  - `const inline = await moderation.screenInline({ messageId, conversationId, senderRole, body })`.
  - map `inline.verdict.action` → `{ status, body, originalBody }`:
    - `redact` → status `redacted`, body `inline.redactedBody`, originalBody original.
    - `hold` → status `held`, body original, originalBody null.
    - `block` → status `blocked`, body original, originalBody null.
    - `allow|flag|escalate` → status `delivered`, body original, originalBody null.
  - save Message with the chosen fields + `id:messageId`, timestamps.
  - touch conversation `updatedAt` (save).
  - if status is **not** `blocked`/`held`: build `context` = last 10 messages of the conversation
    (`{senderRole, body}` oldest→newest) and
    `await eventBus.publish({ type:'message.sent', payload:{ messageId, conversationId, senderRole, body, context } })`.
  - return the saved Message.
- `getConversation(id)` → NotFoundError if missing.
- `listMessages(conversationId)` → `messages.listByConversation`.

### messaging.test.ts
Wire a real `ModerationService` (in-memory moderation repo + `fakeModerationProvider`) into
`MessagingService` (in-memory conversation + message repos), `fixedClock(NOW)`, shared
`inMemoryEventBus`. Cover: start creates + dedups by participants; clean message delivered; a body
with a phone number is stored `redacted` with masked body + originalBody set; a payment-word body is
`held` and not published for Tier-2 (assert no `message.sent` for held); safety body is `delivered`
but raises escalation via Tier-1; `listMessages` returns chronological; sending to a missing
conversation → NotFoundError. Verify a `message.sent` subscriber receives context for a delivered msg.

## Migrations (next free block)

`migrations/0090_messaging.sql`:
```sql
create table if not exists app.conversation (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references app.account(id) on delete cascade,
  client_id   uuid not null references app.client(id)  on delete cascade,
  listing_id  uuid references app.listing(id) on delete cascade,
  status      text not null default 'open' check (status in ('open','closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists conversation_account_id_idx on app.conversation (account_id);
create index if not exists conversation_client_id_idx  on app.conversation (client_id);
-- set_updated_at trigger (copy 0070 pattern); enable row level security.

create table if not exists app.message (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references app.conversation(id) on delete cascade,
  sender_role     text not null check (sender_role in ('worker','customer')),
  body            text not null,
  original_body   text,
  status          text not null default 'delivered'
                    check (status in ('delivered','redacted','held','blocked')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists message_conversation_id_idx on app.message (conversation_id, created_at);
-- set_updated_at trigger; enable row level security.
```

`migrations/0091_moderation.sql`:
```sql
create table if not exists app.moderation_verdict (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references app.message(id) on delete cascade,
  conversation_id uuid not null references app.conversation(id) on delete cascade,
  tier            smallint not null check (tier in (1,2)),
  categories      text[] not null default '{}',
  score           numeric(4,3) not null default 0,
  action          text not null check (action in ('allow','redact','hold','block','flag','escalate')),
  reason          text not null default '',
  excerpt         text,
  needs_review    boolean not null default false,
  review_status   text not null default 'open' check (review_status in ('open','actioned','dismissed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists moderation_verdict_message_id_idx on app.moderation_verdict (message_id);
create index if not exists moderation_verdict_queue_idx
  on app.moderation_verdict (review_status) where needs_review;
-- set_updated_at trigger; enable row level security.
```

## Integration

### `src/app/providers.ts` (ADD)
- `placeholderModerationProvider(): ModerationProvider` → always `{ flagged:false, categories:[], score:0, action:"allow", reason:"" }` (safe default, mirrors other placeholders).
- `anthropicModerationProvider(apiKey: string): ModerationProvider` → real `fetch` to
  `https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`,
  `content-type: application/json`. Model `claude-haiku-4-5-20251001`, `max_tokens: 400`. System
  prompt: "You are a trust-and-safety classifier for an adult-services marketplace chat. Detect
  financial_scam, off_platform, harassment, safety_legal. Respond ONLY with JSON
  {flagged, categories[], score, action, reason}." User content = the focus categories, the context
  transcript, and the message body. Parse the JSON from the first text block; on any error return the
  safe-default allow verdict (fail-open for the async path — Tier-1 already gated synchronously).
- `productionModerationProvider(): ModerationProvider` → `process.env.ANTHROPIC_API_KEY` present ?
  `anthropicModerationProvider(key)` : `placeholderModerationProvider()`.

### `src/app/container.ts`
- Add `moderationService: ModerationService` and `messagingService: MessagingService` to `Container`.
- In `createInMemoryContainer`: build `moderationService` with in-memory repo + `fakeModerationProvider()` + clock + eventBus; build `messagingService` with in-memory conv/msg repos + that moderationService + clock + eventBus; then
  `eventBus.subscribe("message.sent", (p) => { void container.moderationService.screenDeep(p as any); });`
  (subscribe after the container object exists, like seeds at the end).
- In `createPgContainer`: same, with pg repos + `productionModerationProvider()`. Subscribe the same way before `return`.

### `src/app/routes/messaging.ts` + `moderation.ts` (+ register in `routes/index.ts`)
- `registerMessaging`: `POST /conversations` (201), `GET /conversations/:id`,
  `GET /conversations/:id/messages`, `POST /conversations/:id/messages` (201).
- `registerModeration`: `GET /moderation/queue`, `GET /moderation/messages/:messageId/verdicts`,
  `POST /moderation/verdicts/:id/resolve` (body `resolveVerdictSchema`).
- Validate with Zod inline; throw core errors; let the central handler map them.

### `docs/chat-moderation.md`
Human-facing summary of the feature: architecture (gateway/two-tier/hybrid), the decisions above
(enforcement, authority, scope, retention, authz gap), the data model, and the known follow-ups
(real LLM key wiring, retention sweep cron, admin authz, deeper integration with the `safety`/
`screening` domains for confirmed safety_legal cases).

## Verification gates (every agent runs before returning)
- `npx tsc --noEmit` clean.
- `npm test` green (new tests + no regressions in touched scope).
- `npm run lint` clean for changed files.
