import { useRef } from 'react'
import { m, useInView, useScroll, useSpring } from 'motion/react'
import { Spotlight } from './Section'
import PopBox from './effects/PopBox'
import { SPRING } from '../lib/motion'
import { usePrefersReducedMotion } from '../hooks/usePortfolio'

/**
 * The vertical rail shared by Experience and Education. A faint track shows
 * the whole line; a brighter line draws down it as the timeline scrolls
 * through the viewport.
 */
export function Timeline({ children }) {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 60%'],
  })
  const drawn = useSpring(scrollYProgress, SPRING.progress)

  return (
    <div className="timeline" ref={ref}>
      <span className="timeline__track" aria-hidden="true" />
      <m.span
        className="timeline__line"
        style={{ scaleY: reduced ? 1 : drawn }}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

/** An entry that fades up into place; its dot lights up mid-screen. */
export function TimelineItem({ children }) {
  const ref = useRef(null)
  const lit = useInView(ref, { once: true, margin: '0px 0px -45% 0px' })

  return (
    <PopBox ref={ref} as="article" className="card glass timeline__item" data-spotlight>
      <Spotlight />
      <span className={`timeline__dot ${lit ? 'is-lit' : ''}`.trim()} aria-hidden="true" />
      {children}
    </PopBox>
  )
}
