import { ActorTypeahead, type Actor } from '../src/index.js'
import '../src/index.css'

const output = document.getElementById('selected')

document.addEventListener(ActorTypeahead.event('select'), ev => {
    if (!(ev instanceof CustomEvent)) return
    const actor:Actor = ev.detail
    if (output) output.textContent = actor.handle
})

/**
 * FOUCE
 */
await Promise.race([
    Promise.allSettled([
        customElements.whenDefined(ActorTypeahead.TAG)
    ]),
    new Promise(resolve => {
        setTimeout(resolve, 2000)
    })
])

document.documentElement.classList.remove('reduce-fouce')
