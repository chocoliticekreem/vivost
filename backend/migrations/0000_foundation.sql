-- =============================================================================
-- 0000_foundation.sql — Vivost backend foundation
-- =============================================================================
--
-- GDPR DESIGN CONVENTIONS (read before adding any domain migration):
--
-- (a) IDENTITY vs APP schema separation.
--     The `identity` schema holds restricted real-world identity data
--     (legal names, contact details, verification subjects). The `app` schema
--     holds public ACTIVITY / listings data. App rows reference identity rows
--     by OPAQUE UUID ONLY — never by name/email/phone. This lets us lock down
--     `identity` separately and erase a person without scanning public tables
--     for their real-world data.
--
-- (b) ON DELETE CASCADE for GDPR erasure (right to be forgotten).
--     Every foreign key that points (directly or transitively) at a person's
--     root identity row MUST be declared `on delete cascade`. Deleting the
--     identity row then propagates a hard delete through all dependent rows in
--     a single operation. Domains MUST follow this convention for any FK that
--     ties personal/activity data back to an identity.
--
-- (c) ENABLE RLS on every table holding personal data.
--     Each domain migration must `alter table ... enable row level security;`
--     on any table containing personal or special-category data, and define
--     policies. Article 9 special-category (sexual-services) data is in scope,
--     so RLS is mandatory, not optional.
--
-- (d) STORE VERIFICATION RESULTS, NOT ARTEFACTS.
--     Persist only a pass/fail flag + method + checked-at date. NEVER store ID
--     images, selfies, or other verification documents. The
--     IdVerificationProvider port returns results only, by design.
-- =============================================================================

create extension if not exists pgcrypto;

-- Restricted: real-world identity data. Referenced from `app` by opaque UUID only.
create schema if not exists identity;

-- Activity / public listings data.
create schema if not exists app;

-- Migration ledger (also created defensively by the migrate runner).
create table if not exists public.schema_migrations (
  filename   text primary key,
  applied_at timestamptz not null default now()
);

-- Append-only audit log for sensitive actions. RLS should be enabled by the
-- access layer; entity_id is an opaque UUID referencing the affected row.
create table if not exists app.audit_log (
  id        uuid primary key default gen_random_uuid(),
  actor_id  uuid,
  action    text not null,
  entity    text not null,
  entity_id uuid,
  at        timestamptz not null default now(),
  detail    jsonb
);

-- Append-only, backend-only. RLS with no policy => only the service role (which
-- bypasses RLS) can access it; anon/authenticated are denied.
alter table app.audit_log enable row level security;

-- Shared trigger function: domains attach this BEFORE UPDATE to maintain an
-- updated_at column. Usage in a domain migration:
--   create trigger set_updated_at before update on app.some_table
--     for each row execute function app.set_updated_at();
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
