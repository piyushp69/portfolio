import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { observeInView } from '../../lib/inView'
import { PLACEHOLDER_MS, placeholderSwap } from '../../lib/motion'

/**
 * A placeholder for an empty field that changes every few seconds, each
 * phrase sliding up and out as the next slides in. It's decorative (the
 * field keeps its real label), so it's hidden from assistive tech. Shown
 * only while `active`; the rotation pauses otherwise, and while the field
 * is off screen.
 */
export default function CyclingPlaceholder({ phrases, active, className }) {
  const [index, setIndex] = useState(0)
  const [onScreen, setOnScreen] = useState(false)
  const ref = useRef(null)

  useEffect(() => observeInView(ref.current, (entry) => setOnScreen(entry.isIntersecting)), [])

  useEffect(() => {
    if (!active || !onScreen) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % phrases.length), PLACEHOLDER_MS)
    return () => clearInterval(timer)
  }, [active, onScreen, phrases.length])

  return (
    <span className={className} aria-hidden="true" ref={ref}>
      <AnimatePresence initial={false}>
        {active && (
          <m.span key={index} className="cycling-placeholder" {...placeholderSwap}>
            {phrases[index]}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  )
}
