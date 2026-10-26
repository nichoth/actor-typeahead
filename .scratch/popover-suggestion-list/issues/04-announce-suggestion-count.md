# 04: Announce the number of Suggestions in a live region

**What to build:** When a Typeahead request settles with Suggestions,
screen reader users hear how many Suggestions are available (for
example, "5 Suggestions available") without having to move into the
Suggestion list. This was listed as out of scope in the popover spec
because it is optional in the ARIA combobox pattern and needs
translatable text.

**Blocked by:** 02, 03, 05 (needs the combobox semantics, shares
`render()` and open-state logic, and edits the docs 05 refreshes)

**Touches:** `src/index.ts` (`ActorTypeahead.render()`, a new
`announce` property, its JSDoc), `src/index.css`, `test/index.ts`,
`README.md`, `docs/GLOSSARY.md`, `docs/architecture/public-interface.md`

**Status:** ready-for-agent

## Decisions

- **Text.** A public property `announce:(count:number) => string`
  returns the announcement for a count. It defaults to an English
  function ("1 Suggestion available", "N Suggestions available").
  Consumers replace it to translate, and handle plurals themselves. It
  is read at announce time, so setting it after connect works. JS
  property only, no attribute.
- **Zero Suggestions.** Not announced. An empty response closes the
  Suggestion list, and closing empties the live region.
- **When.** Once per settled Typeahead request that has Suggestions,
  even when the count is the same as the previous response. Typeahead
  requests are already debounced (`DEBOUNCE_MS`), so no extra debounce.
  To make screen readers re-read identical text, alternate a trailing
  no-break space (` `) between consecutive announcements.
- **Not on navigation.** `render()` runs on every arrow and Page key.
  Write the live region only from the response path (and empty it on
  close), never from a render that only moves the Highlighted
  Suggestion.
- **Placement.** One `<div role="status">` per host, created by
  `render()` and appended to the host in light DOM, outside the
  Suggestion list. A closed popover is `display: none`, so a region
  inside it would never be announced. `render()` runs on connect, so
  the region exists empty before its first write; screen readers
  often skip a region that is inserted already filled.
- **Hiding.** Class `suggestion-count`, visually hidden with the
  standard clip pattern (`position: absolute`, `width: 1px`,
  `height: 1px`, `overflow: hidden`, `clip-path: inset(50%)`,
  `white-space: nowrap`), nested under `actor-typeahead` in
  `src/index.css` so nothing applies to the Authored input.
- **Glossary.** Add "Suggestion count" to `docs/GLOSSARY.md`: the
  visually hidden live region that announces how many Suggestions a
  Typeahead request returned. The class name follows the glossary
  (see AGENTS.md conventions).

## Acceptance criteria

- [x] The host contains one polite live region (`[role="status"]`)
      outside the Suggestion list, present and empty before any Query
- [x] When a Typeahead request settles with Suggestions, the live
      region's text is the return value of `announce` for that count
- [x] A custom `announce` set on the element is called with the number
      of Suggestions, and its return value is used
- [x] A second response with the same number of Suggestions changes
      the live region's content
- [x] Moving the Highlighted Suggestion with the arrow or Page keys
      does not change the live region's content
- [x] When the Suggestion list closes (Escape, Selection, focus out,
      clearing the Query, an empty response, a failed request), the
      live region is emptied
- [x] Two instances on one page each have their own live region, and a
      response for one does not change the other's
- [x] README documents the `announce` property and shows the live
      region in the markup snippet

## Comments

**2026-10-25, triage:** Blockers 02 and 03 are done. Resolved the open
questions with the maintainer: English default with an `announce`
override, silent on zero, re-announce on every response. Added the
navigation criterion because `render()` runs on every arrow key.
Moved to `ready-for-agent`.
