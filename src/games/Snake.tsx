import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  onBack: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_DECREMENT = 2;
const SWIPE_THRESHOLD = 30;

const COLORS = {
  bg: '#111820',
  gridLine: '#1a2230',
  snakeHead: '#00c97b',
  snakeBody: '#00a866',
  food: '#f59e0b',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  cardBg: '#1a2230',
  cardBorder: '#1f2d3d',
};

const LS_KEY = 'kasuku_snake_highscore';

function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function setHighScore(s: number) {
  try {
    localStorage.setItem(LS_KEY, String(s));
  } catch { /* noop */ }
}

const opposite: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export default function Snake({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState(Math.min(500, window.innerWidth * 0.9));

  // Game state refs (avoid re-renders during game loop)
  const snake = useRef<Point[]>([]);
  const food = useRef<Point>({ x: 0, y: 0 });
  const dir = useRef<Direction>('RIGHT');
  const nextDir = useRef<Direction>('RIGHT');
  const speed = useRef(INITIAL_SPEED);
  const score = useRef(0);
  const length = useRef(3);
  const running = useRef(false);
  const lastTick = useRef(0);
  const animFrame = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // UI state (triggers re-renders for overlays)
  const [gameState, setGameState] = useState<'start' | 'playing' | 'over'>('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLength, setDisplayLength] = useState(3);
  const [highScore, setHighScoreState] = useState(getHighScore);

  // Responsive canvas
  useEffect(() => {
    const onResize = () => setCanvasSize(Math.min(500, window.innerWidth * 0.9));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cellSize = canvasSize / GRID_SIZE;

  // Spawn food on an empty cell
  const spawnFood = useCallback(() => {
    const occupied = new Set(snake.current.map(p => `${p.x},${p.y}`));
    const empty: Point[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }
    if (empty.length > 0) {
      food.current = empty[Math.floor(Math.random() * empty.length)];
    }
  }, []);

  // Initialize the game
  const initGame = useCallback(() => {
    const mid = Math.floor(GRID_SIZE / 2);
    snake.current = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    dir.current = 'RIGHT';
    nextDir.current = 'RIGHT';
    speed.current = INITIAL_SPEED;
    score.current = 0;
    length.current = 3;
    lastTick.current = 0;
    setDisplayScore(0);
    setDisplayLength(3);
    spawnFood();
  }, [spawnFood]);

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = cellSize;
    const size = canvasSize;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * cs;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Food
    const fx = food.current.x * cs;
    const fy = food.current.y * cs;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(fx + cs / 2, fy + cs / 2, cs * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snake.current.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      const pad = i === 0 ? 0.5 : 1;
      ctx.beginPath();
      ctx.roundRect(seg.x * cs + pad, seg.y * cs + pad, cs - pad * 2, cs - pad * 2, i === 0 ? 4 : 3);
      ctx.fill();
    });

    // Eyes on head
    if (snake.current.length > 0) {
      const head = snake.current[0];
      const hx = head.x * cs + cs / 2;
      const hy = head.y * cs + cs / 2;
      ctx.fillStyle = '#111820';
      const eyeOff = cs * 0.15;
      const eyeR = cs * 0.08;
      let e1x = hx, e1y = hy, e2x = hx, e2y = hy;
      const d = dir.current;
      if (d === 'RIGHT' || d === 'LEFT') {
        e1x = hx + (d === 'RIGHT' ? cs * 0.15 : -cs * 0.15);
        e2x = e1x;
        e1y = hy - eyeOff;
        e2y = hy + eyeOff;
      } else {
        e1y = hy + (d === 'DOWN' ? cs * 0.15 : -cs * 0.15);
        e2y = e1y;
        e1x = hx - eyeOff;
        e2x = hx + eyeOff;
      }
      ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
    }
  }, [canvasSize, cellSize]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!running.current) return;

    if (timestamp - lastTick.current >= speed.current) {
      lastTick.current = timestamp;
      dir.current = nextDir.current;

      // Move
      const head = snake.current[0];
      const deltas: Record<Direction, Point> = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
      };
      const d = deltas[dir.current];
      const newHead: Point = { x: head.x + d.x, y: head.y + d.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        running.current = false;
        const finalScore = score.current;
        const hs = getHighScore();
        if (finalScore > hs) {
          setHighScore(finalScore);
          setHighScoreState(finalScore);
        }
        setGameState('over');
        draw();
        return;
      }

      // Self collision
      if (snake.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
        running.current = false;
        const finalScore = score.current;
        const hs = getHighScore();
        if (finalScore > hs) {
          setHighScore(finalScore);
          setHighScoreState(finalScore);
        }
        setGameState('over');
        draw();
        return;
      }

      snake.current.unshift(newHead);

      // Eat food
      if (newHead.x === food.current.x && newHead.y === food.current.y) {
        score.current += 10;
        length.current += 1;
        speed.current = Math.max(MIN_SPEED, speed.current - SPEED_DECREMENT);
        setDisplayScore(score.current);
        setDisplayLength(length.current);
        spawnFood();
      } else {
        snake.current.pop();
      }
    }

    draw();
    animFrame.current = requestAnimationFrame(gameLoop);
  }, [draw, spawnFood]);

  // Start game
  const startGame = useCallback(() => {
    initGame();
    running.current = true;
    setGameState('playing');
    lastTick.current = performance.now();
    animFrame.current = requestAnimationFrame(gameLoop);
  }, [initGame, gameLoop]);

  // Draw initial state
  useEffect(() => {
    initGame();
    draw();
  }, [initGame, draw]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mapped = keyMap[e.key];
      if (!mapped) return;
      e.preventDefault();

      if (gameState === 'start') {
        startGame();
        return;
      }

      if (running.current && mapped !== opposite[dir.current]) {
        nextDir.current = mapped;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, startGame]);

  // Touch / swipe controls
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      // Tap
      if (gameState === 'start') startGame();
      return;
    }

    let swipeDir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      swipeDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      swipeDir = dy > 0 ? 'DOWN' : 'UP';
    }

    if (gameState === 'start') {
      startGame();
      nextDir.current = swipeDir;
      return;
    }

    if (running.current && swipeDir !== opposite[dir.current]) {
      nextDir.current = swipeDir;
    }
  }, [gameState, startGame]);

  const styles: Record<string, React.CSSProperties> = {
    card: {
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 14,
      padding: 16,
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    backBtn: {
      background: 'none',
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 8,
      color: COLORS.muted,
      fontSize: 14,
      padding: '4px 12px',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    stat: {
      color: COLORS.muted,
      fontSize: 13,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      lineHeight: 1.2,
    },
    statValue: {
      color: COLORS.text,
      fontSize: 18,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    },
    canvasWrap: {
      position: 'relative',
      width: canvasSize,
      height: canvasSize,
      borderRadius: 8,
      overflow: 'hidden',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(17,24,32,0.85)',
      gap: 16,
    },
    overlayTitle: {
      color: COLORS.text,
      fontSize: 28,
      fontWeight: 700,
      margin: 0,
    },
    overlayText: {
      color: COLORS.muted,
      fontSize: 15,
      margin: 0,
      textAlign: 'center',
    },
    playBtn: {
      background: COLORS.snakeHead,
      color: '#111820',
      border: 'none',
      borderRadius: 10,
      fontSize: 16,
      fontWeight: 700,
      padding: '10px 32px',
      cursor: 'pointer',
    },
    finalScore: {
      color: COLORS.snakeHead,
      fontSize: 48,
      fontWeight: 600,
      margin: 0,
      lineHeight: 1,
    },
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>Back</button>
        <div style={styles.stat}>
          <span style={{ fontSize: 11 }}>SCORE</span>
          <span style={styles.statValue}>{displayScore}</span>
        </div>
        <div style={styles.stat}>
          <span style={{ fontSize: 11 }}>LENGTH</span>
          <span style={styles.statValue}>{displayLength}</span>
        </div>
        <div style={styles.stat}>
          <span style={{ fontSize: 11, color: COLORS.food }}>BEST</span>
          <span style={{ ...styles.statValue, color: COLORS.food }}>{highScore}</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={styles.canvasWrap}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ display: 'block', width: canvasSize, height: canvasSize }}
        />

        {/* Start overlay */}
        {gameState === 'start' && (
          <div style={styles.overlay}>
            <p style={styles.overlayTitle}>Snake</p>
            <p style={styles.overlayText}>
              Tap or press any arrow key to start
            </p>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === 'over' && (
          <div style={styles.overlay}>
            <p style={{ ...styles.overlayText, fontSize: 14 }}>GAME OVER</p>
            <p style={styles.finalScore}>{displayScore}</p>
            <p style={{ ...styles.overlayText, fontSize: 13 }}>
              {displayScore >= highScore && displayScore > 0
                ? 'New high score!'
                : `Best: ${highScore}`}
            </p>
            <button style={styles.playBtn} onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
