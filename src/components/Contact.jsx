import { useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import Icon from './Icon'
import Section, { Spotlight } from './Section'
import PopBox from './effects/PopBox'
import CyclingPlaceholder from './effects/CyclingPlaceholder'
import { measureTextarea, vanishText } from './effects/particles'
import { profile } from '../data/portfolio'
import { VANISH, drawCheck, iconSwap, statusIn } from '../lib/motion'
import { useCopy, usePrefersReducedMotion } from '../hooks/usePortfolio'
import { usePress } from '../hooks/usePointerEffects'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const initialValues = { name: '', email: '', subject: '', message: '' }

// Optional form backend that accepts a JSON POST (e.g. a Formspree endpoint).
// Without one, the form hands the message to the visitor's mail app instead.
const FORM_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT

// What the empty message box suggests, a new one every few seconds.
const PROMPTS = [
  'Hiring for a data role?',
  'Want to collaborate on an ML project?',
  'Just saying hi?',
]

const statusMessages = {
  sent: 'Message sent ✓',
  mailto:
    'Your mail app should be open with the message ready. Hit send and I’ll reply shortly.',
  error: 'That didn’t go through. Please try again, or email me directly.',
}

/** The check icon, drawn stroke by stroke when it appears. */
function DrawnCheck() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <m.path d="m5 12.5 4.5 4.5L19 7.5" {...drawCheck} />
    </svg>
  )
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
  const pressable = usePress()
  const reduced = usePrefersReducedMotion()
  const [vanishing, setVanishing] = useState(false)
  const particles = useRef(null)
  const delivered = status === 'sent' || status === 'mailto'

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

  // Dissolves the typed message into particles; resolves once it's gone.
  // The text is hidden while it happens (CSS), not removed, so a failed send
  // can bring it straight back.
  const vanishMessage = async () => {
    const field = document.getElementById('field-message')
    if (reduced || !field?.value.trim()) return
    const run = vanishText(particles.current, {
      ...measureTextarea(field, field.parentElement),
      duration: VANISH.vanishMs,
    })
    setVanishing(true)
    await run.done
    setVanishing(false)
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

    // The message dissolves while it's handed off; the delivery itself is
    // unchanged and starts straight away.
    const vanished = vanishMessage()

    if (!FORM_ENDPOINT) {
      // Hands the message to the visitor's mail client, pre-filled and ready to
      // send. Name, email and subject stay filled; the message has gone to the
      // mail app, so its box clears once it has dissolved.
      const body = `${message.message}\n\n—\n${message.name}\n${message.email}`
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
        message.subject
      )}&body=${encodeURIComponent(body)}`
      await vanished
      setValues((prev) => ({ ...prev, message: '' }))
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
      await vanished
      setStatus('sent')
      setValues(initialValues)
    } catch {
      // The text reappears, so nothing typed is lost.
      await vanished
      setStatus('error')
    }
  }

  const social = (icon) => profile.socials.find((link) => link.icon === icon)
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
      value: `in/${social('linkedin').handle}`,
      href: social('linkedin').href,
      icon: 'linkedin',
      external: true,
    },
    {
      label: 'GitHub',
      value: `github.com/${social('github').handle}`,
      href: social('github').href,
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
      title="Let's talk data"
      subtitle="Hiring, collaborating, or just want to compare notes on a modelling problem? My inbox is open."
    >
      <div className="contact__grid">
        <div className="contact__cards">
          {channels.map((channel, i) => {
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
              <PopBox
                className="card glass contact-card"
                key={channel.label}
                index={i}
                data-spotlight
              >
                <Spotlight />
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
                  <m.button
                    type="button"
                    className="contact-card__copy"
                    onClick={() => copy(channel.value, channel.label)}
                    aria-label={`Copy ${channel.label.toLowerCase()}`}
                    title={copied === channel.label ? 'Copied' : 'Copy'}
                    {...pressable}
                  >
                    <Icon
                      name={copied === channel.label ? 'check' : 'copy'}
                      size={15}
                    />
                  </m.button>
                )}
              </PopBox>
            )
          })}
        </div>

        <PopBox index={1}>
          <form className="card glass form" onSubmit={handleSubmit} noValidate>
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

            {/* The label stays raised here, so the rotating prompt has room. */}
            <div
              className={`field field--prompt ${errors.message ? 'field--error' : ''}`.trim()}
            >
              <label htmlFor="field-message">Message</label>
              <textarea
                id="field-message"
                name="message"
                rows={5}
                className={vanishing ? 'is-vanishing' : undefined}
                value={values.message}
                onChange={update('message')}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'field-message-error' : undefined}
              />
              <CyclingPlaceholder
                phrases={PROMPTS}
                active={!values.message && !vanishing}
                className="field__prompt"
              />
              <canvas ref={particles} className="vanish__canvas" aria-hidden="true" />
              {errors.message && (
                <span className="field__error" id="field-message-error">
                  {errors.message}
                </span>
              )}
            </div>

            <AnimatePresence initial={false}>
              {delivered && (
                <m.p key="sent" className="form__status" role="status" {...statusIn}>
                  {status === 'mailto' && <Icon name="check" size={16} />}
                  {statusMessages[status]}
                </m.p>
              )}

              {status === 'error' && (
                <m.p
                  key="error"
                  className="form__status form__status--error"
                  role="alert"
                  {...statusIn}
                >
                  {statusMessages.error}
                </m.p>
              )}
            </AnimatePresence>

            <m.button
              type="submit"
              className={`btn btn--primary btn--block ${
                status === 'sending' ? 'is-loading' : ''
              } ${delivered ? 'is-done' : ''}`.trim()}
              disabled={status === 'sending'}
              {...pressable}
            >
              <span className="btn__icon">
                <AnimatePresence mode="wait" initial={false}>
                  <m.span key={delivered ? 'done' : 'send'} {...iconSwap}>
                    {delivered ? <DrawnCheck /> : <Icon name="send" size={16} />}
                  </m.span>
                </AnimatePresence>
              </span>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </m.button>

            <p className="form__note">
              {FORM_ENDPOINT
                ? 'Prefer email? Write to me directly at'
                : 'This form opens your email client with everything filled in. Prefer to write directly?'}{' '}
              <a className="form__note-link" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </p>
          </form>
        </PopBox>
      </div>
    </Section>
  )
}
