# ADR-004: Progressively enhance the Authored input, never replace it

**Date:** 2026-10-13

## Context

The component wraps an `<input>` the page author already wrote. That
input may carry a `name`, an `id` a `<label>` points at, validation
attributes, framework bindings, or listeners. Without JavaScript, or
before the element is defined, the page must still have a working text
input.

## Decision

- The Authored input is never created, cloned, or replaced by the
  component. `render()` touches only the Suggestion list.
- The component listens on the Host element for `input`, `keydown` and
  `focusout`, which bubble from the Authored input, rather than binding
  to the input directly.
- On Selection the component writes only `value` and moves focus to the
  input. Attributes it may add in future (for example the ARIA combobox
  attributes in the popover spec) are enumerated and must not overwrite
  a value the page author set, such as `autocomplete`.

## Consequences

- Forms, labels and framework bindings keep working, and a page without
  JavaScript still has a plain input.
- The component tolerates the input being any descendant, but it finds
  it with `qs('input')`, so a Host element must wrap exactly one input.
- Writing `value` programmatically does not fire an `input` event, so
  frameworks that track the value through `input` events must listen
  for `actor-typeahead:select` instead.
