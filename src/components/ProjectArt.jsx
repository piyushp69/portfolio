import { useId } from 'react'

// Illustrated covers for project cards that have no screenshot yet. Each is a
// small app window drawn in the project's accent colour (currentColor). They
// are decorative and carry no real data. Colours come from index.css (.art__*).

function Window({ children }) {
  return (
    <>
      <rect className="art__panel" x="60" y="44" width="360" height="272" rx="14" />
      <circle className="art__muted" cx="82" cy="66" r="4" />
      <circle className="art__muted" cx="96" cy="66" r="4" />
      <circle className="art__muted" cx="110" cy="66" r="4" />
      <rect className="art__faint" x="128" y="62" width="84" height="8" rx="4" />
      <path className="art__rule" d="M60 86h360" />
      {children}
    </>
  )
}

// Feature contributions pushing a score up or down, SHAP-style.
const BARS = [128, -92, 100, -60, 70, -34]

function ShapBars() {
  return (
    <Window>
      <path className="art__axis" d="M240 102v196" />
      {BARS.map((length, i) => {
        const y = 110 + i * 30
        return (
          <g key={i}>
            <rect className="art__faint" x="78" y={y + 4} width="44" height="8" rx="4" />
            <rect
              className={length > 0 ? 'art__fill' : 'art__fill-soft'}
              x={length > 0 ? 240 : 240 + length}
              y={y}
              width={Math.abs(length)}
              height="16"
              rx="5"
            />
          </g>
        )
      })}
    </Window>
  )
}

// Eight pipeline stages snaking across two rows; the last one checked off.
const STAGES = [110, 190, 270, 350, 350, 270, 190, 110].map((x, i) => ({
  x,
  y: i < 4 ? 150 : 240,
}))

function Pipeline() {
  return (
    <Window>
      <path className="art__track" d="M110 150H350C400 150 400 240 350 240H110" />
      {STAGES.map(({ x, y }, i) =>
        i === STAGES.length - 1 ? (
          <g key={i}>
            <circle className="art__fill" cx={x} cy={y} r="15" />
            <path className="art__check" d={`M${x - 6} ${y}l4 4 8-9`} />
          </g>
        ) : (
          <g key={i}>
            <circle className="art__node" cx={x} cy={y} r="13" />
            <circle className="art__fill" cx={x} cy={y} r="4" />
          </g>
        )
      )}
    </Window>
  )
}

// A price line with the latest point marked and a forecast cone beyond it.
const PRICES = [250, 236, 244, 220, 226, 198, 206, 178, 186, 160, 150]

function Forecast() {
  const gradient = useId()
  const line = `M${PRICES.map((y, i) => `${80 + i * 25} ${y}`).join('L')}`

  return (
    <Window>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[130, 170, 210, 250].map((y) => (
        <path key={y} className="art__rule" d={`M76 ${y}h328`} />
      ))}
      <path d={`${line}L330 290H80Z`} fill={`url(#${gradient})`} />
      <path className="art__cone" d="M330 150 400 100v40Z" />
      <path className="art__axis" d="M330 102v190" />
      <path className="art__forecast" d="M330 150 400 120" />
      <path className="art__line" d={line} />
      <circle className="art__halo" cx="330" cy="150" r="11" />
      <circle className="art__fill" cx="330" cy="150" r="5" />
    </Window>
  )
}

const ART = {
  credscore: ShapBars,
  'product-intelligence': Pipeline,
  tradeflow: Forecast,
}

export default function ProjectArt({ id }) {
  const Art = ART[id] ?? Pipeline
  return (
    <svg
      className="art"
      viewBox="0 0 480 360"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <Art />
    </svg>
  )
}
