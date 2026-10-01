import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useInView, useScroll, useSpring, useTransform, useVelocity } from 'motion/react'
import {
  useFinePointer,
  useMediaQuery,
  usePrefersReducedMotion,
  useTheme,
} from '../../hooks/usePortfolio'

// The canvas, React Three Fiber and three.js live in their own chunk.
const loadScene = () => import('./DataSphereScene')
const DataSphereScene = lazy(loadScene)

/**
 * True once the visitor first interacts. At that moment the 3D chunk is also
 * fetched and parsed, once the browser is idle: evaluating three.js is one
 * long task, and this keeps it from landing mid-scroll as About comes into
 * view. Until then nothing 3D loads, so first load stays light.
 */
function useFirstInteraction() {
  const [interacted, setInteracted] = useState(false)

  useEffect(() => {
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown']
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1))
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout
    let handle
    const stop = () => events.forEach((type) => window.removeEventListener(type, first))
    const first = () => {
      stop()
      setInteracted(true)
      handle = idle(() => loadScene(), { timeout: 3000 })
    }
    events.forEach((type) => window.addEventListener(type, first, { passive: true }))
    return () => {
      stop()
      cancelIdle(handle)
    }
  }, [])

  return interacted
}

// Point counts: phones get a lighter sphere.
const POINTS = { desktop: 2600, mobile: 800 }

// If WebGL is unavailable the static placeholder simply stays.
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
 * the About section. It downloads only as the section comes close, pauses
 * whenever it's off screen, and shows a static gradient until it's ready.
 * Scrolling scatters the points outward; they settle back when scrolling
 * stops. With reduced motion it's a single still frame.
 */
export default function DataSphere() {
  const ref = useRef(null)
  const near = useInView(ref, { margin: '400px 0px' })
  const onScreen = useInView(ref)
  const interacted = useFirstInteraction()
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
      <div className="sphere__placeholder" />
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
