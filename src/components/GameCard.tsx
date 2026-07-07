import { useState } from 'react'
import { Play, Clock, Users, Zap } from 'lucide-react'
import { COLOR, RADIUS, card, cardHover } from '../lib/design'
import { TARGET_META, CATEGORY_META, type GameDef } from '../lib/cognitive'

interface Props {
  game: GameDef
  onPlay: (id: string) => void
}

export default function GameCard({ game, onPlay }: Props) {
  const [hovered, setHovered] = useState(false)
  const catMeta = CATEGORY_META[game.category]

  return (
    <button
      onClick={() => onPlay(game.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...card(catMeta.color),
        ...(hovered ? cardHover(catMeta.color) : {}),
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Color bar */}
      <div style={{ height: 4, background: catMeta.color }} />

      <div style={{ padding: '16px 18px 18px' }}>
        {/* Category chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: catMeta.color + '18', color: catMeta.color,
          borderRadius: RADIUS.full, padding: '3px 10px',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          marginBottom: 10,
        }}>
          {catMeta.label}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 4px', color: COLOR.white, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {game.title}
        </h3>
        <p style={{ margin: '0 0 12px', color: COLOR.muted, fontSize: 12, lineHeight: 1.4 }}>
          {game.subtitle}
        </p>

        {/* Cognitive targets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {game.targets.slice(0, 3).map(t => {
            const meta = TARGET_META[t]
            return (
              <span key={t} style={{
                background: meta.color + '15', color: meta.color,
                borderRadius: RADIUS.full, padding: '2px 8px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.03em',
                border: `1px solid ${meta.color}20`,
              }}>
                {meta.label}
              </span>
            )
          })}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: COLOR.dim }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} /> {game.duration}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={11} /> {game.players}
          </span>
          <span style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 3,
            color: game.difficulty === 'expert' ? COLOR.rose :
                   game.difficulty === 'advanced' ? COLOR.amber :
                   game.difficulty === 'intermediate' ? COLOR.teal : COLOR.emerald,
            fontWeight: 600, textTransform: 'capitalize',
          }}>
            <Zap size={11} /> {game.difficulty}
          </span>
        </div>

        {/* Play overlay on hover */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: RADIUS.lg,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: catMeta.color, color: '#fff',
              display: 'grid', placeItems: 'center',
              boxShadow: `0 4px 20px ${catMeta.color}60`,
            }}>
              <Play size={22} style={{ marginLeft: 2 }} />
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
