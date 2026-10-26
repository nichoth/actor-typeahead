# Glossary

The canonical vocabulary for `@substrate-system/actor-typeahead`. The
glossary leads and the code follows: when a class name, property or
doc comment disagrees with an entry here, the code is what renames.
Decisions live in [ADRs](adr/INDEX.md), and current runtime facts live
in the [architecture inventory](architecture/INDEX.md).

Sections are grouped by who uses the word. UI names visible things.
Product is what page authors and end users say. Development is what
only contributors say.

## UI

**Host element** -- The `<actor-typeahead>` element that wraps the
Authored input and owns the Suggestion list. Not to be confused with
the API host. See
[ADR-003](adr/ADR-003-substrate-web-component-base.md).

**Authored input** -- The `<input>` the page author writes inside the
Host element. The component enhances it and never replaces it. See
[ADR-004](adr/ADR-004-enhance-the-authored-input.md).

**Suggestion list** -- The set of Suggestions shown for the current
Query, beneath the Authored input. Hidden when empty. The
`.suggestion-list` class, with `role="listbox"`, styled by the
`--padding-suggestion-list` property. Where anchor positioning is
supported it is a manual popover in the top layer. _Avoid_: menu,
dropdown, results.

**Suggestion** -- One Actor offered as a possible completion for the
current Query: an avatar and a Handle. The `.suggestion` class, an
`<li role="option">`. _Avoid_: row, result, item, user.

**Highlighted Suggestion** -- The Suggestion the user has moved to with
the arrow or Page keys, which Enter will select. At most one at a time,
and none after a new Query. Marked with `aria-selected="true"` and
referenced by the Authored input's `aria-activedescendant`. _Avoid_:
active row, selected (Selection means the user chose it).

**Suggestion count** -- The visually hidden live region that announces
how many Suggestions a Typeahead request returned. The
`.suggestion-count` class, a `<div role="status">` in the Host element,
outside the Suggestion list. Its text comes from the `announce`
property. Empty while the Suggestion list is closed, except after a
request that matched no Actors, which announces that. Not written when
only the Highlighted Suggestion moves. _Avoid_: live region,
status.

## Product

**Actor** -- An ATProto account, as returned by the Typeahead request.
Carries a Handle and, optionally, an avatar URL. _Avoid_: user,
account, profile.

**Handle** -- The human-readable, domain-style identifier of an Actor,
such as `alice.bsky.social`. _Avoid_: username, name.

**Query** -- The current value of the Authored input, sent as the `q`
parameter of the Typeahead request. An empty Query clears the
Suggestion list without a request.

**Selection** -- Choosing a Suggestion, with Enter on the Highlighted
Suggestion or with a click on a Suggestion. Writes the Handle into the
Authored input, closes the Suggestion list and fires
`actor-typeahead:select` with the Actor as `detail`.

**API host** -- The server the Typeahead request goes to, set with the
`host` attribute. Defaults to the public Bluesky AppView,
`https://public.api.bsky.app`. Not to be confused with the Host
element.

**Suggestion limit** -- The maximum number of Suggestions requested and
shown, set with the `rows` attribute. Defaults to 5.

**FOUCE (flash of undefined custom elements)** -- Unstyled markup
visible before a custom element is defined. The stylesheet hides an
undefined Host element. The page-level `reduce-fouce` class guards
pages with several components.

## Development

**Upstream** -- Jake Lazaroff's original
[actor-typeahead](https://tangled.org/jakelazaroff.com/actor-typeahead),
which this package forks. See
[ADR-001](adr/ADR-001-render-into-light-dom.md).

**Typeahead request** -- The `GET` to
`xrpc/app.bsky.actor.searchActorsTypeahead` on the API host, sent once
per settled Query: a non-empty Query that has not changed for 150 ms.
See
[ADR-005](adr/ADR-005-typeahead-responses-are-untrusted.md) and
[external-api.md](architecture/external-api.md).

**Inherited custom property** -- The internal `--<name>-inherited`
property that resolves a public custom property against its default.
Rules read only the inherited name. See
[ADR-002](adr/ADR-002-public-css-api.md).

**Custom elements manifest** -- `dist/custom-elements.json`, generated
by `npm run build-manifest` from the JSDoc tags on `ActorTypeahead`.
The JSDoc is therefore public documentation.

**ADR (Architecture Decision Record)** -- One file in `docs/adr/`
recording a cross-cutting decision, its context and its consequences.

**Spec** -- The feature design for one tracked feature, at
`.scratch/<feature>/spec.md`.

**Ticket** -- One implementation issue at
`.scratch/<feature>/issues/<NN>-<slug>.md`, with `**Status:**`,
`**Blocked by:**` and `**Touches:**` lines. See
`docs/agents/issue-tracker.md`.

**Nightralph** -- The autonomous runner that executes Tickets on
their own branches and records attempts in
`.scratch/<feature>/learnings.md` and `progress.md`.
