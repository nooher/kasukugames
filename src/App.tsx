import { useState, lazy, Suspense, useEffect, type CSSProperties } from 'react'
import {
  Brain, Zap, Languages, Lightbulb, Heart, Timer, Stethoscope,
  Bot, Gamepad2, Music, Trophy, Search, ArrowLeft, Users, PartyPopper,
  Flame, Star, Target, Crown, Award, LogIn, UserPlus, Send,
  BarChart3, Calendar, TrendingUp, Bell, Coins, Gift, ShoppingBag,
  Download, X, Sparkles, Check, Trash2,
} from 'lucide-react'
import { RADIUS, MOTION, solidBtn } from './lib/design'
import { PALETTE } from './lib/brand'
import { GAMES } from './lib/games'
import { CATEGORY_META, TARGET_META, type GameCategory } from './lib/cognitive'
import {
  loadProfile, createProfile, updateProfileAfterGame,
  xpToNextLevel, RANK_META, BADGES, generateDailyChallenges,
  type PlayerProfile,
} from './lib/rewards'
import {
  LEADERBOARD_CATEGORIES, generateDemoLeaderboard,
} from './lib/social'
import {
  loadWallet, earnTokens, spendTokens, purchaseTokens,
  SHOP, TOKEN_PACKS, TOKEN_EARN_RATES, type TokenWallet,
} from './lib/tokens'
import {
  loadNotifications, markAllRead, getUnreadCount,
  requestNotificationPermission, submitScore,
} from './lib/notifications'
import {
  processLogin, spinLuckyDraw, checkMilestones,
  LOGIN_REWARD_SCHEDULE, loadEngagement,
} from './lib/engagement'
import {
  loadConnections, addConnection, removeConnection,
  RELATION_META, PARTY_GAMES,
  generateWhatsAppInvite, generateInstagramInvite,
  type Connection, type RelationType,
} from './lib/connections'
import GameCard from './components/GameCard'
import Logo from './components/Logo'
import FloatingPlayer from './components/FloatingPlayer'

const MatrixForge = lazy(() => import('./games/MatrixForge'))
const SequenceCollapse = lazy(() => import('./games/SequenceCollapse'))
const SplitDecision = lazy(() => import('./games/SplitDecision'))
const SignalNoise = lazy(() => import('./games/SignalNoise'))
const WordForge = lazy(() => import('./games/WordForge'))
const ImpossibleUses = lazy(() => import('./games/ImpossibleUses'))
const MemoryMarathon = lazy(() => import('./games/MemoryMarathon'))
const FocusTower = lazy(() => import('./games/FocusTower'))
const CognitiveOverload = lazy(() => import('./games/CognitiveOverload'))
const PatternHunter = lazy(() => import('./games/PatternHunter'))
const SpatialArchitect = lazy(() => import('./games/SpatialArchitect'))
const MoralDilemmas = lazy(() => import('./games/MoralDilemmas'))
const RiskAppetite = lazy(() => import('./games/RiskAppetite'))
const BrickBreaker = lazy(() => import('./games/BrickBreaker'))
const BlockFlow = lazy(() => import('./games/BlockFlow'))
const DiagnosisSprint = lazy(() => import('./games/DiagnosisSprint'))
const DebateAI = lazy(() => import('./games/DebateAI'))
const TruthOrDare = lazy(() => import('./games/TruthOrDare'))
const NeverHaveIEver = lazy(() => import('./games/NeverHaveIEver'))
const GuessWhat = lazy(() => import('./games/GuessWhat'))
const DraftChase = lazy(() => import('./games/DraftChase'))

type GameComp = React.LazyExoticComponent<React.ComponentType<{ onBack: () => void }>>
const GAME_COMPONENTS: Record<string, GameComp> = {
  'matrix-forge': MatrixForge,
  'sequence-collapse': SequenceCollapse,
  'split-decision': SplitDecision,
  'signal-noise': SignalNoise,
  'word-forge': WordForge,
  'impossible-uses': ImpossibleUses,
  'memory-marathon': MemoryMarathon,
  'focus-tower': FocusTower,
  'cognitive-overload': CognitiveOverload,
  'pattern-hunter': PatternHunter,
  'spatial-architect': SpatialArchitect,
  'moral-dilemmas': MoralDilemmas,
  'risk-appetite': RiskAppetite,
  'brick-breaker': BrickBreaker,
  'tetris-flow': BlockFlow,
  'diagnosis-sprint': DiagnosisSprint,
  'debate-ai': DebateAI,
  'truth-or-dare': TruthOrDare,
  'never-have-i-ever': NeverHaveIEver,
  'guess-what': GuessWhat,
  'draft-chase': DraftChase,
}

const CATEGORY_ICONS: Record<GameCategory, React.ReactNode> = {
  'iq-arena': <Brain size={16} />,
  'fast-brain': <Zap size={16} />,
  'language-arena': <Languages size={16} />,
  'creativity-lab': <Lightbulb size={16} />,
  'psychological': <Heart size={16} />,
  'social': <Users size={16} />,
  'mental-endurance': <Timer size={16} />,
  'medical': <Stethoscope size={16} />,
  'ai-games': <Bot size={16} />,
  'party': <PartyPopper size={16} />,
  'classic': <Gamepad2 size={16} />,
}

type Section = 'home' | 'leaderboard' | 'profile' | 'daily' | 'shop' | 'notifications' | 'connections'

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile | null>(loadProfile)
  const [section, setSection] = useState<Section>('home')
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<GameCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [playerVisible, setPlayerVisible] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginName, setLoginName] = useState('')
  const [loginDisplay, setLoginDisplay] = useState('')
  const [wallet, setWallet] = useState<TokenWallet>(loadWallet)
  const [unreadNotifs, setUnreadNotifs] = useState(getUnreadCount)
  const [loginReward, setLoginReward] = useState<{ tokens: number; day: number; isComeback: boolean; comebackBonus: number } | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [luckyResult, setLuckyResult] = useState<{ tokens: number; label: string } | null>(null)

  useEffect(() => {
    requestNotificationPermission()
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (profile) {
      const result = processLogin()
      if (result.tokens > 0) {
        setLoginReward(result)
        const w = earnTokens(result.tokens, result.isComeback ? `Karibu tena! +${result.comebackBonus}` : `Tuzo ya kuingia siku ${result.day}`)
        setWallet(w)
      }
      const milestones = checkMilestones(profile)
      for (const m of milestones) {
        const w = earnTokens(m.tokens, `Hatua: ${m.label}`)
        setWallet(w)
      }
    }
  }, [profile?.id])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  const filtered = GAMES.filter(g => {
    const matchesCat = activeCat === 'all' || g.category === activeCat
    const matchesQuery = !query || [g.title, g.subtitle, g.description, ...g.targets].join(' ').toLowerCase().includes(query.toLowerCase())
    return matchesCat && matchesQuery
  })

  const catCounts = new Map<GameCategory, number>()
  for (const g of GAMES) catCounts.set(g.category, (catCounts.get(g.category) || 0) + 1)

  const handleLogin = () => {
    if (!loginName.trim()) return
    const p = createProfile(loginName.trim().toLowerCase().replace(/\s+/g, '_'), loginDisplay.trim() || loginName.trim())
    setProfile(p)
    setShowLogin(false)
  }

  const handleGameBack = () => {
    const score = Math.floor(Math.random() * 500 + 100)
    const p = updateProfileAfterGame(score, Math.random() * 0.5 + 0.5, Math.floor(Math.random() * 5 + 1))
    if (p) {
      setProfile(p)
      if (activeGame) {
        const game = GAMES.find(g => g.id === activeGame)
        if (game && p) {
          submitScore(activeGame, game.title, p.id, p.displayName, score)
        }
        const w = earnTokens(TOKEN_EARN_RATES.gameComplete, `Umekamilisha ${game?.title || 'mchezo'}`)
        setWallet(w)
      }
    }
    setActiveGame(null)
  }

  const handleLuckyDraw = () => {
    const result = spinLuckyDraw()
    if (result) {
      const w = earnTokens(result.tokens, `Bahati nasibu: ${result.label}`)
      setWallet(w)
      setLuckyResult(result)
      setTimeout(() => setLuckyResult(null), 3000)
    }
  }

  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame]
    if (GameComponent) {
      return (
        <Suspense fallback={<Loading />}>
          <GameComponent onBack={handleGameBack} />
          <FloatingPlayer visible={playerVisible} onToggle={() => setPlayerVisible(false)} />
        </Suspense>
      )
    }
    return (
      <div style={{ padding: '80px 4vw', textAlign: 'center' }}>
        <p style={{ color: P.textMuted, fontSize: 16, marginBottom: 20 }}>
          {GAMES.find(g => g.id === activeGame)?.title || activeGame} — Inakuja hivi karibuni
        </p>
        <button onClick={() => setActiveGame(null)} style={solidBtn(P.sapphire)}>
          <ArrowLeft size={16} /> Rudi Nyumbani
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: P.bg }}>
      {/* === HEADER === */}
      <header style={headerStyle}>
        <button onClick={() => setSection('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Logo size={36} showText />
        </button>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NavBtn icon={<Calendar size={18} />} label="Daily" active={section === 'daily'} onClick={() => setSection('daily')} />
          <NavBtn icon={<Trophy size={18} />} label="Ranks" active={section === 'leaderboard'} onClick={() => setSection('leaderboard')} />
          <NavBtn icon={<Users size={18} />} label="" active={section === 'connections'} onClick={() => setSection('connections')} />
          <NavBtn icon={<ShoppingBag size={18} />} label="" active={section === 'shop'} onClick={() => setSection('shop')} />
          <button onClick={() => { setSection('notifications'); markAllRead(); setUnreadNotifs(0) }} style={{ ...navBtnStyle, position: 'relative' }}>
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                background: P.rose, fontSize: 8, fontWeight: 800,
                display: 'grid', placeItems: 'center', color: '#fff',
              }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
            )}
          </button>
          <NavBtn icon={<Music size={18} />} label="" active={playerVisible} onClick={() => setPlayerVisible(p => !p)} accent={playerVisible ? P.amber : undefined} />
          {profile ? (
            <button onClick={() => setSection('profile')} style={{
              ...navBtnStyle,
              background: section === 'profile' ? P.sapphire + '20' : 'none',
              gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>{profile.avatar}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: RANK_META[profile.rank].color }}>{profile.level}</span>
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ ...navBtnStyle, color: P.sapphire }}>
              <LogIn size={18} />
            </button>
          )}
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: RADIUS.full, background: P.gold + '12', border: `1px solid ${P.gold}20`, marginLeft: 4 }}>
              <Coins size={12} color={P.gold} />
              <span style={{ fontSize: 11, fontWeight: 800, color: P.gold, fontVariantNumeric: 'tabular-nums' }}>{wallet.balance}</span>
            </div>
          )}
        </nav>
      </header>

      {/* === LOGIN MODAL === */}
      {showLogin && (
        <div style={modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <Logo size={32} style={{ marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: P.text }}>Jiunge na KasukuGames</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: P.textMuted }}>Tumia jina lako la Kasuku au tengeneza mpya</p>
            <input
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              placeholder="Username"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle}
              autoFocus
            />
            <input
              value={loginDisplay}
              onChange={e => setLoginDisplay(e.target.value)}
              placeholder="Display name (optional)"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...inputStyle, marginTop: 10 }}
            />
            <button onClick={handleLogin} style={{ ...solidBtn(P.sapphire), width: '100%', justifyContent: 'center', marginTop: 16 }}>
              Ingia
            </button>
            <p style={{ margin: '16px 0 0', fontSize: 11, color: P.textDim, textAlign: 'center' }}>
              Shared login with Kasuku & Muhuri
            </p>
          </div>
        </div>
      )}

      {/* === SECTIONS === */}
      {section === 'home' && (
        <HomeSection
          filtered={filtered}
          activeCat={activeCat}
          setActiveCat={setActiveCat}
          query={query}
          setQuery={setQuery}
          catCounts={catCounts}
          onPlay={setActiveGame}
          profile={profile}
        />
      )}
      {section === 'daily' && <DailySection profile={profile} onPlay={setActiveGame} onLogin={() => setShowLogin(true)} onLuckyDraw={handleLuckyDraw} />}
      {section === 'leaderboard' && <LeaderboardSection profile={profile} />}
      {section === 'connections' && <ConnectionsSection profile={profile} onPlay={setActiveGame} onLogin={() => setShowLogin(true)} />}
      {section === 'shop' && <ShopSection wallet={wallet} setWallet={setWallet} />}
      {section === 'notifications' && <NotificationsSection />}
      {section === 'profile' && profile && <ProfileSection profile={profile} setProfile={setProfile} wallet={wallet} />}

      {/* Login reward toast */}
      {loginReward && loginReward.tokens > 0 && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: P.card, border: `1px solid ${P.gold}40`,
          borderRadius: RADIUS.lg, padding: '14px 24px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${P.gold}15`,
          zIndex: 1100, display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideUp 0.4s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Gift size={20} color={P.gold} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>
              {loginReward.isComeback ? 'Karibu tena!' : `Siku ${loginReward.day} — Tuzo ya Kuingia`}
            </div>
            <div style={{ fontSize: 11, color: P.gold }}>+{loginReward.tokens} sarafu</div>
          </div>
          <button onClick={() => setLoginReward(null)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lucky draw result */}
      {luckyResult && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: P.card, border: `1px solid ${P.gold}50`,
          borderRadius: RADIUS.xl, padding: '40px 48px', textAlign: 'center',
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${P.gold}20`,
          zIndex: 1200,
          animation: 'slideUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Sparkles size={32} color={P.gold} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 900, color: P.gold, marginBottom: 4 }}>+{luckyResult.tokens}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{luckyResult.label}</div>
        </div>
      )}

      {/* PWA install banner */}
      {showInstall && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: P.card, borderTop: `1px solid ${P.border}`,
          padding: '14px 4vw', display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 900,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        }}>
          <Download size={20} color={P.sapphire} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>Pakua KasukuGames</div>
            <div style={{ fontSize: 11, color: P.textMuted }}>Cheza offline, haraka zaidi</div>
          </div>
          <button onClick={handleInstall} style={{ ...solidBtn(P.sapphire), padding: '8px 18px', fontSize: 12 }}>
            Pakua
          </button>
          <button onClick={() => setShowInstall(false)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '32px 4vw 24px', borderTop: `1px solid ${P.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={20} />
          <span style={{ fontSize: 11, color: P.textDim }}>Cognitive Performance Platform by Laetoli</span>
        </div>
        <div style={{ fontSize: 10, color: P.textDim }}>
          {GAMES.length} disciplines · {new Set(GAMES.flatMap(g => g.targets)).size} cognitive targets
        </div>
      </footer>

      <FloatingPlayer visible={playerVisible} onToggle={() => setPlayerVisible(false)} />
    </div>
  )
}

/* ================================================================
   HOME SECTION
   ================================================================ */
function HomeSection({ filtered, activeCat, setActiveCat, query, setQuery, catCounts, onPlay, profile }: {
  filtered: typeof GAMES; activeCat: GameCategory | 'all'
  setActiveCat: (c: GameCategory | 'all') => void; query: string; setQuery: (q: string) => void
  catCounts: Map<GameCategory, number>; onPlay: (id: string) => void; profile: PlayerProfile | null
}) {
  const categories = Object.entries(CATEGORY_META) as [GameCategory, typeof CATEGORY_META[GameCategory]][]
  const dailyChallenges = generateDailyChallenges(Math.floor(Date.now() / 86400000))

  return (
    <>
      {/* Profile strip */}
      {profile && (
        <div style={{
          padding: '12px 4vw', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${P.border}`,
        }}>
          <span style={{ fontSize: 20 }}>{profile.avatar}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{profile.displayName}</span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: RANK_META[profile.rank].color,
                background: RANK_META[profile.rank].color + '18',
                padding: '2px 8px', borderRadius: RADIUS.full,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {RANK_META[profile.rank].label}
              </span>
            </div>
            <XPBar xp={profile.xp} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.amber }}>
              <Flame size={14} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>{profile.streakDays}</span>
            </div>
            <span style={{ fontSize: 9, color: P.textDim }}>streak</span>
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{ padding: '36px 4vw 28px' }} className="fade-in">
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: P.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Mental Athletics
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: P.textMuted, lineHeight: 1.6, maxWidth: 480 }}>
            Not games — mental sports. Train working memory, executive function, creativity, and strategic thinking. Every session makes you sharper.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(['working-memory', 'processing-speed', 'pattern-recognition', 'creativity', 'decision-making', 'linguistic-fluency'] as const).map(t => {
              const m = TARGET_META[t]
              return (
                <span key={t} style={{
                  background: m.color + '14', color: m.color,
                  borderRadius: RADIUS.full, padding: '3px 10px',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                  border: `1px solid ${m.color}20`,
                }}>
                  {m.label}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Daily challenges strip */}
      <div style={{ padding: '0 4vw 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Target size={14} color={P.amber} />
          <span style={{ fontSize: 12, fontWeight: 700, color: P.text }}>Changamoto za Leo</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {dailyChallenges.map(ch => (
            <button key={ch.id} onClick={() => onPlay(ch.gameId)} style={{
              background: P.card, border: `1px solid ${P.border}`,
              borderRadius: RADIUS.md, padding: '10px 16px', minWidth: 200,
              cursor: 'pointer', textAlign: 'left', flexShrink: 0,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.3)`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.text, marginBottom: 3 }}>{ch.title}</div>
              <div style={{ fontSize: 10, color: P.textMuted, marginBottom: 6 }}>{ch.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Star size={10} color={P.gold} />
                <span style={{ color: P.gold, fontWeight: 700 }}>+{ch.xpReward} XP</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 4vw 10px' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          maxWidth: 380, padding: '9px 14px',
          background: P.card, border: `1px solid ${P.border}`,
          borderRadius: RADIUS.md,
        }}>
          <Search size={15} color={P.textDim} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tafuta mchezo, cognitive target..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: P.text, fontSize: 12 }}
          />
        </label>
      </div>

      {/* Category nav */}
      <nav style={{ padding: '0 4vw 16px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <CatPill label="Zote" count={GAMES.length} active={activeCat === 'all'} color={P.sapphire} icon={<Gamepad2 size={13} />} onClick={() => setActiveCat('all')} />
        {categories.map(([key, meta]) => {
          const count = catCounts.get(key) || 0
          if (count === 0) return null
          return (
            <CatPill key={key} label={meta.label} count={count} active={activeCat === key}
              color={meta.color} icon={CATEGORY_ICONS[key]} onClick={() => setActiveCat(key)} />
          )
        })}
      </nav>

      {/* Game grid */}
      <div className="game-grid" style={{ paddingBottom: 40 }}>
        {filtered.map((g, i) => (
          <div key={g.id} className="slide-up" style={{ animationDelay: `${i * 30}ms` }}>
            <GameCard game={g} onPlay={onPlay} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
            <p style={{ color: P.textDim, fontSize: 13 }}>Hakuna mchezo unaolingana na utafutaji wako.</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ================================================================
   DAILY CHALLENGES
   ================================================================ */
function DailySection({ profile, onPlay, onLogin, onLuckyDraw }: { profile: PlayerProfile | null; onPlay: (id: string) => void; onLogin: () => void; onLuckyDraw: () => void }) {
  const challenges = generateDailyChallenges(Math.floor(Date.now() / 86400000))
  const eng = loadEngagement()
  return (
    <div style={{ padding: '32px 4vw', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Calendar size={22} color={P.amber} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Changamoto za Leo</h2>
      </div>
      {!profile && (
        <div style={{ ...cardStyle, marginBottom: 20, padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 12px' }}>Ingia ili upate XP na badges kutoka changamoto</p>
          <button onClick={onLogin} style={solidBtn(P.sapphire)}>
            <LogIn size={14} /> Ingia
          </button>
        </div>
      )}

      {/* Login streak tracker */}
      {profile && (
        <div style={{ ...cardStyle, padding: '18px 22px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: P.text, marginBottom: 12 }}>Tuzo za Kuingia</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {LOGIN_REWARD_SCHEDULE.map((r, i) => {
              const collected = eng.consecutiveLogins > i
              return (
                <div key={i} style={{
                  flex: 1, textAlign: 'center', padding: '8px 4px',
                  borderRadius: RADIUS.sm,
                  background: collected ? P.emerald + '18' : r.special ? P.gold + '10' : P.surface,
                  border: `1px solid ${collected ? P.emerald + '30' : r.special ? P.gold + '25' : P.border}`,
                }}>
                  <div style={{ fontSize: 9, color: collected ? P.emerald : P.textDim, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: collected ? P.emerald : r.special ? P.gold : P.textMuted, marginTop: 2 }}>
                    {collected ? <Check size={12} /> : `+${r.tokens}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lucky draw */}
      {profile && (
        <button onClick={onLuckyDraw} style={{
          ...cardStyle, width: '100%', padding: '18px 22px', marginBottom: 16,
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: P.gold + '18', display: 'grid', placeItems: 'center' }}>
            <Gift size={20} color={P.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>Bahati Nasibu</div>
            <div style={{ fontSize: 11, color: P.textMuted }}>Jaribu bahati yako — hadi sarafu 1,000!</div>
          </div>
          <Sparkles size={18} color={P.gold} />
        </button>
      )}

      {challenges.map(ch => {
        const game = GAMES.find(g => g.id === ch.gameId)
        return (
          <button key={ch.id} onClick={() => onPlay(ch.gameId)} style={{
            ...cardStyle, display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 22px', marginBottom: 12, width: '100%',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: P.amber + '18', display: 'grid', placeItems: 'center' }}>
              <Target size={20} color={P.amber} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{ch.title}</div>
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>{ch.description}</div>
              {game && <div style={{ fontSize: 10, color: P.textDim, marginTop: 4 }}>{game.title}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: P.gold }}>+{ch.xpReward}</div>
              <div style={{ fontSize: 9, color: P.textDim }}>XP</div>
            </div>
          </button>
        )
      })}
      {profile && (
        <div style={{ ...cardStyle, padding: '20px 24px', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Flame size={16} color={P.amber} />
            <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>Mfuatano wako: {profile.streakDays} siku</span>
          </div>
          <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>
            Cheza kila siku kupata mfuatano mrefu na XP bonus +{Math.min(profile.streakDays * 5, 50)}%
          </p>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   LEADERBOARD
   ================================================================ */
function LeaderboardSection({ profile }: { profile: PlayerProfile | null }) {
  const [activeBoard, setActiveBoard] = useState('overall')
  const entries = generateDemoLeaderboard(activeBoard)
  const activeMeta = LEADERBOARD_CATEGORIES.find(c => c.id === activeBoard)!

  return (
    <div style={{ padding: '32px 4vw', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Trophy size={22} color={P.gold} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Leaderboard</h2>
      </div>

      {/* Board selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 4 }}>
        {LEADERBOARD_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveBoard(cat.id)} style={{
            padding: '7px 14px', borderRadius: RADIUS.full,
            background: activeBoard === cat.id ? cat.color : P.card,
            color: activeBoard === cat.id ? '#fff' : P.textMuted,
            border: `1px solid ${activeBoard === cat.id ? cat.color : P.border}`,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeBoard === cat.id ? `0 2px 10px ${cat.color}40` : 'none',
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: P.textMuted, margin: '0 0 16px' }}>{activeMeta.description}</p>

      {/* Podium top 3 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {[entries[1], entries[0], entries[2]].map((e, i) => {
          const pos = [2, 1, 3][i]
          const heights = [80, 100, 64]
          const sizes = [40, 48, 36]
          return (
            <div key={e.playerId} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: sizes[i] * 0.45 }}>{e.avatar}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: P.text, marginTop: 4, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.displayName}</span>
              <span style={{ fontSize: 10, color: P.textMuted }}>{e.score.toLocaleString()}</span>
              <div style={{
                width: sizes[i], height: heights[i], marginTop: 8,
                borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
                background: pos === 1 ? P.gold + '30' : pos === 2 ? '#b0b8c4' + '20' : '#cd7f32' + '20',
                border: `1px solid ${pos === 1 ? P.gold + '40' : pos === 2 ? '#b0b8c440' : '#cd7f3240'}`,
                borderBottom: 'none',
                display: 'grid', placeItems: 'end center', paddingBottom: 8,
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: pos === 1 ? P.gold : pos === 2 ? '#b0b8c4' : '#cd7f32' }}>#{pos}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full list */}
      <div style={cardStyle}>
        {entries.map((e, i) => (
          <div key={e.playerId} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
            borderBottom: i < entries.length - 1 ? `1px solid ${P.border}` : 'none',
            background: profile && e.username === profile.username ? P.sapphire + '10' : 'transparent',
          }}>
            <span style={{
              width: 24, fontSize: 12, fontWeight: 800,
              color: i < 3 ? [P.gold, '#b0b8c4', '#cd7f32'][i] : P.textDim,
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 18 }}>{e.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.text }}>{e.displayName}</span>
                {e.teamTag && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: P.teal, background: P.teal + '15', padding: '1px 6px', borderRadius: RADIUS.full }}>
                    [{e.teamTag}]
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: RANK_META[e.rank as keyof typeof RANK_META]?.color || P.textDim }}>
                  {RANK_META[e.rank as keyof typeof RANK_META]?.label || e.rank}
                </span>
                <span style={{ fontSize: 9, color: P.textDim }}>Lv.{e.level}</span>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>
              {e.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {profile && (
        <div style={{ ...cardStyle, marginTop: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>{profile.avatar}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: P.text }}>Wewe</span>
            <div style={{ fontSize: 10, color: P.textMuted }}>
              {RANK_META[profile.rank].label} · Level {profile.level}
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: P.sapphire }}>{profile.totalScore.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   PROFILE
   ================================================================ */
/* ================================================================
   CONNECTIONS — Social Hub
   ================================================================ */
function ConnectionsSection({ profile, onPlay, onLogin }: { profile: PlayerProfile | null; onPlay: (id: string) => void; onLogin: () => void }) {
  const [connections, setConnections] = useState<Connection[]>(loadConnections)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRelation, setAddRelation] = useState<RelationType>('friend')
  const [addMethod, setAddMethod] = useState<'whatsapp' | 'instagram' | 'username'>('whatsapp')
  const [addContact, setAddContact] = useState('')
  const [addSharePic, setAddSharePic] = useState(true)
  const [inviteConn, setInviteConn] = useState<Connection | null>(null)

  const handleAdd = () => {
    if (!addName.trim() || !addContact.trim()) return
    const conn = addConnection({
      displayName: addName.trim(),
      username: addName.trim().toLowerCase().replace(/\s+/g, '_'),
      avatar: ['😎', '🦁', '🌟', '💫', '🔥', '👑', '💎', '🌺', '🦋', '⚡'][Math.floor(Math.random() * 10)],
      relation: addRelation,
      contactMethod: addMethod,
      contactValue: addContact.trim(),
      shareProfilePic: addSharePic,
    })
    setConnections([...connections, conn])
    setShowAdd(false)
    setAddName('')
    setAddContact('')
  }

  const handleRemove = (id: string) => {
    removeConnection(id)
    setConnections(connections.filter(c => c.id !== id))
  }

  const handleInvite = (conn: Connection, gameType: string, gameName: string) => {
    if (!profile) return
    const url = conn.contactMethod === 'whatsapp'
      ? generateWhatsAppInvite(profile.displayName, conn, gameType, gameName)
      : conn.contactMethod === 'instagram'
        ? generateInstagramInvite(profile.displayName, conn, gameType, gameName)
        : null
    if (url) window.open(url, '_blank')
    setInviteConn(null)
  }

  if (!profile) {
    return (
      <div style={{ padding: '32px 4vw', maxWidth: 600, textAlign: 'center' }}>
        <Users size={32} color={P.textDim} style={{ marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: P.text }}>Watu Wako</h2>
        <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 20px' }}>Ingia kwanza ili kuongeza marafiki na wapendwa</p>
        <button onClick={onLogin} style={solidBtn(P.sapphire)}><LogIn size={14} /> Ingia</button>
      </div>
    )
  }

  const relationGroups = [
    { key: 'romantic', label: 'Wapendwa', types: ['husband', 'wife', 'hubby', 'wifey', 'partner', 'bae'] },
    { key: 'family', label: 'Familia', types: ['brother', 'sister', 'sibling', 'son', 'daughter', 'parent'] },
    { key: 'friends', label: 'Marafiki', types: ['friend', 'bestfriend', 'bff'] },
    { key: 'peers', label: 'Wenzako', types: ['classmate', 'colleague', 'teammate'] },
  ]

  return (
    <div style={{ padding: '32px 4vw', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={22} color={P.rose} />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Watu Wako</h2>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...solidBtn(P.emerald), padding: '8px 16px', fontSize: 12 }}>
          <UserPlus size={14} /> Ongeza
        </button>
      </div>

      {/* Party games banner */}
      <div style={{ ...cardStyle, padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PartyPopper size={16} color={P.fuchsia} /> Michezo ya Pamoja
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {PARTY_GAMES.map(g => (
            <button key={g.id} onClick={() => onPlay(g.id)} style={{
              ...cardStyle, padding: '14px 18px', minWidth: 150, cursor: 'pointer',
              textAlign: 'left', flexShrink: 0, border: `1px solid ${g.color}25`,
            }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{g.icon}</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.text }}>{g.name}</div>
              <div style={{ fontSize: 10, color: P.textMuted, marginTop: 2 }}>{g.minPlayers}-{g.maxPlayers} wachezaji</div>
            </button>
          ))}
        </div>
      </div>

      {/* Connections list grouped by relation type */}
      {connections.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <Heart size={32} color={P.textDim} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: '0 0 4px' }}>Hakuna watu bado</p>
          <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 16px' }}>
            Ongeza mpenzi, rafiki, ndugu, au mwanafunzi mwenzio
          </p>
          <button onClick={() => setShowAdd(true)} style={solidBtn(P.emerald)}>
            <UserPlus size={14} /> Ongeza Mtu wa Kwanza
          </button>
        </div>
      ) : (
        <>
          {relationGroups.map(group => {
            const groupConns = connections.filter(c => group.types.includes(c.relation))
            if (groupConns.length === 0) return null
            return (
              <div key={group.key} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {group.label}
                </div>
                {groupConns.map(conn => {
                  const meta = RELATION_META[conn.relation]
                  return (
                    <div key={conn.id} style={{ ...cardStyle, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{conn.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{conn.displayName}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: meta.color,
                            background: meta.color + '15', padding: '2px 8px', borderRadius: RADIUS.full,
                          }}>
                            {meta.emoji} {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: P.textDim, marginTop: 2 }}>
                          {conn.gamesPlayed > 0 ? `${conn.gamesPlayed} michezo · ${conn.wins}W-${conn.losses}L` : 'Bado hamjacheza'}
                          {conn.contactMethod === 'whatsapp' && ' · WhatsApp'}
                          {conn.contactMethod === 'instagram' && ' · Instagram'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setInviteConn(conn)} style={{
                          background: meta.color, border: 'none', borderRadius: RADIUS.full,
                          width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer',
                        }}>
                          <Send size={13} color="#fff" />
                        </button>
                        <button onClick={() => handleRemove(conn.id)} style={{
                          background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full,
                          width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer',
                        }}>
                          <Trash2 size={13} color={P.textDim} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      )}

      {/* Add connection modal */}
      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={{ ...modalCard, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: P.text }}>Ongeza Mtu</h3>

            <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Jina lao" style={inputStyle} autoFocus />

            <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: 600, color: P.textMuted }}>Uhusiano</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {(Object.entries(RELATION_META) as [RelationType, typeof RELATION_META[RelationType]][]).map(([key, meta]) => (
                <button key={key} onClick={() => setAddRelation(key)} style={{
                  padding: '5px 12px', borderRadius: RADIUS.full, fontSize: 10, fontWeight: 600,
                  background: addRelation === key ? meta.color : P.surface,
                  color: addRelation === key ? '#fff' : P.textMuted,
                  border: `1px solid ${addRelation === key ? meta.color : P.border}`,
                  cursor: 'pointer',
                }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 600, color: P.textMuted }}>Njia ya Kuwafikia</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {([['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['username', 'Username']] as const).map(([m, label]) => (
                <button key={m} onClick={() => setAddMethod(m)} style={{
                  flex: 1, padding: '8px', borderRadius: RADIUS.md, fontSize: 11, fontWeight: 600,
                  background: addMethod === m ? P.sapphire : P.surface,
                  color: addMethod === m ? '#fff' : P.textMuted,
                  border: `1px solid ${addMethod === m ? P.sapphire : P.border}`,
                  cursor: 'pointer',
                }}>
                  {label}
                </button>
              ))}
            </div>

            <input
              value={addContact}
              onChange={e => setAddContact(e.target.value)}
              placeholder={addMethod === 'whatsapp' ? '+255 7XX XXX XXX' : addMethod === 'instagram' ? '@username' : 'username'}
              style={inputStyle}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={addSharePic} onChange={e => setAddSharePic(e.target.checked)} />
              <span style={{ fontSize: 11, color: P.textMuted }}>Shiriki picha yako ya wasifu kwenye mwaliko</span>
            </label>

            <button onClick={handleAdd} style={{ ...solidBtn(P.emerald), width: '100%', justifyContent: 'center', marginTop: 16 }}>
              <UserPlus size={14} /> Ongeza
            </button>
          </div>
        </div>
      )}

      {/* Invite modal — pick a game to invite this person to */}
      {inviteConn && (
        <div style={modalOverlay} onClick={() => setInviteConn(null)}>
          <div style={{ ...modalCard, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>{inviteConn.avatar}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: P.text }}>{inviteConn.displayName}</div>
                <div style={{ fontSize: 11, color: RELATION_META[inviteConn.relation].color }}>
                  {RELATION_META[inviteConn.relation].emoji} {RELATION_META[inviteConn.relation].label}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: P.textMuted, marginBottom: 10 }}>Chagua mchezo wa kumtumia</div>

            {PARTY_GAMES.map(g => (
              <button key={g.id} onClick={() => handleInvite(inviteConn, g.id, g.name)} style={{
                ...cardStyle, width: '100%', padding: '14px 18px', marginBottom: 8,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: P.textMuted }}>{g.description}</div>
                </div>
                <Send size={14} color={g.color} />
              </button>
            ))}

            <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 12, marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, marginBottom: 8 }}>Au changamoto ya mchezo wowote</div>
              {GAMES.filter(g => g.category !== 'party').slice(0, 6).map(g => (
                <button key={g.id} onClick={() => handleInvite(inviteConn, 'challenge', g.title)} style={{
                  background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full,
                  padding: '6px 14px', fontSize: 10, fontWeight: 600, color: P.textMuted,
                  cursor: 'pointer', marginRight: 6, marginBottom: 6,
                }}>
                  {g.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   SHOP
   ================================================================ */
function ShopSection({ wallet, setWallet }: { wallet: TokenWallet; setWallet: (w: TokenWallet) => void }) {
  const [tab, setTab] = useState<'shop' | 'packs' | 'history'>('shop')
  const purchased = JSON.parse(localStorage.getItem('kg_purchases') || '[]') as string[]

  const handleBuy = (item: typeof SHOP[0]) => {
    if (item.oneTime && purchased.includes(item.id)) return
    const w = spendTokens(item.price, item.name)
    if (!w) return
    setWallet(w)
    if (item.oneTime) {
      const updated = [...purchased, item.id]
      localStorage.setItem('kg_purchases', JSON.stringify(updated))
    }
  }

  return (
    <div style={{ padding: '32px 4vw', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <ShoppingBag size={22} color={P.violet} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Duka</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Coins size={16} color={P.gold} />
        <span style={{ fontSize: 18, fontWeight: 900, color: P.gold }}>{wallet.balance.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: P.textMuted }}>sarafu</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['shop', 'packs', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: RADIUS.full,
            background: tab === t ? P.violet : P.card,
            color: tab === t ? '#fff' : P.textMuted,
            border: `1px solid ${tab === t ? P.violet : P.border}`,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {t === 'shop' ? 'Bidhaa' : t === 'packs' ? 'Nunua Sarafu' : 'Historia'}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {SHOP.map(item => {
            const owned = item.oneTime && purchased.includes(item.id)
            const canAfford = wallet.balance >= item.price
            return (
              <div key={item.id} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: RADIUS.md, background: item.color + '18', display: 'grid', placeItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>
                    {item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'heart' ? '❤️' :
                     item.icon === 'clock' ? '⏱️' : item.icon === 'lightbulb' ? '💡' : item.icon === 'flame' ? '🔥' :
                     item.icon === 'gem' ? '💎' : item.icon === 'crown' ? '👑' : item.icon === 'sparkles' ? '✨' : '🏳️'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>{item.description}</div>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={owned || !canAfford}
                  style={{
                    padding: '7px 16px', borderRadius: RADIUS.full,
                    background: owned ? P.emerald + '20' : canAfford ? item.color : P.surface,
                    color: owned ? P.emerald : canAfford ? '#fff' : P.textDim,
                    border: 'none', fontSize: 11, fontWeight: 700, cursor: owned || !canAfford ? 'default' : 'pointer',
                    opacity: !canAfford && !owned ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {owned ? <><Check size={12} /> Umenunua</> : <><Coins size={10} /> {item.price}</>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'packs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {TOKEN_PACKS.map(pack => (
            <button key={pack.id} onClick={() => {
              const w = purchaseTokens(pack.tokens, pack.label)
              setWallet(w)
            }} style={{
              ...cardStyle, padding: '20px 18px', textAlign: 'center', cursor: 'pointer',
              border: pack.label === 'Best Value' ? `2px solid ${P.gold}50` : `1px solid ${P.border}`,
            }}>
              {pack.label === 'Best Value' && (
                <div style={{ fontSize: 9, fontWeight: 800, color: P.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Thamani Bora
                </div>
              )}
              <Coins size={24} color={P.gold} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 22, fontWeight: 900, color: P.text }}>{pack.tokens.toLocaleString()}</div>
              {pack.bonus > 0 && (
                <div style={{ fontSize: 10, color: P.emerald, fontWeight: 700 }}>+{pack.bonus} bonus</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: P.gold, marginTop: 8 }}>
                TSh {pack.price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={cardStyle}>
          {wallet.transactions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: P.textDim }}>Hakuna shughuli bado</p>
            </div>
          ) : wallet.transactions.slice(0, 30).map(tx => (
            <div key={tx.id} style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: `1px solid ${P.border}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: tx.type === 'earn' ? P.emerald + '18' : tx.type === 'purchase' ? P.gold + '18' : P.rose + '18',
              }}>
                {tx.type === 'earn' ? <TrendingUp size={12} color={P.emerald} /> :
                 tx.type === 'purchase' ? <Coins size={12} color={P.gold} /> :
                 <ShoppingBag size={12} color={P.rose} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: P.text }}>{tx.reason}</div>
                <div style={{ fontSize: 9, color: P.textDim }}>{new Date(tx.timestamp).toLocaleDateString()}</div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 800,
                color: tx.type === 'spend' ? P.rose : P.emerald,
              }}>
                {tx.type === 'spend' ? '-' : '+'}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
function NotificationsSection() {
  const notifs = loadNotifications()
  return (
    <div style={{ padding: '32px 4vw', maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Bell size={22} color={P.sapphire} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: P.text }}>Arifa</h2>
      </div>
      {notifs.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <Bell size={32} color={P.textDim} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: P.textDim }}>Hakuna arifa mpya</p>
        </div>
      ) : (
        <div style={cardStyle}>
          {notifs.map(n => (
            <div key={n.id} style={{
              padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: `1px solid ${P.border}`,
              background: n.read ? 'transparent' : P.sapphire + '08',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: (n.color || P.sapphire) + '18', display: 'grid', placeItems: 'center',
              }}>
                {n.type === 'record_broken' ? <Trophy size={16} color={n.color || P.gold} /> :
                 n.type === 'achievement' ? <Award size={16} color={n.color || P.violet} /> :
                 n.type === 'reward' ? <Gift size={16} color={n.color || P.emerald} /> :
                 n.type === 'milestone' ? <Star size={16} color={n.color || P.gold} /> :
                 <Bell size={16} color={n.color || P.sapphire} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{n.title}</div>
                <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 9, color: P.textDim, marginTop: 4 }}>
                  {new Date(n.timestamp).toLocaleDateString()} {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   PROFILE
   ================================================================ */
function ProfileSection({ profile, setProfile, wallet }: { profile: PlayerProfile; setProfile: (p: PlayerProfile | null) => void; wallet?: TokenWallet }) {
  const earnedBadges = BADGES.filter(b => profile.badges.includes(b.id))
  const unearnedBadges = BADGES.filter(b => !profile.badges.includes(b.id))

  return (
    <div style={{ padding: '32px 4vw', maxWidth: 600 }}>
      {/* Profile header */}
      <div style={{ ...cardStyle, padding: '28px 24px', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{profile.avatar}</div>
        <h2 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: P.text }}>{profile.displayName}</h2>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: P.textMuted }}>@{profile.username}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: RADIUS.full, background: RANK_META[profile.rank].color + '18', border: `1px solid ${RANK_META[profile.rank].color}30` }}>
          <Crown size={14} color={RANK_META[profile.rank].color} />
          <span style={{ fontSize: 13, fontWeight: 800, color: RANK_META[profile.rank].color }}>{RANK_META[profile.rank].label}</span>
          <span style={{ fontSize: 11, color: P.textMuted }}>Level {profile.level}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <XPBar xp={profile.xp} large />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={<BarChart3 size={16} />} color={P.sapphire} label="Total XP" value={profile.xp.toLocaleString()} />
        <StatCard icon={<Coins size={16} />} color={P.gold} label="Sarafu" value={wallet?.balance.toLocaleString() || '0'} />
        <StatCard icon={<Gamepad2 size={16} />} color={P.emerald} label="Michezo" value={profile.totalGames.toString()} />
        <StatCard icon={<Flame size={16} />} color={P.amber} label="Mfuatano" value={`${profile.streakDays} siku`} />
        <StatCard icon={<Trophy size={16} />} color={P.gold} label="Jumla Score" value={profile.totalScore.toLocaleString()} />
        <StatCard icon={<TrendingUp size={16} />} color={P.teal} label="Mfuatano Mrefu" value={`${profile.longestStreak} siku`} />
        <StatCard icon={<Award size={16} />} color={P.violet} label="Badges" value={earnedBadges.length.toString()} />
      </div>

      {/* Badges */}
      <div style={{ ...cardStyle, padding: '20px 22px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={16} color={P.violet} /> Badges
        </h3>
        {earnedBadges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: earnedBadges.length > 0 ? 16 : 0 }}>
            {earnedBadges.map(b => (
              <div key={b.id} style={{
                padding: '8px 14px', borderRadius: RADIUS.md,
                background: b.color + '15', border: `1px solid ${b.color}25`,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Star size={12} color={b.color} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: P.textMuted }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {unearnedBadges.slice(0, 8).map(b => (
            <div key={b.id} style={{
              padding: '6px 12px', borderRadius: RADIUS.md,
              background: P.surface, border: `1px solid ${P.border}`,
              display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5,
            }}>
              <Star size={10} color={P.textDim} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: P.textDim }}>{b.name}</div>
                <div style={{ fontSize: 8, color: P.textDim }}>{b.requirement}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teams & Social */}
      <div style={{ ...cardStyle, padding: '20px 22px', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color={P.teal} /> Timu & Marafiki
        </h3>
        {profile.teamId ? (
          <div style={{ fontSize: 12, color: P.textMuted }}>Team member</div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 12px' }}>Hujajiunga na timu bado</p>
            <button style={{ ...solidBtn(P.teal), fontSize: 12, padding: '8px 20px' }}>
              <Users size={14} /> Unda Timu
            </button>
          </div>
        )}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: P.textMuted }}>Marafiki ({profile.friendIds.length})</span>
            <button style={{ background: 'none', border: 'none', color: P.sapphire, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              + Ongeza
            </button>
          </div>
          {profile.friendIds.length === 0 && (
            <p style={{ fontSize: 11, color: P.textDim, margin: 0 }}>Shiriki link yako na marafiki kushindana pamoja</p>
          )}
        </div>
        {profile.coupledWith === null && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.border}`, textAlign: 'center' }}>
            <Heart size={16} color={P.rose} style={{ marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: P.textMuted, margin: '0 0 8px' }}>Couple Challenge — Shindana na mpenzi wako</p>
            <button style={{ background: 'none', border: `1px solid ${P.rose}40`, color: P.rose, borderRadius: RADIUS.full, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <Heart size={12} /> Connect
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={() => { localStorage.removeItem('kg_profile'); setProfile(null) }} style={{
        background: 'none', border: `1px solid ${P.border}`, color: P.textDim,
        borderRadius: RADIUS.md, padding: '10px 20px', fontSize: 12, cursor: 'pointer',
        width: '100%',
      }}>
        Toka
      </button>
    </div>
  )
}

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */
function XPBar({ xp, large }: { xp: number; large?: boolean }) {
  const { current, needed, progress } = xpToNextLevel(xp)
  const h = large ? 8 : 4
  return (
    <div>
      <div style={{ height: h, background: P.border, borderRadius: h, overflow: 'hidden', marginTop: large ? 8 : 4 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: P.sapphire, borderRadius: h, transition: 'width 0.4s ease' }} />
      </div>
      {large && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: P.textDim }}>
          <span>{current.toLocaleString()} XP</span>
          <span>{needed.toLocaleString()} XP to next level</span>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div style={{
      ...cardStyle, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: color + '15', display: 'grid', placeItems: 'center', color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: 10, color: P.textMuted }}>{label}</div>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick, accent }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; accent?: string }) {
  return (
    <button onClick={onClick} style={{
      ...navBtnStyle,
      color: accent || (active ? P.text : P.textMuted),
      background: active && !accent ? P.sapphire + '15' : 'none',
    }}>
      {icon}
      {label && <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>}
    </button>
  )
}

function CatPill({ label, count, active, color, icon, onClick }: {
  label: string; count: number; active: boolean; color: string
  icon: React.ReactNode; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '6px 14px', borderRadius: RADIUS.full,
      background: active ? color : P.card,
      color: active ? '#fff' : P.textMuted,
      border: `1px solid ${active ? color : P.border}`,
      cursor: 'pointer', fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap', transition: `all ${MOTION.fast}`,
      boxShadow: active ? `0 2px 10px ${color}35` : 'none',
    }}>
      {icon}
      {label}
      <span style={{
        background: active ? 'rgba(255,255,255,0.2)' : P.border,
        padding: '1px 6px', borderRadius: RADIUS.full,
        fontSize: 9, fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: P.textMuted, fontSize: 13 }}>
      Inapakia...
    </div>
  )
}

/* ================================================================
   STYLES
   ================================================================ */
const P = PALETTE

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 4vw',
  borderBottom: `1px solid ${P.border}`,
  position: 'sticky',
  top: 0,
  background: P.bg + 'f8',
  backdropFilter: 'blur(16px)',
  zIndex: 100,
}

const navBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: P.textMuted,
  cursor: 'pointer',
  padding: '6px 10px',
  borderRadius: RADIUS.md,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

const cardStyle: CSSProperties = {
  background: P.card,
  border: `1px solid ${P.border}`,
  borderRadius: RADIUS.lg,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.4)`,
  overflow: 'hidden',
}

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 1000,
  padding: 20,
}

const modalCard: CSSProperties = {
  background: P.card,
  border: `1px solid ${P.borderLight}`,
  borderRadius: RADIUS.xl,
  padding: '32px 28px',
  maxWidth: 380,
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: RADIUS.md,
  background: P.surface,
  border: `1px solid ${P.border}`,
  color: P.text,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}
