-- =============================================================================
-- 0080_analytics.sql — Analytics domain
-- =============================================================================
-- Per-listing event funnel (views / contacts / conversions). GDPR: this table
-- holds NO PII; session_hash is a one-way hash only — never a raw session id,
-- IP, or any personal data. listing_id references app.listing ON DELETE CASCADE
-- so erasing a listing (or its owner account) hard-deletes its analytics events.
-- =============================================================================

create table if not exists app.analytics_event (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references app.listing(id) on delete cascade,
  type         text not null check (type in ('view', 'contact', 'conversion')),
  at           timestamptz not null default now(),
  -- no PII; session_hash is a one-way hash only
  session_hash text
);

create index if not exists analytics_event_listing_type_idx
  on app.analytics_event (listing_id, type);

alter table app.analytics_event enable row level security;

create policy analytics_event_service_all
  on app.analytics_event
  for all
  using (true)
  with check (true);
