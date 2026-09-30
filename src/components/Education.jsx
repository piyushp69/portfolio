import Icon from './Icon'
import Section, { Reveal } from './Section'
import { education } from '../data/portfolio'

export default function Education() {
  return (
    <Section
      id="education"
      eyebrow="Education"
      eyebrowIcon="graduation"
      title="Academic background"
      subtitle="Where the fundamentals came from."
    >
      <div className="timeline">
        {education.map((item, i) => (
          <Reveal
            key={item.id}
            className="card timeline__item"
            delay={i * 110}
            as="article"
          >
            <span className="timeline__dot" aria-hidden="true" />

            <div className="timeline__head">
              <h3 className="timeline__title">{item.school}</h3>
              <span className="timeline__date">{item.period}</span>
            </div>

            <p className="edu__location">
              <Icon name="location" size={14} />
              {item.location}
            </p>

            <p className="edu__degree">{item.degree}</p>

            <span className="edu__score">
              <Icon name="target" size={14} />
              {item.score}
            </span>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
