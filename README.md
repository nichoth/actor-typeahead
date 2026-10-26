# actor-typeahead

[![tests](https://img.shields.io/github/actions/workflow/status/nichoth/actor-typeahead/nodejs.yml?style=flat-square)](https://github.com/nichoth/actor-typeahead/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/actor-typeahead?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/actor-typeahead)](https://bundlephobia.com/package/@substrate-system/actor-typeahead)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![License MPL-2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen?style=flat-square)](./LICENSE)

A small web component that progressively enhances an `<input>` element
into an autocomplete for ATProto handles. It works with any web stack and
any JavaScript framework.

This is a fork of
[Jake Lazaroff's actor-typeahead](https://tangled.org/jakelazaroff.com/actor-typeahead),
rewritten in TypeScript, and rendering in light DOM only. See
[Differences from upstream](#differences-from-upstream).

[See a live demo](https://nichoth.github.io/actor-typeahead/)

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Install](#install)
- [Example](#example)
- [API](#api)
  * [ESM](#esm)
  * [Common JS](#common-js)
  * [Attributes](#attributes)
  * [Properties](#properties)
  * [Events](#events)
- [CSS](#css)
  * [Import CSS](#import-css)
  * [Customize CSS via some variables](#customize-css-via-some-variables)
  * [Style the Suggestion list directly](#style-the-suggestion-list-directly)
  * [Avoid a flash of undefined content](#avoid-a-flash-of-undefined-content)
  * [pre-built](#pre-built)
- [Differences from upstream](#differences-from-upstream)
- [Develop](#develop)
- [License](#license)

<!-- tocstop -->

</details>

## Install

```sh
npm i -S @substrate-system/actor-typeahead
```

## Example

Wrap an `<input>` with `<actor-typeahead>`, and import the JS and CSS.

```html
<actor-typeahead>
    <input />
</actor-typeahead>
```

```js
import '@substrate-system/actor-typeahead'
import '@substrate-system/actor-typeahead/css'
```

Typing in the input shows a Suggestion list of matching accounts.
Choosing one, with the arrow keys and Enter or with the pointer, fills in
the input with the account's handle.

Enter and Escape are left alone when the component has nothing to do
with them. Enter with no highlighted Suggestion submits a surrounding
form, and Escape with the Suggestion list closed reaches a surrounding
`<dialog>`.

## API

This exposes ESM and common JS via
[package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import '@substrate-system/actor-typeahead'
```

### Common JS
```js
require('@substrate-system/actor-typeahead')
```

Importing the module registers the `<actor-typeahead>` element. Importing
it more than once is safe.

### Attributes

* `host` -- The host to send the typeahead request to. Default is
  `https://public.api.bsky.app`.
* `rows` -- The maximum number of results to show. Default is `5`.

```html
<actor-typeahead host="https://public.api.bsky.app" rows="3">
    <input />
</actor-typeahead>
```

Both are reflected as properties, so `el.rows = '3'` works too.

### Properties

* `announce` -- A function `(count:number) => string` that returns the
  text screen readers hear when a Typeahead request settles. `count` is
  the number of Suggestions, and is 0 when nothing matched the Query.
  The default is English, "No Suggestions", "1 Suggestion available" or
  "N Suggestions available". Replace it to translate; your function
  handles plurals and 0. It is read each time a request settles, so you
  can set it at any time. There is no matching attribute.

```ts
const el = document.querySelector('actor-typeahead')!
el.announce = count => {
    if (count === 0) return 'Sin sugerencias'
    return count === 1 ?
        '1 sugerencia disponible' :
        `${count} sugerencias disponibles`
}
```

A request that fails is not announced.

### Events

Events are namespaced by the tag name.

* `actor-typeahead:select` -- A result was chosen. The event's `detail` is
  `{ handle, avatar? }`.

```ts
import { ActorTypeahead } from '@substrate-system/actor-typeahead'

const el = document.querySelector('actor-typeahead')
el?.addEventListener(ActorTypeahead.event('select'), ev => {
    const { handle } = (ev as CustomEvent).detail
})

// or, the shorthand
el?.on('select', ev => { /* ... */ })
```

## CSS

### Import CSS

```js
import '@substrate-system/actor-typeahead/css'
```

Or minified:
```js
import '@substrate-system/actor-typeahead/min/css'
```

### Customize CSS via some variables

```css
actor-typeahead {
    --color-background: #fff;
    --color-border: #0002;
    --color-shadow: #000;
    --color-hover: #0001;
    --color-avatar-fallback: #0002;
    --radius: 8px;
    --padding-suggestion-list: 4px;
}
```

### Style the Suggestion list directly

The component renders into light DOM, so ordinary CSS reaches every part
of it. The Suggestion list markup is:

```html
<actor-typeahead>
    <!-- yours, never replaced; the component adds the ARIA attributes -->
    <input role="combobox" aria-autocomplete="list" aria-expanded="true"
        aria-controls="actor-typeahead-1-list"
        aria-activedescendant="actor-typeahead-1-option-0">
    <ul class="suggestion-list" id="actor-typeahead-1-list"
        role="listbox">
        <li class="suggestion" id="actor-typeahead-1-option-0"
            role="option" aria-selected="true">
            <div class="avatar"><img class="img" alt=""></div>
            <span class="handle"></span>
        </li>
    </ul>
    <!-- visually hidden, announces how many Suggestions arrived -->
    <div class="suggestion-count" role="status"></div>
</actor-typeahead>
```

`aria-selected="true"` marks the Suggestion highlighted with the
keyboard. The input also gets `autocomplete="off"` unless you set
`autocomplete` yourself. If the input has a `<label>` with an `id`, the
Suggestion list is labelled by it.

### Avoid a flash of undefined content

The stylesheet hides `actor-typeahead` until the browser has defined
it, so you do not see unstyled markup while the JS loads.

That only covers this one element. If your page uses several custom
elements, hide the whole page until they are all ready, and reveal it
once:

```html
<html class="reduce-fouce">
```

```css
html.reduce-fouce { opacity: 0; }
```

```js
await Promise.race([
    Promise.allSettled([
        customElements.whenDefined('actor-typeahead')
    ]),
    // reveal anyway after two seconds
    new Promise(resolve => { setTimeout(resolve, 2000) })
])

document.documentElement.classList.remove('reduce-fouce')
```

Keep the timeout, and add a `<noscript>` override. Without both, a
component that fails to define leaves the page blank:

```html
<noscript>
    <style>html.reduce-fouce { opacity: 1 !important; }</style>
</noscript>
```

### pre-built

This package exposes minified JS and CSS files too. Copy them to a
location that is accessible to your web server, then link to them in
HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/actor-typeahead/dist/index.min.js ./public/actor-typeahead.min.js
cp ./node_modules/@substrate-system/actor-typeahead/dist/index.min.css ./public/actor-typeahead.css
```

#### HTML
```html
<head>
    <link rel="stylesheet" href="./actor-typeahead.css">
</head>
<body>
    <!-- ... -->
    <script type="module" src="./actor-typeahead.min.js"></script>
</body>
```

## Differences from upstream

* The component renders into light DOM instead of shadow DOM.
  Style it with the class names above rather than `::part()`. The
  styles ship as a separate stylesheet, so import the CSS.
* The `?tag=` query string and `define(tag)` are gone. The tag is always
  `actor-typeahead`.
* It emits an `actor-typeahead:select` event when a result is chosen.


## Develop

```sh
npm start        # run the example at localhost:8888
npm test         # run the tests in a browser
npm run lint
npm run build
```

## License

[MPL-2.0](./LICENSE). Copyright (c) 2026 Jake Lazaroff.
