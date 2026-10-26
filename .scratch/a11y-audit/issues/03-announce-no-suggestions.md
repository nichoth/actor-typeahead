# 03: A Query that matches no Actors is announced

**What to build:** A screen reader user who types a Query that matches
no Actors hears that, instead of silence, so they can tell "no matches"
from "still loading".

When a Typeahead request for a non-empty Query settles with zero
Suggestions, the response path in `#request` writes `announce(0)` to
the Suggestion count. The Suggestion list stays closed. The default
English text for 0 is "No Suggestions". `announce` is documented as
also being called with 0, so a translation covers it. `render()` still
never writes the Suggestion count, any close still empties it, and a
failed request stays silent.

Note the ordering: `render()` empties the Suggestion count when there
are no Suggestions, so the zero announcement must be written after the
render in the response path, through the existing `#announce` (keeping
the alternating no-break space).

See `.scratch/a11y-audit/spec.md`.

**Blocked by:** None (can start immediately)

**Touches:** `src/index.ts` (`#request`, `defaultAnnounce`, the
`announce` property JSDoc), `test/index.ts` (beside "a settled request
announces the Suggestion count" and "a custom announce is used"),
`README.md` (`announce` section, including "Nothing is announced when
there are no Suggestions"), `docs/architecture/public-interface.md`
(`announce` row and Suggestion count paragraph), `docs/GLOSSARY.md`
(Suggestion count, which says it is empty while the list is closed)

**Status:** done

- [x] After a response with zero Actors for a non-empty Query, the
  Suggestion count equals `el.announce(0)` (ignoring the trailing
  no-break space, as existing tests do) and is not empty
- [x] After that response the Suggestion list is closed
- [x] A custom `announce` is called with 0 for that response
- [x] A failed request (network error or non-2xx) leaves the Suggestion
  count empty
- [x] Moving the Highlighted Suggestion still does not write the
  Suggestion count (existing `MutationObserver` test keeps passing)
- [x] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
  `npm run build` pass
