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

    /**
     * Returns the text announced when a Typeahead request settles with
     * `count` Suggestions, including 0 when nothing matched the Query.
     * Defaults to English. Replace it to translate; the replacement
     * handles plurals and 0. Read at announce time, so it can be set
     * after connect.
     */
    announce:(count:number) => string = defaultAnnounce

    #id = `actor-typeahead-${++instances}`
    #actors:Actor[] = []
    #index = -1
    #suggestionList:HTMLDivElement|null = null
    #suggestionCount:HTMLDivElement|null = null
    #nbsp = false
    #timer:ReturnType<typeof setTimeout>|undefined
    #controller:AbortController|null = null

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
                if (evt instanceof FocusEvent) this.#onfocusout(evt)
                break

            case 'mousedown':
                // a press or a tap keeps focus on the Authored input
                evt.preventDefault()
                break

            case 'click':
                this.#onclick(evt)
                break
        }
    }

    #onkeydown (evt:KeyboardEvent) {
        const last = this.#actors.length - 1
        const moves = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']
        // with no Suggestions there is nothing to move to, and a render
        // would empty a "No Suggestions" announcement
        if (last < 0 && moves.includes(evt.key)) {
            evt.preventDefault()
            return
        }

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
                // wrap from nothing Highlighted to the last Suggestion,
                // and from the first back to nothing (the APG pattern)
                this.#index = this.#index < 0 ? last : this.#index - 1
                this.render()
                break

            case 'PageUp':
                evt.preventDefault()
                this.#index = 0
                this.render()
                break

            case 'Escape':
                // with the list closed, let a dialog close; still cancel
                // any pending Typeahead request
                if (this.#actors.length) evt.preventDefault()
                this.#clear()
                break

            case 'Enter':
                // with nothing Highlighted, let the form submit, and
                // drop any pending Typeahead request
                if (!this.#actors[this.#index]) {
                    this.#cancel()
                    break
                }
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

        const controller = new AbortController()
        this.#controller = controller
        const { signal } = controller

        let json:unknown
        try {
            const res = await fetch(url, { signal })
            if (signal.aborted) return
            if (!res.ok) throw new Error(`status ${res.status}`)
            json = await res.json()
        } catch (err) {
            // a newer Query, or a close, cancelled this request
            if (isAbortError(err)) return
            // any other failure closes the Suggestion list, quietly
            this.#clear()
            return
        }
        if (signal.aborted) return

        this.#actors = parseActors(json)
        this.#index = -1
        // after render(), which empties the count when there are none
        this.render()
        this.#announce(this.#actors.length)
    }

    /**
     * Write the Suggestion count. A trailing no-break space alternates
     * between writes, so screen readers re-read an identical count.
     */
    #announce (count:number) {
        if (!this.#suggestionCount) return
        this.#nbsp = !this.#nbsp
        this.#suggestionCount.textContent = this.announce(count) +
            (this.#nbsp ? '\u00a0' : '')
    }

    /**
     * Close only when focus leaves the host. Some assistive technology
     * focuses a Suggestion before it sends the click that selects it.
     */
    #onfocusout (evt:FocusEvent) {
        const next = evt.relatedTarget
        if (next instanceof Node && this.contains(next)) return
        this.#clear()
    }

    #onclick (evt:Event) {
        const option = evt.target instanceof Element ?
            evt.target.closest<HTMLElement>('[role="option"]') :
            null
        if (!option) return

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
     * Stop any pending Typeahead request: the debounce timer, and the
     * request in flight, whose response is then dropped.
     */
    #cancel () {
        clearTimeout(this.#timer)
        this.#timer = undefined
        this.#controller?.abort()
        this.#controller = null
    }

    #clear () {
        this.#cancel()
        this.#actors = []
        this.#index = -1
        this.render()
    }

    /**
     * Render into light DOM. Only the suggestion list is rebuilt,
     * so the input element, and anything the consumer attached to it,
     * is never replaced. On the input, only the
     * ARIA combobox attributes are written, plus `autocomplete="off"`
     * when the page did not set `autocomplete`.
     */
    render () {
        if (!this.#suggestionList) {
            this.#suggestionList = document.createElement('div')
            this.#suggestionList.className = 'suggestion-list'
            this.#suggestionList.id = `${this.#id}-list`
            this.#suggestionList.setAttribute('role', 'listbox')
            if (ANCHORED) this.#suggestionList.popover = 'manual'
            this.#suggestionList.addEventListener('mousedown', this)
            this.#suggestionList.addEventListener('click', this)
        }

        const list = this.#suggestionList
        if (list.parentNode !== this) this.append(list)

        // the live region exists empty before its first write, because
        // screen readers often skip a region inserted already filled
        if (!this.#suggestionCount) {
            this.#suggestionCount = document.createElement('div')
            this.#suggestionCount.className = 'suggestion-count'
            this.#suggestionCount.setAttribute('role', 'status')
        }
        const count = this.#suggestionCount
        if (count.parentNode !== this) this.append(count)
        // only a response writes the count; any close empties it, and a
        // response with no Suggestions writes it after this render
        if (!this.#actors.length) count.textContent = ''

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

            // the Suggestion list carries at most one of the two
            const name = nameSource(input, this)
            for (const attr of ['aria-labelledby', 'aria-label'] as const) {
                const value = name[attr]
                if (value) list.setAttribute(attr, value)
                else list.removeAttribute(attr)
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
):HTMLButtonElement {
    const button = document.createElement('button')
    // a button, so every input method can activate it, but not a
    // submit button, and out of the tab order, because focus stays on
    // the Authored input
    button.type = 'button'
    button.tabIndex = -1
    button.className = 'suggestion'
    button.setAttribute('role', 'option')
    button.setAttribute('aria-selected', String(active))
    button.dataset.index = String(index)
    button.dataset.handle = actor.handle

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
    button.append(avatar, handle)

    return button
}

/**
 * What names the Authored input, in the order of accessible name
 * computation, as the attribute the Suggestion list copies it to.
 */
function nameSource (input:HTMLInputElement, host:HTMLElement):{
    'aria-labelledby'?:string;
    'aria-label'?:string;
} {
    const labelledby = input.getAttribute('aria-labelledby')
    if (labelledby) return { 'aria-labelledby': labelledby }

    const label = input.getAttribute('aria-label')
    if (label) return { 'aria-label': label }

    // reference the labels when they all have ids, otherwise copy their
    // text, because the component never writes ids onto the page
    const labels = [...(input.labels ?? [])]
    if (!labels.length) return {}
    if (labels.every(label => label.id)) {
        return {
            'aria-labelledby': labels.map(label => label.id).join(' ')
        }
    }

    const text = labels
        .map(label => labelText(label, host).trim())
        .filter(Boolean)
        .join(' ')
    return text ? { 'aria-label': text } : {}
}

/**
 * The text of a label, without the Host element's content, which a
 * label that wraps the Host element would otherwise include.
 */
function labelText (label:HTMLLabelElement, host:HTMLElement):string {
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT, {
        acceptNode: node => host.contains(node) ?
            NodeFilter.FILTER_REJECT :
            NodeFilter.FILTER_ACCEPT
    })

    let text = ''
    while (walker.nextNode()) text += walker.currentNode.nodeValue
    return text
}

/**
 * The default English Suggestion count announcement.
 */
function defaultAnnounce (count:number):string {
    if (count === 0) return 'No Suggestions'
    return count === 1 ?
        '1 Suggestion available' :
        `${count} Suggestions available`
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

function isAbortError (err:unknown):boolean {
    return err instanceof DOMException && err.name === 'AbortError'
}

function isRecord (value:unknown):value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
