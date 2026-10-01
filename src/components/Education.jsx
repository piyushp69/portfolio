import Icon from './Icon'
import Section from './Section'
import PopText from './effects/PopText'
import { Timeline, TimelineItem } from './Timeline'
import { education } from '../data/portfolio'

export default function Education() {
  return (
    <Section
      id="education"
      title="Academic background"
      subtitle="Where the fundamentals came from."
    >
      <Timeline>
        {education.map((item) => (
          <TimelineItem key={item.id}>
            <div className="timeline__head">
              <h3 className="timeline__title">{item.school}</h3>
              <span className="timeline__date">{item.period}</span>
            </div>

            <p className="edu__location">
              <Icon name="location" size={14} />
              {item.location}
            </p>

            <PopText className="edu__degree" text={item.degree} />

            <span className="edu__score glass-subtle">
              <Icon name="target" size={14} />
              {item.score}
            </span>
          </TimelineItem>
        ))}
      </Timeline>
    </Section>
  )
}
