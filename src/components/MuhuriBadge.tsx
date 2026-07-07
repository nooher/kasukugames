import type { CSSProperties } from 'react'
import { MUHURI_META, isVerifiedTier } from '../lib/rewards'
import type { MuhuriType } from '../lib/rewards'

interface Props {
  type: MuhuriType
  size?: number
  style?: CSSProperties
}

/**
 * Muhuri verification badge — original insignia per tier.
 * Solid fills, no gradients, glass-finish edge highlight.
 */
export default function MuhuriBadge({ type, size = 16, style }: Props) {
  if (!isVerifiedTier(type)) return null

  const meta = MUHURI_META[type]
  const fill = meta.sealColor
  // Lighter edge highlight for glass finish
  const highlight = '#fff'

  const common: CSSProperties = {
    flexShrink: 0,
    display: 'inline-block',
    verticalAlign: 'middle',
    filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.18))`,
    ...style,
  }

  if (type === 'founder') {
    // Shield with inner star — authority + prestige
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={common} aria-label={meta.label}>
        {/* Shield body */}
        <path
          d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 1z"
          fill={fill}
        />
        {/* Top edge highlight */}
        <path
          d="M12 1L3 5v1l9-4 9 4V5L12 1z"
          fill={highlight}
          opacity={0.25}
        />
        {/* Inner star */}
        <path
          d="M12 6.5l1.45 2.94 3.24.47-2.35 2.29.56 3.23L12 13.82l-2.9 1.61.56-3.23-2.35-2.29 3.24-.47L12 6.5z"
          fill={highlight}
          opacity={0.95}
        />
      </svg>
    )
  }

  if (type === 'admin') {
    // Hexagonal authority seal
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={common} aria-label={meta.label}>
        {/* Hexagon */}
        <path
          d="M12 1L21.5 6.5v11L12 23 2.5 17.5v-11L12 1z"
          fill={fill}
        />
        {/* Top edge highlight */}
        <path
          d="M12 1L21.5 6.5l-.001.8L12 2.2 2.501 7.3 2.5 6.5 12 1z"
          fill={highlight}
          opacity={0.2}
        />
        {/* Inner bolt / authority mark */}
        <path
          d="M13.5 6L10 12.5h3L10 18l7-7.5h-3.5L17 6h-3.5z"
          fill={highlight}
          opacity={0.92}
        />
      </svg>
    )
  }

  if (type === 'creator') {
    // Flame / spark emblem — creative energy
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={common} aria-label={meta.label}>
        {/* Outer flame silhouette */}
        <path
          d="M12 1C12 1 5 8.5 5 14a7 7 0 0014 0C19 8.5 12 1 12 1z"
          fill={fill}
        />
        {/* Top edge highlight */}
        <path
          d="M12 1c.8 1.1 1.8 2.5 2.7 4C13.5 3.2 12 1 12 1zm-4.5 7.5C8.8 6.8 10.4 4.2 12 1c-1.6 3.2-3.2 5.8-4.5 7.5z"
          fill={highlight}
          opacity={0.2}
        />
        {/* Inner spark — bright core */}
        <path
          d="M12 9c0 0-3.5 3.5-3.5 6.5a3.5 3.5 0 007 0C15.5 12.5 12 9 12 9z"
          fill={highlight}
          opacity={0.9}
        />
      </svg>
    )
  }

  if (type === 'verified') {
    // Octagonal seal with checkmark
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={common} aria-label={meta.label}>
        {/* Octagonal seal */}
        <path
          d="M8.5 1.5h7l5 5v7l-5 5h-7l-5-5v-7l5-5z"
          fill={fill}
        />
        {/* Top edge highlight */}
        <path
          d="M8.5 1.5h7l1 1h-9l-1 1v-1l2-1z"
          fill={highlight}
          opacity={0.22}
        />
        {/* Checkmark */}
        <path
          d="M7.5 12.5l3 3 6-6.5"
          stroke={highlight}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.95}
        />
      </svg>
    )
  }

  return null
}
