import { useMemo, useState } from 'react'
import Icon from './Icon'
import Section, { Reveal } from './Section'
import { skillGroups } from '../data/portfolio'

export default function Skills() {
  const [active, setActive] = useState('all')

  const visible = useMemo(
    () =>
      active === 'all'
        ? skillGroups
        : skillGroups.filter((group) => group.id === active),
    [active]
  )

  const total = useMemo(
    () => skillGroups.reduce((sum, group) => sum + group.items.length, 0),
    []
  )

  return (
    <Section
      id="skills"
      eyebrow="Toolkit"
      eyebrowIcon="code"
      title="Skills & technologies"
      subtitle={`${total} tools, languages and methods I use to take a problem from raw data to a shipped decision.`}
    >
      <Reveal className="skills__tabs">
        <button
          type="button"
          className={`tab ${active === 'all' ? 'is-active' : ''}`.trim()}
          onClick={() => setActive('all')}
          aria-pressed={active === 'all'}
        >
          All
        </button>
        {skillGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`tab ${active === group.id ? 'is-active' : ''}`.trim()}
            onClick={() => setActive(group.id)}
            aria-pressed={active === group.id}
          >
            {group.title}
          </button>
        ))}
      </Reveal>

      <div className="skills__grid">
        {visible.map((group, i) => (
          <Reveal
            key={group.id}
            className="card skill-card"
            delay={i * 80}
          >
            <span className="skill-card__icon">
              <Icon name={group.icon} size={21} />
            </span>
            <div>
              <h3 className="skill-card__title">{group.title}</h3>
              <p className="skill-card__blurb">{group.blurb}</p>
            </div>
            <ul className="skill-card__items">
              {group.items.map((item) => (
                <li key={item} className="skill-pill">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
