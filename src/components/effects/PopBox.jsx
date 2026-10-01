import { useCallback, useMemo } from 'react'
import { m } from 'motion/react'
import useScrollPop from '../../hooks/useScrollPop'
import { popBox } from '../../lib/motion'

/**
 * A card or box that pops in (rising, growing and sharpening on a spring) as
 * it scrolls into view and vanishes when it leaves through the bottom of the
 * screen. `index` staggers boxes within a grid.
 *
 * Other props go straight to the element, so cards that already move keep
 * doing so alongside the pop: filter layout animations and exits, the 3D
 * tilt, click handlers. A `ref` passed in (AnimatePresence gives one) is
 * kept as well.
 */
export default function PopBox({ children, index = 0, className = '', as = 'div', ref: outerRef, ...rest }) {
  const [ref, state, reduced, idle] = useScrollPop(0.15)
  const Tag = m[as]
  const variants = useMemo(() => popBox(index), [index])

  const setRef = useCallback(
    (node) => {
      ref.current = node
      if (typeof outerRef === 'function') outerRef(node)
      else if (outerRef) outerRef.current = node
    },
    [ref, outerRef]
  )

  return (
    <Tag
      ref={setRef}
      className={idle ? `${className} pop-idle`.trim() : className}
      initial={reduced ? false : 'hidden'}
      animate={state}
      variants={variants}
      {...rest}
    >
      {children}
    </Tag>
  )
}
