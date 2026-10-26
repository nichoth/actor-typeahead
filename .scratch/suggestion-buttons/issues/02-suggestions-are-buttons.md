# 02: Suggestions are buttons in a div listbox

**What to build:** Each Suggestion becomes a native `<button
type="button" role="option" tabindex="-1">`, a direct child of a
Suggestion list that is now a `<div role="listbox">` instead of a
`<ul>`. Voice control and switch access then see a real actionable
element, a click never submits a surrounding `<form>`, and Tab still
leaves the Authored input instead of stopping on each Suggestion.

The Suggestion list keeps its class, id, popover behaviour and
`aria-labelledby`. A Suggestion keeps its class, per-instance id,
`aria-selected`, `data-index`, `data-handle`, and its avatar and Handle
children; API values still go through `textContent` and properties
(ADR-005). The `.suggestion` rule already starts from `all: unset`;
only rules that depended on list or list item markup change (for
example `list-style`). The public CSS API (classes and custom
properties) does not change.

This is a breaking change to the documented markup. The commit carries
a `BREAKING CHANGE:` footer so auto-changelog records it.

See `.scratch/suggestion-buttons/spec.md`, including the note that a
future change should not drop either the button or the option role.

**Blocked by:** 01

**Touches:** `src/index.ts` (Suggestion list creation in `render()`,
the Suggestion builder near the bottom of the file), `src/index.css`
(`.suggestion-list` rules that assume a `ul`), `test/index.ts`,
`README.md` (markup snippet), `docs/architecture/public-interface.md`
(markup snippet), `docs/architecture/components.md` (the note that a
Suggestion is an `li` and not a button), `docs/GLOSSARY.md`
(Suggestion entry)

**Status:** done

- [x] `click()` on a Suggestion inside a `<form>` selects it and does
  not fire `submit` (the test fails if `type="button"` is dropped)
- [x] Suggestions have `tabindex="-1"`, so they are not in the tab
  order
- [x] Existing tests that locate Suggestions with `[role="option"]` and
  the Suggestion list with `[role="listbox"]` keep passing
- [x] The README, the public interface page, the components page and
  the glossary describe a `div` listbox of `button` Suggestions
- [x] The commit message has a `BREAKING CHANGE:` footer naming the
  markup change
- [x] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
