import { test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'
import { ActorTypeahead, type Actor } from '../src/index.js'

const ACTORS:Actor[] = [
    { handle: 'alice.test' },
    { handle: 'bob.test' },
]

let requests:URL[] = []

window.fetch = async (input:RequestInfo|URL) => {
    requests.push(new URL(String(input)))
    return new Response(JSON.stringify({ actors: ACTORS }))
}

const OPTION = 'actor-typeahead [role="option"]'

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

    t.equal(requests.length, 0, 'should not make a request')
    t.equal(results(el).length, 0, 'should not show any rows')
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

test('clicking a result does not submit a form', async t => {
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
    const option = await waitFor(OPTION)
    option!.click()

    t.equal(submits, 0, 'should not submit')
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

function type (input:HTMLInputElement, value:string) {
    input.value = value
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
}

function key (input:HTMLInputElement, name:string) {
    input.dispatchEvent(new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true
    }))
}
