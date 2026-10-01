import { cubicBezier } from 'motion/react'
import { EASE } from './motion'
import { sectionsReady } from './sections'

// Smooth-scroll plumbing shared by the nav, deep links and Back to top.
// Lenis only runs for mouse and trackpad users who haven't asked for reduced
// motion (see useSmoothScroll). Everyone else keeps native scrolling, where
// CSS scroll-behavior and scroll-padding-top already do the right thing.
// Lenis reads scroll-padding-top too, so both paths land below the navbar.

let lenis = null
let locked = false
let pending = null
let navigatingUntil = 0
let frame = 0

const NAV_SCROLL = { duration: 1.2, easing: cubicBezier(...EASE) }

// Lenis only needs animation frames while it is easing a scroll. Its own
// loop (autoRaf) would run every frame forever, and each of those frames
// makes the browser restyle every running CSS animation on the main thread.
// So the loop starts on a wheel turn or a scrollTo and stops once settled.
const tick = (time) => {
  frame = 0
  if (!lenis) return
  lenis.raf(time)
  if (lenis.isScrolling === 'smooth') frame = requestAnimationFrame(tick)
}

function drive() {
  if (frame || !lenis) return
  // Restart its clock, so the first step isn't the whole time it sat idle.
  lenis.time = 0
  frame = requestAnimationFrame(tick)
}

// Lenis is downloaded only where it runs, so phones never load it. Until it
// arrives, scrolling is simply native.
export function startSmoothScroll() {
  let stopped = false
  Promise.all([import('lenis'), import('lenis/dist/lenis.css')]).then(([{ default: Lenis }]) => {
    if (stopped) return
    lenis = new Lenis({ anchors: false })
    if (locked) lenis.stop()
    window.addEventListener('wheel', drive, { passive: true })
    // The page grows as the sections below the hero mount (App.jsx); measure
    // it then rather than after Lenis's own debounced resize.
    sectionsReady.then(() => lenis?.resize())
  })
  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    frame = 0
    window.removeEventListener('wheel', drive)
    lenis?.destroy()
    lenis = null
  }
}

/** Pauses wheel scrolling of the page, e.g. while the mobile drawer is open. */
export function setScrollLocked(value) {
  locked = value
  if (locked) {
    lenis?.stop()
    return
  }
  lenis?.start()
  // Restarting Lenis cancels any scroll it was asked for while stopped (a
  // drawer link closes the drawer and scrolls in the same tap), so a scroll
  // requested during the lock runs now.
  if (pending) {
    const [target, options] = pending
    pending = null
    scrollToTarget(target, options)
  }
}

/** True while a nav-link jump is in flight, so the navbar stays visible. */
export function isNavigating() {
  return performance.now() < navigatingUntil
}

/** Scrolls to an element or a y offset. */
export function scrollToTarget(target, { immediate = false } = {}) {
  // The time limit is a fallback in case the completion event never comes.
  const done = () => (navigatingUntil = 0)
  if (!immediate) navigatingUntil = performance.now() + 1600

  if (lenis && locked) {
    pending = [target, { immediate }]
    return
  }

  if (lenis) {
    // Measure the page first: the sections below the hero may have mounted
    // since Lenis last looked (App.jsx), and a stale height would cut the
    // scroll short.
    lenis.resize()
    lenis.scrollTo(target, { ...NAV_SCROLL, immediate, force: true, onComplete: done })
    drive()
    return
  }

  if (!immediate) window.addEventListener('scrollend', done, { once: true })
  // `auto` follows the stylesheet's scroll-behavior, which reduced motion turns off.
  const behavior = immediate ? 'instant' : 'auto'
  if (typeof target === 'number') window.scrollTo({ top: target, behavior })
  else target.scrollIntoView({ behavior })
}
