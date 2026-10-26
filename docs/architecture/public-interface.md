# Public interface

Sources: [`src/index.ts`](../../src/index.ts),
[`src/index.css`](../../src/index.css),
[`README.md`](../../README.md),
[ADR-002](../adr/ADR-002-public-css-api.md).

Everything here is part of the published contract. The JSDoc on
`ActorTypeahead` feeds the Custom elements manifest, so it is
documentation too.

## JS exports

| Export | Kind |
|--------|------|
| `ActorTypeahead` | Class. Also mapped to `'actor-typeahead'` in `HTMLElementTagNameMap` |
| `Actor` | Type: `{ handle:string; avatar?:string }` |

## Attributes and properties

| Attribute | Property | Default | Meaning |
|-----------|----------|---------|---------|
| `host` | `host` | `https://public.api.bsky.app` | API host |
| `rows` | `rows` | `5` | Suggestion limit |

Both are reflected strings. Setting the property to `null` removes the
attribute.

| Property | Type | Default | Meaning |
|----------|------|---------|---------|
| `announce` | `(count:number) => string` | English, "N Suggestions available", or "No Suggestions" for 0 | Suggestion count text |

`announce` is a JS property with no attribute. It is called when a
Typeahead request settles, with 0 when no Actor matched the Query, and
read at that time, so it can be set after connect. A failed request
does not call it.

## Events

| Event | `detail` | When |
|-------|----------|------|
| `actor-typeahead:select` | `Actor` | A Selection. Bubbles and is cancelable, but cancelling has no effect |

## DOM contract

The component renders into light DOM
([ADR-001](../adr/ADR-001-render-into-light-dom.md)):

```html
<actor-typeahead>
    <!-- Authored input, never replaced -->
    <input role="combobox" aria-autocomplete="list"
        autocomplete="off"
        aria-controls="actor-typeahead-1-list"
        aria-expanded="true"
        aria-activedescendant="actor-typeahead-1-option-0">
    <ul class="suggestion-list" id="actor-typeahead-1-list"
        role="listbox" popover="manual" aria-labelledby="...">
        <li class="suggestion" id="actor-typeahead-1-option-0"
            role="option" aria-selected="true"
            data-index="0" data-handle="...">
            <div class="avatar"><img class="img" alt=""></div>
            <span class="handle"></span>
        </li>
    </ul>
    <div class="suggestion-count" role="status"></div>
</actor-typeahead>
```

`render()` writes only the attributes shown on the Authored input.
`autocomplete="off"` is set only when the page did not set
`autocomplete`. `aria-expanded` is `"true"` while the Suggestion list
is open. `aria-activedescendant` names the Highlighted Suggestion, and
is removed when nothing is Highlighted. Every Suggestion has
`aria-selected`, `"true"` only on the Highlighted one.

`aria-labelledby` on the Suggestion list lists the ids of the Authored
input's `<label>`s that have one, and is absent when none do. The
`popover` attribute is set only when `ANCHORED` (the browser supports
`anchor-scope`). Ids come from a per-instance prefix,
`actor-typeahead-<n>`, so several instances on a page never collide.

The Suggestion count is created empty on connect, outside the
Suggestion list, because a closed popover is `display: none` and a
region inside it would never be read. Each settled Typeahead request
writes `announce(count)` into it, including `announce(0)` when there
are no Suggestions, with a trailing no-break space on every other
write so an identical count is read again. Closing the Suggestion list
by Escape, Selection, focus out, clearing the Query or a failed
request empties it.

## CSS custom properties

| Property | Default | Controls |
|----------|---------|----------|
| `--color-background` | `#fff` | Suggestion list background |
| `--color-border` | `#0002` | Suggestion list border |
| `--color-shadow` | `#000` | Suggestion list shadow, at 20% alpha |
| `--color-hover` | `#0001` | Hovered and Highlighted Suggestion background |
| `--color-avatar-fallback` | `#0002` | Avatar circle behind a missing image |
| `--radius` | `8px` | Suggestion list corner radius |
| `--padding-suggestion-list` | `4px` | Suggestion list padding |

Each resolves through an Inherited custom property. The stylesheet also
hides `actor-typeahead:not(:defined)`.
