-- =============================================================================
-- 0091_moderation.sql — Moderation verdicts (two-tier chat governance)
-- =============================================================================
-- A moderation_verdict records the outcome of screening a message: Tier-1 is the
-- inline deterministic filter (redact/hold/block/escalate), Tier-2 is the async
-- LLM pass that only flags for human review. excerpt stores only the matched
-- snippet, never a full body copy. Verdicts cascade-delete from their message
-- (and thus from the participant identity root), so GDPR erasure removes them.
-- The partial queue index serves the human review queue (needs_review + open).
-- =============================================================================

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

drop trigger if exists set_updated_at on app.moderation_verdict;
create trigger set_updated_at
  before update on app.moderation_verdict
  for each row execute function app.set_updated_at();

-- RLS: verdicts reference message content (excerpt) and moderation decisions.
alter table app.moderation_verdict enable row level security;
