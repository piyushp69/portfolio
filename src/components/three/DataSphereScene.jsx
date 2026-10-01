import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, shaderMaterial } from '@react-three/drei'
import { AdditiveBlending, Color, LinearSRGBColorSpace, MathUtils, NormalBlending } from 'three'
import { buildSphere } from './sphereGeometry'
import { subscribePointer } from '../../lib/pointer'

// Loaded on demand by DataSphere.jsx: this file, React Three Fiber and three
// are one lazy chunk that only downloads when the About section is close.

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

const DotsMaterial = shaderMaterial(
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

// The highlight nodes: bigger points with a bright core and a wide halo.
// Each one pulses (size and brightness ±uPulse) on its own phase and speed,
// so they never blink in step.
const HighlightsMaterial = shaderMaterial(
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

// Links take their end's tone: plain links stay as they were, and a link
// touching a highlight starts in its colour and fades to plain.
const LinksMaterial = shaderMaterial(
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

extend({ DotsMaterial, HighlightsMaterial, LinksMaterial })

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

function Sphere({ count, theme, interactive, still, scatter }) {
  const tilt = useRef(null)
  const spin = useRef(null)
  const dots = useRef(null)
  const glow = useRef(null)
  const links = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const dpr = useThree((state) => state.viewport.dpr)
  const { points, highlights, lines } = useMemo(() => buildSphere(count), [count])
  const palette = PALETTE[theme]

  useEffect(
    () => () => {
      points.dispose()
      highlights.dispose()
      lines.dispose()
    },
    [points, highlights, lines]
  )

  // Mouse parallax: where the pointer is across the window, -1..1, read
  // from the page's shared pointer listener.
  useEffect(() => {
    if (!interactive) return
    const unsubscribe = subscribePointer(({ moved, x, y }) => {
      if (!moved) return
      pointer.current.x = (x / window.innerWidth) * 2 - 1
      pointer.current.y = (y / window.innerHeight) * 2 - 1
    })
    return () => {
      unsubscribe()
      pointer.current = { x: 0, y: 0 }
    }
  }, [interactive])

  useFrame((_, delta) => {
    if (still) return
    const dt = Math.min(delta, 0.05)
    spin.current.rotation.y += dt * SPIN
    // Ease toward the pointer's tilt at the same rate at any frame rate.
    const ease = 1 - Math.pow(0.02, dt)
    tilt.current.rotation.x = MathUtils.lerp(tilt.current.rotation.x, pointer.current.y * MAX_TILT, ease)
    tilt.current.rotation.y = MathUtils.lerp(tilt.current.rotation.y, pointer.current.x * MAX_TILT, ease)
    const amount = scatter?.get() ?? 0
    dots.current.uScatter = amount
    glow.current.uScatter = amount
    links.current.uScatter = amount
    glow.current.uTime += dt
  })

  return (
    <group ref={tilt}>
      {/* A slight starting angle, so the static frame isn't pole-on. */}
      <group ref={spin} rotation={[0.35, 0.6, 0]}>
        <points geometry={points}>
          <dotsMaterial
            ref={dots}
            transparent
            depthWrite={false}
            blending={palette.blending}
            uPixelRatio={dpr}
            uSize={palette.size}
            uOpacity={palette.dots}
            uColorA={palette.a}
            uColorB={palette.b}
          />
        </points>
        <lineSegments geometry={lines}>
          <linksMaterial
            ref={links}
            transparent
            depthWrite={false}
            blending={palette.blending}
            uColor={palette.line}
            uOpacity={palette.links}
            uColorA={palette.green}
            uColorB={palette.cyan}
          />
        </lineSegments>
        {/* Drawn last, so the highlights sit over the dots and links. */}
        <points geometry={highlights} renderOrder={1}>
          <highlightsMaterial
            ref={glow}
            transparent
            depthWrite={false}
            blending={palette.blending}
            uPixelRatio={dpr}
            uSize={palette.size}
            uPulse={still ? 0 : PULSE}
            uCore={palette.core}
            uHalo={palette.halo}
            uHot={palette.hot}
            uColorA={palette.green}
            uColorB={palette.cyan}
          />
        </points>
      </group>
    </group>
  )
}

/**
 * The data sphere's canvas. `active` runs the render loop (on screen, motion
 * allowed); otherwise it renders on demand, which for reduced motion means a
 * single still frame.
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
  const [maxDpr, setMaxDpr] = useState(1.5)

  return (
    <Canvas
      className="sphere__canvas"
      // Decorative: the page's pointer handling stays with the page.
      style={{ pointerEvents: 'none' }}
      // Size from layout, not the on-screen box: the card around it scales
      // as it pops in, and that mustn't shrink the drawing buffer.
      resize={{ offsetSize: true }}
      dpr={[1, maxDpr]}
      frameloop={active ? 'always' : 'demand'}
      camera={{ position: [0, 0, 4.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={onReady}
    >
      {/* Drops to 1x pixels if the frame rate sags. */}
      <PerformanceMonitor onDecline={() => setMaxDpr(1)} onIncline={() => setMaxDpr(1.5)} />
      <Sphere
        count={count}
        theme={theme}
        interactive={interactive}
        still={still}
        scatter={scatter}
      />
    </Canvas>
  )
}
