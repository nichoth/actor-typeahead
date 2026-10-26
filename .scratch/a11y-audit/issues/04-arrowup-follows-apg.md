# 04: ArrowUp follows the APG combobox pattern

**What to build:** A keyboard user can reach the end of the Suggestion
list in one key, and can step back out of the Suggestion list to keep
editing their Query.

With the Suggestion list open and nothing Highlighted, ArrowUp
highlights the last Suggestion. On the first Suggestion, ArrowUp clears
the Highlighted Suggestion: no option has `aria-selected="true"` and the
Authored input loses `aria-activedescendant`, so a following Enter is
passed through and submits a surrounding form. With no Suggestions,
ArrowUp does nothing. ArrowDown, PageUp and PageDown are unchanged.

See `.scratch/a11y-audit/spec.md`.

**Blocked by:** None (can start immediately)

**Touches:** `src/index.ts` (the `ArrowUp` case in `#onkeydown`),
`test/index.ts` ("aria-activedescendant tracks the highlighted option",
"moving the Highlighted Suggestion is not announced", new ArrowUp
tests), `docs/architecture/components.md` (keyboard table)

**Status:** done

Existing tests that assume the old ArrowUp behaviour are updated, not
deleted.

- [x] With Suggestions open and nothing Highlighted, ArrowUp highlights
  the last Suggestion (checked through `aria-activedescendant` and
  `aria-selected`, as the existing `checkActive` helper does)
- [x] With the first Suggestion Highlighted, ArrowUp removes
  `aria-activedescendant` and leaves no option with
  `aria-selected="true"`
- [x] After that, Enter is not canceled (the `key()` helper returns
  true)
- [x] With no Suggestions, ArrowUp leaves the input with no
  `aria-activedescendant` and the Suggestion list closed
- [x] ArrowDown still stops at the last Suggestion ("arrow keys stop at
  the last result" keeps passing)
- [x] The keyboard table in the components page describes the new
  ArrowUp behaviour
- [x] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
