import { useMemo, useState } from 'react'
import Icon from './Icon'
import Section, { Reveal } from './Section'
import { projects } from '../data/portfolio'

// Accent shades are dark enough for small text and white-on-accent buttons (WCAG AA).
const accents = {
  indigo: { '--accent-color': '#4f46e5', '--accent-soft': '#eef0ff' },
  cyan: { '--accent-color': '#0e7490', '--accent-soft': '#e3f6fb' },
  amber: { '--accent-color': '#b45309', '--accent-soft': '#fdf3e2' },
}

function ProjectCard({ project, delay }) {
  const [open, setOpen] = useState(false)

  return (
    <Reveal
      className="card project"
      delay={delay}
      as="article"
      style={accents[project.accent] ?? accents.indigo}
    >
      <div className="project__side">
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

        <div className="project__metrics">
          {project.metrics.map((metric) => (
            <div className="project__metric" key={metric.label}>
              <b>{metric.value}</b>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="project__main">
        <p className="project__summary">{project.summary}</p>

        <div className="project__actions">
          {project.demo && (
            <a
              className="btn btn--sm project__demo"
              href={project.demo}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${project.title} live demo (opens in a new tab)`}
            >
              Live demo
              <Icon name="external" size={14} />
            </a>
          )}

          <button
            type="button"
            className="project__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={`${project.id}-details`}
          >
            {open ? 'Hide the details' : 'What I actually built'}
            <Icon name="chevronDown" size={16} />
          </button>
        </div>

        <div
          id={`${project.id}-details`}
          className={`project__collapse ${open ? 'is-open' : ''}`.trim()}
        >
          <div>
            <ul className="project__points">
              {project.highlights.map((point, i) => (
                <li className="project__point" key={i}>
                  <Icon name="check" size={14} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="project__tags">
          {project.tags.map((tag) => (
            <li className="chip" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')

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
      eyebrow="Selected work"
      eyebrowIcon="bolt"
      title="Projects that shipped a decision"
      subtitle="Three end-to-end builds: credit-risk scoring, LLM-powered catalogue enrichment, and live market forecasting."
      tint
    >
      <Reveal className="projects__filters">
        {filters.map((name) => (
          <button
            key={name}
            type="button"
            className={`tab ${filter === name ? 'is-active' : ''}`.trim()}
            onClick={() => setFilter(name)}
            aria-pressed={filter === name}
          >
            {name}
            {name !== 'All' && (
              <span>
                {' '}
                ({projects.filter((p) => p.categories.includes(name)).length})
              </span>
            )}
          </button>
        ))}
      </Reveal>

      {visible.length === 0 ? (
        <p className="empty-state">No projects in this category yet.</p>
      ) : (
        <div className="projects__list">
          {visible.map((project, i) => (
            <ProjectCard key={project.id} project={project} delay={i * 90} />
          ))}
        </div>
      )}
    </Section>
  )
}
