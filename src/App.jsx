import { useEffect, useState } from 'react'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'
import Backdrop from './components/Backdrop'
import GridSweep from './components/effects/GridSweep'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Credentials from './components/Credentials'
import Education from './components/Education'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { ease } from './lib/motion'
import { markSectionsReady } from './lib/sections'
import { usePrefersReducedMotion, useSmoothScroll } from './hooks/usePortfolio'
import { useSpotlight } from './hooks/usePointerEffects'

// StrictMode runs effects twice in development; this keeps the log to one line.
let loggedMotionPreference = false

const BELOW_FOLD = [About, Skills, Projects, Experience, Credentials, Education, Contact]

// A visitor arriving at the top of the page sees only the hero, so the
// sections below mount one at a time, each in its own task, instead of all
// in the first render: the hero shows sooner and no single task lays out the
// whole page. Deep links, reloads and back/forward visits get the whole page
// at once, so the browser can jump to or restore a position in it.
const navigation = performance.getEntriesByType?.('navigation')[0]
const PROGRESSIVE = !window.location.hash && (!navigation || navigation.type === 'navigate')

function useMountedCount(total) {
  const [count, setCount] = useState(PROGRESSIVE ? 0 : total)

  useEffect(() => {
    if (count >= total) {
      markSectionsReady()
      return
    }
    // The first waits for the hero's first frame, so its paint never waits
    // on a section. The rest follow in tasks, not frames: during load the
    // browser produces frames irregularly, and waiting for each one held the
    // page back.
    let frame = 0
    let timer = 0
    const next = () => {
      timer = setTimeout(() => setCount((c) => c + 1))
    }
    if (count === 0) frame = requestAnimationFrame(next)
    else next()
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [count, total])

  return count
}

export default function App() {
  useSpotlight()
  useSmoothScroll()
  const reduced = usePrefersReducedMotion()
  const mounted = useMountedCount(BELOW_FOLD.length)

  // Development aid: whether the OS asks for reduced motion, which switches
  // the site's animations off (Windows: Settings > Accessibility > Visual
  // effects > Animation effects). Logged once per page load.
  useEffect(() => {
    if (!import.meta.env.DEV || loggedMotionPreference) return
    loggedMotionPreference = true
    console.info(`[portfolio] prefers-reduced-motion: ${reduced ? 'reduce (animations off)' : 'no-preference'}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // For visitors who ask for less motion, every Motion animation finishes
    // instantly, and reveals render already in place (see Reveal).
    <LazyMotion features={domMax} strict>
      <MotionConfig skipAnimations={reduced} transition={ease}>
        <Backdrop />
        <GridSweep />

        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <Navbar />

        <main id="main">
          <Hero />
          {BELOW_FOLD.slice(0, mounted).map((Section, i) => (
            <Section key={i} />
          ))}
        </main>

        {mounted === BELOW_FOLD.length && <Footer />}
        <ScrollToTop />
      </MotionConfig>
    </LazyMotion>
  )
}
