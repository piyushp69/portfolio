import { AnimatePresence, m } from 'motion/react'
import Icon from './Icon'
import { scaleIn } from '../lib/motion'
import { scrollToTarget } from '../lib/scroll'
import { useScrolledPastElement } from '../hooks/usePortfolio'
import { usePress } from '../hooks/usePointerEffects'

/** Scales in once the hero has scrolled out of view, and back out above it. */
export default function ScrollToTop() {
  const visible = useScrolledPastElement('home')
  const pressable = usePress()

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          className="to-top glass-subtle"
          onClick={() => scrollToTarget(0)}
          aria-label="Back to top"
          variants={scaleIn}
          initial="hidden"
          animate="show"
          exit="hidden"
          {...pressable}
        >
          <Icon name="arrowUp" size={19} />
        </m.button>
      )}
    </AnimatePresence>
  )
}
