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
<!-- nightralph:review from=e6211cc5f2d15a3438a9f47157208226ca211113 to=0e15cd6b8e5563021fcdf50d47c76c129cb81852 status=fixed -->
## 2026-10-25 20:09 -- review e6211cc..0e15cd6 -- 0 of 3 fixed
- [ ] The test suite runs within about 1s of tapout's 20s whole-run timeout, so it will flake on slower CI
    package.json:30 (`tapout --timeout 20000`). Locally `npm test` takes 18.9s wall time for 178 assertions. Each debounced `type()` adds ~150ms+, and CI runs under xvfb on a shared runner, so a slightly slower run fails with "Tests timed out" even though no assertion failed. AGENTS.md says to raise the timeout when the suite grows past it; it is already at the edge. Raise it (e.g. 60000) or cut redundant DEBOUNCE sleeps.
- [ ] Focusout and Selection have no pending-debounce test, which the AGENTS.md close-path contract requires
    test/index.ts:784-815 cover emptying, Escape, removal and Enter (test/index.ts:943) before the debounce, and test/index.ts:591 covers all four close paths with a request in flight. There is no test for focusout or Selection while the debounce timer is pending, e.g. type "al", respond, type "ali", then dispatch `focusout` (or ArrowDown + Enter) and sleep past DEBOUNCE: nothing asserts that no request for "ali" is sent and that the list stays closed. If `#onfocusout` or `#select` stopped calling `#clear()`/`#cancel()`, the timer would fire and reopen the list, and no test would fail.
- [ ] `@substrate-system/input` was added as a devDependency but nothing imports it
    package.json:52. `grep -rn "substrate-system/input"` outside node_modules matches only package.json, in src, test and the example alike. It is an unused install; remove it, or use it where it was meant to go.

### Fix
- attempts: 1 of 4
- effort: medium
- agent exit code: 0
- result: merged

# Notes

## Finding 2: focusout/Selection pending-debounce test -- done
- Added test 'focusout and Selection before the debounce send no request'
  in test/index.ts (after the removal-before-debounce test).
- Verified red by temporarily removing `#cancel()` from `#clear()` in
  src/index.ts: all six new assertions failed. Restored the source.
- The test answers any stray 'ali' request after the debounce, so the
  "closed" assertion fails if a request was sent (a never-settled
  deferred request alone would leave the list closed).

## Finding 1: tapout timeout -- done
- package.json `test`: `--timeout 20000` -> `--timeout 60000`.
- No unit test possible for a config value; evidence is the measured
  wall time: 19.7-20.0s for 184 assertions after adding finding 2's
  test, i.e. at the old limit. Did not cut DEBOUNCE sleeps (AGENTS.md
  prescribes raising the timeout).

## Finding 3: unused @substrate-system/input -- done
- grep outside node_modules matched only package.json; removed the
  devDependency line. No lockfile exists (installs use
  --no-package-lock), so nothing else to sync. The package is still in
  node_modules until the next install; harmless.

## Other
- Committed findings separately; added an AGENTS.md bullet about
  vacuous "stays closed" checks with deferredFetch().
- Final gate: lint, stylelint, build, npm test (184/184) all pass.
---
