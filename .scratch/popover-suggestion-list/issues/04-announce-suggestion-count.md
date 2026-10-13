# 04: Announce the number of Suggestions in a live region

**What to build:** When Suggestions arrive or change, screen reader users
hear how many Suggestions are available (for example, "5 Suggestions
available") without having to move into the Suggestion list. This was
listed as out of scope in the popover spec because it is optional in
the ARIA combobox pattern and needs translatable text.

Open questions to resolve before this is ready for an agent:

- How the announcement text is supplied. The component must not
  hard-code English; options include an attribute, a slotted template,
  or an event the consumer handles.
- Whether to announce zero results, and whether to debounce
  announcements while the user is typing.
- Where the live region lives in light DOM, and how it is visually
  hidden without leaking styles onto the authored input.

**Blocked by:** 02, 03 (needs the combobox semantics, and shares
`render()` and open-state logic)

**Touches:** `src/index.ts` (`ActorTypeahead.render()`), `src/index.css`,
`test/index.ts`, `README.md`

**Status:** needs-triage

- [ ] The host contains a polite live region, and its content changes
      when the number of Suggestions changes
- [ ] When the Suggestion list closes, the live region is emptied
- [ ] Two instances on one page each have their own live region
