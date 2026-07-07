import type { CSSProperties } from 'react'

interface Props {
  size?: number
  showText?: boolean
  style?: CSSProperties
}

export default function Logo({ size = 40, showText = false, style }: Props) {
  const s = size

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s * 0.3, ...style }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Triangle — warm tan */}
        <polygon
          points="18,72 38,28 58,72"
          fill="#c4a882"
        />

        {/* Circle — sage green */}
        <circle
          cx="58"
          cy="52"
          r="20"
          fill="#a8b89a"
        />

        {/* Square — dusty rose */}
        <rect
          x="62"
          y="38"
          width="28"
          height="28"
          fill="#c8847a"
        />
      </svg>
      {showText && (
        <div>
          <div style={{
            fontSize: s * 0.42,
            fontWeight: 900,
            color: '#2c2418',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}>
            KasukuGames
          </div>
          <div style={{
            fontSize: s * 0.15,
            fontWeight: 700,
            color: '#8a7e6e',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            marginTop: s * 0.06,
          }}>
            Olympics of the Mind
          </div>
        </div>
      )}
    </div>
  )
}
