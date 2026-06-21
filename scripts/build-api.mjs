import { build } from "esbuild";

// Bundle the Fastify serverless handler (and all its relative backend imports)
// into one self-contained CommonJS file. node_modules stay external and are
// resolved at runtime from the function's installed dependencies.
await build({
  entryPoints: ["backend/src/vercel-handler.ts"],
  outfile: "api/_app.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  packages: "external",
  logLevel: "info",
});

console.log("✓ bundled api/_app.cjs");
