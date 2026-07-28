import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react'

// Shared premium end-of-game card. Self-contained (its own dark glass surface +
// accent), so any game can drop it inside its existing game-over overlay without
// inheriting the game's ad-hoc styles. Accent drives the colour; games pass their
// own theme colour so the card feels native.

export interface GameStat {
  label: string
  value: string | number
  color?: string
}

interface Props {
  score: number | string
  scoreLabel?: string
  title?: string
  stats?: GameStat[]
  best?: number | string
  isNewBest?: boolean
  accent?: string
  onReplay: () => void
  replayLabel?: string
  onHome?: () => void
}

const STYLE_ID = 'kg-gameover-anim'
function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes kgGoPop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
    @keyframes kgGoRise{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:1}}
    @keyframes kgGoGlow{0%,100%{opacity:.55}50%{opacity:1}}
  `
  document.head.appendChild(el)
}

export default function GameOverCard({
  score, scoreLabel = 'Score', title = 'Game Over', stats = [], best,
  isNewBest = false, accent = '#c9a96e', onReplay, replayLabel = 'Play Again', onHome,
}: Props) {
  ensureStyle()
  const darker = accent + 'cc'

  return (
    <div
      role="dialog"
      aria-label={`${title} — ${scoreLabel} ${score}`}
      style={{
        width: 'min(360px, 88vw)',
        background: 'linear-gradient(165deg, rgba(28,24,40,0.96), rgba(16,14,24,0.96))',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 26,
        padding: '30px 26px 24px',
        textAlign: 'center',
        boxShadow: `0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.06)`,
        animation: 'kgGoPop .4s cubic-bezier(.16,1,.3,1) both',
        color: '#efeadf',
        fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      }}
    >
      {/* Medallion */}
      <div style={{ position: 'relative', width: 66, height: 66, margin: '0 auto 16px' }}>
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55, transparent 70%)`,
          animation: 'kgGoGlow 2.4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'relative', width: 66, height: 66, borderRadius: 20,
          background: `linear-gradient(140deg, ${accent}, ${darker})`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 8px 24px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}>
          {isNewBest ? <Sparkles size={30} color="#fff" /> : <Trophy size={30} color="#fff" />}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(239,234,223,0.55)', marginBottom: 12 }}>
        {title}
      </div>

      {/* Big score */}
      <div style={{ animation: 'kgGoRise .5s ease .06s both' }}>
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: accent, fontVariantNumeric: 'tabular-nums', textShadow: `0 2px 20px ${accent}44` }}>
          {typeof score === 'number' ? score.toLocaleString() : score}
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(239,234,223,0.5)', marginTop: 6 }}>
          {scoreLabel}
        </div>
      </div>

      {/* Secondary stats */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 26, margin: '20px 0 4px', animation: 'kgGoRise .5s ease .12s both' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color || '#efeadf', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(239,234,223,0.45)', marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Best / new-best */}
      {isNewBest ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '18px 0 6px', padding: '6px 14px', borderRadius: 999, background: `${accent}1f`, border: `1px solid ${accent}44`, color: accent, fontSize: 12, fontWeight: 700, animation: 'kgGoRise .5s ease .18s both' }}>
          <Sparkles size={13} /> New best!
        </div>
      ) : best !== undefined ? (
        <div style={{ fontSize: 12, color: 'rgba(239,234,223,0.55)', margin: '16px 0 6px', fontWeight: 600 }}>
          Best · {typeof best === 'number' ? best.toLocaleString() : best}
        </div>
      ) : <div style={{ height: 8 }} />}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {onHome && (
          <button onClick={onHome} style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '13px 18px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(239,234,223,0.8)', fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit', transition: 'transform .15s ease, filter .15s ease',
          }}>
            <Home size={16} />
          </button>
        )}
        <button onClick={onReplay} style={{
          flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 20px', borderRadius: 14, cursor: 'pointer', border: 'none',
          background: `linear-gradient(105deg, ${accent}, ${darker})`, color: '#fff',
          fontSize: 15, fontWeight: 800, letterSpacing: '0.01em', fontFamily: 'inherit',
          boxShadow: `0 6px 20px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
          transition: 'transform .15s ease, filter .15s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.07)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
        >
          <RotateCcw size={16} /> {replayLabel}
        </button>
      </div>
    </div>
  )
}
