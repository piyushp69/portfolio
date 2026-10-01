// The site's motion system. Every Motion variant and transition comes from
// here; components never write their own timing. CSS transitions in
// styles/index.css read the same curve and durations through custom
// properties (applyCssMotionTokens), so both share one feel.

export const EASE = [0.22, 1, 0.36, 1]

// Seconds.
export const DURATION = {
  fast: 0.35,
  base: 0.6,
  slow: 0.8,
}

export const STAGGER = 0.07

// The default tween, and the one spring used for layout moves, hover and tap.
export const ease = { duration: DURATION.base, ease: EASE }
export const spring = { type: 'spring', stiffness: 260, damping: 26 }

// Springs for motion values (useSpring takes no `type`).
export const SPRING = {
  ui: { stiffness: 260, damping: 26 },
  // A smoothed read-out (the progress bar) must never overshoot.
  progress: { stiffness: 200, damping: 40, restDelta: 0.001 },
}

// Reveals (Reveal in Section.jsx) run once, when 20% of the element is on
// screen. Text and cards below the hero use the scroll pop instead.
export const VIEWPORT = { once: true, amount: 0.2 }

/* ---------- Scroll pop (hooks/useScrollPop, effects/PopText, effects/PopBox) ---------- */

// Scrolling down, words and cards pop in as they enter the screen; scrolling
// back up, they vanish as they leave through the bottom (words in reverse
// order). Leaving through the top they stay, so nothing replays above you.

export const popText = {
  hidden: { transition: { staggerChildren: 0.012, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
}

// The pops spring in with a little bounce, but the blur takes a critically
// damped spring of the same stiffness: an overshoot would ask for a negative
// blur, which browsers reject (and log a warning for).
const unblur = (stiffness, delay = 0) => ({
  type: 'spring',
  stiffness,
  damping: Math.ceil(2 * Math.sqrt(stiffness)),
  delay,
})

export const popWord = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.6,
    filter: 'blur(6px)',
    transition: { duration: 0.22, ease: 'easeIn' },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 420, damping: 22, filter: unblur(420) },
    // Once sharp, drop the filter: a zero blur still costs a layer per word.
    transitionEnd: { filter: 'none' },
  },
}

/** A card's pop; `index` staggers cards within a grid by 80ms each. */
export function popBox(index = 0) {
  return {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.9,
      filter: 'blur(8px)',
      transition: { duration: 0.25, ease: 'easeIn' },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.08,
        filter: unblur(260, index * 0.08),
      },
      transitionEnd: { filter: 'none' },
    },
  }
}

// Pointer-driven effects only run where there's a real hover.
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'

/** Copies the tokens onto :root so CSS transitions use the same curve. */
export function applyCssMotionTokens(root = document.documentElement) {
  root.style.setProperty('--ease-out', `cubic-bezier(${EASE.join(', ')})`)
  root.style.setProperty('--dur-fast', `${DURATION.fast}s`)
  root.style.setProperty('--dur-base', `${DURATION.base}s`)
  root.style.setProperty('--dur-slow', `${DURATION.slow}s`)
}

// Only set `delay` when there is one: an explicit 0 would override the
// stagger delay a parent hands to its children.
function timing(delay, duration = DURATION.base) {
  return delay ? { duration, ease: EASE, delay } : { duration, ease: EASE }
}

/* ---------- Entrances. Variants take a delay in seconds via `custom`. ---------- */

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay) => ({ opacity: 1, y: 0, transition: timing(delay) }),
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: (delay) => ({ opacity: 1, scale: 1, transition: timing(delay) }),
}

/** A container that reveals nothing itself and staggers its children. */
export function stagger(gap = STAGGER, delayChildren = 0) {
  return {
    hidden: {},
    show: (delay = 0) => ({
      transition: { staggerChildren: gap, delayChildren: delayChildren + delay },
    }),
  }
}

// Filtered-out cards leave quickly so the remaining ones can reflow.
export const exitFade = {
  opacity: 0,
  scale: 0.96,
  transition: { duration: DURATION.fast, ease: EASE },
}

// Word-by-word blur reveal (effects/BlurText.jsx): 40ms between words. Each
// word rises 8px while a copy of it, blurred 8px, fades in and cross-fades
// into the sharp text. Only opacity and transform animate: an animated blur
// filter can't run on the compositor, a static one under a fade can.
export const WORD_STAGGER = 0.04

const WORD_REVEAL = { duration: 0.35, times: [0, 0.35, 1], ease: 'easeOut' }

export const blurWord = {
  rise: {
    hidden: { y: 8 },
    show: { y: 0, transition: { duration: 0.35, ease: EASE } },
  },
  sharp: {
    hidden: { opacity: 0 },
    show: { opacity: [0, 0, 1], transition: WORD_REVEAL },
  },
  // Ends at opacity 0, where the browser skips painting it (and its blur).
  soft: {
    hidden: { opacity: 0 },
    show: { opacity: [0, 1, 0], transition: WORD_REVEAL },
  },
}

/* ---------- Hero first-load sequence ---------- */

// Seconds from first render. The navbar slides down, then the copy follows
// top to bottom, the code card slides in and its stats count up; the last
// step settles at about 1.5s.
export const HERO = {
  badge: 0.05,
  title: 0.1,
  titleGap: 0.05, // "Hi," / "I'm" / "Piyush."
  role: 0.24,
  description: 0.28, // then WORD_STAGGER per word
  actions: 0.44,
  socials: 0.52,
  socialGap: 0.04,
  card: 0.58,
  stats: 0.95,
}

export const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: (delay) => ({ opacity: 1, y: 0, transition: timing(delay, 0.5) }),
}

// The code card slides in from the right, growing slightly.
export const cardIn = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  show: (delay) => ({ opacity: 1, x: 0, scale: 1, transition: timing(delay) }),
}

export const navSlide = { duration: 0.5, ease: EASE }

export const countUp = { duration: 0.55, ease: EASE }

// How far (px) the hero content drifts as it scrolls away.
export const HERO_PARALLAX = 60

// Maximum 3D tilt toward the pointer, in degrees. Project cards are wide, so
// they turn less: 8deg would swing their far edge ~70px in depth.
export const TILT = { hero: 8, card: 5 }

/* ---------- Vanishing text (components/effects) ---------- */

// In ms. Each role types in, holds, dissolves into particles, and the next
// begins. With reduced motion, whole words cross-fade instead.
export const VANISH = {
  typeMs: 65,
  holdMs: 2000,
  vanishMs: 800,
  gapMs: 120,
  crossfadeMs: 300,
  reducedHoldMs: 3000,
}

// Rotating form placeholders change this often (ms).
export const PLACEHOLDER_MS = 3000

/* ---------- Micro-interactions ---------- */

// Buttons and chips grow a little under the pointer and dip when pressed.
export const press = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: spring,
}

// One icon swapping for another (theme switch, send -> sent).
export const iconSwap = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.25, ease: EASE },
}

// The check that draws itself once a message is on its way.
export const drawCheck = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.5, ease: EASE, delay: 0.1 },
}

// Form status lines drop in and fade out.
export const statusIn = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// A rotating placeholder slides up out of view as the next slides in.
export const placeholderSwap = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: EASE },
}

/* ---------- Project modal ---------- */

// Only the card's empty surface morphs into the modal (shared layoutId), so
// no text is ever stretched. The card's own contents step aside while it's
// open and return once the surface has landed back.
export const cardContent = {
  open: { opacity: 0, transition: { duration: 0.12 } },
  closed: { opacity: 1, transition: { duration: 0.25, delay: 0.15 } },
}

export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: EASE },
}

// The modal's contents fade in once its surface has mostly taken shape, and
// leave first on the way back.
export const modalContent = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, delay: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}
