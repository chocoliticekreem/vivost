# Post-render fixes (re-apply after every `./render.sh vivost.plain`)

The Codeplain React boilerplate (`typescript-react-app-boilerplate`) generates a
minimal webpack config that misses two things the rendered app needs. Each render
overwrites `build/`, so these must be re-applied (or scripted) after every render.

## 1. CSS loader (build fails without it)
The app does `import './styles/theme.css'` but webpack has no CSS loader.

- `build/package.json` devDependencies — add:
  - `"css-loader": "^6.8.0"`
  - `"style-loader": "^3.3.0"`
- `build/webpack.config.js` `module.rules` — add:
  ```js
  { test: /\.css$/, use: ['style-loader', 'css-loader'] },
  ```

## 2. SPA history fallback (deep-links / refresh 404 without it)
Direct loads of `/profile/1` or `/search` return `Cannot GET ...`.

- `build/webpack.config.js`:
  - `output` — add `publicPath: '/'`
  - `devServer` — add `historyApiFallback: true`

## 3. Cosmetic
- `build/public/index.html` — added an inline SVG favicon and set `<title>Vivost</title>`
  (silences the favicon 404; pure polish).

## Run
```bash
cd build
npm install
npm start          # dev server on http://localhost:3000
# or: npm run build (production bundle in build/dist/)
```

## Data swap point — real listing data (re-inject after every render)

The spec now owns the rich `Profile` model and the photo/contact/verified UI, but
ships only **safe placeholder** data. The real scraped listings live in a single
generated module that is the database-swap point:

- `build/src/data/profiles.ts` — defines the `Profile` type + helpers
  (`getAllProfiles`, `getProfileById`, `getProfilesByCategory`, `filterProfiles`,
  `sortProfiles`) and re-exports `PROFILES` from `./profiles.generated`. Holds no
  records itself.
- `build/src/data/profiles.generated.ts` — the swap point. A render writes a
  placeholder version here; the scraper overwrites it with real data.

A render destructively replaces `build/`, so re-inject real data **after** each render:

```bash
./render.sh vivost.plain                 # regenerates build/ (placeholder data)
node scraper/transform.mjs               # overwrites build/src/data/profiles.generated.ts
                                         #   from scraper/data/listings.json (real London data)
```

`scraper/transform.mjs` reads `scraper/data/listings.json` (produced by
`scraper/harvest_london.mjs` → `lib.mjs`) and writes the real `profiles.generated.ts`.
If `listings.json` is absent the placeholder version from the render is used and the
app still builds. Do **not** hand-edit anything under `build/` — it is disposable.

> Still TODO for a fully scripted clean render: move fixes 1–3 above (webpack CSS
> rule, SPA fallback, favicon/title) into a `--base-folder` so they survive renders
> too, then chain render → base-folder fixes → `transform.mjs`.
