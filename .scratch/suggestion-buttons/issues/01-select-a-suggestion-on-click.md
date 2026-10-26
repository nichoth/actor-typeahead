# 01: Select a Suggestion on click

**What to build:** Selection with the pointer happens on `click`
instead of `pointerdown` plus `pointerup`, so screen readers in browse
mode, voice control and switch access (which dispatch a synthetic
`click` with no pointer events) can select a Suggestion. Right and
middle clicks no longer select anything, because `click` fires only for
the primary button. Suggestions stay `<li role="option">` in this
ticket; the markup change is ticket 02. This is a plain fix, not a
breaking change.

The `click` listener on the Suggestion list selects the Suggestion that
contains the event target; a click inside the Suggestion list but not
on a Suggestion does nothing. `mousedown` on the Suggestion list is
canceled, so a press or a tap never moves focus off the Authored input.
With that, the `#pressed` flag and the `pointerdown` and `pointerup`
listeners go away. `focusout` closes the Suggestion list only when
focus leaves the Host element (check `relatedTarget`), because some
assistive technology moves focus onto the element it is about to
activate. Selection still writes the Handle, focuses the Authored
input, closes the Suggestion list, cancels any pending Typeahead request
and fires `actor-typeahead:select`.

See `.scratch/suggestion-buttons/spec.md`.

**Blocked by:** None (can start immediately)

**Touches:** `src/index.ts` (`#pressed`, `#onfocusout`, `#onpointerup`,
`handleEvent`, the listeners added in `render()`), `test/index.ts`
("select with the pointer", "pointerup off a Suggestion refocuses the
input", the pointer step in "the Suggestion list closes"),
`docs/architecture/components.md` (listener table, "Pointer and focus"),
`docs/architecture/runtime-state.md` (`#pressed` row, `data-index`
row), `docs/architecture/build-and-distribution.md` (synthetic event
list), `docs/GLOSSARY.md` (Selection, if its wording names the pointer
events)

**Status:** ready-for-agent

- [ ] `click()` on a Suggestion sets the Authored input to its Handle,
  fires `actor-typeahead:select` with the Actor, and closes the
  Suggestion list
- [ ] A cancelable `mousedown` dispatched on a Suggestion is canceled
- [ ] A `focusout` from the Authored input whose `relatedTarget` is a
  Suggestion leaves the Suggestion list open, and a later `click()` on
  that Suggestion selects it
- [ ] A `focusout` whose `relatedTarget` is outside the Host element
  still closes the Suggestion list and cancels a pending Typeahead
  request (existing close-path tests keep passing)
- [ ] The "pointerup off a Suggestion refocuses the input" test is
  removed along with the behaviour, and no test dispatches
  `pointerdown` or `pointerup`
- [x] The architecture pages no longer describe the pressed flag or the
  pointer listeners
- [x] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
