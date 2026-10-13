# ADR-001: Render into light DOM instead of a closed shadow root

**Date:** 2026-10-13

## Context

Upstream renders the Suggestion list into a closed shadow root, slots
the Authored input, and exposes styling hooks through `::part()` and a
handful of custom properties. Page authors cannot reach anything that
is not a part, cannot style descendants of a part, and cannot use
ordinary selectors or cascade layers against the Suggestion list. The
styles also ship inside a template string, so they cannot be
overridden, minified, or bundled separately.

## Decision

The fork renders into light DOM. `render()` creates the Suggestion
list once, appends it as a sibling of the Authored input, and only ever
replaces the list's children. The styles move to a separate stylesheet
(see [ADR-002](ADR-002-public-css-api.md)).

## Consequences

- Ordinary CSS reaches every part of the component, so page authors can
  style it without `::part()`.
- Class names and markup structure become public API. Changing them is
  a breaking change.
- Host-page CSS can now leak into the Suggestion list. The stylesheet
  resets only inside the Suggestion list (and `all: unset` on each
  Suggestion) so the Authored input keeps the page's own styles.
- There is no slot. The Authored input is a plain light DOM child, and
  events from it reach the Host element by bubbling.
- Importing the JS alone is not enough to get a styled component. Page
  authors must also import the CSS.
