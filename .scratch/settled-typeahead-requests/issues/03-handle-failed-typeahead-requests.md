# 03: Handle failed Typeahead requests

**What to build:** Catch every non-abort failure of a Typeahead
request inside the component, per the spec's "Failure closes quietly"
decision. A network error, a non-2xx status or an invalid JSON body
clears the Suggestions, which closes the Suggestion list. Ticket 02
already returns silently on an `AbortError`; keep that path.

**Status:** ready-for-agent

**Blocked by:** 02 (extends the same `try`/`catch` in `#oninput`)

**Touches:** `src/index.ts` (`ActorTypeahead#oninput`),
`test/index.ts`, `docs/architecture/external-api.md` (failure table),
the ADR from ticket 02

- [ ] A `fetch` that rejects with a network error raises no
      `unhandledrejection` and leaves the Suggestion list closed
- [ ] A response with a non-2xx status renders no Suggestions, even
      when its body contains an `actors` array
- [ ] A 200 response whose body is not JSON raises no
      `unhandledrejection` and leaves the Suggestion list closed
- [ ] With a previous Query's Suggestions open, a failed request
      closes the Suggestion list
- [ ] After a failed request, the next Query renders its Suggestions
      normally
