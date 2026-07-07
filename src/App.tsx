import { useState, lazy, Suspense, useEffect, type CSSProperties } from 'react'
import {
  Brain, Zap, Languages, Lightbulb, Heart, Timer, Stethoscope,
  Bot, Gamepad2, Music, Trophy, Search, ArrowLeft, Users, PartyPopper,
  Flame, Star, Target, Crown, Award, LogIn, UserPlus, Send,
  BarChart3, Calendar, TrendingUp, Bell, Coins, Gift, ShoppingBag,
  Download, X, Sparkles, Check, Trash2,
} from 'lucide-react'
import { RADIUS, MOTION, SHADOW, GLASS, TYPOGRAPHY, SPACING, glassCard, heroGlow, premiumBtn } from './lib/design'
import { BRAND } from './lib/brand'
import { t, loadLang, saveLang, type Lang } from './lib/i18n'
import { loadTheme, saveTheme, getPalette, type Theme } from './lib/theme'
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

/* ================================================================
   MAIN APP
   ================================================================ */
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
  const [lang, setLang] = useState<Lang>(loadLang)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [luckyResult, setLuckyResult] = useState<{ tokens: number; label: string } | null>(null)

  // Update module-level palette for theme-aware rendering
  P = getPalette(theme)

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
        const w = earnTokens(result.tokens, result.isComeback ? `${t('welcome_back')} +${result.comebackBonus}` : t('login_day_reward').replace('{day}', String(result.day)))
        setWallet(w)
      }
      const milestones = checkMilestones(profile)
      for (const m of milestones) {
        const w = earnTokens(m.tokens, t('milestone').replace('{label}', m.label))
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
        const w = earnTokens(TOKEN_EARN_RATES.gameComplete, t('game_completed').replace('{game}', game?.title || ''))
        setWallet(w)
      }
    }
    setActiveGame(null)
  }

  const handleLuckyDraw = () => {
    const result = spinLuckyDraw()
    if (result) {
      const w = earnTokens(result.tokens, t('lucky_draw_result').replace('{label}', result.label))
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
          {GAMES.find(g => g.id === activeGame)?.title || activeGame} — {t('coming_soon')}
        </p>
        <button onClick={() => setActiveGame(null)} style={premiumBtn(P.sapphire)}>
          <ArrowLeft size={16} /> {t('go_home')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: P.bg }}>
      {/* === PREMIUM HEADER === */}
      <header style={headerStyle()}>
        <button onClick={() => setSection('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Logo size={36} showText />
        </button>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavBtn icon={<Calendar size={18} />} label={t('daily')} active={section === 'daily'} onClick={() => setSection('daily')} />
          <NavBtn icon={<Trophy size={18} />} label={t('ranks')} active={section === 'leaderboard'} onClick={() => setSection('leaderboard')} />
          <NavBtn icon={<Users size={18} />} label={t('people')} active={section === 'connections'} onClick={() => setSection('connections')} />
          <NavBtn icon={<ShoppingBag size={18} />} label={t('shop')} active={section === 'shop'} onClick={() => setSection('shop')} />
          <button onClick={() => { setSection('notifications'); markAllRead(); setUnreadNotifs(0) }} style={{ ...navBtnStyle(), position: 'relative' }}>
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 16, height: 16, borderRadius: '50%',
                background: P.rose, fontSize: 8, fontWeight: 800,
                display: 'grid', placeItems: 'center', color: '#fff',
                border: `2px solid ${P.bg}`,
              }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
            )}
          </button>
          <NavBtn icon={<Music size={18} />} label="" active={playerVisible} onClick={() => setPlayerVisible(p => !p)} accent={playerVisible ? P.amber : undefined} />
          {profile ? (
            <button onClick={() => setSection('profile')} style={{
              ...navBtnStyle(),
              background: section === 'profile' ? P.sapphire + '20' : 'none',
              gap: 6,
            }}>
              <span style={{ fontSize: 18 }}>{profile.avatar}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: RANK_META[profile.rank].color }}>{profile.level}</span>
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ ...navBtnStyle(), color: P.sapphire }}>
              <LogIn size={18} />
            </button>
          )}
          {profile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: RADIUS.full,
              background: P.gold + '12', border: `1px solid ${P.gold}20`,
              marginLeft: 4,
            }}>
              <Coins size={13} color={P.gold} />
              <span style={{ fontSize: 12, fontWeight: 800, color: P.gold, fontVariantNumeric: 'tabular-nums' }}>{wallet.balance}</span>
            </div>
          )}
        </nav>
      </header>

      {/* === LOGIN MODAL === */}
      {showLogin && (
        <div style={modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={modalCard()} onClick={e => e.stopPropagation()}>
            <Logo size={36} style={{ marginBottom: SPACING.lg }} />
            <h2 style={{ margin: '0 0 6px', ...TYPOGRAPHY.heading, color: P.text }}>{t('join_kasukugames')}</h2>
            <p style={{ margin: `0 0 ${SPACING.lg}px`, fontSize: 14, color: P.textMuted, lineHeight: 1.5 }}>
              {t('use_kasuku_or_create')}
            </p>
            <input
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              placeholder={t('username')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle()}
              autoFocus
            />
            <input
              value={loginDisplay}
              onChange={e => setLoginDisplay(e.target.value)}
              placeholder={t('display_name_optional')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...inputStyle(), marginTop: 12 }}
            />
            <button onClick={handleLogin} style={{ ...premiumBtn(P.sapphire), width: '100%', justifyContent: 'center', marginTop: SPACING.lg }}>
              {t('sign_in')}
            </button>
            <p style={{ margin: '20px 0 0', fontSize: 11, color: P.textDim, textAlign: 'center' }}>
              {t('shared_login')}
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
      {section === 'profile' && profile && <ProfileSection profile={profile} setProfile={setProfile} wallet={wallet} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />}

      {/* Login reward toast */}
      {loginReward && loginReward.tokens > 0 && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          ...glassCard(), padding: '16px 28px',
          border: `1px solid ${P.gold}40`,
          boxShadow: SHADOW.glow(P.gold),
          zIndex: 1100, display: 'flex', alignItems: 'center', gap: 14,
          animation: 'slideUp 0.4s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Gift size={22} color={P.gold} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>
              {loginReward.isComeback ? t('welcome_back') : t('login_day_reward').replace('{day}', String(loginReward.day))}
            </div>
            <div style={{ fontSize: 12, color: P.gold, fontWeight: 600 }}>+{loginReward.tokens} {t('tokens')}</div>
          </div>
          <button onClick={() => setLoginReward(null)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 6 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lucky draw result */}
      {luckyResult && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          ...glassCard(), padding: '48px 56px', textAlign: 'center',
          border: `1px solid ${P.gold}50`,
          boxShadow: `${SHADOW.xl}, ${SHADOW.glow(P.gold)}`,
          zIndex: 1200,
          animation: 'slideUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Sparkles size={36} color={P.gold} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 36, fontWeight: 900, color: P.gold, marginBottom: 6, letterSpacing: '-0.02em' }}>+{luckyResult.tokens}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{luckyResult.label}</div>
        </div>
      )}

      {/* PWA install banner */}
      {showInstall && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: P.card, borderTop: `1px solid ${P.border}`,
          padding: '16px 4vw', display: 'flex', alignItems: 'center', gap: 14,
          zIndex: 900,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
        }}>
          <Download size={22} color={P.sapphire} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{t('download_kasukugames')}</div>
            <div style={{ fontSize: 12, color: P.textMuted }}>{t('play_offline')}</div>
          </div>
          <button onClick={handleInstall} style={{ ...premiumBtn(P.sapphire), padding: '10px 22px', fontSize: 13 }}>
            {t('download')}
          </button>
          <button onClick={() => setShowInstall(false)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 6 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '40px 4vw 32px', borderTop: `1px solid ${P.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={22} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: P.textMuted }}>
              {BRAND.sub}
            </span>
            <span style={{ fontSize: 11, color: P.textDim, display: 'block', marginTop: 2 }}>
              by {BRAND.by}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, color: P.textDim, fontVariantNumeric: 'tabular-nums' }}>
            {GAMES.length} {t('disciplines').toLowerCase()}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: P.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: P.textDim, fontVariantNumeric: 'tabular-nums' }}>
            {new Set(GAMES.flatMap(g => g.targets)).size} {t('cognitive_targets').toLowerCase()}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: P.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: P.textDim }}>
            v{BRAND.version}
          </span>
        </div>
      </footer>

      <FloatingPlayer visible={playerVisible} onToggle={() => setPlayerVisible(false)} />
    </div>
  )
}

/* ================================================================
   HOME SECTION — Cinematic Hero + Game Grid
   ================================================================ */
function HomeSection({ filtered, activeCat, setActiveCat, query, setQuery, catCounts, onPlay, profile }: {
  filtered: typeof GAMES; activeCat: GameCategory | 'all'
  setActiveCat: (c: GameCategory | 'all') => void; query: string; setQuery: (q: string) => void
  catCounts: Map<GameCategory, number>; onPlay: (id: string) => void; profile: PlayerProfile | null
}) {
  const categories = Object.entries(CATEGORY_META) as [GameCategory, typeof CATEGORY_META[GameCategory]][]
  const dailyChallenges = generateDailyChallenges(Math.floor(Date.now() / 86400000))

  const uniqueTargets = new Set(GAMES.flatMap(g => g.targets))

  return (
    <>
      {/* Profile strip */}
      {profile && (
        <div style={{
          padding: '14px 4vw', display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: `1px solid ${P.border}`,
          background: P.surface,
        }}>
          <span style={{ fontSize: 22 }}>{profile.avatar}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{profile.displayName}</span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: RANK_META[profile.rank].color,
                background: RANK_META[profile.rank].color + '18',
                padding: '3px 10px', borderRadius: RADIUS.full,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {RANK_META[profile.rank].label}
              </span>
            </div>
            <XPBar xp={profile.xp} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: P.amber }}>
              <Flame size={16} />
              <span style={{ fontSize: 16, fontWeight: 900 }}>{profile.streakDays}</span>
            </div>
            <span style={{ fontSize: 9, color: P.textDim, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('streak')}</span>
          </div>
        </div>
      )}

      {/* Cinematic Hero */}
      <section style={{
        padding: '56px 4vw 48px',
        textAlign: 'center',
        position: 'relative',
      }} className="fade-in">
        {/* Ambient glow beneath hero */}
        <div style={{
          position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '60%', maxWidth: 500, height: 200,
          ...heroGlow(P.sapphire),
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <Logo size={56} style={{ marginBottom: SPACING.lg }} />

          <h1 style={{
            margin: '0 0 12px',
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 900,
            color: P.text,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
          }}>
            {BRAND.tagline}
          </h1>

          <p style={{
            margin: '0 0 32px',
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: P.textMuted,
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            {t('train_compete_transcend')}
          </p>

          {/* 3 stat pills */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
            marginBottom: 36,
          }}>
            <StatPill icon={<Brain size={14} />} value={`${GAMES.length} ${t('disciplines')}`} color={P.sapphire} />
            <StatPill icon={<Target size={14} />} value={`${uniqueTargets.size} ${t('cognitive_targets')}`} color={P.emerald} />
            <StatPill icon={<Sparkles size={14} />} value={t('infinite_potential')} color={P.gold} />
          </div>

          {/* Animated cognitive target chips */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
            justifyContent: 'center', flexWrap: 'wrap',
            paddingBottom: 4,
          }}>
            {(['working-memory', 'processing-speed', 'pattern-recognition', 'creativity', 'decision-making', 'linguistic-fluency', 'executive-function', 'spatial-reasoning'] as const).map((t, i) => {
              const m = TARGET_META[t]
              return (
                <span key={t} className="slide-up" style={{
                  animationDelay: `${i * 60}ms`,
                  background: m.color + '14', color: m.color,
                  borderRadius: RADIUS.full, padding: '5px 14px',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  border: `1px solid ${m.color}20`,
                  boxShadow: `${GLASS.highlight}`,
                }}>
                  {m.label}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Daily challenges strip */}
      <div style={{ padding: '0 4vw 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Target size={15} color={P.amber} />
          <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{t('daily_challenges')}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {dailyChallenges.map(ch => (
            <button key={ch.id} onClick={() => onPlay(ch.gameId)} style={{
              ...glassCard(), padding: '14px 20px', minWidth: 220,
              cursor: 'pointer', textAlign: 'left', flexShrink: 0,
              border: `1px solid ${P.border}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: P.text, marginBottom: 4 }}>{ch.title}</div>
              <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 8, lineHeight: 1.4 }}>{ch.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <Star size={11} color={P.gold} />
                <span style={{ color: P.gold, fontWeight: 700 }}>+{ch.xpReward} XP</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 4vw 14px' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          maxWidth: 420, padding: '11px 16px',
          background: P.card, border: `1px solid ${P.border}`,
          borderRadius: RADIUS.lg,
          boxShadow: GLASS.highlight,
          transition: `border-color ${MOTION.fast}`,
        }}>
          <Search size={16} color={P.textDim} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: P.text, fontSize: 13 }}
          />
        </label>
      </div>

      {/* Category nav */}
      <nav style={{ padding: '0 4vw 20px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <CatPill label={t('all')} count={GAMES.length} active={activeCat === 'all'} color={P.sapphire} icon={<Gamepad2 size={13} />} onClick={() => setActiveCat('all')} />
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
      <div className="game-grid" style={{ paddingBottom: 48, gap: 20 }}>
        {filtered.map((g, i) => (
          <div key={g.id} className="slide-up" style={{ animationDelay: `${i * 30}ms` }}>
            <GameCard game={g} onPlay={onPlay} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 80, textAlign: 'center' }}>
            <Search size={28} color={P.textDim} style={{ marginBottom: 12 }} />
            <p style={{ color: P.textDim, fontSize: 14 }}>{t('no_games_match')}</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ================================================================
   DAILY CHALLENGES SECTION
   ================================================================ */
function DailySection({ profile, onPlay, onLogin, onLuckyDraw }: { profile: PlayerProfile | null; onPlay: (id: string) => void; onLogin: () => void; onLuckyDraw: () => void }) {
  const challenges = generateDailyChallenges(Math.floor(Date.now() / 86400000))
  const eng = loadEngagement()

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: SPACING.xl }}>
        <Calendar size={24} color={P.amber} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('daily_challenges')}</h2>
      </div>

      {!profile && (
        <div style={{ ...glassCard(), marginBottom: 24, padding: '28px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
            {t('sign_in_first')}
          </p>
          <button onClick={onLogin} style={premiumBtn(P.sapphire)}>
            <LogIn size={14} /> {t('sign_in')}
          </button>
        </div>
      )}

      {/* Login streak timeline */}
      {profile && (
        <div style={{ ...glassCard(), padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: P.text, marginBottom: 16 }}>{t('login_rewards')}</div>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: '50%', left: 20, right: 20,
              height: 2, background: P.border, transform: 'translateY(-50%)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: 20,
              height: 2,
              background: P.emerald,
              transform: 'translateY(-50%)',
              width: `${Math.min(100, (eng.consecutiveLogins / LOGIN_REWARD_SCHEDULE.length) * 100)}%`,
              maxWidth: 'calc(100% - 40px)',
              zIndex: 0,
              transition: `width ${MOTION.med}`,
            }} />
            {LOGIN_REWARD_SCHEDULE.map((r, i) => {
              const collected = eng.consecutiveLogins > i
              return (
                <div key={i} style={{
                  flex: 1, textAlign: 'center', position: 'relative', zIndex: 1,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: collected ? P.emerald : r.special ? P.gold + '20' : P.surface,
                    border: `2px solid ${collected ? P.emerald : r.special ? P.gold + '50' : P.border}`,
                    display: 'grid', placeItems: 'center',
                    margin: '0 auto 6px',
                    boxShadow: collected ? SHADOW.glow(P.emerald) : r.special ? SHADOW.glow(P.gold) : 'none',
                    transition: `all ${MOTION.med}`,
                  }}>
                    {collected ? (
                      <Check size={14} color="#fff" />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: r.special ? P.gold : P.textMuted }}>
                        +{r.tokens}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: collected ? P.emerald : P.textDim, fontWeight: 600 }}>{r.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lucky draw — premium gold */}
      {profile && (
        <button onClick={onLuckyDraw} style={{
          ...glassCard(), width: '100%', padding: '22px 26px', marginBottom: 20,
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16,
          border: `1px solid ${P.gold}30`,
          boxShadow: `${GLASS.highlight}, ${GLASS.edge}, 0 6px 28px rgba(0,0,0,0.5), 0 0 20px ${P.gold}10`,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: RADIUS.lg,
            background: P.gold + '18', display: 'grid', placeItems: 'center',
            boxShadow: SHADOW.glow(P.gold),
          }}>
            <Gift size={24} color={P.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: P.text }}>{t('lucky_draw')}</div>
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>{t('lucky_draw_desc')}</div>
          </div>
          <Sparkles size={22} color={P.gold} />
        </button>
      )}

      {/* Challenge cards */}
      {challenges.map(ch => {
        const game = GAMES.find(g => g.id === ch.gameId)
        return (
          <button key={ch.id} onClick={() => onPlay(ch.gameId)} style={{
            ...glassCard(), display: 'flex', alignItems: 'center', gap: 18,
            padding: '20px 24px', marginBottom: 14, width: '100%',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: RADIUS.lg,
              background: P.amber + '18', display: 'grid', placeItems: 'center',
            }}>
              <Target size={22} color={P.amber} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{ch.title}</div>
              <div style={{ fontSize: 12, color: P.textMuted, marginTop: 3, lineHeight: 1.4 }}>{ch.description}</div>
              {game && <div style={{ fontSize: 10, color: P.textDim, marginTop: 5 }}>{game.title}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: P.gold }}>+{ch.xpReward}</div>
              <div style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>XP</div>
            </div>
          </button>
        )
      })}

      {/* Streak card */}
      {profile && (
        <div style={{ ...glassCard(), padding: '24px 28px', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Flame size={18} color={P.amber} />
            <span style={{ fontSize: 16, fontWeight: 800, color: P.text }}>{t('your_streak')}: {profile.streakDays} {t('days')}</span>
          </div>
          <p style={{ fontSize: 13, color: P.textMuted, margin: 0, lineHeight: 1.5 }}>
            {t('play_daily_streak')} +{Math.min(profile.streakDays * 5, 50)}%
          </p>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   LEADERBOARD — Dramatic Podium
   ================================================================ */
function LeaderboardSection({ profile }: { profile: PlayerProfile | null }) {
  const [activeBoard, setActiveBoard] = useState('overall')
  const entries = generateDemoLeaderboard(activeBoard)
  const activeMeta = LEADERBOARD_CATEGORIES.find(c => c.id === activeBoard)!

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Trophy size={24} color={P.gold} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('leaderboard')}</h2>
      </div>

      {/* Board selector */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 24, paddingBottom: 4 }}>
        {LEADERBOARD_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveBoard(cat.id)} style={{
            padding: '8px 18px', borderRadius: RADIUS.full,
            background: activeBoard === cat.id ? cat.color : P.card,
            color: activeBoard === cat.id ? '#fff' : P.textMuted,
            border: `1px solid ${activeBoard === cat.id ? cat.color : P.border}`,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: activeBoard === cat.id ? SHADOW.glow(cat.color) : GLASS.highlight,
            transition: `all ${MOTION.fast}`,
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>{activeMeta.description}</p>

      {/* Dramatic podium top 3 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}>
        {[entries[1], entries[0], entries[2]].map((e, i) => {
          const pos = [2, 1, 3][i]
          const heights = [90, 120, 72]
          const avatarSizes = [44, 56, 38]
          const isChampion = pos === 1
          const podiumColors = [
            { border: '#b0b8c4', bg: '#b0b8c4' + '15', text: '#b0b8c4' },
            { border: P.gold, bg: P.gold + '18', text: P.gold },
            { border: '#cd7f32', bg: '#cd7f32' + '15', text: '#cd7f32' },
          ]
          const color = podiumColors[i]
          return (
            <div key={e.playerId} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isChampion && <Crown size={20} color={P.gold} style={{ marginBottom: 4 }} />}
              <div style={{
                width: avatarSizes[i], height: avatarSizes[i], borderRadius: '50%',
                background: color.bg, border: `2px solid ${color.border}`,
                display: 'grid', placeItems: 'center',
                boxShadow: isChampion ? SHADOW.glow(P.gold) : 'none',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: avatarSizes[i] * 0.45 }}>{e.avatar}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: P.text, marginTop: 2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.displayName}
              </span>
              <span style={{ fontSize: 10, color: P.textMuted, fontVariantNumeric: 'tabular-nums' }}>{e.score.toLocaleString()}</span>
              <div style={{
                width: avatarSizes[i] + 12, height: heights[i], marginTop: 10,
                borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0`,
                background: color.bg,
                border: `1px solid ${color.border}40`,
                borderBottom: 'none',
                display: 'grid', placeItems: 'end center', paddingBottom: 10,
                boxShadow: isChampion ? `${GLASS.highlight}, 0 0 30px ${P.gold}15` : GLASS.highlight,
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: color.text }}>#{pos}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full list */}
      <div style={cardStyle()}>
        {entries.map((e, i) => (
          <div key={e.playerId} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 20px',
            borderBottom: i < entries.length - 1 ? `1px solid ${P.border}` : 'none',
            background: profile && e.username === profile.username ? P.sapphire + '10' : 'transparent',
          }}>
            <span style={{
              width: 28, fontSize: 13, fontWeight: 800,
              color: i < 3 ? [P.gold, '#b0b8c4', '#cd7f32'][i] : P.textDim,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 20 }}>{e.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{e.displayName}</span>
                {e.teamTag && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: P.teal, background: P.teal + '15', padding: '2px 8px', borderRadius: RADIUS.full }}>
                    [{e.teamTag}]
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: RANK_META[e.rank as keyof typeof RANK_META]?.color || P.textDim }}>
                  {RANK_META[e.rank as keyof typeof RANK_META]?.label || e.rank}
                </span>
                <span style={{ fontSize: 10, color: P.textDim }}>Lv.{e.level}</span>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>
              {e.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Your position */}
      {profile && (
        <div style={{
          ...glassCard(), marginTop: 20, padding: '16px 22px',
          display: 'flex', alignItems: 'center', gap: 14,
          border: `1px solid ${P.sapphire}25`,
        }}>
          <span style={{ fontSize: 22 }}>{profile.avatar}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{t('you')}</span>
            <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
              {RANK_META[profile.rank].label} · {t('level')} {profile.level}
            </div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: P.sapphire, fontVariantNumeric: 'tabular-nums' }}>{profile.totalScore.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

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
      <div style={{ padding: '40px 4vw', maxWidth: 640, textAlign: 'center' }}>
        <Users size={36} color={P.textDim} style={{ marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 10px', ...TYPOGRAPHY.heading, color: P.text }}>{t('your_people')}</h2>
        <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>
          {t('sign_in_login')}
        </p>
        <button onClick={onLogin} style={premiumBtn(P.sapphire)}><LogIn size={14} /> {t('sign_in')}</button>
      </div>
    )
  }

  const relationGroups = [
    { key: 'romantic', label: t('loved_ones'), types: ['husband', 'wife', 'hubby', 'wifey', 'partner', 'bae'] },
    { key: 'family', label: t('family'), types: ['brother', 'sister', 'sibling', 'son', 'daughter', 'parent'] },
    { key: 'friends', label: t('friends'), types: ['friend', 'bestfriend', 'bff'] },
    { key: 'peers', label: t('peers'), types: ['classmate', 'colleague', 'teammate'] },
  ]

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={24} color={P.rose} />
          <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('your_people')}</h2>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...premiumBtn(P.emerald), padding: '10px 20px', fontSize: 13 }}>
          <UserPlus size={14} /> {t('add')}
        </button>
      </div>

      {/* Party games banner */}
      <div style={{ ...glassCard(), padding: '24px 26px', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PartyPopper size={18} color={P.fuchsia} /> {t('party_games')}
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {PARTY_GAMES.map(g => (
            <button key={g.id} onClick={() => onPlay(g.id)} style={{
              ...glassCard(), padding: '16px 20px', minWidth: 160, cursor: 'pointer',
              textAlign: 'left', flexShrink: 0, border: `1px solid ${g.color}25`,
            }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{g.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{g.name}</div>
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 3 }}>{g.minPlayers}-{g.maxPlayers} {t('players')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Connections list grouped by relation type */}
      {connections.length === 0 ? (
        <div style={{ ...glassCard(), padding: '56px 28px', textAlign: 'center' }}>
          <Heart size={36} color={P.textDim} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: '0 0 6px' }}>{t('no_people_yet')}</p>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
            {t('add_loved_ones')}
          </p>
          <button onClick={() => setShowAdd(true)} style={premiumBtn(P.emerald)}>
            <UserPlus size={14} /> {t('add_first_person')}
          </button>
        </div>
      ) : (
        <>
          {relationGroups.map(group => {
            const groupConns = connections.filter(c => group.types.includes(c.relation))
            if (groupConns.length === 0) return null
            return (
              <div key={group.key} style={{ marginBottom: 24 }}>
                <div style={{
                  ...TYPOGRAPHY.caption,
                  color: P.textMuted,
                  marginBottom: 10,
                }}>
                  {group.label}
                </div>
                {groupConns.map(conn => {
                  const meta = RELATION_META[conn.relation]
                  return (
                    <div key={conn.id} style={{
                      ...glassCard(), padding: '16px 20px', marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <span style={{ fontSize: 26 }}>{conn.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{conn.displayName}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: meta.color,
                            background: meta.color + '15', padding: '3px 10px', borderRadius: RADIUS.full,
                          }}>
                            {meta.emoji} {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: P.textDim, marginTop: 3 }}>
                          {conn.gamesPlayed > 0 ? `${conn.gamesPlayed} ${t('games_played').toLowerCase()} · ${conn.wins}W-${conn.losses}L` : t('not_played_yet')}
                          {conn.contactMethod === 'whatsapp' && ' · WhatsApp'}
                          {conn.contactMethod === 'instagram' && ' · Instagram'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setInviteConn(conn)} style={{
                          background: meta.color, border: 'none', borderRadius: RADIUS.full,
                          width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer',
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px ${meta.color}30`,
                        }}>
                          <Send size={14} color="#fff" />
                        </button>
                        <button onClick={() => handleRemove(conn.id)} style={{
                          background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full,
                          width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer',
                        }}>
                          <Trash2 size={14} color={P.textDim} />
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
          <div style={{ ...modalCard(), maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', ...TYPOGRAPHY.subheading, color: P.text }}>{t('add_person')}</h3>

            <input value={addName} onChange={e => setAddName(e.target.value)} placeholder={t('their_name')} style={inputStyle()} autoFocus />

            <div style={{ marginTop: 18, marginBottom: 8, ...TYPOGRAPHY.caption, color: P.textMuted }}>{t('relationship')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {(Object.entries(RELATION_META) as [RelationType, typeof RELATION_META[RelationType]][]).map(([key, meta]) => (
                <button key={key} onClick={() => setAddRelation(key)} style={{
                  padding: '6px 14px', borderRadius: RADIUS.full, fontSize: 11, fontWeight: 600,
                  background: addRelation === key ? meta.color : P.surface,
                  color: addRelation === key ? '#fff' : P.textMuted,
                  border: `1px solid ${addRelation === key ? meta.color : P.border}`,
                  cursor: 'pointer',
                  boxShadow: addRelation === key ? `inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
                }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 8, ...TYPOGRAPHY.caption, color: P.textMuted }}>{t('contact_method')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['username', 'Username']] as const).map(([m, label]) => (
                <button key={m} onClick={() => setAddMethod(m)} style={{
                  flex: 1, padding: '10px', borderRadius: RADIUS.md, fontSize: 12, fontWeight: 600,
                  background: addMethod === m ? P.sapphire : P.surface,
                  color: addMethod === m ? '#fff' : P.textMuted,
                  border: `1px solid ${addMethod === m ? P.sapphire : P.border}`,
                  cursor: 'pointer',
                  boxShadow: addMethod === m ? `inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
                }}>
                  {label}
                </button>
              ))}
            </div>

            <input
              value={addContact}
              onChange={e => setAddContact(e.target.value)}
              placeholder={addMethod === 'whatsapp' ? '+255 7XX XXX XXX' : addMethod === 'instagram' ? '@username' : 'username'}
              style={inputStyle()}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={addSharePic} onChange={e => setAddSharePic(e.target.checked)} />
              <span style={{ fontSize: 12, color: P.textMuted }}>{t('share_photo')}</span>
            </label>

            <button onClick={handleAdd} style={{ ...premiumBtn(P.emerald), width: '100%', justifyContent: 'center', marginTop: 20 }}>
              <UserPlus size={14} /> {t('add')}
            </button>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteConn && (
        <div style={modalOverlay} onClick={() => setInviteConn(null)}>
          <div style={{ ...modalCard(), maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{inviteConn.avatar}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>{inviteConn.displayName}</div>
                <div style={{ fontSize: 12, color: RELATION_META[inviteConn.relation].color }}>
                  {RELATION_META[inviteConn.relation].emoji} {RELATION_META[inviteConn.relation].label}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: P.textMuted, marginBottom: 12 }}>
              {t('choose_game_invite')}
            </div>

            {PARTY_GAMES.map(g => (
              <button key={g.id} onClick={() => handleInvite(inviteConn, g.id, g.name)} style={{
                ...glassCard(), width: '100%', padding: '16px 20px', marginBottom: 10,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: 24 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: P.textMuted }}>{g.description}</div>
                </div>
                <Send size={14} color={g.color} />
              </button>
            ))}

            <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 14, marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: P.textMuted, marginBottom: 10 }}>
                {t('or_challenge_any')}
              </div>
              {GAMES.filter(g => g.category !== 'party').slice(0, 6).map(g => (
                <button key={g.id} onClick={() => handleInvite(inviteConn, 'challenge', g.title)} style={{
                  background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full,
                  padding: '7px 16px', fontSize: 11, fontWeight: 600, color: P.textMuted,
                  cursor: 'pointer', marginRight: 8, marginBottom: 8,
                  boxShadow: GLASS.highlight,
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
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <ShoppingBag size={24} color={P.violet} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('shop')}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Coins size={18} color={P.gold} />
        <span style={{ fontSize: 22, fontWeight: 900, color: P.gold, fontVariantNumeric: 'tabular-nums' }}>{wallet.balance.toLocaleString()}</span>
        <span style={{ fontSize: 13, color: P.textMuted }}>{t('tokens')}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['shop', 'packs', 'history'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{
            padding: '8px 20px', borderRadius: RADIUS.full,
            background: tab === tabKey ? P.violet : P.card,
            color: tab === tabKey ? '#fff' : P.textMuted,
            border: `1px solid ${tab === tabKey ? P.violet : P.border}`,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            boxShadow: tab === tabKey ? SHADOW.glow(P.violet) : GLASS.highlight,
            transition: `all ${MOTION.fast}`,
          }}>
            {tabKey === 'shop' ? t('items') : tabKey === 'packs' ? t('buy_tokens') : t('history')}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {SHOP.map(item => {
            const owned = item.oneTime && purchased.includes(item.id)
            const canAfford = wallet.balance >= item.price
            return (
              <div key={item.id} style={{ ...glassCard(), padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: RADIUS.lg,
                  background: item.color + '18', display: 'grid', placeItems: 'center',
                }}>
                  <span style={{ fontSize: 20 }}>
                    {item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'heart' ? '❤️' :
                     item.icon === 'clock' ? '⏱️' : item.icon === 'lightbulb' ? '💡' : item.icon === 'flame' ? '🔥' :
                     item.icon === 'gem' ? '💎' : item.icon === 'crown' ? '👑' : item.icon === 'sparkles' ? '✨' : '🏳️'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>{item.description}</div>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={owned || !canAfford}
                  style={{
                    padding: '8px 18px', borderRadius: RADIUS.full,
                    background: owned ? P.emerald + '20' : canAfford ? item.color : P.surface,
                    color: owned ? P.emerald : canAfford ? '#fff' : P.textDim,
                    border: 'none', fontSize: 12, fontWeight: 700, cursor: owned || !canAfford ? 'default' : 'pointer',
                    opacity: !canAfford && !owned ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: canAfford && !owned ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px ${item.color}30` : 'none',
                  }}
                >
                  {owned ? <><Check size={12} /> {t('purchased')}</> : <><Coins size={11} /> {item.price}</>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'packs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {TOKEN_PACKS.map(pack => (
            <button key={pack.id} onClick={() => {
              const w = purchaseTokens(pack.tokens, pack.label)
              setWallet(w)
            }} style={{
              ...glassCard(), padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
              border: pack.label === 'Best Value' ? `2px solid ${P.gold}50` : `1px solid ${P.border}`,
              boxShadow: pack.label === 'Best Value'
                ? `${GLASS.highlight}, ${SHADOW.glow(P.gold)}`
                : `${GLASS.highlight}, ${SHADOW.md}`,
            }}>
              {pack.label === 'Best Value' && (
                <div style={{ ...TYPOGRAPHY.caption, color: P.gold, marginBottom: 10 }}>
                  {t('best_value')}
                </div>
              )}
              <Coins size={28} color={P.gold} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 26, fontWeight: 900, color: P.text }}>{pack.tokens.toLocaleString()}</div>
              {pack.bonus > 0 && (
                <div style={{ fontSize: 11, color: P.emerald, fontWeight: 700, marginTop: 2 }}>+{pack.bonus} bonus</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: P.gold, marginTop: 10 }}>
                TSh {pack.price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={cardStyle()}>
          {wallet.transactions.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: P.textDim }}>{t('no_transactions')}</p>
            </div>
          ) : wallet.transactions.slice(0, 30).map(tx => (
            <div key={tx.id} style={{
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: `1px solid ${P.border}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: tx.type === 'earn' ? P.emerald + '18' : tx.type === 'purchase' ? P.gold + '18' : P.rose + '18',
              }}>
                {tx.type === 'earn' ? <TrendingUp size={13} color={P.emerald} /> :
                 tx.type === 'purchase' ? <Coins size={13} color={P.gold} /> :
                 <ShoppingBag size={13} color={P.rose} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: P.text }}>{tx.reason}</div>
                <div style={{ fontSize: 10, color: P.textDim }}>{new Date(tx.timestamp).toLocaleDateString()}</div>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: tx.type === 'spend' ? P.rose : P.emerald,
                fontVariantNumeric: 'tabular-nums',
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
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: SPACING.xl }}>
        <Bell size={24} color={P.sapphire} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('notifications')}</h2>
      </div>
      {notifs.length === 0 ? (
        <div style={{ ...glassCard(), padding: '56px 28px', textAlign: 'center' }}>
          <Bell size={36} color={P.textDim} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: P.textDim }}>{t('no_notifications')}</p>
        </div>
      ) : (
        <div style={cardStyle()}>
          {notifs.map(n => (
            <div key={n.id} style={{
              padding: '16px 22px', display: 'flex', alignItems: 'flex-start', gap: 14,
              borderBottom: `1px solid ${P.border}`,
              background: n.read ? 'transparent' : P.sapphire + '08',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: (n.color || P.sapphire) + '18', display: 'grid', placeItems: 'center',
              }}>
                {n.type === 'record_broken' ? <Trophy size={18} color={n.color || P.gold} /> :
                 n.type === 'achievement' ? <Award size={18} color={n.color || P.violet} /> :
                 n.type === 'reward' ? <Gift size={18} color={n.color || P.emerald} /> :
                 n.type === 'milestone' ? <Star size={18} color={n.color || P.gold} /> :
                 <Bell size={18} color={n.color || P.sapphire} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{n.title}</div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: P.textDim, marginTop: 5 }}>
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
   PROFILE — Dramatic Header
   ================================================================ */
function ProfileSection({ profile, setProfile, wallet, lang, setLang, theme, setTheme }: { profile: PlayerProfile; setProfile: (p: PlayerProfile | null) => void; wallet?: TokenWallet; lang: Lang; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void }) {
  const earnedBadges = BADGES.filter(b => profile.badges.includes(b.id))
  const unearnedBadges = BADGES.filter(b => !profile.badges.includes(b.id))
  const rankColor = RANK_META[profile.rank].color

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      {/* Dramatic profile header card */}
      <div style={{
        ...glassCard(), padding: '36px 32px', textAlign: 'center', marginBottom: 24,
        position: 'relative', overflow: 'visible',
      }}>
        {/* Ambient rank glow */}
        <div style={{
          position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 60, borderRadius: '50%',
          ...heroGlow(rankColor),
          pointerEvents: 'none',
        }} />

        <div style={{
          fontSize: 56, marginBottom: 10, position: 'relative',
          filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.4))`,
        }}>
          {profile.avatar}
        </div>
        <h2 style={{ margin: '0 0 4px', ...TYPOGRAPHY.heading, color: P.text }}>{profile.displayName}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: P.textMuted }}>@{profile.username}</p>

        {/* Rank badge with glow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: RADIUS.full,
          background: rankColor + '18',
          border: `1px solid ${rankColor}30`,
          boxShadow: SHADOW.glow(rankColor),
        }}>
          <Crown size={16} color={rankColor} />
          <span style={{ fontSize: 14, fontWeight: 800, color: rankColor }}>{RANK_META[profile.rank].label}</span>
          <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 600 }}>{t('level')} {profile.level}</span>
        </div>

        <div style={{ marginTop: 20, maxWidth: 360, margin: '20px auto 0' }}>
          <XPBar xp={profile.xp} large />
        </div>
      </div>

      {/* Stats grid — 3 columns mobile, responsive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={<BarChart3 size={18} />} color={P.sapphire} label={t('total_xp')} value={profile.xp.toLocaleString()} />
        <StatCard icon={<Coins size={18} />} color={P.gold} label={t('tokens')} value={wallet?.balance.toLocaleString() || '0'} />
        <StatCard icon={<Gamepad2 size={18} />} color={P.emerald} label={t('games_played')} value={profile.totalGames.toString()} />
        <StatCard icon={<Flame size={18} />} color={P.amber} label={t('streak')} value={`${profile.streakDays} ${t('days')}`} />
        <StatCard icon={<Trophy size={18} />} color={P.gold} label={t('total_score')} value={profile.totalScore.toLocaleString()} />
        <StatCard icon={<TrendingUp size={18} />} color={P.teal} label={t('longest_streak')} value={`${profile.longestStreak} ${t('days')}`} />
        <StatCard icon={<Award size={18} />} color={P.violet} label={t('badges')} value={earnedBadges.length.toString()} />
      </div>

      {/* Badges */}
      <div style={{ ...glassCard(), padding: '24px 26px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={18} color={P.violet} /> {t('badges')}
        </h3>
        {earnedBadges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: earnedBadges.length > 0 ? 18 : 0 }}>
            {earnedBadges.map(b => (
              <div key={b.id} style={{
                padding: '10px 16px', borderRadius: RADIUS.md,
                background: b.color + '15', border: `1px solid ${b.color}25`,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: GLASS.highlight,
              }}>
                <Star size={13} color={b.color} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: P.textMuted }}>{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {unearnedBadges.slice(0, 8).map(b => (
            <div key={b.id} style={{
              padding: '8px 14px', borderRadius: RADIUS.md,
              background: P.surface, border: `1px solid ${P.border}`,
              display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5,
            }}>
              <Star size={11} color={P.textDim} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: P.textDim }}>{b.name}</div>
                <div style={{ fontSize: 9, color: P.textDim }}>{b.requirement}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teams & Social */}
      <div style={{ ...glassCard(), padding: '24px 26px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color={P.teal} /> {t('teams_friends')}
        </h3>
        {profile.teamId ? (
          <div style={{ fontSize: 13, color: P.textMuted }}>Team member</div>
        ) : (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 14px' }}>{t('no_team_yet')}</p>
            <button style={{ ...premiumBtn(P.teal), fontSize: 13, padding: '10px 24px' }}>
              <Users size={14} /> {t('create_team')}
            </button>
          </div>
        )}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${P.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: P.textMuted }}>{t('friends_count')} ({profile.friendIds.length})</span>
            <button style={{ background: 'none', border: 'none', color: P.sapphire, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + {t('add')}
            </button>
          </div>
          {profile.friendIds.length === 0 && (
            <p style={{ fontSize: 12, color: P.textDim, margin: 0, lineHeight: 1.5 }}>
              {t('share_link')}
            </p>
          )}
        </div>
        {profile.coupledWith === null && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${P.border}`, textAlign: 'center' }}>
            <Heart size={18} color={P.rose} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 10px' }}>{t('couple_challenge')}</p>
            <button style={{
              background: 'none', border: `1px solid ${P.rose}40`, color: P.rose,
              borderRadius: RADIUS.full, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: GLASS.highlight,
            }}>
              <Heart size={13} /> {t('connect')}
            </button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ ...glassCard(), padding: '20px 26px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: P.text }}>{t('settings')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: P.textMuted }}>{t('language')}</span>
          <button onClick={() => { const next: Lang = lang === 'en' ? 'sw' : 'en'; saveLang(next); setLang(next); }} style={{
            padding: '8px 18px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 700,
            background: P.sapphire + '15', color: P.sapphire, border: `1px solid ${P.sapphire}30`,
            cursor: 'pointer', boxShadow: GLASS.highlight,
          }}>
            {lang === 'en' ? 'English' : 'Kiswahili'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: P.textMuted }}>{t('theme')}</span>
          <button onClick={() => { const next: Theme = theme === 'dark' ? 'light' : 'dark'; saveTheme(next); setTheme(next); }} style={{
            padding: '8px 18px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 700,
            background: P.amber + '15', color: P.amber, border: `1px solid ${P.amber}30`,
            cursor: 'pointer', boxShadow: GLASS.highlight,
          }}>
            {theme === 'dark' ? t('dark') : t('light')}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={() => { localStorage.removeItem('kg_profile'); setProfile(null) }} style={{
        background: 'none', border: `1px solid ${P.border}`, color: P.textDim,
        borderRadius: RADIUS.lg, padding: '12px 24px', fontSize: 13, cursor: 'pointer',
        width: '100%',
        boxShadow: GLASS.highlight,
      }}>
        {t('logout')}
      </button>
    </div>
  )
}

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */

/** Stat pill for hero section */
function StatPill({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 18px', borderRadius: RADIUS.full,
      background: color + '12', border: `1px solid ${color}20`,
      boxShadow: GLASS.highlight,
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: P.text }}>{value}</span>
    </div>
  )
}

function XPBar({ xp, large }: { xp: number; large?: boolean }) {
  const { current, needed, progress } = xpToNextLevel(xp)
  const h = large ? 10 : 5
  return (
    <div>
      <div style={{
        height: h, background: P.border, borderRadius: h, overflow: 'hidden',
        marginTop: large ? 10 : 4,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          height: '100%', width: `${progress * 100}%`,
          background: P.sapphire, borderRadius: h,
          transition: `width ${MOTION.med}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px ${P.sapphire}40`,
        }} />
      </div>
      {large && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: P.textDim }}>
          <span>{current.toLocaleString()} XP</span>
          <span>{needed.toLocaleString()} {t('xp_to_next')}</span>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div style={{
      ...glassCard(), padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: RADIUS.md,
        background: color + '15', display: 'grid', placeItems: 'center', color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: 11, color: P.textMuted }}>{label}</div>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick, accent }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; accent?: string }) {
  return (
    <button onClick={onClick} style={{
      ...navBtnStyle(),
      color: accent || (active ? P.text : P.textMuted),
      background: active && !accent ? P.sapphire + '15' : 'none',
      borderRadius: RADIUS.md,
    }}>
      {icon}
      {label && <span className="nav-label" style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>}
    </button>
  )
}

function CatPill({ label, count, active, color, icon, onClick }: {
  label: string; count: number; active: boolean; color: string
  icon: React.ReactNode; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 16px', borderRadius: RADIUS.full,
      background: active ? color : P.card,
      color: active ? '#fff' : P.textMuted,
      border: `1px solid ${active ? color : P.border}`,
      cursor: 'pointer', fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap', transition: `all ${MOTION.fast}`,
      boxShadow: active ? `${GLASS.highlight}, ${SHADOW.glow(color)}` : GLASS.highlight,
    }}>
      {icon}
      {label}
      <span style={{
        background: active ? 'rgba(255,255,255,0.2)' : P.border,
        padding: '2px 7px', borderRadius: RADIUS.full,
        fontSize: 10, fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <Brain size={32} color={P.sapphire} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <span style={{ color: P.textMuted, fontSize: 14, fontWeight: 600 }}>{t('loading')}</span>
    </div>
  )
}

/* ================================================================
   STYLE CONSTANTS
   ================================================================ */
let P = getPalette('dark')

function headerStyle(): CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4vw',
    height: 56,
    borderBottom: `1px solid ${P.border}`,
    position: 'sticky',
    top: 0,
    background: P.bg,
    zIndex: 100,
    boxShadow: `${GLASS.highlight}, 0 4px 20px rgba(0,0,0,0.4)`,
  }
}

function navBtnStyle(): CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: P.textMuted,
    cursor: 'pointer',
    padding: '8px 10px',
    borderRadius: RADIUS.md,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    transition: `color ${MOTION.fast}, background ${MOTION.fast}`,
  }
}

function cardStyle(): CSSProperties {
  return {
    background: P.card,
    border: `1px solid ${P.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: `${GLASS.highlight}, ${GLASS.edge}, ${SHADOW.md}`,
    overflow: 'hidden',
  }
}

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 1000,
  padding: 24,
}

function modalCard(): CSSProperties {
  return {
    background: P.card,
    border: `1px solid ${P.borderLight}`,
    borderRadius: RADIUS.xl,
    padding: '36px 32px',
    maxWidth: 400,
    width: '100%',
    boxShadow: `${SHADOW.xl}, ${GLASS.highlight}`,
  }
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    padding: '13px 16px',
    borderRadius: RADIUS.md,
    background: P.surface,
    border: `1px solid ${P.border}`,
    color: P.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: `border-color ${MOTION.fast}`,
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
  }
}
