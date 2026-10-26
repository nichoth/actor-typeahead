# Runtime state

Sources: [`src/index.ts`](../../src/index.ts),
[`test/index.ts`](../../test/index.ts).

All state is in memory. The component uses no storage, cookies,
IndexedDB or caches. Nothing survives a page load. The only state
shared between instances is the module-level `instances` counter,
which each new instance increments to build its `#id`. Everything
else is per instance.

## Private fields

| Field | Type | Meaning | Reset by |
|-------|------|---------|----------|
| `#id` | `string` | Per-instance id prefix, `actor-typeahead-<n>`. The Suggestion list id and every Suggestion id start with it | Never |
| `#actors` | `Actor[]` | Suggestions for the latest response. Empty means the Suggestion list is closed | Escape, Selection, empty Query, `focusout` out of the Host element |
| `#index` | `number` | Position of the Highlighted Suggestion. `-1` means none | Every new response, and every reset of `#actors` |
| `#suggestionList` | `HTMLDivElement \| null` | The Suggestion list element, created on first `render()` and reused | Never |
| `#timer` | `ReturnType<typeof setTimeout> \| undefined` | The debounce timer for the next Typeahead request. `undefined` when none is pending | Its own firing, `#cancel()` (each non-empty Query, every reset of `#actors`, Enter with nothing Highlighted, `disconnectedCallback()`) |
| `#controller` | `AbortController \| null` | Aborts the in-flight Typeahead request. `null` before the first request and after `#cancel()`. After a response renders it still holds that request's controller, which is harmless to abort | `#cancel()`, which aborts it first. A new request replaces it |

`#limit` is a getter, not stored state. It parses `rows` and falls
back to 5 when the value is not a number. Other values, including `0`
and negatives, are passed through unchecked.

## Attributes

`host` and `rows` are reflected string attributes. They are read only
when a Typeahead request is built. See
[public-interface.md](public-interface.md).

## DOM state

`render()` rebuilds the Suggestion list's children from `#actors` and
`#index`. Each Suggestion carries:

| Attribute | Value |
|-----------|-------|
| `id` | `#id`, then `-option-` and the position in `#actors` |
| `data-index` | Position in `#actors`, read back on `click` |
| `data-handle` | The Actor's Handle |
| `aria-selected` | `"true"` on the Highlighted Suggestion, `"false"` on the rest |

`render()` also writes the combobox attributes on the Authored input:
`aria-expanded` from the open state, and `aria-activedescendant` from
`#index`. See [public-interface.md](public-interface.md).

"Closed" means no Suggestions. Without `ANCHORED`, the `:empty` rule
in the stylesheet hides the Suggestion list, so "closed" and "no
children" are the same state. With `ANCHORED`, `#toggle()` also hides
the popover, and the `:not(:popover-open)` rule hides it, so closed
means the list has no children and does not match `:popover-open`.
