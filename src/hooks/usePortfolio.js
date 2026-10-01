import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { FINE_POINTER } from '../lib/motion'
import { scrollToTarget, setScrollLocked, startSmoothScroll } from '../lib/scroll'
import { sectionsReady } from '../lib/sections'
import { getTheme, subscribeTheme } from '../lib/theme'

/**
 * Tracks which section is crossing a line 40% of the way down the viewport.
 * Each section is watched by an IntersectionObserver whose root is shrunk to
 * a thin band at that line, so there is no scroll listener at all.
 */
export function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0])

  useEffect(() => {
    const crossing = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting ? crossing.add(entry.target.id) : crossing.delete(entry.target.id)
        )
        const current = ids.find((id) => crossing.has(id))
        if (current) setActiveId(current)
      },
      { rootMargin: '-40% 0px -59% 0px' }
    )
    let live = true
    sectionsReady.then(() => {
      if (!live) return
      ids.forEach((id) => {
        const section = document.getElementById(id)
        if (section) observer.observe(section)
      })
    })
    return () => {
      live = false
      observer.disconnect()
    }
  }, [ids])

  return activeId
}

/** True once the element with this id has scrolled entirely above the viewport. */
export function useScrolledPastElement(id) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const element = document.getElementById(id)
    if (!element) return
    const observer = new IntersectionObserver(([entry]) =>
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [id])

  return past
}

/** Copies text to the clipboard and reports success for a moment. */
export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState(null)

  const copy = useCallback(
    async (value, key = value) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value)
        } else {
          const area = document.createElement('textarea')
          area.value = value
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          document.body.removeChild(area)
        }
        setCopied(key)
      } catch {
        setCopied(null)
      }
    },
    []
  )

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(null), timeout)
    return () => clearTimeout(timer)
  }, [copied, timeout])

  return { copied, copy }
}

/**
 * Scrolls to a section and records it in the URL. The offset comes from CSS
 * `scroll-padding-top`, so the fixed navbar is accounted for at every
 * breakpoint; lib/scroll.js picks smooth or native scrolling.
 */
export function scrollToSection(event, id) {
  event?.preventDefault()
  const target = document.getElementById(id)
  if (!target) {
    // Clicked before the sections below the hero have mounted (App.jsx).
    sectionsReady.then(() => document.getElementById(id) && scrollToSection(null, id))
    return
  }

  scrollToTarget(id === 'home' ? 0 : target)

  const { pathname, search } = window.location
  window.history.replaceState(null, '', id === 'home' ? pathname + search : `#${id}`)
}

/** Locks body scroll while a modal or drawer is open. */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Lenis scrolls the page itself, so the overflow lock alone doesn't stop it.
    setScrollLocked(true)
    return () => {
      document.body.style.overflow = original
      setScrollLocked(false)
    }
  }, [locked])
}

// One MediaQueryList per query, shared by every component that asks.
const queries = new Map()
function mediaQueryList(query) {
  if (!queries.has(query)) queries.set(query, window.matchMedia(query))
  return queries.get(query)
}

/** Live result of a CSS media query. */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = mediaQueryList(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query]
  )
  return useSyncExternalStore(subscribe, () => mediaQueryList(query).matches)
}

/** True for a mouse or trackpad: the devices cursor effects are built for. */
export function useFinePointer() {
  return useMediaQuery(FINE_POINTER)
}

/**
 * The visitor's reduced-motion setting, live. Used instead of Motion's own
 * hook, which doesn't follow changes mid-visit and logs a warning in dev.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** Smooths wheel scrolling with Lenis. Touch and reduced motion stay native. */
export function useSmoothScroll() {
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!fine || reduced) return
    return startSmoothScroll()
  }, [fine, reduced])
}

/** The current theme, 'light' or 'dark', live. */
export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme)
}
