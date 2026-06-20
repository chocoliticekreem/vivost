-- =============================================================================
-- 0031_payments.sql — Payments domain
-- =============================================================================
-- Provider-agnostic payment records. No card data is ever stored here — the
-- adult-friendly payment processor (integrated later behind the PaymentProvider
-- port) owns all sensitive payment-instrument data. We persist only the amount,
-- currency, kind, a free-text reference, the provider's checkout id, and status.
--
-- account_id references app.account(id) ON DELETE CASCADE so erasing an account
-- (right to be forgotten) hard-deletes its payment activity in one operation.
-- =============================================================================

create table if not exists app.payment (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references app.account(id) on delete cascade,
  kind         text not null check (kind in (
                 'subscription', 'boost', 'verification', 'deposit')),
  amount_minor bigint not null,
  currency     text not null,
  reference    text not null,
  checkout_id  text not null,
  status       text not null check (status in (
                 'created', 'paid', 'failed', 'refunded')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payment_account_idx on app.payment (account_id);
create index if not exists payment_checkout_idx on app.payment (checkout_id);

drop trigger if exists set_updated_at on app.payment;
create trigger set_updated_at
  before update on app.payment
  for each row execute function app.set_updated_at();

alter table app.payment enable row level security;

create policy payment_service_all
  on app.payment
  for all
  using (true)
  with check (true);
