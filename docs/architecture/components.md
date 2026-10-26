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
| `suggestion()` | `src/index.ts`, module-private | Builds one Suggestion, a `button[role="option"]`, from an Actor |
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
| Suggestion list | `mousedown`, `click` | `render()`, when the list is first created |

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
Escape closes a surrounding `<dialog>`. With no Suggestions, arrow
and Page keys do nothing else, so they leave the Suggestion count as
it is.

| Key | Effect |
|-----|--------|
| ArrowDown | Highlight the next Suggestion, stopping at the last |
| ArrowUp | Highlight the previous Suggestion. With nothing Highlighted, highlight the last; on the first, clear the Highlighted Suggestion so Enter is passed through |
| PageDown / PageUp | Highlight the last / first Suggestion |
| Escape | Clear the Suggestion list and cancel a pending Typeahead request. Prevented only when the Suggestion list is open |
| Enter | Select the Highlighted Suggestion. Prevented only when one is highlighted; otherwise passed through, and a pending Typeahead request is cancelled while the Suggestions stay |

## Pointer and focus

`click` on the Suggestion list selects the Suggestion that contains
the event target, found with `closest('[role="option"]')`. A click
inside the list but not on a Suggestion does nothing. `click` fires
for every input method, including the synthetic click that screen
readers in browse mode, voice control and switch access send with no
pointer events, and only for the primary button. A Suggestion is a
`<button type="button" role="option" tabindex="-1">`: a native button,
so every input method can activate it, with the option role, so it is
still a combobox option. Keep both halves. `type="button"` keeps a
click from submitting a surrounding form, and `tabindex="-1"` keeps it
out of the tab order, because focus stays on the Authored input. The
Suggestion list is a `div[role="listbox"]`, since a `ul` may only
contain `li`.

`mousedown` on the Suggestion list is canceled, so a press or a tap
never moves focus off the Authored input.

`focusout` clears the Suggestion list only when its `relatedTarget` is
outside the Host element. Some assistive technology focuses a
Suggestion before it sends the click, and that move must not close
the list. Focus leaving a Suggestion for somewhere outside the Host
element still closes it.
