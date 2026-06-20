-- =============================================================================
-- 0011_listings.sql — Listings domain
-- =============================================================================
-- Public activity data. owner_account_id references app.account by opaque UUID
-- and cascades on delete, so erasing an account hard-deletes its listings
-- (right to be forgotten). No real-world identity data is stored here directly.
-- =============================================================================

create table if not exists app.listing (
  id               uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references app.account(id) on delete cascade,
  name             text not null,
  category_slug    text not null,
  location         text not null,
  area             text,
  hourly_rate      numeric not null default 0,
  availability     text not null default '',
  image_color      text not null default '',
  photos           text[] not null default '{}',
  description      text not null default '',
  phone            text,
  age              integer,
  gender           text,
  ethnicity        text,
  languages        text[] not null default '{}',
  services         text[] not null default '{}',
  verified         boolean not null default false,
  region           text,
  source_url       text,
  attributes       jsonb not null default '[]'::jsonb,
  status           text not null default 'draft'
                     check (status in ('draft', 'active', 'suspended', 'removed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists set_updated_at on app.listing;
create trigger set_updated_at
  before update on app.listing
  for each row execute function app.set_updated_at();

alter table app.listing enable row level security;

create index if not exists listing_category_slug_idx on app.listing (category_slug);
create index if not exists listing_location_idx on app.listing (location);
create index if not exists listing_status_idx on app.listing (status);
create index if not exists listing_owner_account_id_idx on app.listing (owner_account_id);
