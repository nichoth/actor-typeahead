# 04: Enter and Escape pass through when they have nothing to do

**What to build:** `#onkeydown` calls `preventDefault()` on Enter and
Escape unconditionally. Inside a `<form>`, Enter therefore never
submits, even with the Suggestion list closed, so a user who types a
full Handle and presses Enter gets nothing. Inside a `<dialog>`, Escape
never closes the dialog. Cancel each key only when the component acts
on it:

- Enter: only when there is a Highlighted Suggestion. Otherwise the
  event is left alone, so the form submits as it would without the
  component.
- Escape: only when the Suggestion list is open. With the list
  closed, Escape still calls `#clear()`, so a pending Typeahead
  request is cancelled (ticket 01); it just does not call
  `preventDefault()`.

Arrow and Page keys are unchanged. This is not in the spec's
Implementation Decisions; it was found while designing the rebase.blog
integration, whose follow form relies on Enter to submit.

**Status:** ready-for-agent

**Blocked by:** 01 (shares `#onkeydown` and `#clear()` with the cancel
path; can run in parallel with 02 and 03 if the runner allows)

**Touches:** `src/index.ts` (`ActorTypeahead#onkeydown`),
`test/index.ts`, `docs/GLOSSARY.md` (**Selection** if wording changes),
`README.md` (keyboard behavior)

- [ ] In a `<form>`, Enter with the Suggestion list closed is not
      canceled, so `form.requestSubmit()` in the test's
      implicit-submit pattern runs once (see `AGENTS.md`)
- [ ] In a `<form>`, Enter with the Suggestion list open but no
      Highlighted Suggestion is not canceled
- [ ] Enter with a Highlighted Suggestion is still canceled and
      selects it (the existing "does not submit a form" test still
      passes)
- [ ] Escape with the Suggestion list closed is not canceled
- [ ] Escape with the Suggestion list closed, before the debounce
      elapses, is not canceled and still sends no Typeahead request
- [x] Escape with the Suggestion list open is canceled and closes it
