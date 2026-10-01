import { m } from 'motion/react'
import Icon from './Icon'
import Section, { Spotlight } from './Section'
import PopBox from './effects/PopBox'
import PopText from './effects/PopText'
import DataSphere from './three/DataSphere'
import { about, profile } from '../data/portfolio'
import { usePress } from '../hooks/usePointerEffects'

export default function About() {
  const pressable = usePress()

  return (
    <Section
      id="about"
      title="Turning raw records into decisions people trust"
      subtitle="A short version of who I am and how I approach data problems."
    >
      <div className="about__grid">
        <div className="about__body">
          <PopText as="h3" className="about__headline" text={about.headline} />
          {about.paragraphs.map((text, i) => (
            <PopText key={i} text={text} />
          ))}
        </div>

        <div className="about__aside">
          <PopBox className="about__sphere">
            <DataSphere />
          </PopBox>

          {/* The card pops in, then its rows one after another. */}
          <PopBox className="card glass about__facts" data-spotlight>
            <Spotlight />
            <dl>
              {about.facts.map((fact, i) => (
                <PopBox key={fact.label} className="about__fact" index={i + 1}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </PopBox>
              ))}
            </dl>
          </PopBox>

          <PopBox className="card glass about__cta" data-spotlight>
            <Spotlight />
            <h4>Let&apos;s build something with your data</h4>
            <p>
              Available for data analyst, ML and analytics engineering roles or
              freelance dashboard work.
            </p>
            <m.a
              className="btn btn--primary btn--sm btn--shine"
              href={`mailto:${profile.email}`}
              {...pressable}
            >
              <Icon name="mail" size={15} />
              Say hello
            </m.a>
          </PopBox>
        </div>
      </div>
    </Section>
  )
}
