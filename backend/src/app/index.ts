import { createPgDb } from "../core";
import { createInMemoryContainer, createPgContainer } from "./container";
import { buildServer } from "./server";
import type { Container } from "./container";

const port = Number(process.env.PORT ?? 8787);
const databaseUrl = process.env.DATABASE_URL;

let container: Container;
if (databaseUrl) {
  container = createPgContainer(createPgDb(databaseUrl));
} else {
  console.warn(
    "[vivost-api] DATABASE_URL not set — using in-memory container (no database, data is not persisted)",
  );
  container = createInMemoryContainer();
}

const app = buildServer(container);

app
  .listen({ port, host: "0.0.0.0" })
  .then((address) => {
    console.log(`[vivost-api] listening on ${address}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
