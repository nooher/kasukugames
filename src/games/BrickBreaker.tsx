import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  onBack: () => void;
}

/* ── palette ── */
const INK = '#111820';
const WHITE = '#f0f4f8';
const MUTED = '#7a8ba0';
const AMBER = '#f59e0b';
const CARD_BG = '#1a2230';
const CARD_BORDER = '#1f2d3d';
const ROW_COLORS = ['#3a86ff', '#00c97b', '#7b2ff7', '#f43f5e', '#00b4d8', '#e879f9', '#f59e0b'];

/* ── power-up types ── */
const PUp = { Wide: 0, Multi: 1, Slow: 2 } as const;
type PUp = (typeof PUp)[keyof typeof PUp];
const PUP_COLORS: Record<PUp, string> = {
  [PUp.Wide]: '#3a86ff',
  [PUp.Multi]: '#00c97b',
  [PUp.Slow]: '#f59e0b',
};
const PUP_LABELS: Record<PUp, string> = {
  [PUp.Wide]: 'W',
  [PUp.Multi]: 'M',
  [PUp.Slow]: 'S',
};

/* ── types ── */
interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
}
interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}
interface PowerUp {
  x: number;
  y: number;
  dy: number;
  type: PUp;
  r: number;
}
interface GameState {
  phase: 'idle' | 'playing' | 'over' | 'won';
  score: number;
  lives: number;
  level: number;
  balls: Ball[];
  bricks: Brick[];
  powerUps: PowerUp[];
  paddle: { x: number; w: number; h: number };
  wideTimer: number;
  slowTimer: number;
  baseSpeed: number;
}

const MAX_LEVEL = 5;
const BASE_COLS = 8;
const BASE_ROWS = 5;
const BRICK_PAD = 4;
const BRICK_TOP_OFFSET = 40;
const PADDLE_Y_OFFSET = 30;
const PADDLE_BASE_W = 90;
const PADDLE_H = 14;
const BALL_R = 7;
const BALL_BASE_SPEED = 4.5;
const PUP_CHANCE = 0.1;
const PUP_FALL_SPEED = 2.2;
const PUP_R = 10;

function createBricks(cw: number, level: number): Brick[] {
  const rows = BASE_ROWS + Math.min(level - 1, 3);
  const cols = BASE_COLS;
  const brickW = (cw - BRICK_PAD * (cols + 1)) / cols;
  const brickH = 18;
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    const color = ROW_COLORS[r % ROW_COLORS.length];
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: BRICK_PAD + c * (brickW + BRICK_PAD),
        y: BRICK_TOP_OFFSET + r * (brickH + BRICK_PAD),
        w: brickW,
        h: brickH,
        color,
        alive: true,
      });
    }
  }
  return bricks;
}

function initBall(cw: number, ch: number, speed: number): Ball {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 4);
  return {
    x: cw / 2,
    y: ch - PADDLE_Y_OFFSET - PADDLE_H - BALL_R - 2,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    r: BALL_R,
  };
}

export default function BrickBreaker({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const animRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dims, setDims] = useState({ w: 600, h: 450 });
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiLevel, setUiLevel] = useState(1);
  const [, setUiPhase] = useState<'idle' | 'playing' | 'over' | 'won'>('idle');

  /* ── responsive sizing ── */
  useEffect(() => {
    const measure = () => {
      const w = Math.min(600, Math.floor(window.innerWidth * 0.9));
      const h = Math.floor(w * 0.75);
      setDims({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ── init game state ── */
  const initGame = useCallback(
    (level = 1, score = 0, lives = 3) => {
      const { w: cw, h: ch } = dims;
      const speed = BALL_BASE_SPEED + (level - 1) * 0.4;
      const gs: GameState = {
        phase: 'playing',
        score,
        lives,
        level,
        balls: [initBall(cw, ch, speed)],
        bricks: createBricks(cw, level),
        powerUps: [],
        paddle: { x: cw / 2 - PADDLE_BASE_W / 2, w: PADDLE_BASE_W, h: PADDLE_H },
        wideTimer: 0,
        slowTimer: 0,
        baseSpeed: speed,
      };
      stateRef.current = gs;
      setUiScore(score);
      setUiLives(lives);
      setUiLevel(level);
      setUiPhase('playing');
    },
    [dims],
  );

  /* ── paddle tracking ── */
  const movePaddle = useCallback(
    (clientX: number) => {
      const gs = stateRef.current;
      const canvas = canvasRef.current;
      if (!gs || !canvas || gs.phase !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * dims.w - gs.paddle.w / 2;
      gs.paddle.x = Math.max(0, Math.min(dims.w - gs.paddle.w, x));
    },
    [dims],
  );

  /* ── keyboard ── */
  useEffect(() => {
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    const tick = () => {
      const gs = stateRef.current;
      if (!gs || gs.phase !== 'playing') return;
      const step = 8;
      if (keys.has('ArrowLeft')) {
        gs.paddle.x = Math.max(0, gs.paddle.x - step);
      }
      if (keys.has('ArrowRight')) {
        gs.paddle.x = Math.min(dims.w - gs.paddle.w, gs.paddle.x + step);
      }
    };
    const iv = setInterval(tick, 16);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      clearInterval(iv);
    };
  }, [dims]);

  /* ── game loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const gs = stateRef.current;
      if (!gs) {
        drawIdle(ctx, dims.w, dims.h);
        return;
      }
      if (gs.phase === 'playing') {
        update(gs, dims.w, dims.h);
        setUiScore(gs.score);
        setUiLives(gs.lives);
        setUiLevel(gs.level);
        if (gs.phase !== 'playing') setUiPhase(gs.phase);
      }
      draw(ctx, gs, dims.w, dims.h);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [dims]);

  /* ── update logic ── */
  function update(gs: GameState, cw: number, ch: number) {
    const dt = 1; // fixed step per frame

    /* timers */
    if (gs.wideTimer > 0) {
      gs.wideTimer -= 1 / 60;
      gs.paddle.w = PADDLE_BASE_W * 1.5;
      if (gs.wideTimer <= 0) gs.paddle.w = PADDLE_BASE_W;
    }
    if (gs.slowTimer > 0) {
      gs.slowTimer -= 1 / 60;
    }

    const speedMul = gs.slowTimer > 0 ? 0.7 : 1;

    /* balls */
    const deadBalls: number[] = [];
    for (let bi = 0; bi < gs.balls.length; bi++) {
      const b = gs.balls[bi];
      b.x += b.dx * speedMul * dt;
      b.y += b.dy * speedMul * dt;

      /* wall bounce */
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.dx = Math.abs(b.dx);
      }
      if (b.x + b.r > cw) {
        b.x = cw - b.r;
        b.dx = -Math.abs(b.dx);
      }
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.dy = Math.abs(b.dy);
      }

      /* paddle bounce */
      const py = ch - PADDLE_Y_OFFSET - gs.paddle.h;
      if (
        b.dy > 0 &&
        b.y + b.r >= py &&
        b.y + b.r <= py + gs.paddle.h + 6 &&
        b.x >= gs.paddle.x &&
        b.x <= gs.paddle.x + gs.paddle.w
      ) {
        b.y = py - b.r;
        const hitPos = (b.x - gs.paddle.x) / gs.paddle.w; // 0..1
        const angle = -Math.PI / 2 + (hitPos - 0.5) * (Math.PI * 0.7);
        const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        b.dx = Math.cos(angle) * spd;
        b.dy = Math.sin(angle) * spd;
      }

      /* fell below */
      if (b.y - b.r > ch) {
        deadBalls.push(bi);
      }

      /* brick collisions */
      for (const brick of gs.bricks) {
        if (!brick.alive) continue;
        if (
          b.x + b.r > brick.x &&
          b.x - b.r < brick.x + brick.w &&
          b.y + b.r > brick.y &&
          b.y - b.r < brick.y + brick.h
        ) {
          brick.alive = false;
          gs.score += 10;

          /* reflect */
          const overlapLeft = b.x + b.r - brick.x;
          const overlapRight = brick.x + brick.w - (b.x - b.r);
          const overlapTop = b.y + b.r - brick.y;
          const overlapBottom = brick.y + brick.h - (b.y - b.r);
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            b.dx = -b.dx;
          } else {
            b.dy = -b.dy;
          }

          /* power-up drop */
          if (Math.random() < PUP_CHANCE) {
            const types = [PUp.Wide, PUp.Multi, PUp.Slow];
            gs.powerUps.push({
              x: brick.x + brick.w / 2,
              y: brick.y + brick.h,
              dy: PUP_FALL_SPEED,
              type: types[Math.floor(Math.random() * types.length)],
              r: PUP_R,
            });
          }
          break; // one brick per frame per ball
        }
      }
    }

    /* remove dead balls */
    for (let i = deadBalls.length - 1; i >= 0; i--) {
      gs.balls.splice(deadBalls[i], 1);
    }
    if (gs.balls.length === 0) {
      gs.lives--;
      if (gs.lives <= 0) {
        gs.phase = 'over';
        return;
      }
      gs.balls.push(initBall(cw, ch, gs.baseSpeed));
      gs.wideTimer = 0;
      gs.slowTimer = 0;
      gs.paddle.w = PADDLE_BASE_W;
    }

    /* power-ups */
    const py = ch - PADDLE_Y_OFFSET - gs.paddle.h;
    for (let i = gs.powerUps.length - 1; i >= 0; i--) {
      const p = gs.powerUps[i];
      p.y += p.dy * dt;
      /* collect */
      if (
        p.y + p.r >= py &&
        p.y - p.r <= py + gs.paddle.h &&
        p.x >= gs.paddle.x &&
        p.x <= gs.paddle.x + gs.paddle.w
      ) {
        gs.score += 50;
        switch (p.type) {
          case PUp.Wide:
            gs.wideTimer = 10;
            break;
          case PUp.Multi:
            if (gs.balls.length > 0) {
              const src = gs.balls[0];
              const spd = Math.sqrt(src.dx * src.dx + src.dy * src.dy);
              for (let j = 0; j < 2; j++) {
                const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
                gs.balls.push({ x: src.x, y: src.y, dx: Math.cos(a) * spd, dy: Math.sin(a) * spd, r: BALL_R });
              }
            }
            break;
          case PUp.Slow:
            gs.slowTimer = 8;
            break;
        }
        gs.powerUps.splice(i, 1);
        continue;
      }
      if (p.y - p.r > ch) {
        gs.powerUps.splice(i, 1);
      }
    }

    /* level clear */
    if (gs.bricks.every((b) => !b.alive)) {
      gs.score += 100;
      if (gs.level >= MAX_LEVEL) {
        gs.phase = 'won';
      } else {
        const next = gs.level + 1;
        const speed = BALL_BASE_SPEED + (next - 1) * 0.4;
        gs.level = next;
        gs.baseSpeed = speed;
        gs.balls = [initBall(cw, ch, speed)];
        gs.bricks = createBricks(cw, next);
        gs.powerUps = [];
        gs.wideTimer = 0;
        gs.slowTimer = 0;
        gs.paddle.w = PADDLE_BASE_W;
      }
    }
  }

  /* ── draw ── */
  function draw(ctx: CanvasRenderingContext2D, gs: GameState, cw: number, ch: number) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, cw, ch);

    /* bricks */
    for (const brick of gs.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
      ctx.fill();
    }

    /* paddle */
    const py = ch - PADDLE_Y_OFFSET - gs.paddle.h;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    roundRect(ctx, gs.paddle.x, py, gs.paddle.w, gs.paddle.h, 6);
    ctx.fill();

    /* balls */
    for (const b of gs.balls) {
      ctx.save();
      ctx.shadowColor = AMBER;
      ctx.shadowBlur = 12;
      ctx.fillStyle = AMBER;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* power-ups */
    for (const p of gs.powerUps) {
      ctx.fillStyle = PUP_COLORS[p.type];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PUP_LABELS[p.type], p.x, p.y + 1);
    }

    /* overlays */
    if (gs.phase === 'over') {
      drawOverlay(ctx, cw, ch, 'GAME OVER', `Score: ${gs.score}`, 'Click to restart');
    } else if (gs.phase === 'won') {
      drawOverlay(ctx, cw, ch, 'YOU WIN!', `Final Score: ${gs.score}`, 'Click to play again');
    }
  }

  function drawIdle(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, cw, ch);
    drawOverlay(ctx, cw, ch, 'BRICK BREAKER', '', 'Click to Start');
  }

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    title: string,
    subtitle: string,
    action: string,
  ) {
    ctx.fillStyle = 'rgba(17,24,32,0.82)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, cw / 2, ch / 2 - 30);
    if (subtitle) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = MUTED;
      ctx.fillText(subtitle, cw / 2, ch / 2 + 10);
    }
    ctx.font = '16px sans-serif';
    ctx.fillStyle = AMBER;
    ctx.fillText(action, cw / 2, ch / 2 + 50);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ── click / touch handlers ── */
  const handleClick = useCallback(() => {
    const gs = stateRef.current;
    if (!gs || gs.phase === 'idle') {
      initGame();
    } else if (gs.phase === 'over' || gs.phase === 'won') {
      initGame();
    }
  }, [initGame]);

  /* ── styles ── */
  const cardStyle: React.CSSProperties = {
    background: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 14,
    overflow: 'hidden',
    display: 'inline-block',
    userSelect: 'none',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    gap: 12,
    borderBottom: `1px solid ${CARD_BORDER}`,
  };

  const backBtnStyle: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${CARD_BORDER}`,
    color: MUTED,
    borderRadius: 8,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'sans-serif',
  };

  const statStyle: React.CSSProperties = {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'sans-serif',
    fontWeight: 600,
  };

  const labelStyle: React.CSSProperties = {
    color: MUTED,
    fontSize: 11,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    marginRight: 4,
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
      <div style={cardStyle}>
        {/* header */}
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>
            Back
          </button>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={statStyle}>
              <span style={labelStyle}>Score</span>
              {uiScore}
            </span>
            <span style={statStyle}>
              <span style={labelStyle}>Level</span>
              {uiLevel}
            </span>
            <span style={statStyle}>
              <span style={labelStyle}>Lives</span>
              {uiLives}
            </span>
          </div>
        </div>

        {/* canvas */}
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          style={{ display: 'block', cursor: 'none' }}
          onClick={handleClick}
          onMouseMove={(e) => movePaddle(e.clientX)}
          onTouchStart={(e) => {
            e.preventDefault();
            if (e.touches.length > 0) movePaddle(e.touches[0].clientX);
            handleClick();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            if (e.touches.length > 0) movePaddle(e.touches[0].clientX);
          }}
        />
      </div>
    </div>
  );
}
