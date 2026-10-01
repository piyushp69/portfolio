import { useEffect, useRef, useState } from 'react'
import { observeInView } from '../lib/inView'
import { usePrefersReducedMotion } from './usePortfolio'

// "Near": within a screen's height below the viewport.
const NEAR = { rootMargin: '0px 0px 100% 0px' }

/**
 * "visible" while the element is on screen (at least `amount` of it). When it
 * leaves through the bottom (the visitor scrolled back up) it goes back to
 * "hidden"; leaving through the top (scrolled past it going down) it stays
 * "visible", so it doesn't replay when scrolled back to.
 *
 * Every pop on the page shares one IntersectionObserver per `amount`, and
 * reads which way an element left from the observer's own entry, so nothing
 * measures the page.
 *
 * `idle` is true while a hidden element is still far from the screen. Its
 * starting blur and offset (popWord / popBox) would cost the browser work on
 * every frame for something invisible, so PopText and PopBox add the
 * `pop-idle` class, which sets them aside (index.css). It goes as the
 * element comes near, before it pops, so the pop itself is unchanged.
 *
 * Returns [ref, state, reduced, idle]. With reduced motion it's always
 * "visible".
 */
export default function useScrollPop(amount = 0.25) {
  const ref = useRef(null)
  const reduced = usePrefersReducedMotion()
  const [state, setState] = useState('hidden')
  const [near, setNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const stopNear = observeInView(element, (entry) => setNear(entry.isIntersecting), NEAR)
    const stopPop = observeInView(
      element,
      (entry) => {
        if (entry.isIntersecting) setState('visible')
        // Left through the bottom => the visitor scrolled up => vanish.
        else if (entry.boundingClientRect.top > 0) setState('hidden')
      },
      { threshold: amount }
    )
    return () => {
      stopNear()
      stopPop()
    }
  }, [amount])

  if (reduced) return [ref, 'visible', true, false]
  return [ref, state, false, state === 'hidden' && !near]
}
