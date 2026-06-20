-- =============================================================================
-- 0030_verification.sql — Verification domain
-- =============================================================================
-- Stores verification RESULTS only — never ID images/selfies (GDPR Art 9
-- minimisation). Only the status, the method, the provider's opaque check id,
-- and dates are persisted. The IdVerificationProvider port returns results only.
--
-- subject_id references either an account or a listing by opaque UUID. There is
-- intentionally NO single foreign key, because the subject can be one of two
-- different tables (distinguished by subject_type). Erasure of the underlying
-- identity/account cascades from those tables; orphaned result rows carry no
-- personal data and are pruned by housekeeping.
-- =============================================================================

create table if not exists app.verification_record (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null,
  subject_type text not null check (subject_type in ('account', 'listing')),
  method       text not null check (method in (
                 'photo_id', 'facial_age_estimation', 'open_banking',
                 'credit_card', 'mno')),
  check_id     text not null,
  status       text not null check (status in ('pass', 'fail', 'pending')),
  checked_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists verification_record_subject_idx
  on app.verification_record (subject_id, subject_type);

drop trigger if exists set_updated_at on app.verification_record;
create trigger set_updated_at
  before update on app.verification_record
  for each row execute function app.set_updated_at();

alter table app.verification_record enable row level security;

create policy verification_record_service_all
  on app.verification_record
  for all
  using (true)
  with check (true);
