# 05: Refresh the glossary and architecture docs after tickets 01-03

**What to build:** Tickets 01-03 renamed the CSS API, made the
Suggestion list an ARIA combobox listbox, and moved it into a manual
popover, but `docs/GLOSSARY.md` and `docs/architecture/` still describe
the old markup and say the renames are "pending". Bring them in line
with `src/index.ts` and `src/index.css` as they are now, so ticket 04
edits current docs. Docs only: no source, CSS or test changes, and no
tests for the docs.

**Blocked by:** 01, 02, 03

**Touches:** `docs/GLOSSARY.md`, `docs/architecture/public-interface.md`,
`docs/architecture/runtime-state.md`, `docs/architecture/components.md`

**Status:** done

## Known drift

Treat the source as the truth; this list is a starting point, not the
full set.

- `docs/GLOSSARY.md`: Suggestion list, Suggestion and Highlighted
  Suggestion still name `.menu`, `--padding-menu`, `.user` and
  `data-active`, with "pending rename" and "popover ticket 01/02"
  notes. Name the current `.suggestion-list`,
  `--padding-suggestion-list`, `.suggestion` and `aria-selected`, and
  drop the pending notes.
- `docs/architecture/public-interface.md`:
  - The DOM contract shows `<ul class="menu">` with `<button
    class="user">` children. Replace it with the current markup: the
    Authored input with its combobox attributes (`role`,
    `aria-autocomplete`, `aria-controls`, `aria-expanded`,
    `aria-activedescendant`, the `autocomplete="off"` default), and
    `<ul class="suggestion-list" role="listbox" popover="manual">` with
    `<li class="suggestion" role="option" aria-selected>` children.
  - Note that the `popover` attribute is set only when `ANCHORED`, and
    that ids come from a per-instance prefix.
  - Remove the "pending rename" paragraph, and rename `--padding-menu`
    in the custom properties table.
- `docs/architecture/runtime-state.md`:
  - `#menu` is now `#suggestionList`. Add `#id`, and mention the
    module-level `instances` counter that feeds it. The intro
    currently says there are no globals.
  - In the DOM state table, `data-active` is now `aria-selected`. Add
    the `id` on each Suggestion.
  - "Closed" is no longer only `:empty`. With `ANCHORED` it is also
    the popover being hidden.
- `docs/architecture/components.md`:
  - `row()` is now `suggestion()`. Add the `ANCHORED` constant and
    `#toggle()`.
  - Disconnect now cancels the pending Typeahead request
    (`disconnectedCallback`).
  - Suggestions are `li[role="option"]`, not `type="button"`, so the
    sentence about never submitting a form needs rewording.

Leave ADRs as they are; ADR-002's mention of `.menu` is history.

## Acceptance criteria

- [x] `grep -rn -E 'menu|\.user|data-active|pending rename|popover
      ticket' docs/GLOSSARY.md docs/architecture/` finds nothing that
      describes current behavior
- [x] Every class name, custom property, ARIA attribute, private field
      and helper named in the four files exists in `src/index.ts` or
      `src/index.css`
- [x] The DOM contract in `public-interface.md` matches what `render()`
      and `suggestion()` produce
- [x] Lines stay under 80 columns, with no em dashes or arrow
      characters
- [x] `git diff --stat` shows changes only under `docs/`

## Comments

**2026-10-25, triage:** Found while triaging 04, which edits
`GLOSSARY.md` and `public-interface.md`. Runs before 04.
