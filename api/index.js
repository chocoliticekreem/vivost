// Vercel serverless function entry. The real handler is esbuild-bundled into
// api/_app.cjs at build time (see scripts/build-api.mjs) — a single
// self-contained CommonJS file with every relative backend import resolved.
const mod = require("./_app.cjs");
module.exports = mod.default || mod;
