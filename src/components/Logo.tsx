import type { CSSProperties } from 'react'

interface Props {
  size?: number
  showText?: boolean
  style?: CSSProperties
}

export default function Logo({ size = 40, showText = false, style }: Props) {
  const s = size
  const pad = s * 0.12
  const shapeSize = s * 0.28

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s * 0.3, ...style }}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle — pattern recognition, wholeness */}
        <circle
          cx={s * 0.3}
          cy={s * 0.35}
          r={shapeSize * 0.48}
          fill="#3a86ff"
        />
        {/* Triangle — growth, strategy */}
        <polygon
          points={`${s * 0.7},${pad + shapeSize * 0.15} ${s * 0.7 + shapeSize * 0.45},${pad + shapeSize * 1.05} ${s * 0.7 - shapeSize * 0.45},${pad + shapeSize * 1.05}`}
          fill="#00c97b"
        />
        {/* Square — structure, logic */}
        <rect
          x={s * 0.5 - shapeSize * 0.38}
          y={s * 0.62}
          width={shapeSize * 0.76}
          height={shapeSize * 0.76}
          rx={shapeSize * 0.08}
          fill="#f59e0b"
        />
      </svg>
      {showText && (
        <div>
          <div style={{
            fontSize: s * 0.45,
            fontWeight: 800,
            color: '#e8edf5',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            KasukuGames
          </div>
          <div style={{
            fontSize: s * 0.18,
            fontWeight: 600,
            color: '#4a5d75',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: s * 0.04,
          }}>
            Olympics of the Mind
          </div>
        </div>
      )}
    </div>
  )
}
