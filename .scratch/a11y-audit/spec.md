# Spec: Fix the a11y audit findings

**Status:** ready-for-agent

## Problem Statement

A WCAG 2.1 AA audit (axe in the three states of the example page, at
rest, open and Highlighted, plus a manual review against the APG
combobox pattern) found these problems. Click activation, the most
serious one, is covered by `.scratch/suggestion-buttons/spec.md`. The
rest:

- The Highlighted Suggestion is shown only by a background of `#0001`,
  about 1.1:1 against the default Suggestion list background. Low
  vision users cannot see which Suggestion Enter will select (WCAG
  1.4.11).
- In forced colors mode (Windows High Contrast) that background is
  removed, so nothing shows which Suggestion is Highlighted (WCAG
  1.4.11, 2.4.7).
- Hover and the Highlighted Suggestion share one style. With the mouse
  resting on one Suggestion and the keyboard on another, two
  Suggestions look Highlighted.
- The default Suggestion list border is `#0002`, about 1.2:1, so the
  edge of the popup is hard to see (WCAG 1.4.11).
- The Suggestion list usually has no accessible name. It is named only
  from `<label>`s that already have an `id`. A plain `<label for>`,
  or `aria-label` or `aria-labelledby` on the Authored input, names
  nothing (WCAG 4.1.2).
- When a Typeahead request returns no Suggestions, screen reader users
  hear nothing, so they cannot tell "no matches" from "still loading"
  (WCAG 4.1.3).
- ArrowUp with nothing Highlighted moves to the first Suggestion, and
  ArrowUp on the first Suggestion stays there. The APG pattern moves to
  the last Suggestion, and back to the Authored input, respectively.
- The example page has no `<main>` and no `<h1>`, so all of its content
  sits outside landmarks. Its `reduce-fouce` class leaves the whole page
  blank if a script throws before removing it.

## Solution

The Highlighted Suggestion gets a cue that does not depend on a
background colour: it stays visible at 3:1 against the Suggestion list,
in forced colors mode, and next to a hovered Suggestion. The default
border reaches 3:1. The Suggestion list takes its accessible name from
whatever names the Authored input. A request that finds nothing
announces that. ArrowUp follows the APG pattern. The example page gets
landmarks, a heading, and a fail-safe for its FOUCE guard.

## User Stories

1. As a low vision keyboard user, I want the Highlighted Suggestion to
   stand out clearly, so that I know which Actor Enter will select.
2. As a Windows High Contrast user, I want the Highlighted Suggestion
   shown in my system highlight colours, so that I can see it at all.
3. As a mouse user who also uses the keyboard, I want a hovered
   Suggestion to look different from the Highlighted Suggestion, so
   that I know which one Enter will select.
4. As a low vision user, I want the edge of the Suggestion list to be
   visible, so that I can tell the popup apart from the page beneath
   it.
5. As a screen reader user, I want the Suggestion list to have the same
   name as the Authored input, so that I know what the list of options
   is for.
6. As a page author, I want the Suggestion list named from a plain
   `<label for>`, or from `aria-label` or `aria-labelledby` on the
   Authored input, so that I do not have to add ids to my labels.
7. As a screen reader user, I want to hear when a Query matches no
   Actors, so that I do not wait for Suggestions that will not come.
8. As a page author who translates the component, I want the
   no-Suggestions announcement to go through `announce`, so that my
   translation covers it.
9. As a keyboard user, I want ArrowUp with nothing Highlighted to go to
   the last Suggestion, so that I can reach the end of the Suggestion
   list in one key.
10. As a keyboard user, I want ArrowUp on the first Suggestion to clear
    the Highlighted Suggestion, so that I can go back to editing my
    Query and Enter submits the form again.
11. As a developer reading the example page, I want it to pass axe, so
    that it shows correct usage and does not hide component issues
    behind its own.

## Implementation Decisions

- Highlighted Suggestion style. The Highlighted Suggestion keeps the
  hover background and adds an inset outline in `currentColor`, which
  has text contrast against the Suggestion list background. Hover
  alone gets only the background. This needs no new custom property:
  the outline follows the text colour, and authors can override the
  rule directly (ADR-002).
- Forced colors. Under `@media (forced-colors: active)`, the
  Highlighted Suggestion uses the `Highlight` and `HighlightText`
  system colours with `forced-color-adjust: none`, as native listbox
  options do. System colours are CSS keywords, so they need no
  variables.
- Border. The default `--color-border` darkens until it reaches at
  least 3:1 against the default `--color-background` (white). The
  value changes in the stylesheet and the README CSS variables block.
  The property name and meaning stay the same. This changes the look
  for every consumer who did not set `--color-border`, so the changelog
  notes it, but it is not a breaking change.
- Listbox name. On every render, the Suggestion list copies its name
  source from the Authored input, in the order of accessible name
  computation:
  1. the input's `aria-labelledby`, copied as is to the list's
     `aria-labelledby`;
  2. the input's `aria-label`, copied to the list's `aria-label`;
  3. the input's `<label>`s: when every one has an `id`, the list's
     `aria-labelledby` references them (today's behaviour); otherwise
     the list's `aria-label` is their trimmed text, joined with a
     space.
  The list carries at most one of the two attributes, and neither when
  the input has no name source. The component never writes ids or any
  other attribute onto the page's `<label>`s, consistent with ADR-004.
- No-Suggestions announcement. When a Typeahead request for a
  non-empty Query settles with zero Suggestions, the response path
  writes `announce(0)` to the Suggestion count. The default English
  text for 0 is "No Suggestions". `announce` is documented as also
  being called with 0. `render()` still never writes the Suggestion
  count, and any close still empties it. A failed request stays silent.
- ArrowUp. With the Suggestion list open and nothing Highlighted,
  ArrowUp highlights the last Suggestion. On the first Suggestion,
  ArrowUp clears the Highlighted Suggestion: no option has
  `aria-selected="true"` and the Authored input loses
  `aria-activedescendant`. ArrowDown, PageUp and PageDown are unchanged.
  With no Suggestions, ArrowUp does nothing.
- Example page. Content goes inside `<main>` with one `<h1>`. The
  `reduce-fouce` class is removed even when the page script throws. The
  labels keep no ids, so the example exercises the label-text fallback.
- Public API surface. The stylesheet changes in the `.suggestion` rule,
  a forced-colors block, and the `--color-border` default. The JSDoc
  `@cssprop` text for `--color-border` and `--color-hover` stays
  accurate and is updated if the meaning shifts. The README CSS
  variables block and the generated manifest follow (see AGENTS.md).
  The glossary's Highlighted Suggestion and Suggestion count entries
  are updated if their descriptions no longer hold.

## Testing Decisions

- A good test drives the Host element like a page, through DOM events
  on the Authored input, and asserts observable behaviour: attributes
  that assistive technology reads, the Suggestion count, focus and
  events. Per the project rules, no test checks CSS or hard-coded text.
- The only automated seam is the existing browser test suite (tapzero
  run by tapout) with a stubbed `fetch`. No new seam is needed.
- Behaviour tests:
  - Listbox name: one test per name source. The list's
    `aria-labelledby` matches the input's `aria-labelledby`. The list's
    `aria-label` matches the input's `aria-label`. For a `<label for>`
    with no id, the list's `aria-label` matches the label's trimmed
    text, compared to the fixture, not to a literal. Labels that all
    have ids keep today's test. With no name source, the list has
    neither attribute.
  - No Suggestions: after a response with zero Actors for a non-empty
    Query, the Suggestion count equals `el.announce(0)` and is not
    empty, and the Suggestion list is closed. A custom `announce`
    receives 0. A failed request leaves the Suggestion count empty.
  - ArrowUp: with nothing Highlighted, it highlights the last
    Suggestion (checked through `aria-activedescendant` and
    `aria-selected`, as the existing helper does). On the first
    Suggestion, it removes `aria-activedescendant`, and a following
    Enter is not canceled (the `key()` helper returns true).
  - Existing tests that assume the old ArrowUp behaviour are updated,
    not deleted.
- Not automated: the Highlighted Suggestion style, forced colors, the
  border contrast and the example page. Verify by hand with Chrome
  DevTools forced-colors emulation, a contrast check on the default
  colours, and an axe run on the example page at rest, open and
  Highlighted, with no violations.
- Prior art: "aria-activedescendant tracks the highlighted option",
  "the listbox is labelled by the input's label", "a settled request
  announces the Suggestion count" and "a custom announce is used" in
  the browser suite.

## Out of Scope

- Making pointer hover move the Highlighted Suggestion.
- Alt+ArrowDown to open the Suggestion list, and ArrowDown wrapping
  from the last Suggestion to the first.
- Announcing a close or a Selection.
- A tooltip for truncated Handles, and the cursor style on Suggestions.
- The example page's clipping container cutting off its input at high
  zoom; that container exists to demonstrate the popover.
- Click activation, which is in `.scratch/suggestion-buttons/spec.md`.

## Further Notes

- Land this after `.scratch/suggestion-buttons/spec.md`. Both change
  the `.suggestion` element and its styles.
- The audit reported that the border disappears in forced colors mode.
  Forced colors replaces border colours rather than removing them, so
  the border probably survives and only the shadow is lost. Confirm
  while checking forced colors; no change is planned unless it does
  disappear.
- Audit findings that passed or needed no change: target size (36px
  rows), no motion, and `alt=""` on the decorative avatar.
