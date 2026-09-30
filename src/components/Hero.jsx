import Icon from './Icon'
import { Reveal } from './Section'
import { profile, stats } from '../data/portfolio'
import { scrollToSection, useTypewriter } from '../hooks/usePortfolio'

export default function Hero() {
  const typed = useTypewriter(profile.roles)

  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero__grid">
          <Reveal className="hero__copy">
            <p className="hero__status">
              <span className="hero__dot" />
              Open to Data Analyst &amp; ML opportunities
            </p>

            <h1 className="hero__title">
              Hi, I&apos;m <span>Piyush</span>.
            </h1>

            <p className="hero__role">
              <span className="hero__role-prefix">I work as a</span>
              <span className="hero__typed">
                {typed}
                <span className="hero__caret" />
              </span>
            </p>

            <p className="hero__tagline">{profile.tagline}</p>

            <div className="hero__actions">
              <a
                className="btn btn--primary"
                href="#projects"
                onClick={(e) => scrollToSection(e, 'projects')}
              >
                View my work
                <Icon name="arrowRight" size={16} />
              </a>
              <a
                className="btn btn--ghost"
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
              >
                <Icon name="mail" size={16} />
                Get in touch
              </a>
            </div>

            <div className="hero__socials">
              {profile.socials.map((social) => (
                <a
                  key={social.label}
                  className="icon-link"
                  href={social.href}
                  target={social.icon === 'mail' ? undefined : '_blank'}
                  rel="noreferrer noopener"
                  title={`${social.label} — ${social.handle}`}
                  aria-label={social.label}
                >
                  <Icon name={social.icon} size={19} />
                </a>
              ))}
              <a
                className="icon-link"
                href={`tel:${profile.phoneHref}`}
                title={profile.phone}
                aria-label="Phone"
              >
                <Icon name="phone" size={19} />
              </a>
            </div>
          </Reveal>

          <Reveal className="hero__visual" delay={150}>
            <span className="hero__float hero__float--a">
              <Icon name="bolt" size={15} />
              &lt;800ms latency
            </span>

            <article className="hero__card">
              <div className="hero__card-bar">
                <i />
                <i />
                <i />
                <span className="hero__card-file">credscore/pipeline.py</span>
              </div>

              <pre className="hero__code">
                <code>
                  <span className="c"># 5 datasets · 3GB+ financial records</span>
                  {'\n'}
                  <span className="k">import</span> pandas <span className="k">as</span> pd
                  {'\n'}
                  <span className="k">from</span> xgboost <span className="k">import</span>{' '}
                  XGBClassifier
                  {'\n\n'}
                  features = <span className="f">build_feature_space</span>(raw)
                  {'\n'}
                  X, y = <span className="f">smote</span>(features, target=
                  <span className="s">&quot;default&quot;</span>)
                  {'\n\n'}
                  model = <span className="f">XGBClassifier</span>(
                  {'\n'}
                  {'    '}tree_method=<span className="s">&quot;gpu_hist&quot;</span>,
                  {'\n'}
                  {'    '}n_estimators=<span className="n">800</span>,
                  {'\n'}
                  ).<span className="f">fit</span>(X, y)
                  {'\n\n'}
                  <span className="c"># recall +22% → shipped to Power BI</span>
                </code>
              </pre>

              <div className="hero__card-foot">
                <div>
                  <b>+22%</b>
                  <small>Recall</small>
                </div>
                <div>
                  <b>40%</b>
                  <small>Faster calls</small>
                </div>
                <div>
                  <b>3GB+</b>
                  <small>Data joined</small>
                </div>
              </div>
            </article>

            <span className="hero__float hero__float--b">
              <Icon name="target" size={15} />
              64% directional accuracy
            </span>
          </Reveal>
        </div>

        <div className="stats">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} className="stat" delay={i * 90}>
              <p className="stat__value">{stat.value}</p>
              <p className="stat__label">{stat.label}</p>
              <p className="stat__detail">{stat.detail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
