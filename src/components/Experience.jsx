import { m } from 'motion/react'
import Icon from './Icon'
import Section from './Section'
import { Timeline, TimelineItem } from './Timeline'
import PopText from './effects/PopText'
import { training } from '../data/portfolio'
import { usePress } from '../hooks/usePointerEffects'

export default function Experience() {
  const pressable = usePress()

  return (
    <Section
      id="experience"
      title="Where I sharpened the craft"
      subtitle="Hands-on programmes where I built systems under real constraints, not just coursework."
    >
      <Timeline>
        {training.map((item) => (
          <TimelineItem key={item.id}>
            <div className="timeline__head">
              <h3 className="timeline__title">{item.title}</h3>
              <span className="timeline__date">{item.period}</span>
            </div>
            <p className="timeline__org">{item.org}</p>

            <ul className="timeline__points">
              {item.points.map((point, i) => (
                <li className="timeline__point" key={i}>
                  <Icon name="check" size={14} />
                  <PopText as="span" text={point} />
                </li>
              ))}
            </ul>

            <ul className="timeline__tags">
              {item.tags.map((tag) => (
                <m.li className="chip glass-subtle" key={tag} {...pressable}>
                  {tag}
                </m.li>
              ))}
            </ul>
          </TimelineItem>
        ))}
      </Timeline>
    </Section>
  )
}
