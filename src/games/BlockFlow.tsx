import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RotateCw, Play, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onBack: () => void;
}

/* ── constants ─────────────────────────────────────────────────── */

const COLS = 10;
const ROWS = 20;
const INITIAL_DROP_MS = 800;
const MIN_DROP_MS = 80;
const LINES_PER_LEVEL = 10;
const SWIPE_THRESHOLD = 30;
const LS_KEY = 'kasuku_blockflow_highscore';

const COLORS = {
  bg: '#0b0f14',
  ink: '#111820',
  slate: '#1a2230',
  carbon: '#141c28',
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  orange: '#f97316',
  white: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  border: '#1f2d3d',
  surface: '#151d2b',
};

const PIECE_COLORS: Record<string, string> = {
  I: COLORS.teal,
  O: COLORS.amber,
  T: COLORS.violet,
  S: COLORS.emerald,
  Z: COLORS.rose,
  J: COLORS.sapphire,
  L: COLORS.orange,
};

type Matrix = number[][];

interface PieceDef {
  shape: Matrix;
  type: string;
}

const PIECES: PieceDef[] = [
  { type: 'I', shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  { type: 'O', shape: [[1,1],[1,1]] },
  { type: 'T', shape: [[0,1,0],[1,1,1],[0,0,0]] },
  { type: 'S', shape: [[0,1,1],[1,1,0],[0,0,0]] },
  { type: 'Z', shape: [[1,1,0],[0,1,1],[0,0,0]] },
  { type: 'J', shape: [[1,0,0],[1,1,1],[0,0,0]] },
  { type: 'L', shape: [[0,0,1],[1,1,1],[0,0,0]] },
];

function rotateMatrix(m: Matrix): Matrix {
  const n = m.length;
  const r: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      r[x][n - 1 - y] = m[y][x];
  return r;
}

function randomPiece(): PieceDef {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

/* ── localStorage helpers ──────────────────────────────────────── */

function getHighScore(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0; }
  catch { return 0; }
}

function saveHighScore(s: number) {
  try { localStorage.setItem(LS_KEY, String(s)); }
  catch { /* noop */ }
}

/* ── scoring ───────────────────────────────────────────────────── */

const LINE_SCORES = [0, 100, 300, 500, 800];

/* ── component ─────────────────────────────────────────────────── */

export default function BlockFlow({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(() => Math.min(400, window.innerWidth * 0.9));

  /* game state refs (no re-renders during loop) */
  const board = useRef<(string | 0)[][]>([]);
  const current = useRef<PieceDef>({ type: 'T', shape: [[0]] });
  const curX = useRef(0);
  const curY = useRef(0);
  const next = useRef<PieceDef>(randomPiece());
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropInterval = useRef(INITIAL_DROP_MS);
  const lastDrop = useRef(0);
  const animFrame = useRef(0);
  const gameRunning = useRef(false);
  const clearingRows = useRef<number[]>([]);
  const clearFlashStart = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /* UI state */
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLines, setDisplayLines] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [highScore, setHighScoreState] = useState(getHighScore);

  /* responsive */
  useEffect(() => {
    const h = () => setCanvasWidth(Math.min(400, window.innerWidth * 0.9));
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const cellSize = canvasWidth / COLS;
  const canvasHeight = cellSize * ROWS;

  /* ── board helpers ──────────────────────────────────────────── */

  function emptyBoard(): (string | 0)[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function collides(shape: Matrix, bx: number, by: number): boolean {
    for (let y = 0; y < shape.length; y++)
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const nx = bx + x;
        const ny = by + y;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board.current[ny][nx]) return true;
      }
    return false;
  }

  function lockPiece() {
    const s = current.current.shape;
    const t = current.current.type;
    for (let y = 0; y < s.length; y++)
      for (let x = 0; x < s[y].length; x++)
        if (s[y][x]) {
          const py = curY.current + y;
          const px = curX.current + x;
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS)
            board.current[py][px] = t;
        }
  }

  function getFullRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < ROWS; y++)
      if (board.current[y].every(c => c !== 0)) rows.push(y);
    return rows;
  }

  function removeRows(rows: number[]) {
    for (const r of rows.sort((a, b) => a - b)) {
      board.current.splice(r, 1);
      board.current.unshift(Array(COLS).fill(0));
    }
  }

  function ghostY(): number {
    let gy = curY.current;
    while (!collides(current.current.shape, curX.current, gy + 1)) gy++;
    return gy;
  }

  /* ── spawn / controls ──────────────────────────────────────── */

  function spawnPiece() {
    current.current = next.current;
    next.current = randomPiece();
    curX.current = Math.floor((COLS - current.current.shape[0].length) / 2);
    curY.current = -1;
    if (collides(current.current.shape, curX.current, curY.current)) {
      gameRunning.current = false;
      if (scoreRef.current > getHighScore()) {
        saveHighScore(scoreRef.current);
        setHighScoreState(scoreRef.current);
      }
      setGameState('over');
    }
  }

  function moveLeft() {
    if (!collides(current.current.shape, curX.current - 1, curY.current))
      curX.current--;
  }

  function moveRight() {
    if (!collides(current.current.shape, curX.current + 1, curY.current))
      curX.current++;
  }

  function moveDown(): boolean {
    if (!collides(current.current.shape, curX.current, curY.current + 1)) {
      curY.current++;
      return true;
    }
    return false;
  }

  function hardDrop() {
    while (moveDown()) { /* drop */ }
    handleLock();
  }

  function rotate() {
    const rotated = rotateMatrix(current.current.shape);
    /* try original, then wall kicks */
    const kicks = [0, -1, 1, -2, 2];
    for (const dx of kicks) {
      if (!collides(rotated, curX.current + dx, curY.current)) {
        current.current = { ...current.current, shape: rotated };
        curX.current += dx;
        return;
      }
    }
  }

  function handleLock() {
    lockPiece();
    const full = getFullRows();
    if (full.length > 0) {
      clearingRows.current = full;
      clearFlashStart.current = performance.now();
      const pts = (LINE_SCORES[full.length] || 0) * levelRef.current;
      scoreRef.current += pts;
      linesRef.current += full.length;
      levelRef.current = Math.floor(linesRef.current / LINES_PER_LEVEL) + 1;
      dropInterval.current = Math.max(MIN_DROP_MS, INITIAL_DROP_MS - (levelRef.current - 1) * 60);
      setDisplayScore(scoreRef.current);
      setDisplayLines(linesRef.current);
      setDisplayLevel(levelRef.current);
    } else {
      spawnPiece();
    }
  }

  /* ── draw ───────────────────────────────────────────────────── */

  function draw(ctx: CanvasRenderingContext2D, now: number) {
    const cs = cellSize;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    /* grid lines */
    ctx.strokeStyle = COLORS.slate;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * cs, 0); ctx.lineTo(x * cs, canvasHeight); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cs); ctx.lineTo(canvasWidth, y * cs); ctx.stroke();
    }

    /* board cells */
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const c = board.current[y][x];
        if (c) {
          const flashing = clearingRows.current.includes(y);
          if (flashing) {
            const elapsed = now - clearFlashStart.current;
            const flash = Math.floor(elapsed / 60) % 2 === 0;
            ctx.fillStyle = flash ? COLORS.white : (PIECE_COLORS[c] || COLORS.muted);
          } else {
            ctx.fillStyle = PIECE_COLORS[c] || COLORS.muted;
          }
          drawCell(ctx, x, y, cs);
        }
      }

    /* ghost piece */
    const gy = ghostY();
    const shape = current.current.shape;
    ctx.strokeStyle = PIECE_COLORS[current.current.type] || COLORS.muted;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3;
    for (let py = 0; py < shape.length; py++)
      for (let px = 0; px < shape[py].length; px++)
        if (shape[py][px]) {
          const dx = (curX.current + px) * cs;
          const dy = (gy + py) * cs;
          if (gy + py >= 0) {
            ctx.strokeRect(dx + 1, dy + 1, cs - 2, cs - 2);
          }
        }
    ctx.globalAlpha = 1;

    /* current piece */
    ctx.fillStyle = PIECE_COLORS[current.current.type] || COLORS.muted;
    for (let py = 0; py < shape.length; py++)
      for (let px = 0; px < shape[py].length; px++)
        if (shape[py][px]) {
          const dy = curY.current + py;
          if (dy >= 0) drawCell(ctx, curX.current + px, dy, cs);
        }
  }

  function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number) {
    const px = x * cs;
    const py = y * cs;
    const inset = 1;
    ctx.fillRect(px + inset, py + inset, cs - inset * 2, cs - inset * 2);
    /* edge highlight */
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(px + inset, py + inset, cs - inset * 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px + inset, py + cs - inset - 2, cs - inset * 2, 2);
    ctx.restore();
  }

  /* ── game loop ──────────────────────────────────────────────── */

  const loop = useCallback((now: number) => {
    if (!gameRunning.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    /* handle line-clear flash (200ms) */
    if (clearingRows.current.length > 0) {
      if (now - clearFlashStart.current > 200) {
        removeRows(clearingRows.current);
        clearingRows.current = [];
        spawnPiece();
      }
      draw(ctx, now);
      animFrame.current = requestAnimationFrame(loop);
      return;
    }

    /* gravity */
    if (now - lastDrop.current > dropInterval.current) {
      lastDrop.current = now;
      if (!moveDown()) {
        handleLock();
      }
    }

    draw(ctx, now);
    animFrame.current = requestAnimationFrame(loop);
  }, [canvasWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── start / reset ──────────────────────────────────────────── */

  function startGame() {
    board.current = emptyBoard();
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropInterval.current = INITIAL_DROP_MS;
    clearingRows.current = [];
    next.current = randomPiece();
    setDisplayScore(0);
    setDisplayLines(0);
    setDisplayLevel(1);
    gameRunning.current = true;
    lastDrop.current = performance.now();
    spawnPiece();
    setGameState('playing');
    animFrame.current = requestAnimationFrame(loop);
  }

  /* ── keyboard ───────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gameRunning.current || clearingRows.current.length > 0) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveLeft(); break;
        case 'ArrowRight': e.preventDefault(); moveRight(); break;
        case 'ArrowDown': e.preventDefault(); moveDown(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── touch ──────────────────────────────────────────────────── */

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || !gameRunning.current || clearingRows.current.length > 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
      rotate();
    } else if (absDx > absDy) {
      if (dx < 0) moveLeft(); else moveRight();
    } else {
      if (dy > 0) { moveDown(); moveDown(); }
    }
    touchStart.current = null;
  }

  /* ── cleanup ────────────────────────────────────────────────── */

  useEffect(() => {
    return () => {
      gameRunning.current = false;
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  /* ── next piece preview ─────────────────────────────────────── */

  function renderNextPreview(): React.ReactNode {
    const shape = next.current.shape;
    const color = PIECE_COLORS[next.current.type] || COLORS.muted;
    const previewCell = 18;
    const w = shape[0].length * previewCell;
    const h = shape.length * previewCell;
    return (
      <canvas
        width={w}
        height={h}
        ref={(el) => {
          if (!el) return;
          const ctx = el.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = color;
          for (let y = 0; y < shape.length; y++)
            for (let x = 0; x < shape[y].length; x++)
              if (shape[y][x])
                ctx.fillRect(x * previewCell + 1, y * previewCell + 1, previewCell - 2, previewCell - 2);
        }}
      />
    );
  }

  /* ── styles ─────────────────────────────────────────────────── */

  const cardStyle: React.CSSProperties = {
    background: COLORS.slate,
    borderRadius: 14,
    padding: '10px 14px',
    border: `1px solid ${COLORS.border}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
  };

  const btnStyle: React.CSSProperties = {
    background: COLORS.emerald,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 14,
    padding: '12px 28px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
  };

  const mobileBtnStyle: React.CSSProperties = {
    background: COLORS.surface,
    color: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    width: 52,
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
  };

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: COLORS.white,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 32,
    }}>
      {/* header */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 16px 8px',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.muted,
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>Block Flow</span>
      </div>

      {/* score row */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        width: '100%',
        maxWidth: 480,
        justifyContent: 'space-between',
      }}>
        {([
          ['Score', displayScore],
          ['Level', displayLevel],
          ['Lines', displayLines],
          ['Best', highScore],
        ] as const).map(([label, val]) => (
          <div key={label} style={{ ...cardStyle, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* game area */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              display: 'block',
              touchAction: 'none',
            }}
          />

          {/* start overlay */}
          {gameState === 'start' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              background: 'rgba(11,15,20,0.85)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 28, fontWeight: 600 }}>Block Flow</div>
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
                Arrow keys or swipe to move. Up / tap to rotate. Space to hard drop.
              </div>
              <button onClick={startGame} style={btnStyle}>
                <Play size={18} /> Play
              </button>
            </div>
          )}

          {/* game over overlay */}
          {gameState === 'over' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'rgba(11,15,20,0.85)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: COLORS.rose }}>Game Over</div>
              <div style={{ fontSize: 15, color: COLORS.muted }}>Score: {displayScore}</div>
              {displayScore >= highScore && displayScore > 0 && (
                <div style={{ fontSize: 13, color: COLORS.amber, fontWeight: 600 }}>New High Score!</div>
              )}
              <button onClick={startGame} style={btnStyle}>
                <RotateCw size={18} /> Retry
              </button>
            </div>
          )}
        </div>

        {/* next piece sidebar */}
        <div style={{ ...cardStyle, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Next</div>
          {renderNextPreview()}
        </div>
      </div>

      {/* mobile controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => { if (gameRunning.current) moveLeft(); }}
          style={mobileBtnStyle}
          aria-label="Move left"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) rotate(); }}
          style={mobileBtnStyle}
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) moveDown(); }}
          style={mobileBtnStyle}
          aria-label="Move down"
        >
          <ChevronDown size={24} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) moveRight(); }}
          style={mobileBtnStyle}
          aria-label="Move right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
