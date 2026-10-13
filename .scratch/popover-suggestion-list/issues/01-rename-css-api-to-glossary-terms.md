# 01: Rename the Suggestion list and Suggestion CSS API to glossary terms

**What to build:** A behavior-preserving prefactor. The element's public
CSS API and docs adopt the domain glossary (`CONTEXT.md`) so that later
tickets are written in the final vocabulary. The `.menu` class becomes
`.suggestion-list`, the `.user` class becomes `.suggestion`, and the
`--padding-menu` custom property becomes `--padding-suggestion-list`
(along with its internal `-inherited` counterpart). JSDoc and README text
that says "dropdown", "menu", "row" or "user" for these concepts says
"Suggestion list" or "Suggestion" instead. This is a breaking change to
the CSS API, accepted because the package is unpublished at 0.0.0.

Nothing else changes: the markup structure (including the inner
`<button>` and `data-active`) stays as it is until ticket 02.

**Blocked by:** None (can start immediately)

**Touches:** `src/index.ts` (`ActorTypeahead` JSDoc `@attribute`,
`@fires`, `@cssprop` tags, the `#menu` field and `render()` class name,
the `row()` helper and its doc comment), `src/index.css` (`.menu`,
`.user`, `--padding-menu`, `--padding-menu-inherited`), `README.md`
(CSS variables block, "Style the menu directly" section and its TOC
entry), generated custom elements manifest via `npm run build-manifest`

**Status:** done

- [x] The existing browser test suite passes unchanged
- [x] No source, stylesheet or README reference to `.menu`, `.user` or
      `--padding-menu` remains
- [x] `npm run lint`, `stylelint src/*.css` and `npm run build` succeed,
      and the built manifest lists `--padding-suggestion-list`

Note: these criteria are verified by the existing suite and the build,
not by new tests. Do not add tests that assert class names or doc text.
