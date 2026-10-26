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
* `waitFor` from `@substrate-system/dom` only sees nodes in the
  document; for a detached element, poll with a short sleep instead.
* Synthetic `keydown` events never trigger implicit form submission. To
  test that Enter does not submit, call `form.requestSubmit()` when the
  dispatched keydown was not canceled.
* `#onkeydown` cancels a key only when the component acts on it (Enter
  with a Highlighted Suggestion, Escape with the Suggestion list open),
  so forms and `<dialog>`s keep working. Tests check this through the
  return value of the `key()` helper in `test/index.ts`.
* Every action that ends typing must call `#cancel()` (directly or via
  `#clear()`), including keys passed through to the page, like Enter
  with nothing Highlighted. Otherwise a late response reopens the
  Suggestion list. A new close path needs a test for both a pending
  debounce and a request in flight.
* Typeahead requests are debounced (`DEBOUNCE_MS` in `src/index.ts`).
  `type()` then `waitFor(OPTION)` still works, but a test asserting
  that no request was sent must first sleep past the debounce (the
  `DEBOUNCE` constant in `test/index.ts`), or it passes vacuously. A
  stubbed `fetch` is called only after the debounce, so poll until it
  has been called before driving its response.
* To control when a Typeahead request settles, use `deferredFetch()`
  and `requestFor(calls, q)` in `test/index.ts`. The stub rejects with
  an `AbortError` when the request's signal aborts, like the real
  `fetch`. Restore `window.fetch = fakeFetch` at the end of the test.
* To fail a Typeahead request, `reject()` the deferred call with a
  `TypeError` (network error) or `resolve()` it with a non-2xx or
  non-JSON `Response`. A failure clears the Suggestions, so a test of
  that must start with Suggestions open; from a closed list it only
  proves there was no rejection.
* tapout fails the whole run on any `unhandledrejection`, even when a
  page listener calls `preventDefault()`. A test cannot observe an
  unhandled rejection and still pass; `rejections()` only proves there
  were none.
* `render()` runs on every arrow and Page key, so it must not write the
  Suggestion count (`[role="status"]`). Only the response path in
  `#request` writes it; `render()` only empties it when there are no
  Suggestions. To prove a key does not write it, observe it with a
  `MutationObserver`, since an identical rewrite leaves the text equal.
* A `waitFor` lambda that never matches hangs the run until tapout's
  timeout ("Tests auto-finished"), hiding which assertion failed. After
  `respond()`, `await sleep(50)` instead when the change may not occur.
* tapout's `--timeout` covers the whole run, not one test. Each
  debounced `type()` adds time, so raise it in the `test` script if
  the suite grows past it ("Tests timed out").

## Browser support

* Baseline Newly available features are allowed when they are
  feature-detected and degrade to the pre-existing behavior.
* The Suggestion list is a `popover="manual"` positioned with CSS anchor
  positioning only when `CSS.supports('anchor-scope: --a')` is true
  (`ANCHORED` in `src/index.ts`). Its CSS keys on `[popover]`, so the
  fallback absolute layout needs no extra class. Author `display` on the
  list beats the UA popover rule, so `:not(:popover-open)` must hide it.
* The test browser supports anchor positioning, so the fallback is only
  checked by hand: set `ANCHORED` to `false` and use the example page,
  which has instances in a clipping container and near the viewport
  bottom.
