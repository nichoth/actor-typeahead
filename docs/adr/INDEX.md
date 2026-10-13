# Architecture Decision Records

Cross-cutting decisions for `@substrate-system/actor-typeahead`, with
their context and consequences. Feature-level design lives in specs
under `.scratch/`. Current runtime facts live in
[`docs/architecture/`](../architecture/INDEX.md). Vocabulary lives in
the [glossary](../GLOSSARY.md).

| # | Decision | Date |
|---|----------|------|
| [ADR-001](ADR-001-render-into-light-dom.md) | Render into light DOM instead of a closed shadow root | 2026-10-13 |
| [ADR-002](ADR-002-public-css-api.md) | Ship a separate stylesheet with a custom property API | 2026-10-13 |
| [ADR-003](ADR-003-substrate-web-component-base.md) | Build on @substrate-system/web-component with a fixed tag | 2026-10-13 |
| [ADR-004](ADR-004-enhance-the-authored-input.md) | Progressively enhance the Authored input, never replace it | 2026-10-13 |
| [ADR-005](ADR-005-typeahead-responses-are-untrusted.md) | Treat Typeahead request responses as untrusted data | 2026-10-13 |
| [ADR-006](ADR-006-baseline-newly-available-with-feature-detection.md) | Allow Baseline Newly available features behind feature detection | 2026-10-13 |
| [ADR-007](ADR-007-suggestion-list-manual-popover.md) | Suggestion list as a manual popover anchored to the Host element | 2026-10-13 |
