# 01: Debounce Typeahead requests

**What to build:** Wait `DEBOUNCE_MS` (150) after the last non-empty
`input` event before sending the Typeahead request, as described in
the spec's Debounce decision. An empty Query still clears at once,
with no request, and also cancels a pending timer.

**Status:** needs-triage

**Blocked by:** None

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`, a new
`#cancel()` that for now only clears the timer, `#clear()`),
`test/index.ts`, `docs/architecture/external-api.md`,
`docs/architecture/runtime-state.md`, `docs/GLOSSARY.md`

- [ ] Typing `a`, `al`, `ali` in quick succession sends exactly one
      Typeahead request, with `q=ali`
- [ ] Typing, then emptying the input before the debounce elapses,
      sends no request and leaves the Suggestion list closed
- [ ] Typing, then pressing Escape before the debounce elapses, sends
      no request
- [ ] Existing request-shape tests (host, rows, `q`, `limit`) still
      pass
