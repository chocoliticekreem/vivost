-- =============================================================================
-- 0072_reviews.sql — Reviews domain (client rates listing; public flywheel)
-- =============================================================================
-- A review is a client rating + comment on a listing. Both listing_id and
-- client_id reference their owning app rows on delete cascade, so erasing
-- either party (transitively from its identity root) hard-deletes the review.
-- =============================================================================

create table if not exists app.review (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references app.listing(id) on delete cascade,
  client_id  uuid not null references app.client(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text not null,
  status     text not null default 'published'
               check (status in ('published', 'pending', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists review_listing_id_idx on app.review (listing_id);

-- RLS: reviews link a person (client) to activity (listing).
alter table app.review enable row level security;
