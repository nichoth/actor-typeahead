# External API

Sources: [`src/index.ts`](../../src/index.ts),
[`test/index.ts`](../../test/index.ts),
[ADR-005](../adr/ADR-005-typeahead-responses-are-untrusted.md).

The component makes one kind of network call, the Typeahead request.
It sends no credentials or auth headers. The only `fetch` option it sets
is `signal`, so the request can be aborted.

## Typeahead request

| Property | Value |
|----------|-------|
| Method | `GET` |
| URL | `xrpc/app.bsky.actor.searchActorsTypeahead`, resolved against the API host |
| API host | `host` attribute, default `https://public.api.bsky.app` |
| `q` | The Query, unmodified |
| `limit` | The Suggestion limit, default `5` |
| Trigger | A non-empty Query that has not changed for `DEBOUNCE_MS` (150 ms) |

Each non-empty `input` event restarts one per-instance timer, and the
request is sent when it fires. An empty Query, Escape, Selection,
`focusout` and removing the Host element all clear the timer, so no
request is sent. There is no caching.

## Cancellation

Each request gets its own `AbortController`, and at most one request is
in flight per instance. `#cancel()` clears the timer and aborts the
in-flight request. It runs on every new non-empty Query, an empty
Query, Escape, Selection, `focusout` and `disconnectedCallback()`. A
new Query keeps the current Suggestions on screen until its own
response arrives.

After `fetch` and after `res.json()`, the handler returns without
rendering if its signal was aborted. An aborted `fetch` rejects with an
`AbortError`, which is caught and dropped. See
[ADR-008](../adr/ADR-008-cancel-typeahead-requests-on-close.md).

## Response handling

The body is read with `res.json()` and narrowed by `parseActors()`.
Only `handle` (required string) and `avatar` (optional string) are
kept from each actor. Anything else in the body is ignored.

## Failure behavior

| Situation | Result |
|-----------|--------|
| HTTP error with a JSON body | `parseActors()` finds no `actors`, so the Suggestion list clears |
| Body is not JSON | `res.json()` rejects. The rejection is unhandled, and the previous Suggestions stay |
| Network failure | `fetch` rejects. Same as above |
| Responses arrive out of order | The older request was aborted when the newer Query arrived, so its response is dropped |
| Response arrives after the Query was emptied, Escape, Selection, `focusout` or removal | The request was aborted, so the response is dropped and the Suggestion list stays closed |
| Request aborted | `fetch` rejects with an `AbortError`, which is caught. No unhandled rejection |

The `res.ok` status is never checked. The non-JSON and network failure
cases above are tracked by the settled-typeahead-requests spec.
