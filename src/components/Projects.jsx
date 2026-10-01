import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import Icon from './Icon'
import ProjectArt from './ProjectArt'
import Section, { Glare, Spotlight } from './Section'
import PopBox from './effects/PopBox'
import PopText from './effects/PopText'
import { projectStory, projects } from '../data/portfolio'
import { lazyWithPreload } from '../lib/lazy'
import { TILT, cardContent, exitFade, spring } from '../lib/motion'
import { usePress, useTilt } from '../hooks/usePointerEffects'

// The case-study modal is its own chunk, fetched once the browser is idle,
// so it's ready before anyone opens it.
const [ProjectModal, preloadModal] = lazyWithPreload(() => import('./ProjectModal'))

/** Problem, Approach and Result, each popping in word by word. */
function Story({ project }) {
  return (
    <dl className="project__story">
      {projectStory.map(({ key, label }) => (
        <div className={`project__step project__step--${key}`} key={key}>
          <dt>{label}</dt>
          <dd>
            <PopText as="span" text={project[key]} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

// `ref` comes from AnimatePresence, which measures cards as they leave.
function ProjectCard({ project, index, open, onOpen, ref }) {
  const [headline] = project.metrics
  const pressable = usePress()
  const tilt = useTilt(TILT.card)

  // Anywhere on the card opens the case study, except its own links.
  const onClick = (event) => {
    if (!event.target.closest('a')) onOpen(project)
  }

  return (
    <PopBox
      ref={ref}
      // Tones per theme live in index.css (.project--terracotta); honey is
      // the default.
      className={`card project project--${project.accent}`}
      index={index}
      as="article"
      layout="position"
      transition={{ layout: spring }}
      exit={exitFade}
      onClick={onClick}
      style={tilt.style}
      {...tilt.handlers}
      data-spotlight
    >
      {/* The card's background and border. It shares a layoutId with the
          modal's surface, which morphs out of it; being empty, it can
          change shape without stretching any text. The corner radius is
          set here so Motion keeps it round while the size changes. */}
      <m.span
        className="project__surface glass"
        layoutId={`project-surface-${project.id}`}
        transition={{ layout: spring }}
        style={{ borderRadius: 16 }}
        aria-hidden="true"
      />
      <Spotlight />

      <m.div
        className="project__media"
        variants={cardContent}
        initial={false}
        animate={open ? 'open' : 'closed'}
      >
        {/* Zooms slightly on hover (index.css). */}
        <div className="project__cover">
          {project.image ? (
            <img src={project.image} alt="" loading="lazy" decoding="async" />
          ) : (
            <ProjectArt id={project.id} />
          )}
        </div>
        <p className="project__metric-badge glass-subtle">
          <b>{headline.value}</b>
          <span>{headline.label}</span>
        </p>
      </m.div>

      <m.div
        className="project__body"
        variants={cardContent}
        initial={false}
        animate={open ? 'open' : 'closed'}
      >
        <div className="project__top">
          <span className="project__badge">
            <i />
            {project.status}
          </span>
          <span className="project__period">{project.period}</span>
        </div>

        <div>
          <h3 className="project__title">{project.title}</h3>
          <p className="project__subtitle">{project.subtitle}</p>
        </div>

        <Story project={project} />

        <ul className="project__tags" aria-label="Tech stack">
          {project.tags.map((tag) => (
            <m.li className="chip chip--mono glass-subtle" key={tag} {...pressable}>
              {tag}
            </m.li>
          ))}
        </ul>

        <div className="project__actions">
          {project.demo && (
            <m.a
              className="btn btn--sm project__demo"
              href={project.demo}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${project.title} live demo (opens in a new tab)`}
              {...pressable}
            >
              Live demo
              <Icon name="external" size={14} />
            </m.a>
          )}

          <button
            type="button"
            className="project__toggle"
            onClick={() => onOpen(project)}
            aria-haspopup="dialog"
          >
            What I actually built
            <Icon name="arrowRight" size={16} className="btn__arrow" />
          </button>
        </div>
      </m.div>

      <Glare style={tilt.glare} />
    </PopBox>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const pressable = usePress()
  const close = useCallback(() => setSelected(null), [])

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const handle = idle(preloadModal, { timeout: 4000 })
    return () => cancel(handle)
  }, [])

  const filters = useMemo(() => {
    const set = new Set()
    projects.forEach((p) => p.categories.forEach((c) => set.add(c)))
    return ['All', ...Array.from(set)]
  }, [])

  const visible = useMemo(
    () =>
      filter === 'All'
        ? projects
        : projects.filter((p) => p.categories.includes(filter)),
    [filter]
  )

  return (
    <Section
      id="projects"
      title="Projects that shipped a decision"
      subtitle="Three end-to-end builds: credit-risk scoring, LLM-powered catalogue enrichment, and live market forecasting."
    >
      <PopBox className="projects__filters glass-subtle">
        {filters.map((name) => (
          <m.button
            key={name}
            type="button"
            className={`tab ${filter === name ? 'is-active' : ''}`.trim()}
            onClick={() => setFilter(name)}
            aria-pressed={filter === name}
            {...pressable}
          >
            {filter === name && (
              <m.span className="tab__pill" layoutId="projects-tab" transition={spring} />
            )}
            {name}
            {name !== 'All' && (
              <span>
                {' '}
                ({projects.filter((p) => p.categories.includes(name)).length})
              </span>
            )}
          </m.button>
        ))}
      </PopBox>

      {/* The filters come from the projects, so none is ever empty. */}
      <div className="projects__list">
        <AnimatePresence mode="popLayout">
          {visible.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              open={selected?.id === project.id}
              onOpen={setSelected}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && (
          <Suspense key={selected.id} fallback={null}>
            <ProjectModal project={selected} onClose={close} />
          </Suspense>
        )}
      </AnimatePresence>
    </Section>
  )
}
