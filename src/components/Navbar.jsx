import { useEffect, useState } from 'react'
import { m, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import Icon from './Icon'
import { MagneticLink } from './Section'
import ThemeToggle from './ThemeToggle'
import { navLinks, profile } from '../data/portfolio'
import { SPRING, navSlide, spring } from '../lib/motion'
import { isNavigating, scrollToTarget } from '../lib/scroll'
import { sectionsReady } from '../lib/sections'
import {
  scrollToSection,
  useBodyScrollLock,
  usePrefersReducedMotion,
  useScrollSpy,
} from '../hooks/usePortfolio'
import { usePress } from '../hooks/usePointerEffects'

const sectionIds = navLinks.map((link) => link.id)

// Width above which the full link bar replaces the drawer (matches index.css).
const DRAWER_MAX_WIDTH = 1140

// The bar always shows this close to the top, and ignores smaller scroll
// jitters when deciding to hide or reappear. Past SCROLLED it turns solid.
const ALWAYS_SHOWN_ABOVE = 160
const SCROLL_JITTER = 4
const SCROLLED = 24

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > SCROLLED)
  const activeId = useScrollSpy(sectionIds)
  const reduced = usePrefersReducedMotion()
  const pressable = usePress()
  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, SPRING.progress)

  useBodyScrollLock(open)

  // Hide while reading down the page, come back on the first scroll up. Stay
  // put near the top and while a nav link is carrying the visitor somewhere.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > SCROLLED)
    const delta = y - (scrollY.getPrevious() ?? y)
    if (y < ALWAYS_SHOWN_ABOVE || isNavigating()) setHidden(false)
    else if (delta > SCROLL_JITTER) setHidden(true)
    else if (delta < -SCROLL_JITTER) setHidden(false)
  })

  // Sections render after the browser's own jump to the URL hash, so honour
  // shared deep links like /#projects once they exist (sectionsReady).
  // Waiting for the web fonts keeps the late text reflow from pushing the
  // section off target.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    Promise.all([document.fonts.ready, sectionsReady]).then(() => {
      const target = document.getElementById(id)
      if (target) scrollToTarget(target, { immediate: true })
    })
  }, [])

  // Close the drawer on Escape or once the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onResize = () => window.innerWidth > DRAWER_MAX_WIDTH && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const go = (event, id) => {
    setOpen(false)
    setHidden(false)
    scrollToSection(event, id)
  }

  return (
    <>
      {/* layoutRoot: the active pill measures itself against the fixed bar,
          not the scrolling page. */}
      <m.header
        className={`nav ${scrolled ? 'nav--scrolled' : ''}`.trim()}
        layoutRoot
        // Slides down on first load, the opening step of the hero sequence.
        initial={reduced ? false : { y: '-100%' }}
        animate={{ y: hidden && !open ? '-100%' : '0%' }}
        transition={navSlide}
        // Keyboard users tabbing into a hidden bar should see where they are.
        onFocusCapture={() => setHidden(false)}
      >
        <div className="container nav__inner">
          <a href="#home" className="nav__brand" onClick={(e) => go(e, 'home')}>
            <span className="nav__mark">PP</span>
            <span>
              {profile.name}
              <span className="nav__brand-sub">{profile.role}</span>
            </span>
          </a>

          <nav className="nav__links" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => go(e, link.id)}
                className={`nav__link ${activeId === link.id ? 'is-active' : ''}`.trim()}
                aria-current={activeId === link.id ? 'page' : undefined}
              >
                {activeId === link.id && (
                  <m.span className="nav__pill" layoutId="nav-pill" transition={spring} />
                )}
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <ThemeToggle />

            {/* Neutral, so the hero's call to action is the one honey
                button in the first view. */}
            <MagneticLink
              className="btn btn--ghost btn--sm"
              href={profile.resume}
              download="Piyush_Priyanshu_Resume.pdf"
            >
              <Icon name="download" size={15} />
              Resume
            </MagneticLink>

            <button
              type="button"
              className={`nav__toggle ${open ? 'is-open' : ''}`.trim()}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Sits just below the bar, so it stays pinned to the top of the
            viewport while the bar itself is hidden. */}
        <m.span
          className="nav__progress"
          style={{ scaleX: reduced ? scrollYProgress : smoothProgress }}
          aria-hidden="true"
        />
      </m.header>

      {open && (
        <>
          <div
            className="nav__overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="nav__drawer glass-strong"
            id="mobile-menu"
            aria-label="Mobile"
            data-lenis-prevent
          >
            {navLinks.map((link, i) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => go(e, link.id)}
                className={`nav__drawer-link ${
                  activeId === link.id ? 'is-active' : ''
                }`.trim()}
              >
                {link.label}
                {/* Same numbering as the section labels: Home 00, About 01... */}
                <span className="nav__drawer-index">{String(i).padStart(2, '0')}</span>
              </a>
            ))}
            <m.a
              className="btn btn--primary nav__drawer-cta"
              href={profile.resume}
              download="Piyush_Priyanshu_Resume.pdf"
              onClick={() => setOpen(false)}
              {...pressable}
            >
              <Icon name="download" size={16} />
              Download Resume
            </m.a>
          </nav>
        </>
      )}
    </>
  )
}
