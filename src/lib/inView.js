// Shared IntersectionObservers: one per distinct set of options, however
// many elements use it. Every word-popping heading and card on the page
// watches the viewport, so one observer each would mean dozens.

const observers = new Map()

/**
 * Calls `onChange(entry)` whenever `element`'s intersection changes, under
 * IntersectionObserver `options` (rootMargin, threshold). Returns a function
 * that stops watching.
 */
export function observeInView(element, onChange, { rootMargin = '0px', threshold = 0 } = {}) {
  const key = `${rootMargin}|${threshold}`
  let shared = observers.get(key)
  if (!shared) {
    const listeners = new Map()
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => listeners.get(entry.target)?.forEach((fn) => fn(entry))),
      { rootMargin, threshold }
    )
    shared = { observer, listeners }
    observers.set(key, shared)
  }

  const { observer, listeners } = shared
  if (!listeners.has(element)) {
    listeners.set(element, new Set())
    observer.observe(element)
  }
  listeners.get(element).add(onChange)

  return () => {
    const own = listeners.get(element)
    if (!own) return
    own.delete(onChange)
    if (own.size) return
    listeners.delete(element)
    observer.unobserve(element)
  }
}
