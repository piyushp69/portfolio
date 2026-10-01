import { Fragment, useEffect, useRef, useState } from 'react'
import { animate, m, useInView, useScroll, useTransform } from 'motion/react'
import Icon from './Icon'
import Marquee from './Marquee'
import BlurText from './effects/BlurText'
import VanishingText from './effects/VanishingText'
import { Glare, MagneticLink, Spotlight } from './Section'
import PopBox from './effects/PopBox'
import { profile, stats, tools } from '../data/portfolio'
import { HERO, HERO_PARALLAX, TILT, cardIn, countUp, heroItem } from '../lib/motion'
import { scrollToSection, usePrefersReducedMotion } from '../hooks/usePortfolio'
import { usePress, useTilt } from '../hooks/usePointerEffects'

// "a Data Analyst", "an ML Engineer": by sound, so initialisms count as letters.
const article = (role) => (/^(?:[AEIOU]|ML\b)/.test(role) ? 'an' : 'a')

/* ---------- Title ---------- */

// Word by word, on the hero's timeline (HERO in lib/motion.js).
function HeroTitle() {
  const at = (i) => HERO.title + i * HERO.titleGap
  return (
    <h1 className="hero__title">
      <m.span className="hero__word" variants={heroItem} custom={at(0)}>
        Hi,
      </m.span>{' '}
      <m.span className="hero__word" variants={heroItem} custom={at(1)}>
        I&apos;m
      </m.span>{' '}
      <m.span className="hero__word" variants={heroItem} custom={at(2)}>
        <span className="hero__name">Piyush</span>.
      </m.span>
    </h1>
  )
}

/* ---------- Code card ---------- */

// [class, text] tokens per line; the classes are the syntax colours.
const CODE = [
  [['c', '# 5 datasets · 3GB+ financial records']],
  [['k', 'import'], [null, ' pandas '], ['k', 'as'], [null, ' pd']],
  [['k', 'from'], [null, ' xgboost '], ['k', 'import'], [null, ' XGBClassifier']],
  [],
  [[null, 'features = '], ['f', 'build_feature_space'], [null, '(raw)']],
  [[null, 'X, y = '], ['f', 'smote'], [null, '(features, target='], ['s', '"default"'], [null, ')']],
  [],
  [[null, 'model = '], ['f', 'XGBClassifier'], [null, '(']],
  [[null, '    tree_method='], ['s', '"gpu_hist"'], [null, ',']],
  [[null, '    n_estimators='], ['n', '800'], [null, ',']],
  [[null, ').'], ['f', 'fit'], [null, '(X, y)']],
  [],
  [['c', '# recall +22% → shipped to Power BI']],
]

// When each character appears, in ms after typing starts: 25ms a character,
// line by line, with a short beat at the end of each line. Indentation lands
// at once, the way an editor inserts it. About 7.5s in all.
const CHAR_MS = 25
const LINE_MS = 60
const SCHEDULE = (() => {
  const times = []
  let t = 0
  for (const line of CODE) {
    let indent = true
    for (const [, text] of line) {
      for (let i = 0; i < text.length; i++) {
        if (!(indent && text[i] === ' ')) {
          indent = false
          t += CHAR_MS
        }
        times.push(t)
      }
    }
    t += LINE_MS
  }
  return times
})()
const TOTAL_CHARS = SCHEDULE.length

// Each token with the index of its first character, so a render can tell how
// much of it is typed without counting through the lines.
const TOKENS = (() => {
  let start = 0
  return CODE.map((line) =>
    line.map(([cls, text]) => {
      const token = { cls, text, start }
      start += text.length
      return token
    })
  )
})()

// Every character is laid out from the first frame and the untyped ones are
// only invisible, so the card never changes size while it types. `paused`
// (the hero is scrolled away) stops the typing, which then picks up where
// it left off.
function CodeBlock({ start, paused }) {
  const reduced = usePrefersReducedMotion()
  const [typed, setTyped] = useState(0)
  const progress = useRef(0)
  // Reduced motion: the finished code from the very first paint, without
  // waiting for the entrance.
  const count = reduced ? TOTAL_CHARS : typed

  useEffect(() => {
    if (reduced || !start || paused || progress.current >= TOTAL_CHARS) return

    let frame = 0
    let begin
    const tick = (now) => {
      // Resuming starts the clock at the last character typed.
      begin ??= now - (progress.current ? SCHEDULE[progress.current - 1] : 0)
      let shown = progress.current
      while (shown < TOTAL_CHARS && SCHEDULE[shown] <= now - begin) shown++
      if (shown !== progress.current) {
        progress.current = shown
        setTyped(shown)
      }
      if (shown < TOTAL_CHARS) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, reduced, paused])

  const typing = count < TOTAL_CHARS

  return (
    <pre className="hero__code">
      <code>
        {TOKENS.map((line, li) => (
          <Fragment key={li}>
            {line.map(({ cls, text, start: at }, ti) => {
              const shown = Math.min(text.length, Math.max(count - at, 0))
              // The caret sits in the token being typed.
              const caret = typing && shown < text.length && count >= at
              return (
                <span key={ti} className={cls ?? undefined}>
                  {text.slice(0, shown)}
                  {caret && <span className="hero__code-caret" aria-hidden="true" />}
                  {shown < text.length && (
                    <span className="hero__code-ghost">{text.slice(shown)}</span>
                  )}
                </span>
              )
            })}
            {li < TOKENS.length - 1 && '\n'}
          </Fragment>
        ))}
      </code>
    </pre>
  )
}

// Counts the number in a stat like "+22%" or "3GB+" up from zero, starting
// `delay` seconds after mount once the stat is on screen. The real value is
// what React renders, and it's restored if the count is cut short. An
// invisible copy of the final value holds the width, so the text never
// shifts while digits are added.
function CountUp({ value, delay = 0 }) {
  const ref = useRef(null)
  const live = useRef(null)
  const reduced = usePrefersReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/)
    const node = live.current?.firstChild
    if (reduced || !match || !node) return

    const [, prefix, number, suffix] = match
    const decimals = number.split('.')[1]?.length ?? 0
    const show = (v) => {
      node.nodeValue = prefix + v.toFixed(decimals) + suffix
    }
    // Wait at zero until the stat scrolls into view.
    show(0)
    const controls = inView
      ? animate(0, parseFloat(number), { ...countUp, delay, onUpdate: show })
      : null
    return () => {
      controls?.stop()
      node.nodeValue = value
    }
  }, [value, delay, inView, reduced])

  return (
    <span className="count" ref={ref}>
      <span className="count__final">{value}</span>
      <span className="count__live" ref={live}>
        {value}
      </span>
    </span>
  )
}

const CARD_STATS = [
  { value: '+22%', label: 'Recall' },
  { value: '40%', label: 'Faster calls' },
  { value: '3GB+', label: 'Data joined' },
]

// Slides in from the right, growing slightly; its stats count up as it
// lands, and the code types itself in over the following seconds. Under the
// pointer the card and its badges tilt together in 3D.
function HeroVisual({ paused }) {
  const [entered, setEntered] = useState(false)
  const tilt = useTilt(TILT.hero)

  return (
    <m.div
      className="hero__visual"
      variants={cardIn}
      custom={HERO.card}
      onAnimationComplete={() => setEntered(true)}
      {...tilt.handlers}
    >
      {/* The page's one accent glow, behind the card's top-right corner. */}
      <span className="hero__glow" aria-hidden="true" />

      {/* One 3D space: the badges sit in front of the card (translateZ in
          index.css), so they stay ahead of it as it turns. */}
      <m.div className="hero__tilt" style={tilt.style}>
        <span className="hero__float hero__float--a glass-subtle">
          <Icon name="bolt" size={15} />
          &lt;800ms latency
        </span>

        <article className="hero__card glass">
          <span className="hero__card-beam" aria-hidden="true">
            <span />
          </span>

          <div className="hero__card-bar">
            <i />
            <i />
            <i />
            <span className="hero__card-file">credscore/pipeline.py</span>
          </div>

          <CodeBlock start={entered} paused={paused} />

          <div className="hero__card-foot">
            {CARD_STATS.map((stat) => (
              <div key={stat.label}>
                <b>
                  <CountUp value={stat.value} delay={HERO.stats} />
                </b>
                <small>{stat.label}</small>
              </div>
            ))}
          </div>
          <Glare style={tilt.glare} />
        </article>

        <span className="hero__float hero__float--b glass-subtle">
          <Icon name="target" size={15} />
          64% directional accuracy
        </span>
      </m.div>
    </m.div>
  )
}

/* ---------- Section ---------- */

export default function Hero() {
  const ref = useRef(null)
  const grid = useRef(null)
  const reduced = usePrefersReducedMotion()
  const pressable = usePress()
  // Looping decorations pause while the hero is scrolled out of view.
  const onScreen = useInView(ref)

  // As the hero scrolls away its content drifts down (up to HERO_PARALLAX px,
  // so it moves slower than the page) and fades out.
  const { scrollYProgress } = useScroll({ target: grid, offset: ['start start', 'end start'] })
  // Function mappings keep both on the same scroll read: given a range,
  // Motion hands opacity to a native ViewTimeline, which tracks this
  // element's box and so stalls once the parallax has moved it.
  const y = useTransform(scrollYProgress, (p) => p * HERO_PARALLAX)
  const opacity = useTransform(scrollYProgress, (p) => Math.max(0, 1 - p / 0.85))

  return (
    <section className={`hero ${onScreen ? '' : 'is-offscreen'}`.trim()} id="home" ref={ref}>
      <div className="container">
        {/* Children follow the hero timeline through their `custom` delays. */}
        <m.div
          className="hero__grid"
          ref={grid}
          style={reduced ? undefined : { y, opacity }}
          initial={reduced ? false : 'hidden'}
          animate="show"
        >
          <div className="hero__copy">
            <m.p className="hero__status" variants={heroItem} custom={HERO.badge}>
              <span className="hero__dot" />
              Open to Data Analyst &amp; ML opportunities
            </m.p>

            <HeroTitle />

            <m.p className="hero__role" variants={heroItem} custom={HERO.role}>
              <VanishingText
                words={profile.roles}
                paused={!onScreen}
                className="hero__typed"
                before={(role) => (
                  <span className="hero__role-prefix">I work as {article(role)}</span>
                )}
              />
            </m.p>

            <BlurText className="hero__tagline" text={profile.tagline} delay={HERO.description} />

            <m.div className="hero__actions" variants={heroItem} custom={HERO.actions}>
              <MagneticLink
                className="btn btn--primary"
                href="#projects"
                onClick={(e) => scrollToSection(e, 'projects')}
              >
                View my work
                <Icon name="arrowRight" size={16} className="btn__arrow" />
              </MagneticLink>
              <MagneticLink
                className="btn btn--ghost"
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
              >
                <Icon name="mail" size={16} />
                Get in touch
              </MagneticLink>
            </m.div>

            <div className="hero__socials">
              {profile.socials.map((social, i) => (
                <m.a
                  key={social.label}
                  className="icon-link"
                  href={social.href}
                  target={social.icon === 'mail' ? undefined : '_blank'}
                  rel="noreferrer noopener"
                  title={`${social.label} — ${social.handle}`}
                  aria-label={social.label}
                  variants={heroItem}
                  custom={HERO.socials + i * HERO.socialGap}
                  {...pressable}
                >
                  <Icon name={social.icon} size={19} />
                </m.a>
              ))}
              <m.a
                className="icon-link"
                href={`tel:${profile.phoneHref}`}
                title={profile.phone}
                aria-label="Phone"
                variants={heroItem}
                custom={HERO.socials + profile.socials.length * HERO.socialGap}
                {...pressable}
              >
                <Icon name="phone" size={19} />
              </m.a>
            </div>
          </div>

          <HeroVisual paused={!onScreen} />
        </m.div>

        <div className="stats">
          {stats.map((stat, i) => (
            <PopBox key={stat.label} className="card glass stat" index={i} data-spotlight>
              <Spotlight />
              <p className="stat__value">{stat.value}</p>
              <p className="stat__label">{stat.label}</p>
              <p className="stat__detail">{stat.detail}</p>
            </PopBox>
          ))}
        </div>

        <Marquee items={tools} />
      </div>
    </section>
  )
}
