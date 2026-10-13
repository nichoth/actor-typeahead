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
| Trigger | Every `input` event with a non-empty Query |

There is no debounce, no caching, and no request cancellation.

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
| Responses arrive out of order | The last response to resolve wins, even if it is for an older Query |
| Response arrives after the Query was emptied | The Suggestion list reopens with stale Suggestions |

The `res.ok` status is never checked. Out-of-order handling,
debouncing and cancellation are out of scope for the popover spec and
not yet tracked by a Ticket.
