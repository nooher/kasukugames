import { useState } from 'react'
import { Clock, Users, Zap } from 'lucide-react'
import { COLOR, RADIUS, MOTION } from '../lib/design'
import { TARGET_META, CATEGORY_META, type GameDef } from '../lib/cognitive'

interface Props {
  game: GameDef
  onPlay: (id: string) => void
}

const DIFFICULTY_COLOR = {
  beginner: COLOR.emerald,
  intermediate: COLOR.teal,
  advanced: COLOR.amber,
  expert: COLOR.rose,
} as const

export default function GameCard({ game, onPlay }: Props) {
  const [hovered, setHovered] = useState(false)
  const cat = CATEGORY_META[game.category]

  return (
    <button
      onClick={() => onPlay(game.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        overflow: 'hidden',
        background: '#1e1a14',
        border: `1px solid ${hovered ? cat.color + '50' : '#2a2418'}`,
        borderRadius: 16,
        boxShadow: hovered
          ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${cat.color}30, 0 0 24px ${cat.color}10`
          : `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(20,16,10,0.03), 0 4px 16px rgba(0,0,0,0.2)`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: [
          `transform ${MOTION.fast}`,
          `box-shadow ${MOTION.fast}`,
          `border-color ${MOTION.fast}`,
        ].join(', '),
      }}
    >
      {/* Left-side color accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: cat.color,
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Top row: category chip + emoji icon */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          {/* Category chip */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: cat.color + '18',
            color: cat.color,
            borderRadius: RADIUS.full,
            padding: '3px 10px',
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {cat.label}
          </span>

          {/* Category badge */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: cat.color + '14',
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
            fontWeight: 600,
            color: cat.color,
            lineHeight: 1,
            flexShrink: 0,
          }}>
            {cat.label.charAt(0)}
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 2px',
          color: '#ece6dc',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          {game.title}
        </h3>

        {/* Subtitle */}
        <p style={{
          margin: '0 0 14px',
          color: COLOR.muted,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {game.subtitle}
        </p>

        {/* Cognitive target chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {game.targets.slice(0, 3).map(t => {
            const m = TARGET_META[t]
            return (
              <span key={t} style={{
                background: m.color + '12',
                color: m.color,
                border: `1px solid ${m.color}18`,
                borderRadius: RADIUS.full,
                padding: '3px 10px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}>
                {m.label}
              </span>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: '#2a2418',
          marginBottom: 14,
          marginTop: 16,
        }} />

        {/* Meta row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: COLOR.dim,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} /> {game.duration}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={11} /> {game.players}
          </span>
          <span style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: DIFFICULTY_COLOR[game.difficulty],
            fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            <Zap size={11} /> {game.difficulty}
          </span>
        </div>
      </div>
    </button>
  )
}
