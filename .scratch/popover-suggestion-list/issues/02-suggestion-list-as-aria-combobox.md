# 02: Suggestion list as an ARIA combobox

**What to build:** Screen reader users hear the input announced as a
combobox that offers a list of Suggestions, hear whether that list is
expanded, and hear the highlighted Suggestion as they press ArrowUp and
ArrowDown. This works in every browser, with no change to layout or to
keyboard and pointer behavior.

- The component writes `role="combobox"`, `aria-autocomplete="list"`,
  `aria-controls` (the Suggestion list id), `aria-expanded` and
  `aria-activedescendant` on the authored input. `aria-activedescendant`
  is removed when nothing is highlighted. `autocomplete="off"` is set
  only when the consumer has not set `autocomplete`. Nothing else is
  written on the input, and the input element is never replaced.
- For this ticket `aria-expanded` is `"true"` exactly when there is at
  least one Suggestion. Ticket 03 ties it to the popover open state.
- The Suggestion list has `role="listbox"`. When the input has an
  associated `<label>` with an id, the listbox gets `aria-labelledby`
  pointing at it; otherwise it stays unlabelled. No hard-coded English
  label text.
- Each Suggestion is an `<li role="option">` carrying the `.suggestion`
  class, an id and `aria-selected`. The inner `<button>` is removed.
  The avatar keeps an empty `alt`; the Handle text is the option's
  accessible name.
- Ids for the Suggestion list and Suggestions use a per-instance prefix
  so several typeaheads on one page stay unique.
- `aria-selected="true"` replaces `data-active`, and the hover and
  highlight styling keys on it.
- Pointer selection finds the target Suggestion by option role. A
  pointerup inside the Suggestion list that is not on a Suggestion still
  returns focus to the input.
- Existing tests that locate Suggestions by `button` switch to the
  option role; their behavioral assertions stay as they are. The README
  markup example is updated.

**Blocked by:** 01

**Touches:** `src/index.ts` (`ActorTypeahead.render()`, `#onpointerup`,
`#onkeydown`, a new per-instance id prefix, the `row()` helper),
`src/index.css` (`.suggestion` highlight selector), `test/index.ts`
(the `results()` helper and the selectors passed to `waitFor`),
`README.md` (markup example and the `data-active` note)

**Status:** ready-for-agent

- [ ] The input has `role="combobox"` and its `aria-controls` references
      the element with `role="listbox"`
- [ ] The input's `aria-expanded` is `"true"` while Suggestions are
      shown and `"false"` after Escape, selection, or an emptied input
- [ ] After ArrowDown and ArrowUp, the input's `aria-activedescendant`
      references the option whose `aria-selected` is `"true"`, and no
      other option is selected
- [ ] With no highlighted Suggestion, the input has no
      `aria-activedescendant`
- [ ] A consumer-set `autocomplete` value on the input is preserved; an
      input without one gets `autocomplete="off"`
- [ ] When the input has a `<label>` with an id, the listbox's
      `aria-labelledby` references it
- [ ] Two instances on one page produce distinct listbox and option ids
- [ ] Pointer selection on an option still selects that Actor and fires
      `select`, and selecting inside a form still does not submit it
