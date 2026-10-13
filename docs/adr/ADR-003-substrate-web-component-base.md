# ADR-003: Build on @substrate-system/web-component with a fixed tag

**Date:** 2026-10-13

## Context

Upstream hand-rolls registration: a static `define(tag)` that accepts
a custom tag name, and a `?tag=` query string on the module URL to pick
the tag (or `none` to skip registration). It emits no events. Consumers
learn about a Selection only by reading the input value.

## Decision

`ActorTypeahead` extends
`WebComponent.create('actor-typeahead')` from
`@substrate-system/web-component`. The tag is always
`actor-typeahead`. Importing the module calls `define()`, which is a
no-op when the tag is already registered. The base class supplies
reflected string attributes (`host`, `rows`), `qs()`, and namespaced
events. A Selection emits `actor-typeahead:select` with the Actor as
`detail`.

## Consequences

- Importing the module more than once, or from more than one bundle,
  is safe.
- Page authors cannot rename the element or register it under two tags.
- Events follow the shared substrate convention: `<tag>:<type>`,
  bubbling and cancelable, available as `ActorTypeahead.event('select')`
  or via `el.on('select', ...)`.
- The component depends on one runtime package. Its `connectedCallback`
  calls `render()`, and `attributeChangedCallback` only dispatches to
  `handleChange_<name>` methods, which this component does not define.
  So changing `host` or `rows` takes effect on the next Typeahead
  request rather than immediately.
