import { BufferGeometry, Float32BufferAttribute } from 'three'

// A seeded generator, so the sphere is the same on every load.
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Share of the points drawn as larger, glowing highlight nodes.
const HIGHLIGHT_SHARE = 0.12
// Tones per point: plain, or one of the two highlight colours.
const PLAIN = 0
const GREEN = 1
const CYAN = 2

/**
 * Picks HIGHLIGHT_SHARE of the points in a seeded random order, skipping any
 * that land too close to one already picked, so the highlights spread evenly
 * instead of clumping. Alternates green and cyan. Returns a tone per point.
 */
function pickHighlights(positions, count, radius, random) {
  const target = Math.round(count * HIGHLIGHT_SHARE)
  // Two thirds of the gap the highlights would have if perfectly even.
  const minGap = radius * Math.sqrt((4 * Math.PI) / target) * 0.65
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  const tones = new Uint8Array(count)
  const picked = []
  for (const i of order) {
    if (picked.length === target) break
    const [x, y, z] = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]
    const crowded = picked.some(
      (j) => Math.hypot(positions[j * 3] - x, positions[j * 3 + 1] - y, positions[j * 3 + 2] - z) < minGap
    )
    if (crowded) continue
    picked.push(i)
    tones[i] = picked.length % 2 ? GREEN : CYAN
  }
  return tones
}

/**
 * `count` points spread evenly over a sphere (a Fibonacci lattice), a few
 * floating just off the surface, plus thin links between near neighbours so
 * it reads as a network. About 12% of the points are highlight nodes.
 *
 * Returns three geometries:
 * - `points`, the plain dots. `aSeed` (0..1) varies size and scatter, `aMix`
 *   (0..1) blends the two theme colours from pole to pole.
 * - `highlights`, the highlight nodes. `aSeed` drives scatter, `aTone` picks
 *   green (0) or cyan (1), `aSize` is their size relative to a plain dot, and
 *   `aPhase` / `aSpeed` time their pulse.
 * - `lines`, the links. `aTone` is each end's tone (0 plain, 1 green, 2 cyan),
 *   so a link touching a highlight takes its colour at that end.
 */
export function buildSphere(count, radius = 1.5) {
  const random = mulberry32(20260930)
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const mixes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const ring = Math.sqrt(1 - y * y)
    const theta = GOLDEN_ANGLE * i
    // Most points sit on the surface; some float slightly outside it.
    const r = radius * (random() < 0.88 ? 1 + (random() - 0.5) * 0.04 : 1.05 + random() * 0.2)
    positions[i * 3] = Math.cos(theta) * ring * r
    positions[i * 3 + 1] = y * r
    positions[i * 3 + 2] = Math.sin(theta) * ring * r
    seeds[i] = random()
    mixes[i] = Math.min(1, Math.max(0, (1 - y) / 2 + (random() - 0.5) * 0.25))
  }

  // The highlights draw from their own generator, so the shape and links
  // above and below come out exactly as they would without them.
  const accent = mulberry32(20261001)
  const tones = pickHighlights(positions, count, radius, accent)

  // Link some points to their nearest neighbours. A spatial hash keeps this
  // linear instead of comparing every pair.
  const spacing = radius * Math.sqrt((4 * Math.PI) / count)
  const reach = spacing * 1.35
  const cells = new Map()
  const key = (x, y, z) => `${Math.floor(x / reach)},${Math.floor(y / reach)},${Math.floor(z / reach)}`
  for (let i = 0; i < count; i++) {
    const k = key(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
    if (!cells.has(k)) cells.set(k, [])
    cells.get(k).push(i)
  }

  const linePositions = []
  const lineSeeds = []
  const lineTones = []
  const linked = new Set()
  for (let i = 0; i < count; i++) {
    if (random() > 0.4) continue
    const [x, y, z] = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]
    const [cx, cy, cz] = [x, y, z].map((v) => Math.floor(v / reach))
    const near = []
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
          for (const j of cells.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) {
            if (j === i) continue
            const d = Math.hypot(positions[j * 3] - x, positions[j * 3 + 1] - y, positions[j * 3 + 2] - z)
            if (d < reach) near.push([d, j])
          }
    near.sort((a, b) => a[0] - b[0])
    for (const [, j] of near.slice(0, 2)) {
      const pair = i < j ? `${i}-${j}` : `${j}-${i}`
      if (linked.has(pair)) continue
      linked.add(pair)
      for (const n of [i, j]) {
        linePositions.push(positions[n * 3], positions[n * 3 + 1], positions[n * 3 + 2])
        lineSeeds.push(seeds[n]) // endpoints scatter exactly with their points
        lineTones.push(tones[n])
      }
    }
  }

  // Split the points into the plain dots and the highlight nodes.
  const dot = { position: [], aSeed: [], aMix: [] }
  const glow = { position: [], aSeed: [], aTone: [], aSize: [], aPhase: [], aSpeed: [] }
  for (let i = 0; i < count; i++) {
    const position = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]
    if (tones[i] === PLAIN) {
      dot.position.push(...position)
      dot.aSeed.push(seeds[i])
      dot.aMix.push(mixes[i])
      continue
    }
    glow.position.push(...position)
    glow.aSeed.push(seeds[i])
    glow.aTone.push(tones[i] === GREEN ? 0 : 1)
    glow.aSize.push(2.5 + accent() * 0.5)
    glow.aPhase.push(accent() * Math.PI * 2)
    glow.aSpeed.push((Math.PI * 2) / (2 + accent() * 2)) // one pulse every 2–4s
  }

  const lines = { position: linePositions, aSeed: lineSeeds, aTone: lineTones }
  return { points: geometry(dot), highlights: geometry(glow), lines: geometry(lines) }
}

function geometry(attributes) {
  const result = new BufferGeometry()
  for (const [name, values] of Object.entries(attributes)) {
    result.setAttribute(name, new Float32BufferAttribute(values, name === 'position' ? 3 : 1))
  }
  return result
}
