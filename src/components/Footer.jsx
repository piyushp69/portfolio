import Icon from './Icon'
import { navLinks, profile } from '../data/portfolio'
import { scrollToSection } from '../hooks/usePortfolio'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <span className="nav__mark">PP</span>
            <span>
              {profile.name}
              <span className="nav__brand-sub">{profile.role}</span>
            </span>
          </div>

          <nav className="footer__nav" aria-label="Footer">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hero__socials">
            {profile.socials.map((social) => (
              <a
                key={social.label}
                className="icon-link"
                href={social.href}
                target={social.icon === 'mail' ? undefined : '_blank'}
                rel="noreferrer noopener"
                aria-label={social.label}
              >
                <Icon name={social.icon} size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © {new Date().getFullYear()} {profile.name}. Built with React &amp; Vite.
          </p>
          <p>{profile.location}</p>
        </div>
      </div>
    </footer>
  )
}
