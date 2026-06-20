-- =============================================================================
-- 0022_placements.sql — Monetization: paid placements / boosts
-- =============================================================================
-- A placement boosts a listing (featured / bump / top_category) for a time
-- window, optionally scoped to a city or category. listing_id FK is
-- ON DELETE CASCADE so erasing a listing (which itself cascades from account
-- erasure) hard-deletes its placements (GDPR right to erasure).
-- =============================================================================

create table if not exists app.placement (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references app.listing(id) on delete cascade,
  kind          text not null check (kind in ('featured','bump','top_category')),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  city_slug     text,
  category_slug text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists placement_listing_idx on app.placement (listing_id);
create index if not exists placement_window_idx on app.placement (starts_at, ends_at);
create index if not exists placement_city_idx on app.placement (city_slug);
create index if not exists placement_category_idx on app.placement (category_slug);

drop trigger if exists set_updated_at on app.placement;
create trigger set_updated_at before update on app.placement
  for each row execute function app.set_updated_at();

alter table app.placement enable row level security;

-- Active placements drive public ranking, so they are publicly readable;
-- writes happen through the service role only.
drop policy if exists placement_read on app.placement;
create policy placement_read on app.placement for select using (true);
