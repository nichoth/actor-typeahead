# External API

Sources: [`src/index.ts`](../../src/index.ts),
[`test/index.ts`](../../test/index.ts),
[ADR-005](../adr/ADR-005-typeahead-responses-are-untrusted.md).

The component makes one kind of network call, the Typeahead request.
It sends no credentials or auth headers and uses the browser's default
`fetch` options.

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
request is sent. There is no caching, and a request that was already
sent is not cancelled.

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
| Responses arrive out of order | The last response to resolve wins, even if it is for an older Query. The debounce makes this rarer, not impossible |
| Response arrives after the Query was emptied | The Suggestion list reopens with stale Suggestions. Only a request still waiting on the debounce is dropped |

The `res.ok` status is never checked. Aborting in-flight requests and
the failure cases above are tracked by the settled-typeahead-requests
spec.
