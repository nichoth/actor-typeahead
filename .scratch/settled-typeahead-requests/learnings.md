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
