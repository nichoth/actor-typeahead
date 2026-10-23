# 02: Abort stale Typeahead requests

**What to build:** Give each Typeahead request an `AbortController`,
abort it from `#cancel()`, and drop any response whose signal was
aborted, per the spec's "One request in flight", "A response applies
only if it is current", "One cancel path" and "Disconnect cancels"
decisions. `disconnectedCallback()` already calls `#cancel()` (ticket
01), so removal aborts once `#cancel()` does.

An aborted `fetch` rejects with an `AbortError`. Catch it and return
silently in this ticket; without that, every keystroke during an
in-flight request raises an `unhandledrejection`. Other failures are
ticket 03.

Update the fetch stub in `test/index.ts` to honor `init.signal` and
add a deferred variant (spec, Testing Decisions). Change "a response
after the element is removed does not throw" to assert no rejection,
no Suggestions and a closed Suggestion list.

**Status:** done

**Blocked by:** 01 (shares `#oninput`, `#cancel()` and
`disconnectedCallback()`)

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`, `#cancel()`),
`test/index.ts` (fetch stub, the "response after the element is
removed" test), `docs/architecture/external-api.md`,
`docs/architecture/runtime-state.md`, a new ADR in `docs/adr/` and its
`INDEX.md` entry

- [x] When the request for an older Query resolves after the request
      for a newer one, the Suggestions shown are the newer Query's
- [x] Starting a new request aborts the previous request's signal
- [x] An aborted request raises no `unhandledrejection`
- [x] A response that arrives after Escape, Selection, an emptied
      input or focusout does not reopen the Suggestion list
- [x] Removing the Host element aborts its in-flight request; the late
      response renders no Suggestions, leaves the list closed and
      raises no `unhandledrejection`
- [x] While a new Query is pending, the previous Suggestions stay
      rendered until its response arrives
