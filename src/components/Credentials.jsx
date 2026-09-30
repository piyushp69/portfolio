import Icon from './Icon'
import Section, { Reveal } from './Section'
import { achievements, certificates } from '../data/portfolio'

export default function Credentials() {
  return (
    <Section
      id="credentials"
      eyebrow="Credentials"
      eyebrowIcon="award"
      title="Certificates & achievements"
      subtitle="Certifications I earned and competitions where the work held up against a clock."
      tint
    >
      <div className="credentials__grid">
        <div>
          <Reveal as="h3" className="cred-block__title">
            <span>
              <Icon name="certificate" size={18} />
            </span>
            Certificates
          </Reveal>

          <div className="cred-list">
            {certificates.map((cert, i) => (
              <Reveal
                key={cert.id}
                className="card cred-item"
                delay={i * 80}
              >
                <span className="cred-item__icon">
                  <Icon name="certificate" size={18} />
                </span>
                <div className="cred-item__body">
                  <p className="cred-item__title">
                    {cert.url ? (
                      <a
                        className="cred-item__link"
                        href={cert.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${cert.title} certificate from ${cert.issuer} (opens in a new tab)`}
                      >
                        {cert.title}
                      </a>
                    ) : (
                      cert.title
                    )}
                  </p>
                  <p className="cred-item__meta">
                    {cert.issuer}
                    {cert.url && (
                      <span className="cred-item__view" aria-hidden="true">
                        View credential
                        <Icon name="external" size={12} />
                      </span>
                    )}
                  </p>
                </div>
                <span className="cred-item__date">{cert.date}</span>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <Reveal as="h3" className="cred-block__title">
            <span>
              <Icon name="award" size={18} />
            </span>
            Achievements
          </Reveal>

          <div className="cred-list">
            {achievements.map((item, i) => (
              <Reveal
                key={item.id}
                className="card cred-item"
                delay={i * 80}
              >
                <span className="cred-item__icon cred-item__icon--award">
                  <Icon name="award" size={18} />
                </span>
                <div className="cred-item__body">
                  <p className="cred-item__title">{item.title}</p>
                  <p className="cred-item__desc">{item.description}</p>
                </div>
                <span className="cred-item__date">{item.date}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
