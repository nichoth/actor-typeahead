<!-- nightralph:entry ticket=suggestion-buttons:1 attempt=1 outcome=done -->
## 2026-10-25 21:32 -- suggestion-buttons/01 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $0.91. Checked items: "The architecture pages no longer describe the pressed flag or the pointer listeners", "`npm run lint`, `npx stylelint src/*.css`, `npm test` and `npm run build` pass".

### Agent notes
# Ticket 01: select a Suggestion on click

## Implemented
- src/index.ts: removed `#pressed`, `pointerdown`/`pointerup` listeners and
  `#onpointerup`. The Suggestion list listens for `mousedown` (canceled)
  and `click` (`#onclick` selects the closest `[role="option"]`, does
  nothing elsewhere). `#onfocusout` takes the FocusEvent and returns early
  when `relatedTarget` is inside the Host element.
- test/index.ts: "select with the pointer" -> "select with a click" (also
  checks focus and closed popover); new "a click off a Suggestion does
  nothing", "a press on a Suggestion keeps focus on the input", "focus
  moving to a Suggestion keeps the list open", "focus moving out of the
  host closes the list". Pointer step in "the Suggestion list closes"
  now uses click(). Removed "pointerup off a Suggestion refocuses the
  input".
- Docs: components.md (listener table, Pointer and focus), runtime-state
  (`#pressed` row gone, `#actors` reset, `data-index`),
  build-and-distribution (event list), GLOSSARY Selection.
- AGENTS.md: testing notes for click / mousedown / relatedTarget.

## Decisions
- Implementation for items 1-3 landed in one step (they share
  handleEvent). Tests for items 2 and 3 were written after; I proved
  they fail by temporarily removing the mousedown preventDefault and the
  relatedTarget check (both new tests failed), then restored the file.
- Docs item: no test (docs), per instructions.
- The form-submit-on-click test from the spec belongs to ticket 02
  (button markup); an `li` cannot submit, so it is not added here.
- README line "with the pointer" left as is: still accurate and not in
  the ticket's Touches list.

---
