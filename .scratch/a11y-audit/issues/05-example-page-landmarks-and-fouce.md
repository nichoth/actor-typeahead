# 05: The example page has landmarks, a heading and a fail-safe FOUCE guard

**What to build:** A developer reading the example page sees correct
usage that passes axe, so the page does not hide component issues
behind its own.

The page content goes inside `<main>` with one `<h1>`; the existing
`<h2>` sections stay under it. The `reduce-fouce` class is removed even
when the page script throws, so the page is never left blank. The
labels keep no ids, so the example exercises the label-text fallback
for the Suggestion list name (ticket 02). The clipping container and
the near-the-bottom instance stay, since they exist to check the
popover by hand.

See `.scratch/a11y-audit/spec.md`.

**Blocked by:** 02 (without it, axe's `aria-input-field-name` rule
flags the unnamed listbox in the open state, because the example labels
have no ids)

**Touches:** `example/index.html`, `example/index.ts` (the FOUCE block
at the bottom)

**Status:** ready-for-agent

No automated tests: per the project rules, docs and the example page
are not tested. Verify by hand with the dev server, and stop the server
afterwards.

- [ ] All visible page content is inside `<main>`, and the page has
  exactly one `<h1>`
- [ ] With an error thrown in the page script before the FOUCE block,
  the page still becomes visible
- [ ] The example `<label>`s have no `id`
- [ ] An axe run on the example page reports no violations at rest,
  with the Suggestion list open, and with a Suggestion Highlighted
- [ ] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
