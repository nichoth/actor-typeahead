# Build and distribution

Sources: [`package.json`](../../package.json),
[`.github/workflows/nodejs.yml`](../../.github/workflows/nodejs.yml),
[`.github/workflows/gh-pages.yml`](../../.github/workflows/gh-pages.yml),
[`vite.config.js`](../../vite.config.js),
[`test/index.ts`](../../test/index.ts).

## Package exports

Only `dist/` is published. `npm run build` empties and rebuilds it.

| Export | File | Built by |
|--------|------|----------|
| `.` (import) | `dist/index.js` + `index.d.ts` | esbuild ESM, `tsc --emitDeclarationOnly` |
| `.` (require) | `dist/index.cjs` | esbuild CJS |
| `./min/*` (import) | `dist/*.min.js` | esbuild ESM, bundled and minified |
| `./min/*` (require) | `dist/*.min.cjs` | Nothing. No script builds it, so this target is missing |
| `./css` | `dist/index.css` | lightningcss with nesting |
| `./min/css` | `dist/index.min.css` | lightningcss, minified |
| `./custom-elements.json` | `dist/custom-elements.json` | `cem analyze` over `src/index.ts` |

The unminified builds leave `@substrate-system/web-component` as an
import. The `./min/*` builds bundle it.

## Tests

`npm test` bundles `test/index.ts` with esbuild and runs it in a
browser through tapout, using tapzero assertions. The suite replaces
`window.fetch` with a stub, mounts real elements, and drives them with
synthetic `input`, `keydown`, `focusout`, `mousedown` and `click`
events. The test seam is the element's public surface only.

## CI and deploy

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `nodejs.yml` | Every push | Node 22: install, build, lint, install Playwright, run tests under xvfb |
| `gh-pages.yml` | Push to `main`, manual | Build `example/` with Vite into `public/` and deploy the live demo to GitHub Pages |

`.npmrc` disables the lockfile, so every install resolves dependency
ranges fresh.

## Release

`npm version` runs lint and stylelint, regenerates the README TOC and
`CHANGELOG.md`, then pushes tags and publishes. `prepublishOnly` runs
the build. The package is at 0.0.0 and unpublished.
