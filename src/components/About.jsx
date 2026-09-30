import Icon from './Icon'
import Section, { Reveal } from './Section'
import { about, profile } from '../data/portfolio'

export default function About() {
  return (
    <Section
      id="about"
      eyebrow="About me"
      eyebrowIcon="user"
      title="Turning raw records into decisions people trust"
      subtitle="A short version of who I am and how I approach data problems."
      tint
    >
      <div className="about__grid">
        <Reveal className="about__body">
          <h3 className="about__headline">{about.headline}</h3>
          {about.paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </Reveal>

        <Reveal className="about__aside" delay={120}>
          <dl className="about__facts">
            {about.facts.map((fact) => (
              <div className="about__fact" key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="about__cta">
            <h4>Let&apos;s build something with your data</h4>
            <p>
              Available for data analyst, ML and analytics engineering roles or
              freelance dashboard work.
            </p>
            <a
              className="btn btn--primary btn--sm"
              href={`mailto:${profile.email}`}
            >
              <Icon name="mail" size={15} />
              Say hello
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
