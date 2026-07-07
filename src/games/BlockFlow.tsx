import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RotateCw, Play, ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, Archive } from 'lucide-react';
import { sfxTap, sfxScore, sfxLevelUp, sfxGameOver, sfxClick } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

/* -- constants ----------------------------------------------------------- */

const COLS = 10;
const ROWS = 20;
const INITIAL_DROP_MS = 800;
const MIN_DROP_MS = 50;
const LINES_PER_LEVEL = 10;
const LOCK_DELAY_MS = 500;
const LOCK_MOVE_LIMIT = 15;
const CLEAR_FLASH_MS = 220;
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

/* -- piece definitions (4x4 / 3x3 / 2x2 bounding boxes) ----------------- */

const PIECES: PieceDef[] = [
  { type: 'I', shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  { type: 'O', shape: [[1,1],[1,1]] },
  { type: 'T', shape: [[0,1,0],[1,1,1],[0,0,0]] },
  { type: 'S', shape: [[0,1,1],[1,1,0],[0,0,0]] },
  { type: 'Z', shape: [[1,1,0],[0,1,1],[0,0,0]] },
  { type: 'J', shape: [[1,0,0],[1,1,1],[0,0,0]] },
  { type: 'L', shape: [[0,0,1],[1,1,1],[0,0,0]] },
];

/* -- SRS wall kick data -------------------------------------------------- */

// Offsets for J, L, S, T, Z (3x3 pieces)
// Key: "fromState>toState", value: array of [dx, dy] offsets to try
const KICK_JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};

// Offsets for I piece (4x4)
const KICK_I: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

function rotateMatrix(m: Matrix): Matrix {
  const n = m.length;
  const r: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      r[x][n - 1 - y] = m[y][x];
  return r;
}

/* -- 7-bag randomizer ---------------------------------------------------- */

function shuffled7Bag(): PieceDef[] {
  const bag = [...PIECES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/* -- localStorage helpers ------------------------------------------------ */

function getHighScore(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0; }
  catch { return 0; }
}

function saveHighScore(s: number) {
  try { localStorage.setItem(LS_KEY, String(s)); }
  catch { /* noop */ }
}

/* -- component ----------------------------------------------------------- */

export default function BlockFlow({ onBack, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(() => Math.min(320, window.innerWidth * 0.65));

  /* game state refs */
  const board = useRef<(string | 0)[][]>([]);
  const current = useRef<PieceDef>({ type: 'T', shape: [[0]] });
  const curX = useRef(0);
  const curY = useRef(0);
  const rotState = useRef(0); // 0..3 rotation state for SRS
  const bag = useRef<PieceDef[]>([]);
  const nextQueue = useRef<PieceDef[]>([]);
  const holdPiece = useRef<PieceDef | null>(null);
  const holdUsed = useRef(false); // can only hold once per drop
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
  const startTime = useRef(0);

  // Lock delay state
  const lockTimer = useRef(0); // when piece first touched ground
  const lockMoves = useRef(0); // moves made during lock delay
  const onGround = useRef(false);

  // Back-to-back tracking
  const lastClearWasTetris = useRef(false);
  const lastClearWasTSpin = useRef(false);

  /* UI state */
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLines, setDisplayLines] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [highScore, setHighScoreState] = useState(getHighScore);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [, forceRender] = useState(0);
  const vfxRafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingVfx = useRef<{particles: Particle[], pops: ScorePop[], shake: number}>({particles:[], pops:[], shake:0});
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;

  /* responsive */
  useEffect(() => {
    const h = () => setCanvasWidth(Math.min(320, window.innerWidth * 0.65));
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  /* VFX animation loop */
  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.1) return;
    const tick = () => {
      setParticles(prev => tickParticles(prev));
      setScorePops(prev => tickScorePops(prev));
      setShakeIntensity(prev => prev * 0.85);
      vfxRafRef.current = requestAnimationFrame(tick);
    };
    vfxRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vfxRafRef.current);
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.1]); // eslint-disable-line react-hooks/exhaustive-deps

  const cellSize = canvasWidth / COLS;
  const canvasHeight = cellSize * ROWS;

  /* -- board helpers ------------------------------------------------------ */

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

  /* -- T-spin detection -------------------------------------------------- */

  function isTSpin(): boolean {
    if (current.current.type !== 'T') return false;
    // Check the 4 corners of the T piece's 3x3 bounding box
    const cx = curX.current;
    const cy = curY.current;
    let filledCorners = 0;
    const corners: [number, number][] = [[0,0],[2,0],[0,2],[2,2]];
    for (const [dx, dy] of corners) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
        filledCorners++;
      } else if (board.current[ny] && board.current[ny][nx]) {
        filledCorners++;
      }
    }
    return filledCorners >= 3;
  }

  /* -- bag / queue helpers ----------------------------------------------- */

  function pullFromBag(): PieceDef {
    if (bag.current.length === 0) {
      bag.current = shuffled7Bag();
    }
    return bag.current.pop()!;
  }

  function fillQueue() {
    while (nextQueue.current.length < 3) {
      nextQueue.current.push(pullFromBag());
    }
  }

  function dequeueNext(): PieceDef {
    fillQueue();
    const p = nextQueue.current.shift()!;
    fillQueue();
    return p;
  }

  /* -- spawn / controls -------------------------------------------------- */

  function spawnPiece() {
    current.current = dequeueNext();
    rotState.current = 0;
    curX.current = Math.floor((COLS - current.current.shape[0].length) / 2);
    curY.current = current.current.type === 'I' ? -2 : -1;
    holdUsed.current = false;
    onGround.current = false;
    lockTimer.current = 0;
    lockMoves.current = 0;

    if (collides(current.current.shape, curX.current, curY.current)) {
      // try one row lower
      curY.current++;
      if (collides(current.current.shape, curX.current, curY.current)) {
        gameRunning.current = false;
        sfxGameOver();
        pendingVfx.current.particles.push(...wrongBurst(canvasWidth / 2, canvasHeight / 4));
        pendingVfx.current.shake = 10;
        if (scoreRef.current > getHighScore()) {
          saveHighScore(scoreRef.current);
          setHighScoreState(scoreRef.current);
        }
        const elapsed = performance.now() - startTime.current;
        onGameEndRef.current?.({
          score: scoreRef.current,
          accuracy: 1.0,
          level: levelRef.current,
          timeMs: Math.round(elapsed),
        });
        setGameState('over');
      }
    }
    forceRender(c => c + 1);
  }

  function resetLockDelay() {
    if (onGround.current && lockMoves.current < LOCK_MOVE_LIMIT) {
      lockTimer.current = performance.now();
      lockMoves.current++;
    }
  }

  function moveLeft() {
    if (!collides(current.current.shape, curX.current - 1, curY.current)) {
      sfxClick();
      curX.current--;
      resetLockDelay();
    }
  }

  function moveRight() {
    if (!collides(current.current.shape, curX.current + 1, curY.current)) {
      sfxClick();
      curX.current++;
      resetLockDelay();
    }
  }

  function moveDown(): boolean {
    if (!collides(current.current.shape, curX.current, curY.current + 1)) {
      curY.current++;
      return true;
    }
    return false;
  }

  function softDrop() {
    if (moveDown()) {
      scoreRef.current += 1;
      lastDrop.current = performance.now();
    }
  }

  function hardDrop() {
    let dropDist = 0;
    while (moveDown()) { dropDist++; }
    scoreRef.current += dropDist * 2;
    sfxTap();
    handleLock();
  }

  function rotate() {
    const oldShape = current.current.shape;
    const rotated = rotateMatrix(oldShape);
    const fromState = rotState.current;
    const toState = (fromState + 1) % 4;
    const key = `${fromState}>${toState}`;

    // Get kick table
    const kickTable = current.current.type === 'I' ? KICK_I : KICK_JLSTZ;
    const kicks = kickTable[key];

    if (current.current.type === 'O') {
      // O piece never rotates
      return;
    }

    if (kicks) {
      for (const [dx, dy] of kicks) {
        // SRS uses (dx, -dy) because our y-axis goes downward
        if (!collides(rotated, curX.current + dx, curY.current - dy)) {
          sfxTap();
          current.current = { ...current.current, shape: rotated };
          curX.current += dx;
          curY.current -= dy;
          rotState.current = toState;
          resetLockDelay();
          return;
        }
      }
    } else {
      // Fallback: simple wall kicks
      const simpleKicks = [0, -1, 1, -2, 2];
      for (const dx of simpleKicks) {
        if (!collides(rotated, curX.current + dx, curY.current)) {
          sfxTap();
          current.current = { ...current.current, shape: rotated };
          curX.current += dx;
          rotState.current = toState;
          resetLockDelay();
          return;
        }
      }
    }
  }

  function doHold() {
    if (holdUsed.current) return;
    holdUsed.current = true;
    sfxClick();

    const heldType = current.current.type;
    // Find the original piece definition
    const originalPiece = PIECES.find(p => p.type === heldType)!;

    if (holdPiece.current) {
      const swapPiece = holdPiece.current;
      holdPiece.current = { ...originalPiece };
      current.current = swapPiece;
    } else {
      holdPiece.current = { ...originalPiece };
      current.current = dequeueNext();
    }

    rotState.current = 0;
    curX.current = Math.floor((COLS - current.current.shape[0].length) / 2);
    curY.current = current.current.type === 'I' ? -2 : -1;
    onGround.current = false;
    lockTimer.current = 0;
    lockMoves.current = 0;
    forceRender(c => c + 1);
  }

  /* -- scoring ----------------------------------------------------------- */

  function handleLock() {
    const wasTSpin = isTSpin();
    lockPiece();
    onGround.current = false;
    lockTimer.current = 0;
    lockMoves.current = 0;

    const full = getFullRows();
    if (full.length > 0) {
      sfxScore();
      clearingRows.current = full;
      clearFlashStart.current = performance.now();

      let pts = 0;
      const lvl = levelRef.current;

      if (wasTSpin) {
        // T-spin line clear bonuses
        if (full.length === 1) pts = 800 * lvl;
        else if (full.length === 2) pts = 1200 * lvl;
        else if (full.length === 3) pts = 1600 * lvl;

        // Back-to-back T-spin bonus
        if (lastClearWasTSpin.current || lastClearWasTetris.current) {
          pts = Math.floor(pts * 1.5);
        }
        lastClearWasTSpin.current = true;
        lastClearWasTetris.current = false;
      } else {
        switch (full.length) {
          case 1: pts = 100 * lvl; break;
          case 2: pts = 300 * lvl; break;
          case 3: pts = 600 * lvl; break;
          case 4:
            // Back-to-back Tetris
            if (lastClearWasTetris.current) {
              pts = 1500 * lvl;
            } else {
              pts = 1000 * lvl;
            }
            sfxLevelUp();
            break;
        }

        if (full.length === 4) {
          lastClearWasTetris.current = true;
        } else {
          lastClearWasTetris.current = false;
        }
        lastClearWasTSpin.current = false;
      }

      scoreRef.current += pts;
      linesRef.current += full.length;
      const prevLevel = levelRef.current;
      levelRef.current = Math.floor(linesRef.current / LINES_PER_LEVEL) + 1;
      if (levelRef.current > prevLevel) sfxLevelUp();
      dropInterval.current = Math.max(MIN_DROP_MS, INITIAL_DROP_MS - (levelRef.current - 1) * 60);
      setDisplayScore(scoreRef.current);
      setDisplayLines(linesRef.current);
      setDisplayLevel(levelRef.current);

      pendingVfx.current.particles.push(...correctBurst(canvasWidth / 2, full[0] * cellSize));
      pendingVfx.current.pops.push(createScorePop(canvasWidth / 2, full[0] * cellSize, pts));
      if (full.length >= 4 || wasTSpin) {
        pendingVfx.current.particles.push(...confettiBurst(canvasWidth / 2, canvasHeight / 2));
        pendingVfx.current.shake = 6;
      }
    } else {
      if (wasTSpin) {
        // T-spin with no lines = 400 * level
        const pts = 400 * levelRef.current;
        scoreRef.current += pts;
        setDisplayScore(scoreRef.current);
        pendingVfx.current.pops.push(createScorePop(canvasWidth / 2, curY.current * cellSize, pts));
      }
      lastClearWasTetris.current = false;
      lastClearWasTSpin.current = false;
      spawnPiece();
    }
  }

  /* -- draw -------------------------------------------------------------- */

  function draw(ctx: CanvasRenderingContext2D, now: number) {
    const cs = cellSize;
    const cw = canvasWidth;
    const ch = canvasHeight;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, cw, ch);

    /* grid lines */
    ctx.strokeStyle = COLORS.slate;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * cs, 0); ctx.lineTo(x * cs, ch); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cs); ctx.lineTo(cw, y * cs); ctx.stroke();
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
    if (clearingRows.current.length === 0) {
      const gy = ghostY();
      const shape = current.current.shape;
      const ghostColor = PIECE_COLORS[current.current.type] || COLORS.muted;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = ghostColor;
      for (let py = 0; py < shape.length; py++)
        for (let px = 0; px < shape[py].length; px++)
          if (shape[py][px]) {
            const dy = gy + py;
            if (dy >= 0) {
              const drawX = (curX.current + px) * cs;
              const drawY = dy * cs;
              ctx.fillRect(drawX + 2, drawY + 2, cs - 4, cs - 4);
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

  /* -- game loop --------------------------------------------------------- */

  const loop = useCallback((now: number) => {
    if (!gameRunning.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    /* handle line-clear flash */
    if (clearingRows.current.length > 0) {
      if (now - clearFlashStart.current > CLEAR_FLASH_MS) {
        removeRows(clearingRows.current);
        clearingRows.current = [];
        spawnPiece();
      }
      draw(ctx, now);
      animFrame.current = requestAnimationFrame(loop);
      return;
    }

    /* check if piece is on the ground */
    const isOnGround = collides(current.current.shape, curX.current, curY.current + 1);

    if (isOnGround) {
      if (!onGround.current) {
        // Just landed
        onGround.current = true;
        lockTimer.current = now;
        lockMoves.current = 0;
      }
      // Check lock delay expiration
      if (now - lockTimer.current >= LOCK_DELAY_MS || lockMoves.current >= LOCK_MOVE_LIMIT) {
        handleLock();
      }
    } else {
      onGround.current = false;
      lockTimer.current = 0;
      lockMoves.current = 0;

      /* gravity */
      if (now - lastDrop.current > dropInterval.current) {
        lastDrop.current = now;
        moveDown();
      }
    }

    draw(ctx, now);
    if (pendingVfx.current.particles.length > 0 || pendingVfx.current.pops.length > 0 || pendingVfx.current.shake > 0) {
      setParticles(prev => [...prev, ...pendingVfx.current.particles]);
      setScorePops(prev => [...prev, ...pendingVfx.current.pops]);
      if (pendingVfx.current.shake > 0) setShakeIntensity(pendingVfx.current.shake);
      pendingVfx.current = {particles:[], pops:[], shake:0};
    }
    animFrame.current = requestAnimationFrame(loop);
  }, [canvasWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -- start / reset ----------------------------------------------------- */

  function startGame() {
    board.current = emptyBoard();
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropInterval.current = INITIAL_DROP_MS;
    clearingRows.current = [];
    bag.current = shuffled7Bag();
    nextQueue.current = [];
    holdPiece.current = null;
    holdUsed.current = false;
    lastClearWasTetris.current = false;
    lastClearWasTSpin.current = false;
    onGround.current = false;
    lockTimer.current = 0;
    lockMoves.current = 0;
    fillQueue();
    setDisplayScore(0);
    setDisplayLines(0);
    setDisplayLevel(1);
    gameRunning.current = true;
    startTime.current = performance.now();
    lastDrop.current = performance.now();
    spawnPiece();
    setGameState('playing');
    animFrame.current = requestAnimationFrame(loop);
  }

  /* -- keyboard ---------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gameRunning.current || clearingRows.current.length > 0) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveLeft(); break;
        case 'ArrowRight': e.preventDefault(); moveRight(); break;
        case 'ArrowDown': e.preventDefault(); softDrop(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'c': case 'C': e.preventDefault(); doHold(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* -- touch ------------------------------------------------------------- */

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
      if (dy > 0) { softDrop(); softDrop(); }
    }
    touchStart.current = null;
  }

  /* -- cleanup ----------------------------------------------------------- */

  useEffect(() => {
    return () => {
      gameRunning.current = false;
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  /* -- mini piece renderer (for next/hold panels) ------------------------ */

  function renderMiniPiece(piece: PieceDef | null, size: number = 16): React.ReactNode {
    if (!piece) {
      return <div style={{ width: size * 4, height: size * 4 }} />;
    }
    const shape = piece.shape;
    const color = PIECE_COLORS[piece.type] || COLORS.muted;
    const w = shape[0].length * size;
    const h = shape.length * size;
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
                ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        }}
      />
    );
  }

  /* -- styles ------------------------------------------------------------ */

  const cardStyle: React.CSSProperties = {
    background: COLORS.slate,
    borderRadius: 14,
    padding: '8px 10px',
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
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
    flexShrink: 0,
  };

  const sidePanelStyle: React.CSSProperties = {
    ...cardStyle,
    minWidth: 72,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  };

  const panelLabelStyle: React.CSSProperties = {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    fontWeight: 600,
  };

  /* -- render ------------------------------------------------------------ */

  return (
    <div ref={containerRef} style={{
      background: COLORS.bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: COLORS.white,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 32,
      position: 'relative',
      overflow: 'hidden',
      ...screenShakeStyle(shakeIntensity),
    }}>
      {/* header */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px 4px',
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
          <ArrowLeft size={22} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>Block Flow</span>
      </div>

      {/* score row */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '6px 12px',
        width: '100%',
        maxWidth: 520,
        justifyContent: 'space-between',
      }}>
        {([
          ['Score', displayScore],
          ['Level', displayLevel],
          ['Lines', displayLines],
          ['Best', highScore],
        ] as const).map(([label, val]) => (
          <div key={label} style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '6px 8px' }}>
            <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* game area: hold | board | next */}
      <div style={{ display: 'flex', gap: 8, padding: '6px 12px', alignItems: 'flex-start' }}>
        {/* hold panel */}
        <div style={sidePanelStyle}>
          <div style={panelLabelStyle}>Hold</div>
          <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: holdUsed.current ? 0.4 : 1 }}>
            {renderMiniPiece(holdPiece.current, 14)}
          </div>
        </div>

        {/* board */}
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
              gap: 16,
              background: 'rgba(11,15,20,0.88)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>Block Flow</div>
              <div style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
                Arrows to move / rotate. Space to hard drop. C to hold. Swipe or tap buttons on mobile.
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
              gap: 14,
              background: 'rgba(11,15,20,0.88)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: COLORS.rose }}>Game Over</div>
              <div style={{ fontSize: 14, color: COLORS.muted }}>Score: {displayScore}</div>
              <div style={{ fontSize: 12, color: COLORS.dim }}>Level {displayLevel} -- {displayLines} lines</div>
              {displayScore >= highScore && displayScore > 0 && (
                <div style={{ fontSize: 12, color: COLORS.amber, fontWeight: 600 }}>New High Score!</div>
              )}
              <button onClick={startGame} style={btnStyle}>
                <RotateCw size={18} /> Retry
              </button>
            </div>
          )}
          {particles.map(p => (
            <div key={p.id} style={renderParticleStyle(p)} />
          ))}
          {scorePops.map(pop => (
            <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
          ))}
        </div>

        {/* next pieces panel */}
        <div style={sidePanelStyle}>
          <div style={panelLabelStyle}>Next</div>
          {nextQueue.current.slice(0, 3).map((piece, i) => (
            <div key={i} style={{
              padding: '4px 0',
              opacity: i === 0 ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {renderMiniPiece(piece, i === 0 ? 14 : 12)}
            </div>
          ))}
        </div>
      </div>

      {/* mobile controls */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => { if (gameRunning.current) moveLeft(); }}
          style={mobileBtnStyle}
          aria-label="Move left"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) softDrop(); }}
          style={mobileBtnStyle}
          aria-label="Soft drop"
        >
          <ChevronDown size={22} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) rotate(); }}
          style={mobileBtnStyle}
          aria-label="Rotate"
        >
          <RotateCw size={18} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) moveRight(); }}
          style={mobileBtnStyle}
          aria-label="Move right"
        >
          <ChevronRight size={22} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) hardDrop(); }}
          style={mobileBtnStyle}
          aria-label="Hard drop"
        >
          <ChevronsDown size={22} />
        </button>
        <button
          onClick={() => { if (gameRunning.current) doHold(); }}
          style={mobileBtnStyle}
          aria-label="Hold piece"
        >
          <Archive size={18} />
        </button>
      </div>
    </div>
  );
}
