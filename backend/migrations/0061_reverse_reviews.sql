-- =============================================================================
-- 0061_reverse_reviews.sql — Safety domain: reverse reviews (worker rates client)
-- =============================================================================
-- Workers/advertisers leave a 1-5 rating + comment about a client. GDPR: the
-- client is identified ONLY by a normalised SHA-256 hash of their contact value
-- — never the raw phone/email.
--
-- VISIBILITY: provider-only. Enforced at the API/access layer; RLS baseline here.
-- The reviewer FK cascades from app.account (right to be forgotten).
-- =============================================================================

create table if not exists app.reverse_review (
  id                  uuid primary key default gen_random_uuid(),
  reviewer_account_id uuid not null references app.account(id) on delete cascade,
  client_contact_hash text not null,  -- hash-only; never the raw client contact
  rating              smallint not null check (rating between 1 and 5),
  comment             text not null,
  created_at          timestamptz not null default now()
);

-- Lookup all reviews for a given (hashed) client contact.
create index if not exists reverse_review_contact_hash_idx
  on app.reverse_review (client_contact_hash);

-- RLS: holds personal-linked (hashed client + reviewer) data. Mandatory.
alter table app.reverse_review enable row level security;
