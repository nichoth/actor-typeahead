# Spec: Suggestion list as an accessible popover combobox

**Status:** ready-for-agent

## Problem Statement

The Suggestion list is an absolutely positioned element inside the
`<actor-typeahead>` host. When a consumer places the typeahead inside a
container with `overflow: hidden`, or under content with a higher
stacking context, the Suggestion list is clipped or covered. Positioning
is tied to the host's own box, so the list cannot escape it.

The component also exposes no semantics. Screen readers do not know the
input offers Suggestions, whether the Suggestion list is open, or which
Suggestion is highlighted while the user moves through it with the arrow
keys. The highlight is purely visual. Each Suggestion is a `<button>`,
which is not how assistive technology expects a combobox option to be
modelled.

## Solution

The Suggestion list becomes a `popover="manual"` element in the top
layer, positioned against the host with CSS anchor positioning, so it
can no longer be clipped or covered by the surrounding page. The input
and Suggestion list follow the ARIA combobox pattern: the input is a
combobox that reports whether the list is expanded and which Suggestion
is active, the Suggestion list is a listbox, and each Suggestion is an
option.

In browsers without anchor positioning, the component keeps today's
absolutely positioned layout. The ARIA semantics apply in every browser.

## User Stories

1. As a page author, I want the Suggestion list to render above
   containers that clip overflow, so that I can place the typeahead
   inside cards, dialogs, and scroll areas without it being cut off.
2. As a page author, I want the Suggestion list to render above content
   with a higher z-index, so that I do not have to tune stacking
   contexts around the component.
3. As a page author, I want several typeaheads on one page to each
   position their own Suggestion list, so that instances do not
   interfere with each other.
4. As a page author, I want the Suggestion list to match the width of
   the host, so that sizing the host continues to size the list as it
   does today.
5. As a user near the bottom of the viewport, I want the Suggestion list
   to open above the input when there is no room below, so that I can
   see every Suggestion.
6. As a screen reader user, I want the input announced as a combobox
   with a list of Suggestions, so that I know Suggestions are available.
7. As a screen reader user, I want to hear whether the Suggestion list
   is expanded, so that I know when Suggestions have arrived or gone
   away.
8. As a screen reader user, I want the highlighted Suggestion announced
   as I press ArrowUp and ArrowDown, so that I can pick an Actor
   without sighted feedback.
9. As a keyboard or pointer user, I want selection, Escape, PageUp and
   PageDown, and pointer selection to behave exactly as they do now, so
   that the change does not regress existing interaction.
10. As a page author who already set `autocomplete` on my input, I want
    the component to leave it alone, so that my explicit choice wins.
11. As a page author on an older browser, I want the typeahead to keep
    working with its current layout, so that the enhancement never
    breaks the baseline experience.

## Implementation Decisions

### Popover and positioning

- The Suggestion list uses `popover="manual"`, not `auto`. The component
  already owns open and close (input changes, `focusout`, Escape,
  selection, empty results). An `auto` popover would duplicate that
  logic and would close the host page's own `auto` popovers whenever
  Suggestions arrive.
- The Suggestion list is shown when there is at least one Suggestion
  and hidden when there are none. Show and hide calls are guarded on
  the current open state, so repeated renders do not throw or toggle.
- The anchor is the host element, not the authored input. This keeps
  today's width behavior and means the component writes positioning
  CSS only on its own element.
- Anchor names are scoped per host with `anchor-scope`, so every
  instance can use the same fixed anchor name in the stylesheet with no
  generated names.
- The Suggestion list sits below the host by default, with
  `position-try-fallbacks: flip-block` so it flips above when it would
  overflow the viewport. The existing 4px gap moves to the block-start
  margin so the flip mirrors it. There is no inline flip, because the
  list is exactly the anchor's width.
- The Suggestion list width is `anchor-size(width)`. Without this, a
  top-layer element shrinks to fit its content.
- The popover remains a DOM descendant of the host, so the existing
  `focusout`, `pointerdown` and `pointerup` handling on the host keeps
  working unchanged.

### Progressive enhancement and browser support

- The `popover` attribute and the anchor-based CSS are applied only when
  `CSS.supports('anchor-scope: --a')` is true. `anchor-scope` is the
  most recently shipped property in the set (Chrome 131, Firefox 147,
  Safari 26), so it gates the whole group.
- Without support, the Suggestion list keeps the current absolute
  layout and the current empty-hides-the-list rule.
- The project instructions file gains a browser support policy line:
  Baseline Newly available features are allowed when they are
  feature-detected and degrade to the pre-existing behavior.

### Combobox semantics

- The component writes these attributes on the authored input:
  `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`
  (pointing to the Suggestion list id), `aria-expanded` (tracking
  whether the list is open), and `aria-activedescendant` (pointing to
  the highlighted Suggestion's id, and removed when nothing is
  highlighted). It sets `autocomplete="off"` only when the consumer has
  not set `autocomplete`. It writes nothing else on the input, and it
  still never replaces the input element.
- The Suggestion list has `role="listbox"`. When the input has an
  associated `<label>` that has an id, the listbox is labelled with
  `aria-labelledby` pointing to it. Otherwise it stays unlabelled. The
  component does not hard-code English label text.
- Each Suggestion is an `<li role="option">` with an id and
  `aria-selected`. The inner `<button>` is removed, because
  `role="option"` makes its children presentational. The avatar image
  keeps an empty `alt`, and the Handle text is the option's accessible
  name.
- Element ids for the Suggestion list and Suggestions use a
  per-instance prefix, so `aria-controls` and `aria-activedescendant`
  stay unique when several typeaheads share a page.
- The highlighted Suggestion is marked with `aria-selected="true"`
  instead of `data-active`, and the hover and highlight styling keys on
  that attribute.
- Pointer selection finds the target Suggestion with the option role
  instead of the button element. A pointerup inside the Suggestion list
  that is not on a Suggestion still returns focus to the input.

### Naming (from the domain glossary)

- The code and public CSS API adopt the glossary terms. The `.menu`
  class becomes the Suggestion list class, the `.user` class becomes
  the Suggestion class, and the `--padding-menu` custom property is
  renamed to match the Suggestion list. JSDoc that says "dropdown" or
  "menu" says "Suggestion list" instead. This is a breaking change to
  the CSS API, accepted because the package is unpublished at 0.0.0.
- The README and the custom elements manifest docs are updated to the
  new names.

## Testing Decisions

- Tests exercise only the element's public surface: the DOM it renders
  in light DOM, the attributes it writes on the input, its open state,
  and the `select` event. They do not assert text content, CSS values,
  or private fields.
- Seam: the existing browser test suite for the `ActorTypeahead`
  element, run with tapzero through tapout. It already stubs `fetch`,
  mounts the element, and drives it with synthetic `input`, `keydown`,
  and pointer events. No new seam is needed.
- New behavior to cover:
  - The Suggestion list matches `:popover-open` exactly when there is
    at least one Suggestion, and closes on Escape, selection, and an
    emptied input.
  - The input's `aria-expanded` follows the open state.
  - After ArrowDown and ArrowUp, the input's `aria-activedescendant`
    references the Suggestion whose `aria-selected` is true.
  - The input has the combobox role and its `aria-controls` references
    the listbox.
  - A consumer-set `autocomplete` value is preserved.
  - Two instances on one page produce distinct listbox and option ids.
- Existing tests that locate Suggestions by `button` switch to the
  option role. Their behavioral assertions (request shape, keyboard
  selection, pointer selection, Escape, no form submission) stay as
  they are.
- The test browser supports anchor positioning, so the fallback path is
  not covered automatically. Multi-instance positioning and the
  flip-above behavior are not observable at this seam. Both are checked
  by hand in the example page, which gains a second typeahead.

## Out of Scope

- A live region announcing the number of Suggestions. This is optional
  in the ARIA combobox pattern and needs translatable text. It can be
  tracked as its own issue.
- Native alternatives such as `<datalist>` or a customizable `<select>`.
  They cannot render avatars or cannot wrap a free-text input.
- Popover and anchor positioning polyfills.
- `popover="hint"` and interest invokers.
- Handling out-of-order typeahead responses, debouncing, and request
  cancellation.
- Inline-axis flipping of the Suggestion list.

## Further Notes

- `popover` has been Baseline Newly available since January 2025, and
  anchor positioning since January 2026 (Firefox 147). The explicit
  `position-anchor: --name` form used here works in every shipping
  engine. Only the property's initial value differs between versions.
- The retrieved modern-web-guidance text described anchor positioning
  as unsupported in Chrome. That data was stale and the skill reported
  itself out of date. The support figures above come from current MDN
  browser-compat-data.
- The domain glossary in the repo root defines Actor, Handle,
  Suggestion, and Suggestion list. Use those terms in tickets derived
  from this spec.
