<!-- nightralph:entry ticket=settled-typeahead-requests:1 attempt=1 outcome=done -->
## 2026-10-22 21:59 -- settled-typeahead-requests/01 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $1.01. Checked items: none.

### Agent notes
# Ticket 01: debounce Typeahead requests

## Item 1: quick typing sends one request (q=ali)
- src/index.ts: DEBOUNCE_MS = 150, #timer, #oninput restarts the timer,
  new #request(query) does the fetch, #cancel() clears the timer,
  #clear() calls #cancel().
- test/index.ts: new test "quick typing sends one request for the settled
  Query"; DEBOUNCE = 200 test constant (> DEBOUNCE_MS).
- Changed "a response after the element is removed does not throw": now
  polls until the stubbed fetch was called, then removes and responds.
- package.json: tapout's default *whole-run* timeout is 5 s; every type()
  now costs 150 ms, so the suite timed out. Raised to --timeout 20000.

## Item 2: emptying before the debounce sends no request
- Behavior came for free from item 1 (#clear -> #cancel). Verified the new
  test is not vacuous by removing the #cancel() call from #clear: 3 fails.
- Also made "an empty input clears without a request" sleep DEBOUNCE
  before asserting (ticket asked for it).

## Item 3: Escape before the debounce sends no request
- Also covered by #clear -> #cancel. Same mutation check: red without it.

## Item 4: removing the element before the debounce sends no request
- Red first (1 fail), then added disconnectedCallback() -> #cancel().
  The base class only defines connectedCallback, so no super call.

## Item 5: existing request-shape tests still pass
- No change needed; "typing queries the typeahead API" and "host and rows
  attributes" pass unchanged.

## Docs (no test-first: docs only)
- external-api.md: Trigger row, debounce paragraph, failure table notes.
- runtime-state.md: #timer row. (The table still says `#menu`; the code
  field is `#suggestionList`. Pre-existing, left alone.)
- GLOSSARY.md: Typeahead request sent once per settled Query.
- Spec's new ADR (cancel-on-close, fail-quietly) is not in this ticket's
  Touches list; left for ticket 02 or later.
- Lint fix: no-unmodified-loop-condition on `respond` polling loop.

## For ticket 02
- #cancel() is the single cancel path; add the AbortController abort
  there. "a response after the element is removed" still asserts that
  the response renders; ticket 02 flips it.
- Final gate: lint, stylelint, build, npm test 80/80 all clean.

---
<!-- nightralph:entry ticket=settled-typeahead-requests:4 attempt=1 outcome=done -->
## 2026-10-22 22:03 -- settled-typeahead-requests/04 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $0.89. Checked items: "Escape with the Suggestion list open is canceled and closes it".

### Agent notes
# Ticket 04: Enter and Escape pass through when they have nothing to do

## Item 1: Enter with the list closed submits a form
- test/index.ts: new `formSetup()` helper (form + submit counter) and test
  "Enter with the Suggestion list closed submits a form". Red (0 submits),
  then src/index.ts `#onkeydown` Enter breaks early unless
  `this.#actors[this.#index]` exists.

## Item 2: Enter with the list open, nothing Highlighted, is not canceled
- Behavior came with item 1's guard. New test "Enter with no Highlighted
  Suggestion submits a form". Mutation check: removing the guard fails
  both Enter tests.

## Item 3: Enter with a Highlighted Suggestion is canceled and selects
- No change; the existing "Enter in the open Suggestion list does not
  submit a form" test passes unchanged.

## Item 4: Escape with the list closed is not canceled
- Red first, then `#onkeydown` Escape calls preventDefault() only when
  `this.#actors.length` (the same condition render() opens the list on,
  so it works for both the popover and the non-ANCHORED fallback).
  `#clear()` still runs either way.

## Item 5: Escape before the debounce is not canceled, sends no request
- Extended the existing "Escape before the debounce sends no request"
  test (from ticket 01) with `key()` returning true. Passed on arrival
  from item 4's change. Mutation checks: unconditional preventDefault
  fails it; dropping `#clear()` from closed-list Escape fails the
  no-request assertion.

## Item 6: Escape with the list open is canceled and closes it
- Extended "Escape closes the menu" with `key()` returning false and the
  popover closed. Mutation: never calling preventDefault fails it.

## Docs (no test-first: docs only)
- README.md: one paragraph on Enter/Escape passing through.
- docs/architecture/components.md Keyboard section: was "All handled keys
  call preventDefault()"; updated. Not in Touches but directly stale.
  (Its "Disconnect: no cleanup" line is stale since ticket 01; left.)
- GLOSSARY.md: Selection wording still accurate, unchanged.
- AGENTS.md: convention bullet on when #onkeydown cancels a key.
- Final gate: lint, stylelint, build, npm test 90/90 clean.

---
<!-- nightralph:entry ticket=settled-typeahead-requests:2 attempt=1 outcome=done -->
## 2026-10-22 22:05 -- settled-typeahead-requests/02 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $1.13. Checked items: "While a new Query is pending, the previous Suggestions stay rendered until its response arrives".

### Agent notes
# Ticket 02: abort stale Typeahead requests

## Item 1: an older response after a newer one shows the newer Suggestions
- src/index.ts: #controller (AbortController|null), created per request in
  #request, its signal passed to fetch, `signal.aborted` checked after
  fetch and after res.json(). #cancel() aborts it and nulls it.
- test/index.ts: fakeFetch honors init.signal; new deferredFetch() stub
  (holds each request, rejects with DOMException AbortError on abort),
  requestFor(calls, q) polls for the request by Query, respond(),
  abortError(), rejections() collector for unhandledrejection.
- New test "a late response for an older Query does not replace a newer
  one": red before the change (2 options instead of 1).
- Gotcha: tapout fails the WHOLE run on any unhandled rejection, even
  when the page listener calls preventDefault(). So item 1 could not go
  green without the AbortError catch (item 3); added it in this commit.
  Non-abort errors are rethrown (ticket 03 handles them).
- The old "a response after the element is removed does not throw"
  test asserted "should render" and went red; flipped it in the same
  commit (item 5) since no commit may have failing tests.

## Items 2 and 3: new request aborts the previous; no unhandledrejection
- Behavior already in place from item 1 (#oninput -> #cancel() aborts).
  New test "starting a new request aborts the previous one" checks the
  older signal is aborted, the newer is not, and no rejection.
- Mutation checks: commenting out the abort in #cancel() -> 4 fails;
  commenting out the AbortError return -> tapout reports the unhandled
  rejection and fails the run.
- Read "starting a new request aborts the previous" as: by the time the
  new request is sent, the previous signal is aborted. The abort
  actually happens on the new input event, before the debounce.

## Item 4: a late response after Escape, Selection, emptied input or
## focusout does not reopen the Suggestion list
- One test loops over the four close paths: Suggestions shown for 'al',
  'ali' request in flight, close, then respond to 'ali'. Asserts no
  options, closed popover, aria-expanded=false, no rejection.
- Passed on arrival (the abort from item 1 covers all four via #clear ->
  #cancel). Mutation: removing the abort fails all 12 open-state checks.

## Item 5: removing the Host element aborts its in-flight request
- Done in item 1's commit: the old test was renamed "removing the
  element aborts its in-flight request" and now uses deferredFetch,
  asserting aborted signal, no options, closed list, no rejection.
  Mutation (no abort in #cancel) fails it.

## Item 6: previous Suggestions stay while a new Query is pending
- New test "the previous Suggestions stay while a new Query is pending".
  Passed on arrival (ticket 01 already used #cancel, not #clear, in
  #oninput). Mutation: #clear() in #oninput -> 5 fails.

## Docs (no test-first: docs only)
- external-api.md: fetch options sentence, new Cancellation section,
  failure table rows for out-of-order / late / aborted, closing note.
- runtime-state.md: #controller row.
- New docs/adr/ADR-008-cancel-typeahead-requests-on-close.md + INDEX.md
  row. Scoped to cancel-on-close and the quiet AbortError; says the
  other failures (ticket 03) may amend it. GLOSSARY.md already said
  "once per settled Query" (ticket 01), no change.
- AGENTS.md: deferredFetch/requestFor usage, tapout fails the run on any
  unhandledrejection.

## For ticket 03
- #request rethrows non-abort errors from the try/catch; ticket 03
  replaces that `throw err` with clearing the Suggestions. Note tapout
  will fail the run on any unhandled rejection, so a red test for
  ticket 03 shows up as "Unhandled promise rejection" + run failure.
- deferredFetch's Deferred has `reject`, usable for network-failure
  tests; respond() only resolves with a JSON body.

## Final gate
- lint, stylelint, build clean; npm test 105/105.

---
