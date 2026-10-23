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

// how long the Query must stay unchanged before a Typeahead request
const DEBOUNCE_MS = 150

// The Suggestion list is a top-layer popover, positioned against the host
// with CSS anchor positioning. `anchor-scope` shipped last of that set, so
// it gates the group. Without it, the old absolute layout is used.
const ANCHORED = typeof CSS !== 'undefined' &&
    CSS.supports('anchor-scope: --a')

// counts instances, so each one gets unique element ids
let instances = 0

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

    #id = `actor-typeahead-${++instances}`
    #actors:Actor[] = []
    #index = -1
    #pressed = false
    #suggestionList:HTMLUListElement|null = null
    #timer:ReturnType<typeof setTimeout>|undefined

    constructor () {
        super()
        this.addEventListener('input', this)
        this.addEventListener('focusout', this)
        this.addEventListener('keydown', this)
    }

    /**
     * Stop any pending Typeahead request. The Suggestion list is left as
     * is; the next Query rebuilds it.
     */
    disconnectedCallback () {
        this.#cancel()
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

    #oninput (evt:Event) {
        if (!(evt.target instanceof HTMLInputElement)) return

        const query = evt.target.value
        if (!query) {
            this.#clear()
            return
        }

        // keep the current Suggestions on screen until the new response
        this.#cancel()
        this.#timer = setTimeout(() => this.#request(query), DEBOUNCE_MS)
    }

    async #request (query:string) {
        this.#timer = undefined
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

    /**
     * Stop any pending Typeahead request.
     */
    #cancel () {
        clearTimeout(this.#timer)
        this.#timer = undefined
    }

    #clear () {
        this.#cancel()
        this.#actors = []
        this.#index = -1
        this.render()
    }

    /**
     * Render into light DOM, next to the authored `<input>`. Only the
     * Suggestion list is rebuilt, so the input element, and anything the
     * consumer attached to it, is never replaced. On the input, only the
     * ARIA combobox attributes are written, plus `autocomplete="off"`
     * when the page did not set `autocomplete`.
     */
    render () {
        if (!this.#suggestionList) {
            this.#suggestionList = document.createElement('ul')
            this.#suggestionList.className = 'suggestion-list'
            this.#suggestionList.id = `${this.#id}-list`
            this.#suggestionList.setAttribute('role', 'listbox')
            if (ANCHORED) this.#suggestionList.popover = 'manual'
            this.#suggestionList.addEventListener('pointerdown', this)
            this.#suggestionList.addEventListener('pointerup', this)
        }

        const list = this.#suggestionList
        if (list.parentNode !== this) this.append(list)

        list.replaceChildren(...this.#actors.map((actor, i) => {
            const option = suggestion(actor, i, i === this.#index)
            option.id = this.#optionId(i)
            return option
        }))

        const open = this.#toggle(list, this.#actors.length > 0)

        const input = this.qs('input')
        if (input) {
            input.setAttribute('role', 'combobox')
            input.setAttribute('aria-autocomplete', 'list')
            if (!input.hasAttribute('autocomplete')) {
                input.setAttribute('autocomplete', 'off')
            }
            input.setAttribute('aria-controls', list.id)
            input.setAttribute('aria-expanded', String(open))

            const labels = [...(input.labels ?? [])]
                .map(label => label.id)
                .filter(Boolean)
            if (labels.length) {
                list.setAttribute('aria-labelledby', labels.join(' '))
            } else {
                list.removeAttribute('aria-labelledby')
            }

            if (this.#actors[this.#index]) {
                input.setAttribute(
                    'aria-activedescendant',
                    this.#optionId(this.#index)
                )
            } else {
                input.removeAttribute('aria-activedescendant')
            }
        }
    }

    /**
     * Show or hide the Suggestion list popover, guarded on its current
     * state so repeated renders neither throw nor toggle. A disconnected
     * popover cannot be shown, e.g. when a response arrives after the host
     * was removed. Returns whether the Suggestion list is open.
     */
    #toggle (list:HTMLElement, open:boolean):boolean {
        if (!ANCHORED) return open
        if (!list.isConnected) return false

        const isOpen = list.matches(':popover-open')
        if (open && !isOpen) list.showPopover()
        if (!open && isOpen) list.hidePopover()
        return list.matches(':popover-open')
    }

    #optionId (index:number):string {
        return `${this.#id}-option-${index}`
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
