# actor-typeahead
![tests](https://github.com/nichoth/actor-typeahead/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@substrate-system/actor-typeahead?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/actor-typeahead)](https://bundlephobia.com/package/@substrate-system/actor-typeahead)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MPL--2.0-blue?style=flat-square)](LICENSE)

A small web component that progressively enhances an `<input>` element
into an autocomplete for ATProto handles. It works with any web stack and
any JavaScript framework.

This is a fork of
[Jake Lazaroff's actor-typeahead](https://tangled.org/jakelazaroff.com/actor-typeahead),
rewritten in TypeScript to render into light DOM. See
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
    <input>
</actor-typeahead>
```

```js
import '@substrate-system/actor-typeahead'
import '@substrate-system/actor-typeahead/css'
```

Typing in the input shows a Suggestion list of matching accounts.
Choosing one, with the arrow keys and Enter or with the pointer, fills in
the input with the account's handle.

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
    <input>
</actor-typeahead>
```

Both are reflected as properties, so `el.rows = '3'` works too.

### Events

Events are namespaced by the tag name.

* `actor-typeahead:select` -- A result was chosen. The event `detail` is
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
    <input>  <!-- yours, never replaced -->
    <ul class="suggestion-list">
        <li>
            <button class="suggestion" type="button" data-active="true">
                <div class="avatar"><img class="img"></div>
                <span class="handle"></span>
            </button>
        </li>
    </ul>
</actor-typeahead>
```

`data-active="true"` marks the Suggestion selected with the keyboard.

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

* The component renders into light DOM instead of a closed shadow root.
  Style it with the class names above rather than `::part()`. The
  styles ship as a separate stylesheet, so import the CSS.
* The `?tag=` query string and `define(tag)` are gone. The tag is always
  `actor-typeahead`.
* It emits an `actor-typeahead:select` event when a result is chosen.
* The package is `@substrate-system/actor-typeahead`.

## Develop

```sh
npm start        # run the example at localhost:8888
npm test         # run the tests in a browser
npm run lint
npm run build
```

## License

[MPL-2.0](./LICENSE). Copyright (c) 2026 Jake Lazaroff.
