import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  Group,
  LinearSRGBColorSpace,
  LineSegments,
  MathUtils,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderer,
} from 'three'
import { buildSphere } from './sphereGeometry'
import { subscribePointer } from '../../lib/pointer'

// Loaded on demand by DataSphere.jsx: this file and the parts of three.js it
// uses are a lazy chunk, fetched once the page is idle or the About section
// is near. The scene is plain three.js, so only what it draws gets bundled.

/** A ShaderMaterial factory; each material gets its own copy of the uniforms. */
function shader(uniforms, vertexShader, fragmentShader) {
  const defaults = Object.fromEntries(Object.entries(uniforms).map(([key, value]) => [key, { value }]))
  return (options) =>
    new ShaderMaterial({ uniforms: UniformsUtils.clone(defaults), vertexShader, fragmentShader, ...options })
}

// Shared by points and links: each vertex moves out along its own radius by
// uScatter (driven by scroll speed), weighted by its seed, then fades with
// depth so the far side of the sphere recedes.
const DISPLACE = /* glsl */ `
  uniform float uScatter;
  attribute float aSeed;
  varying float vDepth;
  vec4 displaced() {
    vec3 p = position + normalize(position) * uScatter * (0.08 + aSeed * 0.32);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vDepth = smoothstep(-6.2, -3.0, view.z);
    return view;
  }
`

const DotsMaterial = shader(
  {
    uScatter: 0,
    uSize: 3.4,
    uPixelRatio: 1,
    uOpacity: 0.9,
    uColorA: new Color('#e3b26b'),
    uColorB: new Color('#d98c5f'),
  },
  /* glsl */ `
    ${DISPLACE}
    uniform float uSize;
    uniform float uPixelRatio;
    attribute float aMix;
    varying float vMix;
    void main() {
      vec4 view = displaced();
      gl_Position = projectionMatrix * view;
      gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed * 0.9) * (4.5 / -view.z);
      vMix = aMix;
    }
  `,
  /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    varying float vMix;
    varying float vDepth;
    void main() {
      // A soft round point: bright core, glowing falloff.
      float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
      gl_FragColor = vec4(mix(uColorA, uColorB, vMix), glow * glow * uOpacity * mix(0.22, 1.0, vDepth));
    }
  `
)

const HighlightsMaterial = shader(
  {
    uScatter: 0,
    uTime: 0,
    uPulse: 0.2,
    uSize: 3.4,
    uPixelRatio: 1,
    uCore: 1,
    uHalo: 0.5,
    uHot: 0.3,
    uColorA: new Color(),
    uColorB: new Color(),
  },
  /* glsl */ `
    ${DISPLACE}
    uniform float uTime;
    uniform float uPulse;
    uniform float uSize;
    uniform float uPixelRatio;
    attribute float aTone;
    attribute float aSize;
    attribute float aPhase;
    attribute float aSpeed;
    varying float vTone;
    varying float vPulse;
    void main() {
      vec4 view = displaced();
      gl_Position = projectionMatrix * view;
      vPulse = 1.0 + uPulse * sin(uTime * aSpeed + aPhase);
      // Twice the node's size: the core fills the middle, the halo the rest.
      gl_PointSize = uSize * uPixelRatio * aSize * 2.0 * vPulse * (4.5 / -view.z);
      vTone = aTone;
    }
  `,
  /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uCore;
    uniform float uHalo;
    uniform float uHot;
    varying float vTone;
    varying float vPulse;
    varying float vDepth;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      float core = 1.0 - smoothstep(0.08, 0.3, r);
      float halo = exp(-6.0 * r * r) * (1.0 - r);
      // A hot, near-white centre on the dark theme.
      vec3 color = mix(mix(uColorA, uColorB, vTone), vec3(1.0), core * uHot);
      float alpha = (core * uCore + halo * uHalo) * vPulse * mix(0.3, 1.0, vDepth);
      gl_FragColor = vec4(color, alpha);
    }
  `
)

const LinksMaterial = shader(
  {
    uScatter: 0,
    uColor: new Color('#e3b26b'),
    uOpacity: 0.12,
    uColorA: new Color(),
    uColorB: new Color(),
    uAccentOpacity: 0.25,
  },
  /* glsl */ `
    ${DISPLACE}
    uniform vec3 uColor;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uOpacity;
    uniform float uAccentOpacity;
    attribute float aTone;
    varying vec4 vColor;
    void main() {
      gl_Position = projectionMatrix * displaced();
      vColor = aTone < 0.5
        ? vec4(uColor, uOpacity)
        : vec4(aTone < 1.5 ? uColorA : uColorB, uAccentOpacity);
    }
  `,
  /* glsl */ `
    varying vec4 vColor;
    varying float vDepth;
    void main() {
      gl_FragColor = vec4(vColor.rgb, vColor.a * mix(0.12, 1.0, vDepth));
    }
  `
)

// The shaders write colour straight to the screen, so the highlight colours
// skip three's sRGB-to-linear conversion and show as their exact hex.
const exact = (hex) => new Color().setStyle(hex, LinearSRGBColorSpace)

// Honey blending to terracotta (the page's --accent and --accent-2), with
// green and cyan highlight nodes. On the dark page additive glows read as
// light, kept dim so overlapping points don't stack up into a neon glare; on
// a light page they would wash out to white, so the light theme blends
// normally with deeper shades and a fainter halo.
const PALETTE = {
  dark: {
    a: '#e3b26b',
    b: '#d98c5f',
    line: '#e3b26b',
    size: 3.6,
    dots: 0.55,
    links: 0.12,
    blending: AdditiveBlending,
    green: exact('#34d399'),
    cyan: exact('#22d3ee'),
    core: 0.9,
    halo: 0.55,
    hot: 0.3,
  },
  light: {
    a: '#9a6a2a',
    b: '#b4532a',
    line: '#9a6a2a',
    size: 3.4,
    dots: 0.75,
    links: 0.12,
    blending: NormalBlending,
    green: exact('#059669'),
    cyan: exact('#0891b2'),
    core: 0.95,
    halo: 0.3,
    hot: 0,
  },
}

const MAX_TILT = MathUtils.degToRad(15)
const SPIN = 0.07 // rad/s
const PULSE = 0.2 // highlight size and brightness swing, ±20%

// The drawing buffer's pixel ratio: the screen's, capped at 1.5, and 1 once
// the frame rate sags (sampled every 250ms; 3 of 4 samples in 10 decide).
const DPR_CAP = 1.5
const SAMPLE_MS = 250
const SAMPLES = 10

/**
 * Builds the sphere's renderer, camera and three layers (dots, links,
 * highlight nodes) in `host`, and returns the handles the component uses to
 * update it. Null when WebGL isn't available; the space then stays empty.
 */
function createSphere(host, { onFirstFrame, readScatter }) {
  const canvas = document.createElement('canvas')
  canvas.style.display = 'block'

  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  host.append(canvas)

  const camera = new PerspectiveCamera(42, 1, 0.1, 1000)
  camera.position.set(0, 0, 4.6)
  const scene = new Scene()
  const tilt = new Group()
  const spin = new Group()
  // A slight starting angle, so the static frame isn't pole-on.
  spin.rotation.set(0.35, 0.6, 0)
  tilt.add(spin)
  scene.add(tilt)

  const options = { transparent: true, depthWrite: false }
  const dotsMaterial = DotsMaterial(options)
  const linksMaterial = LinksMaterial(options)
  const glowMaterial = HighlightsMaterial(options)
  const dots = new Points(undefined, dotsMaterial)
  const lines = new LineSegments(undefined, linksMaterial)
  const glow = new Points(undefined, glowMaterial)
  // Drawn last, so the highlights sit over the dots and links.
  glow.renderOrder = 1
  spin.add(dots, lines, glow)
  const materials = [dotsMaterial, linksMaterial, glowMaterial]

  const pointer = { x: 0, y: 0 }
  let still = false
  let frame = 0
  let pending = 0
  let last = 0
  let first = true
  let maxDpr = DPR_CAP
  let unsubscribe = null

  const render = () => {
    renderer.render(scene, camera)
    if (first) {
      first = false
      onFirstFrame()
    }
  }

  // One frame of motion: the spin, the eased tilt toward the pointer, the
  // scroll scatter and the highlights' pulse clock.
  const step = (dt) => {
    if (still) return
    spin.rotation.y += dt * SPIN
    // Ease toward the pointer's tilt at the same rate at any frame rate.
    const ease = 1 - Math.pow(0.02, dt)
    tilt.rotation.x = MathUtils.lerp(tilt.rotation.x, pointer.y * MAX_TILT, ease)
    tilt.rotation.y = MathUtils.lerp(tilt.rotation.y, pointer.x * MAX_TILT, ease)
    const amount = readScatter()
    for (const material of materials) material.uniforms.uScatter.value = amount
    glowMaterial.uniforms.uTime.value += dt
  }

  const applyDpr = () => {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), maxDpr)
    renderer.setPixelRatio(dpr)
    dotsMaterial.uniforms.uPixelRatio.value = dpr
    glowMaterial.uniforms.uPixelRatio.value = dpr
  }

  let sampleStart = 0
  let sampleFrames = 0
  let samples = []
  const track = (now) => {
    if (!sampleStart) {
      sampleStart = now
      return
    }
    sampleFrames++
    if (now - sampleStart < SAMPLE_MS) return
    samples.push((sampleFrames * 1000) / (now - sampleStart))
    sampleStart = now
    sampleFrames = 0
    if (samples.length < SAMPLES) return
    const upper = Math.max(...samples) > 90 ? 90 : 60
    const share = (test) => samples.filter(test).length / samples.length
    const slow = share((fps) => fps < 50) >= 0.75
    const fast = share((fps) => fps >= upper) >= 0.75
    samples = []
    const next = slow ? 1 : fast ? DPR_CAP : maxDpr
    if (next === maxDpr) return
    maxDpr = next
    applyDpr()
  }

  const loop = (now) => {
    frame = requestAnimationFrame(loop)
    step(last ? Math.min((now - last) / 1000, 0.05) : 0)
    last = now
    render()
    track(now)
  }

  // Off screen (or with reduced motion) it draws only when something changes.
  const invalidate = () => {
    if (frame || pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      render()
    })
  }

  // Sized from layout, not the on-screen box: the card around it scales as
  // it pops in, and that mustn't shrink the drawing buffer. Whole CSS pixels,
  // so the canvas is never stretched across a fractional width.
  const resize = () => {
    const width = host.offsetWidth
    const height = host.offsetHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    invalidate()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  applyDpr()
  resize()

  return {
    setCount(count) {
      const geometry = buildSphere(count)
      for (const [object, next] of [
        [dots, geometry.points],
        [glow, geometry.highlights],
        [lines, geometry.lines],
      ]) {
        object.geometry.dispose()
        object.geometry = next
      }
      invalidate()
    },
    setTheme(theme) {
      const palette = PALETTE[theme]
      for (const material of materials) material.blending = palette.blending
      const dotsU = dotsMaterial.uniforms
      const linksU = linksMaterial.uniforms
      const glowU = glowMaterial.uniforms
      dotsU.uSize.value = palette.size
      dotsU.uOpacity.value = palette.dots
      dotsU.uColorA.value.set(palette.a)
      dotsU.uColorB.value.set(palette.b)
      linksU.uColor.value.set(palette.line)
      linksU.uOpacity.value = palette.links
      linksU.uColorA.value.copy(palette.green)
      linksU.uColorB.value.copy(palette.cyan)
      glowU.uSize.value = palette.size
      glowU.uCore.value = palette.core
      glowU.uHalo.value = palette.halo
      glowU.uHot.value = palette.hot
      glowU.uColorA.value.copy(palette.green)
      glowU.uColorB.value.copy(palette.cyan)
      invalidate()
    },
    setStill(value) {
      still = value
      glowMaterial.uniforms.uPulse.value = still ? 0 : PULSE
      invalidate()
    },
    // On screen with motion allowed, it draws every frame.
    setActive(active) {
      if (active && !frame) {
        last = 0
        sampleStart = 0
        sampleFrames = 0
        samples = []
        frame = requestAnimationFrame(loop)
      } else if (!active && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    },
    // Mouse parallax: where the pointer is across the window, -1..1, read
    // from the page's shared pointer listener.
    setInteractive(interactive) {
      unsubscribe?.()
      unsubscribe = null
      pointer.x = 0
      pointer.y = 0
      if (!interactive) return
      unsubscribe = subscribePointer(({ moved, x, y }) => {
        if (!moved) return
        pointer.x = (x / window.innerWidth) * 2 - 1
        pointer.y = (y / window.innerHeight) * 2 - 1
      })
    },
    dispose() {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(pending)
      observer.disconnect()
      unsubscribe?.()
      for (const object of [dots, lines, glow]) object.geometry.dispose()
      for (const material of materials) material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}

/**
 * The data sphere's canvas. `active` runs the render loop (on screen, motion
 * allowed); otherwise it draws only when something changes, which for
 * reduced motion means a single still frame. `onReady` fires once the first
 * frame is on the canvas.
 */
export default function DataSphereScene({
  count,
  theme,
  interactive,
  active,
  still,
  scatter,
  onReady,
}) {
  const host = useRef(null)
  const sphere = useRef(null)
  const latest = useRef({ scatter, onReady })

  useEffect(() => {
    latest.current = { scatter, onReady }
  })

  useEffect(() => {
    const handle = createSphere(host.current, {
      onFirstFrame: () => latest.current.onReady?.(),
      readScatter: () => latest.current.scatter?.get() ?? 0,
    })
    sphere.current = handle
    return () => {
      handle?.dispose()
      sphere.current = null
    }
  }, [])

  useEffect(() => sphere.current?.setCount(count), [count])
  useEffect(() => sphere.current?.setTheme(theme), [theme])
  useEffect(() => sphere.current?.setStill(still), [still])
  useEffect(() => sphere.current?.setInteractive(interactive), [interactive])
  useEffect(() => sphere.current?.setActive(active), [active])

  return (
    <div
      ref={host}
      className="sphere__canvas"
      // Decorative: the page's pointer handling stays with the page.
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}
