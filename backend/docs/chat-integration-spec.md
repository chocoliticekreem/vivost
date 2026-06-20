# Chat ↔ Platform Integration + Enforcement Spec

Connects the Vivost React frontend (`/Users/burgerking/vivost/vivost/build`) to the messaging API so a
**customer can message a worker from a profile page**, with AI moderation that **takes real action**.
Builds on `chat-moderation-spec.md` and `chat-moderation.md`.

## Locked decisions
- **Enforcement = block outright.** financial_scam, safety_legal, harassment → message is **blocked**
  (not delivered to the recipient). off_platform (phone/handle/email) → **redact** (deliver masked —
  phone numbers must not be shown but ARE kept in the DB via `original_body`). Clean → deliver.
- **User action = warn only.** Each blocked message increments a per-sender strike count shown to the
  sender as an escalating warning. **No auto-suspend** — a human suspends from the moderator queue.
- **Phone numbers hidden in the platform UI, kept in data.** The profile page no longer renders the
  worker phone; the value stays in `profiles.generated.ts` (the "DB"). In chat, any phone a user
  types is redacted in the delivered body, original kept in `app.message.original_body`.
- **Identity.** No auth exists. Worker = a `Profile` (`profile.id`). The backend maps each profile to
  an idempotent worker account; the customer is an anonymous client persisted in `localStorage`.

---

## BACKEND CHANGES (`/Users/burgerking/vivost/vivost/backend`)

### 1. `src/moderation/tier1.ts` — new action mapping
Change the per-category action so the three abuse categories block:
- `safety_legal` → `block`
- `financial_scam` → `block`
- `harassment` → `block`
- `off_platform` → `redact` (unchanged; still masks matched spans into `redactedBody`)
- Precedence (strongest wins): **`block > redact > allow`**. Update `ACTION_RANK` usage accordingly
  (block highest). `escalate`/`hold`/`flag` are no longer emitted by Tier-1 but stay in the
  `ModerationAction` type (Tier-2 may still use them).
- `excerpt` logic unchanged.

### 2. `src/moderation/moderationService.ts`
- `evaluateInline`: `needsReview = verdict.action === "block"`; `score`: allow→0, redact→0.5, block→0.9.
- `commitInline`: publish the `moderation.safety_escalation` event when
  **`verdict.categories.includes("safety_legal")`** (category-driven, not action-driven, since safety
  now maps to `block`). Keep saving the verdict.
- `screenInline` unchanged (wrapper over evaluate+commit).

### 3. `src/messaging/types.ts` — richer send result
Add:
```ts
export interface MessageModeration {
  action: ModerationAction;       // from ../core
  categories: ModerationCategory[];
  blocked: boolean;               // status === "blocked" || "held"
  delivered: boolean;             // status === "delivered" || "redacted"
  redacted: boolean;              // status === "redacted"
  reason: string;
  strikeCount: number;            // this sender's blocked messages in the conversation (incl. this one)
  warning: string | null;         // user-facing escalating warning, or null
}
export interface SendMessageResult {
  message: Message;
  moderation: MessageModeration;
}
```

### 4. `src/messaging/messagingService.ts` — `sendMessage` returns `SendMessageResult`
After saving the message and committing the verdict:
- Compute `strikeCount`: from `messages.listByConversation(conversationId)`, count messages where
  `senderRole === parsed.senderRole && status === "blocked"` (the just-saved one is included).
- Build `warning`:
  - blocked → `⚠ Your message was blocked (${categories.join(", ")}). This is warning ${strikeCount}. Keep the conversation on-platform and respectful.`
  - redacted → `Contact details were hidden for your safety and kept on record.`
  - else → `null`
- **Warn only — never suspend.** Do not call any suspend method.
- Return `{ message: saved, moderation: { action: evaluation.verdict.action, categories: evaluation.verdict.categories, blocked, delivered, redacted, reason: evaluation.verdict.reason, strikeCount, warning } }`.
- `message.sent` is still published only when `status` is `delivered` or `redacted` (not blocked/held).
- `block` status mapping already exists in the switch; with the new Tier-1 it now fires for the abuse
  categories. Keep redact→`redacted`(+originalBody), block→`blocked`, default→`delivered`.

### 5. Idempotent identity helpers
- `src/accounts/accountsService.ts` → add `async ensureByEmail(email: string, role: AccountRole = "advertiser"): Promise<Account>`: normalise email, `repo.findByEmail`; if found return it; else `register({ email, role })`.
- `src/clients/clientsService.ts` → add `async ensureByEmail(email: string): Promise<Client>`: same pattern via its repo's `findByEmail` (check the clients repo has `findByEmail`; clients `register` exists). If the clients repo lacks `findByEmail`, add it to the port + both adapters mirroring accounts.

### 6. `src/app/routes/messaging.ts` — new start endpoint + new send response
- Add `POST /messaging/start`:
  ```ts
  const startSchema = z.object({
    workerRef: z.string().min(1),
    workerName: z.string().nullable().default(null),
    customerEmail: z.string().email(),
  });
  // handler:
  const { workerRef, customerEmail } = startSchema.parse(req.body);
  const worker = await c.accountsService.ensureByEmail(`worker.${workerRef}@vivost.local`, "advertiser");
  const customer = await c.clientsService.ensureByEmail(customerEmail);
  const conversation = await c.messagingService.startConversation({ accountId: worker.id, clientId: customer.id, listingId: null });
  return { conversationId: conversation.id, customerId: customer.id, workerId: worker.id };
  ```
- The existing `POST /conversations/:id/messages` now returns the `SendMessageResult` from
  `sendMessage` (no route change needed beyond returning what the service returns).

### 7. Update tests (keep the suite green)
- `src/moderation/moderation.test.ts` + any `tier1` test: safety/financial/harassment now assert
  `action === "block"` (were escalate/hold/flag); off_platform still `redact`; clean `allow`. Safety
  still publishes `moderation.safety_escalation`. `listQueue` returns the blocked verdicts.
- `src/messaging/messaging.test.ts`: `sendMessage` now returns `SendMessageResult` — update
  assertions to read `result.message` / `result.moderation`. Payment/safety/harassment bodies →
  `result.message.status === "blocked"`, `result.moderation.blocked === true`, not delivered to the
  recipient, NO `message.sent` published; `strikeCount` increments on a second blocked send;
  `warning` is non-null. Phone body → `redacted` + masked body + `moderation.redacted`. Clean →
  `delivered`, `moderation.action === "allow"`.
- `src/accounts/accounts.test.ts` + `src/clients/clients.test.ts`: add `ensureByEmail` tests
  (creates when absent; returns the SAME entity when present — no duplicate).

### 8. `public/chat-tester.html`
Update the existing tester for the new send response: read `result.message`/`result.moderation`,
and when `moderation.blocked` show the `warning` text as a system notice in the sender's pane. (The
GET endpoints are unchanged.)

### Verify (backend): `npx tsc --noEmit` clean, `npx vitest run` all green, `npx eslint .` no errors.

---

## FRONTEND CHANGES (`/Users/burgerking/vivost/vivost/build`)

React 18 + react-router v6, webpack, global CSS in `src/styles/theme.css`. Static data, no network
today, no auth. `localStorage` is the established persistence (see `AgeGate.tsx`). Match the look:
`className="card"` panels, `className="btn-amber"` primary buttons, `var(--text-*)`,
`var(--glass-border)`, accent `--accent:#ff3d7f`.

### 1. `src/api/chat.ts` (new) — API client + customer identity
- `const API_BASE = "http://localhost:8787";`
- Types mirroring the backend: `Message`, `MessageModeration`, `SendMessageResult`.
- `function getCustomerEmail(): string` — `localStorage["vivost-customer-email"]`; if absent, set it
  to `guest.${crypto.randomUUID()}@vivost.local` and persist.
- `async function startConversation(workerRef: string, workerName: string): Promise<{conversationId:string; customerId:string}>`
  — `POST /messaging/start` with `{ workerRef, workerName, customerEmail: getCustomerEmail() }`. Cache
  the returned `conversationId` in `localStorage["vivost-convo-" + workerRef]` and reuse if present
  (still revalidate by calling start — it's idempotent).
- `async function sendMessage(conversationId, body): Promise<SendMessageResult>` — `POST /conversations/${id}/messages` `{ senderRole: "customer", body }`.
- `async function listMessages(conversationId): Promise<Message[]>` — `GET /conversations/${id}/messages`.
- All requests `headers: {"content-type":"application/json"}`; throw on non-2xx with the server error
  message.

### 2. `src/components/ChatPanel.tsx` (new) — customer→worker chat overlay
- Props: `{ workerRef: string; workerName: string; onClose: () => void }`.
- Full-screen overlay modeled on `AgeGate.tsx:39-75` (fixed dim background + centered `.card`,
  `role="dialog" aria-modal`, an ✕ close, click-backdrop-to-close).
- On mount: `startConversation(workerRef, workerName)` → store conversationId; then poll
  `listMessages` every ~1500ms.
- Render the thread: the customer's own messages right-aligned; worker messages (if any) left. Show a
  small status chip on the customer's own messages (`delivered`/`redacted`/`blocked`). For `redacted`
  show a subtle "contact details hidden" note; for `blocked` show it greyed/struck with a 🚫.
- Composer (input + `btn-amber` Send). On send: call `sendMessage`; if `result.moderation.warning`,
  show it as a dismissible banner above the composer (amber for redacted, red for blocked). Then
  refresh the list. Never optimistically show a blocked message as delivered.
- Header: "Message {workerName}" + a tiny line "Protected by AI moderation — keep it on-platform."

### 3. `src/pages/ProfileDetail.tsx` — replace phone CTA with Message button
- Remove the phone reveal block (`ProfileDetail.tsx:144-162`: the "Show contact details"/`profile.phone`
  button AND the `tel:` "Tap to call" link) and the now-unused `showContact` state (line 11).
- In its place, a primary button:
  ```tsx
  <button className="btn-amber" style={{ width:'100%', padding:'15px', fontSize:'16px', marginBottom:'10px' }}
    onClick={() => setShowChat(true)}>
    Message {profile.name}
  </button>
  ```
  with `const [showChat, setShowChat] = useState(false);` and, near the end of the returned JSX,
  `{showChat && <ChatPanel workerRef={profile.id} workerName={profile.name} onClose={() => setShowChat(false)} />}`.
- Do NOT render `profile.phone` anywhere. Leave the data field intact. The "Report this listing"
  block stays as-is.

### Verify (frontend): `npm run build` (webpack, ts-loader typechecks) succeeds with no TS errors.

---

## Notes
- CORS: backend already sets `origin: true`, so the `:3000` frontend can call `:8787`.
- pg FK: `/messaging/start` ensures the worker account + customer client EXIST before
  `startConversation`, so the `app.conversation` FKs hold in Postgres mode (the previous FK bug class).
- `API_BASE` is hardcoded to localhost for this dev integration; productionising it (env/DefinePlugin)
  is a follow-up.
