# 02: The Suggestion list is named from any name source on the Authored input

**What to build:** A screen reader user hears the same name for the
Suggestion list as for the Authored input, whether the page names the
input with a plain `<label for>`, with `aria-label`, or with
`aria-labelledby`. Page authors do not need to put ids on their labels.

On every render, the Suggestion list copies its name source from the
Authored input, in the order of accessible name computation:

1. the input's `aria-labelledby`, copied as is to the list's
   `aria-labelledby`;
2. the input's `aria-label`, copied to the list's `aria-label`;
3. the input's `<label>`s: when every one has an `id`, the list's
   `aria-labelledby` references them (today's behaviour); otherwise the
   list's `aria-label` is their trimmed text, joined with a space.

The list carries at most one of the two attributes, and neither when
the input has no name source. Switching source between renders removes
the stale attribute. The component never writes ids or any other
attribute onto the page's `<label>`s (ADR-004).

See `.scratch/a11y-audit/spec.md`.

**Blocked by:** suggestion-buttons 02 (it rewrites the Suggestion list
creation in `render()` and keeps `aria-labelledby`)

**Touches:** `src/index.ts` (the label block in `render()` that sets
`aria-labelledby` on the list), `test/index.ts` ("the listbox is
labelled by the input's label" and new tests beside it), `README.md`
(the paragraph on how the Suggestion list is labelled),
`docs/architecture/public-interface.md` (markup snippet and the
`aria-labelledby` paragraph), `docs/GLOSSARY.md` (Suggestion list, if
its wording names the label source)

**Status:** ready-for-agent

- [ ] When the input has `aria-labelledby`, the list's
  `aria-labelledby` equals it and the list has no `aria-label`
- [ ] When the input has `aria-label` (and no `aria-labelledby`), the
  list's `aria-label` equals it and the list has no `aria-labelledby`
- [ ] For a `<label for>` with no `id`, the list's `aria-label` equals
  the label's trimmed text, compared to the fixture's label, not a
  literal
- [ ] Labels that all have ids still give the list an
  `aria-labelledby` referencing them (existing test keeps passing)
- [ ] With no name source, the list has neither `aria-label` nor
  `aria-labelledby`
- [ ] No test or code path adds an `id` or other attribute to a page
  `<label>`
- [ ] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
