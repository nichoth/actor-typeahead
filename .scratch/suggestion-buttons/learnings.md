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
<!-- nightralph:entry ticket=suggestion-buttons:2 attempt=1 outcome=done -->
## 2026-10-25 21:38 -- suggestion-buttons/02 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $0.85. Checked items: "`click()` on a Suggestion inside a `<form>` selects it and does not fire `submit` (the test fails if `type="button"` is dropped)", "Suggestions have `tabindex="-1"`, so they are not in the tab order", "Existing tests that locate Suggestions with `[role="option"]` and the Suggestion list with `[role="listbox"]` keep passing", "The README, the public interface page, the components page and the glossary describe a `div` listbox of `button` Suggestions", "The commit message has a `BREAKING CHANGE:` footer naming the markup change", "`npm run lint`, `npx stylelint src/*.css`, `npm test` and `npm run build` pass".

### Agent notes
# Ticket 02: Suggestions are buttons in a div listbox

## Implemented
- src/index.ts: Suggestion list is a `div[role=listbox]`; `suggestion()`
  builds `<button type="button" role="option" tabindex="-1">`.
- src/index.css: dropped `list-style: none` (only list-specific rule).
- test/index.ts: `results()` returns HTMLElement; new tests "a click on
  a Suggestion in a form does not submit it", "a Suggestion never
  submits a form, even unhandled", "Suggestions are not in the tab
  order".
- Docs: README and public-interface markup snippets, components.md
  (suggestion() row, Pointer note), GLOSSARY Suggestion, runtime-state
  `#suggestionList` type. AGENTS.md: note on testing default actions.

## Decisions
- Red step: switched to a bare `<button>` first (an `li` makes both new
  tests pass vacuously). Tabindex test failed (tabIndex 0).
- The click-in-form test alone does NOT fail without type="button":
  Selection removes the button during dispatch, so a disconnected
  button never submits. Added a second test that stops the click at the
  form in capture phase, so the button stays connected; it failed
  (1 submit) without `type="button"` and passes with it. Together they
  cover the checklist item.
- Tab-order test checks `tabIndex >= 0` (behaviour: a button defaults
  to 0), not the attribute string.
- Docs item: no test (docs).

---
