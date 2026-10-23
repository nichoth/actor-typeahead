<!-- nightralph:review from=23bbebbc7394eabe9b426a2f4c5686a6ed683425 to=464ab65026b4a2e7be566970e08557cbe46482d6 status=fixed -->
## 2026-10-22 22:18 -- review 23bbebb..464ab65 -- 3 of 4 fixed
- [ ] Enter that submits the form does not cancel a pending Typeahead request, so the Suggestion list opens after the submit
    src/index.ts:160 -- type "alice" and press Enter within DEBOUNCE_MS in a form whose submit handler calls preventDefault (an SPA search form). Enter now passes through and submits, but `#cancel()` is never called. 150 ms later the request is sent and its response opens the Suggestion list over the submitted page state. The same thing happens when a request is already in flight. Escape cancels in the same situation, so the pass-through Enter path is the only "done typing" action that leaves a late response free to reopen the list.
- [x] The non-JSON failure test starts from a closed Suggestion list, so it only proves there was no rejection
    test/index.ts:527 -- "a body that is not JSON closes the Suggestion list quietly" resolves the first request with '<html>not json</html>' while no Suggestions are on screen. A change that swallowed the SyntaxError without calling `#clear()` would still pass. AGENTS.md says a failure test must start with Suggestions open. Only the network-error case does that ("a failed request closes an open Suggestion list"); the non-JSON and non-2xx paths are never checked against an open list.
- [x] The out-of-order response test throws away the rejections it collects
    test/index.ts:383 -- "a late response for an older Query does not replace a newer one" calls `await stop()` but never asserts on the result, unlike the other deferredFetch tests. If aborting the older request rejected unhandled, this test would not report it. (tapout fails the whole run on that, so the failure would not point at this test.)
- [x] runtime-state.md says `#controller` is null when no request is in flight, but it is never reset when a request finishes
    docs/architecture/runtime-state.md:20 -- when a response renders, the success path in `#request` (src/index.ts:211) leaves `#controller` pointing at the finished request's controller until the next `#cancel()`. So the doc's "`null` when no request is in flight" is wrong for every successful request.

### Fix
- attempts: 1 of 4
- effort: medium
- agent exit code: 0
- result: merged

# Review-fix notes

## Finding 1: Enter that submits does not cancel a pending request
- Fix: pass-through Enter (nothing Highlighted) calls `#cancel()` in
  `#onkeydown` (src/index.ts). It does not call `#clear()`, because the
  existing test "Enter with no Highlighted Suggestion submits a form"
  expects the list to stay open.
- Tests: "Enter that submits before the debounce sends no request",
  "Enter that submits drops the response in flight" (test/index.ts).
- Docs: components.md key table, external-api.md failure table,
  runtime-state.md `#timer` row, ADR-008 decision list.

## Finding 2: non-JSON failure test started from a closed list
- Both the non-JSON and the non-2xx tests now open Suggestions with a
  first response, then fail the second request, and assert the list
  closes (options, popover state, aria-expanded). Renamed the non-2xx
  test to "a non-2xx response closes the Suggestion list quietly".
- Verified by temporarily removing `this.#clear()` from the catch in
  `#request`: both tests failed, then restored.

## Finding 3: out-of-order test discarded its rejections
- Now asserts `errors.length === 0`, like the other deferredFetch
  tests. Could not be shown red in isolation: tapout fails the whole
  run on any unhandledrejection (see AGENTS.md), so the assertion is
  for consistency and for locality if tapout's behavior changes.

## Finding 4: runtime-state.md said #controller is null when idle
- Fixed the doc, not the code. `#controller` is private, so a code
  change (null it on settle) could not get a failing public-effect
  test, which the spec requires; aborting a finished controller is a
  no-op, so the stale reference has no behavior.
---
