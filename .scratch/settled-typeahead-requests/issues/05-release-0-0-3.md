# 05: Release 0.0.3

**What to build:** Publish the fixes from tickets 01-04 as
`@substrate-system/actor-typeahead` 0.0.3, so that rebase.blog can
depend on it.

**Status:** ready-for-human

**Blocked by:** 01, 02, 03, 04

**Touches:** `package.json` (version), `CHANGELOG.md`, npm registry

- [ ] `npm run lint`, `npx stylelint src/*.css`, `npm test` and
      `npm run build` pass
- [ ] The example page (`npm start`) shows Suggestions for a real
      Handle, and fast typing sends one request per pause (DevTools
      network panel)
- [ ] `CHANGELOG.md` has a 0.0.3 entry
- [ ] 0.0.3 is on npm
