-- =============================================================================
-- 0040_geo.sql — Geo (cities) + programmatic-SEO reference data
-- =============================================================================
--
-- GDPR NOTE:
--   This domain holds NO personal data and NO Article 9 special-category data.
--   Cities are public geographic reference data; SEO pages are derived in code
--   from cities x categories and are not persisted here. There is therefore no
--   identity-schema separation and no ON DELETE CASCADE to an identity row.
--
--   Per the foundation contract (0000_foundation.sql, convention (c)), we still
--   ENABLE Row Level Security on the table and define explicit policies. Because
--   city data is public read-only reference data, the policy grants read to all
--   and confines writes to privileged roles (migrations / service role).
-- =============================================================================

create table if not exists app.city (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,                 -- lowercased city name, used in URLs
  name   text not null,
  region text not null,
  lat    double precision,                     -- optional latitude
  lng    double precision                      -- optional longitude
);

create index if not exists city_slug_idx on app.city (slug);

-- RLS: mandatory per contract even though no personal data is present.
alter table app.city enable row level security;

-- Public read: city reference data is non-sensitive and powers public pages.
drop policy if exists city_select_all on app.city;
create policy city_select_all on app.city
  for select
  using (true);

-- Writes restricted to privileged roles (migrations / service-role). No policy
-- is granted for insert/update/delete to anon/authenticated, so RLS denies them.

-- Seed: real UK cities. Slugs are lowercased names. Kept in sync with
-- src/geo/types.ts (UK_CITY_SEED).
insert into app.city (slug, name, region, lat, lng) values
  ('london',     'London',     'Greater London', 51.5074, -0.1278),
  ('manchester', 'Manchester', 'North West',     53.4808, -2.2426),
  ('birmingham', 'Birmingham', 'West Midlands',  52.4862, -1.8904),
  ('leeds',      'Leeds',      'Yorkshire',      53.8008, -1.5491),
  ('bristol',    'Bristol',    'South West',     51.4545, -2.5879),
  ('glasgow',    'Glasgow',    'Scotland',       55.8642, -4.2518),
  ('liverpool',  'Liverpool',  'North West',     53.4084, -2.9916),
  ('edinburgh',  'Edinburgh',  'Scotland',       55.9533, -3.1883)
on conflict (slug) do nothing;
