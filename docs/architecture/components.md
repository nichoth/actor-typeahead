# Components

Sources: [`src/index.ts`](../../src/index.ts),
[`src/index.css`](../../src/index.css),
[`package.json`](../../package.json).

## Modules

| Unit | Location | Role |
|------|----------|------|
| `ActorTypeahead` | `src/index.ts` | The Host element class, created by `WebComponent.create('actor-typeahead')` ([ADR-003](../adr/ADR-003-substrate-web-component-base.md)) |
| `ActorTypeahead.define()` | `src/index.ts`, module scope | Registers the tag as an import side effect. A no-op if already registered |
| `ANCHORED` | `src/index.ts`, module-private | `true` when `CSS.supports('anchor-scope: --a')`. Gates the `popover` attribute and the anchored layout |
| `instances` | `src/index.ts`, module-private | Counter that gives each instance its id prefix, `#id` |
| `suggestion()` | `src/index.ts`, module-private | Builds one Suggestion, an `li[role="option"]`, from an Actor |
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
  creates the Suggestion list, with `popover="manual"` when
  `ANCHORED`. Each call re-appends it if it is not a child of the Host
  element.
- **Render.** `render()` rebuilds the Suggestions, then calls
  `#toggle()` to show or hide the popover. `#toggle()` is guarded on
  `:popover-open`, does nothing without `ANCHORED`, and reports closed
  for a disconnected list. Its result becomes `aria-expanded` on the
  Authored input.
- **Attribute change.** `host` and `rows` are read when the next
  Typeahead request is built. Nothing re-renders on change.
- **Disconnect.** `disconnectedCallback` calls `#cancel()`, which
  clears the debounce timer and aborts the in-flight Typeahead request.
  The Suggestion list is left as is. Listeners live on the element's
  own nodes, so none need removing.

## Keyboard

Arrow and Page keys always call `preventDefault()`. Enter and Escape
call it only when the component acts on them, so with nothing to do
they keep their usual effect: Enter submits a surrounding form and
Escape closes a surrounding `<dialog>`.

| Key | Effect |
|-----|--------|
| ArrowDown | Highlight the next Suggestion, stopping at the last |
| ArrowUp | Highlight the previous Suggestion. With nothing Highlighted, highlight the last; on the first, clear the Highlighted Suggestion so Enter is passed through |
| PageDown / PageUp | Highlight the last / first Suggestion |
| Escape | Clear the Suggestion list and cancel a pending Typeahead request. Prevented only when the Suggestion list is open |
| Enter | Select the Highlighted Suggestion. Prevented only when one is highlighted; otherwise passed through, and a pending Typeahead request is cancelled while the Suggestions stay |

## Pointer and focus

`pointerdown` on the Suggestion list sets a pressed flag, so the
`focusout` caused by the press does not clear the list. `pointerup`
clears the flag, then selects the Suggestion under the pointer, or
returns focus to the Authored input when the pointer is not on a
Suggestion, found with `closest('[role="option"]')`. A Suggestion is
an `li[role="option"]`, not a button, so a press on it never submits a
form.

`pointerup` is bound only on the Suggestion list. A press that starts
on the list and is released outside it leaves the pressed flag set,
and the next `focusout` does not clear the list.
