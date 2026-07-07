import type { CSSProperties } from 'react'

interface Props {
  size?: number
  showText?: boolean
  style?: CSSProperties
}

export default function Logo({ size = 40, showText = false, style }: Props) {
  const s = size
  const animId = `kg-pulse-${Math.random().toString(36).slice(2, 8)}`

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s * 0.3, ...style }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes ${animId} {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `}</style>

        {/* Brain hemisphere outline — left arc */}
        <path
          d="M50 18 C32 18, 18 32, 18 50 C18 68, 32 82, 50 82"
          stroke="#3a86ff"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Brain hemisphere outline — right arc */}
        <path
          d="M50 18 C68 18, 82 32, 82 50 C82 68, 68 82, 50 82"
          stroke="#3a86ff"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Central fissure line */}
        <line
          x1="50" y1="18"
          x2="50" y2="82"
          stroke="#3a86ff"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* Neural pathway — horizontal left */}
        <path
          d="M30 45 C38 45, 42 38, 50 35"
          stroke="#3a86ff"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* Neural pathway — horizontal right */}
        <path
          d="M70 55 C62 55, 58 62, 50 65"
          stroke="#3a86ff"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* Neural pathway — diagonal cross */}
        <path
          d="M35 65 C42 58, 50 50, 65 40"
          stroke="#3a86ff"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* Circuit connection lines — node to node */}
        <line x1="30" y1="45" x2="65" y2="40" stroke="#3a86ff" strokeWidth="1" opacity="0.25" />
        <line x1="65" y1="40" x2="50" y2="65" stroke="#3a86ff" strokeWidth="1" opacity="0.25" />
        <line x1="50" y1="65" x2="30" y2="45" stroke="#3a86ff" strokeWidth="1" opacity="0.25" />

        {/* Node 1 — left hemisphere, emerald */}
        <circle
          cx="30" cy="45" r="4.5"
          fill="#00c97b"
          style={{ animation: `${animId} 3s ease-in-out infinite` }}
        />
        <circle cx="30" cy="45" r="2" fill="#0a1628" />

        {/* Node 2 — right upper, emerald */}
        <circle
          cx="65" cy="40" r="4.5"
          fill="#00c97b"
          style={{ animation: `${animId} 3s ease-in-out 1s infinite` }}
        />
        <circle cx="65" cy="40" r="2" fill="#0a1628" />

        {/* Node 3 — bottom center, amber highlight */}
        <circle
          cx="50" cy="65" r="4.5"
          fill="#f59e0b"
          style={{ animation: `${animId} 3s ease-in-out 2s infinite` }}
        />
        <circle cx="50" cy="65" r="2" fill="#0a1628" />

        {/* Micro accent dots along the brain arcs */}
        <circle cx="25" cy="60" r="1.5" fill="#3a86ff" opacity="0.4" />
        <circle cx="38" cy="24" r="1.5" fill="#3a86ff" opacity="0.4" />
        <circle cx="62" cy="24" r="1.5" fill="#3a86ff" opacity="0.4" />
        <circle cx="75" cy="60" r="1.5" fill="#3a86ff" opacity="0.4" />
        <circle cx="40" cy="78" r="1.5" fill="#3a86ff" opacity="0.3" />
        <circle cx="60" cy="78" r="1.5" fill="#3a86ff" opacity="0.3" />
      </svg>
      {showText && (
        <div>
          <div style={{
            fontSize: s * 0.42,
            fontWeight: 900,
            color: '#f0f4f8',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}>
            KasukuGames
          </div>
          <div style={{
            fontSize: s * 0.15,
            fontWeight: 700,
            color: '#5a6d85',
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
