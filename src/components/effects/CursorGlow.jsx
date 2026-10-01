import { useRef } from 'react'
import { useCursorGlow } from '../../hooks/usePointerEffects'

/**
 * The mouse's light on the page: a wide honey glow behind the content that
 * trails the pointer (useCursorGlow moves it). Nothing renders for touch.
 */
export default function CursorGlow() {
  const glow = useRef(null)
  const show = useCursorGlow(glow)

  if (!show) return null
  return <div ref={glow} className="cursor-glow" aria-hidden="true" />
}
