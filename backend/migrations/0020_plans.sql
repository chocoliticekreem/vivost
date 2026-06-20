-- =============================================================================
-- 0020_plans.sql — Monetization: subscription plans (catalogue)
-- =============================================================================
-- Plans are commercial catalogue data (no personal data). updated_at trigger and
-- RLS are applied per the foundation contract for consistency across app tables.
-- =============================================================================

create table if not exists app.plan (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique check (key in ('free','basic','pro','premium')),
  name            text not null,
  price_minor     integer not null check (price_minor >= 0),
  currency        text not null default 'GBP',
  interval_months integer not null check (interval_months > 0),
  features        jsonb not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists set_updated_at on app.plan;
create trigger set_updated_at before update on app.plan
  for each row execute function app.set_updated_at();

alter table app.plan enable row level security;

-- Catalogue is publicly readable; writes happen through the service role only.
drop policy if exists plan_read on app.plan;
create policy plan_read on app.plan for select using (true);

-- Seed canonical plans (mirrors SEED_PLANS in src/monetization/types.ts).
insert into app.plan (key, name, price_minor, currency, interval_months, features, active)
values
  ('free', 'Free', 0, 'GBP', 1,
   '{"maxListings":1,"maxPhotos":3,"analytics":false,"verifiedBadgeIncluded":false,"priorityRank":0}'::jsonb,
   true),
  ('basic', 'Basic', 1499, 'GBP', 1,
   '{"maxListings":3,"maxPhotos":10,"analytics":false,"verifiedBadgeIncluded":false,"priorityRank":5}'::jsonb,
   true),
  ('pro', 'Pro', 3900, 'GBP', 1,
   '{"maxListings":10,"maxPhotos":30,"analytics":true,"verifiedBadgeIncluded":false,"priorityRank":10}'::jsonb,
   true),
  ('premium', 'Premium', 11900, 'GBP', 1,
   '{"maxListings":25,"maxPhotos":60,"analytics":true,"verifiedBadgeIncluded":true,"priorityRank":20}'::jsonb,
   true)
on conflict (key) do nothing;
