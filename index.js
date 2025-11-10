const template = document.createElement("template");
template.innerHTML = `
  <slot></slot>

  <ul class="menu" part="menu"></ul>

  <style>
    :host {
      --color-background-inherited: var(--color-background, #ffffff);
      --color-border-inherited: var(--color-border, #00000022);
      --color-shadow-inherited: var(--color-shadow, #000000);
      --color-hover-inherited: var(--color-hover, #eeeeee);
      display: block;
      position: relative;
      font-family: system-ui;
    }

    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .menu {
      display: flex;
      flex-direction: column;
      position: absolute;
      left: 0;
      margin-top: 4px;
      width: 100%;
      list-style: none;
      overflow: hidden;
      background-color: var(--color-background-inherited);
      background-clip: padding-box;
      border: 1px solid var(--color-border-inherited);
      border-radius: 8px;
      box-shadow: 0 6px 6px -4px rgb(from var(--color-shadow-inherited) r g b / 20%);
      padding: 4px;
    }

    .menu:empty {
      display: none;
    }

    .user {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      width: 100%;
      height: calc(1.5rem + 6px * 2);
      border-radius: 4px;
    }

    .user:hover {
      background-color: var(--color-hover-inherited);
    }

    .avatar {
      width: 1.5rem;
      border-radius: 50%;
    }

    .handle {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
`;

const user = document.createElement("template");
user.innerHTML = `
  <li>
    <button class="user" part="user">
      <img class="avatar" part="avatar">
      <span class="handle" part="handle"></span>
    </button>
  </li>
`;

export default class ActorTypeahead extends HTMLElement {
  static tag = "actor-typeahead";

  static define(tag = this.tag) {
    this.tag = tag;

    const name = customElements.getName(this);
    if (name && name !== tag) return console.warn(`${this.name} already defined as <${name}>!`);

    const ce = customElements.get(tag);
    if (Boolean(ce) && ce !== this) return console.warn(`<${tag}> already defined as ${ce.name}!`);

    customElements.define(tag, this);
  }

  static {
    const tag = new URL(import.meta.url).searchParams.get("define") || this.tag;
    if (tag !== "false") this.define(tag);
  }

  #shadow = this.attachShadow({ mode: "closed" });

  constructor() {
    super();

    this.#shadow.append(template.cloneNode(true).content);
    this.#render([]);
    this.addEventListener("input", this);
    // this.addEventListener("focusout", this);
    this.#shadow.addEventListener("click", this);
  }

  get #rows() {
    const rows = Number.parseInt(this.getAttribute("rows"));

    if (Number.isNaN(rows)) return 5;
    return rows;
  }

  /** @param {Event} evt */
  handleEvent(evt) {
    switch (evt.type) {
      case "input":
        this.#search(evt.target.value);
        break;
      // case "focusout":
      //   this.#render([]);
      //   break;
      case "click":
        const button = evt.target.closest(".user");
        const input = this.querySelector("input");
        if (!input || !button) return;

        input.value = button.dataset.handle;
        this.#render([]);
    }
  }

  #render(actors) {
    const fragment = document.createDocumentFragment();
    for (const actor of actors) {
      const li = user.cloneNode(true).content;
      li.querySelector(".user").dataset.handle = actor.handle;
      li.querySelector(".avatar").src = actor.avatar;
      li.querySelector(".handle").textContent = actor.handle;
      fragment.append(li);
    }

    this.#shadow.querySelector(".menu").replaceChildren(...fragment.children);
  }

  /** @param {string} query */
  async #search(query) {
    if (!query) return this.#render([]);

    const host = this.getAttribute("host") ?? "https://public.api.bsky.app";
    const url = new URL("xrpc/app.bsky.actor.searchActorsTypeahead", host);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", this.getAttribute("rows") ?? 5);

    const res = await fetch(url);
    const { actors } = await res.json();
    this.#render(actors);
  }
}
