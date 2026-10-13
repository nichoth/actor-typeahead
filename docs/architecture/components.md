# Components

Sources: [`src/index.ts`](../../src/index.ts),
[`src/index.css`](../../src/index.css),
[`package.json`](../../package.json).

## Modules

| Unit | Location | Role |
|------|----------|------|
| `ActorTypeahead` | `src/index.ts` | The Host element class, created by `WebComponent.create('actor-typeahead')` ([ADR-003](../adr/ADR-003-substrate-web-component-base.md)) |
| `ActorTypeahead.define()` | `src/index.ts`, module scope | Registers the tag as an import side effect. A no-op if already registered |
| `row()` | `src/index.ts`, module-private | Builds one Suggestion element from an Actor |
| `parseActors()`, `isRecord()` | `src/index.ts`, module-private | Narrow the untrusted response body to `Actor[]` ([ADR-005](../adr/ADR-005-typeahead-responses-are-untrusted.md)) |
| Stylesheet | `src/index.css` | Default look and the custom property API ([ADR-002](../adr/ADR-002-public-css-api.md)) |

The only runtime dependency is `@substrate-system/web-component`. It
provides reflected attributes, `qs()`, `emit()`, `on()` and
`event()`, and a `connectedCallback` that calls `render()`.

## Listeners

Every listener is the element itself, dispatched through
`handleEvent()`.

| Target | Events | Bound in |
|--------|--------|----------|
| Host element | `input`, `keydown`, `focusout` | `constructor` |
| Suggestion list | `pointerdown`, `pointerup` | `render()`, when the list is first created |

Host listeners rely on events bubbling from the Authored input
([ADR-004](../adr/ADR-004-enhance-the-authored-input.md)).

## Lifecycle

- **Connect.** `connectedCallback` calls `render()`. The first call
  creates the Suggestion list. Each call re-appends it if it is not a
  child of the Host element.
- **Attribute change.** `host` and `rows` are read when the next
  Typeahead request is built. Nothing re-renders on change.
- **Disconnect.** No cleanup. Listeners live on the element's own
  nodes, and in-flight requests are not cancelled.

## Keyboard

All handled keys call `preventDefault()`, whether or not the
Suggestion list is open.

| Key | Effect |
|-----|--------|
| ArrowDown | Highlight the next Suggestion, stopping at the last |
| ArrowUp | Highlight the previous Suggestion, stopping at the first |
| PageDown / PageUp | Highlight the last / first Suggestion |
| Escape | Clear the Suggestion list |
| Enter | Select the Highlighted Suggestion. A no-op when none is highlighted |

Because Enter is always prevented, pressing Enter in the Authored
input never submits a surrounding form, even with no Suggestions.

## Pointer and focus

`pointerdown` on the Suggestion list sets a pressed flag, so the
`focusout` caused by the press does not clear the list. `pointerup`
clears the flag, then selects the Suggestion under the pointer, or
returns focus to the Authored input when the pointer is not on a
Suggestion. Each Suggestion is a `type="button"` so a press never
submits a form.

`pointerup` is bound only on the Suggestion list. A press that starts
on the list and is released outside it leaves the pressed flag set,
and the next `focusout` does not clear the list.
