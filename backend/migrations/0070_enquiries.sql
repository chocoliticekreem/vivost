-- =============================================================================
-- 0070_enquiries.sql — Enquiries domain (anti-timewaster structured contact)
-- =============================================================================
-- An enquiry links a client to a listing with anti-timewaster fields. listing_id
-- references app.listing; deleting the listing (which itself cascades from its
-- identity root) hard-deletes its enquiries. client_id is a nullable opaque UUID
-- reference (enquiries may be anonymous), so it is NOT a hard FK.
-- =============================================================================

create table if not exists app.enquiry (
  id                      uuid primary key default gen_random_uuid(),
  listing_id              uuid not null references app.listing(id) on delete cascade,
  client_id               uuid,
  name                    text not null,
  preferred_time          text not null,
  confirmed_read_services boolean not null,
  "references"            text,
  message                 text not null,
  status                  text not null default 'pending'
                            check (status in ('pending', 'accepted', 'declined')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists enquiry_listing_id_idx on app.enquiry (listing_id);

drop trigger if exists set_updated_at on app.enquiry;
create trigger set_updated_at
  before update on app.enquiry
  for each row execute function app.set_updated_at();

-- RLS: enquiries carry personal contact data (name, message, references).
alter table app.enquiry enable row level security;
