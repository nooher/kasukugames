import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Repeat, Shuffle, ChevronDown, ChevronUp, Music, X,
  BookOpen, Waves, Upload, List,
} from 'lucide-react'
import { RADIUS, MOTION } from '../lib/design'
import { getPalette, type Theme } from '../lib/theme'
import {
  BUILT_IN_TRACKS, formatTime, getLocalTracks, addLocalTrack,
  type AudioTrack, type PlayerState, initialPlayerState,
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
  const [tab, setTab] = useState<'queue' | 'library'>('library')
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
        audioRef.current.src = track.src
        audioRef.current.volume = state.volume
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
          audioRef.current.src = track.src
          audioRef.current.volume = prev.volume
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
  const catIcon = (cat: AudioTrack['category']) => {
    switch (cat) {
      case 'quran': case 'bible': return <BookOpen size={12} />
      case 'soundbath': return <Waves size={12} />
      default: return <Music size={12} />
    }
  }
  const catColor = (cat: AudioTrack['category']) => {
    switch (cat) {
      case 'quran': return P.emerald
      case 'bible': return P.sapphire
      case 'soundbath': return P.violet
      case 'ambient': return P.teal
      default: return P.amber
    }
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
              {(['library', 'queue'] as const).map(tb => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'none', border: 'none',
                    borderBottom: `2px solid ${tab === tb ? P.amber : 'transparent'}`,
                    color: tab === tb ? P.text : P.textMuted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t(tb === 'library' ? 'library' : 'queue')}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '8px 0' }}>
              {tab === 'library' && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', cursor: 'pointer', color: P.amber, fontSize: 12, fontWeight: 600 }}>
                    <Upload size={14} /> {t('upload_music')}
                    <input type="file" accept="audio/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  {allTracks.map(tr => (
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
            </div>
          </div>
        )}
      </div>
    </>
  )
}
