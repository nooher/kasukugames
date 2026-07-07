import type { CSSProperties } from 'react'
import { MUHURI_META, type MuhuriType, isVerifiedTier } from '../lib/rewards'

interface Props {
  muhuri: MuhuriType
  size?: number
  style?: CSSProperties
}

export default function VerifiedBadge({ muhuri, size = 14, style }: Props) {
  if (!isVerifiedTier(muhuri)) return null

  const meta = MUHURI_META[muhuri]
  const s = size

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-label={meta.label}
    >
      <path
        d="M12 1.5l2.61 3.13 4.02.58-2.48 3.24.21 4.05L12 10.77 7.64 12.5l.21-4.05L5.37 5.21l4.02-.58L12 1.5z"
        fill={meta.sealColor}
      />
      <path
        d="M12 2.5l2.25 2.7 3.47.5-2.14 2.8.18 3.5L12 10.07 8.24 12l.18-3.5L6.28 5.7l3.47-.5L12 2.5z"
        fill={meta.sealColor}
        opacity={0.85}
      />
      <path
        d="M10.5 12.2l-2.4-2.4 1.2-1.2 1.2 1.2 3-3 1.2 1.2-4.2 4.2z"
        fill="#fff"
      />
      <path
        d="M12 0l2.85 3.42 4.4.64-2.72 3.54.23 4.43L12 9.82 7.24 12.03l.23-4.43L4.75 4.06l4.4-.64L12 0z"
        fill={meta.sealColor}
        opacity={0.15}
      />
    </svg>
  )
}
