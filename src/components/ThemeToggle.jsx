import { useState } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import Icon from './Icon'
import { iconSwap } from '../lib/motion'
import { getTheme, setTheme } from '../lib/theme'
import { usePrefersReducedMotion } from '../hooks/usePortfolio'
import { usePress } from '../hooks/usePointerEffects'

/**
 * Switches between the light and dark themes. The page crossfades into the
 * new theme through a view transition; with reduced motion, or in browsers
 * without view transitions, it switches instantly.
 */
export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme)
  const reduced = usePrefersReducedMotion()
  const pressable = usePress()
  const dark = theme === 'dark'

  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    // The DOM has to be in its new state when the transition's callback
    // returns, so React renders synchronously here.
    const apply = () =>
      flushSync(() => {
        setTheme(next)
        setThemeState(next)
      })

    if (reduced || !document.startViewTransition) apply()
    else document.startViewTransition(apply)
  }

  return (
    <m.button
      type="button"
      className="icon-link theme-toggle"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Dark theme"
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      {...pressable}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span key={theme} className="theme-toggle__icon" {...iconSwap}>
          <Icon name={dark ? 'moon' : 'sun'} size={17} />
        </m.span>
      </AnimatePresence>
    </m.button>
  )
}
