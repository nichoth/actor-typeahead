# Spec: Debounced, cancellable Typeahead requests

**Status:** needs-triage

## Problem Statement

Every `input` event with a non-empty Query sends a Typeahead request,
and nothing about a request is ever cancelled or checked. The failure
table in `docs/architecture/external-api.md` lists the results:

- Typing a ten-letter Handle sends ten requests.
- Responses that arrive out of order win by arrival, so a slow
  response for `al` can replace the Suggestions for `alice`.
- A response that arrives after the Query was emptied, or after
  Escape, Selection or blur, reopens the Suggestion list with stale
  Suggestions.
- A network failure or a non-JSON body rejects inside `#oninput`. The
  rejection is unhandled, so a page with error reporting (Sentry, for
  example) records an error for every dropped connection, and the
  previous Suggestions stay on screen.
- `res.ok` is never checked.

## Solution

The Host element waits for the Query to settle before it sends a
Typeahead request, keeps at most one request in flight, and applies a
response only when it belongs to the current Query. Closing the
Suggestion list for any reason cancels both the pending wait and the
in-flight request. A failed request closes the Suggestion list and
never surfaces as an unhandled rejection.

The public API does not change: no new attributes, events, or CSS.

## User Stories

1. As an end user, I want the Suggestions to match what I typed last,
   so that I am never offered results for a shorter, older Query.
2. As an end user, I want the Suggestion list to stay closed after I
   press Escape, choose a Suggestion, clear the input or move focus
   away, so that a slow response does not pop it back open.
3. As a page author, I want the component to send one request per
   pause in typing, so that a public AppView does not rate-limit my
   readers.
4. As a page author with error reporting, I want a failed Typeahead
   request to be handled inside the component, so that a flaky network
   does not fill my error tracker.

## Implementation Decisions

- **Debounce.** A module constant `DEBOUNCE_MS = 150`. Each non-empty
  `input` event restarts one per-instance timer; the Typeahead request
  is sent when it fires. Not an attribute: no consumer has asked to
  tune it, and an attribute would add to the CSS/JSDoc/README/manifest
  surface that `AGENTS.md` says must change together. Add one later if
  needed.
- **One request in flight.** Each Typeahead request gets its own
  `AbortController`, held on the instance, and passes its `signal` to
  `fetch`. Starting a new request aborts the previous one.
- **A response applies only if it is current.** After each `await`
  (`fetch`, then `res.json()`), the handler returns without rendering
  if its own signal is aborted. Aborting covers body reading too, so
  this check is a guard, not the only mechanism.
- **One cancel path.** A private `#cancel()` clears the timer and
  aborts the in-flight request. `#clear()` calls it, so an empty
  Query, Escape, Selection and focusout all cancel. A new non-empty
  Query calls `#cancel()` too, but keeps the current Suggestions on
  screen until the new response arrives, so the list does not flicker
  while typing.
- **Disconnect cancels.** `disconnectedCallback()` calls `#cancel()`.
  The base class defines `connectedCallback()` only, so this is new.
  The Suggestion list is left as is; the next Query rebuilds it.
- **Failure closes quietly.** The request body is wrapped in
  `try`/`catch`. An `AbortError` returns silently. Any other failure
  (network error, `!res.ok`, invalid JSON) clears the Suggestions,
  which closes the Suggestion list. No event is fired and nothing is
  logged; an error event is a possible follow-up, out of scope here.
- Response narrowing is unchanged (`parseActors()`, ADR-005).

## Testing Decisions

- Seam: the existing tapzero browser suite in `test/index.ts`. It
  already replaces `window.fetch`, mounts the element and drives it
  with synthetic events. No new seam.
- The fetch stub must honor `init.signal` the way the real `fetch`
  does: reject with a `DOMException` named `AbortError` when the signal
  aborts. Add a deferred variant that lets a test resolve or reject
  each request by Query.
- Tests assert only public effects: the requests the stub saw (count
  and `q`), the rendered `[role="option"]` elements, the Suggestion
  list's open state, `aria-expanded`, and `unhandledrejection` events.
  No private fields, timings beyond "after the debounce", text content
  or CSS.
- Tests that `type()` then `waitFor(OPTION)` keep working, since
  `waitFor` polls. A test that asserts no request was sent must wait
  past `DEBOUNCE_MS` before asserting, or it passes vacuously.
- Changed test: "a response after the element is removed does not
  throw" asserts that the response renders today. After this spec,
  removal aborts the request, so it asserts no rejection, no
  Suggestions and a closed list instead.

## Docs

- `docs/architecture/external-api.md`: the Trigger row, the "no
  debounce" sentence and the failure table.
- `docs/architecture/runtime-state.md`: the new timer and controller
  fields.
- `docs/GLOSSARY.md`: **Typeahead request** is sent once per settled
  Query, not once per non-empty Query.
- A new ADR records the cancel-on-close and fail-quietly decisions.

## Out of Scope

- A configurable debounce attribute.
- An error event or any user-visible error state.
- Caching responses.
- Announcing the Suggestion count (popover ticket 04).
