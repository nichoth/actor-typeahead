# 01: Debounce Typeahead requests

**What to build:** Wait `DEBOUNCE_MS` (150) after the last non-empty
`input` event before sending the Typeahead request, as described in
the spec's Debounce decision. An empty Query still clears at once,
with no request, and also cancels a pending timer. Add a
`disconnectedCallback()` that calls `#cancel()`, so a timer never
fires on a removed Host element (spec, "Disconnect cancels"; ticket 02
adds the abort to the same path).

The debounce changes the timing of two existing tests:

- "a response after the element is removed does not throw" removes
  the element and calls `respond()` before the debounced `fetch` has
  run, so the stubbed request never resolves. Wait until the request
  has been sent, then remove the element, so the test still covers a
  late response. Ticket 02 changes what it asserts.
- "an empty input clears without a request" must wait past
  `DEBOUNCE_MS` before asserting, or it passes vacuously.

**Status:** done

**Blocked by:** None

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`, a new
`#cancel()` that for now only clears the timer, `#clear()`, new
`disconnectedCallback()`), `test/index.ts`,
`docs/architecture/external-api.md`,
`docs/architecture/runtime-state.md`, `docs/GLOSSARY.md`

- [x] Typing `a`, `al`, `ali` in quick succession sends exactly one
      Typeahead request, with `q=ali`
- [x] Typing, then emptying the input before the debounce elapses,
      sends no request and leaves the Suggestion list closed
- [x] Typing, then pressing Escape before the debounce elapses, sends
      no request
- [x] Typing, then removing the Host element before the debounce
      elapses, sends no request
- [x] Existing request-shape tests (host, rows, `q`, `limit`) still
      pass
