-- =============================================================================
-- 0090_messaging.sql — Messaging domain (worker ↔ customer conversations)
-- =============================================================================
-- A conversation links an app.account (worker) to an app.client (customer),
-- optionally scoped to a listing. Messages are the chat content exchanged within
-- a conversation. Following the app.enquiry precedent, messages are personal
-- *content* (not identity PII like email), so they live in app.* with RLS
-- enabled rather than identity.*. message.body holds the delivered text
-- (post-redaction if any); message.original_body preserves the pre-redaction
-- text only when Tier-1 altered the message, for appeals. Both tables
-- cascade-delete from their identity roots (account/client/listing), so GDPR
-- erasure of a participant hard-deletes their conversations and messages. A
-- scheduled retention sweep is out of scope here; the column design enables it.
-- =============================================================================

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

drop trigger if exists set_updated_at on app.conversation;
create trigger set_updated_at
  before update on app.conversation
  for each row execute function app.set_updated_at();

-- RLS: conversations link participant identities and carry no identity PII, but
-- gate them behind RLS following the app.* content convention.
alter table app.conversation enable row level security;

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

drop trigger if exists set_updated_at on app.message;
create trigger set_updated_at
  before update on app.message
  for each row execute function app.set_updated_at();

-- RLS: messages carry personal chat content (body, original_body).
alter table app.message enable row level security;
