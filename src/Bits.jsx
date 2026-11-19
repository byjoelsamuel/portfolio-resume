// Small shared graphics: the emblem, barcode and speaker rings.

export function Emblem({ className, strokeWidth = 8 }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" />
      <path
        d="M26 38H64L72 46M74 62H36L28 54M64 38L36 62"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="75" r="4" fill="currentColor" />
      <circle cx="72" cy="75" r="4" fill="currentColor" />
    </svg>
  )
}

// Deterministic fake barcode built from the product code.
export function Barcode({ value, className }) {
  let x = 0
  const bars = []
  for (let i = 0; i < value.length * 3; i++) {
    const c = value.charCodeAt(i % value.length) + i * 7
    const w = (c % 3) + 1
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y="0" width={w} height="30" />)
    x += w
  }
  return (
    <svg className={className} viewBox={`0 0 ${x} 30`} preserveAspectRatio="none" aria-hidden="true">
      {bars}
    </svg>
  )
}

export function Rings({ className }) {
  return (
    <svg className={className} viewBox="0 0 66 20" aria-hidden="true">
      {[10, 33, 56].map((cx) => (
        <g key={cx} fill="none" stroke="currentColor">
          <circle cx={cx} cy="10" r="8.5" strokeWidth="2" />
          <circle cx={cx} cy="10" r="3.5" strokeWidth="2" />
        </g>
      ))}
    </svg>
  )
}
