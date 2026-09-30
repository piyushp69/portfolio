import Icon from './Icon'
import { useReveal } from '../hooks/usePortfolio'

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', style }) {
  const ref = useReveal()
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  )
}

export default function Section({
  id,
  eyebrow,
  eyebrowIcon = 'sparkle',
  title,
  subtitle,
  tint = false,
  children,
}) {
  return (
    <section id={id} className={`section ${tint ? 'section--tint' : ''}`.trim()}>
      <div className="container">
        <Reveal className="section__head">
          {eyebrow && (
            <p className="section__eyebrow">
              <Icon name={eyebrowIcon} size={13} />
              {eyebrow}
            </p>
          )}
          <h2 className="section__title">{title}</h2>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
