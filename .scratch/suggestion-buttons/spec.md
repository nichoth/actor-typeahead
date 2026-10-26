# Spec: Suggestions are buttons, selected on click

**Status:** ready-for-agent

## Problem Statement

A Suggestion is an `<li role="option">`, and Selection with the pointer
listens for `pointerdown` and `pointerup` on the Suggestion list. Screen
readers in browse mode, voice control ("click jay.bsky.team") and
switch access activate an element by dispatching a synthetic `click`
with no pointer events. For those users, activating a Suggestion does
nothing: the a11y audit called `click()` on an open Suggestion and the
Authored input kept its old value. Only arrow keys plus Enter work.

`pointerup` is also the wrong event for pointer users. It fires for
right and middle buttons, and at the end of a touch that started
elsewhere, so it can select a Suggestion the user did not mean to
choose.

## Solution

Each Suggestion becomes a native `<button>` that keeps the option role,
inside a Suggestion list that is still a listbox. Selection with the
pointer happens on `click`, which every input method and every assistive
technology produces. The combobox pattern does not change: focus stays
on the Authored input, the arrow and Page keys move the Highlighted
Suggestion, and Enter selects it.

## User Stories

1. As a screen reader user in browse mode, I want activating a
   Suggestion to select it, so that I can choose an Actor without
   switching to focus mode and the arrow keys.
2. As a voice control user, I want "click" plus a Handle to select that
   Suggestion, so that I can choose an Actor by speaking.
3. As a switch access user, I want activating a Suggestion to select
   it, so that the component works with my scanning software.
4. As a mouse user, I want a right or middle click on a Suggestion to
   leave the Suggestion list alone, so that I do not select an Actor by
   accident.
5. As a touch user, I want tapping a Suggestion to select it, so that
   the component works on my phone as it does today.
6. As a page author with the typeahead inside a `<form>`, I want
   clicking a Suggestion to never submit the form, so that choosing an
   Actor does not send a half-finished form.
7. As a keyboard user, I want Tab to leave the Authored input rather
   than stop on each Suggestion, so that the Suggestion list does not
   trap me or add tab stops.
8. As a page author who styles the component with its public classes,
   I want `.suggestion-list` and `.suggestion` to keep working, so that
   my theme survives the change.

## Implementation Decisions

- The Suggestion list becomes a `<div role="listbox">` instead of a
  `<ul>`. A `<ul>` may only contain `<li>`, and keeping `<li
  role="none">` wrappers would add markup with no benefit. Its class,
  id, popover behaviour and `aria-labelledby` are unchanged.
- Each Suggestion is a `<button type="button" role="option"
  tabindex="-1">`, a direct child of the Suggestion list. HTML-ARIA
  allows the option role on a button. `type="button"` stops it from
  submitting a surrounding form. `tabindex="-1"` keeps it out of the
  tab order, because the combobox pattern keeps focus on the Authored
  input.
- A Suggestion keeps its class, its per-instance id, `aria-selected`
  for the Highlighted Suggestion, its `data-index` and `data-handle`,
  and its avatar and Handle children. Values from the API still go
  through `textContent` and properties
  (ADR-005).
- Selection with the pointer listens for `click` on the Suggestion
  list and selects the Suggestion that contains the event target. A
  click inside the Suggestion list but not on a Suggestion does
  nothing.
- `mousedown` on the Suggestion list is canceled, so a mouse press or a
  tap never moves focus off the Authored input. The `focusout` that a
  press used to cause no longer happens, so the pressed flag and the
  `pointerdown` and `pointerup` listeners are removed.
- `focusout` closes the Suggestion list only when focus leaves the
  Host element. Some assistive technology moves focus onto the element
  it is about to activate. Focus moving from the Authored input to a
  Suggestion must not close the list before the `click` arrives. Focus
  leaving a Suggestion for somewhere outside the Host element still
  closes it.
- Selection, from Enter or from a click, still writes the Handle,
  focuses the Authored input, closes the Suggestion list, cancels any
  pending Typeahead request and fires `actor-typeahead:select`.
- The stylesheet keeps `.suggestion` and `.suggestion-list`. The
  `.suggestion` rule already starts from `all: unset`, which strips the
  button's native styles. Only rules that depended on list or list item
  markup change.
- This is a breaking change to the documented markup (`ul` and `li`
  become `div` and `button`). The commit carries a `BREAKING CHANGE:`
  footer so auto-changelog records it. The public CSS API (classes and
  custom properties) does not change.
- The documentation follows the code: the README markup snippet, the
  public interface, components and runtime state pages of the
  architecture inventory, and the Suggestion entry in the glossary,
  which names the element.

## Testing Decisions

- A good test drives the Host element the way a page does, by
  dispatching DOM events on the Authored input and the Suggestions,
  and asserts what a page can observe: the input value, the
  `actor-typeahead:select` event, whether the Suggestion list is open,
  focus, and form submission. It does not assert on class names, CSS,
  or text content.
- The only seam is the existing browser test suite (tapzero run by
  tapout), which mounts the Host element and stubs `fetch`. No new seam
  is needed.
- Tests locate Suggestions with `[role="option"]` and the Suggestion
  list with `[role="listbox"]`, so most tests need no change.
- New or rewritten tests:
  - `click()` on a Suggestion selects it: the input gets the Handle,
    `actor-typeahead:select` fires with the Actor, and the Suggestion
    list closes. This replaces the pointer selection test.
  - `click()` on a Suggestion inside a `<form>` does not fire `submit`.
    A real `click()` on a submit button does submit, so this fails if
    `type="button"` is dropped.
  - A cancelable `mousedown` dispatched on a Suggestion is canceled.
    This is the observable contract that a press keeps focus on the
    Authored input. Synthetic mouse events do not move focus, so the
    test cannot check focus directly.
  - A `focusout` from the Authored input whose `relatedTarget` is a
    Suggestion leaves the Suggestion list open, and a later `click()`
    on that Suggestion selects it.
  - A `focusout` whose `relatedTarget` is outside the Host element
    still closes the Suggestion list and cancels a pending Typeahead
    request (existing close-path tests cover this; keep them passing).
  - Suggestions have `tabindex="-1"`. This is behaviour, not markup:
    it is what keeps them out of the tab order.
- The "pointerup off a Suggestion refocuses the input" test is removed
  along with the behaviour it covered.
- Prior art: the existing "select with the pointer", "Enter in the open
  Suggestion list does not submit a form" and close-path tests in the
  browser suite.

## Out of Scope

- Making pointer hover move the Highlighted Suggestion.
- Separating the hover style from the Highlighted Suggestion style, and
  the other a11y audit findings. Those are in
  `.scratch/a11y-audit/spec.md`.
- Any change to keyboard behaviour.

## Further Notes

- Suggestions were `<button>`s once already. The popover work
  (`.scratch/popover-suggestion-list/spec.md`) replaced them with `<li
  role="option">` because a plain button is not a combobox option.
  That fixed the semantics but lost native activation. A button with
  the option role keeps both, so a future change should not drop
  either half.
- The a11y audit findings spec changes the `.suggestion` styles, so it
  should land after this one to avoid conflicts.
