-- =============================================================================
-- 0010_accounts.sql — Accounts domain
-- =============================================================================
-- Real-world identity (email) is GDPR-separated into the restricted `identity`
-- schema. The app.account row holds role/status only and references the
-- identity row by the SAME UUID. Erasing identity.account cascades to
-- app.account (right to be forgotten).
-- =============================================================================

create extension if not exists citext;

-- Restricted real-world identity. Referenced from app by opaque UUID only.
create table if not exists identity.account (
  id         uuid primary key default gen_random_uuid(),
  email      citext unique not null,
  created_at timestamptz not null default now()
);

-- Public app-side account: role/status only, no personal data.
create table if not exists app.account (
  id         uuid primary key references identity.account(id) on delete cascade,
  role       text not null check (role in ('advertiser', 'admin')),
  status     text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on app.account;
create trigger set_updated_at
  before update on app.account
  for each row execute function app.set_updated_at();

-- RLS: both tables hold personal data (identity) / personal-linked data (app).
alter table identity.account enable row level security;
alter table app.account enable row level security;
