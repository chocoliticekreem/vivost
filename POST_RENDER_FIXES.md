# Render pipeline & post-render steps

`build/` is **destructively regenerated** on every `./render.sh vivost.plain` — never
hand-edit it. Durable overrides live in two places outside `build/`.

## 1. Build-config overrides — `base/` (automatic)

`config.yaml` sets `base-folder: base`, so the Codeplain CLI copies `base/` into the
render and commits it **before** generating, surviving every render. It holds the
build config the `typescript-react-app-boilerplate` omits:

- `base/package.json` — adds `css-loader` / `style-loader` (the app imports
  `./styles/theme.css`; the build fails without them).
- `base/webpack.config.js` — adds the `.css` loader rule, `output.publicPath: '/'`,
  and `devServer.historyApiFallback: true` (deep-links / refresh return 404 without it).
- `base/public/index.html` — inline SVG favicon + `<title>Vivost</title>`.

If you need to change these, edit them in `base/` (not `build/`).

## 2. Real data — `scraper/transform.mjs` (one post-render command)

The spec ships safe **placeholder** records; the real listings live in the DB-swap
module `build/src/data/profiles.generated.ts`, regenerated after each render:

- `scraper/transform.mjs` reads `scraper/data/listings.json` (produced by
  `harvest_london.mjs` → `lib.mjs`) and writes the real `profiles.generated.ts`.
- If `listings.json` is absent, the render's placeholder version is used and the app
  still builds.

## Full clean pipeline

```bash
export CODEPLAIN_API_KEY=...            # required by render.sh
./render.sh vivost.plain               # regenerates build/ (base/ overrides applied automatically)
node scraper/transform.mjs             # inject real data into build/src/data/profiles.generated.ts
cd build && npm install && npm start   # dev server on http://localhost:3000
```

> The base-folder mechanism and `config.yaml` are verified at the code level, but this
> has **not** yet been run against a live render (needs `CODEPLAIN_API_KEY`). Run it
> once end-to-end to confirm `base/` lands correctly and no FR regenerates these files.
