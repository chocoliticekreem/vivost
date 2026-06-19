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

## Data swap point
All content is placeholder in `build/src/data/` (`categories.ts`, `profiles.ts`,
`index.ts` helpers). Replace those modules with real DB-backed data later — the UI
reads only through the helper functions (`getAllProfiles`, `getProfileById`,
`getProfilesByCategory`, `filterProfiles`, `sortProfiles`).
