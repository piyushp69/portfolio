import { useEffect, useRef } from 'react'
import { followCursorGlow } from '../../hooks/usePointerEffects'
import {
  useFinePointer,
  useMediaQuery,
  usePrefersReducedMotion,
  useTheme,
} from '../../hooks/usePortfolio'

// Square cells, px.
const CELL_SIZE = { desktop: 180, tablet: 120, mobile: 90 }
// Seconds for one pass across the page; phones get a slower one.
const SWEEP_DURATION = { desktop: 3.5, mobile: 5 }
// The lit grid per theme: its lines, the soft glow either side of them (and
// around the dots), and the dots at the corners. White on the dark page; on
// the light one white wouldn't show, so a soft neutral grey, its glow and
// dots in the same proportions as the dark theme's.
const SWEEP_COLOR = {
  dark: {
    line: 'rgba(255, 255, 255, 0.45)',
    glow: 'rgba(255, 255, 255, 0.35)',
    dot: 'rgba(255, 255, 255, 0.8)',
  },
  light: {
    line: 'rgba(40, 40, 40, 0.25)',
    glow: 'rgba(40, 40, 40, 0.19)',
    dot: 'rgba(40, 40, 40, 0.44)',
  },
}

// A prop given either as one value or per screen size.
const pick = (value, size) => (typeof value === 'object' ? (value[size] ?? value.desktop) : value)

/**
 * The page's grid: big faint squares fixed behind everything (over the
 * ambient orbs, under the cursor glow and the content), with a band of light
 * sweeping across it from left to right, one pass after another with a
 * short pause between. Near the mouse the lines brighten a little.
 *
 * Nothing here repaints while it runs. The light is a second, brighter copy
 * of the grid inside a masked band: the band slides across with `transform`
 * while the copy inside slides the other way by the same amount, so the lit
 * lines stay exactly over the faint ones and only the band moves. The glow
 * under the mouse works the same way, following the page's cursor glow.
 *
 * The sweep stops while the tab is hidden, and with reduced motion only the
 * still grid shows. Phones get a slower sweep without the glow around the
 * lines.
 *
 * `cellSize` and `sweepDuration` take a number, or one per screen size
 * ({ desktop, tablet, mobile }; tablet falls back to desktop). Durations are
 * in seconds: `pauseDuration` between passes, `startDelay` before the first.
 * `sweepColor` gives { line, glow, dot } per theme. `bandWidth` is the share
 * of the viewport width the band covers.
 */
export default function GridSweep({
  cellSize = CELL_SIZE,
  sweepDuration = SWEEP_DURATION,
  pauseDuration = 1,
  startDelay = 0,
  sweepColor = SWEEP_COLOR,
  bandWidth = 0.35,
}) {
  const band = useRef(null)
  const lit = useRef(null)
  const near = useRef(null)
  const nearGrid = useRef(null)
  const mobile = useMediaQuery('(max-width: 767px)')
  const tablet = useMediaQuery('(max-width: 1023px)')
  const size = mobile ? 'mobile' : tablet ? 'tablet' : 'desktop'
  const reduced = usePrefersReducedMotion()
  const fine = useFinePointer()
  const theme = useTheme()
  const color = sweepColor[theme]
  const sweepMs = pick(sweepDuration, size) * 1000
  const pauseMs = pauseDuration * 1000
  const startMs = startDelay * 1000

  useEffect(() => {
    if (reduced) return
    const bandEl = band.current
    const litEl = lit.current
    let timer = 0
    let frame = 0
    let running = []

    const pass = () => {
      // From just off the left edge to just off the right.
      const from = -bandEl.offsetWidth
      const to = window.innerWidth
      const timing = { duration: sweepMs, easing: 'ease-in-out' }
      running = [
        bandEl.animate({ transform: [`translate3d(${from}px, 0, 0)`, `translate3d(${to}px, 0, 0)`] }, timing),
        litEl.animate({ transform: [`translate3d(${-from}px, 0, 0)`, `translate3d(${-to}px, 0, 0)`] }, timing),
      ]
      // Both start on this frame, so the lit copy never drifts. (Inside an
      // animation frame the timeline's time is this frame's; outside one,
      // during page load, it can be a frame drawn long before, and the pass
      // would start partway across.)
      const start = document.timeline.currentTime
      if (start !== null) running.forEach((animation) => (animation.startTime = start))
      running[0].finished.then(
        () => (timer = setTimeout(sweep, pauseMs)),
        () => {} // cancelled
      )
    }
    const sweep = () => {
      frame = requestAnimationFrame(pass)
    }

    const stop = () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      running.forEach((animation) => animation.cancel())
      running = []
    }
    // A hidden tab drops the pass in progress; the next one starts a pause
    // after the tab is back.
    const onVisibility = () => {
      stop()
      if (!document.hidden) timer = setTimeout(sweep, pauseMs)
    }

    // The first pass starts as soon as the page is up: the band waits off
    // screen and eases in, so it never pops into view.
    if (!document.hidden) timer = setTimeout(sweep, startMs)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced, sweepMs, pauseMs, startMs])

  // The brighter grid under the mouse: the disc moves to the glow, and the
  // grid inside moves back, so its lines stay over the page grid's.
  useEffect(() => {
    if (!fine) return
    return followCursorGlow((x, y) => {
      if (!near.current) return
      near.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      nearGrid.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`
    })
  }, [fine])

  return (
    <div
      className={`grid-sweep ${mobile ? 'grid-sweep--plain' : ''}`.trim()}
      style={{
        '--gs-cell': `${pick(cellSize, size)}px`,
        '--gs-band': `${bandWidth * 100}vw`,
        '--gs-sweep-line': color.line,
        '--gs-sweep-glow': color.glow,
        '--gs-sweep-dot': color.dot,
      }}
      aria-hidden="true"
    >
      <div className="grid-sweep__grid grid-sweep__grid--base" />
      {!reduced && (
        <div className="grid-sweep__band" ref={band}>
          <div className="grid-sweep__grid grid-sweep__grid--lit" ref={lit} />
        </div>
      )}
      {fine && (
        <div className="grid-sweep__near" ref={near}>
          <div className="grid-sweep__grid grid-sweep__grid--near" ref={nearGrid} />
        </div>
      )}
    </div>
  )
}
