import { test, type Test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'
import { ActorTypeahead, type Actor } from '../src/index.js'

const ACTORS:Actor[] = [
    { handle: 'alice.test' },
    { handle: 'bob.test' },
]

let requests:URL[] = []

async function fakeFetch (
    input:RequestInfo|URL,
    init?:RequestInit
):Promise<Response> {
    requests.push(new URL(String(input)))
    if (init?.signal?.aborted) throw abortError()
    return new Response(JSON.stringify({ actors: ACTORS }))
}

/**
 * A request held by `deferredFetch()`, for the test to settle.
 */
interface Deferred {
    q:string|null;
    signal:AbortSignal|null;
    resolve:(res:Response) => void;
    reject:(err:unknown) => void;
}

/**
 * Replace `fetch` with a stub that holds each request until the test
 * resolves or rejects it. Like the real `fetch`, it rejects with an
 * `AbortError` when the request's signal aborts.
 */
function deferredFetch ():Deferred[] {
    const calls:Deferred[] = []
    window.fetch = (input, init) => {
        const url = new URL(String(input))
        requests.push(url)
        const signal = init?.signal ?? null
        return new Promise((resolve, reject) => {
            const q = url.searchParams.get('q')
            calls.push({ q, signal, resolve, reject })
            if (!signal) return
            if (signal.aborted) reject(abortError())
            signal.addEventListener('abort', () => reject(abortError()))
        })
    }
    return calls
}

/**
 * The request `deferredFetch()` holds for a Query. Polls, because the
 * request is sent only after the debounce.
 */
async function requestFor (
    calls:Deferred[],
    q:string
):Promise<Deferred> {
    for (let i = 0; i < 100; i++) {
        const call = calls.find(c => c.q === q)
        if (call) return call
        await sleep(10)
    }
    throw new Error(`no request for ${q}`)
}

function respond (call:Deferred, actors:Actor[]) {
    call.resolve(new Response(JSON.stringify({ actors })))
}

function abortError ():DOMException {
    return new DOMException('The operation was aborted.', 'AbortError')
}

/**
 * Collect `unhandledrejection` events until the returned function is
 * called, which resolves to the reasons seen.
 */
function rejections ():() => Promise<unknown[]> {
    const errors:unknown[] = []
    const onerror = (ev:PromiseRejectionEvent) => {
        ev.preventDefault()
        errors.push(ev.reason)
    }
    window.addEventListener('unhandledrejection', onerror)
    return async () => {
        // the rejection event is dispatched after the current task
        await sleep(50)
        window.removeEventListener('unhandledrejection', onerror)
        return errors
    }
}

window.fetch = fakeFetch

const OPTION = 'actor-typeahead [role="option"]'

// longer than DEBOUNCE_MS in src/index.ts
const DEBOUNCE = 200

function isOpen (el:ActorTypeahead):boolean {
    const list = el.querySelector('[role="listbox"]')
    return !!list && list.matches(':popover-open')
}

/**
 * The live region's text, without the trailing no-break space that
 * alternates between announcements.
 */
function announced (el:ActorTypeahead):string {
    const text = el.querySelector('[role="status"]')?.textContent ?? ''
    return text.replace(/\u00a0$/, '')
}

function results (el:ActorTypeahead):NodeListOf<HTMLElement> {
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
    key(input, 'ArrowUp')
    t.ok(
        !input.hasAttribute('aria-activedescendant'),
        'removed by ArrowUp on the first option'
    )
    key(input, 'ArrowUp')
    checkActive(t, el, input, ACTORS.length - 1)

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

test('the listbox copies the input\'s aria-labelledby', async t => {
    document.body.innerHTML = `<span id="a">Find</span>
    <span id="b">an account</span>
    <${ActorTypeahead.TAG}>
        <input aria-labelledby="a b" aria-label="ignored">
    </${ActorTypeahead.TAG}>`
    const el = (await waitFor(ActorTypeahead.TAG))!
    const input = el.querySelector('input')!
    const list = el.querySelector('[role="listbox"]')!

    t.equal(
        list.getAttribute('aria-labelledby'),
        input.getAttribute('aria-labelledby'),
        'should reference what names the input'
    )
    t.ok(!list.hasAttribute('aria-label'), 'should have no aria-label')
})

test('the listbox copies the input\'s aria-label', async t => {
    document.body.innerHTML = `<label id="handle-label" for="handle">
        Handle
    </label>
    <${ActorTypeahead.TAG}>
        <input id="handle" aria-label="Find an account">
    </${ActorTypeahead.TAG}>`
    const el = (await waitFor(ActorTypeahead.TAG))!
    const input = el.querySelector('input')!
    const list = el.querySelector('[role="listbox"]')!

    t.equal(
        list.getAttribute('aria-label'),
        input.getAttribute('aria-label'),
        'should use the input\'s aria-label'
    )
    t.ok(
        !list.hasAttribute('aria-labelledby'),
        'should have no aria-labelledby'
    )
})

test('the listbox is named by the text of labels without ids',
    async t => {
        document.body.innerHTML = `<label for="handle">
            Handle
        </label>
        <${ActorTypeahead.TAG}><input id="handle"></${ActorTypeahead.TAG}>
        <label for="handle"> on <b>Bluesky</b> </label>`
        const el = (await waitFor(ActorTypeahead.TAG))!
        const list = el.querySelector('[role="listbox"]')!
        const labels = [...document.querySelectorAll('label')]
        const text = labels.map(label => label.textContent!.trim())

        t.equal(
            list.getAttribute('aria-label'),
            text.join(' '),
            'should be the trimmed label text, joined with a space'
        )
        t.ok(
            !list.hasAttribute('aria-labelledby'),
            'should have no aria-labelledby'
        )
        t.deepEqual(
            labels.map(label => label.getAttributeNames()),
            [['for'], ['for']],
            'should not write attributes on the page\'s labels'
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

test('the Suggestion count is an empty live region before any Query',
    async t => {
        const { el } = await setup()
        const regions = el.querySelectorAll('[role="status"]')

        t.equal(regions.length, 1, 'one live region')
        t.ok(
            !regions[0]?.closest('[role="listbox"]'),
            'outside the Suggestion list'
        )
        t.equal(regions[0]?.parentElement, el, 'a child of the host')
        t.equal(regions[0]?.textContent, '', 'empty')
    })

test('a settled request announces the Suggestion count', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    t.ok(announced(el), 'should announce')
    t.equal(
        announced(el),
        el.announce(ACTORS.length),
        'the announce text for the number of Suggestions'
    )
})

test('a custom announce is used', async t => {
    const { el, input } = await setup()
    const counts:number[] = []
    el.announce = count => {
        counts.push(count)
        return `count ${count}`
    }
    type(input, 'ali')
    await waitFor(OPTION)

    t.deepEqual(counts, [ACTORS.length], 'called with the count')
    t.equal(announced(el), `count ${ACTORS.length}`, 'its text is used')
})

test('a request with no Suggestions is announced', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()

    // start open, so the empty response closes the Suggestion list
    type(input, 'ali')
    respond(await requestFor(calls, 'ali'), ACTORS)
    await waitFor(OPTION)
    type(input, 'zzz')
    respond(await requestFor(calls, 'zzz'), [])
    await sleep(50)

    window.fetch = fakeFetch
    t.equal(isOpen(el), false, 'the Suggestion list is closed')
    t.ok(announced(el), 'should announce')
    t.equal(announced(el), el.announce(0), 'the announce text for 0')
})

test('a custom announce is called with 0', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()
    const counts:number[] = []
    el.announce = count => {
        counts.push(count)
        return `count ${count}`
    }

    type(input, 'zzz')
    respond(await requestFor(calls, 'zzz'), [])
    await sleep(50)

    window.fetch = fakeFetch
    t.deepEqual(counts, [0], 'called with 0')
    t.equal(announced(el), 'count 0', 'its text is used')
})

test('a failed request is not announced', async t => {
    const failures:[string, (call:Deferred) => void][] = [
        ['a network error', call => {
            call.reject(new TypeError('Failed to fetch'))
        }],
        ['a non-2xx response', call => {
            call.resolve(new Response(JSON.stringify({ actors: [] }), {
                status: 500
            }))
        }],
    ]

    for (const [name, fail] of failures) {
        const { el, input } = await setup()
        const calls = deferredFetch()

        // start announced, so the failure has a count to clear
        type(input, 'ali')
        respond(await requestFor(calls, 'ali'), ACTORS)
        await waitFor(OPTION)
        type(input, 'zzz')
        fail(await requestFor(calls, 'zzz'))
        await sleep(50)

        window.fetch = fakeFetch
        t.equal(isOpen(el), false, `closed after ${name}`)
        t.equal(
            el.querySelector('[role="status"]')!.textContent,
            '',
            `empty after ${name}`
        )
    }
})

test('the same count is announced again', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()

    type(input, 'al')
    respond(await requestFor(calls, 'al'), ACTORS)
    await waitFor(OPTION)
    const first = el.querySelector('[role="status"]')!.textContent
    type(input, 'ali')
    respond(await requestFor(calls, 'ali'), ACTORS)
    await sleep(50)

    window.fetch = fakeFetch
    t.notEqual(
        el.querySelector('[role="status"]')!.textContent,
        first,
        'the live region content changes'
    )
    t.equal(announced(el), el.announce(ACTORS.length), 'the same count')
})

test('moving the Highlighted Suggestion is not announced',
    async t => {
        const { el, input } = await setup()
        type(input, 'ali')
        await waitFor(OPTION)
        const region = el.querySelector('[role="status"]')!
        const before = region.textContent
        let writes = 0
        new MutationObserver(records => { writes += records.length })
            .observe(region, {
                childList: true,
                characterData: true,
                subtree: true
            })

        for (const name of ['ArrowDown', 'ArrowDown', 'ArrowUp',
            'PageDown', 'PageUp']) {
            key(input, name)
        }
        await sleep(0)

        t.equal(region.textContent, before, 'same content')
        t.equal(writes, 0, 'the live region is not written')
    })

test('closing the Suggestion list empties the live region',
    async t => {
        const closes:[string, (
            input:HTMLInputElement,
            calls:Deferred[]
        ) => void|Promise<void>][] = [
            ['Escape', input => { key(input, 'Escape') }],
            ['Selection', input => {
                key(input, 'ArrowDown')
                key(input, 'Enter')
            }],
            ['focus out', input => {
                input.dispatchEvent(new FocusEvent('focusout', {
                    bubbles: true
                }))
            }],
            ['clearing the Query', input => type(input, '')],
            ['a failed request', async (input, calls) => {
                type(input, 'zzz')
                const call = await requestFor(calls, 'zzz')
                call.reject(new TypeError('Failed to fetch'))
            }],
        ]

        for (const [name, close] of closes) {
            const { el, input } = await setup()
            const calls = deferredFetch()
            type(input, 'ali')
            respond(await requestFor(calls, 'ali'), ACTORS)
            await waitFor(OPTION)
            t.ok(announced(el), `announced before ${name}`)

            await close(input, calls)
            await sleep(50)
            window.fetch = fakeFetch
            t.equal(isOpen(el), false, `closed after ${name}`)
            t.equal(
                el.querySelector('[role="status"]')!.textContent,
                '',
                `empty after ${name}`
            )
        }
    })

test('each instance has its own live region', async t => {
    requests = []
    document.body.innerHTML = `
        <${ActorTypeahead.TAG}><input></${ActorTypeahead.TAG}>
        <${ActorTypeahead.TAG}><input></${ActorTypeahead.TAG}>`
    await waitFor(ActorTypeahead.TAG)
    const [first, second] = [
        ...document.querySelectorAll(ActorTypeahead.TAG)
    ]
    const regions = [first, second].map(el => {
        return el.querySelector('[role="status"]')
    })

    t.ok(regions[0] && regions[1], 'each has a live region')
    t.notEqual(regions[0], regions[1], 'not the same region')

    type(first.querySelector('input')!, 'ali')
    await waitFor(OPTION)
    await sleep(50)
    t.ok(announced(first), 'the first is announced')
    t.equal(regions[1]?.textContent, '', 'the second is unchanged')
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
    results(el)[0].click()
    t.equal(isOpen(el), false, 'after click selection')

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

test('removing the element aborts its in-flight request',
    async t => {
        const { el, input } = await setup()
        const calls = deferredFetch()
        const stop = rejections()

        type(input, 'ali')
        const call = await requestFor(calls, 'ali')
        el.remove()
        respond(call, ACTORS)
        // waitFor watches the document, so poll the detached element
        for (let i = 0; i < 10; i++) {
            if (results(el).length) break
            await sleep(10)
        }

        const errors = await stop()
        window.fetch = fakeFetch
        t.equal(call.signal?.aborted, true, 'should abort the request')
        t.equal(results(el).length, 0, 'should render no Suggestions')
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

test('a late response for an older Query does not replace a newer one',
    async t => {
        const { el, input } = await setup()
        const calls = deferredFetch()
        const stop = rejections()

        type(input, 'al')
        const older = await requestFor(calls, 'al')
        type(input, 'ali')
        const newer = await requestFor(calls, 'ali')
        respond(newer, [ACTORS[0]])
        await waitFor(OPTION)
        respond(older, ACTORS)
        await sleep(50)

        const errors = await stop()
        window.fetch = fakeFetch
        t.equal(results(el).length, 1, 'should show the newer Suggestions')
        t.equal(errors.length, 0, 'should not reject')
    })

test('starting a new request aborts the previous one', async t => {
    const { input } = await setup()
    const calls = deferredFetch()
    const stop = rejections()

    type(input, 'al')
    const older = await requestFor(calls, 'al')
    t.equal(older.signal?.aborted, false, 'in flight before the next Query')
    type(input, 'ali')
    const newer = await requestFor(calls, 'ali')
    respond(newer, ACTORS)
    await waitFor(OPTION)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(older.signal?.aborted, true, 'should abort the older request')
    t.equal(newer.signal?.aborted, false, 'should not abort the newer one')
    t.equal(errors.length, 0, 'an aborted request should not reject')
})

test('a late response does not reopen a closed Suggestion list',
    async t => {
        const closes:[string, (input:HTMLInputElement) => void][] = [
            ['Escape', input => { key(input, 'Escape') }],
            ['Selection', input => {
                key(input, 'ArrowDown')
                key(input, 'Enter')
            }],
            ['an emptied input', input => type(input, '')],
            ['focusout', input => {
                input.dispatchEvent(new FocusEvent('focusout', {
                    bubbles: true
                }))
            }],
        ]

        for (const [name, close] of closes) {
            const { el, input } = await setup()
            input.focus()
            const calls = deferredFetch()
            const stop = rejections()

            // Suggestions on screen, so Selection has one to choose
            type(input, 'al')
            respond(await requestFor(calls, 'al'), ACTORS)
            await waitFor(OPTION)
            type(input, 'ali')
            const late = await requestFor(calls, 'ali')
            close(input)
            respond(late, ACTORS)
            await sleep(50)

            const errors = await stop()
            window.fetch = fakeFetch
            t.equal(results(el).length, 0, `no Suggestions after ${name}`)
            t.equal(isOpen(el), false, `closed after ${name}`)
            t.equal(
                input.getAttribute('aria-expanded'),
                'false',
                `collapsed after ${name}`
            )
            t.equal(errors.length, 0, `no rejection after ${name}`)
        }
    })

test('the previous Suggestions stay while a new Query is pending',
    async t => {
        const { el, input } = await setup()
        const calls = deferredFetch()

        type(input, 'al')
        respond(await requestFor(calls, 'al'), ACTORS)
        await waitFor(OPTION)
        type(input, 'ali')
        const pending = await requestFor(calls, 'ali')

        t.equal(results(el).length, ACTORS.length, 'should keep Suggestions')
        t.equal(isOpen(el), true, 'should stay open')

        respond(pending, [ACTORS[0]])
        await waitFor(null, null, () => {
            return results(el).length === 1 ? el : null
        })
        window.fetch = fakeFetch
        t.equal(results(el).length, 1, 'then show the new Suggestions')
    })

test('a network error closes the Suggestion list quietly', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()
    const stop = rejections()

    type(input, 'al')
    const call = await requestFor(calls, 'al')
    call.reject(new TypeError('Failed to fetch'))
    await sleep(50)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(errors.length, 0, 'should not reject')
    t.equal(results(el).length, 0, 'should show no Suggestions')
    t.equal(isOpen(el), false, 'should stay closed')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'collapsed')
})

test('a non-2xx response closes the Suggestion list quietly', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()
    const stop = rejections()

    // start open, so the failure has Suggestions to clear
    type(input, 'al')
    respond(await requestFor(calls, 'al'), ACTORS)
    await waitFor(OPTION)
    type(input, 'ali')
    const call = await requestFor(calls, 'ali')
    call.resolve(new Response(JSON.stringify({ actors: ACTORS }), {
        status: 500
    }))
    await sleep(50)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(errors.length, 0, 'should not reject')
    t.equal(results(el).length, 0, 'should show no Suggestions')
    t.equal(isOpen(el), false, 'should close')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'collapsed')
})

test('a body that is not JSON closes the Suggestion list quietly',
    async t => {
        const { el, input } = await setup()
        const calls = deferredFetch()
        const stop = rejections()

        // start open, so the failure has Suggestions to clear
        type(input, 'al')
        respond(await requestFor(calls, 'al'), ACTORS)
        await waitFor(OPTION)
        type(input, 'ali')
        const call = await requestFor(calls, 'ali')
        call.resolve(new Response('<html>not json</html>'))
        await sleep(50)

        const errors = await stop()
        window.fetch = fakeFetch
        t.equal(errors.length, 0, 'should not reject')
        t.equal(results(el).length, 0, 'should show no Suggestions')
        t.equal(isOpen(el), false, 'should close')
        t.equal(input.getAttribute('aria-expanded'), 'false', 'collapsed')
    })

test('a failed request closes an open Suggestion list', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()
    const stop = rejections()

    type(input, 'al')
    respond(await requestFor(calls, 'al'), ACTORS)
    await waitFor(OPTION)
    type(input, 'ali')
    const call = await requestFor(calls, 'ali')
    call.reject(new TypeError('Failed to fetch'))
    await sleep(50)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(errors.length, 0, 'should not reject')
    t.equal(results(el).length, 0, 'should drop the old Suggestions')
    t.equal(isOpen(el), false, 'should close')
    t.equal(input.getAttribute('aria-expanded'), 'false', 'collapsed')
})

test('the next Query after a failed request renders', async t => {
    const { el, input } = await setup()
    const calls = deferredFetch()
    const stop = rejections()

    type(input, 'al')
    const failed = await requestFor(calls, 'al')
    failed.reject(new TypeError('Failed to fetch'))
    await sleep(50)
    type(input, 'ali')
    respond(await requestFor(calls, 'ali'), ACTORS)
    await waitFor(OPTION)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(errors.length, 0, 'should not reject')
    t.equal(results(el).length, ACTORS.length, 'should show Suggestions')
    t.equal(isOpen(el), true, 'should open')
    t.equal(input.getAttribute('aria-expanded'), 'true', 'expanded')
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
    t.equal(key(input, 'Escape'), true, 'should not cancel the keydown')
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

test('focusout and Selection before the debounce send no request',
    async t => {
        const closes:[string, (input:HTMLInputElement) => void][] = [
            ['Selection', input => {
                key(input, 'ArrowDown')
                key(input, 'Enter')
            }],
            ['focusout', input => {
                input.dispatchEvent(new FocusEvent('focusout', {
                    bubbles: true
                }))
            }],
        ]

        for (const [name, close] of closes) {
            const { el, input } = await setup()
            input.focus()
            const calls = deferredFetch()

            // Suggestions on screen, so Selection has one to choose
            type(input, 'al')
            respond(await requestFor(calls, 'al'), ACTORS)
            await waitFor(OPTION)
            type(input, 'ali')
            close(input)
            await sleep(DEBOUNCE)

            // answer a stray request, so it could reopen the list
            const late = calls.filter(c => c.q === 'ali')
            late.forEach(call => respond(call, ACTORS))
            await sleep(50)

            window.fetch = fakeFetch
            t.equal(late.length, 0, `no request after ${name}`)
            t.equal(isOpen(el), false, `closed after ${name}`)
            t.equal(
                input.getAttribute('aria-expanded'),
                'false',
                `collapsed after ${name}`
            )
        }
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

test('ArrowUp with nothing Highlighted highlights the last Suggestion',
    async t => {
        const { el, input } = await setup()
        type(input, 'ali')
        await waitFor(OPTION)

        t.equal(key(input, 'ArrowUp'), false, 'should cancel the keydown')
        checkActive(t, el, input, ACTORS.length - 1)
    })

test('ArrowUp with no Suggestions does nothing', async t => {
    const { el, input } = await setup()
    key(input, 'ArrowUp')

    t.ok(
        !input.hasAttribute('aria-activedescendant'),
        'should have no aria-activedescendant'
    )
    t.equal(isOpen(el), false, 'should stay closed')
    t.equal(results(el).length, 0, 'should have no options')
})

test('ArrowUp on the first Suggestion clears the Highlight', async t => {
    const { el, input, submits } = await formSetup()
    type(input, 'ali')
    await waitFor(OPTION)
    key(input, 'ArrowDown')
    checkActive(t, el, input, 0)

    t.equal(key(input, 'ArrowUp'), false, 'should cancel the keydown')
    t.ok(
        !input.hasAttribute('aria-activedescendant'),
        'should remove aria-activedescendant'
    )
    const selected = [...results(el)].filter(option => {
        return option.getAttribute('aria-selected') === 'true'
    })
    t.equal(selected.length, 0, 'no option is selected')
    t.equal(isOpen(el), true, 'should stay open')

    const passed = key(input, 'Enter')
    t.equal(passed, true, 'Enter should not be canceled')
    if (passed) input.form!.requestSubmit()
    t.equal(submits(), 1, 'should submit the form')
    t.equal(input.value, 'ali', 'should not select')
})

test('Escape closes the menu', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    t.equal(key(input, 'Escape'), false, 'should cancel the keydown')
    t.equal(results(el).length, 0, 'should close the menu')
    t.equal(isOpen(el), false, 'should close the Suggestion list')
    t.equal(input.value, 'ali', 'should leave the input alone')
})

test('select with a click', async t => {
    const { el, input } = await setup()
    let selected:Actor|null = null
    el.on<CustomEvent<Actor>>('select', ev => {
        selected = ev.detail
    })

    type(input, 'ali')
    await waitFor(OPTION)

    // assistive technology activates with a click and no pointer events
    results(el)[1].click()

    t.equal(input.value, ACTORS[1].handle, 'should fill in the input')
    t.deepEqual(selected, ACTORS[1], 'should emit the selected actor')
    t.equal(results(el).length, 0, 'should close the menu')
    t.equal(isOpen(el), false, 'should close the Suggestion list')
    t.equal(document.activeElement, input, 'should focus the input')
})

test('a click off a Suggestion does nothing', async t => {
    const { el, input } = await setup()
    let selections = 0
    el.on('select', () => selections++)

    type(input, 'ali')
    await waitFor(OPTION)
    el.querySelector<HTMLElement>('[role="listbox"]')!.click()

    t.equal(selections, 0, 'should not select')
    t.equal(input.value, 'ali', 'should leave the input alone')
    t.equal(isOpen(el), true, 'should stay open')
})

test('a press on a Suggestion keeps focus on the input', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    // a synthetic press does not move focus, so check the default action
    const press = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true
    })
    t.equal(results(el)[0].dispatchEvent(press), false,
        'should cancel the mousedown')
})

test('focus moving to a Suggestion keeps the list open', async t => {
    const { el, input } = await setup()
    let selected:Actor|null = null
    el.on<CustomEvent<Actor>>('select', ev => {
        selected = ev.detail
    })
    type(input, 'ali')
    await waitFor(OPTION)

    // some assistive technology focuses the element it will activate
    const option = results(el)[1]
    input.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: option
    }))
    t.equal(isOpen(el), true, 'should stay open')

    option.click()
    t.equal(input.value, ACTORS[1].handle, 'should fill in the input')
    t.deepEqual(selected, ACTORS[1], 'should emit the selected actor')
    t.equal(isOpen(el), false, 'should close after the click')
})

test('focus moving out of the host closes the list', async t => {
    const { el, input } = await setup()
    const outside = document.createElement('button')
    document.body.append(outside)
    type(input, 'ali')
    await waitFor(OPTION)

    results(el)[0].dispatchEvent(new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside
    }))
    t.equal(isOpen(el), false, 'should close')
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

test('a click on a Suggestion in a form does not submit it',
    async t => {
        const { el, input, submits } = await formSetup()
        type(input, 'ali')
        await waitFor(OPTION)

        results(el)[0].click()

        t.equal(submits(), 0, 'should not submit')
        t.equal(input.value, ACTORS[0].handle, 'should select instead')
    })

test('a Suggestion never submits a form, even unhandled',
    async t => {
        const { el, input, submits } = await formSetup()
        type(input, 'ali')
        await waitFor(OPTION)

        // the click never reaches the component, so the Suggestion is
        // still connected when the browser runs its default action
        input.form!.addEventListener('click', ev => {
            ev.stopPropagation()
        }, { capture: true })
        results(el)[0].click()

        t.equal(submits(), 0, 'should not submit')
        t.equal(input.value, 'ali', 'should not select')
    })

test('Suggestions are not in the tab order', async t => {
    const { el, input } = await setup()
    type(input, 'ali')
    await waitFor(OPTION)

    const tabbable = [...results(el)].filter(o => o.tabIndex >= 0)
    t.equal(tabbable.length, 0, 'should keep every Suggestion out')
})

test('Enter with the Suggestion list closed submits a form',
    async t => {
        const { el, input, submits } = await formSetup()
        input.value = ACTORS[0].handle

        if (key(input, 'Enter')) input.form!.requestSubmit()

        t.equal(submits(), 1, 'should submit once')
        t.equal(isOpen(el), false, 'should stay closed')
    })

test('Enter with no Highlighted Suggestion submits a form',
    async t => {
        const { el, input, submits } = await formSetup()
        type(input, 'ali')
        await waitFor(OPTION)

        if (key(input, 'Enter')) input.form!.requestSubmit()

        t.equal(submits(), 1, 'should submit once')
        t.equal(input.value, 'ali', 'should not select')
        t.equal(isOpen(el), true, 'should stay open')
    })

test('Enter that submits before the debounce sends no request',
    async t => {
        const { el, input, submits } = await formSetup()
        type(input, 'ali')

        if (key(input, 'Enter')) input.form!.requestSubmit()
        await sleep(DEBOUNCE)

        t.equal(submits(), 1, 'should submit once')
        t.equal(requests.length, 0, 'should not make a request')
        t.equal(isOpen(el), false, 'should stay closed')
    })

test('Enter that submits drops the response in flight', async t => {
    const { el, input, submits } = await formSetup()
    const calls = deferredFetch()
    const stop = rejections()

    type(input, 'ali')
    const call = await requestFor(calls, 'ali')
    if (key(input, 'Enter')) input.form!.requestSubmit()
    respond(call, ACTORS)
    await sleep(50)

    const errors = await stop()
    window.fetch = fakeFetch
    t.equal(submits(), 1, 'should submit once')
    t.equal(call.signal?.aborted, true, 'should abort the request')
    t.equal(results(el).length, 0, 'should render no Suggestions')
    t.equal(isOpen(el), false, 'should stay closed')
    t.equal(errors.length, 0, 'should not reject')
})

test('Escape with the Suggestion list closed is not canceled',
    async t => {
        const { el, input } = await setup()
        t.equal(key(input, 'Escape'), true, 'should not cancel')
        t.equal(isOpen(el), false, 'should stay closed')
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

/**
 * Mount the element inside a `<form>`. `submits()` counts submit events.
 */
async function formSetup ():Promise<{
    el:ActorTypeahead;
    input:HTMLInputElement;
    submits:()=>number;
}> {
    requests = []
    document.body.innerHTML = `<form>
        <${ActorTypeahead.TAG}><input></${ActorTypeahead.TAG}>
    </form>`

    const el = (await waitFor(ActorTypeahead.TAG))!
    const input = el.querySelector('input')!
    let count = 0
    input.form!.addEventListener('submit', ev => {
        ev.preventDefault()
        count++
    })
    return { el, input, submits: () => count }
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
