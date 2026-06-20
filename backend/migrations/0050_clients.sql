-- =============================================================================
-- 0050_clients.sql — Clients domain (customer / booker accounts)
-- =============================================================================
-- Mirrors the accounts pattern: real-world identity (email) is GDPR-separated
-- into the restricted `identity` schema. The app.client row holds status only
-- and references the identity row by the SAME UUID. Erasing identity.client
-- cascades to app.client (right to be forgotten).
-- =============================================================================

create extension if not exists citext;

-- Restricted real-world identity. Referenced from app by opaque UUID only.
create table if not exists identity.client (
  id         uuid primary key default gen_random_uuid(),
  email      citext unique not null,
  created_at timestamptz not null default now()
);

-- Public app-side client: status only, no personal data.
create table if not exists app.client (
  id         uuid primary key references identity.client(id) on delete cascade,
  status     text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on app.client;
create trigger set_updated_at
  before update on app.client
  for each row execute function app.set_updated_at();

-- RLS: both tables hold personal data (identity) / personal-linked data (app).
alter table identity.client enable row level security;
alter table app.client enable row level security;
