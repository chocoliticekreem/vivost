# vivost-backend

Standalone, hexagonal (ports-and-adapters) TypeScript backend for the Vivost
adult-services directory. Fully decoupled from the React app — this package
does not import from it. All domain logic is unit-testable **without a database**
(Docker is not required for tests).

This README is **the contract** for the domain agents building modules in
parallel. Follow it exactly.

## Stack

- Node + TypeScript (strict, `noUncheckedIndexedAccess`)
- Postgres via `pg`
- Validation via `zod`
- Tests via `vitest`
- Module resolution: **Bundler** — imports need **no** `.js` extension

## How to run

```bash
npm install
npm run typecheck   # tsc --noEmit, must be zero errors
npm run test        # vitest run, no DB needed
npm run migrate     # applies migrations/*.sql; safe no-op if DATABASE_URL unset
npm run lint        # eslint
```

`npm run migrate` reads `DATABASE_URL`. If it is unset, it prints a message and
exits 0 — so it is safe to run in environments without a database.

## The `core` package

Everything shared lives in `src/core/` and is re-exported from `src/core/index.ts`.
Domains import from `../core` only.

| Module | Exports |
|---|---|
| `ids.ts` | `UUID`, `newId()` |
| `clock.ts` | `Clock`, `systemClock`, `fixedClock(date)` |
| `errors.ts` | `AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError` (each has a stable string `code`) |
| `hasher.ts` | `Hasher`, `sha256Hasher`, `normalisePhone`, `normaliseEmail` |
| `repository.ts` | `Repository<T>`, `InMemoryRepository<T>` |
| `db.ts` | `Db`, `createPgDb(connectionString?)` |
| `ports.ts` | `PaymentProvider`, `IdVerificationProvider`, `EventBus` |
| `testing/index.ts` | `fakePaymentProvider()`, `fakeIdVerificationProvider()`, `inMemoryEventBus()`, `fixedClock` |
| `migrate.ts` | `runMigrations(connectionString?)` + CLI entrypoint |

## Directory layout for a domain

Each domain lives in `backend/src/<domain>/` with these files:

```
src/<domain>/
  types.ts                      # entities + zod schemas + DTOs
  <domain>Service.ts            # business logic; DI'd; throws core AppError subclasses
  <domain>Repository.ts         # port interface (extends/uses core Repository)
  inMemory<Domain>Repository.ts # in-memory adapter for tests
  pg<Domain>Repository.ts       # pg adapter using core Db
  <domain>.test.ts              # vitest; in-memory repos + core/testing fakes; NO database
```

### Service shape (dependency injection)

Services take their dependencies via constructor or factory — a `Repository`,
any ports they need, and a `Clock`. This is what makes them testable with the
in-memory repos and the `core/testing` fakes, no DB required.

```ts
export class ListingService {
  constructor(
    private readonly repo: ListingRepository,
    private readonly clock: Clock,
  ) {}
  // ...throws NotFoundError / ValidationError / etc. from core
}
```

### Repository shape

Domain repositories extend or use `Repository<T>` from core. Provide an
`inMemory*` adapter (subclass `InMemoryRepository<T>` or compose it) for tests
and a `pg*` adapter (using core `Db`) for production.

## Hard rules (enforced — do not break)

1. A domain imports **only** from `../core` and its own folder.
2. A domain **must NOT** import from another domain's folder. Cross-domain needs
   go through **core ports** (e.g. `EventBus`) or **plain UUID references**.
3. Each domain owns its own migration file(s), numbered within the range the
   orchestrator assigns (e.g. `0010_*.sql`). The `0000_foundation.sql` file is
   reserved.
4. Tests must pass with **no database** — use the in-memory repos and the fakes
   in `core/testing`.

## GDPR conventions (mandatory)

The platform processes Article 9 special-category data (sexual-services data).
Encode these in every domain:

- **Identity vs app schema separation.** Real-world identity data lives in the
  restricted `identity` Postgres schema; public activity/listings data lives in
  `app`. App rows reference identity rows by **opaque UUID only** — never store
  names/emails/phones alongside activity data.
- **Hash before store.** For lookup values like phone/email (e.g. the
  reported-offender checker), normalise (`normalisePhone` / `normaliseEmail`)
  then hash (`sha256Hasher`) before storing. Never store the raw value.
- **Results, not artefacts.** For verification, persist only a pass/fail flag,
  the method, and the date. Never store ID images or selfies. The
  `IdVerificationProvider` port returns results only, by design.
- **Hard, propagated deletion.** Foreign keys tying personal/activity data back
  to an identity row use `ON DELETE CASCADE`, so erasing an identity row hard-
  deletes all dependent rows in one operation.
- **RLS.** Enable Row Level Security on every table holding personal data and
  define policies.

See `migrations/0000_foundation.sql` for the schema-level documentation of these
conventions and the shared `app.set_updated_at()` trigger and `app.audit_log`.
