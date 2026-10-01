import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'motion/react'
import { FINE_POINTER, SPRING, press } from '../lib/motion'
import { requestPointerFrame, subscribePointer } from '../lib/pointer'
import { useFinePointer, usePrefersReducedMotion } from './usePortfolio'

// Cursor-driven effects. All of them move elements with `transform` only and
// stay off for touch input. The page-wide ones (spotlight, glow) share one
// pointer listener and one animation frame (lib/pointer.js). Reduced motion
// turns off the ones that move on their own (tilt, magnetic pull) and the
// page glow's lag; the lights that simply sit where the pointer is
// (spotlight, page glow) stay.

const SPOTLIGHT = '[data-spotlight]'
// How far beyond a card's edge its border still catches the light: the rim
// glow's radius (half its --size in index.css).
const REACH = 125

/**
 * The light on cards marked `data-spotlight`: a soft glow that follows the
 * pointer inside the hovered card, and a glow on the border of every card
 * within reach, so neighbours in a grid catch the edge of the light too.
 * It runs on the shared pointer frame (lib/pointer.js). Each frame the mouse
 * moved, it writes the pointer's position relative to each card in reach
 * into that card's --mx / --my and marks it `.is-near` (the hovered one also
 * `.is-lit`). CSS turns --mx / --my into transforms on the glow layers that
 * <Spotlight /> renders, so a pointer move never repaints a card.
 */
export function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER).matches) return

    let x = 0
    let y = 0
    let tracking = false
    let hovered = null
    let lit = new Set()
    let scrolled = false
    let settled = false
    let settle = 0

    const paint = (everyCard) => {
      // A pointer move checks every card, for the neighbour glow. While the
      // page scrolls under a still pointer only the lights already on
      // follow, found by box maths: measuring every card, or hit-testing,
      // on every scroll frame would force a style and layout update exactly
      // when the page is busiest. Once scrolling settles, the settle timer
      // looks again properly.
      const scrolling = !everyCard
      const cards = scrolling
        ? lit
        : Array.from(document.querySelectorAll(`${SPOTLIGHT} > .spotlight`), (layer) => layer.parentElement)
      const near = new Map()
      if (tracking) {
        // Measure every card before writing to any: a write between two
        // reads would make the browser restyle the page for the next read.
        for (const card of cards) {
          const r = card.getBoundingClientRect()
          // Distance from the pointer to the card's box (0 inside it).
          const dx = Math.max(r.left - x, 0, x - r.right)
          const dy = Math.max(r.top - y, 0, y - r.bottom)
          if (scrolling && !dx && !dy) hovered = card
          else if (scrolling && hovered === card) hovered = null
          if (dx * dx + dy * dy <= REACH * REACH) near.set(card, r)
        }
        for (const [card, r] of near) {
          card.style.setProperty('--mx', `${x - r.left}px`)
          card.style.setProperty('--my', `${y - r.top}px`)
        }
      }
      for (const card of lit) if (!near.has(card)) card.classList.remove('is-near', 'is-lit')
      for (const card of near.keys()) {
        card.classList.add('is-near')
        card.classList.toggle('is-lit', card === hovered)
      }
      lit = new Set(near.keys())
    }

    const unsubscribe = subscribePointer((pointer) => {
      if (pointer.moved) {
        x = pointer.x
        y = pointer.y
        // An open project modal covers the cards, so they stay dark under it.
        tracking = pointer.inside && !pointer.target?.closest?.('.project-modal')
        hovered = (pointer.inside && pointer.target?.closest?.(SPOTLIGHT)) || null
        scrolled = settled = false
        paint(true)
      } else if (settled) {
        settled = false
        paint(true)
      } else if (scrolled) {
        scrolled = false
        paint(false)
      }
    })

    // Scrolling moves cards under a still pointer: the lights follow at
    // once, and 150ms after the page stops, hit-test for the card now under
    // the pointer and relight its neighbours.
    const onSettle = () => {
      hovered = document.elementFromPoint(x, y)?.closest(SPOTLIGHT) ?? null
      settled = true
      requestPointerFrame()
    }

    const onScroll = () => {
      if (!tracking) return
      scrolled = true
      requestPointerFrame()
      clearTimeout(settle)
      settle = setTimeout(onSettle, 150)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      unsubscribe()
      clearTimeout(settle)
      for (const card of lit) card.classList.remove('is-near', 'is-lit')
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}

// Per 60 Hz frame, the page glow closes 12% of its distance to the pointer;
// frame-rate independent.
const GLOW_EASE = 0.12
const FRAME_MS = 1000 / 60

// Layers that move with the page glow (the brighter grid in GridSweep).
const glowFollowers = new Set()

/** Calls `onMove(x, y)` each time the page glow moves. Returns an unsubscribe. */
export function followCursorGlow(onMove) {
  glowFollowers.add(onMove)
  return () => glowFollowers.delete(onMove)
}

/**
 * The mouse's glow on the page. On the shared pointer frame it eases toward
 * the pointer with transform, asking for more frames until it has caught
 * up. While the mouse is in the window, <html> carries `cursor-on`, which
 * fades the glow in (index.css).
 *
 * Mouse only; with reduced motion the glow follows without lag. Returns
 * whether to render it.
 */
export function useCursorGlow(glow) {
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!fine) return
    const root = document.documentElement
    const at = { x: 0, y: 0 }
    let inside = false
    let moving = false
    let last = 0

    const unsubscribe = subscribePointer((pointer, now) => {
      if (pointer.moved) {
        if (pointer.inside !== inside) {
          inside = pointer.inside
          root.classList.toggle('cursor-on', inside)
          // Entering the window: start at the pointer instead of gliding
          // over from wherever the mouse last left.
          if (inside) {
            at.x = pointer.x
            at.y = pointer.y
          }
        }
        moving = true
      }
      if (!moving) return

      const frames = last ? Math.min(now - last, 100) / FRAME_MS : 1
      last = now
      const k = reduced ? 1 : 1 - Math.pow(1 - GLOW_EASE, frames)
      at.x += (pointer.x - at.x) * k
      at.y += (pointer.y - at.y) * k
      if (glow.current) glow.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`
      glowFollowers.forEach((follow) => follow(at.x, at.y))
      if (Math.abs(pointer.x - at.x) < 0.1 && Math.abs(pointer.y - at.y) < 0.1) {
        moving = false
        last = 0
      } else {
        requestPointerFrame()
      }
    })

    return () => {
      unsubscribe()
      root.classList.remove('cursor-on')
    }
  }, [fine, reduced, glow])

  return fine
}

/**
 * Pulls an element up to `max` px toward the pointer while it hovers, then
 * springs back. Spread `style` and the handlers onto a Motion element.
 */
export function useMagnetic(max = 6) {
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()
  const enabled = fine && !reduced
  const x = useSpring(0, SPRING.ui)
  const y = useSpring(0, SPRING.ui)

  const onPointerMove = (event) => {
    if (!enabled || event.pointerType !== 'mouse') return
    const r = event.currentTarget.getBoundingClientRect()
    // The box already includes the current pull, so take it back out.
    const dx = (event.clientX - (r.left - x.get() + r.width / 2)) / (r.width / 2)
    const dy = (event.clientY - (r.top - y.get() + r.height / 2)) / (r.height / 2)
    x.set(clamp(dx, 1) * max)
    y.set(clamp(dy, 1) * max)
  }

  const onPointerLeave = () => {
    x.set(0)
    y.set(0)
  }

  return { style: { x, y }, onPointerMove, onPointerLeave }
}

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value))

/**
 * A 3D tilt toward the pointer, up to `max` degrees on each axis, with a
 * specular highlight that slides across the face as it turns. The pointer's
 * position goes into raw motion values and springs smooth them, so the
 * element eases back to flat when the pointer leaves.
 *
 * Spread `handlers` on the element (or a steady wrapper), `style` on the
 * element that tilts, and `glare` on a highlight layer inside it. The box is
 * measured on entry rather than on every move, because measuring an element
 * that is already tilted would feed its own rotation back into the angle.
 */
export function useTilt(max = 8) {
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()
  const enabled = fine && !reduced
  const pointerX = useMotionValue(0) // -0.5 (left edge) .. 0.5 (right edge)
  const pointerY = useMotionValue(0)
  const hovering = useMotionValue(0)
  const smoothX = useSpring(pointerX, SPRING.ui)
  const smoothY = useSpring(pointerY, SPRING.ui)
  const rotateY = useTransform(smoothX, (v) => v * 2 * max)
  const rotateX = useTransform(smoothY, (v) => -v * 2 * max)
  const glareX = useTransform(smoothX, (v) => `${v * 50}%`)
  const glareY = useTransform(smoothY, (v) => `${v * 50}%`)
  const glareOpacity = useSpring(hovering, SPRING.ui)
  const box = useRef(null)

  const measure = (element) => {
    box.current = { rect: element.getBoundingClientRect(), scrollY: window.scrollY }
  }

  const onPointerEnter = (event) => {
    if (!enabled || event.pointerType !== 'mouse') return
    measure(event.currentTarget)
    hovering.set(1)
  }

  const onPointerMove = (event) => {
    if (!enabled || event.pointerType !== 'mouse') return
    // The page scrolled under a resting pointer: measure again.
    if (!box.current || box.current.scrollY !== window.scrollY) measure(event.currentTarget)
    const { rect } = box.current
    pointerX.set(clamp((event.clientX - rect.left) / rect.width - 0.5, 0.5))
    pointerY.set(clamp((event.clientY - rect.top) / rect.height - 0.5, 0.5))
    hovering.set(1)
  }

  const onPointerLeave = () => {
    box.current = null
    pointerX.set(0)
    pointerY.set(0)
    hovering.set(0)
  }

  return {
    style: { rotateX, rotateY, transformPerspective: 1000 },
    glare: { x: glareX, y: glareY, opacity: glareOpacity },
    handlers: { onPointerEnter, onPointerMove, onPointerLeave },
  }
}

const NO_PRESS = {}

/**
 * Hover and tap springs for buttons and chips (`press` in lib/motion.js).
 * Spread the result onto a Motion element; it's empty for reduced motion.
 */
export function usePress() {
  return usePrefersReducedMotion() ? NO_PRESS : press
}
