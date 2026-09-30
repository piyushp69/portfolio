import { useState } from 'react'
import Icon from './Icon'
import Section, { Reveal } from './Section'
import { profile } from '../data/portfolio'
import { useCopy } from '../hooks/usePortfolio'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const initialValues = { name: '', email: '', subject: '', message: '' }

// Optional form backend that accepts a JSON POST (e.g. a Formspree endpoint).
// Without one, the form hands the message to the visitor's mail app instead.
const FORM_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT

const statusMessages = {
  sent: 'Thanks, your message is on its way. I’ll reply soon.',
  mailto:
    'Your mail app should be open with the message ready. Hit send and I’ll reply shortly.',
  error: 'That didn’t go through. Please try again, or email me directly.',
}

function validate(values) {
  const errors = {}

  if (!values.name.trim()) errors.name = 'Please tell me your name.'
  else if (values.name.trim().length < 2) errors.name = 'That name looks too short.'

  if (!values.email.trim()) errors.email = 'An email lets me reply.'
  else if (!EMAIL_RE.test(values.email.trim()))
    errors.email = 'That email address does not look valid.'

  if (!values.subject.trim()) errors.subject = 'Add a short subject.'

  if (!values.message.trim()) errors.message = 'Your message is empty.'
  else if (values.message.trim().length < 15)
    errors.message = 'A little more detail helps — 15 characters minimum.'

  return errors
}

export default function Contact() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | mailto | error
  const { copied, copy } = useCopy()

  const update = (field) => (event) => {
    const { value } = event.target
    setValues((prev) => ({ ...prev, [field]: value }))
    setStatus((prev) => (prev === 'sending' ? prev : 'idle'))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = document.getElementById(`field-${Object.keys(found)[0]}`)
      first?.focus()
      return
    }

    const message = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
    }

    if (!FORM_ENDPOINT) {
      // Hands the message to the visitor's mail client, pre-filled and ready to
      // send. The fields stay filled in case no mail app is set up.
      const body = `${message.message}\n\n—\n${message.name}\n${message.email}`
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
        message.subject
      )}&body=${encodeURIComponent(body)}`
      setStatus('mailto')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(message),
      })
      if (!response.ok) throw new Error(`Form endpoint responded ${response.status}`)
      setStatus('sent')
      setValues(initialValues)
    } catch {
      setStatus('error')
    }
  }

  const channels = [
    {
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`,
      icon: 'mail',
      copyable: true,
    },
    {
      label: 'Phone',
      value: profile.phone,
      href: `tel:${profile.phoneHref}`,
      icon: 'phone',
      copyable: true,
    },
    {
      label: 'LinkedIn',
      value: 'in/piyush-priyanshu',
      href: 'https://linkedin.com/in/piyush-priyanshu',
      icon: 'linkedin',
      external: true,
    },
    {
      label: 'GitHub',
      value: 'github.com/piyushp69',
      href: 'https://github.com/piyushp69',
      icon: 'github',
      external: true,
    },
    {
      label: 'Location',
      value: profile.location,
      icon: 'location',
    },
  ]

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      eyebrowIcon="mail"
      title="Let's talk data"
      subtitle="Hiring, collaborating, or just want to compare notes on a modelling problem? My inbox is open."
      tint
    >
      <div className="contact__grid">
        <Reveal className="contact__cards">
          {channels.map((channel) => {
            const inner = (
              <>
                <span className="contact-card__icon">
                  <Icon name={channel.icon} size={19} />
                </span>
                <span className="contact-card__body">
                  <span className="contact-card__label">{channel.label}</span>
                  <span className="contact-card__value">{channel.value}</span>
                </span>
              </>
            )

            return (
              <div className="card contact-card" key={channel.label}>
                {channel.href ? (
                  <a
                    className="contact-card__link"
                    href={channel.href}
                    target={channel.external ? '_blank' : undefined}
                    rel="noreferrer noopener"
                  >
                    {inner}
                  </a>
                ) : (
                  <span className="contact-card__link">{inner}</span>
                )}

                {channel.copyable && (
                  <button
                    type="button"
                    className="contact-card__copy"
                    onClick={() => copy(channel.value, channel.label)}
                    aria-label={`Copy ${channel.label.toLowerCase()}`}
                    title={copied === channel.label ? 'Copied' : 'Copy'}
                  >
                    <Icon
                      name={copied === channel.label ? 'check' : 'copy'}
                      size={15}
                    />
                  </button>
                )}
              </div>
            )
          })}
        </Reveal>

        <Reveal delay={120}>
          <form className="card form" onSubmit={handleSubmit} noValidate>
            <div className="form__row">
              <div className={`field ${errors.name ? 'field--error' : ''}`.trim()}>
                <label htmlFor="field-name">Your name</label>
                <input
                  id="field-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={values.name}
                  onChange={update('name')}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'field-name-error' : undefined}
                />
                {errors.name && (
                  <span className="field__error" id="field-name-error">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className={`field ${errors.email ? 'field--error' : ''}`.trim()}>
                <label htmlFor="field-email">Email</label>
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={values.email}
                  onChange={update('email')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'field-email-error' : undefined}
                />
                {errors.email && (
                  <span className="field__error" id="field-email-error">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className={`field ${errors.subject ? 'field--error' : ''}`.trim()}>
              <label htmlFor="field-subject">Subject</label>
              <input
                id="field-subject"
                name="subject"
                type="text"
                placeholder="Data analyst role at ..."
                value={values.subject}
                onChange={update('subject')}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? 'field-subject-error' : undefined}
              />
              {errors.subject && (
                <span className="field__error" id="field-subject-error">
                  {errors.subject}
                </span>
              )}
            </div>

            <div className={`field ${errors.message ? 'field--error' : ''}`.trim()}>
              <label htmlFor="field-message">Message</label>
              <textarea
                id="field-message"
                name="message"
                rows={5}
                placeholder="Tell me a little about the problem you're solving..."
                value={values.message}
                onChange={update('message')}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'field-message-error' : undefined}
              />
              {errors.message && (
                <span className="field__error" id="field-message-error">
                  {errors.message}
                </span>
              )}
            </div>

            {(status === 'sent' || status === 'mailto') && (
              <p className="form__status" role="status">
                <Icon name="check" size={16} />
                {statusMessages[status]}
              </p>
            )}

            {status === 'error' && (
              <p className="form__status form__status--error" role="alert">
                {statusMessages.error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={status === 'sending'}
            >
              <Icon name="send" size={16} />
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>

            <p className="form__note">
              {FORM_ENDPOINT
                ? 'Prefer email? Write to me directly at'
                : 'This form opens your email client with everything filled in. Prefer to write directly?'}{' '}
              <a className="form__note-link" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </p>
          </form>
        </Reveal>
      </div>
    </Section>
  )
}
