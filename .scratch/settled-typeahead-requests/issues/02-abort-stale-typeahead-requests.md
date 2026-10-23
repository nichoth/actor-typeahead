# 02: Abort stale Typeahead requests

**What to build:** Give each Typeahead request an `AbortController`,
abort it from `#cancel()`, and drop any response whose signal was
aborted, per the spec's "One request in flight", "A response applies
only if it is current", "One cancel path" and "Disconnect cancels"
decisions. Update the fetch stub in `test/index.ts` to honor
`init.signal` and add a deferred variant (spec, Testing Decisions).

**Status:** needs-triage

**Blocked by:** 01 (shares `#oninput` and `#cancel()`)

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`, `#cancel()`,
new `disconnectedCallback()`), `test/index.ts` (fetch stub, the
"response after the element is removed" test),
`docs/architecture/external-api.md`,
`docs/architecture/runtime-state.md`, a new ADR in `docs/adr/` and its
`INDEX.md` entry

- [ ] When the request for an older Query resolves after the request
      for a newer one, the Suggestions shown are the newer Query's
- [ ] Starting a new request aborts the previous request's signal
- [ ] A response that arrives after Escape, Selection, an emptied
      input or focusout does not reopen the Suggestion list
- [ ] Removing the Host element aborts its in-flight request; the late
      response renders no Suggestions, leaves the list closed and
      raises no `unhandledrejection`
- [ ] While a new Query is pending, the previous Suggestions stay
      rendered until its response arrives
