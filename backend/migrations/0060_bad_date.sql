-- =============================================================================
-- 0060_bad_date.sql — Safety domain: bad-date reports
-- =============================================================================
-- Advertisers report problem clients ("bad dates"). GDPR: the client's contact
-- details are NEVER stored raw — only normalised SHA-256 hashes of phone/email
-- are persisted, so the platform holds no usable client PII here.
--
-- VISIBILITY: these reports are visible ONLY to verified advertisers. That gate
-- is enforced at the API/access layer; RLS is enabled here as the baseline.
-- The reporter FK cascades from app.account so a GDPR erasure of the reporter
-- removes their reports (right to be forgotten).
-- =============================================================================

create table if not exists app.bad_date_report (
  id                  uuid primary key default gen_random_uuid(),
  reporter_account_id uuid not null references app.account(id) on delete cascade,
  phone_hash          text,           -- hash-only; never the raw phone number
  email_hash          text,           -- hash-only; never the raw email address
  description         text not null,
  severity            text not null check (severity in ('low', 'medium', 'high')),
  created_at          timestamptz not null default now(),
  -- at least one hashed contact is required to identify the reported client
  constraint bad_date_report_contact_present
    check (phone_hash is not null or email_hash is not null)
);

-- Lookup by hashed contact for the offender checker / search.
create index if not exists bad_date_report_phone_hash_idx
  on app.bad_date_report (phone_hash);
create index if not exists bad_date_report_email_hash_idx
  on app.bad_date_report (email_hash);

-- RLS: holds personal-linked (hashed client + reporter) data. Mandatory.
alter table app.bad_date_report enable row level security;
