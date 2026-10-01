import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useInView, useScroll, useSpring, useTransform, useVelocity } from 'motion/react'
import {
  useFinePointer,
  useMediaQuery,
  usePrefersReducedMotion,
  useTheme,
} from '../../hooks/usePortfolio'
import { observeInView } from '../../lib/inView'
import { lazyWithPreload } from '../../lib/lazy'

// The canvas and the parts of three.js it uses live in their own chunk.
const [DataSphereScene, preloadScene] = lazyWithPreload(() => import('./DataSphereScene'))

/**
 * True once the visitor first interacts. Creating the WebGL canvas waits for
 * this (or for the sphere to be on screen), so a page that is only loaded,
 * never scrolled, doesn't start a renderer.
 */
function useFirstInteraction() {
  const [interacted, setInteracted] = useState(false)

  useEffect(() => {
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown']
    const stop = () => events.forEach((type) => window.removeEventListener(type, first))
    const first = () => {
      stop()
      setInteracted(true)
    }
    events.forEach((type) => window.addEventListener(type, first, { passive: true }))
    return stop
  }, [])

  return interacted
}

/**
 * Fetches the 3D code early, so it's usually ready before the visitor
 * reaches About: once the browser is idle after the hero has rendered (after
 * 1.5s where idle callbacks aren't supported), or as soon as the section is
 * within 1000px of the screen, whichever comes first.
 */
function usePreloadScene(ref) {
  useEffect(() => {
    const idle = window.requestIdleCallback?.(preloadScene)
    const timer = idle === undefined ? setTimeout(preloadScene, 1500) : 0
    const stop = observeInView(
      ref.current,
      (entry) => entry.isIntersecting && preloadScene(),
      { rootMargin: '1000px 0px' }
    )
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle)
      clearTimeout(timer)
      stop()
    }
  }, [ref])
}

// Point counts: phones get a lighter sphere.
const POINTS = { desktop: 2600, mobile: 800 }

// If the scene fails to load, the space simply stays empty.
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * A slowly turning sphere of data points, linked like a network graph, in
 * the About section. Its code is fetched early (usePreloadScene), it pauses
 * whenever it's off screen, and it fades in once its first frame is drawn.
 * Scrolling scatters the points outward; they settle back when scrolling
 * stops. With reduced motion it's a single still frame.
 */
export default function DataSphere() {
  const ref = useRef(null)
  const near = useInView(ref, { margin: '400px 0px' })
  const onScreen = useInView(ref)
  const interacted = useFirstInteraction()
  usePreloadScene(ref)
  // Mount the canvas once it's actually on screen, or once it's close and
  // the visitor is scrolling. Once mounted it stays; off screen it pauses.
  const [mounted, setMounted] = useState(false)
  if (!mounted && (onScreen || (near && interacted))) setMounted(true)
  const reduced = usePrefersReducedMotion()
  const mobile = useMediaQuery('(max-width: 767px)')
  const fine = useFinePointer()
  const theme = useTheme()
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  // Scatter follows scroll speed through this element's range: a quick
  // scroll pushes the points out, and the spring lets them settle back.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const speed = useVelocity(scrollYProgress)
  const scatter = useSpring(
    useTransform(speed, (v) => Math.min(Math.abs(v) * 0.9, 1)),
    { stiffness: 50, damping: 18 }
  )

  return (
    <div className={`sphere ${ready ? 'is-ready' : ''}`.trim()} ref={ref} aria-hidden="true">
      {mounted && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <DataSphereScene
              count={mobile ? POINTS.mobile : POINTS.desktop}
              theme={theme}
              interactive={fine && !mobile && !reduced}
              active={onScreen && !reduced}
              still={reduced}
              scatter={scatter}
              onReady={onReady}
            />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
