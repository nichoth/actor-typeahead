<!-- nightralph:review from=18d46bd749ced5202967e09e8593a402dc61ba25 to=49798eb28ef5371fd3ae2a088b0a9109f2dae9fc status=fixed -->
## 2026-10-25 21:51 -- review 18d46bd..49798eb -- 1 of 1 fixed
- [x] An arrow or Page key after a "No Suggestions" response erases the announcement, though the list never opened or closed
    src/index.ts:323 (`if (!this.#actors.length) count.textContent = ''`), reached from `#onkeydown` at src/index.ts:142-164, which calls `render()` for ArrowDown/ArrowUp/PageDown/PageUp even with no Suggestions. Type "zzz", let the request settle with zero Actors (the count reads `announce(0)`), then press ArrowDown or ArrowUp. The count is emptied. That breaks the spec's "With no Suggestions, ArrowUp does nothing", the AGENTS.md rule that arrow/Page keys must not write the Suggestion count, and the glossary/public-interface docs, which say only a close (Escape, Selection, focus out, clearing the Query, a failed request) empties it. No test covers a key pressed after a zero-Suggestion response; a MutationObserver test on `[role="status"]` after ArrowDown would catch it.

### Fix
- attempts: 1 of 4
- effort: medium
- agent exit code: 0
- result: merged

# Notes

## Finding: arrow/Page key after "No Suggestions" erases the announcement

Done. `#onkeydown` in src/index.ts now returns early (after
`preventDefault()`, keeping the documented "arrow and Page keys always
call preventDefault" contract) when there are no Suggestions, so
`render()` never runs and the count stays. This also stops PageUp from
setting `#index = 0` with an empty list.

Test: "a key after no Suggestions keeps the announcement" in
test/index.ts (MutationObserver on `[role="status"]`). Red before the
fix (content and writes assertions failed), green after.

Files: src/index.ts, test/index.ts, docs/architecture/components.md
(keyboard section), AGENTS.md (gotcha bullet).

Full `npm test` 243/243, `npm run lint`, `npm run build` pass.
---
