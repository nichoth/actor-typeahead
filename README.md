# actor-typeahead

A small web component that progressively enhances an `<input>` element into an autocomplete for ATProto handles!

It works with any web stack and any JavaScript framework.

## Installation

The easiest way to install is to just copy `actor-typeahead.js` into your project and reference it in a script tag:

```html
<script type="module" src="actor-typeahead.js"></script>
```

It will automatically register the `<actor-typeahead>` tag as a custom element.

If you'd like to use a different tag, you can import the file with a query string:

```html
<script type="module" src="actor-typeahead.js?tag=some-other-tag"></script>
```

If you'd prefer to manually register the custom element, you can use the query string `?tag=none` and call the static method `define`:

<script type="module">
  import ActorTypeahead from "actor-typeahead.js?tag=none";
  ActorTypeahead.define("some-other-tag");
</script>


## Usage

Simply wrap your `<input>` with `<actor-typeahead>`:

```html
<actor-typeahead>
  <input>
</actor-typeahead>
```
