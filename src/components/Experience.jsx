import Icon from './Icon'
import Section, { Reveal } from './Section'
import { training } from '../data/portfolio'

export default function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Training & experience"
      eyebrowIcon="briefcase"
      title="Where I sharpened the craft"
      subtitle="Hands-on programmes where I built systems under real constraints, not just coursework."
    >
      <div className="timeline">
        {training.map((item, i) => (
          <Reveal
            key={item.id}
            className="card timeline__item"
            delay={i * 110}
            as="article"
          >
            <span className="timeline__dot" aria-hidden="true" />

            <div className="timeline__head">
              <h3 className="timeline__title">{item.title}</h3>
              <span className="timeline__date">{item.period}</span>
            </div>
            <p className="timeline__org">{item.org}</p>

            <ul className="timeline__points">
              {item.points.map((point, index) => (
                <li className="timeline__point" key={index}>
                  <Icon name="check" size={14} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <ul className="timeline__tags">
              {item.tags.map((tag) => (
                <li className="chip" key={tag}>
                  {tag}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
