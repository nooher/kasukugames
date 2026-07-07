import { useState, lazy, Suspense, useEffect, useCallback, type CSSProperties } from 'react'
import {
  Brain, Heart,
  Gamepad2, Trophy, ArrowLeft, Users, PartyPopper,
  Flame, Star, Target, Crown, Award, LogIn, UserPlus, Send,
  BarChart3, Calendar, TrendingUp, Bell, Coins, Gift, ShoppingBag,
  Download, X, Sparkles, Check, Trash2, Globe, Sun, Moon, Music,
} from 'lucide-react'
import { RADIUS, MOTION, SHADOW, GLASS, TYPOGRAPHY, SPACING, heroGlow, premiumBtn } from './lib/design'
import { BRAND } from './lib/brand'
import { t, loadLang, saveLang, type Lang } from './lib/i18n'
import { loadTheme, saveTheme, getPalette, type Theme } from './lib/theme'
import { GAMES } from './lib/games'
import { CATEGORY_META, type GameCategory } from './lib/cognitive'
import {
  loadProfile, createProfile, updateProfileAfterGame,
  xpToNextLevel, RANK_META, BADGES, generateDailyChallenges,
  MUHURI_META, isVerifiedTier, setMuhuri, getAllMuhuriAssignments, isFounderOrAdmin,
  type PlayerProfile, type MuhuriType,
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
// GameCard import removed — HomeSection no longer uses the full game grid
import Logo from './components/Logo'
import FloatingPlayer from './components/FloatingPlayer'
import LaunchScreen from './components/LaunchScreen'
import VerifiedBadge from './components/VerifiedBadge'

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


const AVATAR_OPTIONS = ['🧠', '🦁', '🌟', '💎', '🔥', '👑', '🦋', '⚡', '🎯', '🎮']

type Section = 'home' | 'leaderboard' | 'profile' | 'daily' | 'shop' | 'notifications' | 'connections'
type PaletteType = ReturnType<typeof getPalette>

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

function tpl(key: string, vars: Record<string, string | number>): string {
  let s = t(key)
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(`{${k}}`, String(v))
  }
  return s
}

/* ================================================================
   MAIN APP
   ================================================================ */
export default function App() {
  const [profile, setProfile] = useState<PlayerProfile | null>(loadProfile)
  const [section, setSection] = useState<Section>('home')
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [playerVisible, setPlayerVisible] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin')
  const [loginName, setLoginName] = useState('')
  const [loginDisplay, setLoginDisplay] = useState('')
  const [loginAvatar, setLoginAvatar] = useState('🧠')
  const [wallet, setWallet] = useState<TokenWallet>(loadWallet)
  const [unreadNotifs, setUnreadNotifs] = useState(getUnreadCount)
  const [loginReward, setLoginReward] = useState<{ tokens: number; day: number; isComeback: boolean; comebackBonus: number } | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [luckyResult, setLuckyResult] = useState<{ tokens: number; label: string } | null>(null)
  const [lang, setLangState] = useState<Lang>(loadLang)
  const [theme, setThemeState] = useState<Theme>(loadTheme)
  const [launchDone, setLaunchDone] = useState(() => sessionStorage.getItem('kg_launched') === '1')

  const P = getPalette(theme)
  const isDark = theme === 'dark'
  // lang state triggers re-render when changed; t() reads current lang internally
  void lang

  const headerStyle: CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 max(4vw, 24px)', height: 64,
    borderBottom: isDark ? 'none' : `1px solid ${P.border}`,
    position: 'sticky', top: 0, background: P.bg, zIndex: 100,
    boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)' : '0 1px 0 rgba(0,0,0,0.04)',
  }

  const navBtnStyle: CSSProperties = {
    background: 'none', border: 'none', color: P.textMuted,
    cursor: 'pointer', padding: '8px 10px', borderRadius: RADIUS.md,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    transition: `color ${MOTION.fast}, background ${MOTION.fast}`,
  }

  const cardStyle: CSSProperties = {
    background: P.card, border: `1px solid ${P.border}`, borderRadius: 24,
    boxShadow: isDark ? `${GLASS.highlight}, ${GLASS.edge}, ${SHADOW.md}` : '0 1px 6px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  }

  const modalOverlay: CSSProperties = {
    position: 'fixed', inset: 0,
    background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)',
    display: 'grid', placeItems: 'center', zIndex: 1000, padding: 24,
  }

  const modalCard: CSSProperties = {
    background: P.card, border: `1px solid ${P.borderLight}`,
    borderRadius: 32, padding: '48px 44px', maxWidth: 440, width: '100%',
    boxShadow: isDark ? `${SHADOW.xl}, ${GLASS.highlight}` : '0 16px 48px rgba(0,0,0,0.12)',
  }

  const inputStyle: CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: RADIUS.md,
    background: P.surface, border: `1px solid ${P.border}`, color: P.text,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: `border-color ${MOTION.fast}`,
    boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
  }

  const glassCardTheme = useCallback((): CSSProperties => ({
    background: P.surface,
    border: `1px solid ${P.border}`, borderRadius: 24,
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.4), 0 16px 64px rgba(0,0,0,0.2)'
      : '0 1px 6px rgba(0,0,0,0.06)',
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }), [isDark, P.border])

  useEffect(() => {
    document.body.style.background = P.bg
    document.body.style.color = P.text
  }, [P.bg, P.text])

  useEffect(() => {
    requestNotificationPermission()
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (profile) {
      const result = processLogin()
      if (result.tokens > 0) {
        setLoginReward(result)
        const w = earnTokens(result.tokens, result.isComeback ? t('welcome_back') : tpl('login_day_reward', { day: result.day }))
        setWallet(w)
      }
      const milestones = checkMilestones(profile)
      for (const m of milestones) {
        const w = earnTokens(m.tokens, tpl('milestone', { label: m.label }))
        setWallet(w)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      setDeferredPrompt(null)
      setShowInstall(false)
      return
    }
    setShowInstallModal(true)
  }

  const handleLangToggle = () => {
    const next: Lang = lang === 'en' ? 'sw' : 'en'
    saveLang(next)
    setLangState(next)
  }

  const handleThemeToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setThemeState(next)
  }


  const handleLogin = () => {
    if (!loginName.trim()) return
    if (loginMode === 'signup' && !loginDisplay.trim()) return
    const p = createProfile(loginName.trim().toLowerCase().replace(/\s+/g, '_'), loginDisplay.trim() || loginName.trim())
    if (loginMode === 'signup') {
      p.avatar = loginAvatar
      localStorage.setItem('kg_profile', JSON.stringify(p))
    }
    setProfile(p)
    setShowLogin(false)
    setLoginName('')
    setLoginDisplay('')
    setLoginAvatar('🧠')
  }

  const handleGameBack = () => {
    const score = Math.floor(Math.random() * 500 + 100)
    const p = updateProfileAfterGame(score, Math.random() * 0.5 + 0.5, Math.floor(Math.random() * 5 + 1))
    if (p) {
      setProfile(p)
      if (activeGame) {
        const game = GAMES.find(g => g.id === activeGame)
        if (game) {
          submitScore(activeGame, game.title, p.id, p.displayName, score)
        }
        const w = earnTokens(TOKEN_EARN_RATES.gameComplete, tpl('game_completed', { game: game?.title || 'game' }))
        setWallet(w)
      }
    }
    setActiveGame(null)
  }

  const handleLuckyDraw = () => {
    const result = spinLuckyDraw()
    if (result) {
      const w = earnTokens(result.tokens, tpl('lucky_draw_result', { label: result.label }))
      setWallet(w)
      setLuckyResult(result)
      setTimeout(() => setLuckyResult(null), 3000)
    }
  }

  if (!launchDone) {
    return <LaunchScreen onComplete={() => { setLaunchDone(true); sessionStorage.setItem('kg_launched', '1') }} />
  }

  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame]
    if (GameComponent) {
      return (
        <Suspense fallback={<LoadingView P={P} />}>
          <GameComponent onBack={handleGameBack} />
          <FloatingPlayer visible={playerVisible} onToggle={() => setPlayerVisible(false)} theme={theme} />
        </Suspense>
      )
    }
    return (
      <div style={{ padding: '80px 4vw', textAlign: 'center', background: P.bg, minHeight: '100vh' }}>
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
      {/* HEADER */}
      {/* TOP HEADER — slim on mobile */}
      <header style={headerStyle}>
        <button onClick={() => setSection('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Logo size={36} showText textColor={P.text} mutedColor={P.textMuted} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Desktop-only nav links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavBtn icon={<Calendar size={18} />} label={t('daily')} active={section === 'daily'} onClick={() => setSection('daily')} P={P} style={navBtnStyle} />
            <NavBtn icon={<Trophy size={18} />} label={t('ranks')} active={section === 'leaderboard'} onClick={() => setSection('leaderboard')} P={P} style={navBtnStyle} />
            <NavBtn icon={<Users size={18} />} label={t('people')} active={section === 'connections'} onClick={() => setSection('connections')} P={P} style={navBtnStyle} />
            <NavBtn icon={<ShoppingBag size={18} />} label={t('shop')} active={section === 'shop'} onClick={() => setSection('shop')} P={P} style={navBtnStyle} />
          </nav>
          <button onClick={() => { setSection('notifications'); markAllRead(); setUnreadNotifs(0) }} style={{ ...navBtnStyle, position: 'relative' }}>
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 16, height: 16, borderRadius: '50%',
                background: P.rose, fontSize: 8, fontWeight: 600,
                display: 'grid', placeItems: 'center', color: '#fff',
                border: `2px solid ${P.bg}`,
              }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
            )}
          </button>
          <button onClick={() => setPlayerVisible(v => !v)} title="Music" style={{ ...navBtnStyle, color: playerVisible ? P.amber : P.textMuted }}>
            <Music size={16} />
          </button>
          <button onClick={handleLangToggle} title={t('language')} style={navBtnStyle}>
            <Globe size={16} />
          </button>
          <button onClick={handleThemeToggle} title={t('theme')} style={navBtnStyle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={handleInstall} title={t('get_the_app')} style={{ ...navBtnStyle, color: P.emerald }}>
            <Download size={16} />
          </button>
          <span className="desktop-nav">
          {profile ? (
            <button onClick={() => setSection('profile')} style={{
              ...navBtnStyle, background: section === 'profile' ? P.sapphire + '20' : 'none', gap: 6,
            }}>
              <span style={{ fontSize: 18 }}>{profile.avatar}</span>
              <VerifiedBadge muhuri={profile.muhuri} size={14} />
              <span style={{ fontSize: 11, fontWeight: 600, color: RANK_META[profile.rank].color }}>{profile.level}</span>
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ ...premiumBtn(P.sapphire), padding: '8px 18px', fontSize: 13 }}>
              <LogIn size={15} /> {t('sign_in')}
            </button>
          )}
          {profile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: RADIUS.full,
              background: P.gold + '12', border: `1px solid ${P.gold}20`, marginLeft: 4,
            }}>
              <Coins size={13} color={P.gold} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.gold, fontVariantNumeric: 'tabular-nums' }}>{wallet.balance}</span>
            </div>
          )}
          </span>
        </div>
      </header>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="mobile-tab-bar" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        display: 'none', justifyContent: 'space-around', alignItems: 'center',
        height: 68, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: P.bg, borderTop: isDark ? 'none' : `1px solid ${P.border}`,
        boxShadow: isDark ? '0 -1px 0 rgba(255,255,255,0.04), 0 -8px 32px rgba(0,0,0,0.5)' : '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        <MobileTab icon={<Brain size={20} />} label={t('daily')} active={section === 'home' || section === 'daily'} onClick={() => setSection('home')} P={P} />
        <MobileTab icon={<Trophy size={20} />} label={t('ranks')} active={section === 'leaderboard'} onClick={() => setSection('leaderboard')} P={P} />
        <MobileTab icon={<Users size={20} />} label={t('people')} active={section === 'connections'} onClick={() => setSection('connections')} P={P} />
        <MobileTab icon={<ShoppingBag size={20} />} label={t('shop')} active={section === 'shop'} onClick={() => setSection('shop')} P={P} />
        <MobileTab icon={profile ? <span style={{ fontSize: 20 }}>{profile.avatar}</span> : <LogIn size={20} />} label={profile ? t('profile') : t('sign_in')} active={section === 'profile'} onClick={() => profile ? setSection('profile') : setShowLogin(true)} P={P} />
      </nav>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div style={modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <Logo size={40} style={{ marginBottom: SPACING.lg }} textColor={P.text} mutedColor={P.textMuted} />
            <h2 style={{ margin: '0 0 6px', ...TYPOGRAPHY.heading, color: P.text, textAlign: 'center' }}>
              {loginMode === 'signup' ? t('join_kasukugames') : t('sign_in')}
            </h2>
            <p style={{ margin: `0 0 ${SPACING.xl}px`, fontSize: 14, color: P.textMuted, lineHeight: 1.5, textAlign: 'center' }}>
              {t('use_kasuku_or_create')}
            </p>
            <input value={loginName} onChange={e => setLoginName(e.target.value)} placeholder={t('username')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputStyle} autoFocus />
            {loginMode === 'signup' && (
              <>
                <input value={loginDisplay} onChange={e => setLoginDisplay(e.target.value)} placeholder={t('display_name')}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ ...inputStyle, marginTop: 12 }} />
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.textMuted, marginBottom: 8 }}>{t('choose_avatar')}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AVATAR_OPTIONS.map(emoji => (
                      <button key={emoji} onClick={() => setLoginAvatar(emoji)} style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: loginAvatar === emoji ? P.sapphire + '25' : P.surface,
                        border: loginAvatar === emoji ? `2px solid ${P.sapphire}` : `1px solid ${P.border}`,
                        fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center',
                        boxShadow: loginAvatar === emoji ? SHADOW.glow(P.sapphire) : 'none',
                        transition: `all ${MOTION.fast}`,
                      }}>{emoji}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <button onClick={handleLogin} style={{
              ...premiumBtn(P.sapphire), width: '100%', justifyContent: 'center',
              marginTop: SPACING.lg, padding: '14px 28px', fontSize: 15,
            }}>
              {loginMode === 'signup' ? t('create_account') : t('sign_in')}
            </button>
            <p style={{ margin: '20px 0 0', fontSize: 13, color: P.textMuted, textAlign: 'center' }}>
              {loginMode === 'signin' ? (
                <>{t('no_account')}{' '}
                  <button onClick={() => setLoginMode('signup')} style={{ background: 'none', border: 'none', color: P.sapphire, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>{t('sign_up')}</button>
                </>
              ) : (
                <>{t('have_account')}{' '}
                  <button onClick={() => setLoginMode('signin')} style={{ background: 'none', border: 'none', color: P.sapphire, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>{t('sign_in')}</button>
                </>
              )}
            </p>
            <p style={{ margin: '14px 0 0', fontSize: 11, color: P.textDim, textAlign: 'center' }}>{t('shared_login')}</p>
          </div>
        </div>
      )}

      {/* INSTALL INSTRUCTIONS MODAL */}
      {showInstallModal && (
        <div style={modalOverlay} onClick={() => setShowInstallModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <Download size={32} color={P.sapphire} style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 12px', ...TYPOGRAPHY.subheading, color: P.text }}>{t('download_kasukugames')}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: P.textMuted, lineHeight: 1.6 }}>{t('ios_install')}</p>
            <button onClick={() => setShowInstallModal(false)} style={{ ...premiumBtn(P.sapphire), width: '100%', justifyContent: 'center' }}>OK</button>
          </div>
        </div>
      )}

      {/* SECTIONS */}
      {section === 'home' && (
        <HomeSection onPlay={setActiveGame} P={P} isDark={isDark} gct={glassCardTheme} />
      )}
      {section === 'daily' && <DailySection profile={profile} onPlay={setActiveGame} onLogin={() => setShowLogin(true)} onLuckyDraw={handleLuckyDraw} P={P} isDark={isDark} gct={glassCardTheme} />}
      {section === 'leaderboard' && <LeaderboardSection profile={profile} P={P} isDark={isDark} cs={cardStyle} gct={glassCardTheme} />}
      {section === 'connections' && <ConnectionsSection profile={profile} onPlay={setActiveGame} onLogin={() => setShowLogin(true)} P={P} isDark={isDark} mo={modalOverlay} mc={modalCard} is={inputStyle} gct={glassCardTheme} />}
      {section === 'shop' && <ShopSection wallet={wallet} setWallet={setWallet} P={P} isDark={isDark} cs={cardStyle} gct={glassCardTheme} />}
      {section === 'notifications' && <NotificationsSection P={P} cs={cardStyle} gct={glassCardTheme} />}
      {section === 'profile' && profile && <ProfileSection profile={profile} setProfile={setProfile} wallet={wallet} P={P} isDark={isDark} lang={lang} theme={theme} onLangToggle={handleLangToggle} onThemeToggle={handleThemeToggle} gct={glassCardTheme} />}

      {/* Login reward toast */}
      {loginReward && loginReward.tokens > 0 && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          ...glassCardTheme(), padding: '16px 28px',
          border: `1px solid ${P.gold}40`, boxShadow: SHADOW.glow(P.gold),
          zIndex: 1100, display: 'flex', alignItems: 'center', gap: 14,
          animation: 'slideUp 0.4s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Gift size={22} color={P.gold} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>
              {loginReward.isComeback ? t('welcome_back') : tpl('login_day_reward', { day: loginReward.day })}
            </div>
            <div style={{ fontSize: 12, color: P.gold, fontWeight: 600 }}>+{loginReward.tokens} {t('tokens')}</div>
          </div>
          <button onClick={() => setLoginReward(null)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 6 }}><X size={14} /></button>
        </div>
      )}

      {/* Lucky draw result */}
      {luckyResult && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          ...glassCardTheme(), padding: '48px 56px', textAlign: 'center',
          border: `1px solid ${P.gold}50`,
          boxShadow: isDark ? `${SHADOW.xl}, ${SHADOW.glow(P.gold)}` : `0 16px 48px rgba(0,0,0,0.12), ${SHADOW.glow(P.gold)}`,
          zIndex: 1200, animation: 'slideUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}>
          <Sparkles size={36} color={P.gold} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 36, fontWeight: 600, color: P.gold, marginBottom: 6, letterSpacing: '-0.02em' }}>+{luckyResult.tokens}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{luckyResult.label}</div>
        </div>
      )}

      {/* PWA install banner */}
      {showInstall && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: P.card, borderTop: `1px solid ${P.border}`,
          padding: '16px 4vw', display: 'flex', alignItems: 'center', gap: 14, zIndex: 900,
          boxShadow: isDark ? '0 -4px 24px rgba(0,0,0,0.5)' : '0 -2px 8px rgba(0,0,0,0.08)',
        }}>
          <Download size={22} color={P.sapphire} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{t('download_kasukugames')}</div>
            <div style={{ fontSize: 12, color: P.textMuted }}>{t('play_offline')}</div>
          </div>
          <button onClick={handleInstall} style={{ ...premiumBtn(P.sapphire), padding: '10px 22px', fontSize: 13 }}>{t('download')}</button>
          <button onClick={() => setShowInstall(false)} style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 6 }}><X size={16} /></button>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '64px 4vw 48px', borderTop: `1px solid ${P.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={22} textColor={P.text} mutedColor={P.textMuted} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: P.textMuted }}>{BRAND.sub}</span>
            <a href="https://laetoli.tz" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: P.textDim, display: 'block', marginTop: 2, textDecoration: 'none' }}>by <span style={{ textDecoration: 'underline', textDecorationColor: P.textDim + '40', textUnderlineOffset: 2 }}>{BRAND.by}</span></a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, color: P.textDim, fontVariantNumeric: 'tabular-nums' }}>{GAMES.length} {t('disciplines').toLowerCase()}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: P.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: P.textDim, fontVariantNumeric: 'tabular-nums' }}>{new Set(GAMES.flatMap(g => g.targets)).size} {t('cognitive_targets').toLowerCase()}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: P.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: P.textDim }}>v{BRAND.version}</span>
        </div>
      </footer>

      <FloatingPlayer visible={playerVisible} onToggle={() => setPlayerVisible(false)} theme={theme} />
    </div>
  )
}

/* ================================================================
   HOME SECTION
   ================================================================ */
function HomeSection({ onPlay, P, isDark, gct }: {
  onPlay: (id: string) => void
  P: PaletteType; isDark: boolean; gct: () => CSSProperties
}) {
  const [selectedCat, setSelectedCat] = useState<GameCategory | 'all'>('all')
  const categories = Object.entries(CATEGORY_META) as [GameCategory, typeof CATEGORY_META[GameCategory]][]
  const displayGames = selectedCat === 'all'
    ? GAMES.slice(0, 4)
    : GAMES.filter(g => g.category === selectedCat).slice(0, 4)

  return (
    <section style={{ padding: '100px 4vw 80px', maxWidth: 600, margin: '0 auto' }}>
      {/* Hero */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 64 }}>
        <Logo size={48} style={{ marginBottom: 32 }} textColor={P.text} mutedColor={P.textMuted} />
        <h1 style={{
          margin: 0, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 600,
          color: P.text, letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          What will you play?
        </h1>
      </div>

      {/* Category selector */}
      <select
        value={selectedCat}
        onChange={e => setSelectedCat(e.target.value as GameCategory | 'all')}
        style={{
          width: '100%', backgroundColor: P.card, border: `1px solid ${P.border}`,
          color: P.text, borderRadius: 16, padding: '14px 20px', fontSize: 15,
          outline: 'none', cursor: 'pointer', appearance: 'none',
          WebkitAppearance: 'none', MozAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='${encodeURIComponent(isDark ? '#999' : '#666')}' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
          boxSizing: 'border-box',
        } as CSSProperties}
      >
        <option value="all">All Games</option>
        {categories.map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>

      {/* Game list */}
      <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        {displayGames.map(game => (
          <button
            key={game.id}
            onClick={() => onPlay(game.id)}
            style={{
              ...gct(), padding: '24px 28px', cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 18,
              border: `1px solid ${P.border}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: P.text, marginBottom: 4 }}>
                {game.title}
              </div>
              <div style={{ fontSize: 13, color: P.textMuted, lineHeight: 1.4 }}>
                {game.subtitle}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: P.sapphire, display: 'grid', placeItems: 'center',
              flexShrink: 0,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px ${P.sapphire}30`,
            }}>
              <Gamepad2 size={18} color="#fff" />
            </div>
          </button>
        ))}
      </div>

      {/* Play Now CTA */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <button
          onClick={() => {
            const game = displayGames[0]
            if (game) onPlay(game.id)
          }}
          style={{ ...premiumBtn(P.sapphire), padding: '16px 48px', fontSize: 16 }}
        >
          <Gamepad2 size={18} /> Play Now
        </button>
      </div>
    </section>
  )
}

/* ================================================================
   DAILY SECTION
   ================================================================ */
function DailySection({ profile, onPlay, onLogin, onLuckyDraw, P, isDark, gct }: {
  profile: PlayerProfile | null; onPlay: (id: string) => void; onLogin: () => void; onLuckyDraw: () => void
  P: PaletteType; isDark: boolean; gct: () => CSSProperties
}) {
  const challenges = generateDailyChallenges(Math.floor(Date.now() / 86400000))
  const eng = loadEngagement()

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: SPACING.xl }}>
        <Calendar size={24} color={P.amber} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('daily_challenges')}</h2>
      </div>

      {!profile && (
        <div style={{ ...gct(), marginBottom: 24, padding: '28px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>{t('sign_in_first')}</p>
          <button onClick={onLogin} style={premiumBtn(P.sapphire)}><LogIn size={14} /> {t('sign_in')}</button>
        </div>
      )}

      {profile && (
        <div style={{ ...gct(), padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 16 }}>{t('login_rewards')}</div>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 20, right: 20, height: 2, background: P.border, transform: 'translateY(-50%)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '50%', left: 20, height: 2, background: P.emerald, transform: 'translateY(-50%)', width: `${Math.min(100, (eng.consecutiveLogins / LOGIN_REWARD_SCHEDULE.length) * 100)}%`, maxWidth: 'calc(100% - 40px)', zIndex: 0, transition: `width ${MOTION.med}` }} />
            {LOGIN_REWARD_SCHEDULE.map((r, i) => {
              const collected = eng.consecutiveLogins > i
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: collected ? P.emerald : r.special ? P.gold + '20' : P.surface, border: `2px solid ${collected ? P.emerald : r.special ? P.gold + '50' : P.border}`, display: 'grid', placeItems: 'center', margin: '0 auto 6px', boxShadow: collected ? SHADOW.glow(P.emerald) : r.special ? SHADOW.glow(P.gold) : 'none', transition: `all ${MOTION.med}` }}>
                    {collected ? <Check size={14} color="#fff" /> : <span style={{ fontSize: 10, fontWeight: 600, color: r.special ? P.gold : P.textMuted }}>+{r.tokens}</span>}
                  </div>
                  <div style={{ fontSize: 9, color: collected ? P.emerald : P.textDim, fontWeight: 600 }}>{r.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {profile && (
        <button onClick={onLuckyDraw} style={{
          ...gct(), width: '100%', padding: '22px 26px', marginBottom: 20,
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16,
          border: `1px solid ${P.gold}30`,
          boxShadow: isDark ? `${GLASS.highlight}, ${GLASS.edge}, 0 6px 28px rgba(0,0,0,0.5), 0 0 20px ${P.gold}10` : `0 2px 12px rgba(0,0,0,0.06), 0 0 12px ${P.gold}10`,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: RADIUS.lg, background: P.gold + '18', display: 'grid', placeItems: 'center', boxShadow: SHADOW.glow(P.gold) }}>
            <Gift size={24} color={P.gold} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: P.text }}>{t('lucky_draw')}</div>
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>{t('lucky_draw_desc')}</div>
          </div>
          <Sparkles size={22} color={P.gold} />
        </button>
      )}

      {challenges.map(ch => {
        const game = GAMES.find(g => g.id === ch.gameId)
        return (
          <button key={ch.id} onClick={() => onPlay(ch.gameId)} style={{ ...gct(), display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px', marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 48, height: 48, borderRadius: RADIUS.lg, background: P.amber + '18', display: 'grid', placeItems: 'center' }}><Target size={22} color={P.amber} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{ch.title}</div>
              <div style={{ fontSize: 12, color: P.textMuted, marginTop: 3, lineHeight: 1.4 }}>{ch.description}</div>
              {game && <div style={{ fontSize: 10, color: P.textDim, marginTop: 5 }}>{game.title}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: P.gold }}>+{ch.xpReward}</div>
              <div style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>XP</div>
            </div>
          </button>
        )
      })}

      {profile && (
        <div style={{ ...gct(), padding: '24px 28px', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Flame size={18} color={P.amber} />
            <span style={{ fontSize: 16, fontWeight: 600, color: P.text }}>{t('your_streak')}: {profile.streakDays} {t('days')}</span>
          </div>
          <p style={{ fontSize: 13, color: P.textMuted, margin: 0, lineHeight: 1.5 }}>{t('play_daily_streak')} +{Math.min(profile.streakDays * 5, 50)}%</p>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   LEADERBOARD
   ================================================================ */
function LeaderboardSection({ profile, P, isDark, cs, gct }: { profile: PlayerProfile | null; P: PaletteType; isDark: boolean; cs: CSSProperties; gct: () => CSSProperties }) {
  const [activeBoard, setActiveBoard] = useState('overall')
  const entries = generateDemoLeaderboard(activeBoard)
  const activeMeta = LEADERBOARD_CATEGORIES.find(c => c.id === activeBoard)!

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Trophy size={24} color={P.gold} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('leaderboard')}</h2>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 24, paddingBottom: 4 }}>
        {LEADERBOARD_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveBoard(cat.id)} style={{
            padding: '8px 18px', borderRadius: RADIUS.full,
            background: activeBoard === cat.id ? cat.color : P.card,
            color: activeBoard === cat.id ? '#fff' : P.textMuted,
            border: `1px solid ${activeBoard === cat.id ? cat.color : P.border}`,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: activeBoard === cat.id ? SHADOW.glow(cat.color) : (isDark ? GLASS.highlight : 'none'),
            transition: `all ${MOTION.fast}`,
          }}>{cat.label}</button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>{activeMeta.description}</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}>
        {[entries[1], entries[0], entries[2]].map((e, i) => {
          const pos = [2, 1, 3][i]
          const heights = [100, 140, 80]
          const avatarSizes = [48, 64, 42]
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
              <div style={{ width: avatarSizes[i], height: avatarSizes[i], borderRadius: '50%', background: color.bg, border: `2px solid ${color.border}`, display: 'grid', placeItems: 'center', boxShadow: isChampion ? SHADOW.glow(P.gold) : 'none', marginBottom: 6 }}>
                <span style={{ fontSize: avatarSizes[i] * 0.45 }}>{e.avatar}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, maxWidth: 80 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.displayName}</span>
                {e.muhuri && <VerifiedBadge muhuri={e.muhuri as MuhuriType} size={11} />}
              </div>
              <span style={{ fontSize: 10, color: P.textMuted, fontVariantNumeric: 'tabular-nums' }}>{e.score.toLocaleString()}</span>
              <div style={{ width: avatarSizes[i] + 12, height: heights[i], marginTop: 10, borderRadius: `${RADIUS.md}px ${RADIUS.md}px 0 0`, background: color.bg, border: `1px solid ${color.border}40`, borderBottom: 'none', display: 'grid', placeItems: 'end center', paddingBottom: 10, boxShadow: isChampion ? (isDark ? `${GLASS.highlight}, 0 0 30px ${P.gold}15` : `0 0 20px ${P.gold}10`) : (isDark ? GLASS.highlight : 'none') }}>
                <span style={{ fontSize: 28, fontWeight: 600, color: color.text }}>#{pos}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={cs}>
        {entries.map((e, i) => (
          <div key={e.playerId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < entries.length - 1 ? `1px solid ${P.border}` : 'none', background: profile && e.username === profile.username ? P.sapphire + '10' : 'transparent' }}>
            <span style={{ width: 28, fontSize: 13, fontWeight: 600, color: i < 3 ? [P.gold, '#b0b8c4', '#cd7f32'][i] : P.textDim, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
            <span style={{ fontSize: 20 }}>{e.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{e.displayName}</span>
                {e.muhuri && <VerifiedBadge muhuri={e.muhuri as MuhuriType} size={13} />}
                {e.teamTag && <span style={{ fontSize: 9, fontWeight: 600, color: P.teal, background: P.teal + '15', padding: '2px 8px', borderRadius: RADIUS.full }}>[{e.teamTag}]</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: RANK_META[e.rank as keyof typeof RANK_META]?.color || P.textDim }}>{RANK_META[e.rank as keyof typeof RANK_META]?.label || e.rank}</span>
                <span style={{ fontSize: 10, color: P.textDim }}>Lv.{e.level}</span>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{e.score.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {profile && (
        <div style={{ ...gct(), marginTop: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${P.sapphire}25` }}>
          <span style={{ fontSize: 22 }}>{profile.avatar}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{t('you')}</span>
            <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>{RANK_META[profile.rank].label} · {t('level')} {profile.level}</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: P.sapphire, fontVariantNumeric: 'tabular-nums' }}>{profile.totalScore.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   CONNECTIONS
   ================================================================ */
function ConnectionsSection({ profile, onPlay, onLogin, P, isDark, mo, mc, is, gct }: {
  profile: PlayerProfile | null; onPlay: (id: string) => void; onLogin: () => void
  P: PaletteType; isDark: boolean; mo: CSSProperties; mc: CSSProperties; is: CSSProperties; gct: () => CSSProperties
}) {
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
    const conn = addConnection({ displayName: addName.trim(), username: addName.trim().toLowerCase().replace(/\s+/g, '_'), avatar: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)], relation: addRelation, contactMethod: addMethod, contactValue: addContact.trim(), shareProfilePic: addSharePic })
    setConnections([...connections, conn])
    setShowAdd(false); setAddName(''); setAddContact('')
  }

  const handleRemove = (id: string) => { removeConnection(id); setConnections(connections.filter(c => c.id !== id)) }

  const handleInvite = (conn: Connection, gameType: string, gameName: string) => {
    if (!profile) return
    const url = conn.contactMethod === 'whatsapp' ? generateWhatsAppInvite(profile.displayName, conn, gameType, gameName) : conn.contactMethod === 'instagram' ? generateInstagramInvite(profile.displayName, conn, gameType, gameName) : null
    if (url) window.open(url, '_blank')
    setInviteConn(null)
  }

  if (!profile) {
    return (
      <div style={{ padding: '40px 4vw', maxWidth: 640, textAlign: 'center' }}>
        <Users size={36} color={P.textDim} style={{ marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 10px', ...TYPOGRAPHY.heading, color: P.text }}>{t('your_people')}</h2>
        <p style={{ fontSize: 14, color: P.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>{t('sign_in_login')}</p>
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
        <button onClick={() => setShowAdd(true)} style={{ ...premiumBtn(P.emerald), padding: '10px 20px', fontSize: 13 }}><UserPlus size={14} /> {t('add')}</button>
      </div>

      <div style={{ ...gct(), padding: '24px 26px', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: P.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PartyPopper size={18} color={P.fuchsia} /> {t('party_games')}
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {PARTY_GAMES.map(g => (
            <button key={g.id} onClick={() => onPlay(g.id)} style={{ ...gct(), padding: '16px 20px', minWidth: 160, cursor: 'pointer', textAlign: 'left', flexShrink: 0, border: `1px solid ${g.color}25` }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{g.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{g.name}</div>
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 3 }}>{g.minPlayers}-{g.maxPlayers} {t('players')}</div>
            </button>
          ))}
        </div>
      </div>

      {connections.length === 0 ? (
        <div style={{ ...gct(), padding: '56px 28px', textAlign: 'center' }}>
          <Heart size={36} color={P.textDim} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: P.text, margin: '0 0 6px' }}>{t('no_people_yet')}</p>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>{t('add_loved_ones')}</p>
          <button onClick={() => setShowAdd(true)} style={premiumBtn(P.emerald)}><UserPlus size={14} /> {t('add_first_person')}</button>
        </div>
      ) : relationGroups.map(group => {
        const groupConns = connections.filter(c => group.types.includes(c.relation))
        if (groupConns.length === 0) return null
        return (
          <div key={group.key} style={{ marginBottom: 24 }}>
            <div style={{ ...TYPOGRAPHY.caption, color: P.textMuted, marginBottom: 10 }}>{group.label}</div>
            {groupConns.map(conn => {
              const meta = RELATION_META[conn.relation]
              return (
                <div key={conn.id} style={{ ...gct(), padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 26 }}>{conn.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{conn.displayName}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: meta.color, background: meta.color + '15', padding: '3px 10px', borderRadius: RADIUS.full }}>{meta.emoji} {meta.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: P.textDim, marginTop: 3 }}>
                      {conn.gamesPlayed > 0 ? `${conn.gamesPlayed} ${t('games_played').toLowerCase()} · ${conn.wins}W-${conn.losses}L` : t('not_played_yet')}
                      {conn.contactMethod === 'whatsapp' && ' · WhatsApp'}
                      {conn.contactMethod === 'instagram' && ' · Instagram'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setInviteConn(conn)} style={{ background: meta.color, border: 'none', borderRadius: RADIUS.full, width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px ${meta.color}30` }}><Send size={14} color="#fff" /></button>
                    <button onClick={() => handleRemove(conn.id)} style={{ background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full, width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Trash2 size={14} color={P.textDim} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {showAdd && (
        <div style={mo} onClick={() => setShowAdd(false)}>
          <div style={{ ...mc, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', ...TYPOGRAPHY.subheading, color: P.text }}>{t('add_person')}</h3>
            <input value={addName} onChange={e => setAddName(e.target.value)} placeholder={t('their_name')} style={is} autoFocus />
            <div style={{ marginTop: 18, marginBottom: 8, ...TYPOGRAPHY.caption, color: P.textMuted }}>{t('relationship')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {(Object.entries(RELATION_META) as [RelationType, typeof RELATION_META[RelationType]][]).map(([key, meta]) => (
                <button key={key} onClick={() => setAddRelation(key)} style={{ padding: '6px 14px', borderRadius: RADIUS.full, fontSize: 11, fontWeight: 600, background: addRelation === key ? meta.color : P.surface, color: addRelation === key ? '#fff' : P.textMuted, border: `1px solid ${addRelation === key ? meta.color : P.border}`, cursor: 'pointer', boxShadow: addRelation === key ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none' }}>{meta.emoji} {meta.label}</button>
              ))}
            </div>
            <div style={{ marginBottom: 8, ...TYPOGRAPHY.caption, color: P.textMuted }}>{t('contact_method')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['username', t('username')]] as const).map(([m, label]) => (
                <button key={m} onClick={() => setAddMethod(m)} style={{ flex: 1, padding: '10px', borderRadius: RADIUS.md, fontSize: 12, fontWeight: 600, background: addMethod === m ? P.sapphire : P.surface, color: addMethod === m ? '#fff' : P.textMuted, border: `1px solid ${addMethod === m ? P.sapphire : P.border}`, cursor: 'pointer', boxShadow: addMethod === m ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none' }}>{label}</button>
              ))}
            </div>
            <input value={addContact} onChange={e => setAddContact(e.target.value)} placeholder={addMethod === 'whatsapp' ? '+255 7XX XXX XXX' : addMethod === 'instagram' ? '@username' : 'username'} style={is} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={addSharePic} onChange={e => setAddSharePic(e.target.checked)} />
              <span style={{ fontSize: 12, color: P.textMuted }}>{t('share_photo')}</span>
            </label>
            <button onClick={handleAdd} style={{ ...premiumBtn(P.emerald), width: '100%', justifyContent: 'center', marginTop: 20 }}><UserPlus size={14} /> {t('add')}</button>
          </div>
        </div>
      )}

      {inviteConn && (
        <div style={mo} onClick={() => setInviteConn(null)}>
          <div style={{ ...mc, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{inviteConn.avatar}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: P.text }}>{inviteConn.displayName}</div>
                <div style={{ fontSize: 12, color: RELATION_META[inviteConn.relation].color }}>{RELATION_META[inviteConn.relation].emoji} {RELATION_META[inviteConn.relation].label}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: P.textMuted, marginBottom: 12 }}>{t('choose_game_invite')}</div>
            {PARTY_GAMES.map(g => (
              <button key={g.id} onClick={() => handleInvite(inviteConn, g.id, g.name)} style={{ ...gct(), width: '100%', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24 }}>{g.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{g.name}</div><div style={{ fontSize: 11, color: P.textMuted }}>{g.description}</div></div>
                <Send size={14} color={g.color} />
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 14, marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: P.textMuted, marginBottom: 10 }}>{t('or_challenge_any')}</div>
              {GAMES.filter(g => g.category !== 'party').slice(0, 6).map(g => (
                <button key={g.id} onClick={() => handleInvite(inviteConn, 'challenge', g.title)} style={{ background: 'none', border: `1px solid ${P.border}`, borderRadius: RADIUS.full, padding: '7px 16px', fontSize: 11, fontWeight: 600, color: P.textMuted, cursor: 'pointer', marginRight: 8, marginBottom: 8, boxShadow: isDark ? GLASS.highlight : 'none' }}>{g.title}</button>
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
function ShopSection({ wallet, setWallet, P, isDark, cs, gct }: { wallet: TokenWallet; setWallet: (w: TokenWallet) => void; P: PaletteType; isDark: boolean; cs: CSSProperties; gct: () => CSSProperties }) {
  const [tab, setTab] = useState<'shop' | 'packs' | 'history'>('shop')
  const purchased = JSON.parse(localStorage.getItem('kg_purchases') || '[]') as string[]

  const handleBuy = (item: typeof SHOP[0]) => {
    if (item.oneTime && purchased.includes(item.id)) return
    const w = spendTokens(item.price, item.name)
    if (!w) return
    setWallet(w)
    if (item.oneTime) { localStorage.setItem('kg_purchases', JSON.stringify([...purchased, item.id])) }
  }

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <ShoppingBag size={24} color={P.violet} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('shop')}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Coins size={18} color={P.gold} />
        <span style={{ fontSize: 22, fontWeight: 600, color: P.gold, fontVariantNumeric: 'tabular-nums' }}>{wallet.balance.toLocaleString()}</span>
        <span style={{ fontSize: 13, color: P.textMuted }}>{t('tokens')}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([['shop', t('items')], ['packs', t('buy_tokens')], ['history', t('history')]] as const).map(([tabKey, label]) => (
          <button key={tabKey} onClick={() => setTab(tabKey as 'shop' | 'packs' | 'history')} style={{ padding: '8px 20px', borderRadius: RADIUS.full, background: tab === tabKey ? P.violet : P.card, color: tab === tabKey ? '#fff' : P.textMuted, border: `1px solid ${tab === tabKey ? P.violet : P.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: tab === tabKey ? SHADOW.glow(P.violet) : (isDark ? GLASS.highlight : 'none'), transition: `all ${MOTION.fast}` }}>{label}</button>
        ))}
      </div>

      {tab === 'shop' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {SHOP.map(item => {
            const owned = item.oneTime && purchased.includes(item.id)
            const canAfford = wallet.balance >= item.price
            return (
              <div key={item.id} style={{ ...gct(), padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: RADIUS.lg, background: item.color + '18', display: 'grid', placeItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'heart' ? '❤️' : item.icon === 'clock' ? '⏱️' : item.icon === 'lightbulb' ? '💡' : item.icon === 'flame' ? '🔥' : item.icon === 'gem' ? '💎' : item.icon === 'crown' ? '👑' : item.icon === 'sparkles' ? '✨' : '🏳️'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>{item.description}</div>
                </div>
                <button onClick={() => handleBuy(item)} disabled={owned || !canAfford} style={{ padding: '8px 18px', borderRadius: RADIUS.full, background: owned ? P.emerald + '20' : canAfford ? item.color : P.surface, color: owned ? P.emerald : canAfford ? '#fff' : P.textDim, border: 'none', fontSize: 12, fontWeight: 600, cursor: owned || !canAfford ? 'default' : 'pointer', opacity: !canAfford && !owned ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5, boxShadow: canAfford && !owned ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px ${item.color}30` : 'none' }}>
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
            <button key={pack.id} onClick={() => { const w = purchaseTokens(pack.tokens, pack.label); setWallet(w) }} style={{ ...gct(), padding: '24px 20px', textAlign: 'center', cursor: 'pointer', border: pack.label === 'Best Value' ? `2px solid ${P.gold}50` : `1px solid ${P.border}`, boxShadow: pack.label === 'Best Value' ? (isDark ? `${GLASS.highlight}, ${SHADOW.glow(P.gold)}` : `0 2px 12px rgba(0,0,0,0.06), ${SHADOW.glow(P.gold)}`) : (isDark ? `${GLASS.highlight}, ${SHADOW.md}` : '0 1px 6px rgba(0,0,0,0.06)') }}>
              {pack.label === 'Best Value' && <div style={{ ...TYPOGRAPHY.caption, color: P.gold, marginBottom: 10 }}>{t('best_value')}</div>}
              <Coins size={28} color={P.gold} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 26, fontWeight: 600, color: P.text }}>{pack.tokens.toLocaleString()}</div>
              {pack.bonus > 0 && <div style={{ fontSize: 11, color: P.emerald, fontWeight: 600, marginTop: 2 }}>+{pack.bonus} bonus</div>}
              <div style={{ fontSize: 14, fontWeight: 600, color: P.gold, marginTop: 10 }}>TSh {pack.price.toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div style={cs}>
          {wallet.transactions.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}><p style={{ fontSize: 13, color: P.textDim }}>{t('no_transactions')}</p></div>
          ) : wallet.transactions.slice(0, 30).map(tx => (
            <div key={tx.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${P.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: tx.type === 'earn' ? P.emerald + '18' : tx.type === 'purchase' ? P.gold + '18' : P.rose + '18' }}>
                {tx.type === 'earn' ? <TrendingUp size={13} color={P.emerald} /> : tx.type === 'purchase' ? <Coins size={13} color={P.gold} /> : <ShoppingBag size={13} color={P.rose} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: P.text }}>{tx.reason}</div>
                <div style={{ fontSize: 10, color: P.textDim }}>{new Date(tx.timestamp).toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'spend' ? P.rose : P.emerald, fontVariantNumeric: 'tabular-nums' }}>{tx.type === 'spend' ? '-' : '+'}{tx.amount}</span>
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
function NotificationsSection({ P, cs, gct }: { P: PaletteType; cs: CSSProperties; gct: () => CSSProperties }) {
  const notifs = loadNotifications()
  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: SPACING.xl }}>
        <Bell size={24} color={P.sapphire} />
        <h2 style={{ margin: 0, ...TYPOGRAPHY.heading, color: P.text }}>{t('notifications')}</h2>
      </div>
      {notifs.length === 0 ? (
        <div style={{ ...gct(), padding: '56px 28px', textAlign: 'center' }}>
          <Bell size={36} color={P.textDim} style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: P.textDim }}>{t('no_notifications')}</p>
        </div>
      ) : (
        <div style={cs}>
          {notifs.map(n => (
            <div key={n.id} style={{ padding: '16px 22px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${P.border}`, background: n.read ? 'transparent' : P.sapphire + '08' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: (n.color || P.sapphire) + '18', display: 'grid', placeItems: 'center' }}>
                {n.type === 'record_broken' ? <Trophy size={18} color={n.color || P.gold} /> : n.type === 'achievement' ? <Award size={18} color={n.color || P.violet} /> : n.type === 'reward' ? <Gift size={18} color={n.color || P.emerald} /> : n.type === 'milestone' ? <Star size={18} color={n.color || P.gold} /> : <Bell size={18} color={n.color || P.sapphire} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{n.title}</div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: P.textDim, marginTop: 5 }}>{new Date(n.timestamp).toLocaleDateString()} {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
function ProfileSection({ profile, setProfile, wallet, P, isDark, lang, theme, onLangToggle, onThemeToggle, gct }: {
  profile: PlayerProfile; setProfile: (p: PlayerProfile | null) => void; wallet?: TokenWallet
  P: PaletteType; isDark: boolean; lang: Lang; theme: Theme; onLangToggle: () => void; onThemeToggle: () => void; gct: () => CSSProperties
}) {
  const earnedBadges = BADGES.filter(b => profile.badges.includes(b.id))
  const unearnedBadges = BADGES.filter(b => !profile.badges.includes(b.id))
  const [adminUser, setAdminUser] = useState('')
  const [adminTier, setAdminTier] = useState<MuhuriType>('verified')
  const [adminAssignments, setAdminAssignments] = useState<Record<string, MuhuriType>>(getAllMuhuriAssignments)
  const showAdmin = isFounderOrAdmin(profile.muhuri)
  const rankColor = RANK_META[profile.rank].color

  return (
    <div style={{ padding: '40px 4vw', maxWidth: 640 }}>
      <div style={{ ...gct(), padding: '36px 32px', textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'visible' }}>
        {isDark && <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 120, height: 60, borderRadius: '50%', ...heroGlow(rankColor), pointerEvents: 'none' }} />}
        <div style={{ fontSize: 72, marginBottom: 10, position: 'relative', filter: isDark ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' : 'none' }}>{profile.avatar}</div>
        <h2 style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.1, color: P.text }}>{profile.displayName}</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 16px' }}>
          <span style={{ fontSize: 14, color: P.textMuted }}>@{profile.username}</span>
          <VerifiedBadge muhuri={profile.muhuri} size={18} />
          {isVerifiedTier(profile.muhuri) && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: MUHURI_META[profile.muhuri].color,
              background: MUHURI_META[profile.muhuri].color + '12',
              padding: '3px 10px', borderRadius: RADIUS.full,
            }}>{MUHURI_META[profile.muhuri].label}</span>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: RADIUS.full, background: rankColor + '18', border: `1px solid ${rankColor}30`, boxShadow: SHADOW.glow(rankColor) }}>
          <Crown size={16} color={rankColor} />
          <span style={{ fontSize: 15, fontWeight: 600, color: rankColor }}>{RANK_META[profile.rank].label}</span>
          <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 600 }}>{t('level')} {profile.level}</span>
        </div>
        <div style={{ marginTop: 20, maxWidth: 360, margin: '20px auto 0' }}><XPBar xp={profile.xp} large P={P} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<BarChart3 size={18} />} color={P.sapphire} label={t('total_xp')} value={profile.xp.toLocaleString()} P={P} gct={gct} />
        <StatCard icon={<Coins size={18} />} color={P.gold} label={t('tokens')} value={wallet?.balance.toLocaleString() || '0'} P={P} gct={gct} />
        <StatCard icon={<Gamepad2 size={18} />} color={P.emerald} label={t('games_played')} value={profile.totalGames.toString()} P={P} gct={gct} />
        <StatCard icon={<Flame size={18} />} color={P.amber} label={t('streak')} value={`${profile.streakDays} ${t('days')}`} P={P} gct={gct} />
        <StatCard icon={<Trophy size={18} />} color={P.gold} label={t('total_score')} value={profile.totalScore.toLocaleString()} P={P} gct={gct} />
        <StatCard icon={<TrendingUp size={18} />} color={P.teal} label={t('longest_streak')} value={`${profile.longestStreak} ${t('days')}`} P={P} gct={gct} />
        <StatCard icon={<Award size={18} />} color={P.violet} label={t('badges')} value={earnedBadges.length.toString()} P={P} gct={gct} />
      </div>

      {/* Settings */}
      <div style={{ ...gct(), padding: '28px 32px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600, color: P.text }}>{t('settings')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Globe size={16} color={P.textMuted} /><span style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{t('language')}</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['en', 'sw'] as const).map(l => (
              <button key={l} onClick={() => { saveLang(l); onLangToggle() }} style={{ padding: '6px 16px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, background: lang === l ? P.sapphire : P.surface, color: lang === l ? '#fff' : P.textMuted, border: `1px solid ${lang === l ? P.sapphire : P.border}`, cursor: 'pointer', textTransform: 'uppercase' }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{isDark ? <Moon size={16} color={P.textMuted} /> : <Sun size={16} color={P.textMuted} />}<span style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{t('theme')}</span></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { if (theme !== 'light') onThemeToggle() }} style={{ padding: '6px 16px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, background: theme === 'light' ? P.sapphire : P.surface, color: theme === 'light' ? '#fff' : P.textMuted, border: `1px solid ${theme === 'light' ? P.sapphire : P.border}`, cursor: 'pointer' }}>{t('light')}</button>
            <button onClick={() => { if (theme !== 'dark') onThemeToggle() }} style={{ padding: '6px 16px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, background: theme === 'dark' ? P.sapphire : P.surface, color: theme === 'dark' ? '#fff' : P.textMuted, border: `1px solid ${theme === 'dark' ? P.sapphire : P.border}`, cursor: 'pointer' }}>{t('dark')}</button>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ ...gct(), padding: '24px 26px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}><Award size={18} color={P.violet} /> {t('badges')}</h3>
        {earnedBadges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {earnedBadges.map(b => (
              <div key={b.id} style={{ padding: '10px 16px', borderRadius: RADIUS.md, background: b.color + '15', border: `1px solid ${b.color}25`, display: 'flex', alignItems: 'center', gap: 8, boxShadow: isDark ? GLASS.highlight : 'none' }}>
                <Star size={13} color={b.color} />
                <div><div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.name}</div><div style={{ fontSize: 10, color: P.textMuted }}>{b.description}</div></div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {unearnedBadges.slice(0, 8).map(b => (
            <div key={b.id} style={{ padding: '8px 14px', borderRadius: RADIUS.md, background: P.surface, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
              <Star size={11} color={P.textDim} />
              <div><div style={{ fontSize: 11, fontWeight: 600, color: P.textDim }}>{b.name}</div><div style={{ fontSize: 9, color: P.textDim }}>{b.requirement}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin — Muhuri Assignment */}
      {showAdmin && (
        <div style={{ ...gct(), padding: '24px 26px', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={18} color={MUHURI_META.admin.sealColor} /> Verification Admin
          </h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={adminUser}
              onChange={e => setAdminUser(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              style={{ flex: 1, padding: '10px 14px', borderRadius: RADIUS.md, border: `1px solid ${P.border}`, background: P.surface, color: P.text, fontSize: 13, fontWeight: 600, outline: 'none' }}
            />
            <select
              value={adminTier}
              onChange={e => setAdminTier(e.target.value as MuhuriType)}
              style={{ padding: '10px 14px', borderRadius: RADIUS.md, border: `1px solid ${P.border}`, background: P.surface, color: P.text, fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="verified">Verified</option>
              <option value="creator">Creator</option>
              {profile.muhuri === 'founder' && <option value="admin">Admin</option>}
            </select>
            <button
              onClick={() => {
                if (!adminUser.trim()) return
                setMuhuri(adminUser.trim(), adminTier)
                setAdminAssignments(getAllMuhuriAssignments())
                setAdminUser('')
              }}
              style={{ ...premiumBtn(MUHURI_META[adminTier].sealColor), fontSize: 13, padding: '10px 18px', whiteSpace: 'nowrap' }}
            >
              <Check size={14} /> Assign
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(adminAssignments).map(([user, tier]) => (
              <div key={user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: RADIUS.md, background: P.surface, border: `1px solid ${P.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <VerifiedBadge muhuri={tier} size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>@{user}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUHURI_META[tier].color, background: MUHURI_META[tier].color + '12', padding: '2px 8px', borderRadius: RADIUS.full }}>{MUHURI_META[tier].label}</span>
                </div>
                {tier !== 'founder' && (
                  <button
                    onClick={() => { setMuhuri(user, 'player'); setAdminAssignments(getAllMuhuriAssignments()) }}
                    style={{ background: 'none', border: 'none', color: P.textDim, cursor: 'pointer', padding: 4 }}
                  ><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      <div style={{ ...gct(), padding: '24px 26px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color={P.teal} /> {t('teams_friends')}</h3>
        {profile.teamId ? <div style={{ fontSize: 13, color: P.textMuted }}>Team member</div> : (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 14px' }}>{t('no_team_yet')}</p>
            <button style={{ ...premiumBtn(P.teal), fontSize: 13, padding: '10px 24px' }}><Users size={14} /> {t('create_team')}</button>
          </div>
        )}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${P.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: P.textMuted }}>{t('friends_count')} ({profile.friendIds.length})</span>
            <button style={{ background: 'none', border: 'none', color: P.sapphire, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ {t('add')}</button>
          </div>
          {profile.friendIds.length === 0 && <p style={{ fontSize: 12, color: P.textDim, margin: 0, lineHeight: 1.5 }}>{t('share_link')}</p>}
        </div>
        {profile.coupledWith === null && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${P.border}`, textAlign: 'center' }}>
            <Heart size={18} color={P.rose} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: P.textMuted, margin: '0 0 10px' }}>{t('couple_challenge')}</p>
            <button style={{ background: 'none', border: `1px solid ${P.rose}40`, color: P.rose, borderRadius: RADIUS.full, padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: isDark ? GLASS.highlight : 'none' }}><Heart size={13} /> {t('connect')}</button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
        <a href="https://laetoli.tz" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: P.textDim, fontWeight: 600, textDecoration: 'none' }}>Built by <span style={{ textDecoration: 'underline', textDecorationColor: P.textDim + '40', textUnderlineOffset: 2 }}>Laetoli</span></a>
      </div>

      <button onClick={() => { localStorage.removeItem('kg_profile'); setProfile(null) }} style={{ background: 'none', border: `1px solid ${P.border}`, color: P.textDim, borderRadius: RADIUS.lg, padding: '12px 24px', fontSize: 13, cursor: 'pointer', width: '100%', boxShadow: isDark ? GLASS.highlight : 'none' }}>{t('logout')}</button>
    </div>
  )
}

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */
function XPBar({ xp, large, P }: { xp: number; large?: boolean; P: PaletteType }) {
  const { current, needed, progress } = xpToNextLevel(xp)
  const h = large ? 10 : 5
  return (
    <div>
      <div style={{ height: h, background: P.border, borderRadius: h, overflow: 'hidden', marginTop: large ? 10 : 4, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: P.sapphire, borderRadius: h, transition: `width ${MOTION.med}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px ${P.sapphire}40` }} />
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

function StatCard({ icon, color, label, value, P, gct }: { icon: React.ReactNode; color: string; label: string; value: string; P: PaletteType; gct: () => CSSProperties }) {
  return (
    <div style={{ ...gct(), padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: color + '15', display: 'grid', placeItems: 'center', color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: 11, color: P.textMuted }}>{label}</div>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick, accent, P, style: btnStyle }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; accent?: string; P: PaletteType; style: CSSProperties }) {
  return (
    <button onClick={onClick} style={{ ...btnStyle, color: accent || (active ? P.text : P.textMuted), background: active && !accent ? P.sapphire + '15' : 'none', borderRadius: RADIUS.md }}>
      {icon}
      {label && <span className="nav-label" style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>}
    </button>
  )
}

function MobileTab({ icon, label, active, onClick, P }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; P: PaletteType }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      color: active ? P.sapphire : P.textMuted,
      transition: `color ${MOTION.fast}`,
      minWidth: 56,
      position: 'relative',
    }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
      {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: P.sapphire, position: 'absolute', bottom: -2, boxShadow: `0 0 6px ${P.sapphire}60` }} />}
    </button>
  )
}

function LoadingView({ P }: { P: PaletteType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, background: P.bg }}>
      <Brain size={32} color={P.sapphire} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <span style={{ color: P.textMuted, fontSize: 14, fontWeight: 600 }}>{t('loading')}</span>
    </div>
  )
}
