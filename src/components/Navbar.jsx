import { useEffect, useState } from 'react'
import Icon from './Icon'
import { navLinks, profile } from '../data/portfolio'
import {
  scrollToSection,
  useBodyScrollLock,
  useScrollProgress,
  useScrolledPast,
  useScrollSpy,
} from '../hooks/usePortfolio'

const sectionIds = navLinks.map((link) => link.id)

// Width above which the full link bar replaces the drawer (matches index.css).
const DRAWER_MAX_WIDTH = 1100

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const scrolled = useScrolledPast(24)
  const progress = useScrollProgress()
  const activeId = useScrollSpy(sectionIds)

  useBodyScrollLock(open)

  // Sections render after the browser's own jump to the URL hash, so honour
  // shared deep links like /#projects once they exist. Waiting for the web
  // fonts keeps the late text reflow from pushing the section off target.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    document.fonts.ready.then(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
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
    scrollToSection(event, id)
  }

  return (
    <>
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`.trim()}>
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
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <a
              className="btn btn--primary btn--sm"
              href={profile.resume}
              download="Piyush_Priyanshu_Resume.pdf"
            >
              <Icon name="download" size={15} />
              Resume
            </a>

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

        {scrolled && (
          <span
            className="nav__progress"
            style={{ transform: `scaleX(${progress})` }}
            aria-hidden="true"
          />
        )}
      </header>

      {open && (
        <>
          <div
            className="nav__overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="nav__drawer" id="mobile-menu" aria-label="Mobile">
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
                <span className="nav__drawer-index">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </a>
            ))}
            <a
              className="btn btn--primary nav__drawer-cta"
              href={profile.resume}
              download="Piyush_Priyanshu_Resume.pdf"
              onClick={() => setOpen(false)}
            >
              <Icon name="download" size={16} />
              Download Resume
            </a>
          </nav>
        </>
      )}
    </>
  )
}
