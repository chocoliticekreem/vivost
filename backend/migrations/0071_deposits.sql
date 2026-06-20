-- =============================================================================
-- 0071_deposits.sql — Deposits domain (payment holds against enquiries)
-- =============================================================================
-- A deposit records a PaymentProvider hold placed against an enquiry to deter
-- no-shows. Only the opaque hold_id is stored — no card data. enquiry_id
-- references app.enquiry on delete cascade, so erasing an enquiry (transitively
-- from its identity root) hard-deletes its deposits.
-- =============================================================================

create table if not exists app.deposit (
  id           uuid primary key default gen_random_uuid(),
  enquiry_id   uuid not null references app.enquiry(id) on delete cascade,
  amount_minor integer not null check (amount_minor > 0),
  currency     text not null,
  hold_id      text not null,
  status       text not null default 'held'
                 check (status in ('held', 'released', 'forfeited')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists deposit_enquiry_id_idx on app.deposit (enquiry_id);

drop trigger if exists set_updated_at on app.deposit;
create trigger set_updated_at
  before update on app.deposit
  for each row execute function app.set_updated_at();

-- RLS: deposits are tied to a person's enquiry / payment activity.
alter table app.deposit enable row level security;
