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
          points="20,70 37,30 54,70"
          fill="#c4a882"
          opacity={0.9}
        />

        {/* Overlap shadow between triangle and circle */}
        <circle
          cx="60"
          cy="50"
          r="18"
          fill="rgba(20,16,10,0.08)"
        />

        {/* Circle — sage green */}
        <circle
          cx="60"
          cy="50"
          r="18"
          fill="#a8b89a"
          opacity={0.85}
        />

        {/* Overlap shadow between circle and square */}
        <rect
          x="64"
          y="40"
          width="24"
          height="24"
          fill="rgba(20,16,10,0.06)"
          rx="2"
        />

        {/* Square — dusty rose */}
        <rect
          x="64"
          y="40"
          width="24"
          height="24"
          fill="#c8847a"
          opacity={0.9}
          rx="2"
        />
      </svg>
      {showText && (
        <div>
          <div style={{
            fontSize: s * 0.42,
            fontWeight: 600,
            color: '#2c2418',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            KasukuGames
          </div>
          <div style={{
            fontSize: s * 0.13,
            fontWeight: 500,
            color: '#8a7e6e',
            letterSpacing: '0.12em',
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
