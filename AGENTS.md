<!-- nightralph:start -->
## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
<!-- nightralph:end -->

## Conventions

* Public CSS API names (classes, custom properties) and JSDoc use the
  domain glossary in `CONTEXT.md` (Suggestion list, Suggestion, Handle).
* The CSS API lives in four places that must change together:
  `src/index.css`, the `@cssprop` JSDoc in `src/index.ts`, the README
  CSS variables block and markup snippet, and the generated manifest
  (`npm run build-manifest`, output in `dist/`, not committed).
* Lines stay under 80 columns in `.ts`, `.css` and `.md` files.
* Verify with `npm run lint`, `npx stylelint src/*.css`, `npm test`
  (browser tests via tapzero + tapout) and `npm run build`.
* `render()` owns every attribute written on the Authored input (the
  ARIA combobox set and the `autocomplete` default). Ids come from a
  per-instance prefix in `src/index.ts`; never hard-code element ids.
* Tests locate Suggestions with `[role="option"]` and the Suggestion
  list with `[role="listbox"]`, not with class names. tapzero's `Test`
  has `ok`, `equal`, `deepEqual`, `notEqual` but no `notOk`.
