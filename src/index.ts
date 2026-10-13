/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Jake Lazaroff
 *
 * Repository: https://tangled.org/jakelazaroff.com/actor-typeahead
 */

import { WebComponent } from '@substrate-system/web-component'

// for document.querySelector
declare global {
    interface HTMLElementTagNameMap {
        'actor-typeahead':ActorTypeahead
    }
}

export interface Actor {
    handle:string;
    avatar?:string;
}

const DEFAULT_HOST = 'https://public.api.bsky.app'
const DEFAULT_ROWS = 5

/**
 * @attribute {string} [host] - The host to which to make the typeahead
 * API call.
 * @attribute {number} [rows] - The maximum number of Suggestions to
 * display in the Suggestion list.
 *
 * @fires actor-typeahead:select - A Suggestion was chosen from the
 * Suggestion list. The event `detail` is `{ handle, avatar }`.
 *
 * @cssprop --color-background - Controls the color of the Suggestion list
 * background.
 * @cssprop --color-border - Controls the color of the Suggestion list
 * border.
 * @cssprop --color-shadow - Controls the color of the Suggestion list
 * shadow.
 * @cssprop --color-hover - Controls the background color of each
 * Suggestion on hover.
 * @cssprop --color-avatar-fallback - Controls the background color of an
 * avatar circle if the image fails to load.
 * @cssprop --radius - Controls the corner radius of the Suggestion list.
 * @cssprop --padding-suggestion-list - Controls the padding of the
 * Suggestion list.
 *
 * @summary A small web component that progressively enhances an <input>
 * element into an autocomplete for ATProto handles.
 *
 * @tag actor-typeahead
 */
export class ActorTypeahead extends WebComponent.create('actor-typeahead') {
    static reflectedStringAttributes = ['host', 'rows']

    declare host:string|null
    declare rows:string|null

    #actors:Actor[] = []
    #index = -1
    #pressed = false
    #suggestionList:HTMLUListElement|null = null

    constructor () {
        super()
        this.addEventListener('input', this)
        this.addEventListener('focusout', this)
        this.addEventListener('keydown', this)
    }

    get #limit ():number {
        const rows = Number.parseInt(this.rows ?? '')
        return Number.isNaN(rows) ? DEFAULT_ROWS : rows
    }

    handleEvent (evt:Event) {
        switch (evt.type) {
            case 'input':
                this.#oninput(evt)
                break

            case 'keydown':
                if (evt instanceof KeyboardEvent) this.#onkeydown(evt)
                break

            case 'focusout':
                this.#onfocusout()
                break

            case 'pointerdown':
                this.#pressed = true
                break

            case 'pointerup':
                this.#onpointerup(evt)
                break
        }
    }

    #onkeydown (evt:KeyboardEvent) {
        const last = this.#actors.length - 1

        switch (evt.key) {
            case 'ArrowDown':
                evt.preventDefault()
                this.#index = Math.min(this.#index + 1, last)
                this.render()
                break

            case 'PageDown':
                evt.preventDefault()
                this.#index = last
                this.render()
                break

            case 'ArrowUp':
                evt.preventDefault()
                this.#index = Math.max(this.#index - 1, 0)
                this.render()
                break

            case 'PageUp':
                evt.preventDefault()
                this.#index = 0
                this.render()
                break

            case 'Escape':
                evt.preventDefault()
                this.#clear()
                break

            case 'Enter':
                evt.preventDefault()
                this.#select(this.#index)
                break
        }
    }

    async #oninput (evt:Event) {
        if (!(evt.target instanceof HTMLInputElement)) return

        const query = evt.target.value
        if (!query) {
            this.#clear()
            return
        }

        const url = new URL(
            'xrpc/app.bsky.actor.searchActorsTypeahead',
            this.host ?? DEFAULT_HOST
        )
        url.searchParams.set('q', query)
        url.searchParams.set('limit', String(this.#limit))

        const res = await fetch(url)
        const json:unknown = await res.json()
        this.#actors = parseActors(json)
        this.#index = -1
        this.render()
    }

    #onfocusout () {
        if (this.#pressed) return
        this.#clear()
    }

    #onpointerup (evt:Event) {
        this.#pressed = false

        const option = evt.target instanceof Element ?
            evt.target.closest<HTMLElement>('[role="option"]') :
            null

        if (!option) {
            this.qs('input')?.focus()
            return
        }

        this.#select(Number(option.dataset.index))
    }

    #select (index:number) {
        const actor = this.#actors[index]
        const input = this.qs('input')
        if (!actor || !input) return

        input.value = actor.handle
        input.focus()
        this.#clear()
        this.emit<Actor>('select', { detail: actor })
    }

    #clear () {
        this.#actors = []
        this.#index = -1
        this.render()
    }

    /**
     * Render into light DOM, next to the authored `<input>`. Only the
     * Suggestion list is rebuilt, so the input element, and anything the
     * consumer attached to it, is never replaced.
     */
    render () {
        if (!this.#suggestionList) {
            this.#suggestionList = document.createElement('ul')
            this.#suggestionList.className = 'suggestion-list'
            this.#suggestionList.addEventListener('pointerdown', this)
            this.#suggestionList.addEventListener('pointerup', this)
        }

        const list = this.#suggestionList
        if (list.parentNode !== this) this.append(list)

        list.replaceChildren(...this.#actors.map((actor, i) => {
            return suggestion(actor, i, i === this.#index)
        }))
    }
}

ActorTypeahead.define()

/**
 * Build one Suggestion. Values from the API go through `textContent` and
 * properties, never through `innerHTML`.
 */
function suggestion (
    actor:Actor,
    index:number,
    active:boolean
):HTMLLIElement {
    const li = document.createElement('li')
    li.className = 'suggestion'
    li.setAttribute('role', 'option')
    li.setAttribute('aria-selected', String(active))
    li.dataset.index = String(index)
    li.dataset.handle = actor.handle

    const avatar = document.createElement('div')
    avatar.className = 'avatar'

    const img = document.createElement('img')
    img.className = 'img'
    img.alt = ''
    if (actor.avatar) img.src = actor.avatar

    const handle = document.createElement('span')
    handle.className = 'handle'
    handle.textContent = actor.handle

    avatar.append(img)
    li.append(avatar, handle)

    return li
}

function parseActors (json:unknown):Actor[] {
    if (!isRecord(json) || !Array.isArray(json.actors)) return []

    return json.actors.flatMap((actor:unknown) => {
        if (!isRecord(actor) || typeof actor.handle !== 'string') return []

        return [typeof actor.avatar === 'string' ?
            { handle: actor.handle, avatar: actor.avatar } :
            { handle: actor.handle }]
    })
}

function isRecord (value:unknown):value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
