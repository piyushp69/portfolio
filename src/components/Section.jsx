import { m } from 'motion/react'
import PopText from './effects/PopText'
import { navLinks } from '../data/portfolio'
import { fadeUp, VIEWPORT } from '../lib/motion'
import { useMagnetic, usePress } from '../hooks/usePointerEffects'
import { usePrefersReducedMotion } from '../hooks/usePortfolio'

/**
 * Fades its children in, rising 24px, the first time 20% of it is on screen.
 * `variants` come from lib/motion.js; `delay` is in ms. Child Motion elements
 * that only set `variants` follow along, which is how staggered groups work.
 * With reduced motion it renders in place, so there is nothing to reveal.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  variants = fadeUp,
  className,
  children,
  ...rest
}) {
  const reduced = usePrefersReducedMotion()
  const Tag = m[as]
  return (
    <Tag
      className={className}
      variants={variants}
      custom={delay / 1000}
      initial={reduced ? false : 'hidden'}
      whileInView="show"
      viewport={VIEWPORT}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * The cursor-following glow inside a `data-spotlight` card, and the light on
 * its border, which also catches the pointer when it's over a neighbouring
 * card. Render it as the card's first child; useSpotlight() drives it.
 */
export function Spotlight() {
  return (
    <span className="spotlight" aria-hidden="true">
      <span className="spotlight__fill" />
      <span className="spotlight__rim">
        <span />
      </span>
    </span>
  )
}

/**
 * The specular highlight on a tilting surface: pass useTilt()'s `glare`.
 * Render it as the surface's last child; it's clipped to its corners.
 */
export function Glare({ style }) {
  return (
    <span className="tilt-glare" aria-hidden="true">
      <m.span style={style} />
    </span>
  )
}

/** A button-link that leans up to 6px toward the mouse while hovered. */
export function MagneticLink({ className, children, ...rest }) {
  const { style, onPointerMove, onPointerLeave } = useMagnetic()
  const pressable = usePress()
  return (
    <m.a
      className={className}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...pressable}
      {...rest}
    >
      {children}
    </m.a>
  )
}

// "01 / About": the section's place in the page, taken from the nav order
// (Home is 00).
function sectionLabel(id) {
  const index = navLinks.findIndex((link) => link.id === id)
  if (index < 0) return null
  return `${String(index).padStart(2, '0')} / ${navLinks[index].label}`
}

/** Label, heading and subtitle: each pops in word by word (PopText). */
function SectionHead({ id, title, subtitle }) {
  const label = sectionLabel(id)
  return (
    <div className="section__head">
      {label && <PopText className="section__label" text={label} />}
      <PopText as="h2" className="section__title" text={title} />
      {subtitle && <PopText className="section__subtitle" text={subtitle} />}
    </div>
  )
}

export default function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="section">
      <div className="container">
        <SectionHead id={id} title={title} subtitle={subtitle} />
        {children}
      </div>
    </section>
  )
}
