# Runtime state

Sources: [`src/index.ts`](../../src/index.ts),
[`test/index.ts`](../../test/index.ts).

All state is in memory and per instance. The component uses no
storage, cookies, IndexedDB, caches or globals beyond the custom
element registry. Nothing survives a page load, and nothing is shared
between instances.

## Private fields

| Field | Type | Meaning | Reset by |
|-------|------|---------|----------|
| `#actors` | `Actor[]` | Suggestions for the latest response. Empty means the Suggestion list is closed | Escape, Selection, empty Query, `focusout` |
| `#index` | `number` | Position of the Highlighted Suggestion. `-1` means none | Every new response, and every reset of `#actors` |
| `#pressed` | `boolean` | A pointer press on the Suggestion list is in progress | `pointerup` on the Suggestion list |
| `#menu` | `HTMLUListElement \| null` | The Suggestion list element, created on first `render()` and reused | Never |
| `#timer` | `ReturnType<typeof setTimeout> \| undefined` | The debounce timer for the next Typeahead request. `undefined` when none is pending | Its own firing, `#cancel()` (each non-empty Query, every reset of `#actors`, `disconnectedCallback()`) |

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
| `data-index` | Position in `#actors`, read back on `pointerup` |
| `data-handle` | The Actor's Handle |
| `data-active` | `"true"` on the Highlighted Suggestion only |

The Suggestion list is hidden by the `:empty` rule in the stylesheet,
so "closed" and "no children" are the same state.
