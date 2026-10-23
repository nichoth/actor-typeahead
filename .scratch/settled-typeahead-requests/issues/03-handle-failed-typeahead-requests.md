# 03: Handle failed Typeahead requests

**What to build:** Catch every failure of a Typeahead request inside
the component, per the spec's "Failure closes quietly" decision. An
`AbortError` returns silently; a network error, a non-2xx status or an
invalid JSON body clears the Suggestions.

**Status:** needs-triage

**Blocked by:** 02 (the abort path must exist to tell `AbortError`
apart from a real failure)

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`),
`test/index.ts`, `docs/architecture/external-api.md` (failure table),
the ADR from ticket 02

- [ ] A `fetch` that rejects with a network error raises no
      `unhandledrejection` and leaves the Suggestion list closed
- [ ] A response with a non-2xx status renders no Suggestions, even
      when its body contains an `actors` array
- [ ] A 200 response whose body is not JSON raises no
      `unhandledrejection` and leaves the Suggestion list closed
- [ ] After a failed request, the next Query renders its Suggestions
      normally
- [ ] An aborted request raises no `unhandledrejection`
