import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import Icon from './Icon'
import Section, { Spotlight } from './Section'
import PopBox from './effects/PopBox'
import { skillGroups } from '../data/portfolio'
import { exitFade, spring } from '../lib/motion'
import { usePress } from '../hooks/usePointerEffects'

// With every group showing, the grid is a bento (index.css): on three columns
// this group spans two, so the five cards fill two full rows.
const WIDE_GROUP = 'libraries'

export default function Skills() {
  const [active, setActive] = useState('all')
  const pressable = usePress()

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

  const tabs = [{ id: 'all', title: 'All' }, ...skillGroups]

  return (
    <Section
      id="skills"
      title="Skills & technologies"
      subtitle={`${total} tools, languages and methods I use to take a problem from raw data to a shipped decision.`}
    >
      <PopBox className="skills__tabs glass-subtle">
        {tabs.map((tab) => (
          <m.button
            key={tab.id}
            type="button"
            className={`tab ${active === tab.id ? 'is-active' : ''}`.trim()}
            onClick={() => setActive(tab.id)}
            aria-pressed={active === tab.id}
            {...pressable}
          >
            {active === tab.id && (
              <m.span className="tab__pill" layoutId="skills-tab" transition={spring} />
            )}
            {tab.title}
          </m.button>
        ))}
      </PopBox>

      {/* Filtering: leaving cards fade and shrink out, the rest reflow on the
          shared spring, and new ones pop in one after another. */}
      <div className={`skills__grid ${active === 'all' ? 'skills__grid--bento' : ''}`.trim()}>
        <AnimatePresence mode="popLayout">
          {visible.map((group, i) => (
            <PopBox
              key={group.id}
              className={`card glass skill-card ${
                group.id === WIDE_GROUP ? 'skill-card--wide' : ''
              }`.trim()}
              index={i}
              layout="position"
              transition={{ layout: spring }}
              exit={exitFade}
              data-spotlight
            >
              <Spotlight />
              <span className="skill-card__icon">
                <Icon name={group.icon} size={20} />
              </span>
              <h3 className="skill-card__title">{group.title}</h3>
              <p className="skill-card__blurb">{group.blurb}</p>
              <ul className="skill-card__items">
                {group.items.map((item) => (
                  <m.li key={item} className="chip glass-subtle" {...pressable}>
                    {item}
                  </m.li>
                ))}
              </ul>
            </PopBox>
          ))}
        </AnimatePresence>
      </div>
    </Section>
  )
}
