# ADR-005: Treat Typeahead request responses as untrusted data

**Date:** 2026-10-13

## Context

The API host is configurable through the `host` attribute, and even the
default public AppView returns user-controlled strings (Handles, avatar
URLs). Upstream clones templates whose static markup is set with
`innerHTML`, then fills in the values. The TypeScript rewrite needed an
explicit rule so that later edits do not introduce an HTML injection
path.

## Decision

- The response body is parsed as `unknown` and narrowed by
  `parseActors()`. An actor without a string `handle` is dropped, and
  `avatar` is kept only when it is a string. A body without an `actors`
  array yields no Suggestions.
- Response values reach the DOM only through `textContent`, element
  properties (`img.src`) and `dataset`, never through `innerHTML` or
  HTML string templates.

## Consequences

- A malicious or malformed API host can at worst show wrong Handles or
  broken avatars. It cannot inject markup or script into the page.
- New fields from the API are ignored until `parseActors()` and the
  `Actor` type are extended to admit them.
- `avatar` URLs are not otherwise validated, so the page's CSP
  `img-src` governs which avatar hosts can load.
