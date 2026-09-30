import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Adds `.is-visible` to an element the first time it scrolls into view.
 * Falls back to visible immediately when IntersectionObserver is missing.
 */
export function useReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}

/** Tracks which section id is currently in the viewport. */
export function useScrollSpy(ids, offset = 120) {
  const [activeId, setActiveId] = useState(ids[0])

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY
      let current = ids[0]

      ids.forEach((id) => {
        const el = document.getElementById(id)
        if (el && el.offsetTop - offset <= scrollY) current = id
      })

      // Pin the last section once the page is scrolled to the bottom.
      if (window.innerHeight + scrollY >= document.body.scrollHeight - 12) {
        current = ids[ids.length - 1]
      }

      setActiveId(current)
    }

    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [ids, offset])

  return activeId
}

/** Returns scroll progress through the document, 0 → 1. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handler = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0)
    }

    handler()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return progress
}

/** True once the page is scrolled past `threshold` pixels. */
export function useScrolledPast(threshold = 40) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const handler = () => setPast(window.scrollY > threshold)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [threshold])

  return past
}

/** Cycles through phrases with a typewriter effect. */
export function useTypewriter(words, { typeSpeed = 85, deleteSpeed = 40, pause = 1800 } = {}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setText(words[0])
      return
    }

    const word = words[index % words.length]
    let delay = deleting ? deleteSpeed : typeSpeed

    if (!deleting && text === word) {
      delay = pause
    } else if (deleting && text === '') {
      delay = 320
    }

    const timer = setTimeout(() => {
      if (!deleting && text === word) {
        setDeleting(true)
      } else if (deleting && text === '') {
        setDeleting(false)
        setIndex((i) => (i + 1) % words.length)
      } else {
        setText(
          deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)
        )
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [text, deleting, index, words, typeSpeed, deleteSpeed, pause])

  return text
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
 * Scrolls to a section and records it in the URL. Leaves the offset and the
 * smoothness to CSS (`scroll-padding-top` and `scroll-behavior`), so the fixed
 * navbar is accounted for at every breakpoint and reduced motion is respected.
 */
export function scrollToSection(event, id) {
  event?.preventDefault()
  const target = document.getElementById(id)
  if (!target) return

  if (id === 'home') window.scrollTo({ top: 0 })
  else target.scrollIntoView()

  const { pathname, search } = window.location
  window.history.replaceState(null, '', id === 'home' ? pathname + search : `#${id}`)
}

// Elements that get the bubble hover. Keep in sync with the "Bubble hover"
// selector list in styles/index.css.
export const BUBBLE_SELECTOR = [
  '.btn',
  '.tab',
  '.nav__link',
  '.icon-link',
  '.skill-pill',
  '.contact-card__copy',
  '.card',
  '.stat',
  '.about__facts',
  '.about__cta',
].join(', ')

/**
 * Direction-aware "bubble" hover: a circle grows from the point where the
 * pointer enters an element and shrinks back out through the point where it
 * leaves. Sets `--bubble-x/y/radius` plus `.is-bubbling`; CSS draws the rest.
 * Only runs for mouse-like pointers, so touch devices keep plain tap styles.
 */
export function useBubbleHover(selector = BUBBLE_SELECTOR) {
  useEffect(() => {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return

    const place = (el, event) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--bubble-x', `${event.clientX - r.left}px`)
      el.style.setProperty('--bubble-y', `${event.clientY - r.top}px`)
      // The diagonal covers the whole element from any origin, so moving the
      // origin to the exit point never exposes an unfilled corner.
      el.style.setProperty('--bubble-radius', `${Math.ceil(Math.hypot(r.width, r.height))}px`)
    }

    // pointerover/out bubble up, so one listener covers every element. Each
    // bubble ancestor the pointer actually crossed into (or out of) is updated.
    const handle = (entering) => (event) => {
      let el = event.target.closest?.(selector)
      while (el) {
        if (!el.contains(event.relatedTarget)) {
          place(el, event)
          el.classList.toggle('is-bubbling', entering)
        }
        el = el.parentElement?.closest(selector)
      }
    }

    const onOver = handle(true)
    const onOut = handle(false)
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
    }
  }, [selector])
}

/** Locks body scroll while a modal or drawer is open. */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}
