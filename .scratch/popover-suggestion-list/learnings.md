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
