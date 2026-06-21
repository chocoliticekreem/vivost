"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// backend/src/vercel-handler.ts
var vercel_handler_exports = {};
__export(vercel_handler_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_handler_exports);

// backend/src/app/server.ts
var import_fastify = __toESM(require("fastify"), 1);
var import_cors = __toESM(require("@fastify/cors"), 1);

// backend/src/app/errors.ts
var import_zod = require("zod");

// backend/src/core/ids.ts
var import_node_crypto = require("node:crypto");
function newId() {
  return (0, import_node_crypto.randomUUID)();
}

// backend/src/core/clock.ts
var systemClock = {
  now() {
    return /* @__PURE__ */ new Date();
  }
};

// backend/src/core/errors.ts
var AppError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var NotFoundError = class extends AppError {
  constructor(message = "Resource not found") {
    super("not_found", message);
  }
};
var ValidationError = class extends AppError {
  constructor(message = "Validation failed") {
    super("validation_error", message);
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Conflict") {
    super("conflict", message);
  }
};
var ForbiddenError = class extends AppError {
  constructor(message = "Forbidden") {
    super("forbidden", message);
  }
};

// backend/src/core/hasher.ts
var import_node_crypto2 = require("node:crypto");
var sha256Hasher = {
  hash(value) {
    return (0, import_node_crypto2.createHash)("sha256").update(value, "utf8").digest("hex");
  }
};
function normalisePhone(s) {
  return s.trim().replace(/^\+/, "").replace(/[\s\-()]/g, "");
}
function normaliseEmail(s) {
  return s.trim().toLowerCase();
}

// backend/src/core/repository.ts
var InMemoryRepository = class {
  store = /* @__PURE__ */ new Map();
  async getById(id) {
    const found = this.store.get(id);
    return found === void 0 ? void 0 : structuredClone(found);
  }
  async list() {
    return Array.from(this.store.values()).map((e) => structuredClone(e));
  }
  async save(entity) {
    const copy = structuredClone(entity);
    this.store.set(copy.id, copy);
    return structuredClone(copy);
  }
  async delete(id) {
    this.store.delete(id);
  }
};

// backend/src/core/db.ts
var import_pg = __toESM(require("pg"), 1);
function createPgDb(connectionString) {
  let pool;
  function getPool() {
    if (pool) return pool;
    const conn = connectionString ?? process.env.DATABASE_URL;
    if (!conn) {
      throw new Error(
        "createPgDb: no connection string provided and DATABASE_URL is not set"
      );
    }
    const isLocal = /@(localhost|127\.0\.0\.1|::1)[:/]/.test(conn);
    pool = new import_pg.default.Pool({
      connectionString: conn,
      ssl: isLocal ? void 0 : { rejectUnauthorized: false },
      keepAlive: true
    });
    pool.on("error", (err) => {
      console.error("[db] idle pg client error (recovering):", err.message);
    });
    return pool;
  }
  return {
    async query(text, params) {
      const result = await getPool().query(text, params);
      return { rows: result.rows };
    }
  };
}

// backend/src/app/errors.ts
function toHttp(err) {
  if (err instanceof NotFoundError) {
    return { status: 404, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ValidationError) {
    return { status: 400, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ConflictError) {
    return { status: 409, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ForbiddenError) {
    return { status: 403, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof import_zod.ZodError) {
    return {
      status: 400,
      body: { error: { code: "validation_error", message: err.message } }
    };
  }
  if (err instanceof AppError) {
    return { status: 400, body: { error: { code: err.code, message: err.message } } };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Internal server error" } }
  };
}
function registerErrorHandler(app2) {
  app2.setErrorHandler((err, _req, reply) => {
    const { status, body } = toHttp(err);
    void reply.status(status).send(body);
  });
}

// backend/src/app/routes/health.ts
function registerHealth(app2, _c) {
  app2.get("/health", async () => ({ status: "ok" }));
  app2.get("/ready", async () => ({ status: "ok" }));
}

// backend/src/app/routes/listings.ts
var import_zod3 = require("zod");

// backend/src/listings/inMemoryListingsRepository.ts
var InMemoryListingsRepository = class extends InMemoryRepository {
  async listByOwner(ownerAccountId) {
    const all = await this.list();
    return all.filter((l) => l.ownerAccountId === ownerAccountId);
  }
  async listActive() {
    const all = await this.list();
    return all.filter((l) => l.status === "active");
  }
};

// backend/src/listings/types.ts
var import_zod2 = require("zod");
var attributeSchema = import_zod2.z.object({
  label: import_zod2.z.string(),
  value: import_zod2.z.string()
});
var createListingSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(1),
  categorySlug: import_zod2.z.string().min(1),
  location: import_zod2.z.string().min(1),
  area: import_zod2.z.string().nullable().default(null),
  hourlyRate: import_zod2.z.number().nonnegative(),
  availability: import_zod2.z.string().default(""),
  imageColor: import_zod2.z.string().default(""),
  photos: import_zod2.z.array(import_zod2.z.string()).default([]),
  description: import_zod2.z.string().default(""),
  phone: import_zod2.z.string().nullable().default(null),
  age: import_zod2.z.number().int().nullable().default(null),
  gender: import_zod2.z.string().nullable().default(null),
  ethnicity: import_zod2.z.string().nullable().default(null),
  languages: import_zod2.z.array(import_zod2.z.string()).default([]),
  services: import_zod2.z.array(import_zod2.z.string()).default([]),
  verified: import_zod2.z.boolean().default(false),
  region: import_zod2.z.string().nullable().default(null),
  sourceUrl: import_zod2.z.string().nullable().default(null),
  attributes: import_zod2.z.array(attributeSchema).default([])
});
var updateListingSchema = createListingSchema.partial();

// backend/src/listings/listingsService.ts
var ListingsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  async create(ownerAccountId, input) {
    const data = createListingSchema.parse(input);
    const now = this.clock.now();
    const listing = {
      id: newId(),
      ownerAccountId,
      ...data,
      status: "draft",
      createdAt: now,
      updatedAt: now
    };
    return this.repo.save(listing);
  }
  async update(actorAccountId, listingId, patch) {
    const listing = await this.requireOwned(actorAccountId, listingId);
    const data = updateListingSchema.parse(patch);
    const updated = {
      ...listing,
      ...data,
      id: listing.id,
      ownerAccountId: listing.ownerAccountId,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
  async publish(actorAccountId, listingId) {
    const listing = await this.requireOwned(actorAccountId, listingId);
    if (listing.status !== "draft" && listing.status !== "suspended") {
      throw new ForbiddenError(
        `Cannot publish a listing in status '${listing.status}'`
      );
    }
    return this.setStatus(listing, "active");
  }
  async suspend(actorAccountId, listingId) {
    const listing = await this.requireOwned(actorAccountId, listingId);
    return this.setStatus(listing, "suspended");
  }
  async remove(actorAccountId, listingId) {
    const listing = await this.requireOwned(actorAccountId, listingId);
    return this.setStatus(listing, "removed");
  }
  async getById(listingId) {
    const listing = await this.repo.getById(listingId);
    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    return listing;
  }
  async listByOwner(ownerAccountId) {
    return this.repo.listByOwner(ownerAccountId);
  }
  async listActive() {
    return this.repo.listActive();
  }
  async requireOwned(actorAccountId, listingId) {
    const listing = await this.repo.getById(listingId);
    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    if (listing.ownerAccountId !== actorAccountId) {
      throw new ForbiddenError("You do not own this listing");
    }
    return listing;
  }
  async setStatus(listing, status) {
    const updated = {
      ...listing,
      status,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
};

// backend/src/listings/pgListingsRepository.ts
var COLUMNS = `
  id, owner_account_id, name, category_slug, location, area, hourly_rate,
  availability, image_color, photos, description, phone, age, gender, ethnicity,
  languages, services, verified, region, source_url, attributes, status,
  created_at, updated_at`;
function toListing(row) {
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    name: row.name,
    categorySlug: row.category_slug,
    location: row.location,
    area: row.area,
    hourlyRate: typeof row.hourly_rate === "string" ? Number(row.hourly_rate) : row.hourly_rate,
    availability: row.availability,
    imageColor: row.image_color,
    photos: row.photos ?? [],
    description: row.description,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    ethnicity: row.ethnicity,
    languages: row.languages ?? [],
    services: row.services ?? [],
    verified: row.verified,
    region: row.region,
    sourceUrl: row.source_url,
    attributes: row.attributes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var PgListingsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select ${COLUMNS} from app.listing where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toListing(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select ${COLUMNS} from app.listing order by created_at asc`
    );
    return rows.map(toListing);
  }
  async listByOwner(ownerAccountId) {
    const { rows } = await this.db.query(
      `select ${COLUMNS} from app.listing where owner_account_id = $1 order by created_at asc`,
      [ownerAccountId]
    );
    return rows.map(toListing);
  }
  async listActive() {
    const { rows } = await this.db.query(
      `select ${COLUMNS} from app.listing where status = 'active' order by created_at asc`
    );
    return rows.map(toListing);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.listing (
         id, owner_account_id, name, category_slug, location, area, hourly_rate,
         availability, image_color, photos, description, phone, age, gender,
         ethnicity, languages, services, verified, region, source_url,
         attributes, status, created_at, updated_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $22, $23, $24
       )
       on conflict (id) do update set
         owner_account_id = excluded.owner_account_id,
         name = excluded.name,
         category_slug = excluded.category_slug,
         location = excluded.location,
         area = excluded.area,
         hourly_rate = excluded.hourly_rate,
         availability = excluded.availability,
         image_color = excluded.image_color,
         photos = excluded.photos,
         description = excluded.description,
         phone = excluded.phone,
         age = excluded.age,
         gender = excluded.gender,
         ethnicity = excluded.ethnicity,
         languages = excluded.languages,
         services = excluded.services,
         verified = excluded.verified,
         region = excluded.region,
         source_url = excluded.source_url,
         attributes = excluded.attributes,
         status = excluded.status`,
      [
        entity.id,
        entity.ownerAccountId,
        entity.name,
        entity.categorySlug,
        entity.location,
        entity.area ?? null,
        entity.hourlyRate,
        entity.availability,
        entity.imageColor,
        entity.photos,
        entity.description,
        entity.phone ?? null,
        entity.age ?? null,
        entity.gender ?? null,
        entity.ethnicity ?? null,
        entity.languages ?? [],
        entity.services ?? [],
        entity.verified,
        entity.region ?? null,
        entity.sourceUrl ?? null,
        JSON.stringify(entity.attributes ?? []),
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgListingsRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.listing where id = $1`, [id]);
  }
};

// backend/src/app/routes/listings.ts
var idParam = import_zod3.z.object({ id: import_zod3.z.string().uuid() });
var accountIdParam = import_zod3.z.object({ accountId: import_zod3.z.string().uuid() });
var createBody = createListingSchema.extend({ ownerAccountId: import_zod3.z.string().uuid() });
var patchBody = import_zod3.z.object({
  actorAccountId: import_zod3.z.string().uuid(),
  patch: updateListingSchema
});
var actorBody = import_zod3.z.object({ actorAccountId: import_zod3.z.string().uuid() });
function registerListings(app2, c) {
  app2.get("/listings", async () => {
    return c.listingsService.listActive();
  });
  app2.get("/listings/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    return c.listingsService.getById(id);
  });
  app2.post("/listings", async (req, reply) => {
    const { ownerAccountId, ...createInput } = createBody.parse(req.body);
    const listing = await c.listingsService.create(ownerAccountId, createInput);
    void reply.status(201);
    return listing;
  });
  app2.patch("/listings/:id", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId, patch } = patchBody.parse(req.body);
    return c.listingsService.update(actorAccountId, id, patch);
  });
  app2.post("/listings/:id/publish", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.publish(actorAccountId, id);
  });
  app2.post("/listings/:id/suspend", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.suspend(actorAccountId, id);
  });
  app2.post("/listings/:id/remove", async (req) => {
    const { id } = idParam.parse(req.params);
    const { actorAccountId } = actorBody.parse(req.body);
    return c.listingsService.remove(actorAccountId, id);
  });
  app2.get("/accounts/:accountId/listings", async (req) => {
    const { accountId } = accountIdParam.parse(req.params);
    return c.listingsService.listByOwner(accountId);
  });
}

// backend/src/app/routes/accounts.ts
var import_zod5 = require("zod");

// backend/src/accounts/types.ts
var import_zod4 = require("zod");
var registerAccountSchema = import_zod4.z.object({
  email: import_zod4.z.string().email(),
  role: import_zod4.z.enum(["advertiser", "admin"]).default("advertiser")
});

// backend/src/accounts/accountsService.ts
var AccountsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  async register(input) {
    const { email, role } = registerAccountSchema.parse(input);
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }
    const now = this.clock.now();
    const account = {
      id: newId(),
      email: normalisedEmail,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    return this.repo.save(account);
  }
  /**
   * Idempotent get-or-create by email. Returns the existing account when one
   * already exists for the (normalised) email, otherwise registers a new one.
   */
  async ensureByEmail(email, role = "advertiser") {
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) return existing;
    try {
      return await this.register({ email: normalisedEmail, role });
    } catch (err) {
      const afterRace = await this.repo.findByEmail(normalisedEmail);
      if (afterRace) return afterRace;
      throw err;
    }
  }
  async getById(id) {
    const account = await this.repo.getById(id);
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    return account;
  }
  async suspend(id) {
    return this.setStatus(id, "suspended");
  }
  async reactivate(id) {
    return this.setStatus(id, "active");
  }
  /**
   * Hard delete (GDPR erasure). In pg this removes the identity root row and
   * cascades to all dependent rows.
   */
  async deleteAccount(id) {
    const account = await this.repo.getById(id);
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    await this.repo.delete(id);
  }
  async setStatus(id, status) {
    const account = await this.getById(id);
    const updated = {
      ...account,
      status,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
};

// backend/src/accounts/inMemoryAccountsRepository.ts
var InMemoryAccountsRepository = class extends InMemoryRepository {
  async findByEmail(email) {
    const target = normaliseEmail(email);
    const all = await this.list();
    return all.find(
      (a) => a.email != null && normaliseEmail(a.email) === target
    );
  }
};

// backend/src/accounts/pgAccountsRepository.ts
function toAccount(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var PgAccountsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        where a.id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toAccount(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        order by a.created_at asc`
    );
    return rows.map(toAccount);
  }
  async findByEmail(email) {
    const { rows } = await this.db.query(
      `select a.id, i.email, a.role, a.status, a.created_at, a.updated_at
         from app.account a
         join identity.account i on i.id = a.id
        where i.email = $1`,
      [normaliseEmail(email)]
    );
    const row = rows[0];
    return row ? toAccount(row) : void 0;
  }
  async save(entity) {
    await this.db.query(
      `insert into identity.account (id, email, created_at)
         values ($1, $2, $3)
       on conflict (id) do update set email = excluded.email`,
      [entity.id, entity.email != null ? normaliseEmail(entity.email) : null, entity.createdAt]
    );
    await this.db.query(
      `insert into app.account (id, role, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set role = excluded.role,
             status = excluded.status`,
      [entity.id, entity.role, entity.status, entity.createdAt, entity.updatedAt]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgAccountsRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from identity.account where id = $1`, [id]);
  }
};

// backend/src/app/routes/accounts.ts
var idParam2 = import_zod5.z.object({ id: import_zod5.z.string().uuid() });
function registerAccounts(app2, c) {
  app2.post("/accounts", async (req, reply) => {
    const input = registerAccountSchema.parse(req.body);
    const account = await c.accountsService.register(input);
    void reply.status(201);
    return account;
  });
  app2.get("/accounts/:id", async (req) => {
    const { id } = idParam2.parse(req.params);
    return c.accountsService.getById(id);
  });
  app2.post("/accounts/:id/suspend", async (req) => {
    const { id } = idParam2.parse(req.params);
    return c.accountsService.suspend(id);
  });
  app2.post("/accounts/:id/reactivate", async (req) => {
    const { id } = idParam2.parse(req.params);
    return c.accountsService.reactivate(id);
  });
  app2.delete("/accounts/:id", async (req, reply) => {
    const { id } = idParam2.parse(req.params);
    await c.accountsService.deleteAccount(id);
    void reply.status(204);
  });
}

// backend/src/app/routes/clients.ts
var import_zod7 = require("zod");

// backend/src/clients/types.ts
var import_zod6 = require("zod");
var registerClientSchema = import_zod6.z.object({
  email: import_zod6.z.string().email()
});

// backend/src/clients/clientsService.ts
var ClientsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  async register(input) {
    const { email } = registerClientSchema.parse(input);
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) {
      throw new ConflictError("A client with this email already exists");
    }
    const now = this.clock.now();
    const client = {
      id: newId(),
      email: normalisedEmail,
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    return this.repo.save(client);
  }
  /**
   * Idempotent get-or-create by email. Returns the existing client when one
   * already exists for the (normalised) email, otherwise registers a new one.
   */
  async ensureByEmail(email) {
    const normalisedEmail = normaliseEmail(email);
    const existing = await this.repo.findByEmail(normalisedEmail);
    if (existing) return existing;
    try {
      return await this.register({ email: normalisedEmail });
    } catch (err) {
      const afterRace = await this.repo.findByEmail(normalisedEmail);
      if (afterRace) return afterRace;
      throw err;
    }
  }
  async getById(id) {
    const client = await this.repo.getById(id);
    if (!client) {
      throw new NotFoundError("Client not found");
    }
    return client;
  }
  async suspend(id) {
    const client = await this.getById(id);
    const updated = {
      ...client,
      status: "suspended",
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
  /**
   * Hard delete (GDPR erasure). In pg this removes the identity root row and
   * cascades to all dependent rows.
   */
  async deleteClient(id) {
    const client = await this.repo.getById(id);
    if (!client) {
      throw new NotFoundError("Client not found");
    }
    await this.repo.delete(id);
  }
};

// backend/src/clients/inMemoryClientsRepository.ts
var InMemoryClientsRepository = class extends InMemoryRepository {
  async findByEmail(email) {
    const target = normaliseEmail(email);
    const all = await this.list();
    return all.find(
      (c) => c.email != null && normaliseEmail(c.email) === target
    );
  }
};

// backend/src/clients/pgClientsRepository.ts
function toClient(row) {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var PgClientsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        where c.id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toClient(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        order by c.created_at asc`
    );
    return rows.map(toClient);
  }
  async findByEmail(email) {
    const { rows } = await this.db.query(
      `select c.id, i.email, c.status, c.created_at, c.updated_at
         from app.client c
         join identity.client i on i.id = c.id
        where i.email = $1`,
      [normaliseEmail(email)]
    );
    const row = rows[0];
    return row ? toClient(row) : void 0;
  }
  async save(entity) {
    await this.db.query(
      `insert into identity.client (id, email, created_at)
         values ($1, $2, $3)
       on conflict (id) do update set email = excluded.email`,
      [entity.id, entity.email != null ? normaliseEmail(entity.email) : null, entity.createdAt]
    );
    await this.db.query(
      `insert into app.client (id, status, created_at, updated_at)
         values ($1, $2, $3, $4)
       on conflict (id) do update
         set status = excluded.status`,
      [entity.id, entity.status, entity.createdAt, entity.updatedAt]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgClientsRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from identity.client where id = $1`, [id]);
  }
};

// backend/src/app/routes/clients.ts
var idParam3 = import_zod7.z.object({ id: import_zod7.z.string().uuid() });
function registerClients(app2, c) {
  app2.post("/clients", async (req, reply) => {
    const input = registerClientSchema.parse(req.body);
    const client = await c.clientsService.register(input);
    void reply.status(201);
    return client;
  });
  app2.get("/clients/:id", async (req) => {
    const { id } = idParam3.parse(req.params);
    return c.clientsService.getById(id);
  });
  app2.post("/clients/:id/suspend", async (req) => {
    const { id } = idParam3.parse(req.params);
    return c.clientsService.suspend(id);
  });
  app2.delete("/clients/:id", async (req, reply) => {
    const { id } = idParam3.parse(req.params);
    await c.clientsService.deleteClient(id);
    void reply.status(204);
  });
}

// backend/src/app/routes/catalog.ts
var import_zod8 = require("zod");

// backend/src/discovery/ranking.ts
var FEATURED_BONUS = 1e3;
var PRIORITY_WEIGHT = 10;
var VERIFIED_BONUS = 50;
var FREE_TIER_PENALTY = 200;
var RECENCY_MAX_BONUS = 100;
var RECENCY_WINDOW_MS = 30 * 24 * 60 * 60 * 1e3;
function recencyBonus(item, now) {
  const ageMs = now.getTime() - item.createdAt.getTime();
  if (ageMs <= 0) return RECENCY_MAX_BONUS;
  if (ageMs >= RECENCY_WINDOW_MS) return 0;
  return RECENCY_MAX_BONUS * (1 - ageMs / RECENCY_WINDOW_MS);
}
function scoreItem(item, now) {
  let score = 0;
  if (item.isFeatured) score += FEATURED_BONUS;
  score += item.priorityRank * PRIORITY_WEIGHT;
  if (item.verified) score += VERIFIED_BONUS;
  score += recencyBonus(item, now);
  if (item.freeTier) score -= FREE_TIER_PENALTY;
  return score;
}
function rankItems(items, now) {
  return items.map((item, index) => ({ item, index, score: scoreItem(item, now) })).sort((a, b) => b.score - a.score || a.index - b.index).map((e) => e.item);
}

// backend/src/discovery/discoveryService.ts
function search(items, input, now) {
  const keyword = input.keyword?.trim().toLowerCase();
  const location = input.location?.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (input.categorySlug && item.categorySlug !== input.categorySlug) return false;
    if (location && !item.location.toLowerCase().includes(location)) return false;
    if (input.maxRate !== void 0 && item.hourlyRate > input.maxRate) return false;
    if (keyword) {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
  switch (input.sort) {
    case "rate_asc":
      return [...filtered].sort((a, b) => a.hourlyRate - b.hourlyRate);
    case "rate_desc":
      return [...filtered].sort((a, b) => b.hourlyRate - a.hourlyRate);
    case "relevance":
    default:
      return rankItems(filtered, now);
  }
}

// backend/src/geo/types.ts
var UK_CITY_SEED = [
  { slug: "london", name: "London", region: "Greater London", lat: 51.5074, lng: -0.1278 },
  { slug: "manchester", name: "Manchester", region: "North West", lat: 53.4808, lng: -2.2426 },
  { slug: "birmingham", name: "Birmingham", region: "West Midlands", lat: 52.4862, lng: -1.8904 },
  { slug: "leeds", name: "Leeds", region: "Yorkshire", lat: 53.8008, lng: -1.5491 },
  { slug: "bristol", name: "Bristol", region: "South West", lat: 51.4545, lng: -2.5879 },
  { slug: "glasgow", name: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518 },
  { slug: "liverpool", name: "Liverpool", region: "North West", lat: 53.4084, lng: -2.9916 },
  { slug: "edinburgh", name: "Edinburgh", region: "Scotland", lat: 55.9533, lng: -3.1883 }
];

// backend/src/geo/geoService.ts
var GeoService = class {
  constructor(repo) {
    this.repo = repo;
  }
  async listCities() {
    return this.repo.list();
  }
  async getBySlug(slug) {
    const city = await this.repo.findBySlug(slug);
    if (!city) throw new NotFoundError(`City not found: ${slug}`);
    return city;
  }
  /**
   * Seed helper: inserts the UK city seed set into the repository. Idempotent by
   * slug — existing slugs are skipped. Returns the cities now present.
   */
  async seed() {
    for (const seed of UK_CITY_SEED) {
      const existing = await this.repo.findBySlug(seed.slug);
      if (existing) continue;
      await this.repo.save({ id: newId(), ...seed });
    }
    return this.listCities();
  }
};

// backend/src/geo/inMemoryGeoRepository.ts
var InMemoryGeoRepository = class extends InMemoryRepository {
  async findBySlug(slug) {
    const target = slug.toLowerCase();
    const all = await this.list();
    return all.find((c) => c.slug.toLowerCase() === target);
  }
};

// backend/src/geo/pgGeoRepository.ts
function toCity(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    region: row.region,
    lat: row.lat,
    lng: row.lng
  };
}
var PgGeoRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, slug, name, region, lat, lng from app.city where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toCity(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, slug, name, region, lat, lng from app.city order by name asc`
    );
    return rows.map(toCity);
  }
  async findBySlug(slug) {
    const { rows } = await this.db.query(
      `select id, slug, name, region, lat, lng from app.city where slug = $1`,
      [slug.toLowerCase()]
    );
    const row = rows[0];
    return row ? toCity(row) : void 0;
  }
  async save(entity) {
    await this.db.query(
      `insert into app.city (id, slug, name, region, lat, lng)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set slug = excluded.slug,
             name = excluded.name,
             region = excluded.region,
             lat = excluded.lat,
             lng = excluded.lng`,
      [entity.id, entity.slug.toLowerCase(), entity.name, entity.region, entity.lat ?? null, entity.lng ?? null]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgGeoRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.city where id = $1`, [id]);
  }
};

// backend/src/geo/seo.ts
function seoPath(categorySlug, citySlug) {
  return `/${categorySlug}/${citySlug}`;
}
function titleCase(slug) {
  return slug.split("-").filter((p) => p.length > 0).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}
function generateSeoPages(categorySlugs, cities) {
  const pages = [];
  for (const categorySlug of categorySlugs) {
    const category = titleCase(categorySlug);
    for (const city of cities) {
      pages.push({
        path: seoPath(categorySlug, city.slug),
        title: `${category} in ${city.name} | Vivost`,
        h1: `${category} in ${city.name}`,
        metaDescription: `Browse verified ${category.toLowerCase()} in ${city.name}, ${city.region}, on Vivost.`,
        categorySlug,
        citySlug: city.slug
      });
    }
  }
  return pages;
}

// backend/src/app/routes/catalog.ts
var CATEGORY_SLUGS = ["escorts", "massage", "companionship", "virtual"];
var CATEGORIES = [
  { slug: "escorts", name: "Escorts" },
  { slug: "massage", name: "Massage" },
  { slug: "companionship", name: "Companionship" },
  { slug: "virtual", name: "Virtual" }
];
var searchQuery = import_zod8.z.object({
  keyword: import_zod8.z.string().optional(),
  category: import_zod8.z.string().optional(),
  location: import_zod8.z.string().optional(),
  maxRate: import_zod8.z.coerce.number().optional(),
  sort: import_zod8.z.enum(["rate_asc", "rate_desc", "relevance"]).optional()
});
var slugParam = import_zod8.z.object({ slug: import_zod8.z.string() });
function registerCatalog(app2, c) {
  app2.get("/search", async (req) => {
    const q = searchQuery.parse(req.query);
    const now = c.clock.now();
    const listings = await c.listingsService.listActive();
    const items = await Promise.all(
      listings.map(async (listing) => {
        const isFeatured = await c.placementsService.isFeatured(listing.id, now);
        const entitlements = await c.subscriptionsService.resolveEntitlements(
          listing.ownerAccountId
        );
        const activeSub = await c.subscriptionsService.activeFor(listing.ownerAccountId);
        return {
          listingId: listing.id,
          categorySlug: listing.categorySlug,
          location: listing.location,
          name: listing.name,
          description: listing.description,
          hourlyRate: listing.hourlyRate,
          createdAt: listing.createdAt,
          isFeatured,
          priorityRank: entitlements.priorityRank,
          verified: listing.verified,
          freeTier: activeSub === void 0
        };
      })
    );
    const ranked = search(
      items,
      {
        keyword: q.keyword,
        categorySlug: q.category,
        location: q.location,
        maxRate: q.maxRate,
        sort: q.sort
      },
      now
    );
    const byId = new Map(listings.map((l) => [l.id, l]));
    return ranked.map((item) => byId.get(item.listingId)).filter((l) => l !== void 0);
  });
  app2.get("/cities", async () => {
    return c.geoService.listCities();
  });
  app2.get("/cities/:slug", async (req) => {
    const { slug } = slugParam.parse(req.params);
    return c.geoService.getBySlug(slug);
  });
  app2.get("/seo-pages", async () => {
    const cities = await c.geoService.listCities();
    return generateSeoPages(CATEGORY_SLUGS, cities);
  });
  app2.get("/categories", async () => {
    return CATEGORIES;
  });
}

// backend/src/app/routes/monetization.ts
var import_zod10 = require("zod");

// backend/src/monetization/inMemoryPlacementsRepository.ts
var InMemoryPlacementsRepository = class extends InMemoryRepository {
  async findByListing(listingId) {
    const all = await this.list();
    return all.filter((p) => p.listingId === listingId);
  }
  async findByCategory(categorySlug) {
    const all = await this.list();
    return all.filter((p) => p.categorySlug === categorySlug);
  }
  async findByCity(citySlug) {
    const all = await this.list();
    return all.filter((p) => p.citySlug === citySlug);
  }
};

// backend/src/monetization/inMemoryPlansRepository.ts
var InMemoryPlansRepository = class extends InMemoryRepository {
  async getByKey(key) {
    const all = await this.list();
    return all.find((p) => p.key === key);
  }
  async listActive() {
    const all = await this.list();
    return all.filter((p) => p.active);
  }
};

// backend/src/monetization/inMemorySubscriptionsRepository.ts
var InMemorySubscriptionsRepository = class extends InMemoryRepository {
  async findByAccount(accountId) {
    const all = await this.list();
    return all.filter((s) => s.accountId === accountId);
  }
};

// backend/src/monetization/pgPlacementsRepository.ts
function toPlacement(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    kind: row.kind,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    citySlug: row.city_slug,
    categorySlug: row.category_slug
  };
}
var PgPlacementsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.placement where id = $1",
      [id]
    );
    return rows[0] ? toPlacement(rows[0]) : void 0;
  }
  async findByListing(listingId) {
    const { rows } = await this.db.query(
      "select * from app.placement where listing_id = $1",
      [listingId]
    );
    return rows.map(toPlacement);
  }
  async findByCategory(categorySlug) {
    const { rows } = await this.db.query(
      "select * from app.placement where category_slug = $1",
      [categorySlug]
    );
    return rows.map(toPlacement);
  }
  async findByCity(citySlug) {
    const { rows } = await this.db.query(
      "select * from app.placement where city_slug = $1",
      [citySlug]
    );
    return rows.map(toPlacement);
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.placement"
    );
    return rows.map(toPlacement);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.placement
         (id, listing_id, kind, starts_at, ends_at, city_slug, category_slug)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         listing_id = excluded.listing_id,
         kind = excluded.kind,
         starts_at = excluded.starts_at,
         ends_at = excluded.ends_at,
         city_slug = excluded.city_slug,
         category_slug = excluded.category_slug`,
      [
        entity.id,
        entity.listingId,
        entity.kind,
        entity.startsAt,
        entity.endsAt,
        entity.citySlug,
        entity.categorySlug
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.placement where id = $1", [id]);
  }
};

// backend/src/monetization/pgPlansRepository.ts
function toPlan(row) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    priceMinor: Number(row.price_minor),
    currency: row.currency,
    intervalMonths: Number(row.interval_months),
    features: row.features,
    active: row.active
  };
}
var PgPlansRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.plan where id = $1",
      [id]
    );
    return rows[0] ? toPlan(rows[0]) : void 0;
  }
  async getByKey(key) {
    const { rows } = await this.db.query(
      "select * from app.plan where key = $1",
      [key]
    );
    return rows[0] ? toPlan(rows[0]) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.plan order by features->>'priorityRank'"
    );
    return rows.map(toPlan);
  }
  async listActive() {
    const { rows } = await this.db.query(
      "select * from app.plan where active = true order by features->>'priorityRank'"
    );
    return rows.map(toPlan);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.plan
         (id, key, name, price_minor, currency, interval_months, features, active)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         key = excluded.key,
         name = excluded.name,
         price_minor = excluded.price_minor,
         currency = excluded.currency,
         interval_months = excluded.interval_months,
         features = excluded.features,
         active = excluded.active`,
      [
        entity.id,
        entity.key,
        entity.name,
        entity.priceMinor,
        entity.currency,
        entity.intervalMonths,
        JSON.stringify(entity.features),
        entity.active
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.plan where id = $1", [id]);
  }
};

// backend/src/monetization/pgSubscriptionsRepository.ts
function toSubscription(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    planId: row.plan_id,
    status: row.status,
    startedAt: new Date(row.started_at),
    currentPeriodEnd: new Date(row.current_period_end),
    cancelAtPeriodEnd: row.cancel_at_period_end
  };
}
var PgSubscriptionsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.subscription where id = $1",
      [id]
    );
    return rows[0] ? toSubscription(rows[0]) : void 0;
  }
  async findByAccount(accountId) {
    const { rows } = await this.db.query(
      "select * from app.subscription where account_id = $1 order by started_at desc",
      [accountId]
    );
    return rows.map(toSubscription);
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.subscription"
    );
    return rows.map(toSubscription);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.subscription
         (id, account_id, plan_id, status, started_at, current_period_end, cancel_at_period_end)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         account_id = excluded.account_id,
         plan_id = excluded.plan_id,
         status = excluded.status,
         started_at = excluded.started_at,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end`,
      [
        entity.id,
        entity.accountId,
        entity.planId,
        entity.status,
        entity.startedAt,
        entity.currentPeriodEnd,
        entity.cancelAtPeriodEnd
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.subscription where id = $1", [id]);
  }
};

// backend/src/monetization/placementsService.ts
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
function isActiveAt(placement, now) {
  const t = now.getTime();
  return placement.startsAt.getTime() <= t && t < placement.endsAt.getTime();
}
var PlacementsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  async purchase(listingId, kind, durationDays, opts) {
    if (durationDays <= 0) {
      throw new ValidationError("durationDays must be positive");
    }
    const now = this.clock.now();
    const placement = {
      id: newId(),
      listingId,
      kind,
      startsAt: now,
      endsAt: new Date(now.getTime() + durationDays * MS_PER_DAY),
      citySlug: opts?.citySlug ?? null,
      categorySlug: opts?.categorySlug ?? null
    };
    return this.repo.save(placement);
  }
  async activeFor(listingId, now) {
    const all = await this.repo.findByListing(listingId);
    return all.filter((p) => isActiveAt(p, now));
  }
  async isFeatured(listingId, now) {
    const active = await this.activeFor(listingId, now);
    return active.some((p) => p.kind === "featured");
  }
  async activeForCategory(categorySlug, now) {
    const all = await this.repo.findByCategory(categorySlug);
    return all.filter((p) => isActiveAt(p, now));
  }
  async activeForCity(citySlug, now) {
    const all = await this.repo.findByCity(citySlug);
    return all.filter((p) => isActiveAt(p, now));
  }
};

// backend/src/monetization/types.ts
var import_zod9 = require("zod");
var planKeySchema = import_zod9.z.enum(["free", "basic", "pro", "premium"]);
var planFeaturesSchema = import_zod9.z.object({
  maxListings: import_zod9.z.number().int().nonnegative(),
  maxPhotos: import_zod9.z.number().int().nonnegative(),
  analytics: import_zod9.z.boolean(),
  verifiedBadgeIncluded: import_zod9.z.boolean(),
  priorityRank: import_zod9.z.number().int().nonnegative()
});
var planSchema = import_zod9.z.object({
  id: import_zod9.z.string(),
  key: planKeySchema,
  name: import_zod9.z.string(),
  priceMinor: import_zod9.z.number().int().nonnegative(),
  currency: import_zod9.z.string(),
  intervalMonths: import_zod9.z.number().int().positive(),
  features: planFeaturesSchema,
  active: import_zod9.z.boolean()
});
var subscriptionStatusSchema = import_zod9.z.enum(["active", "cancelled", "expired"]);
var subscriptionSchema = import_zod9.z.object({
  id: import_zod9.z.string(),
  accountId: import_zod9.z.string(),
  planId: import_zod9.z.string(),
  status: subscriptionStatusSchema,
  startedAt: import_zod9.z.date(),
  currentPeriodEnd: import_zod9.z.date(),
  cancelAtPeriodEnd: import_zod9.z.boolean()
});
var placementKindSchema = import_zod9.z.enum(["featured", "bump", "top_category"]);
var placementSchema = import_zod9.z.object({
  id: import_zod9.z.string(),
  listingId: import_zod9.z.string(),
  kind: placementKindSchema,
  startsAt: import_zod9.z.date(),
  endsAt: import_zod9.z.date(),
  citySlug: import_zod9.z.string().nullable(),
  categorySlug: import_zod9.z.string().nullable()
});
var SEED_PLANS = [
  {
    key: "free",
    name: "Free",
    priceMinor: 0,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 1,
      maxPhotos: 3,
      analytics: false,
      verifiedBadgeIncluded: false,
      priorityRank: 0
    },
    active: true
  },
  {
    key: "basic",
    name: "Basic",
    priceMinor: 1499,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 3,
      maxPhotos: 10,
      analytics: false,
      verifiedBadgeIncluded: false,
      priorityRank: 5
    },
    active: true
  },
  {
    key: "pro",
    name: "Pro",
    priceMinor: 3900,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 10,
      maxPhotos: 30,
      analytics: true,
      verifiedBadgeIncluded: false,
      priorityRank: 10
    },
    active: true
  },
  {
    key: "premium",
    name: "Premium",
    priceMinor: 11900,
    currency: "GBP",
    intervalMonths: 1,
    features: {
      maxListings: 25,
      maxPhotos: 60,
      analytics: true,
      verifiedBadgeIncluded: true,
      priorityRank: 20
    },
    active: true
  }
];
var FREE_PLAN_FEATURES = {
  maxListings: 1,
  maxPhotos: 3,
  analytics: false,
  verifiedBadgeIncluded: false,
  priorityRank: 0
};

// backend/src/monetization/plansService.ts
var PlansService = class {
  constructor(repo) {
    this.repo = repo;
  }
  async listActive() {
    return this.repo.listActive();
  }
  async getByKey(key) {
    const plan = await this.repo.getByKey(key);
    if (!plan) throw new NotFoundError(`Plan not found: ${key}`);
    return plan;
  }
  /**
   * Populate the repository with the canonical SEED_PLANS. Used by tests and
   * in-memory bootstrapping. Idempotent only insofar as it always inserts a new
   * row per plan; callers should seed an empty repo.
   */
  async seed() {
    const created = [];
    for (const seed of SEED_PLANS) {
      const plan = { id: newId(), ...seed };
      created.push(await this.repo.save(plan));
    }
    return created;
  }
};

// backend/src/monetization/subscriptionsService.ts
function addMonths(date, months) {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
var SubscriptionsService = class {
  constructor(subRepo, plansRepo, clock) {
    this.subRepo = subRepo;
    this.plansRepo = plansRepo;
    this.clock = clock;
    this.plansService = new PlansService(plansRepo);
  }
  plansService;
  async subscribe(accountId, planKey) {
    const plan = await this.plansService.getByKey(planKey);
    const now = this.clock.now();
    const sub = {
      id: newId(),
      accountId,
      planId: plan.id,
      status: "active",
      startedAt: now,
      currentPeriodEnd: addMonths(now, plan.intervalMonths),
      cancelAtPeriodEnd: false
    };
    return this.subRepo.save(sub);
  }
  async cancel(subId) {
    const sub = await this.subRepo.getById(subId);
    if (!sub) throw new NotFoundError(`Subscription not found: ${subId}`);
    sub.cancelAtPeriodEnd = true;
    return this.subRepo.save(sub);
  }
  async expireDue(now) {
    const all = await this.subRepo.list();
    let expired = 0;
    for (const sub of all) {
      if (sub.status === "active" && sub.currentPeriodEnd.getTime() <= now.getTime()) {
        sub.status = "expired";
        await this.subRepo.save(sub);
        expired += 1;
      }
    }
    return expired;
  }
  async activeFor(accountId) {
    const subs = await this.subRepo.findByAccount(accountId);
    return subs.find((s) => s.status === "active");
  }
  async resolveEntitlements(accountId) {
    const active = await this.activeFor(accountId);
    if (!active) return FREE_PLAN_FEATURES;
    const plan = await this.plansRepo.getById(active.planId);
    return plan ? plan.features : FREE_PLAN_FEATURES;
  }
};

// backend/src/app/routes/monetization.ts
var idParam4 = import_zod10.z.object({ id: import_zod10.z.string() });
var accountIdParam2 = import_zod10.z.object({ accountId: import_zod10.z.string() });
var listingIdParam = import_zod10.z.object({ listingId: import_zod10.z.string() });
var subscribeBody = import_zod10.z.object({
  accountId: import_zod10.z.string(),
  planKey: planKeySchema
});
var placementBody = import_zod10.z.object({
  listingId: import_zod10.z.string(),
  kind: placementKindSchema,
  durationDays: import_zod10.z.number(),
  citySlug: import_zod10.z.string().nullable().optional(),
  categorySlug: import_zod10.z.string().nullable().optional()
});
function registerMonetization(app2, c) {
  app2.get("/plans", async () => {
    return c.plansService.listActive();
  });
  app2.post("/subscriptions", async (req, reply) => {
    const { accountId, planKey } = subscribeBody.parse(req.body);
    const sub = await c.subscriptionsService.subscribe(accountId, planKey);
    void reply.status(201);
    return sub;
  });
  app2.post("/subscriptions/:id/cancel", async (req) => {
    const { id } = idParam4.parse(req.params);
    return c.subscriptionsService.cancel(id);
  });
  app2.get("/accounts/:accountId/entitlements", async (req) => {
    const { accountId } = accountIdParam2.parse(req.params);
    return c.subscriptionsService.resolveEntitlements(accountId);
  });
  app2.post("/placements", async (req, reply) => {
    const { listingId, kind, durationDays, citySlug, categorySlug } = placementBody.parse(req.body);
    const placement = await c.placementsService.purchase(listingId, kind, durationDays, {
      citySlug,
      categorySlug
    });
    void reply.status(201);
    return placement;
  });
  app2.get("/listings/:listingId/placements", async (req) => {
    const { listingId } = listingIdParam.parse(req.params);
    return c.placementsService.activeFor(listingId, c.clock.now());
  });
}

// backend/src/app/routes/verification.ts
var import_zod11 = require("zod");
var idParam5 = import_zod11.z.object({ id: import_zod11.z.string().uuid() });
var subjectIdParam = import_zod11.z.object({ subjectId: import_zod11.z.string().uuid() });
var startBody = import_zod11.z.object({
  subjectId: import_zod11.z.string().uuid(),
  subjectType: import_zod11.z.enum(["account", "listing"]),
  method: import_zod11.z.enum(["photo_id", "facial_age_estimation", "open_banking", "credit_card", "mno"])
});
function registerVerification(app2, c) {
  app2.post("/verification", async (req, reply) => {
    const { subjectId, subjectType, method } = startBody.parse(req.body);
    const record = await c.verificationService.startVerification(subjectId, subjectType, method);
    void reply.status(201);
    return record;
  });
  app2.post("/verification/:id/refresh", async (req) => {
    const { id } = idParam5.parse(req.params);
    return c.verificationService.refreshResult(id);
  });
  app2.get("/verification/subject/:subjectId", async (req) => {
    const { subjectId } = subjectIdParam.parse(req.params);
    return {
      isVerified: await c.verificationService.isVerified(subjectId),
      status: await c.verificationService.latestStatus(subjectId),
      badge: await c.verificationService.badgeFor(subjectId)
    };
  });
}

// backend/src/app/routes/payments.ts
var import_zod12 = require("zod");
var idParam6 = import_zod12.z.object({ id: import_zod12.z.string().uuid() });
var checkoutBody = import_zod12.z.object({
  accountId: import_zod12.z.string().uuid(),
  kind: import_zod12.z.enum(["subscription", "boost", "verification", "deposit"]),
  amountMinor: import_zod12.z.number().int(),
  currency: import_zod12.z.string(),
  reference: import_zod12.z.string()
});
var settleBody = import_zod12.z.object({ checkoutId: import_zod12.z.string() });
var refundBody = import_zod12.z.object({ amountMinor: import_zod12.z.number().int().optional() });
function registerPayments(app2, c) {
  app2.post("/payments/checkout", async (req, reply) => {
    const { accountId, kind, amountMinor, currency, reference } = checkoutBody.parse(req.body);
    const result = await c.paymentsService.createCheckout(
      accountId,
      kind,
      amountMinor,
      currency,
      reference
    );
    void reply.status(201);
    return result;
  });
  app2.post("/payments/settle", async (req) => {
    const { checkoutId } = settleBody.parse(req.body);
    return c.paymentsService.settle(checkoutId);
  });
  app2.post("/payments/:id/refund", async (req) => {
    const { id } = idParam6.parse(req.params);
    const { amountMinor } = refundBody.parse(req.body ?? {});
    return c.paymentsService.refund(id, amountMinor);
  });
  app2.post("/payments/webhook", async (req) => {
    const signature = req.headers["x-webhook-signature"];
    const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? "");
    const valid = c.paymentsService.verifyWebhook(
      payload,
      typeof signature === "string" ? signature : ""
    );
    return { valid };
  });
}

// backend/src/app/routes/screening.ts
var import_zod13 = require("zod");
var clientIdParam = import_zod13.z.object({ clientId: import_zod13.z.string().uuid() });
var reverseCheckBody = import_zod13.z.object({
  phone: import_zod13.z.string().min(1).nullable().default(null),
  email: import_zod13.z.string().min(1).nullable().default(null)
});
var offenderReportBody = import_zod13.z.object({
  phone: import_zod13.z.string().min(1).nullable().default(null),
  email: import_zod13.z.string().min(1).nullable().default(null),
  reason: import_zod13.z.string().min(1),
  reportedByAccountId: import_zod13.z.string().uuid()
});
function registerScreening(app2, c) {
  app2.post("/clients/:clientId/screening/request", async (req, reply) => {
    const { clientId } = clientIdParam.parse(req.params);
    const screening = await c.screeningService.requestScreening(clientId);
    void reply.status(201);
    return screening;
  });
  app2.post("/clients/:clientId/screening/reference", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.addReference(clientId);
  });
  app2.post("/clients/:clientId/screening/verify", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.markVerified(clientId);
  });
  app2.get("/clients/:clientId/screening", async (req) => {
    const { clientId } = clientIdParam.parse(req.params);
    return c.screeningService.getStatus(clientId);
  });
  app2.post("/reverse-check", async (req) => {
    const body = reverseCheckBody.parse(req.body);
    return c.reverseCheckerService.check(body);
  });
  app2.post("/offender-reports", async (req, reply) => {
    const body = offenderReportBody.parse(req.body);
    const report = await c.reverseCheckerService.report(body);
    void reply.status(201);
    return report;
  });
}

// backend/src/app/routes/safety.ts
var import_zod14 = require("zod");
var badDateReportBody = import_zod14.z.object({
  reporterAccountId: import_zod14.z.string().uuid(),
  phone: import_zod14.z.string().min(1).optional(),
  email: import_zod14.z.string().min(1).optional(),
  description: import_zod14.z.string().min(1),
  severity: import_zod14.z.enum(["low", "medium", "high"])
});
var searchBody = import_zod14.z.object({
  phone: import_zod14.z.string().min(1).optional(),
  email: import_zod14.z.string().min(1).optional()
});
var reverseReviewBody = import_zod14.z.object({
  reviewerAccountId: import_zod14.z.string().uuid(),
  clientContact: import_zod14.z.string().min(1),
  rating: import_zod14.z.number().int(),
  comment: import_zod14.z.string()
});
var reverseReviewQuery = import_zod14.z.object({ contact: import_zod14.z.string().min(1) });
var trustedContactBody = import_zod14.z.object({
  accountId: import_zod14.z.string().uuid(),
  name: import_zod14.z.string().min(1),
  contact: import_zod14.z.string().min(1)
});
var checkInBody = import_zod14.z.object({
  accountId: import_zod14.z.string().uuid(),
  trustedContactId: import_zod14.z.string().uuid(),
  durationMinutes: import_zod14.z.number()
});
var checkInIdParam = import_zod14.z.object({ id: import_zod14.z.string().uuid() });
function registerSafety(app2, c) {
  app2.post("/safety/bad-date-reports", async (req, reply) => {
    const body = badDateReportBody.parse(req.body);
    const report = await c.badDateService.report(body);
    void reply.status(201);
    return report;
  });
  app2.get("/safety/bad-date-reports", async () => {
    return c.badDateService.listForVerifiedProvider();
  });
  app2.post("/safety/bad-date-reports/search", async (req) => {
    const body = searchBody.parse(req.body);
    return c.badDateService.search(body);
  });
  app2.post("/safety/reverse-reviews", async (req, reply) => {
    const body = reverseReviewBody.parse(req.body);
    const review = await c.reverseReviewService.add(body);
    void reply.status(201);
    return review;
  });
  app2.get("/safety/reverse-reviews", async (req) => {
    const { contact } = reverseReviewQuery.parse(req.query);
    const [reviews, average] = await Promise.all([
      c.reverseReviewService.forClient({ contact }),
      c.reverseReviewService.averageRating({ contact })
    ]);
    return { reviews, average };
  });
  app2.post("/safety/trusted-contacts", async (req, reply) => {
    const body = trustedContactBody.parse(req.body);
    const contact = await c.trustedContactService.add(body);
    void reply.status(201);
    return contact;
  });
  app2.post("/safety/check-ins", async (req, reply) => {
    const body = checkInBody.parse(req.body);
    const session = await c.checkInService.start(body);
    void reply.status(201);
    return session;
  });
  app2.post("/safety/check-ins/:id/safe", async (req) => {
    const { id } = checkInIdParam.parse(req.params);
    return c.checkInService.markSafe(id);
  });
  app2.post("/safety/check-ins/:id/panic", async (req) => {
    const { id } = checkInIdParam.parse(req.params);
    return c.checkInService.triggerPanic(id);
  });
  app2.post("/safety/check-ins/evaluate-overdue", async () => {
    return c.checkInService.evaluateOverdue(c.clock.now());
  });
}

// backend/src/app/routes/enquiries.ts
var import_zod17 = require("zod");

// backend/src/enquiries/types.ts
var import_zod15 = require("zod");
var submitEnquirySchema = import_zod15.z.object({
  listingId: import_zod15.z.string().uuid(),
  clientId: import_zod15.z.string().uuid().nullable().default(null),
  name: import_zod15.z.string().min(1),
  preferredTime: import_zod15.z.string().min(1),
  confirmedReadServices: import_zod15.z.boolean(),
  references: import_zod15.z.string().nullable().default(null),
  message: import_zod15.z.string().min(1)
});

// backend/src/enquiries/enquiriesService.ts
var EnquiriesService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  /**
   * Anti-timewaster gate: an enquiry is only stored if the client has
   * explicitly confirmed they read the listing's services. Otherwise reject.
   */
  async submit(input) {
    const data = submitEnquirySchema.parse(input);
    if (data.confirmedReadServices !== true) {
      throw new ValidationError("must confirm read services");
    }
    const now = this.clock.now();
    const enquiry = {
      id: newId(),
      listingId: data.listingId,
      clientId: data.clientId,
      name: data.name,
      preferredTime: data.preferredTime,
      confirmedReadServices: true,
      references: data.references,
      message: data.message,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    return this.repo.save(enquiry);
  }
  async accept(enquiryId) {
    return this.transition(enquiryId, "accepted");
  }
  async decline(enquiryId) {
    return this.transition(enquiryId, "declined");
  }
  async listForListing(listingId) {
    return this.repo.findByListing(listingId);
  }
  async transition(enquiryId, status) {
    const existing = await this.repo.getById(enquiryId);
    if (!existing) {
      throw new NotFoundError("Enquiry not found");
    }
    const updated = {
      ...existing,
      status,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
};

// backend/src/enquiries/inMemoryEnquiriesRepository.ts
var InMemoryEnquiriesRepository = class extends InMemoryRepository {
  async findByListing(listingId) {
    const all = await this.list();
    return all.filter((e) => e.listingId === listingId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
};

// backend/src/enquiries/pgEnquiriesRepository.ts
function toEnquiry(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    clientId: row.client_id,
    name: row.name,
    preferredTime: row.preferred_time,
    confirmedReadServices: row.confirmed_read_services,
    references: row.references,
    message: row.message,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var PgEnquiriesRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.enquiry where id = $1",
      [id]
    );
    const row = rows[0];
    return row ? toEnquiry(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.enquiry order by created_at asc"
    );
    return rows.map(toEnquiry);
  }
  async findByListing(listingId) {
    const { rows } = await this.db.query(
      "select * from app.enquiry where listing_id = $1 order by created_at asc",
      [listingId]
    );
    return rows.map(toEnquiry);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.enquiry
         (id, listing_id, client_id, name, preferred_time,
          confirmed_read_services, "references", message, status,
          created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.listingId,
        entity.clientId ?? null,
        entity.name,
        entity.preferredTime,
        entity.confirmedReadServices,
        entity.references ?? null,
        entity.message,
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgEnquiriesRepository.save: row not found after upsert");
    }
    return saved;
  }
  async delete(id) {
    await this.db.query("delete from app.enquiry where id = $1", [id]);
  }
};

// backend/src/deposits/types.ts
var import_zod16 = require("zod");
var holdDepositSchema = import_zod16.z.object({
  enquiryId: import_zod16.z.string().uuid(),
  amountMinor: import_zod16.z.number().int().positive(),
  currency: import_zod16.z.string().min(1)
});

// backend/src/deposits/depositsService.ts
var DepositsService = class {
  constructor(repo, provider, clock) {
    this.repo = repo;
    this.provider = provider;
    this.clock = clock;
  }
  /**
   * Places a hold via the PaymentProvider port and records it as 'held'. The
   * provider returns only an opaque holdId — no card data is stored.
   */
  async hold(input) {
    const data = holdDepositSchema.parse(input);
    const { holdId } = await this.provider.holdDeposit({
      amountMinor: data.amountMinor,
      currency: data.currency,
      reference: `deposit:${data.enquiryId}`
    });
    const now = this.clock.now();
    const deposit = {
      id: newId(),
      enquiryId: data.enquiryId,
      amountMinor: data.amountMinor,
      currency: data.currency,
      holdId,
      status: "held",
      createdAt: now,
      updatedAt: now
    };
    return this.repo.save(deposit);
  }
  async release(depositId) {
    const deposit = await this.requireDeposit(depositId);
    await this.provider.releaseDeposit(deposit.holdId);
    return this.repo.save({
      ...deposit,
      status: "released",
      updatedAt: this.clock.now()
    });
  }
  async forfeit(depositId) {
    const deposit = await this.requireDeposit(depositId);
    return this.repo.save({
      ...deposit,
      status: "forfeited",
      updatedAt: this.clock.now()
    });
  }
  async requireDeposit(depositId) {
    const deposit = await this.repo.getById(depositId);
    if (!deposit) {
      throw new NotFoundError("Deposit not found");
    }
    return deposit;
  }
};

// backend/src/deposits/inMemoryDepositsRepository.ts
var InMemoryDepositsRepository = class extends InMemoryRepository {
  async findByEnquiry(enquiryId) {
    const all = await this.list();
    return all.filter((d) => d.enquiryId === enquiryId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
};

// backend/src/deposits/pgDepositsRepository.ts
function toDeposit(row) {
  return {
    id: row.id,
    enquiryId: row.enquiry_id,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    holdId: row.hold_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var PgDepositsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.deposit where id = $1",
      [id]
    );
    const row = rows[0];
    return row ? toDeposit(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.deposit order by created_at asc"
    );
    return rows.map(toDeposit);
  }
  async findByEnquiry(enquiryId) {
    const { rows } = await this.db.query(
      "select * from app.deposit where enquiry_id = $1 order by created_at asc",
      [enquiryId]
    );
    return rows.map(toDeposit);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.deposit
         (id, enquiry_id, amount_minor, currency, hold_id, status,
          created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.enquiryId,
        entity.amountMinor,
        entity.currency,
        entity.holdId,
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgDepositsRepository.save: row not found after upsert");
    }
    return saved;
  }
  async delete(id) {
    await this.db.query("delete from app.deposit where id = $1", [id]);
  }
};

// backend/src/app/routes/enquiries.ts
var idParam7 = import_zod17.z.object({ id: import_zod17.z.string().uuid() });
var listingIdParam2 = import_zod17.z.object({ listingId: import_zod17.z.string().uuid() });
function registerEnquiries(app2, c) {
  app2.post("/enquiries", async (req, reply) => {
    const input = submitEnquirySchema.parse(req.body);
    const enquiry = await c.enquiriesService.submit(input);
    void reply.status(201);
    return enquiry;
  });
  app2.post("/enquiries/:id/accept", async (req) => {
    const { id } = idParam7.parse(req.params);
    return c.enquiriesService.accept(id);
  });
  app2.post("/enquiries/:id/decline", async (req) => {
    const { id } = idParam7.parse(req.params);
    return c.enquiriesService.decline(id);
  });
  app2.get("/listings/:listingId/enquiries", async (req) => {
    const { listingId } = listingIdParam2.parse(req.params);
    return c.enquiriesService.listForListing(listingId);
  });
  app2.post("/deposits", async (req, reply) => {
    const input = holdDepositSchema.parse(req.body);
    const deposit = await c.depositsService.hold(input);
    void reply.status(201);
    return deposit;
  });
  app2.post("/deposits/:id/release", async (req) => {
    const { id } = idParam7.parse(req.params);
    return c.depositsService.release(id);
  });
  app2.post("/deposits/:id/forfeit", async (req) => {
    const { id } = idParam7.parse(req.params);
    return c.depositsService.forfeit(id);
  });
}

// backend/src/app/routes/reviews.ts
var import_zod19 = require("zod");

// backend/src/reviews/inMemoryReviewsRepository.ts
var InMemoryReviewsRepository = class extends InMemoryRepository {
  async findByListing(listingId) {
    const all = await this.list();
    return all.filter((r) => r.listingId === listingId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
};

// backend/src/reviews/pgReviewsRepository.ts
function toReview(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    clientId: row.client_id,
    rating: Number(row.rating),
    comment: row.comment,
    status: row.status,
    createdAt: new Date(row.created_at)
  };
}
var PgReviewsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.review where id = $1",
      [id]
    );
    const row = rows[0];
    return row ? toReview(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.review order by created_at asc"
    );
    return rows.map(toReview);
  }
  async findByListing(listingId) {
    const { rows } = await this.db.query(
      "select * from app.review where listing_id = $1 order by created_at asc",
      [listingId]
    );
    return rows.map(toReview);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.review
         (id, listing_id, client_id, rating, comment, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         status = excluded.status`,
      [
        entity.id,
        entity.listingId,
        entity.clientId,
        entity.rating,
        entity.comment,
        entity.status,
        entity.createdAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) {
      throw new Error("PgReviewsRepository.save: row not found after upsert");
    }
    return saved;
  }
  async delete(id) {
    await this.db.query("delete from app.review where id = $1", [id]);
  }
};

// backend/src/reviews/types.ts
var import_zod18 = require("zod");
var submitReviewSchema = import_zod18.z.object({
  listingId: import_zod18.z.string().uuid(),
  clientId: import_zod18.z.string().uuid(),
  rating: import_zod18.z.number().int(),
  comment: import_zod18.z.string()
});

// backend/src/reviews/reviewsService.ts
var ReviewsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  /**
   * A client rates a listing. Rating must be an integer 1-5. Reviews are
   * published immediately (the flywheel) and can be removed by moderation.
   */
  async submit(input) {
    const data = submitReviewSchema.parse(input);
    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError("rating must be between 1 and 5");
    }
    const review = {
      id: newId(),
      listingId: data.listingId,
      clientId: data.clientId,
      rating: data.rating,
      comment: data.comment,
      status: "published",
      createdAt: this.clock.now()
    };
    return this.repo.save(review);
  }
  async listForListing(listingId) {
    const all = await this.repo.findByListing(listingId);
    return all.filter((r) => r.status === "published");
  }
  async averageRating(listingId) {
    const published = await this.listForListing(listingId);
    if (published.length === 0) return 0;
    const sum = published.reduce((acc, r) => acc + r.rating, 0);
    return sum / published.length;
  }
  async moderateRemove(reviewId) {
    const review = await this.repo.getById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }
    return this.repo.save({ ...review, status: "removed" });
  }
};

// backend/src/app/routes/reviews.ts
var idParam8 = import_zod19.z.object({ id: import_zod19.z.string().uuid() });
var listingIdParam3 = import_zod19.z.object({ listingId: import_zod19.z.string().uuid() });
function registerReviews(app2, c) {
  app2.post("/reviews", async (req, reply) => {
    const input = submitReviewSchema.parse(req.body);
    const review = await c.reviewsService.submit(input);
    void reply.status(201);
    return review;
  });
  app2.get("/listings/:listingId/reviews", async (req) => {
    const { listingId } = listingIdParam3.parse(req.params);
    const [reviews, average] = await Promise.all([
      c.reviewsService.listForListing(listingId),
      c.reviewsService.averageRating(listingId)
    ]);
    return { reviews, average };
  });
  app2.post("/reviews/:id/remove", async (req) => {
    const { id } = idParam8.parse(req.params);
    return c.reviewsService.moderateRemove(id);
  });
}

// backend/src/app/routes/analytics.ts
var import_zod20 = require("zod");
var listingIdParam4 = import_zod20.z.object({ listingId: import_zod20.z.string().uuid() });
var eventBody = import_zod20.z.object({
  listingId: import_zod20.z.string().uuid(),
  type: import_zod20.z.enum(["view", "contact", "conversion"]),
  sessionHash: import_zod20.z.string().nullable().optional()
});
var topQuery = import_zod20.z.object({
  limit: import_zod20.z.coerce.number().int().positive().optional()
});
function registerAnalytics(app2, c) {
  app2.post("/analytics/events", async (req, reply) => {
    const { listingId, type, sessionHash } = eventBody.parse(req.body);
    const event = await c.analyticsService.record(listingId, type, sessionHash);
    void reply.status(201);
    return event;
  });
  app2.get("/listings/:listingId/analytics", async (req) => {
    const { listingId } = listingIdParam4.parse(req.params);
    return c.analyticsService.funnelFor(listingId);
  });
  app2.get("/analytics/top", async (req) => {
    const { limit } = topQuery.parse(req.query);
    return c.analyticsService.topListings(limit ?? 10);
  });
}

// backend/src/app/routes/referrals.ts
var import_zod21 = require("zod");
var idParam9 = import_zod21.z.object({ id: import_zod21.z.string().uuid() });
var accountIdParam3 = import_zod21.z.object({ accountId: import_zod21.z.string().uuid() });
var createCodeBody = import_zod21.z.object({ ownerAccountId: import_zod21.z.string().uuid() });
var signupBody = import_zod21.z.object({
  code: import_zod21.z.string(),
  referredAccountId: import_zod21.z.string().uuid()
});
var activateBody = import_zod21.z.object({ rewardMinor: import_zod21.z.number().int() });
function registerReferrals(app2, c) {
  app2.post("/referrals/codes", async (req, reply) => {
    const { ownerAccountId } = createCodeBody.parse(req.body);
    const code = await c.referralsService.createCode(ownerAccountId);
    void reply.status(201);
    return code;
  });
  app2.post("/referrals/signups", async (req, reply) => {
    const { code, referredAccountId } = signupBody.parse(req.body);
    const referral = await c.referralsService.recordSignup(code, referredAccountId);
    void reply.status(201);
    return referral;
  });
  app2.post("/referrals/:id/activate", async (req) => {
    const { id } = idParam9.parse(req.params);
    const { rewardMinor } = activateBody.parse(req.body);
    return c.referralsService.activate(id, rewardMinor);
  });
  app2.get("/accounts/:accountId/referrals/balance", async (req) => {
    const { accountId } = accountIdParam3.parse(req.params);
    const balance = await c.referralsService.balanceFor(accountId);
    return { accountId, balanceMinor: balance };
  });
}

// backend/src/app/routes/messaging.ts
var import_zod23 = require("zod");

// backend/src/messaging/types.ts
var import_zod22 = require("zod");
var startConversationSchema = import_zod22.z.object({
  accountId: import_zod22.z.string().uuid(),
  clientId: import_zod22.z.string().uuid(),
  listingId: import_zod22.z.string().uuid().nullable().default(null)
});
var sendMessageSchema = import_zod22.z.object({
  senderRole: import_zod22.z.enum(["worker", "customer"]),
  body: import_zod22.z.string().min(1).max(4e3)
});

// backend/src/messaging/inMemoryConversationRepository.ts
var InMemoryConversationRepository = class extends InMemoryRepository {
  async findByParticipants(accountId, clientId, listingId) {
    const all = await this.list();
    return all.find(
      (c) => c.accountId === accountId && c.clientId === clientId && c.listingId === listingId
    );
  }
};

// backend/src/messaging/inMemoryMessageRepository.ts
var InMemoryMessageRepository = class extends InMemoryRepository {
  async listByConversation(conversationId) {
    const all = await this.list();
    return all.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
};

// backend/src/messaging/pgConversationRepository.ts
function toConversation(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    clientId: row.client_id,
    listingId: row.listing_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var SELECT = `select id, account_id, client_id, listing_id, status, created_at, updated_at
   from app.conversation`;
var PgConversationRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `${SELECT} where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toConversation(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `${SELECT} order by created_at asc`
    );
    return rows.map(toConversation);
  }
  async findByParticipants(accountId, clientId, listingId) {
    const { rows } = await this.db.query(
      `${SELECT}
         where account_id = $1
           and client_id = $2
           and listing_id is not distinct from $3`,
      [accountId, clientId, listingId]
    );
    const row = rows[0];
    return row ? toConversation(row) : void 0;
  }
  async save(entity) {
    await this.db.query(
      `insert into app.conversation
         (id, account_id, client_id, listing_id, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update
         set account_id = excluded.account_id,
             client_id = excluded.client_id,
             listing_id = excluded.listing_id,
             status = excluded.status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.accountId,
        entity.clientId,
        entity.listingId,
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved)
      throw new Error("PgConversationRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.conversation where id = $1`, [id]);
  }
};

// backend/src/messaging/pgMessageRepository.ts
function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    body: row.body,
    originalBody: row.original_body,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var SELECT2 = `select id, conversation_id, sender_role, body, original_body, status, created_at, updated_at
   from app.message`;
var PgMessageRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(`${SELECT2} where id = $1`, [
      id
    ]);
    const row = rows[0];
    return row ? toMessage(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `${SELECT2} order by created_at asc`
    );
    return rows.map(toMessage);
  }
  async listByConversation(conversationId) {
    const { rows } = await this.db.query(
      `${SELECT2} where conversation_id = $1 order by created_at asc`,
      [conversationId]
    );
    return rows.map(toMessage);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.message
         (id, conversation_id, sender_role, body, original_body, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update
         set conversation_id = excluded.conversation_id,
             sender_role = excluded.sender_role,
             body = excluded.body,
             original_body = excluded.original_body,
             status = excluded.status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.conversationId,
        entity.senderRole,
        entity.body,
        entity.originalBody,
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved)
      throw new Error("PgMessageRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.message where id = $1`, [id]);
  }
};

// backend/src/messaging/messagingService.ts
var CONTEXT_WINDOW = 10;
var MessagingService = class {
  constructor(conversations, messages, moderation, clock, eventBus) {
    this.conversations = conversations;
    this.messages = messages;
    this.moderation = moderation;
    this.clock = clock;
    this.eventBus = eventBus;
  }
  async startConversation(input) {
    const parsed = startConversationSchema.parse(input);
    const existing = await this.conversations.findByParticipants(
      parsed.accountId,
      parsed.clientId,
      parsed.listingId
    );
    if (existing) return existing;
    const now = this.clock.now();
    const conversation = {
      id: newId(),
      accountId: parsed.accountId,
      clientId: parsed.clientId,
      listingId: parsed.listingId,
      status: "open",
      createdAt: now,
      updatedAt: now
    };
    return this.conversations.save(conversation);
  }
  async sendMessage(input) {
    const conversation = await this.conversations.getById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    const parsed = sendMessageSchema.parse(input);
    const messageId = newId();
    const now = this.clock.now();
    const evaluation = this.moderation.evaluateInline({
      messageId,
      conversationId: input.conversationId,
      senderRole: parsed.senderRole,
      body: parsed.body
    });
    let status;
    let body;
    let originalBody;
    switch (evaluation.verdict.action) {
      case "redact":
        status = "redacted";
        body = evaluation.redactedBody;
        originalBody = parsed.body;
        break;
      case "hold":
        status = "held";
        body = parsed.body;
        originalBody = null;
        break;
      case "block":
        status = "blocked";
        body = parsed.body;
        originalBody = null;
        break;
      default:
        status = "delivered";
        body = parsed.body;
        originalBody = null;
        break;
    }
    const message = {
      id: messageId,
      conversationId: input.conversationId,
      senderRole: parsed.senderRole,
      body,
      originalBody,
      status,
      createdAt: now,
      updatedAt: now
    };
    const saved = await this.messages.save(message);
    await this.moderation.commitInline(evaluation.verdict);
    await this.conversations.save({ ...conversation, updatedAt: now });
    const history = await this.messages.listByConversation(
      input.conversationId
    );
    if (status !== "blocked" && status !== "held") {
      const context = history.slice(-CONTEXT_WINDOW).map((m) => ({ senderRole: m.senderRole, body: m.body }));
      await this.eventBus.publish({
        type: "message.sent",
        payload: {
          messageId,
          conversationId: input.conversationId,
          senderRole: parsed.senderRole,
          body,
          context
        }
      });
    }
    const strikeCount = history.filter(
      (m) => m.senderRole === parsed.senderRole && m.status === "blocked"
    ).length;
    const blocked = status === "blocked" || status === "held";
    const delivered = status === "delivered" || status === "redacted";
    const redacted = status === "redacted";
    const categories = evaluation.verdict.categories;
    let warning;
    if (blocked) {
      warning = `\u26A0 Your message was blocked (${categories.join(
        ", "
      )}). This is warning ${strikeCount}. Keep the conversation on-platform and respectful.`;
    } else if (redacted) {
      warning = "Contact details were hidden for your safety and kept on record.";
    } else {
      warning = null;
    }
    return {
      message: saved,
      moderation: {
        action: evaluation.verdict.action,
        categories,
        blocked,
        delivered,
        redacted,
        reason: evaluation.verdict.reason,
        strikeCount,
        warning
      }
    };
  }
  async getConversation(id) {
    const conversation = await this.conversations.getById(id);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    return conversation;
  }
  async listMessages(conversationId) {
    return this.messages.listByConversation(conversationId);
  }
};

// backend/src/app/routes/messaging.ts
var idParam10 = import_zod23.z.object({ id: import_zod23.z.string().uuid() });
var startSchema = import_zod23.z.object({
  workerRef: import_zod23.z.string().min(1),
  workerName: import_zod23.z.string().nullable().default(null),
  customerEmail: import_zod23.z.string().email()
});
function registerMessaging(app2, c) {
  app2.post("/messaging/start", async (req, reply) => {
    const { workerRef, customerEmail } = startSchema.parse(req.body);
    const worker = await c.accountsService.ensureByEmail(
      `worker.${workerRef}@vivost.local`,
      "advertiser"
    );
    const customer = await c.clientsService.ensureByEmail(customerEmail);
    const conversation = await c.messagingService.startConversation({
      accountId: worker.id,
      clientId: customer.id,
      listingId: null
    });
    void reply.status(201);
    return {
      conversationId: conversation.id,
      customerId: customer.id,
      workerId: worker.id
    };
  });
  app2.post("/conversations", async (req, reply) => {
    const input = startConversationSchema.parse(req.body);
    const conversation = await c.messagingService.startConversation(input);
    void reply.status(201);
    return conversation;
  });
  app2.get("/conversations/:id", async (req) => {
    const { id } = idParam10.parse(req.params);
    return c.messagingService.getConversation(id);
  });
  app2.get("/conversations/:id/messages", async (req) => {
    const { id } = idParam10.parse(req.params);
    return c.messagingService.listMessages(id);
  });
  app2.post("/conversations/:id/messages", async (req, reply) => {
    const { id } = idParam10.parse(req.params);
    const input = sendMessageSchema.parse(req.body);
    const result = await c.messagingService.sendMessage({
      conversationId: id,
      ...input
    });
    void reply.status(201);
    return result;
  });
}

// backend/src/app/routes/moderation.ts
var import_zod25 = require("zod");

// backend/src/moderation/types.ts
var import_zod24 = require("zod");
var resolveVerdictSchema = import_zod24.z.object({
  status: import_zod24.z.enum(["actioned", "dismissed"])
});

// backend/src/moderation/tier1.ts
var ACTION_RANK = {
  allow: 0,
  flag: 1,
  redact: 2,
  hold: 3,
  escalate: 4,
  block: 5
};
var OFF_PLATFORM_PATTERNS = [
  /(?:\+?\d[\s().-]?){10,}/g,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  /t\.me\/\S+/gi,
  /wa\.me\/\S+/gi,
  /whatsapp|telegram|signal|kik|viber/gi
];
var FINANCIAL_SCAM = /cashapp|venmo|paypal|zelle|revolut|bank transfer|sort code|iban|bitcoin|btc|crypto|gift ?card|western union|wire transfer/i;
var HARASSMENT = /\b(kill you|rape|i know where you live)\b/i;
var SAFETY_LEGAL = /\b1[0-5]\b|under ?age|under ?18|minor|school ?girl|coerc|forced|against (?:your|her|his) will|traffick/i;
function screenTier1(body) {
  const categories = [];
  let action = "allow";
  let redactedBody = body;
  let excerptIndex = null;
  const escalate = (next) => {
    if (ACTION_RANK[next] > ACTION_RANK[action]) action = next;
  };
  const safetyMatch = SAFETY_LEGAL.exec(body);
  if (safetyMatch) {
    categories.push("safety_legal");
    escalate("block");
    excerptIndex = safetyMatch.index;
  }
  const harassmentMatch = HARASSMENT.exec(body);
  if (harassmentMatch) {
    categories.push("harassment");
    escalate("block");
    if (excerptIndex === null) excerptIndex = harassmentMatch.index;
  }
  const financialMatch = FINANCIAL_SCAM.exec(body);
  if (financialMatch) {
    categories.push("financial_scam");
    escalate("block");
    if (excerptIndex === null) excerptIndex = financialMatch.index;
  }
  let offPlatformMatched = false;
  let offPlatformIndex = null;
  for (const pattern of OFF_PLATFORM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(redactedBody)) !== null) {
      offPlatformMatched = true;
      if (offPlatformIndex === null) offPlatformIndex = match.index;
      redactedBody = redactedBody.slice(0, match.index) + "[redacted]" + redactedBody.slice(match.index + match[0].length);
      pattern.lastIndex = match.index + "[redacted]".length;
    }
  }
  if (offPlatformMatched) {
    categories.push("off_platform");
    escalate("redact");
    if (excerptIndex === null) excerptIndex = offPlatformIndex;
  }
  const excerpt = excerptIndex === null ? null : body.slice(Math.max(0, excerptIndex), Math.max(0, excerptIndex) + 120);
  return { categories, action, redactedBody, excerpt };
}

// backend/src/moderation/inMemoryModerationRepository.ts
var InMemoryModerationRepository = class extends InMemoryRepository {
  async listByMessage(messageId) {
    const all = await this.list();
    return all.filter((v) => v.messageId === messageId);
  }
  async listQueue() {
    const all = await this.list();
    return all.filter((v) => v.needsReview && v.reviewStatus === "open").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

// backend/src/moderation/pgModerationRepository.ts
function toVerdict(row) {
  return {
    id: row.id,
    messageId: row.message_id,
    conversationId: row.conversation_id,
    tier: row.tier,
    categories: row.categories,
    score: Number(row.score),
    action: row.action,
    reason: row.reason,
    excerpt: row.excerpt,
    needsReview: row.needs_review,
    reviewStatus: row.review_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
var SELECT3 = `select id, message_id, conversation_id, tier, categories, score,
                       action, reason, excerpt, needs_review, review_status,
                       created_at, updated_at
                  from app.moderation_verdict`;
var PgModerationRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(`${SELECT3} where id = $1`, [id]);
    const row = rows[0];
    return row ? toVerdict(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(`${SELECT3} order by created_at asc`);
    return rows.map(toVerdict);
  }
  async listByMessage(messageId) {
    const { rows } = await this.db.query(
      `${SELECT3} where message_id = $1 order by created_at asc`,
      [messageId]
    );
    return rows.map(toVerdict);
  }
  async listQueue() {
    const { rows } = await this.db.query(
      `${SELECT3} where needs_review and review_status = 'open' order by created_at desc`
    );
    return rows.map(toVerdict);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.moderation_verdict
         (id, message_id, conversation_id, tier, categories, score, action,
          reason, excerpt, needs_review, review_status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (id) do update
         set tier = excluded.tier,
             categories = excluded.categories,
             score = excluded.score,
             action = excluded.action,
             reason = excluded.reason,
             excerpt = excluded.excerpt,
             needs_review = excluded.needs_review,
             review_status = excluded.review_status,
             updated_at = excluded.updated_at`,
      [
        entity.id,
        entity.messageId,
        entity.conversationId,
        entity.tier,
        entity.categories,
        entity.score,
        entity.action,
        entity.reason,
        entity.excerpt,
        entity.needsReview,
        entity.reviewStatus,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgModerationRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.moderation_verdict where id = $1`, [id]);
  }
};

// backend/src/moderation/moderationService.ts
var ALL_CATEGORIES = [
  "financial_scam",
  "off_platform",
  "harassment",
  "safety_legal"
];
var ALL_ACTIONS = [
  "allow",
  "redact",
  "hold",
  "block",
  "flag",
  "escalate"
];
var ModerationService = class {
  constructor(repo, provider, clock, eventBus) {
    this.repo = repo;
    this.provider = provider;
    this.clock = clock;
    this.eventBus = eventBus;
  }
  async screenInline(input) {
    const result = this.evaluateInline(input);
    await this.commitInline(result.verdict);
    return result;
  }
  /**
   * Pure Tier-1 evaluation: builds the verdict and the (possibly redacted) body
   * WITHOUT persisting or publishing. The verdict's message_id is a foreign key,
   * so the caller must save the message row first, then call commitInline().
   */
  evaluateInline(input) {
    const t1 = screenTier1(input.body);
    const now = this.clock.now();
    const needsReview = t1.action === "block";
    const score = t1.action === "allow" ? 0 : t1.action === "redact" ? 0.5 : 0.9;
    const verdict = {
      id: newId(),
      messageId: input.messageId,
      conversationId: input.conversationId,
      tier: 1,
      categories: t1.categories,
      score,
      action: t1.action,
      reason: t1.categories.length > 0 ? `Tier-1 matched: ${t1.categories.join(", ")} \u2192 ${t1.action}` : "Tier-1: no match",
      excerpt: t1.excerpt,
      needsReview,
      reviewStatus: "open",
      createdAt: now,
      updatedAt: now
    };
    return { verdict, redactedBody: t1.redactedBody };
  }
  /**
   * Persists a Tier-1 verdict and raises a safety escalation when required.
   * Call only after the referenced message row exists (FK on message_id).
   */
  async commitInline(verdict) {
    if (verdict.categories.includes("safety_legal")) {
      await this.eventBus.publish({
        type: "moderation.safety_escalation",
        payload: {
          messageId: verdict.messageId,
          conversationId: verdict.conversationId,
          categories: verdict.categories
        }
      });
    }
    await this.repo.save(verdict);
  }
  async screenDeep(input) {
    const r = await this.provider.analyze({
      body: input.body,
      context: input.context,
      focus: [...ALL_CATEGORIES]
    });
    if (!r.flagged) return;
    const now = this.clock.now();
    const score = Math.max(
      0,
      Math.min(1, typeof r.score === "number" && Number.isFinite(r.score) ? r.score : 0)
    );
    const action = ALL_ACTIONS.includes(r.action) ? r.action : "flag";
    const categories = (Array.isArray(r.categories) ? r.categories : []).filter(
      (c) => ALL_CATEGORIES.includes(c)
    );
    const verdict = {
      id: newId(),
      messageId: input.messageId,
      conversationId: input.conversationId,
      tier: 2,
      categories,
      score,
      action,
      reason: typeof r.reason === "string" ? r.reason : "",
      excerpt: null,
      needsReview: true,
      reviewStatus: "open",
      createdAt: now,
      updatedAt: now
    };
    if (categories.includes("safety_legal")) {
      await this.eventBus.publish({
        type: "moderation.safety_escalation",
        payload: {
          messageId: input.messageId,
          conversationId: input.conversationId,
          categories
        }
      });
    }
    await this.repo.save(verdict);
  }
  async listQueue() {
    return this.repo.listQueue();
  }
  async listByMessage(messageId) {
    return this.repo.listByMessage(messageId);
  }
  async resolve(id, status) {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError("Moderation verdict not found");
    }
    const updated = {
      ...existing,
      reviewStatus: status,
      needsReview: false,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
};

// backend/src/app/routes/moderation.ts
var idParam11 = import_zod25.z.object({ id: import_zod25.z.string().uuid() });
var messageIdParam = import_zod25.z.object({ messageId: import_zod25.z.string().uuid() });
function registerModeration(app2, c) {
  app2.get("/moderation/queue", async () => {
    return c.moderationService.listQueue();
  });
  app2.get("/moderation/messages/:messageId/verdicts", async (req) => {
    const { messageId } = messageIdParam.parse(req.params);
    return c.moderationService.listByMessage(messageId);
  });
  app2.post("/moderation/verdicts/:id/resolve", async (req) => {
    const { id } = idParam11.parse(req.params);
    const { status } = resolveVerdictSchema.parse(req.body);
    return c.moderationService.resolve(id, status);
  });
}

// backend/src/app/routes/devui.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var import_meta = {};
function htmlCandidates() {
  const candidates = [];
  try {
    candidates.push(
      (0, import_node_url.fileURLToPath)(new URL("../../../public/chat-tester.html", import_meta.url))
    );
  } catch {
  }
  candidates.push(import_node_path.default.join(process.cwd(), "backend/public/chat-tester.html"));
  candidates.push(import_node_path.default.join(process.cwd(), "public/chat-tester.html"));
  return candidates;
}
function readTesterHtml() {
  const candidates = htmlCandidates();
  for (const candidate of candidates) {
    if ((0, import_node_fs.existsSync)(candidate)) {
      return (0, import_node_fs.readFileSync)(candidate, "utf8");
    }
  }
  throw new Error(
    `chat-tester.html not found; looked in: ${candidates.join(", ")}`
  );
}
function registerDevUi(app2, _c) {
  const serve = (_req, reply) => {
    void reply.header("content-type", "text/html; charset=utf-8");
    return readTesterHtml();
  };
  app2.get("/", serve);
  app2.get("/chat", serve);
}

// backend/src/app/routes/index.ts
var allRegistrars = [
  registerHealth,
  registerListings,
  registerAccounts,
  registerClients,
  registerCatalog,
  registerMonetization,
  registerVerification,
  registerPayments,
  registerScreening,
  registerSafety,
  registerEnquiries,
  registerReviews,
  registerAnalytics,
  registerReferrals,
  registerMessaging,
  registerModeration,
  registerDevUi
];

// backend/src/app/server.ts
function buildServer(c) {
  const app2 = (0, import_fastify.default)({ logger: false });
  void app2.register(import_cors.default, { origin: true });
  registerErrorHandler(app2);
  for (const register of allRegistrars) {
    register(app2, c);
  }
  return app2;
}

// backend/src/core/testing/index.ts
var paymentCounter = 0;
function fakePaymentProvider() {
  const references = /* @__PURE__ */ new Map();
  return {
    async createCheckout(input) {
      const checkoutId = `checkout_${++paymentCounter}`;
      references.set(checkoutId, input.reference);
      return { checkoutId, url: `https://fake.test/checkout/${checkoutId}` };
    },
    async capture(checkoutId) {
      const reference = references.get(checkoutId) ?? "";
      return { status: reference.includes("fail") ? "failed" : "paid" };
    },
    async refund(_checkoutId, _amountMinor) {
      return { status: "refunded" };
    },
    async holdDeposit(_input) {
      return { holdId: `hold_${++paymentCounter}` };
    },
    async releaseDeposit(_holdId) {
      return { status: "released" };
    },
    verifyWebhook(_payload, signature) {
      return signature === "valid";
    }
  };
}
var checkCounter = 0;
function fakeIdVerificationProvider(config = {}) {
  const outcome = config.outcome ?? "pass";
  const checks = /* @__PURE__ */ new Map();
  return {
    async startCheck(input) {
      const checkId = `check_${++checkCounter}`;
      checks.set(checkId, input.method);
      return { checkId };
    },
    async getResult(checkId) {
      const method = checks.get(checkId) ?? "unknown";
      const checkedAt = config.checkedAt !== void 0 ? config.checkedAt : outcome === "pending" ? null : /* @__PURE__ */ new Date(0);
      return { status: outcome, method, checkedAt };
    }
  };
}
function fakeModerationProvider() {
  return {
    async analyze(input) {
      const body = input.body;
      if (/traffick|under ?age|under ?18|coerc|\b1[0-5]\b/i.test(body)) {
        return {
          flagged: true,
          categories: ["safety_legal"],
          score: 0.95,
          action: "escalate",
          reason: "safety_legal indicators detected"
        };
      }
      if (/bitcoin|crypto|wire transfer|gift ?card|western union/i.test(body)) {
        return {
          flagged: true,
          categories: ["financial_scam"],
          score: 0.8,
          action: "hold",
          reason: "financial_scam indicators detected"
        };
      }
      return { flagged: false, categories: [], score: 0, action: "allow", reason: "" };
    }
  };
}
function inMemoryEventBus() {
  const handlers = /* @__PURE__ */ new Map();
  return {
    async publish(event) {
      const list = handlers.get(event.type) ?? [];
      for (const handler2 of list) handler2(event.payload);
    },
    subscribe(type, handler2) {
      const list = handlers.get(type) ?? [];
      list.push(handler2);
      handlers.set(type, list);
    }
  };
}

// backend/src/verification/inMemoryVerificationRepository.ts
var InMemoryVerificationRepository = class extends InMemoryRepository {
  async findBySubject(subjectId) {
    const all = await this.list();
    return all.filter((r) => r.subjectId === subjectId);
  }
};

// backend/src/verification/pgVerificationRepository.ts
function toEntity(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectType: row.subject_type,
    method: row.method,
    checkId: row.check_id,
    status: row.status,
    checkedAt: row.checked_at,
    createdAt: row.created_at
  };
}
var PgVerificationRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toEntity(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record order by created_at desc`
    );
    return rows.map(toEntity);
  }
  async findBySubject(subjectId) {
    const { rows } = await this.db.query(
      `select id, subject_id, subject_type, method, check_id, status, checked_at, created_at
       from app.verification_record where subject_id = $1 order by created_at desc`,
      [subjectId]
    );
    return rows.map(toEntity);
  }
  async save(entity) {
    const { rows } = await this.db.query(
      `insert into app.verification_record
         (id, subject_id, subject_type, method, check_id, status, checked_at, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         subject_id = excluded.subject_id,
         subject_type = excluded.subject_type,
         method = excluded.method,
         check_id = excluded.check_id,
         status = excluded.status,
         checked_at = excluded.checked_at
       returning id, subject_id, subject_type, method, check_id, status, checked_at, created_at`,
      [
        entity.id,
        entity.subjectId,
        entity.subjectType,
        entity.method,
        entity.checkId,
        entity.status,
        entity.checkedAt,
        entity.createdAt
      ]
    );
    return toEntity(rows[0]);
  }
  async delete(id) {
    await this.db.query(`delete from app.verification_record where id = $1`, [id]);
  }
};

// backend/src/verification/verificationService.ts
var VerificationService = class {
  constructor(repo, idProvider, clock) {
    this.repo = repo;
    this.idProvider = idProvider;
    this.clock = clock;
  }
  async startVerification(subjectId, subjectType, method) {
    const { checkId } = await this.idProvider.startCheck({ subjectId, method });
    const record = {
      id: newId(),
      subjectId,
      subjectType,
      method,
      checkId,
      status: "pending",
      checkedAt: null,
      createdAt: this.clock.now()
    };
    return this.repo.save(record);
  }
  async refreshResult(recordId) {
    const existing = await this.repo.getById(recordId);
    if (!existing) {
      throw new NotFoundError("Verification record not found");
    }
    const result = await this.idProvider.getResult(existing.checkId);
    const updated = {
      ...existing,
      status: result.status,
      checkedAt: result.checkedAt
    };
    return this.repo.save(updated);
  }
  async isVerified(subjectId) {
    const records = await this.repo.findBySubject(subjectId);
    return records.some((r) => r.status === "pass");
  }
  async latestStatus(subjectId) {
    const records = await this.repo.findBySubject(subjectId);
    if (records.length === 0) return null;
    const latest = records.reduce(
      (a, b) => b.createdAt.getTime() >= a.createdAt.getTime() ? b : a
    );
    return latest.status;
  }
  async badgeFor(subjectId) {
    return await this.isVerified(subjectId) ? "id_verified" : null;
  }
};

// backend/src/payments/inMemoryPaymentsRepository.ts
var InMemoryPaymentsRepository = class extends InMemoryRepository {
  async findByCheckoutId(checkoutId) {
    const all = await this.list();
    return all.find((p) => p.checkoutId === checkoutId);
  }
};

// backend/src/payments/paymentsService.ts
var PaymentsService = class {
  constructor(repo, provider, clock) {
    this.repo = repo;
    this.provider = provider;
    this.clock = clock;
  }
  async createCheckout(accountId, kind, amountMinor, currency, reference) {
    const { checkoutId, url } = await this.provider.createCheckout({
      amountMinor,
      currency,
      reference,
      kind
    });
    const now = this.clock.now();
    const payment = {
      id: newId(),
      accountId,
      kind,
      amountMinor,
      currency,
      reference,
      checkoutId,
      status: "created",
      createdAt: now,
      updatedAt: now
    };
    const saved = await this.repo.save(payment);
    return { payment: saved, url };
  }
  async settle(checkoutId) {
    const existing = await this.repo.findByCheckoutId(checkoutId);
    if (!existing) {
      throw new NotFoundError("Payment not found for checkout");
    }
    const result = await this.provider.capture(checkoutId);
    const updated = {
      ...existing,
      status: result.status === "paid" ? "paid" : "failed",
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
  async refund(paymentId, amountMinor) {
    const existing = await this.repo.getById(paymentId);
    if (!existing) {
      throw new NotFoundError("Payment not found");
    }
    await this.provider.refund(existing.checkoutId, amountMinor);
    const updated = {
      ...existing,
      status: "refunded",
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
  verifyWebhook(payload, signature) {
    return this.provider.verifyWebhook(payload, signature);
  }
};

// backend/src/payments/pgPaymentsRepository.ts
function toEntity2(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    kind: row.kind,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    reference: row.reference,
    checkoutId: row.checkout_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
var COLS = "id, account_id, kind, amount_minor, currency, reference, checkout_id, status, created_at, updated_at";
var PgPaymentsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select ${COLS} from app.payment where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toEntity2(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select ${COLS} from app.payment order by created_at desc`
    );
    return rows.map(toEntity2);
  }
  async findByCheckoutId(checkoutId) {
    const { rows } = await this.db.query(
      `select ${COLS} from app.payment where checkout_id = $1`,
      [checkoutId]
    );
    const row = rows[0];
    return row ? toEntity2(row) : void 0;
  }
  async save(entity) {
    const { rows } = await this.db.query(
      `insert into app.payment
         (id, account_id, kind, amount_minor, currency, reference, checkout_id, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
         account_id = excluded.account_id,
         kind = excluded.kind,
         amount_minor = excluded.amount_minor,
         currency = excluded.currency,
         reference = excluded.reference,
         checkout_id = excluded.checkout_id,
         status = excluded.status
       returning ${COLS}`,
      [
        entity.id,
        entity.accountId,
        entity.kind,
        entity.amountMinor,
        entity.currency,
        entity.reference,
        entity.checkoutId,
        entity.status,
        entity.createdAt,
        entity.updatedAt
      ]
    );
    return toEntity2(rows[0]);
  }
  async delete(id) {
    await this.db.query(`delete from app.payment where id = $1`, [id]);
  }
};

// backend/src/screening/inMemoryOffenderReportRepository.ts
var InMemoryOffenderReportRepository = class extends InMemoryRepository {
  async findByHashes(hashes) {
    const set = new Set(hashes);
    const all = await this.list();
    return all.filter(
      (r) => r.phoneHash != null && set.has(r.phoneHash) || r.emailHash != null && set.has(r.emailHash)
    );
  }
};

// backend/src/screening/inMemoryScreeningRepository.ts
var InMemoryScreeningRepository = class {
  store = /* @__PURE__ */ new Map();
  async getByClientId(clientId) {
    const found = this.store.get(clientId);
    return found === void 0 ? void 0 : structuredClone(found);
  }
  async save(screening) {
    const copy = structuredClone(screening);
    this.store.set(copy.clientId, copy);
    return structuredClone(copy);
  }
};

// backend/src/screening/pgOffenderReportRepository.ts
function toReport(row) {
  return {
    id: row.id,
    phoneHash: row.phone_hash,
    emailHash: row.email_hash,
    reason: row.reason,
    reportedByAccountId: row.reported_by,
    createdAt: new Date(row.created_at)
  };
}
var PgOffenderReportRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toReport(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        order by created_at asc`
    );
    return rows.map(toReport);
  }
  async findByHashes(hashes) {
    if (hashes.length === 0) return [];
    const { rows } = await this.db.query(
      `select id, phone_hash, email_hash, reason, reported_by, created_at
         from app.offender_report
        where phone_hash = any($1) or email_hash = any($1)
        order by created_at asc`,
      [hashes]
    );
    return rows.map(toReport);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.offender_report
         (id, phone_hash, email_hash, reason, reported_by, created_at)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set phone_hash = excluded.phone_hash,
             email_hash = excluded.email_hash,
             reason = excluded.reason,
             reported_by = excluded.reported_by`,
      [
        entity.id,
        entity.phoneHash ?? null,
        entity.emailHash ?? null,
        entity.reason,
        entity.reportedByAccountId,
        entity.createdAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgOffenderReportRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.offender_report where id = $1`, [id]);
  }
};

// backend/src/screening/pgScreeningRepository.ts
function toScreening(row) {
  return {
    clientId: row.client_id,
    verified: row.verified,
    references: Number(row.references),
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    updatedAt: new Date(row.updated_at)
  };
}
var PgScreeningRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getByClientId(clientId) {
    const { rows } = await this.db.query(
      `select client_id, verified, "references", verified_at, updated_at
         from app.client_screening
        where client_id = $1`,
      [clientId]
    );
    const row = rows[0];
    return row ? toScreening(row) : void 0;
  }
  async save(screening) {
    await this.db.query(
      `insert into app.client_screening
         (client_id, verified, "references", verified_at, updated_at)
         values ($1, $2, $3, $4, $5)
       on conflict (client_id) do update
         set verified = excluded.verified,
             "references" = excluded."references",
             verified_at = excluded.verified_at`,
      [
        screening.clientId,
        screening.verified,
        screening.references,
        screening.verifiedAt,
        screening.updatedAt
      ]
    );
    const saved = await this.getByClientId(screening.clientId);
    if (!saved) throw new Error("PgScreeningRepository.save: row not found after upsert");
    return saved;
  }
};

// backend/src/screening/types.ts
var import_zod26 = require("zod");
var reportOffenderSchema = import_zod26.z.object({
  phone: import_zod26.z.string().min(1).nullable().default(null),
  email: import_zod26.z.string().min(1).nullable().default(null),
  reason: import_zod26.z.string().min(1),
  reportedByAccountId: import_zod26.z.string().uuid()
});
var checkOffenderSchema = import_zod26.z.object({
  phone: import_zod26.z.string().min(1).nullable().default(null),
  email: import_zod26.z.string().min(1).nullable().default(null)
});

// backend/src/screening/reverseCheckerService.ts
var ReverseCheckerService = class {
  constructor(repo, hasher, clock) {
    this.repo = repo;
    this.hasher = hasher;
    this.clock = clock;
  }
  async report(input) {
    const { phone, email, reason, reportedByAccountId } = reportOffenderSchema.parse(input);
    const phoneHash = phone != null ? this.hashPhone(phone) : null;
    const emailHash = email != null ? this.hashEmail(email) : null;
    if (phoneHash == null && emailHash == null) {
      throw new ValidationError(
        "A report must include at least one of phone or email"
      );
    }
    const report = {
      id: newId(),
      phoneHash,
      emailHash,
      reason,
      reportedByAccountId,
      createdAt: this.clock.now()
    };
    return this.repo.save(report);
  }
  async check(input) {
    const { phone, email } = checkOffenderSchema.parse(input);
    const hashes = [];
    if (phone != null) hashes.push(this.hashPhone(phone));
    if (email != null) hashes.push(this.hashEmail(email));
    if (hashes.length === 0) {
      throw new ValidationError(
        "A check must include at least one of phone or email"
      );
    }
    const matched = await this.repo.findByHashes(hashes);
    return {
      matches: matched.length,
      reasons: matched.map((r) => r.reason)
    };
  }
  hashPhone(phone) {
    return this.hasher.hash(normalisePhone(phone));
  }
  hashEmail(email) {
    return this.hasher.hash(normaliseEmail(email));
  }
};

// backend/src/screening/screeningService.ts
var ScreeningService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  /** Creates the screening record for a client if it does not exist yet. */
  async requestScreening(clientId) {
    const existing = await this.repo.getByClientId(clientId);
    if (existing) return existing;
    const screening = {
      clientId,
      verified: false,
      references: 0,
      verifiedAt: null,
      updatedAt: this.clock.now()
    };
    return this.repo.save(screening);
  }
  async addReference(clientId) {
    const screening = await this.requestScreening(clientId);
    const updated = {
      ...screening,
      references: screening.references + 1,
      updatedAt: this.clock.now()
    };
    return this.repo.save(updated);
  }
  async markVerified(clientId) {
    const screening = await this.requestScreening(clientId);
    const now = this.clock.now();
    const updated = {
      ...screening,
      verified: true,
      verifiedAt: now,
      updatedAt: now
    };
    return this.repo.save(updated);
  }
  /** The screening status an advertiser sees before accepting a booking. */
  async getStatus(clientId) {
    return this.requestScreening(clientId);
  }
};

// backend/src/safety/types.ts
var import_zod27 = require("zod");
var severitySchema = import_zod27.z.enum(["low", "medium", "high"]);

// backend/src/safety/badDateService.ts
var BadDateService = class {
  constructor(repo, hasher, clock) {
    this.repo = repo;
    this.hasher = hasher;
    this.clock = clock;
  }
  async report(input) {
    const severity = severitySchema.parse(input.severity);
    const phoneHash = input.phone != null && input.phone.trim() !== "" ? this.hasher.hash(normalisePhone(input.phone)) : null;
    const emailHash = input.email != null && input.email.trim() !== "" ? this.hasher.hash(normaliseEmail(input.email)) : null;
    if (phoneHash == null && emailHash == null) {
      throw new ValidationError(
        "A bad-date report requires at least one client contact (phone or email)"
      );
    }
    const report = {
      id: newId(),
      reporterAccountId: input.reporterAccountId,
      clientPhoneHash: phoneHash,
      clientEmailHash: emailHash,
      description: input.description,
      severity,
      createdAt: this.clock.now()
    };
    return this.repo.save(report);
  }
  /**
   * All reports. These are visible ONLY to verified advertisers — the
   * verification gate is enforced at the API layer; the method name makes that
   * intent explicit.
   */
  async listForVerifiedProvider() {
    return this.repo.list();
  }
  async search(input) {
    const phoneHash = input.phone != null && input.phone.trim() !== "" ? this.hasher.hash(normalisePhone(input.phone)) : null;
    const emailHash = input.email != null && input.email.trim() !== "" ? this.hasher.hash(normaliseEmail(input.email)) : null;
    if (phoneHash == null && emailHash == null) {
      throw new ValidationError("search requires a phone or email");
    }
    return this.repo.findByHashes({ phoneHash, emailHash });
  }
};

// backend/src/safety/checkInService.ts
var TrustedContactService = class {
  constructor(repo, hasher, clock) {
    this.repo = repo;
    this.hasher = hasher;
    this.clock = clock;
  }
  async add(input) {
    if (input.contact.trim() === "") {
      throw new ValidationError("contact is required");
    }
    const contact = {
      id: newId(),
      accountId: input.accountId,
      name: input.name,
      contactHash: this.hasher.hash(input.contact.trim().toLowerCase()),
      createdAt: this.clock.now()
    };
    return this.repo.save(contact);
  }
};
var CheckInService = class {
  constructor(sessionRepo, clock, eventBus) {
    this.sessionRepo = sessionRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }
  async start(input) {
    if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
      throw new ValidationError("durationMinutes must be a positive number");
    }
    const now = this.clock.now();
    const expectedEndAt = new Date(
      now.getTime() + input.durationMinutes * 6e4
    );
    const session = {
      id: newId(),
      accountId: input.accountId,
      trustedContactId: input.trustedContactId,
      startedAt: now,
      expectedEndAt,
      status: "active",
      createdAt: now
    };
    return this.sessionRepo.save(session);
  }
  async markSafe(sessionId) {
    const session = await this.requireSession(sessionId);
    session.status = "safe";
    return this.sessionRepo.save(session);
  }
  async triggerPanic(sessionId) {
    const session = await this.requireSession(sessionId);
    session.status = "panic";
    const saved = await this.sessionRepo.save(session);
    await this.eventBus.publish({
      type: "safety.panic",
      payload: { sessionId: saved.id, accountId: saved.accountId }
    });
    return saved;
  }
  /**
   * Mark any active session whose expectedEndAt has passed as overdue and
   * publish a safety.overdue event for each.
   */
  async evaluateOverdue(now) {
    const active = await this.sessionRepo.listActive();
    const overdue = [];
    for (const session of active) {
      if (session.expectedEndAt.getTime() < now.getTime()) {
        session.status = "overdue";
        const saved = await this.sessionRepo.save(session);
        await this.eventBus.publish({
          type: "safety.overdue",
          payload: { sessionId: saved.id, accountId: saved.accountId }
        });
        overdue.push(saved);
      }
    }
    return overdue;
  }
  async requireSession(sessionId) {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new NotFoundError("Check-in session not found");
    }
    return session;
  }
};

// backend/src/safety/inMemoryBadDateRepository.ts
var InMemoryBadDateRepository = class extends InMemoryRepository {
  async findByHashes(input) {
    const { phoneHash, emailHash } = input;
    const all = await this.list();
    return all.filter(
      (r) => phoneHash != null && r.clientPhoneHash === phoneHash || emailHash != null && r.clientEmailHash === emailHash
    );
  }
};

// backend/src/safety/inMemoryCheckInRepository.ts
var InMemoryCheckInRepository = class extends InMemoryRepository {
  async listActive() {
    const all = await this.list();
    return all.filter((s) => s.status === "active");
  }
};

// backend/src/safety/inMemoryReverseReviewRepository.ts
var InMemoryReverseReviewRepository = class extends InMemoryRepository {
  async findByContactHash(contactHash) {
    const all = await this.list();
    return all.filter((r) => r.clientContactHash === contactHash);
  }
};

// backend/src/safety/inMemoryTrustedContactRepository.ts
var InMemoryTrustedContactRepository = class extends InMemoryRepository {
  async listForAccount(accountId) {
    const all = await this.list();
    return all.filter((c) => c.accountId === accountId);
  }
};

// backend/src/safety/pgBadDateRepository.ts
function toReport2(row) {
  return {
    id: row.id,
    reporterAccountId: row.reporter_account_id,
    clientPhoneHash: row.phone_hash,
    clientEmailHash: row.email_hash,
    description: row.description,
    severity: row.severity,
    createdAt: new Date(row.created_at)
  };
}
var PgBadDateRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.bad_date_report where id = $1",
      [id]
    );
    return rows[0] ? toReport2(rows[0]) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.bad_date_report order by created_at desc"
    );
    return rows.map(toReport2);
  }
  async findByHashes(input) {
    const { rows } = await this.db.query(
      `select * from app.bad_date_report
        where ($1::text is not null and phone_hash = $1)
           or ($2::text is not null and email_hash = $2)
        order by created_at desc`,
      [input.phoneHash ?? null, input.emailHash ?? null]
    );
    return rows.map(toReport2);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.bad_date_report
         (id, reporter_account_id, phone_hash, email_hash, description, severity, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         reporter_account_id = excluded.reporter_account_id,
         phone_hash = excluded.phone_hash,
         email_hash = excluded.email_hash,
         description = excluded.description,
         severity = excluded.severity`,
      [
        entity.id,
        entity.reporterAccountId,
        entity.clientPhoneHash ?? null,
        entity.clientEmailHash ?? null,
        entity.description,
        entity.severity,
        entity.createdAt
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.bad_date_report where id = $1", [id]);
  }
};

// backend/src/safety/pgCheckInRepository.ts
function toSession(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    trustedContactId: row.trusted_contact_id,
    startedAt: new Date(row.started_at),
    expectedEndAt: new Date(row.expected_end_at),
    status: row.status,
    createdAt: new Date(row.created_at)
  };
}
var PgCheckInRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.check_in_session where id = $1",
      [id]
    );
    return rows[0] ? toSession(rows[0]) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.check_in_session order by created_at desc"
    );
    return rows.map(toSession);
  }
  async listActive() {
    const { rows } = await this.db.query(
      "select * from app.check_in_session where status = 'active' order by created_at desc"
    );
    return rows.map(toSession);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.check_in_session
         (id, account_id, trusted_contact_id, started_at, expected_end_at, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         account_id = excluded.account_id,
         trusted_contact_id = excluded.trusted_contact_id,
         started_at = excluded.started_at,
         expected_end_at = excluded.expected_end_at,
         status = excluded.status`,
      [
        entity.id,
        entity.accountId,
        entity.trustedContactId,
        entity.startedAt,
        entity.expectedEndAt,
        entity.status,
        entity.createdAt
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.check_in_session where id = $1", [id]);
  }
};

// backend/src/safety/pgReverseReviewRepository.ts
function toReview2(row) {
  return {
    id: row.id,
    reviewerAccountId: row.reviewer_account_id,
    clientContactHash: row.client_contact_hash,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.created_at)
  };
}
var PgReverseReviewRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.reverse_review where id = $1",
      [id]
    );
    return rows[0] ? toReview2(rows[0]) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.reverse_review order by created_at desc"
    );
    return rows.map(toReview2);
  }
  async findByContactHash(contactHash) {
    const { rows } = await this.db.query(
      "select * from app.reverse_review where client_contact_hash = $1 order by created_at desc",
      [contactHash]
    );
    return rows.map(toReview2);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.reverse_review
         (id, reviewer_account_id, client_contact_hash, rating, comment, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         reviewer_account_id = excluded.reviewer_account_id,
         client_contact_hash = excluded.client_contact_hash,
         rating = excluded.rating,
         comment = excluded.comment`,
      [
        entity.id,
        entity.reviewerAccountId,
        entity.clientContactHash,
        entity.rating,
        entity.comment,
        entity.createdAt
      ]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.reverse_review where id = $1", [id]);
  }
};

// backend/src/safety/pgTrustedContactRepository.ts
function toContact(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    contactHash: row.contact_hash,
    createdAt: new Date(row.created_at)
  };
}
var PgTrustedContactRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      "select * from app.trusted_contact where id = $1",
      [id]
    );
    return rows[0] ? toContact(rows[0]) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      "select * from app.trusted_contact order by created_at desc"
    );
    return rows.map(toContact);
  }
  async listForAccount(accountId) {
    const { rows } = await this.db.query(
      "select * from app.trusted_contact where account_id = $1 order by created_at desc",
      [accountId]
    );
    return rows.map(toContact);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.trusted_contact
         (id, account_id, name, contact_hash, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do update set
         account_id = excluded.account_id,
         name = excluded.name,
         contact_hash = excluded.contact_hash`,
      [entity.id, entity.accountId, entity.name, entity.contactHash, entity.createdAt]
    );
    return entity;
  }
  async delete(id) {
    await this.db.query("delete from app.trusted_contact where id = $1", [id]);
  }
};

// backend/src/safety/reverseReviewService.ts
function normaliseContact(contact) {
  return contact.trim().toLowerCase();
}
var ReverseReviewService = class {
  constructor(repo, hasher, clock) {
    this.repo = repo;
    this.hasher = hasher;
    this.clock = clock;
  }
  async add(input) {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ValidationError("rating must be an integer between 1 and 5");
    }
    if (input.clientContact.trim() === "") {
      throw new ValidationError("clientContact is required");
    }
    const review = {
      id: newId(),
      reviewerAccountId: input.reviewerAccountId,
      clientContactHash: this.hasher.hash(normaliseContact(input.clientContact)),
      rating: input.rating,
      comment: input.comment,
      createdAt: this.clock.now()
    };
    return this.repo.save(review);
  }
  async forClient(input) {
    const hash = this.hasher.hash(normaliseContact(input.contact));
    return this.repo.findByContactHash(hash);
  }
  async averageRating(input) {
    const reviews = await this.forClient(input);
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
  }
};

// backend/src/analytics/analyticsService.ts
var AnalyticsService = class {
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }
  /**
   * Records a funnel event for a listing at the current clock time. sessionHash,
   * if given, must already be a one-way hash — never a raw session id or PII.
   */
  async record(listingId, type, sessionHash) {
    const event = {
      id: newId(),
      listingId,
      type,
      at: this.clock.now(),
      sessionHash: sessionHash ?? null
    };
    return this.repo.save(event);
  }
  async funnelFor(listingId) {
    const { view, contact, conversion } = await this.repo.countByType(listingId);
    return {
      views: view,
      contacts: contact,
      conversions: conversion,
      contactRate: view === 0 ? 0 : contact / view,
      conversionRate: contact === 0 ? 0 : conversion / contact
    };
  }
  /**
   * Listing ids ordered by view count descending, capped at `limit`.
   */
  async topListings(limit) {
    const counts = await this.repo.viewCountsByListing();
    return counts.slice(0, Math.max(0, limit)).map((c) => c.listingId);
  }
};

// backend/src/analytics/inMemoryAnalyticsRepository.ts
var InMemoryAnalyticsRepository = class extends InMemoryRepository {
  async countByType(listingId) {
    const all = await this.list();
    const counts = {
      view: 0,
      contact: 0,
      conversion: 0
    };
    for (const event of all) {
      if (event.listingId === listingId) counts[event.type] += 1;
    }
    return counts;
  }
  async viewCountsByListing() {
    const all = await this.list();
    const byListing = /* @__PURE__ */ new Map();
    for (const event of all) {
      if (event.type !== "view") continue;
      byListing.set(event.listingId, (byListing.get(event.listingId) ?? 0) + 1);
    }
    return Array.from(byListing.entries()).map(([listingId, views]) => ({ listingId, views })).sort((a, b) => b.views - a.views);
  }
};

// backend/src/analytics/pgAnalyticsRepository.ts
function toEvent(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    type: row.type,
    at: new Date(row.at),
    sessionHash: row.session_hash
  };
}
var PgAnalyticsRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, listing_id, type, at, session_hash
         from app.analytics_event
        where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toEvent(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, listing_id, type, at, session_hash
         from app.analytics_event
        order by at asc`
    );
    return rows.map(toEvent);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.analytics_event (id, listing_id, type, at, session_hash)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set listing_id = excluded.listing_id,
             type = excluded.type,
             at = excluded.at,
             session_hash = excluded.session_hash`,
      [entity.id, entity.listingId, entity.type, entity.at, entity.sessionHash ?? null]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgAnalyticsRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.analytics_event where id = $1`, [id]);
  }
  async countByType(listingId) {
    const { rows } = await this.db.query(
      `select type, count(*)::text as count
         from app.analytics_event
        where listing_id = $1
        group by type`,
      [listingId]
    );
    const counts = {
      view: 0,
      contact: 0,
      conversion: 0
    };
    for (const row of rows) counts[row.type] = Number(row.count);
    return counts;
  }
  async viewCountsByListing() {
    const { rows } = await this.db.query(
      `select listing_id, count(*)::text as views
         from app.analytics_event
        where type = 'view'
        group by listing_id
        order by count(*) desc`
    );
    return rows.map((r) => ({ listingId: r.listing_id, views: Number(r.views) }));
  }
};

// backend/src/referrals/inMemoryReferralRepository.ts
var InMemoryReferralCodeRepository = class extends InMemoryRepository {
  async findByCode(code) {
    const all = await this.list();
    return all.find((c) => c.code === code);
  }
};
var InMemoryReferralRepository = class extends InMemoryRepository {
  async findByCodeId(codeId) {
    const all = await this.list();
    return all.filter((r) => r.codeId === codeId);
  }
};

// backend/src/referrals/inMemoryRewardLedgerRepository.ts
var InMemoryRewardLedgerRepository = class extends InMemoryRepository {
  async findByAccount(accountId) {
    const all = await this.list();
    return all.filter((e) => e.accountId === accountId);
  }
};

// backend/src/referrals/pgReferralRepository.ts
function toCode(row) {
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    code: row.code,
    createdAt: new Date(row.created_at)
  };
}
var PgReferralCodeRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, owner_account_id, code, created_at
         from app.referral_code where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toCode(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, owner_account_id, code, created_at
         from app.referral_code order by created_at asc`
    );
    return rows.map(toCode);
  }
  async findByCode(code) {
    const { rows } = await this.db.query(
      `select id, owner_account_id, code, created_at
         from app.referral_code where code = $1`,
      [code]
    );
    const row = rows[0];
    return row ? toCode(row) : void 0;
  }
  async save(entity) {
    await this.db.query(
      `insert into app.referral_code (id, owner_account_id, code, created_at)
         values ($1, $2, $3, $4)
       on conflict (id) do update
         set owner_account_id = excluded.owner_account_id,
             code = excluded.code`,
      [entity.id, entity.ownerAccountId, entity.code, entity.createdAt]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgReferralCodeRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.referral_code where id = $1`, [id]);
  }
};
function toReferral(row) {
  return {
    id: row.id,
    codeId: row.code_id,
    referredAccountId: row.referred_account_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    activatedAt: row.activated_at ? new Date(row.activated_at) : null
  };
}
var PgReferralRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toReferral(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral order by created_at asc`
    );
    return rows.map(toReferral);
  }
  async findByCodeId(codeId) {
    const { rows } = await this.db.query(
      `select id, code_id, referred_account_id, status, created_at, activated_at
         from app.referral where code_id = $1 order by created_at asc`,
      [codeId]
    );
    return rows.map(toReferral);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.referral
         (id, code_id, referred_account_id, status, created_at, activated_at)
         values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update
         set code_id = excluded.code_id,
             referred_account_id = excluded.referred_account_id,
             status = excluded.status,
             activated_at = excluded.activated_at`,
      [
        entity.id,
        entity.codeId,
        entity.referredAccountId,
        entity.status,
        entity.createdAt,
        entity.activatedAt
      ]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgReferralRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.referral where id = $1`, [id]);
  }
};

// backend/src/referrals/pgRewardLedgerRepository.ts
function toEntry(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    amountMinor: Number(row.amount_minor),
    reason: row.reason,
    createdAt: new Date(row.created_at)
  };
}
var PgRewardLedgerRepository = class {
  constructor(db) {
    this.db = db;
  }
  async getById(id) {
    const { rows } = await this.db.query(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger where id = $1`,
      [id]
    );
    const row = rows[0];
    return row ? toEntry(row) : void 0;
  }
  async list() {
    const { rows } = await this.db.query(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger order by created_at asc`
    );
    return rows.map(toEntry);
  }
  async findByAccount(accountId) {
    const { rows } = await this.db.query(
      `select id, account_id, amount_minor, reason, created_at
         from app.reward_ledger where account_id = $1 order by created_at asc`,
      [accountId]
    );
    return rows.map(toEntry);
  }
  async save(entity) {
    await this.db.query(
      `insert into app.reward_ledger (id, account_id, amount_minor, reason, created_at)
         values ($1, $2, $3, $4, $5)
       on conflict (id) do update
         set account_id = excluded.account_id,
             amount_minor = excluded.amount_minor,
             reason = excluded.reason`,
      [entity.id, entity.accountId, entity.amountMinor, entity.reason, entity.createdAt]
    );
    const saved = await this.getById(entity.id);
    if (!saved) throw new Error("PgRewardLedgerRepository.save: row not found after upsert");
    return saved;
  }
  async delete(id) {
    await this.db.query(`delete from app.reward_ledger where id = $1`, [id]);
  }
};

// backend/src/referrals/referralsService.ts
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_LENGTH = 8;
function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}
var ReferralsService = class {
  constructor(codeRepo, referralRepo, ledgerRepo, clock) {
    this.codeRepo = codeRepo;
    this.referralRepo = referralRepo;
    this.ledgerRepo = ledgerRepo;
    this.clock = clock;
  }
  async createCode(ownerAccountId) {
    let code = generateCode();
    while (await this.codeRepo.findByCode(code)) {
      code = generateCode();
    }
    const referralCode = {
      id: newId(),
      ownerAccountId,
      code,
      createdAt: this.clock.now()
    };
    return this.codeRepo.save(referralCode);
  }
  /**
   * Records a signup attributed to a code. Unknown code -> ValidationError.
   * The referral starts 'pending'; the reward is only granted on activate().
   */
  async recordSignup(code, referredAccountId) {
    const referralCode = await this.codeRepo.findByCode(code);
    if (!referralCode) {
      throw new ValidationError("Unknown referral code");
    }
    const referral = {
      id: newId(),
      codeId: referralCode.id,
      referredAccountId,
      status: "pending",
      createdAt: this.clock.now(),
      activatedAt: null
    };
    return this.referralRepo.save(referral);
  }
  /**
   * Activation gate: marks a pending referral as activated and credits BOTH
   * sides of the reward in the ledger (code owner + referred account).
   * Re-activating an already-activated referral -> ConflictError.
   */
  async activate(referralId, rewardMinor) {
    const referral = await this.referralRepo.getById(referralId);
    if (!referral) {
      throw new NotFoundError("Referral not found");
    }
    if (referral.status === "activated") {
      throw new ConflictError("Referral already activated");
    }
    const code = await this.codeRepo.getById(referral.codeId);
    if (!code) {
      throw new NotFoundError("Referral code not found");
    }
    const now = this.clock.now();
    const activated = {
      ...referral,
      status: "activated",
      activatedAt: now
    };
    await this.referralRepo.save(activated);
    await this.ledgerRepo.save({
      id: newId(),
      accountId: code.ownerAccountId,
      amountMinor: rewardMinor,
      reason: "referral_reward",
      createdAt: now
    });
    await this.ledgerRepo.save({
      id: newId(),
      accountId: referral.referredAccountId,
      amountMinor: rewardMinor,
      reason: "referral_welcome",
      createdAt: now
    });
    return activated;
  }
  async balanceFor(accountId) {
    const entries = await this.ledgerRepo.findByAccount(accountId);
    return entries.reduce((sum, e) => sum + e.amountMinor, 0);
  }
};

// backend/src/app/providers.ts
function placeholderPaymentProvider() {
  return {
    async createCheckout(input) {
      const checkoutId = `placeholder_checkout_${newId()}`;
      return { checkoutId, url: `https://placeholder.invalid/checkout/${input.reference}` };
    },
    async capture(_checkoutId) {
      return { status: "paid" };
    },
    async refund(_checkoutId, _amountMinor) {
      return { status: "refunded" };
    },
    async holdDeposit(_input) {
      return { holdId: `placeholder_hold_${newId()}` };
    },
    async releaseDeposit(_holdId) {
      return { status: "released" };
    },
    verifyWebhook(_payload, _signature) {
      return false;
    }
  };
}
function placeholderIdVerificationProvider() {
  return {
    async startCheck(_input) {
      return { checkId: `placeholder_check_${newId()}` };
    },
    async getResult(_checkId) {
      return { status: "pending", method: "placeholder", checkedAt: null };
    }
  };
}
function inProcessEventBus() {
  const handlers = /* @__PURE__ */ new Map();
  return {
    async publish(event) {
      const list = handlers.get(event.type) ?? [];
      for (const handler2 of list) handler2(event.payload);
    },
    subscribe(type, handler2) {
      const list = handlers.get(type) ?? [];
      list.push(handler2);
      handlers.set(type, list);
    }
  };
}
var ALLOW_VERDICT = {
  flagged: false,
  categories: [],
  score: 0,
  action: "allow",
  reason: ""
};
function placeholderModerationProvider() {
  return {
    async analyze(_input) {
      return { ...ALLOW_VERDICT };
    }
  };
}
var OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
var MODERATION_SYSTEM_PROMPT = 'You are a trust-and-safety classifier for an adult-services marketplace chat. Detect financial_scam, off_platform, harassment, safety_legal. Respond ONLY with a JSON object {"flagged":boolean,"categories":string[],"score":number,"action":string,"reason":string} where action is one of allow, redact, hold, block, flag, escalate.';
function openaiModerationProvider(apiKey, model) {
  return {
    async analyze(input) {
      try {
        const transcript = input.context.map((m) => `${m.senderRole}: ${m.body}`).join("\n");
        const userContent = `focus categories: ${input.focus.join(", ")}

conversation so far:
${transcript}

message to classify:
${input.body}`;
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model,
            max_tokens: 400,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: MODERATION_SYSTEM_PROMPT },
              { role: "user", content: userContent }
            ]
          })
        });
        if (!res.ok) return { ...ALLOW_VERDICT };
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (!text) return { ...ALLOW_VERDICT };
        const parsed = JSON.parse(text);
        return {
          flagged: Boolean(parsed.flagged),
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          score: typeof parsed.score === "number" ? parsed.score : 0,
          action: parsed.action ?? "allow",
          reason: typeof parsed.reason === "string" ? parsed.reason : ""
        };
      } catch {
        return { ...ALLOW_VERDICT };
      }
    }
  };
}
function productionModerationProvider() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return placeholderModerationProvider();
  const model = process.env.OPENAI_MODEL ?? OPENAI_DEFAULT_MODEL;
  return openaiModerationProvider(key, model);
}

// backend/src/app/container.ts
function createInMemoryContainer(opts) {
  const clock = opts?.clock ?? systemClock;
  const paymentProvider = fakePaymentProvider();
  const idProvider = fakeIdVerificationProvider();
  const eventBus = inMemoryEventBus();
  const plansRepo = new InMemoryPlansRepository();
  const plansService = new PlansService(plansRepo);
  const geoRepo = new InMemoryGeoRepository();
  const geoService = new GeoService(geoRepo);
  const moderationService = new ModerationService(
    new InMemoryModerationRepository(),
    fakeModerationProvider(),
    clock,
    eventBus
  );
  const messagingService = new MessagingService(
    new InMemoryConversationRepository(),
    new InMemoryMessageRepository(),
    moderationService,
    clock,
    eventBus
  );
  const container2 = {
    accountsService: new AccountsService(new InMemoryAccountsRepository(), clock),
    listingsService: new ListingsService(new InMemoryListingsRepository(), clock),
    plansService,
    subscriptionsService: new SubscriptionsService(
      new InMemorySubscriptionsRepository(),
      plansRepo,
      clock
    ),
    placementsService: new PlacementsService(new InMemoryPlacementsRepository(), clock),
    verificationService: new VerificationService(
      new InMemoryVerificationRepository(),
      idProvider,
      clock
    ),
    paymentsService: new PaymentsService(new InMemoryPaymentsRepository(), paymentProvider, clock),
    geoService,
    clientsService: new ClientsService(new InMemoryClientsRepository(), clock),
    screeningService: new ScreeningService(new InMemoryScreeningRepository(), clock),
    reverseCheckerService: new ReverseCheckerService(
      new InMemoryOffenderReportRepository(),
      sha256Hasher,
      clock
    ),
    badDateService: new BadDateService(new InMemoryBadDateRepository(), sha256Hasher, clock),
    reverseReviewService: new ReverseReviewService(
      new InMemoryReverseReviewRepository(),
      sha256Hasher,
      clock
    ),
    trustedContactService: new TrustedContactService(
      new InMemoryTrustedContactRepository(),
      sha256Hasher,
      clock
    ),
    checkInService: new CheckInService(new InMemoryCheckInRepository(), clock, eventBus),
    enquiriesService: new EnquiriesService(new InMemoryEnquiriesRepository(), clock),
    depositsService: new DepositsService(new InMemoryDepositsRepository(), paymentProvider, clock),
    reviewsService: new ReviewsService(new InMemoryReviewsRepository(), clock),
    analyticsService: new AnalyticsService(new InMemoryAnalyticsRepository(), clock),
    referralsService: new ReferralsService(
      new InMemoryReferralCodeRepository(),
      new InMemoryReferralRepository(),
      new InMemoryRewardLedgerRepository(),
      clock
    ),
    moderationService,
    messagingService,
    clock
  };
  void plansService.seed();
  void geoService.seed();
  eventBus.subscribe("message.sent", (p) => {
    void container2.moderationService.screenDeep(p).catch((err) => {
      console.error("[moderation] Tier-2 screenDeep failed", err);
    });
  });
  return container2;
}
function createPgContainer(db, opts) {
  const clock = opts?.clock ?? systemClock;
  const paymentProvider = placeholderPaymentProvider();
  const idProvider = placeholderIdVerificationProvider();
  const eventBus = inProcessEventBus();
  const plansRepo = new PgPlansRepository(db);
  const moderationService = new ModerationService(
    new PgModerationRepository(db),
    productionModerationProvider(),
    clock,
    eventBus
  );
  const messagingService = new MessagingService(
    new PgConversationRepository(db),
    new PgMessageRepository(db),
    moderationService,
    clock,
    eventBus
  );
  const container2 = {
    accountsService: new AccountsService(new PgAccountsRepository(db), clock),
    listingsService: new ListingsService(new PgListingsRepository(db), clock),
    plansService: new PlansService(plansRepo),
    subscriptionsService: new SubscriptionsService(
      new PgSubscriptionsRepository(db),
      plansRepo,
      clock
    ),
    placementsService: new PlacementsService(new PgPlacementsRepository(db), clock),
    verificationService: new VerificationService(new PgVerificationRepository(db), idProvider, clock),
    paymentsService: new PaymentsService(new PgPaymentsRepository(db), paymentProvider, clock),
    geoService: new GeoService(new PgGeoRepository(db)),
    clientsService: new ClientsService(new PgClientsRepository(db), clock),
    screeningService: new ScreeningService(new PgScreeningRepository(db), clock),
    reverseCheckerService: new ReverseCheckerService(
      new PgOffenderReportRepository(db),
      sha256Hasher,
      clock
    ),
    badDateService: new BadDateService(new PgBadDateRepository(db), sha256Hasher, clock),
    reverseReviewService: new ReverseReviewService(
      new PgReverseReviewRepository(db),
      sha256Hasher,
      clock
    ),
    trustedContactService: new TrustedContactService(
      new PgTrustedContactRepository(db),
      sha256Hasher,
      clock
    ),
    checkInService: new CheckInService(new PgCheckInRepository(db), clock, eventBus),
    enquiriesService: new EnquiriesService(new PgEnquiriesRepository(db), clock),
    depositsService: new DepositsService(new PgDepositsRepository(db), paymentProvider, clock),
    reviewsService: new ReviewsService(new PgReviewsRepository(db), clock),
    analyticsService: new AnalyticsService(new PgAnalyticsRepository(db), clock),
    referralsService: new ReferralsService(
      new PgReferralCodeRepository(db),
      new PgReferralRepository(db),
      new PgRewardLedgerRepository(db),
      clock
    ),
    moderationService,
    messagingService,
    clock
  };
  eventBus.subscribe("message.sent", (p) => {
    void container2.moderationService.screenDeep(p).catch((err) => {
      console.error("[moderation] Tier-2 screenDeep failed", err);
    });
  });
  return container2;
}

// backend/src/vercel-handler.ts
var container = process.env.DATABASE_URL ? createPgContainer(createPgDb(process.env.DATABASE_URL)) : createInMemoryContainer();
var app = buildServer(container);
var readyPromise;
async function handler(req, res) {
  if (!readyPromise) readyPromise = app.ready();
  await readyPromise;
  const url = req.url ?? "/";
  if (url === "/api") {
    req.url = "/";
  } else if (url.startsWith("/api/")) {
    req.url = url.slice("/api".length);
  }
  app.server.emit("request", req, res);
}
