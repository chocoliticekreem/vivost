-- =============================================================================
-- 0052_offender_reports.sql — Reported-offender reverse-checker DB
-- =============================================================================
-- GDPR minimisation: hashes only — never raw phone/email. Contact details are
-- normalised then sha256-hashed by the application BEFORE insert. The
-- reverse-checker matches a query by hashing it the same way and comparing
-- against phone_hash / email_hash. reported_by references app.account with
-- on delete cascade so erasing the reporter removes their reports.
-- =============================================================================

create table if not exists app.offender_report (
  id          uuid primary key default gen_random_uuid(),
  phone_hash  text,
  email_hash  text,
  reason      text not null,
  reported_by uuid not null references app.account(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint offender_report_has_contact_hash
    check (phone_hash is not null or email_hash is not null)
);

comment on table app.offender_report is
  'hashes only — never raw phone/email, GDPR minimisation';

create index if not exists offender_report_phone_hash_idx
  on app.offender_report (phone_hash);
create index if not exists offender_report_email_hash_idx
  on app.offender_report (email_hash);

-- RLS: holds reports about individuals (personal data, hashed).
alter table app.offender_report enable row level security;
