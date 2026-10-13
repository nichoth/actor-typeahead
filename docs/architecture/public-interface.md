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

## Events

| Event | `detail` | When |
|-------|----------|------|
| `actor-typeahead:select` | `Actor` | A Selection. Bubbles and is cancelable, but cancelling has no effect |

## DOM contract

The component renders into light DOM
([ADR-001](../adr/ADR-001-render-into-light-dom.md)):

```html
<actor-typeahead>
    <input>  <!-- Authored input, never replaced -->
    <ul class="menu">
        <li>
            <button class="user" type="button"
                data-index="0" data-handle="..." data-active="true">
                <div class="avatar"><img class="img" alt=""></div>
                <span class="handle"></span>
            </button>
        </li>
    </ul>
</actor-typeahead>
```

The class names `.menu` and `.user` and the `--padding-menu` property
are pending rename to glossary terms by popover ticket 01. The markup
changes to an ARIA combobox and listbox in popover ticket 02.

## CSS custom properties

| Property | Default | Controls |
|----------|---------|----------|
| `--color-background` | `#fff` | Suggestion list background |
| `--color-border` | `#0002` | Suggestion list border |
| `--color-shadow` | `#000` | Suggestion list shadow, at 20% alpha |
| `--color-hover` | `#0001` | Hovered and Highlighted Suggestion background |
| `--color-avatar-fallback` | `#0002` | Avatar circle behind a missing image |
| `--radius` | `8px` | Suggestion list corner radius |
| `--padding-menu` | `4px` | Suggestion list padding |

Each resolves through an Inherited custom property. The stylesheet also
hides `actor-typeahead:not(:defined)`.
