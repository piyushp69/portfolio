// Light / dark theme. The theme lives on <html data-theme>; the inline script
// in index.html applies the saved choice before first paint, using the same
// storage key and colours as below. Light is the default.

const STORAGE_KEY = 'theme'

// Browser UI colour (meta theme-color); matches --bg in each theme.
const THEME_COLOR = { light: '#faf8f5', dark: '#0f0e0d' }

export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode, site settings); the switch still
    // works for this visit.
  }
}

/** Calls `onChange` whenever the theme switches. Returns an unsubscribe. */
export function subscribeTheme(onChange) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
