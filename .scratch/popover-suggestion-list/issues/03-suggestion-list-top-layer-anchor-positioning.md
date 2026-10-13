# 03: Suggestion list in the top layer with anchor positioning

**What to build:** Page authors can put the typeahead inside cards,
dialogs and scroll areas with `overflow: hidden`, or beneath content
with a higher z-index, and the Suggestion list still renders on top,
unclipped, at the host's width. Near the bottom of the viewport it opens
above the input instead. Browsers without anchor positioning keep
today's layout.

- When `CSS.supports('anchor-scope: --a')` is true, the Suggestion list
  gets `popover="manual"` and the anchor-based CSS applies. Otherwise
  it keeps the current absolute layout and the empty-hides-the-list
  rule.
- The popover is shown when there is at least one Suggestion and hidden
  when there are none. Show and hide calls are guarded on the current
  open state, so repeated renders neither throw nor toggle.
- The anchor is the host element. `anchor-scope` scopes one fixed anchor
  name per host, so no generated names are needed.
- The list sits below the host with `position-try-fallbacks: flip-block`.
  The existing 4px gap moves to the block-start margin so the flip
  mirrors it. No inline flip.
- The list width is `anchor-size(width)`.
- The popover stays a DOM descendant of the host, so the existing
  `focusout`, `pointerdown` and `pointerup` handling keeps working.
- In supporting browsers, the input's `aria-expanded` follows the
  popover open state.
- The example page gains a second typeahead, including one placed in an
  `overflow: hidden` container and one near the bottom of the viewport,
  for the manual checks below.
- `AGENTS.md` gains a browser support policy line: Baseline Newly
  available features are allowed when they are feature-detected and
  degrade to the pre-existing behavior.

Manual checks (not observable at the test seam; do them in the example
page): several instances each position their own Suggestion list; the
list flips above near the viewport bottom; the list escapes a clipping
container; with the feature detection forced false, the old layout is
used.

**Blocked by:** 02 (shares `render()` and tests that locate Suggestions
by option role)

**Touches:** `src/index.ts` (`ActorTypeahead.render()`, open-state
show/hide, feature detection), `src/index.css` (`actor-typeahead` anchor
name and `anchor-scope`, `.suggestion-list` positioning and fallback),
`test/index.ts`, `example/index.html`, `example/index.ts`, `AGENTS.md`

**Status:** done

- [x] The Suggestion list matches `:popover-open` exactly when there is
      at least one Suggestion
- [x] The Suggestion list stops matching `:popover-open` after Escape,
      after keyboard selection, after pointer selection, and after the
      input is emptied
- [x] Rendering twice while open, or clearing twice while closed, does
      not throw
- [x] The input's `aria-expanded` matches whether the Suggestion list is
      `:popover-open`
- [x] Existing keyboard, pointer, Escape and no-form-submission tests
      still pass
