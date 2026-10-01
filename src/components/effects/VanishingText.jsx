import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { VANISH } from '../../lib/motion'
import { usePrefersReducedMotion } from '../../hooks/usePortfolio'
import { measureInline, vanishText } from './particles'

/**
 * Cycles through `words`: each types in a character at a time behind a
 * blinking caret, holds, then dissolves into particles in its own colour
 * before the next one types in. With reduced motion, whole words cross-fade.
 *
 * `before(word)` renders anything that depends on the current word (the
 * hero's "a" / "an"). `paused` holds it where it is (the hero pauses it while
 * scrolled away). Screen readers get the current word as plain text, not a
 * live region, which would announce every change; the typed copy and the
 * particle canvas are hidden from them.
 */
export default function VanishingText({ words, before, className, paused = false }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('type') // type -> hold -> vanish -> (next word) type
  const wrap = useRef(null)
  const text = useRef(null)
  const canvas = useRef(null)
  const word = words[index]

  // The full motion version.
  const run = useRef(null)
  useEffect(() => {
    if (reduced || paused) return
    let timer
    if (phase === 'type') {
      timer =
        count < word.length
          ? setTimeout(() => setCount((c) => c + 1), VANISH.typeMs)
          : setTimeout(() => setPhase('hold'), 0)
      return () => clearTimeout(timer)
    }
    if (phase === 'hold') {
      timer = setTimeout(() => {
        // Measure the word while it's still on screen, hand it to the
        // particles, and let it go (the caret then waits at the start).
        run.current = vanishText(canvas.current, {
          ...measureInline(text.current, wrap.current),
          duration: VANISH.vanishMs,
        })
        setPhase('vanish')
      }, VANISH.holdMs)
      return () => clearTimeout(timer)
    }
    // Vanishing: once the particles are gone, the next word types in.
    let live = true
    run.current?.done.then(() => {
      if (!live) return
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setCount(0)
        setPhase('type')
      }, VANISH.gapMs)
    })
    return () => {
      live = false
      clearTimeout(timer)
      run.current?.cancel()
    }
  }, [reduced, paused, phase, count, word, words.length])

  // Reduced motion: the whole word, swapped with a short cross-fade (opacity
  // only, through the Web Animations API so the stylesheet's reduced-motion
  // rule doesn't flatten it).
  useEffect(() => {
    if (!reduced || paused) return
    let fade
    const timer = setTimeout(() => {
      fade = text.current.animate({ opacity: [1, 0] }, { duration: VANISH.crossfadeMs, fill: 'forwards' })
      fade.onfinish = () => setIndex((i) => (i + 1) % words.length)
    }, VANISH.reducedHoldMs)
    return () => {
      clearTimeout(timer)
      if (fade) fade.onfinish = null
    }
  }, [reduced, paused, index, words.length])

  const shownOnce = useRef(false)
  useLayoutEffect(() => {
    if (!reduced) return
    const el = text.current
    el.getAnimations().forEach((animation) => animation.cancel())
    // The first word is simply there; later ones fade in.
    if (shownOnce.current) el.animate({ opacity: [0, 1] }, { duration: VANISH.crossfadeMs })
    shownOnce.current = true
  }, [reduced, index])

  const shown = reduced ? word : phase === 'vanish' ? '' : word.slice(0, count)

  return (
    <>
      {before?.(word)}
      <span className="vanish" ref={wrap}>
        <span className="sr-only">{word}</span>
        <span className={className} aria-hidden="true">
          <span ref={text}>{shown}</span>
          <span className="hero__caret" />
        </span>
        <canvas ref={canvas} className="vanish__canvas" aria-hidden="true" />
      </span>
    </>
  )
}
