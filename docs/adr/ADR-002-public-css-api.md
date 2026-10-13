# ADR-002: Ship a separate stylesheet with a custom property API

**Date:** 2026-10-13

## Context

With light DOM rendering ([ADR-001](ADR-001-render-into-light-dom.md))
the styles can no longer live in the component's shadow root. Page
authors need sensible defaults, a small set of documented theming
knobs, and the freedom to override anything else with ordinary CSS.

## Decision

- The stylesheet is `src/index.css`, written with CSS nesting and built
  by lightningcss into `dist/index.css` and `dist/index.min.css`,
  exported as `./css` and `./min/css`.
- Theming goes through public custom properties (`--color-background`,
  `--radius`, and so on). Each one resolves into an
  Inherited custom property (`--color-background-inherited`) that
  carries the default, and the rules read only the inherited name.
- Public class names and custom properties use the glossary's
  vocabulary. When they disagree, the CSS is renamed, not the glossary.
  The rename of `.menu`, `.user` and `--padding-menu` is a breaking
  change, accepted while the package is unpublished at 0.0.0.
- The stylesheet hides `actor-typeahead:not(:defined)` to avoid a
  flash of undefined content for this one element.

## Consequences

- Page authors can theme with a handful of variables, or override any
  rule directly, without fighting specificity inside a shadow root.
- Every class name, custom property, and `data-*` / ARIA attribute the
  stylesheet keys on is part of the public API and is documented in the
  README and the custom elements manifest.
- The inherited-property indirection means a rule must never read a
  public custom property directly, or the default is lost.
