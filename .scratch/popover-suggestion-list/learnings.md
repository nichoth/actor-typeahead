<!-- nightralph:entry ticket=popover-suggestion-list:1 attempt=1 outcome=install -->
## 2026-10-13 12:20 -- popover-suggestion-list/01 attempt 1 -- failed (install)

Install failed.
Last 40 lines of `01-rename-css-api-to-glossary-terms.install.log`:
```
npm error code ETARGET
npm error notarget No matching version found for @substrate-system/dom@^0.1.17.
npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.
npm error A complete log of this run can be found in: /Users/nick/.npm/_logs/2026-10-13T19_20_20_900Z-debug-0.log
```

---
<!-- nightralph:entry ticket=popover-suggestion-list:1 attempt=2 outcome=install -->
## 2026-10-13 12:21 -- popover-suggestion-list/01 attempt 2 -- failed (install)

Install failed.
Last 40 lines of `01-rename-css-api-to-glossary-terms.attempt2.install.log`:
```
npm error code ETARGET
npm error notarget No matching version found for @substrate-system/dom@^0.1.17.
npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.
npm error A complete log of this run can be found in: /Users/nick/.npm/_logs/2026-10-13T19_20_55_070Z-debug-0.log
```

---
<!-- nightralph:entry ticket=popover-suggestion-list:1 attempt=3 outcome=install -->
## 2026-10-13 12:22 -- popover-suggestion-list/01 attempt 3 -- failed (install)

Install failed.
Last 40 lines of `01-rename-css-api-to-glossary-terms.attempt3.install.log`:
```
npm error code ETARGET
npm error notarget No matching version found for @substrate-system/dom@^0.1.17.
npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.
npm error A complete log of this run can be found in: /Users/nick/.npm/_logs/2026-10-13T19_22_04_805Z-debug-0.log
```

---
<!-- nightralph:entry ticket=popover-suggestion-list:1 attempt=4 outcome=install -->
## 2026-10-13 12:24 -- popover-suggestion-list/01 attempt 4 -- failed (install)

Install failed.
Last 40 lines of `01-rename-css-api-to-glossary-terms.attempt4.install.log`:
```
npm error code ETARGET
npm error notarget No matching version found for @substrate-system/dom@^0.1.17.
npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.
npm error A complete log of this run can be found in: /Users/nick/.npm/_logs/2026-10-13T19_24_07_891Z-debug-0.log
```

---
<!-- nightralph:entry ticket=popover-suggestion-list:1 attempt=1 outcome=done -->
## 2026-10-13 12:36 -- popover-suggestion-list/01 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $0.58. Checked items: "The existing browser test suite passes unchanged", "No source, stylesheet or README reference to `.menu`, `.user` or `--padding-menu` remains", "`npm run lint`, `stylelint src/*.css` and `npm run build` succeed, and the built manifest lists `--padding-suggestion-list`".

### Agent notes
# Ticket 01: rename CSS API to glossary terms

Deps were already installed this attempt (node_modules/@substrate-system/dom
present), so the earlier install failure did not recur.

Implemented in one change:
- src/index.ts: JSDoc @attribute/@fires/@cssprop say Suggestion list /
  Suggestion; `#menu` -> `#suggestionList`; class `menu` ->
  `suggestion-list`; `row()` -> `suggestion()`; button class `user` ->
  `suggestion`. Markup structure (button, data-active) unchanged.
- src/index.css: `.menu` -> `.suggestion-list`, `.user` -> `.suggestion`,
  `--padding-menu(-inherited)` -> `--padding-suggestion-list(-inherited)`.
- README.md: CSS vars block, "Style the Suggestion list directly" section
  and TOC entry, intro sentence.
- AGENTS.md: conventions section.

No new tests (pure rename/docs; ticket forbids asserting class names).
Existing suite 21/21 passes unchanged. Lint, stylelint, build pass;
dist/custom-elements.json lists --padding-suggestion-list, no padding-menu.
The `rows` attribute keeps its name (public attribute, not in ticket scope).

---
<!-- nightralph:entry ticket=popover-suggestion-list:2 attempt=1 outcome=done -->
## 2026-10-13 12:40 -- popover-suggestion-list/02 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $1.22. Checked items: "The input has `role="combobox"` and its `aria-controls` references the element with `role="listbox"`", "A consumer-set `autocomplete` value on the input is preserved; an input without one gets `autocomplete="off"`", "When the input has a `<label>` with an id, the listbox's `aria-labelledby` references it", "Two instances on one page produce distinct listbox and option ids".

### Agent notes
# Ticket 02: Suggestion list as an ARIA combobox

All checklist items done, each test-first (red seen before green).

Implemented (src/index.ts):
- Suggestion is `<li class="suggestion" role="option" id aria-selected>`;
  inner button removed. data-index/data-handle moved to the li.
- Suggestion list gets `role="listbox"` and id `${prefix}-list`.
- Per-instance prefix `actor-typeahead-N` from a module counter; option
  ids `${prefix}-option-${i}`.
- render() writes on the input: role=combobox, aria-autocomplete=list,
  aria-controls, aria-expanded (= actors.length > 0, ticket 03 ties to
  popover), aria-activedescendant (removed when index has no actor),
  autocomplete=off only when absent.
- aria-labelledby on listbox = ids of input.labels that have an id
  (space-joined), removed otherwise.
- #onpointerup uses closest('[role="option"]').
- CSS: highlight keys on [aria-selected="true"]. `.suggestion` keeps
  `all: unset` + display:flex, now applied to the li.
- README markup example + note updated. AGENTS.md gained test notes.

Tests (test/index.ts): results() and waitFor use [role="option"];
added: combobox/controls, aria-expanded, activedescendant, autocomplete,
aria-labelledby, two-instance ids (verified it fails with a constant
prefix), pointerup-off-option refocus, select event on pointer select.

Reading of vague criteria: "no option selected" -> every non-highlighted
option has aria-selected="false" (always written).

---
<!-- nightralph:entry ticket=popover-suggestion-list:3 attempt=1 outcome=done -->
## 2026-10-13 12:45 -- popover-suggestion-list/03 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $1.02. Checked items: "Existing keyboard, pointer, Escape and no-form-submission tests still pass".

### Agent notes
# Ticket 03: Suggestion list in the top layer with anchor positioning

All checklist items done, test-first where a test applies.

Implemented:
- src/index.ts: module constant `ANCHORED` =
  `CSS.supports('anchor-scope: --a')`. When true the list gets
  `popover = 'manual'`. `#toggle(list, open)` in render() shows/hides,
  guarded on `:popover-open`, and returns the real open state;
  `aria-expanded` is written from that return value.
- src/index.css: host gets `anchor-name`/`anchor-scope: --actor-typeahead`.
  `.suggestion-list[popover]`: fixed, `position-anchor`, `inset: auto`,
  `top: anchor(bottom)`, `left: anchor(left)`, `margin-block-start: 4px`,
  `width: anchor-size(width)`, `position-try-fallbacks: flip-block`,
  `color: inherit` (UA popover sets CanvasText), and
  `:not(:popover-open) { display: none }` (author display:flex otherwise
  beats the UA hide rule). Fallback layout untouched.
- test/index.ts: isOpen helper; tests for open-exactly-with-Suggestions
  (incl. empty API result), closing (Escape, keyboard, pointer, emptied),
  repeated render/clear, aria-expanded == :popover-open.
- example/index.html: instance in an overflow:hidden box, one near the
  bottom of the page. AGENTS.md: browser support section.

Red/green evidence: item 1 failed before the popover existed. Items 2 and
4 were verified by sabotage (removing hidePopover, inverting
aria-expanded) and fail then. Item 3: unguarded togglePopover breaks the
suite; unguarded show/hide do NOT throw in this Chromium (repeat calls are
no-ops per current spec), so the guard itself is not separately
observable there.

Manual checks (Playwright against vite dev server, API stubbed): each
instance positions its own list at host width with a 4px gap; the clipped
one extends past its 64px container and is hit-testable; the bottom one
flips above with the 4px gap mirrored; with ANCHORED forced false: no
popover attribute, position absolute, 4px gap, hidden when empty.

Docs-only/scaffolding (example, AGENTS.md): no tests, by design.

---
<!-- nightralph:entry ticket=popover-suggestion-list:5 attempt=1 outcome=done -->
## 2026-10-25 19:56 -- popover-suggestion-list/05 attempt 1 -- done

Effort: medium. Agent exit: 0. Subagents: 0. Cost: $0.69. Checked items: "`grep -rn -E 'menu|\.user|data-active|pending rename|popover ticket' docs/GLOSSARY.md docs/architecture/` finds nothing that describes current behavior", "Every class name, custom property, ARIA attribute, private field and helper named in the four files exists in `src/index.ts` or `src/index.css`", "The DOM contract in `public-interface.md` matches what `render()` and `suggestion()` produce", "Lines stay under 80 columns, with no em dashes or arrow characters", "`git diff --stat` shows changes only under `docs/`".

### Agent notes
# Ticket 05: refresh glossary and architecture docs

Docs-only ticket: no test-first (ticket forbids doc tests), recorded here.

Changed: docs/GLOSSARY.md, docs/architecture/public-interface.md,
runtime-state.md, components.md. Source read as truth (src/index.ts,
src/index.css).

- Glossary: current class names, --padding-suggestion-list,
  aria-selected + aria-activedescendant; pending notes dropped.
- public-interface: DOM contract rewritten from render()/suggestion()
  (example ids use the actor-typeahead-1 prefix); notes on autocomplete
  default, aria-labelledby, popover only when ANCHORED, per-instance ids.
- runtime-state: #id row, #suggestionList, instances counter in intro,
  id/aria-selected in DOM table, "closed" with and without ANCHORED.
- components: ANCHORED, instances, suggestion(), Render lifecycle entry
  with #toggle(), disconnectedCallback cancels, option-not-button wording.

Reading of criteria: the grep hit "_Avoid_: menu" in GLOSSARY is the
avoid-list, not current behavior. The 80-column rule is met for prose;
the only longer lines are markdown table rows, which these files already
had, since a table row cannot wrap.

Lint and npm test (144/144) pass. No AGENTS.md learnings added: nothing
reusable beyond what AGENTS.md already says.

---
