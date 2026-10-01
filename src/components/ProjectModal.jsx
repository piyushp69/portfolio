import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { m } from 'motion/react'
import Icon from './Icon'
import ProjectArt from './ProjectArt'
import { projectStory } from '../data/portfolio'
import { backdropFade, modalContent, spring } from '../lib/motion'
import { useBodyScrollLock } from '../hooks/usePortfolio'
import { usePress } from '../hooks/usePointerEffects'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A project's full case study. Its surface shares a layoutId with the card's,
 * so it morphs out of the card on open and back into it on close, while the
 * contents cross-fade. Closes on Escape, a backdrop click or the close
 * button; page scroll is locked and focus stays inside while open.
 */
export default function ProjectModal({ project, onClose }) {
  const panel = useRef(null)
  const closeButton = useRef(null)
  const pressable = usePress()
  const titleId = `${project.id}-modal-title`

  useBodyScrollLock(true)

  useEffect(() => {
    const opener = document.activeElement
    closeButton.current?.focus({ preventScroll: true })

    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      // Keep Tab cycling through the dialog's own controls.
      const items = [...panel.current.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  return createPortal(
    <div className="project-modal">
      <m.div className="project-modal__backdrop" onClick={onClose} {...backdropFade} />

      <div
        ref={panel}
        className={`project-modal__panel project--${project.accent}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <m.span
          className="project-modal__surface glass-strong"
          layoutId={`project-surface-${project.id}`}
          transition={{ layout: spring }}
          style={{ borderRadius: 20 }}
          aria-hidden="true"
        />
        <m.div className="project-modal__scroll" data-lenis-prevent {...modalContent}>
          <div className="project-modal__cover">
            {project.image ? (
              <img src={project.image} alt="" decoding="async" />
            ) : (
              <ProjectArt id={project.id} />
            )}
          </div>

          <div className="project-modal__body">
            <div className="project__top">
              <span className="project__badge">
                <i />
                {project.status}
              </span>
              <span className="project__period">{project.period}</span>
            </div>

            <div>
              <h2 className="project-modal__title" id={titleId}>
                {project.title}
              </h2>
              <p className="project__subtitle">{project.subtitle}</p>
            </div>

            <ul className="project-modal__metrics">
              {project.metrics.map((metric) => (
                <li key={metric.label}>
                  <b>{metric.value}</b>
                  <span>{metric.label}</span>
                </li>
              ))}
            </ul>

            <dl className="project__story">
              {projectStory.map(({ key, label }) => (
                <div className={`project__step project__step--${key}`} key={key}>
                  <dt>{label}</dt>
                  <dd>{project[key]}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="project-modal__heading">What I actually built</h3>
              <ul className="project__points">
                {project.highlights.map((point, i) => (
                  <li className="project__point" key={i} style={{ '--i': i }}>
                    <Icon name="check" size={14} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="project__tags" aria-label="Tech stack">
              {project.tags.map((tag) => (
                <m.li className="chip chip--mono glass-subtle" key={tag} {...pressable}>
                  {tag}
                </m.li>
              ))}
            </ul>

            {project.demo && (
              <div className="project__actions">
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
              </div>
            )}
          </div>
        </m.div>

        <m.button
          ref={closeButton}
          type="button"
          className="icon-link project-modal__close"
          onClick={onClose}
          aria-label="Close project details"
          {...modalContent}
        >
          <Icon name="close" size={18} />
        </m.button>
      </div>
    </div>,
    document.body
  )
}
