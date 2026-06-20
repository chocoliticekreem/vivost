-- =============================================================================
-- 0021_subscriptions.sql — Monetization: account subscriptions
-- =============================================================================
-- A subscription ties an account (opaque UUID into app.account) to a plan.
-- account_id FK is ON DELETE CASCADE so erasing an account hard-deletes its
-- subscriptions (GDPR right to erasure). plan_id is RESTRICT — a plan in use
-- cannot be deleted out from under live subscriptions.
-- =============================================================================

create table if not exists app.subscription (
  id                   uuid primary key default gen_random_uuid(),
  account_id           uuid not null references app.account(id) on delete cascade,
  plan_id              uuid not null references app.plan(id) on delete restrict,
  status               text not null default 'active'
                         check (status in ('active','cancelled','expired')),
  started_at           timestamptz not null default now(),
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists subscription_account_idx on app.subscription (account_id);
create index if not exists subscription_status_idx on app.subscription (status);

drop trigger if exists set_updated_at on app.subscription;
create trigger set_updated_at before update on app.subscription
  for each row execute function app.set_updated_at();

alter table app.subscription enable row level security;

-- An account may read its own subscriptions; writes go through the service role.
drop policy if exists subscription_owner_read on app.subscription;
create policy subscription_owner_read on app.subscription
  for select using (account_id = current_setting('app.account_id', true)::uuid);
