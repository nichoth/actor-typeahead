<!-- nightralph:review from=30cd2658d8428715b3cbd731d7a0fcb9401c8595 to=e6211cc5f2d15a3438a9f47157208226ca211113 status=fixed -->
## 2026-10-13 12:48 -- review 30cd265..e6211cc -- 1 of 2 fixed
- [ ] showPopover() throws when a typeahead response arrives after the host was removed from the document
    src/index.ts:280 (`#toggle`, called from `render()` at the end of `#oninput`). Type "ali", then remove `<actor-typeahead>` from the page (SPA route change) before fetch resolves. `render()` re-appends the list to the detached host, `:popover-open` is false, and `showPopover()` throws InvalidStateError on a disconnected popover, so `#oninput` rejects with an unhandled error. The spec says show/hide is guarded so renders never throw; the guard should also check `list.isConnected`. Add a test that removes the element before the stubbed fetch resolves.
- [x] The "clicking a result does not submit a form" test no longer tests anything
    test/index.ts:355. Suggestions are now `<li role="option">` with no `<button>`, so `option.click()` can never submit a form, and the test passes even if submission were possible some other way, e.g. Enter on the input inside a `<form>`. Enter calls `preventDefault` in `#onkeydown`, but nothing tests that. Retarget the test to press Enter on the input inside a form while the list is open.

### Fix
- attempts: 1 of 4
- effort: medium
- agent exit code: 0
- result: merged

# Review-fix notes

## Finding 1: showPopover() throws after host removal -- done

- `src/index.ts` `#toggle`: return false when `list.isConnected` is false,
  before calling showPopover/hidePopover.
- `test/index.ts`: new test "a response after the element is removed does
  not throw". Stubs fetch with a deferred promise, types, removes the
  element, resolves. Listens for `unhandledrejection`.
- Gotcha: `waitFor` from @substrate-system/dom never resolves for a
  detached element (it watches the document), so the test polls with a
  local `sleep`. Without the guard tapout itself reports the unhandled
  rejection and fails the run.

## Finding 2: form-submission test tested nothing -- done

- Replaced "clicking a result does not submit a form" with "Enter in the
  open Suggestion list does not submit a form" in `test/index.ts`.
- Synthetic keydown never causes implicit submission, so the test models
  it: `key()` now returns the `dispatchEvent` result, and the test calls
  `form.requestSubmit()` if Enter was not canceled. Verified it fails
  when `evt.preventDefault()` is removed from the Enter case in
  `#onkeydown`, and passes with it. No source change needed.
- Added two testing gotchas to AGENTS.md.
---
