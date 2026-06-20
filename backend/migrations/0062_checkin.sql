-- =============================================================================
-- 0062_checkin.sql — Safety domain: trusted contacts + booking check-in / panic
-- =============================================================================
-- An account registers trusted contacts and starts a timed check-in before a
-- booking. If they do not mark themselves safe before expected_end_at the
-- session becomes overdue; a panic trigger flags it immediately. Both states
-- emit events (handled in-process via the EventBus port) to notify contacts.
--
-- GDPR: trusted-contact details are stored ONLY as a normalised SHA-256 hash —
-- never the raw phone/email. Both FKs cascade from app.account (right to be
-- forgotten). RLS baseline enabled on both tables.
-- =============================================================================

create table if not exists app.trusted_contact (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references app.account(id) on delete cascade,
  name         text not null,
  contact_hash text not null,         -- hash-only; never the raw contact value
  created_at   timestamptz not null default now()
);

create index if not exists trusted_contact_account_id_idx
  on app.trusted_contact (account_id);

create table if not exists app.check_in_session (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references app.account(id) on delete cascade,
  trusted_contact_id uuid not null references app.trusted_contact(id) on delete cascade,
  started_at         timestamptz not null default now(),
  expected_end_at    timestamptz not null,
  status             text not null default 'active'
                       check (status in ('active', 'safe', 'overdue', 'panic')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- evaluateOverdue scans active sessions past their expected_end_at.
create index if not exists check_in_session_status_idx
  on app.check_in_session (status);
create index if not exists check_in_session_account_id_idx
  on app.check_in_session (account_id);

drop trigger if exists set_updated_at on app.check_in_session;
create trigger set_updated_at
  before update on app.check_in_session
  for each row execute function app.set_updated_at();

-- RLS: both tables hold personal-linked data (hashed contacts, account links).
alter table app.trusted_contact enable row level security;
alter table app.check_in_session enable row level security;
