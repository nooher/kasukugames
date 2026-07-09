import { Component, type ReactNode } from 'react'
import { t } from '../lib/i18n'

// Wraps a lazily-loaded game. If its chunk fails to fetch (common on weak
// Tanzanian mobile networks) or the game throws, this shows a recover/retry
// screen instead of white-screening the whole app.
export default class GameErrorBoundary extends Component<
  { onBack: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { /* fallback UI is enough; no external logger here */ }

  render() {
    if (this.state.failed) {
      const btn = (bg: string, color: string): React.CSSProperties => ({
        background: bg, color, border: 'none', borderRadius: 12,
        padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
      })
      return (
        <div style={{ minHeight: '100vh', background: '#0b0f14', color: '#ece6da', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 44 }} aria-hidden>🎮</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t('game_load_failed')}</div>
          <div style={{ fontSize: 14, opacity: 0.72, maxWidth: 320, lineHeight: 1.5 }}>{t('game_load_failed_body')}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={() => window.location.reload()} style={btn('#c4a882', '#0b0f14')}>{t('try_again')}</button>
            <button onClick={() => { this.setState({ failed: false }); this.props.onBack() }} style={btn('rgba(255,255,255,0.08)', '#ece6da')}>{t('back_to_games')}</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
