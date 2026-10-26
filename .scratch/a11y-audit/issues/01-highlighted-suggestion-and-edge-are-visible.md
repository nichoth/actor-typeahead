# 01: The Highlighted Suggestion and the Suggestion list edge are visible

**What to build:** A low vision user, a Windows High Contrast user and
a user with the mouse resting on another Suggestion can all see which
Suggestion Enter will select, and can see the edge of the Suggestion
list against the page.

The Highlighted Suggestion keeps the hover background and adds an
inset outline in `currentColor`, which has text contrast against the
Suggestion list background. Hover alone gets only the background, so a
hovered Suggestion no longer looks Highlighted. No new custom property:
the outline follows the text colour and authors override the rule
directly (ADR-002).

Under `@media (forced-colors: active)`, the Highlighted Suggestion uses
the `Highlight` and `HighlightText` system colours with
`forced-color-adjust: none`, as native listbox options do. System
colours are CSS keywords, so they need no variables.

The default `--color-border` darkens until it reaches at least 3:1
against the default `--color-background` (white). The property name
and meaning stay the same. This changes the look for every consumer who
did not set `--color-border`, so the commit body says so (auto-changelog
picks up commit messages), but it is not a breaking change and gets no
`BREAKING CHANGE:` footer.

The public CSS API changes in all four places together (see AGENTS.md):
the stylesheet, the `@cssprop` JSDoc for `--color-border` and
`--color-hover` (updated only if their meaning shifts), the README CSS
variables block, and the generated manifest.

The audit reported that the border disappears in forced colors mode.
Forced colors replaces border colours rather than removing them, so the
border probably survives and only the shadow is lost. Confirm it while
checking forced colors; change nothing unless it really disappears.

See `.scratch/a11y-audit/spec.md`.

**Blocked by:** suggestion-buttons 02 (both change the `.suggestion`
element and its styles)

**Touches:** `src/index.css` (`.suggestion` `:hover` and
`[aria-selected="true"]` rule, a new forced-colors block,
`--color-border-inherited` default), `src/index.ts` (`@cssprop` JSDoc
on `ActorTypeahead`), `README.md` (CSS variables block),
`docs/GLOSSARY.md` (Highlighted Suggestion, only if its description no
longer holds), `dist/` manifest via `npm run build-manifest` (not
committed)

**Status:** ready-for-agent

No automated tests: per the project rules, no test checks CSS. Verify
by hand on the example page.

- [x] With one Suggestion hovered and a different one Highlighted, only
  the Highlighted Suggestion shows the outline
- [x] The Highlighted Suggestion's outline is at least 3:1 against the
  default Suggestion list background
- [x] With forced-colors emulation in Chrome DevTools, the Highlighted
  Suggestion shows in the system highlight colours
- [x] With forced-colors emulation, the Suggestion list border is still
  visible (or, if it is not, a fix is added and noted)
- [x] The default `--color-border` is at least 3:1 against white, and
  the README CSS variables block shows the same value
- [x] The commit body notes the new default border colour
- [x] `npm run lint`, `npx stylelint src/*.css`, `npm test`,
  `npm run build` and `npm run build-manifest` pass
