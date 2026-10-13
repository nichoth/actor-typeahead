# ADR-007: Suggestion list as a manual popover anchored to the Host element

**Date:** 2026-10-13

## Context

The Suggestion list is absolutely positioned inside the Host element,
so a container with `overflow: hidden`, or content in a higher
stacking context, clips or covers it. The top layer solves this, but
there are two popover modes and two candidate anchors (the Host element
or the Authored input). The full design is in
`.scratch/popover-suggestion-list/spec.md`. Implementation is tracked
by popover ticket 03.

## Decision

- The Suggestion list uses `popover="manual"`, not `auto`. The
  component already owns open and close (input changes, `focusout`,
  Escape, Selection, empty results). An `auto` popover would duplicate
  that logic and would light-dismiss the host page's own `auto`
  popovers whenever Suggestions arrive.
- The anchor is the Host element, not the Authored input, so the list
  keeps the host's width (`anchor-size(width)`) and the component
  writes positioning CSS only on its own element.
- `anchor-scope` scopes one fixed anchor name per Host element, so no
  generated anchor names are needed for multiple instances.
- The list flips above with `position-try-fallbacks: flip-block` and
  never flips inline.
- The popover stays a DOM descendant of the Host element, so the
  existing `focusout` and pointer handling keep working.
- All of this is gated by feature detection per
  [ADR-006](ADR-006-baseline-newly-available-with-feature-detection.md).

## Consequences

- Page authors can place the typeahead inside cards, dialogs and
  scroll areas without tuning `overflow` or `z-index`.
- Show and hide must be guarded on the current open state, because
  calling `showPopover()` on an open popover throws.
- Until ticket 03 lands, the runtime still uses the absolute layout
  described in `docs/architecture/`.
