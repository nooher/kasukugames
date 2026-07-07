import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Repeat, Shuffle, ChevronDown, ChevronUp, Music, X,
  BookOpen, Waves, FolderOpen, List, Gamepad2, Brain, SlidersHorizontal,
} from 'lucide-react'
import { RADIUS, MOTION } from '../lib/design'
import { getPalette, type Theme } from '../lib/theme'
import {
  BUILT_IN_TRACKS, formatTime, getLocalTracks, addLocalTrack,
  type AudioTrack, type AudioCategory, type PlayerState, initialPlayerState,
} from '../lib/audio'
import { createMusicEngine, type MusicEngine } from '../lib/music-engine'
import { t } from '../lib/i18n'

interface Props {
  visible: boolean
  onToggle: () => void
  theme?: Theme
}

export default function FloatingPlayer({ visible, onToggle, theme = 'dark' }: Props) {
  const P = getPalette(theme)
  const isDark = theme === 'dark'

  const [state, setState] = useState<PlayerState>(initialPlayerState)
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'queue' | 'library' | 'sound'>('library')
  const [cat, setCat] = useState<'all' | AudioCategory>('all')
  const [eq, setEq] = useState({ low: 0, mid: 0, high: 0 })
  const [reverb, setReverbAmt] = useState(0)
  const [rate, setRate] = useState(1)
  const [preset, setPreset] = useState('Flat')
  const [dragPos, setDragPos] = useState({ x: 20, y: -1 })
  const [dragging, setDragging] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const engineRef = useRef<MusicEngine | null>(null)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const rafRef = useRef(0)
  const timerRef = useRef(0)
  const startTimeRef = useRef(0)

  if (!engineRef.current) engineRef.current = createMusicEngine()

  useEffect(() => {
    if (dragPos.y === -1) {
      setDragPos(p => ({ ...p, y: window.innerHeight - 90 }))
    }
  }, [dragPos.y])

  // Live EQ / reverb / playback-speed — "change how you hear the music".
  useEffect(() => { engineRef.current?.setEQ(eq.low, eq.mid, eq.high) }, [eq])
  useEffect(() => { engineRef.current?.setReverb(reverb) }, [reverb])
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate }, [rate, state.track?.id])

  const allTracks = [...BUILT_IN_TRACKS, ...getLocalTracks()]

  const isGenerative = (track: AudioTrack) => !track.src

  const playTrack = useCallback((track: AudioTrack, queue?: AudioTrack[]) => {
    const q = queue || allTracks
    const idx = q.findIndex(t => t.id === track.id)
    const dur = engineRef.current?.getDuration(track.id) || 300

    if (isGenerative(track)) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      engineRef.current?.play(track.id, state.volume)
      startTimeRef.current = Date.now()
      setState(s => ({ ...s, track, playing: true, queue: q, queueIndex: idx, currentTime: 0, duration: dur }))
    } else {
      engineRef.current?.stop()
      setState(s => ({ ...s, track, playing: true, queue: q, queueIndex: idx, currentTime: 0 }))
      if (track.src && audioRef.current) {
        engineRef.current?.connectElement(audioRef.current)
        audioRef.current.src = track.src
        audioRef.current.volume = state.volume
        audioRef.current.playbackRate = rate
        audioRef.current.play().catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.volume])

  const nextTrack = useCallback(() => {
    setState(prev => {
      const { queue, queueIndex, shuffle } = prev
      if (queue.length === 0) return prev
      const next = shuffle ? Math.floor(Math.random() * queue.length) : (queueIndex + 1) % queue.length
      const track = queue[next]
      const dur = engineRef.current?.getDuration(track.id) || 300

      if (isGenerative(track)) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
        engineRef.current?.play(track.id, prev.volume)
        startTimeRef.current = Date.now()
        return { ...prev, track, playing: true, queueIndex: next, currentTime: 0, duration: dur }
      } else {
        engineRef.current?.stop()
        if (track.src && audioRef.current) {
          engineRef.current?.connectElement(audioRef.current)
          audioRef.current.src = track.src
          audioRef.current.volume = prev.volume
          audioRef.current.playbackRate = rate
          audioRef.current.play().catch(() => {})
        }
        return { ...prev, track, playing: true, queueIndex: next, currentTime: 0 }
      }
    })
  }, [])

  useEffect(() => {
    window.clearInterval(timerRef.current)
    if (state.playing && state.track && isGenerative(state.track)) {
      const trackId = state.track.id
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const dur = engineRef.current?.getDuration(trackId) || 300
        if (elapsed >= dur) {
          nextTrack()
          return
        }
        setState(s => ({ ...s, currentTime: elapsed, duration: dur }))
      }, 250)
    }
    return () => window.clearInterval(timerRef.current)
  }, [state.playing, state.track?.id, nextTrack])

  const togglePlay = () => {
    if (!state.track) return
    if (isGenerative(state.track)) {
      if (state.playing) {
        engineRef.current?.pause()
      } else {
        engineRef.current?.resume()
        startTimeRef.current = Date.now() - state.currentTime * 1000
      }
    } else {
      if (audioRef.current) {
        if (state.playing) audioRef.current.pause()
        else audioRef.current.play().catch(() => {})
      }
    }
    setState(s => ({ ...s, playing: !s.playing }))
  }

  const prevTrack = () => {
    const { queue, queueIndex } = state
    if (queue.length === 0) return
    const prev = (queueIndex - 1 + queue.length) % queue.length
    playTrack(queue[prev], queue)
  }

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setState(s => ({
        ...s,
        currentTime: audioRef.current!.currentTime,
        duration: audioRef.current!.duration || 0,
      }))
    }
  }

  const onEnded = () => {
    if (state.repeat && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } else {
      nextTrack()
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = pct * state.duration
    if (state.track && isGenerative(state.track)) {
      startTimeRef.current = Date.now() - time * 1000
      setState(s => ({ ...s, currentTime: time }))
    } else if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const setVolume = (v: number) => {
    setState(s => ({ ...s, volume: v }))
    if (state.track && isGenerative(state.track)) {
      engineRef.current?.setVolume(v)
    } else if (audioRef.current) {
      audioRef.current.volume = v
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const track: AudioTrack = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local',
        category: 'music',
        src: url,
      }
      addLocalTrack(track)
      playTrack(track)
    }
  }

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, px: dragPos.x, py: dragPos.y }
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const dx = clientX - dragStart.current.x
      const dy = clientY - dragStart.current.y
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setDragPos({
          x: Math.max(0, Math.min(window.innerWidth - 320, dragStart.current.px + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 80, dragStart.current.py + dy)),
        })
      })
    }
    const onUp = () => {
      setDragging(false)
      cancelAnimationFrame(rafRef.current)
    }
    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  const iconBtn: CSSProperties = useMemo(() => ({
    background: 'none',
    border: 'none',
    color: P.textMuted,
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  }), [P.textMuted])

  const playBtnStyle: CSSProperties = useMemo(() => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: P.amber,
    color: isDark ? '#000' : '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 2px 12px ${P.amber}50`,
  }), [P.amber, isDark])

  if (!visible) return null

  const pct = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
  const catIcon = (c: AudioCategory) => {
    switch (c) {
      case 'quran': case 'bible': return <BookOpen size={12} />
      case 'soundbath': return <Waves size={12} />
      case 'gaming': return <Gamepad2 size={12} />
      case 'brainmassage': return <Brain size={12} />
      default: return <Music size={12} />
    }
  }
  const catColor = (c: AudioCategory) => {
    switch (c) {
      case 'quran': return P.emerald
      case 'bible': return P.sapphire
      case 'soundbath': return P.violet
      case 'ambient': return P.teal
      case 'gaming': return P.fuchsia
      case 'brainmassage': return P.cyan
      default: return P.amber
    }
  }
  // Category filter chips (label + which category they select)
  const CATS: { key: 'all' | AudioCategory; label: string }[] = [
    { key: 'all', label: t('all') },
    { key: 'music', label: t('local_audio') },
    { key: 'soundbath', label: t('sound_bath') },
    { key: 'quran', label: 'Quran' },
    { key: 'bible', label: 'Bible' },
    { key: 'gaming', label: t('gaming_music') },
    { key: 'brainmassage', label: t('brain_massage') },
    { key: 'ambient', label: t('ambient') },
  ]
  const shownTracks = cat === 'all' ? allTracks : allTracks.filter(tr => tr.category === cat)
  const PRESETS: { name: string; eq: [number, number, number]; rev: number }[] = [
    { name: 'Flat', eq: [0, 0, 0], rev: 0 },
    { name: 'Bass', eq: [7, 1, -1], rev: 0.05 },
    { name: 'Vocal', eq: [-2, 4, 2], rev: 0.1 },
    { name: 'Focus', eq: [-3, 2, 4], rev: 0 },
    { name: 'Chill', eq: [3, 0, 2], rev: 0.35 },
    { name: 'Gaming', eq: [5, 2, 4], rev: 0.15 },
    { name: 'Night', eq: [2, -2, -4], rev: 0.2 },
  ]
  const applyPreset = (p: typeof PRESETS[number]) => {
    setPreset(p.name)
    setEq({ low: p.eq[0], mid: p.eq[1], high: p.eq[2] })
    setReverbAmt(p.rev)
  }

  return (
    <>
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
      <div
        style={{
          position: 'fixed',
          left: dragPos.x,
          top: dragPos.y,
          zIndex: 9999,
          width: expanded ? 320 : 300,
          background: P.card,
          border: `1px solid ${P.border}`,
          borderRadius: RADIUS.lg,
          boxShadow: isDark
            ? '0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 8px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
          overflow: 'hidden',
          willChange: dragging ? 'left, top' : 'auto',
          transition: dragging ? 'none' : `width ${MOTION.med}`,
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          style={{
            padding: '8px 12px 6px',
            cursor: dragging ? 'grabbing' : 'grab',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Music size={14} color={P.amber} />
            <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 600 }}>KasukuPlayer</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setExpanded(e => !e)} style={iconBtn}>
              {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button onClick={onToggle} style={iconBtn}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Now playing */}
        <div style={{ padding: '4px 14px 10px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {state.track?.title || t('no_track')}
          </div>
          <div style={{ fontSize: 11, color: P.textMuted }}>
            {state.track?.artist || t('select_from_library')}
          </div>
        </div>

        {/* Progress bar */}
        <div
          onClick={seek}
          style={{ height: 4, background: P.border, cursor: 'pointer', margin: '0 14px', borderRadius: 2 }}
        >
          <div style={{ height: '100%', width: `${pct}%`, background: P.amber, borderRadius: 2, transition: 'width 0.3s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 14px 0', fontSize: 10, color: P.textDim }}>
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 14px 10px' }}>
          <button onClick={() => setState(s => ({ ...s, shuffle: !s.shuffle }))} style={{ ...iconBtn, color: state.shuffle ? P.amber : P.textMuted }}>
            <Shuffle size={14} />
          </button>
          <button onClick={prevTrack} style={iconBtn}><SkipBack size={16} /></button>
          <button onClick={togglePlay} style={playBtnStyle}>
            {state.playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>
          <button onClick={nextTrack} style={iconBtn}><SkipForward size={16} /></button>
          <button onClick={() => setState(s => ({ ...s, repeat: !s.repeat }))} style={{ ...iconBtn, color: state.repeat ? P.amber : P.textMuted }}>
            <Repeat size={14} />
          </button>
          <button onClick={() => setVolume(state.volume > 0 ? 0 : 0.8)} style={iconBtn}>
            {state.volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        {/* Expanded: library/queue */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {([['library', t('library')], ['queue', t('queue')], ['sound', t('sound')]] as const).map(([tb, label]) => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'none', border: 'none',
                    borderBottom: `2px solid ${tab === tb ? P.amber : 'transparent'}`,
                    color: tab === tb ? P.text : P.textMuted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  {tb === 'sound' && <SlidersHorizontal size={12} />}{label}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: 264, overflowY: 'auto', padding: '8px 0' }}>
              {tab === 'library' && (
                <>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 14px 8px', scrollbarWidth: 'none' }}>
                    {CATS.map(c => (
                      <button key={c.key} onClick={() => setCat(c.key)} style={{
                        flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: cat === c.key ? P.amber : 'transparent',
                        color: cat === c.key ? (isDark ? '#000' : '#fff') : P.textMuted,
                        border: `1px solid ${cat === c.key ? P.amber : P.border}`,
                      }}>{c.label}</button>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', cursor: 'pointer', color: P.amber, fontSize: 12, fontWeight: 600 }}>
                    <FolderOpen size={14} /> {t('play_local_audio')}
                    <input type="file" accept="audio/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  {shownTracks.length === 0 && (
                    <div style={{ padding: '16px 14px', textAlign: 'center', color: P.textDim, fontSize: 11 }}>{t('no_track')}</div>
                  )}
                  {shownTracks.map(tr => (
                    <button
                      key={tr.id}
                      onClick={() => playTrack(tr)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 14px', background: state.track?.id === tr.id ? P.surface : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: 6, background: catColor(tr.category) + '25', display: 'grid', placeItems: 'center', color: catColor(tr.category), flexShrink: 0 }}>
                        {catIcon(tr.category)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: state.track?.id === tr.id ? P.amber : P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr.title}</div>
                        <div style={{ fontSize: 10, color: P.textDim }}>{tr.artist}</div>
                      </div>
                      {state.track?.id === tr.id && state.playing && (
                        <span style={{ fontSize: 10, color: P.amber }}>
                          <Waves size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}
              {tab === 'queue' && (
                state.queue.length === 0 ? (
                  <div style={{ padding: '20px 14px', textAlign: 'center', color: P.textDim, fontSize: 12 }}>
                    <List size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>{t('empty_queue')}</p>
                  </div>
                ) : state.queue.map((tr, i) => (
                  <button
                    key={tr.id + i}
                    onClick={() => playTrack(tr, state.queue)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '8px 14px', background: i === state.queueIndex ? P.surface : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 11, color: P.textDim, width: 18 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === state.queueIndex ? P.amber : P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tr.title}</div>
                      <div style={{ fontSize: 10, color: P.textDim }}>{tr.artist}</div>
                    </div>
                  </button>
                ))
              )}
              {tab === 'sound' && (
                <div style={{ padding: '2px 14px 10px' }}>
                  <div style={{ fontSize: 9, color: P.textDim, marginBottom: 7, letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('presets')}</div>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)} style={{
                        flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                        background: preset === p.name ? P.amber : 'transparent',
                        color: preset === p.name ? (isDark ? '#000' : '#fff') : P.textMuted,
                        border: `1px solid ${preset === p.name ? P.amber : P.border}`,
                      }}>{p.name}</button>
                    ))}
                  </div>
                  {([['low', t('bass')], ['mid', t('mid')], ['high', t('treble')]] as const).map(([band, label]) => (
                    <div key={band} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textMuted, marginBottom: 3 }}>
                        <span>{label}</span><span>{eq[band] > 0 ? '+' : ''}{eq[band]} dB</span>
                      </div>
                      <input type="range" min={-12} max={12} step={1} value={eq[band]}
                        onChange={e => { setPreset('Custom'); const v = Number(e.target.value); setEq(s => ({ ...s, [band]: v })) }}
                        style={{ width: '100%', accentColor: P.amber }} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textMuted, marginBottom: 3 }}>
                      <span>{t('reverb')}</span><span>{Math.round(reverb * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={reverb}
                      onChange={e => { setPreset('Custom'); setReverbAmt(Number(e.target.value)) }}
                      style={{ width: '100%', accentColor: P.violet }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textMuted, marginBottom: 3 }}>
                      <span>{t('speed')}</span><span>{rate.toFixed(2)}×</span>
                    </div>
                    <input type="range" min={0.5} max={1.5} step={0.05} value={rate}
                      onChange={e => setRate(Number(e.target.value))}
                      style={{ width: '100%', accentColor: P.teal }} />
                    <div style={{ fontSize: 9, color: P.textDim, marginTop: 3 }}>{t('speed_note')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
