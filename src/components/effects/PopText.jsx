import { Fragment } from 'react'
import { m } from 'motion/react'
import useScrollPop from '../../hooks/useScrollPop'
import { popText, popWord } from '../../lib/motion'

/**
 * Text whose words pop in one by one (easing from small and blurred to full
 * size and sharp, never past it) as it scrolls into view, and vanish in
 * reverse order when it leaves through the bottom of the screen. The whole
 * text is kept for screen readers; the popping words are hidden from them.
 */
export default function PopText({ text, as = 'p', className = '' }) {
  const [ref, state, reduced, idle] = useScrollPop(0.15)
  const Tag = m[as]
  const words = text.split(' ')

  return (
    <Tag
      ref={ref}
      className={idle ? `${className} pop-idle`.trim() : className}
      variants={popText}
      initial={reduced ? false : 'hidden'}
      animate={state}
    >
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <Fragment key={i}>
          <m.span className="pop-word" aria-hidden="true" variants={popWord}>
            {w}
          </m.span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  )
}
