import { Reveal } from './Section'

/**
 * A slow, endless row of tool names. Two identical copies scroll by half the
 * track, so the loop has no seam; the edges fade out and hovering pauses it.
 * Decorative (the Skills section lists the tools), so hidden from assistive
 * tech. With reduced motion it stands still and wraps instead (index.css).
 */
export default function Marquee({ items }) {
  return (
    <Reveal className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul className={`marquee__group ${copy ? 'marquee__group--clone' : ''}`.trim()} key={copy}>
            {items.map((item) => (
              <li className="marquee__item" key={item}>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Reveal>
  )
}
