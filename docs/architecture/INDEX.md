# Architecture inventory

Current runtime facts for `@substrate-system/actor-typeahead`: what
exists, where it lives, and its operational contract. Rationale lives
in [ADRs](../adr/INDEX.md), feature design in specs under `.scratch/`,
and vocabulary in the [glossary](../GLOSSARY.md).

The package is one custom element, implemented in a single module and
stylesheet, with no server and no persistent state.

| Category | File | Covers |
|----------|------|--------|
| Components | [components.md](components.md) | The module, the element class, helpers, listeners, lifecycle, keyboard and pointer handling |
| Runtime state | [runtime-state.md](runtime-state.md) | Per-instance in-memory state and the DOM state derived from it |
| External API | [external-api.md](external-api.md) | The Typeahead request, response parsing, failure behavior |
| Public interface | [public-interface.md](public-interface.md) | Attributes, properties, events, DOM contract, CSS API, JS exports |
| Build and distribution | [build-and-distribution.md](build-and-distribution.md) | Package exports, build outputs, tests, CI, demo deploy |
