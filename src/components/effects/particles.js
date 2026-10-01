// Text that dissolves into particles. The text is drawn onto an offscreen
// canvas, its filled pixels are sampled, and each sample becomes a particle
// that drifts right and up while fading out, sweeping left to right across
// the text. Everything is drawn on one visible canvas the caller owns; this
// module sizes and positions it (DPR-aware) and clears it when done.

// Particles never exceed this, whatever the text size: sampling gets
// sparser instead.
const MAX_PARTICLES = 4500

// Extra room around the text for the drift, in CSS px.
const PAD = { top: 56, right: 110, bottom: 12, left: 8 }

let measurer = null
function measuringContext() {
  measurer ??= document.createElement('canvas').getContext('2d')
  return measurer
}

function fontOf(style) {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
}

/**
 * Where a single-line inline element's text sits inside `container`, and how
 * it's styled: the input vanishText() needs.
 */
export function measureInline(element, container) {
  const rect = element.getBoundingClientRect()
  const origin = container.getBoundingClientRect()
  const style = getComputedStyle(element)
  const font = fontOf(style)
  const ctx = measuringContext()
  ctx.font = font
  // An inline box is exactly the font's ascent + descent tall, so the
  // baseline sits one ascent below its top.
  const metrics = ctx.measureText(element.textContent)
  const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8

  return {
    box: {
      left: rect.left - origin.left,
      top: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    },
    lines: [{ text: element.textContent, x: 0, y: ascent }],
    font,
    letterSpacing: style.letterSpacing,
    color: style.color,
  }
}

/**
 * The visible lines of a textarea, wrapped the way the browser wraps them
 * (greedy, at spaces), positioned inside `container`.
 */
export function measureTextarea(textarea, container) {
  const rect = textarea.getBoundingClientRect()
  const origin = container.getBoundingClientRect()
  const style = getComputedStyle(textarea)
  const font = fontOf(style)
  const ctx = measuringContext()
  ctx.font = font

  const px = (name) => parseFloat(style[name]) || 0
  const fontSize = px('fontSize')
  const lineHeight = px('lineHeight') || fontSize * 1.2
  const left = px('borderLeftWidth') + px('paddingLeft')
  const top = px('borderTopWidth') + px('paddingTop')
  const width = textarea.clientWidth - px('paddingLeft') - px('paddingRight')
  const metrics = ctx.measureText('Mg')
  const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8
  const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.2
  const baseline = (lineHeight - ascent - descent) / 2 + ascent

  const wrapped = []
  for (const paragraph of textarea.value.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/(?<=\s)/)) {
      if (ctx.measureText(line + word).width <= width || !line) line += word
      else {
        wrapped.push(line)
        line = word
      }
    }
    wrapped.push(line)
  }

  const lines = wrapped
    .map((text, i) => ({ text, x: left, y: top + i * lineHeight + baseline - textarea.scrollTop }))
    .filter((line) => line.text.trim() && line.y > 0 && line.y - ascent < textarea.clientHeight)

  return {
    box: { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height },
    lines,
    font,
    letterSpacing: style.letterSpacing,
    color: style.color,
  }
}

/**
 * Dissolves text into particles on `canvas`. `box` is the text's area in
 * CSS px relative to the canvas's offset parent; `lines` sit inside it
 * (x, y = baseline). Returns { done, cancel }: `done` resolves with true once
 * the particles are gone, or false if cancelled (unmount, resize).
 */
export function vanishText(canvas, { box, lines, font, letterSpacing, color, duration = 800 }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = box.width + PAD.left + PAD.right
  const height = box.height + PAD.top + PAD.bottom

  Object.assign(canvas.style, {
    left: `${box.left - PAD.left}px`,
    top: `${box.top - PAD.top}px`,
    width: `${width}px`,
    height: `${height}px`,
  })
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)

  // 1. Rasterise the text offscreen, at the canvas's own resolution.
  const offscreen = document.createElement('canvas')
  offscreen.width = canvas.width
  offscreen.height = canvas.height
  const source = offscreen.getContext('2d', { willReadFrequently: true })
  source.setTransform(dpr, 0, 0, dpr, 0, 0)
  source.font = font
  if (letterSpacing && letterSpacing !== 'normal') source.letterSpacing = letterSpacing
  source.textBaseline = 'alphabetic'
  source.fillStyle = '#000'
  for (const line of lines) source.fillText(line.text, PAD.left + line.x, PAD.top + line.y)
  const { data } = source.getImageData(0, 0, offscreen.width, offscreen.height)

  // 2. Sample filled pixels on a grid, coarsening it until the count fits.
  const filled = (x, y) => data[(y * offscreen.width + x) * 4 + 3] > 110
  let step = Math.max(1, Math.round(dpr))
  const count = (s) => {
    let n = 0
    for (let y = 0; y < offscreen.height; y += s)
      for (let x = 0; x < offscreen.width; x += s) if (filled(x, y)) n++
    return n
  }
  while (count(step) > MAX_PARTICLES) step++

  // Each particle: start x, y, velocity (px/s), start delay (ms).
  const particles = []
  const sweep = duration * 0.35
  const life = duration * 0.6
  for (let y = 0; y < offscreen.height; y += step) {
    for (let x = 0; x < offscreen.width; x += step) {
      if (!filled(x, y)) continue
      const cx = x / dpr
      const cy = y / dpr
      particles.push({
        x: cx,
        y: cy,
        vx: 30 + Math.random() * 110,
        vy: -(15 + Math.random() * 75),
        delay: ((cx - PAD.left) / Math.max(box.width, 1)) * sweep + Math.random() * 40,
      })
    }
  }
  const size = Math.max(1, (step / dpr) * 1.15)

  // 3. Animate on the visible canvas.
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = color

  let frame = 0
  let finish
  const done = new Promise((resolve) => (finish = resolve))
  const clear = () => {
    ctx.clearRect(0, 0, width, height)
    canvas.style.width = '0px'
    canvas.style.height = '0px'
  }
  const end = (completed) => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
    clear()
    finish(completed)
  }
  // A resize would leave the particles misplaced; just stop.
  const onResize = () => end(false)
  window.addEventListener('resize', onResize)

  let start
  const tick = (now) => {
    start ??= now
    const t = now - start
    ctx.clearRect(0, 0, width, height)
    for (const p of particles) {
      const local = t - p.delay
      if (local <= 0) {
        ctx.globalAlpha = 1
        ctx.fillRect(p.x, p.y, size, size)
        continue
      }
      const progress = local / life
      if (progress >= 1) continue
      const s = local / 1000
      ctx.globalAlpha = (1 - progress) * (1 - progress)
      ctx.fillRect(p.x + p.vx * s, p.y + p.vy * s, size, size)
    }
    ctx.globalAlpha = 1
    if (t < duration) frame = requestAnimationFrame(tick)
    else end(true)
  }
  frame = requestAnimationFrame(tick)

  return { done, cancel: () => end(false) }
}
