import CursorGlow from './effects/CursorGlow'

// The page's background, fixed behind everything: three soft orbs of
// ambient light drifting slowly (the glass panes frost them) and the mouse's
// glow; then a film of grain across the whole page. None of it repaints
// while scrolling. The grid between the orbs and the glow is GridSweep,
// mounted beside this in App.jsx; the hero's glow lives in Hero.jsx.
export default function Backdrop() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__orb ambient__orb--1" />
        <span className="ambient__orb ambient__orb--2" />
        <span className="ambient__orb ambient__orb--3" />
      </div>
      <CursorGlow />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
