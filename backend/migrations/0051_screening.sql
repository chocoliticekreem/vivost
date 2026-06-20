-- =============================================================================
-- 0051_screening.sql — Client screening status
-- =============================================================================
-- The screening/verification status advertisers see before accepting a booking.
-- 1:1 with a client, keyed by client_id (an opaque UUID into app.client).
-- References app.client with on delete cascade so erasing a client removes
-- their screening record (right to be forgotten).
-- =============================================================================

create table if not exists app.client_screening (
  client_id    uuid primary key references app.client(id) on delete cascade,
  verified     boolean not null default false,
  "references" integer not null default 0,
  verified_at  timestamptz,
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on app.client_screening;
create trigger set_updated_at
  before update on app.client_screening
  for each row execute function app.set_updated_at();

-- RLS: holds verification status linked to a person.
alter table app.client_screening enable row level security;
