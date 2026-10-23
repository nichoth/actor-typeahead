import { test, type Test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'
import { ActorTypeahead, type Actor } from '../src/index.js'

const ACTORS:Actor[] = [
    { handle: 'alice.test' },
    { handle: 'bob.test' },
]

let requests:URL[] = []

async function fakeFetch (input:RequestInfo|URL):Promise<Response> {
    requests.push(new URL(String(input)))
    return new Response(JSON.stringify({ actors: ACTORS }))
}

window.fetch = fakeFetch

const OPTION = 'actor-typeahead [role="option"]'

// longer than DEBOUNCE_MS in src/index.ts
const DEBOUNCE = 200

function isOpen (el:ActorTypeahead):boolean {
    const list = el.querySelector('[role="listbox"]')
    return !!list && list.matches(':popover-open')
}

function results (el:ActorTypeahead):NodeListOf<HTMLLIElement> {
    return el.querySelectorAll('[role="option"]')
}

test('keeps the authored input element', async t => {
    document.body.innerHTML = ''
    const el = document.createElement('actor-typeahead')
    const input = document.createElement('input')
    el.append(input)
    document.body.append(el)

    await waitFor('actor-typeahead')
    t.equal(el.querySelector('input'), input, 'should be the same node')
})

test('the input is a combobox that controls the listbox', async t => {
    const { el, input } = await setup()

    t.equal(input.getAttribute('role'), 'combobox', 'combobox role')
    t.equal(
        input.getAttribute('aria-autocomplete'),
        'list',
        'should autocomplete with a list'
    )
    const id = input.getAttribute('aria-controls')
    t.ok(id, 'should have aria-controls')
    const list = id ? document.getElementById(id) : null
    t.ok(list && el.contains(list), 'should reference this element\'s list')
    t.equal(list?.getAttribute('role'), 'listbox', 'should be the listbox')
})

test('aria-expanded follows the Suggestions', async t => {
    const { el, input } = await setup()
    t.equal(input.getAttribute('aria-expanded'), 'false', 'starts closed')

    type(input, 'ali')
    await waitFor(OPTION)
    t.equal(input.getAttribute('aria-expanded'), 'true', 'open with results')
    checkExpanded(t, el, input)
    key(input, 'Escape')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'Escape closes')
    checkExpanded(t, el, input)

    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'ArrowDown')
    checkExpanded(t, el, input)
    key(input, 'Enter')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'select closes')
    checkExpanded(t, el, input)

    type(input, 'ali')
    await waitFor(OPTION)
    type(input, '')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'empty closes')
    checkExpanded(t, el, input)
})

test('aria-activedescendant tracks the highlighted option', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)
    t.ok(
        !input.hasAttribute('aria-activedescendant'),
        'nothing highlighted before arrow keys'
    )

    key(input, 'ArrowDown')
    key(input, 'ArrowDown')
    checkActive(t, el, input, 1)
    key(input, 'ArrowUp')
    checkActive(t, el, input, 0)

    key(input, 'Escape')
    t.ok(
        !input.hasAttribute('aria-activedescendant'),
        'removed once closed'
    )
})

test('autocomplete is off unless the page sets it', async t => {
    const { input } = await setup()
    t.equal(input.getAttribute('autocomplete'), 'off', 'defaults to off')

    requests = []
    document.body.innerHTML = `<${ActorTypeahead.TAG}>
        <input autocomplete="username">
    </${ActorTypeahead.TAG}>`
    const el = (await waitFor(ActorTypeahead.TAG))!
    const authored = el.querySelector('input')!
    type(authored, 'ali')
    await waitFor(OPTION)

    t.equal(
        authored.getAttribute('autocomplete'),
        'username',
        'should keep the authored value'
    )
})

test('the listbox is labelled by the input\'s label', async t => {
    document.body.innerHTML = `<label id="handle-label" for="handle">
        Handle
    </label>
    <${ActorTypeahead.TAG}><input id="handle"></${ActorTypeahead.TAG}>`
    const el = (await waitFor(ActorTypeahead.TAG))!
    const list = el.querySelector('[role="listbox"]')!

    t.equal(
        list.getAttribute('aria-labelledby'),
        'handle-label',
        'should reference the label'
    )

    const { el: plain } = await setup()
    t.ok(
        !plain.querySelector('[role="listbox"]')!
            .hasAttribute('aria-labelledby'),
        'no label, no aria-labelledby'
    )
})

test('two instances have distinct ids', async t => {
    requests = []
    document.body.innerHTML = `
        <${ActorTypeahead.TAG}><input></${ActorTypeahead.TAG}>
        <${ActorTypeahead.TAG}><input></${ActorTypeahead.TAG}>`
    await waitFor(ActorTypeahead.TAG)
    const els = [...document.querySelectorAll(ActorTypeahead.TAG)]

    for (const el of els) {
        type(el.querySelector('input')!, 'ali')
    }
    await waitFor(null, null, () => {
        const ready = els.every(el => results(el).length === ACTORS.length)
        return ready ? els[0] : null
    })

    const ids = els.flatMap(el => {
        return [...el.querySelectorAll('[role="listbox"], [role="option"]')]
            .map(node => node.id)
    })
    t.equal(ids.length, 2 * (1 + ACTORS.length), 'every element is counted')
    t.ok(ids.every(Boolean), 'every element has an id')
    t.equal(new Set(ids).size, ids.length, 'ids are unique')
})

test('the Suggestion list is open exactly when it has Suggestions',
    async t => {
        const { el, input } = await setup()
        t.equal(isOpen(el), false, 'closed before typing')

        type(input, 'ali')
        await waitFor(OPTION)
        t.equal(isOpen(el), true, 'open with Suggestions')

        window.fetch = async () => {
            return new Response(JSON.stringify({ actors: [] }))
        }
        type(input, 'zzz')
        await waitFor(null, null, () => {
            return results(el).length === 0 ? el : null
        })
        window.fetch = fakeFetch
        t.equal(isOpen(el), false, 'closed with no Suggestions')
    })

test('the Suggestion list closes', async t => {
    const { el, input } = await setup()

    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'Escape')
    t.equal(isOpen(el), false, 'after Escape')

    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'ArrowDown')
    key(input, 'Enter')
    t.equal(isOpen(el), false, 'after keyboard selection')

    type(input, 'ali')
    await waitFor(OPTION)
    const option = results(el)[0]
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    t.equal(isOpen(el), false, 'after pointer selection')

    type(input, 'ali')
    await waitFor(OPTION)
    type(input, '')
    t.equal(isOpen(el), false, 'after the input is emptied')
})

test('repeated renders and clears do not throw', async t => {
    const { el, input } = await setup()

    type(input, 'ali')
    await waitFor(OPTION)
    let error:unknown = null
    try {
        el.render()
        el.render()
    } catch (err) {
        error = err
    }
    t.equal(error, null, 'rendering twice while open')
    t.equal(isOpen(el), true, 'still open')

    try {
        key(input, 'Escape')
        key(input, 'Escape')
        el.render()
    } catch (err) {
        error = err
    }
    t.equal(error, null, 'clearing twice while closed')
    t.equal(isOpen(el), false, 'still closed')
})

test('a response after the element is removed does not throw',
    async t => {
        const { el, input } = await setup()
        let respond:((res:Response) => void)|null = null
        window.fetch = () => new Promise(resolve => { respond = resolve })

        const errors:unknown[] = []
        const onerror = (ev:PromiseRejectionEvent) => {
            ev.preventDefault()
            errors.push(ev.reason)
        }
        window.addEventListener('unhandledrejection', onerror)

        type(input, 'ali')
        // the request is sent after the debounce
        for (let i = 0; i < 100; i++) {
            if (respond) break
            await sleep(10)
        }
        el.remove()
        respond!(new Response(JSON.stringify({ actors: ACTORS })))
        // waitFor watches the document, so poll the detached element
        for (let i = 0; i < 100; i++) {
            if (results(el).length === ACTORS.length) break
            await sleep(10)
        }
        // the rejection event is dispatched after the current task
        await sleep(50)

        window.removeEventListener('unhandledrejection', onerror)
        window.fetch = fakeFetch
        t.equal(results(el).length, ACTORS.length, 'should render')
        t.equal(errors.length, 0, 'should not reject')
        t.equal(isOpen(el), false, 'should not be open')
    })

test('typing queries the typeahead API', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    t.equal(requests.length, 1, 'should make one request')
    const [url] = requests
    t.equal(url.origin, 'https://public.api.bsky.app', 'default host')
    t.ok(
        url.pathname.endsWith('/app.bsky.actor.searchActorsTypeahead'),
        'should call searchActorsTypeahead'
    )
    t.equal(url.searchParams.get('q'), 'ali', 'should send the query')
    t.equal(url.searchParams.get('limit'), '5', 'default limit is 5')
    t.equal(results(el).length, ACTORS.length, 'one row per actor')
})

test('quick typing sends one request for the settled Query',
    async t => {
        const { el, input } = await setup()
        type(input, 'a')
        type(input, 'al')
        type(input, 'ali')
        await waitFor(OPTION)
        await sleep(DEBOUNCE)

        t.equal(requests.length, 1, 'should make one request')
        t.equal(requests[0]?.searchParams.get('q'), 'ali', 'the last Query')
        t.equal(results(el).length, ACTORS.length, 'one row per actor')
    })

test('host and rows attributes', async t => {
    const { input } = await setup('host="https://example.test" rows="2"')
    type(input, 'ali')
    await waitFor(OPTION)

    const [url] = requests
    t.equal(url.origin, 'https://example.test', 'should use the host')
    t.equal(url.searchParams.get('limit'), '2', 'should use rows')
})

test('an empty input clears without a request', async t => {
    const { el, input } = await setup()
    type(input, '')
    await sleep(DEBOUNCE)

    t.equal(requests.length, 0, 'should not make a request')
    t.equal(results(el).length, 0, 'should not show any rows')
})

test('emptying the input before the debounce sends no request',
    async t => {
        const { el, input } = await setup()
        type(input, 'ali')
        type(input, '')
        await sleep(DEBOUNCE)

        t.equal(requests.length, 0, 'should not make a request')
        t.equal(isOpen(el), false, 'should stay closed')
        t.equal(input.getAttribute('aria-expanded'), 'false', 'collapsed')
    })

test('Escape before the debounce sends no request', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    key(input, 'Escape')
    await sleep(DEBOUNCE)

    t.equal(requests.length, 0, 'should not make a request')
    t.equal(results(el).length, 0, 'should not show any rows')
})

test('removing the element before the debounce sends no request',
    async t => {
        const { el, input } = await setup()
        type(input, 'ali')
        el.remove()
        await sleep(DEBOUNCE)

        t.equal(requests.length, 0, 'should not make a request')
    })

test('select with the keyboard', async t => {
    const { el, input } = await setup()
    let selected:Actor|null = null
    el.on<CustomEvent<Actor>>('select', ev => {
        selected = ev.detail
    })

    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'ArrowDown')
    key(input, 'ArrowDown')
    key(input, 'Enter')

    t.equal(input.value, ACTORS[1].handle, 'should fill in the input')
    t.deepEqual(selected, ACTORS[1], 'should emit the selected actor')
    t.equal(results(el).length, 0, 'should close the menu')
})

test('arrow keys stop at the last result', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    for (let i = 0; i < ACTORS.length + 3; i++) key(input, 'ArrowDown')
    key(input, 'Enter')

    t.equal(input.value, ACTORS.at(-1)!.handle, 'should pick the last one')
    t.equal(results(el).length, 0, 'should close the menu')
})

test('Escape closes the menu', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'Escape')

    t.equal(results(el).length, 0, 'should close the menu')
    t.equal(input.value, 'ali', 'should leave the input alone')
})

test('select with the pointer', async t => {
    const { el, input } = await setup()
    let selected:Actor|null = null
    el.on<CustomEvent<Actor>>('select', ev => {
        selected = ev.detail
    })

    type(input, 'ali')
    await waitFor(OPTION)

    const option = results(el)[1]
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

    t.equal(input.value, ACTORS[1].handle, 'should fill in the input')
    t.deepEqual(selected, ACTORS[1], 'should emit the selected actor')
    t.equal(results(el).length, 0, 'should close the menu')
})

test('pointerup off a Suggestion refocuses the input', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    // a real press moves focus off the input between down and up
    const list = el.querySelector('[role="listbox"]')!
    list.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    input.blur()
    list.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

    t.equal(document.activeElement, input, 'should focus the input')
    t.equal(results(el).length, ACTORS.length, 'should stay open')
})

test('Enter in the open Suggestion list does not submit a form',
    async t => {
        requests = []
        document.body.innerHTML = `<form>
            <actor-typeahead><input></actor-typeahead>
        </form>`

        await waitFor('actor-typeahead')
        const form = document.querySelector('form')!
        const input = form.querySelector('input')!
        let submits = 0
        form.addEventListener('submit', ev => {
            ev.preventDefault()
            submits++
        })

        type(input, 'ali')
        await waitFor(OPTION)
        key(input, 'ArrowDown')

        // a synthetic keydown does not submit, so do what the browser
        // does: submit implicitly unless the keydown was canceled
        if (key(input, 'Enter')) form.requestSubmit()

        t.equal(submits, 0, 'should not submit')
        t.equal(input.value, ACTORS[0].handle, 'should select instead')
    })

test('all done', () => {
    document.body.innerHTML = ''
    // @ts-expect-error tests
    window.testsFinished = true
})

async function setup (attrs = ''):Promise<{
    el:ActorTypeahead;
    input:HTMLInputElement;
}> {
    requests = []
    document.body.innerHTML = `<${ActorTypeahead.TAG} ${attrs}>
        <input />
    </${ActorTypeahead.TAG}>`

    const el = (await waitFor(ActorTypeahead.TAG))!
    // const el = document.querySelector('actor-typeahead')!
    const input = el.querySelector('input')!
    return { el, input }
}

function checkActive (
    t:Test,
    el:ActorTypeahead,
    input:HTMLInputElement,
    index:number
) {
    const id = input.getAttribute('aria-activedescendant')
    const options = [...results(el)]
    const selected = options.filter(option => {
        return option.getAttribute('aria-selected') === 'true'
    })

    t.ok(id, 'should have aria-activedescendant')
    t.equal(selected.length, 1, 'exactly one option is selected')
    t.equal(selected[0], options[index], 'the expected option is selected')
    t.equal(
        id && document.getElementById(id),
        selected[0],
        'aria-activedescendant references the selected option'
    )
}

function checkExpanded (
    t:Test,
    el:ActorTypeahead,
    input:HTMLInputElement
) {
    t.equal(
        input.getAttribute('aria-expanded'),
        String(isOpen(el)),
        'aria-expanded matches the popover open state'
    )
}

function sleep (ms:number):Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function type (input:HTMLInputElement, value:string) {
    input.value = value
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
}

/**
 * Dispatch a keydown. Returns false if a listener canceled it.
 */
function key (input:HTMLInputElement, name:string):boolean {
    return input.dispatchEvent(new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true
    }))
}
