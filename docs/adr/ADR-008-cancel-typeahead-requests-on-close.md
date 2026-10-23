# ADR-008: Cancel Typeahead requests on close and fail quietly

**Date:** 2026-10-22

## Context

A Typeahead request was never cancelled or checked. Responses won by
arrival, so a slow response for an older Query could replace the
Suggestions for a newer one, and a response that arrived after Escape,
Selection, an emptied Query, `focusout` or removal of the Host element
reopened the Suggestion list with stale Suggestions. Debouncing
(`DEBOUNCE_MS`) made this rarer, not impossible.

## Decision

- Each Typeahead request gets its own `AbortController`, held on the
  instance, and passes its `signal` to `fetch`. At most one request is
  in flight per instance.
- One cancel path: `#cancel()` clears the debounce timer and aborts the
  in-flight request. `#clear()` calls it, so every way of closing the
  Suggestion list cancels. A new non-empty Query and
  `disconnectedCallback()` call it too.
- A new Query keeps the current Suggestions on screen until its own
  response arrives, so the list does not flicker while typing.
- After each `await` (`fetch`, then `res.json()`), the handler returns
  without rendering if its own signal is aborted. Aborting also stops
  body reading, so this check is a guard, not the only mechanism.
- An `AbortError` is caught and dropped quietly: no event, no log.
- Any other failure (network error, a non-2xx status, a body that is
  not JSON) is caught too, and clears the Suggestions, which closes the
  Suggestion list. A non-2xx body is not read, even if it has
  `actors`. No event is fired and nothing is logged; an error event
  is a possible follow-up.

## Consequences

- Only the response for the current Query can render.
- Typing during an in-flight request aborts it on every keystroke. The
  rejection is caught, so pages with error reporting see nothing.
- A failed request never leaves stale Suggestions on screen and never
  surfaces as an unhandled rejection. The user sees the Suggestion
  list close; there is no visible error state.
- Tests stub `fetch` with a version that rejects with an `AbortError`
  when its signal aborts, as the real `fetch` does.
