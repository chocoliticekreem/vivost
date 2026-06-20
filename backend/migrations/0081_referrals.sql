-- =============================================================================
-- 0081_referrals.sql — Referrals domain
-- =============================================================================
-- Activation-gated, double-sided referral rewards. All rows are activity data
-- referencing app.account by opaque UUID. Every FK that ties back to an account
-- is ON DELETE CASCADE so erasing an account (right to be forgotten) hard-
-- deletes its referral codes, referrals, and reward ledger entries.
-- =============================================================================

create table if not exists app.referral_code (
  id               uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references app.account(id) on delete cascade,
  code             text not null unique,
  created_at       timestamptz not null default now()
);

create index if not exists referral_code_owner_idx
  on app.referral_code (owner_account_id);

create table if not exists app.referral (
  id                  uuid primary key default gen_random_uuid(),
  code_id             uuid not null references app.referral_code(id) on delete cascade,
  referred_account_id uuid not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'activated')),
  created_at          timestamptz not null default now(),
  activated_at        timestamptz
);

create index if not exists referral_code_id_idx on app.referral (code_id);

create table if not exists app.reward_ledger (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references app.account(id) on delete cascade,
  amount_minor bigint not null,
  reason       text not null,
  created_at   timestamptz not null default now()
);

create index if not exists reward_ledger_account_idx
  on app.reward_ledger (account_id);

alter table app.referral_code enable row level security;
alter table app.referral enable row level security;
alter table app.reward_ledger enable row level security;

create policy referral_code_service_all
  on app.referral_code for all using (true) with check (true);

create policy referral_service_all
  on app.referral for all using (true) with check (true);

create policy reward_ledger_service_all
  on app.reward_ledger for all using (true) with check (true);
