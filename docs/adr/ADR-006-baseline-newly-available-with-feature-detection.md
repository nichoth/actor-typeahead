# ADR-006: Allow Baseline Newly available features behind feature detection

**Date:** 2026-10-13

## Context

The popover spec (`.scratch/popover-suggestion-list/spec.md`) depends
on the `popover` attribute and CSS anchor positioning. `popover` has
been Baseline Newly available since January 2025, and anchor
positioning since January 2026. Restricting the component to Baseline
Widely available would rule both out for years, and the problems they
solve (clipping by `overflow: hidden`, stacking contexts) are real for
page authors today.

## Decision

Baseline Newly available features may be used when they are
feature-detected at runtime and the component falls back to its
pre-existing behavior without them. Polyfills are out of scope. The
detection gates the whole group of related features on the most
recently shipped member, for example `CSS.supports('anchor-scope: --a')`
for popover plus anchor positioning.

## Consequences

- The component can adopt platform features as they reach all engines,
  without shipping polyfill weight.
- Every such feature has two code paths, and the test browser usually
  exercises only the new one. The fallback path is checked by hand in
  the example page.
- The policy line is added to `AGENTS.md` by popover ticket 03, so
  agents working on tickets see it.
