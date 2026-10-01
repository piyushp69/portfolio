import { Fragment } from 'react'
import { m } from 'motion/react'
import { WORD_STAGGER, blurWord, stagger } from '../../lib/motion'

/**
 * A paragraph whose words sharpen into place one after another: each rises
 * 8px out of an 8px blur, 40ms after the previous one (`blurWord`). It
 * animates with its parent's "hidden" -> "show" variants, so it plays once,
 * whenever the Reveal or timeline around it does; `delay` (s) offsets it
 * within that. The words stay plain text, so the paragraph reads normally;
 * the blurred copies are hidden from assistive tech and end fully transparent.
 */
export default function BlurText({ as = 'p', text, delay = 0, className, ...rest }) {
  const Tag = m[as]
  const words = text.split(' ')

  return (
    <Tag className={className} variants={stagger(WORD_STAGGER, delay)} {...rest}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <m.span className="blur-word" variants={blurWord.rise}>
            <m.span variants={blurWord.sharp}>{word}</m.span>
            <m.span className="blur-word__soft" variants={blurWord.soft} aria-hidden="true">
              {word}
            </m.span>
          </m.span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  )
}
