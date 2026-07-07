import { useRef, useEffect, useState, useCallback } from 'react';
import { sfxTap, sfxScore, sfxLevelUp, sfxGameOver, sfxWrong, sfxClick } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, burstParticles, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

/* ── palette ── */
const INK = '#111820';
const WHITE = '#f0f4f8';
const MUTED = '#7a8ba0';
const AMBER = '#f59e0b';
const CARD_BG = '#1a2230';
const CARD_BORDER = '#1f2d3d';

/* brick row colors */
const ROW_COLORS = ['#3a86ff', '#00c97b', '#7b2ff7', '#f43f5e', '#00b4d8', '#e879f9', '#f59e0b', '#06d6a0'];
const TOUGH_COLOR = '#4a5568';
const TOUGH_CRACKED = '#2d3748';
const INDESTRUCTIBLE_COLOR = '#718096';
const INDESTRUCTIBLE_HIGHLIGHT = '#a0aec0';
const EXPLOSIVE_COLOR = '#e53e3e';
const EXPLOSIVE_GLOW = '#fc8181';

/* ── power-up types ── */
const PUpType = { Multi: 0, Wide: 1, Fire: 2, Laser: 3, Life: 4 } as const;
type PUpType = (typeof PUpType)[keyof typeof PUpType];
const PUP_COLORS: Record<PUpType, string> = {
  [PUpType.Multi]: '#00c97b',
  [PUpType.Wide]: '#3a86ff',
  [PUpType.Fire]: '#f97316',
  [PUpType.Laser]: '#a855f7',
  [PUpType.Life]: '#ec4899',
};
const PUP_LABELS: Record<PUpType, string> = {
  [PUpType.Multi]: 'M',
  [PUpType.Wide]: 'W',
  [PUpType.Fire]: 'F',
  [PUpType.Laser]: 'L',
  [PUpType.Life]: '+',
};

/* ── brick types ── */
const BrickType = { Standard: 0, Tough: 1, Indestructible: 2, Explosive: 3 } as const;
type BrickType = (typeof BrickType)[keyof typeof BrickType];

/* ── types ── */
interface Ball {
  x: number; y: number;
  dx: number; dy: number;
  r: number;
  fire: boolean;
}
interface Brick {
  x: number; y: number;
  w: number; h: number;
  color: string;
  type: BrickType;
  hp: number;
  alive: boolean;
}
interface PowerUp {
  x: number; y: number;
  dy: number;
  type: PUpType;
  r: number;
}
interface Laser {
  x: number; y: number;
  dy: number;
  w: number; h: number;
}
interface GameState {
  phase: 'idle' | 'playing' | 'over' | 'won';
  score: number;
  lives: number;
  level: number;
  balls: Ball[];
  bricks: Brick[];
  powerUps: PowerUp[];
  lasers: Laser[];
  paddle: { x: number; w: number; h: number };
  wideTimer: number;
  fireTimer: number;
  laserTimer: number;
  baseSpeed: number;
  combo: number;
  maxCombo: number;
  totalBricksHit: number;
  totalBricksInLevel: number;
  startTime: number;
  activePowerUp: string | null;
  activePowerUpColor: string | null;
  activePowerUpTimer: number;
}

const MAX_LEVEL = 5;
const BRICK_PAD = 3;
const BRICK_TOP_OFFSET = 6;
const PADDLE_Y_OFFSET = 30;
const PADDLE_BASE_W = 90;
const PADDLE_H = 14;
const BALL_R = 6;
const BALL_BASE_SPEED = 4.2;
const PUP_CHANCE = 0.12;
const PUP_FALL_SPEED = 2.0;
const PUP_R = 10;
const LASER_SPEED = 8;
const LASER_W = 3;
const LASER_H = 14;

/* ── level layouts ── */
function createBricks(cw: number, level: number): Brick[] {
  const bricks: Brick[] = [];
  const cols = 10;
  const brickW = (cw - BRICK_PAD * (cols + 1)) / cols;
  const brickH = 16;

  const addBrick = (r: number, c: number, type: BrickType, color?: string) => {
    const bx = BRICK_PAD + c * (brickW + BRICK_PAD);
    const by = BRICK_TOP_OFFSET + r * (brickH + BRICK_PAD);
    let finalColor = color || ROW_COLORS[r % ROW_COLORS.length];
    let hp = 1;
    if (type === BrickType.Tough) { finalColor = TOUGH_COLOR; hp = 2; }
    else if (type === BrickType.Indestructible) { finalColor = INDESTRUCTIBLE_COLOR; hp = 999; }
    else if (type === BrickType.Explosive) { finalColor = EXPLOSIVE_COLOR; hp = 1; }
    bricks.push({ x: bx, y: by, w: brickW, h: brickH, color: finalColor, type, hp, alive: true });
  };

  if (level === 1) {
    /* Level 1: Simple rows */
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < cols; c++) {
        addBrick(r, c, BrickType.Standard);
      }
    }
  } else if (level === 2) {
    /* Level 2: Tough borders, standard center */
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === 5 || c === 0 || c === cols - 1) {
          addBrick(r, c, BrickType.Tough);
        } else {
          addBrick(r, c, BrickType.Standard);
        }
      }
    }
  } else if (level === 3) {
    /* Level 3: Diamond with explosives at tips */
    const center = Math.floor(cols / 2);
    for (let r = 0; r < 7; r++) {
      const half = r <= 3 ? r : 6 - r;
      for (let c = center - half; c <= center + half; c++) {
        if (c < 0 || c >= cols) continue;
        if ((r === 0 || r === 6) && c === center) {
          addBrick(r, c, BrickType.Explosive);
        } else if (r === 3 && (c === center - half || c === center + half)) {
          addBrick(r, c, BrickType.Tough);
        } else {
          addBrick(r, c, BrickType.Standard);
        }
      }
    }
  } else if (level === 4) {
    /* Level 4: Fortress with indestructible walls and explosive cores */
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < cols; c++) {
        // indestructible pillars
        if ((c === 2 || c === 7) && r >= 1 && r <= 6) {
          addBrick(r, c, BrickType.Indestructible);
        }
        // explosive core
        else if (r >= 3 && r <= 4 && c >= 4 && c <= 5) {
          addBrick(r, c, BrickType.Explosive);
        }
        // tough top wall
        else if (r === 0) {
          addBrick(r, c, BrickType.Tough);
        }
        // standard fill
        else if (!((c === 2 || c === 7) && r >= 1 && r <= 6)) {
          addBrick(r, c, BrickType.Standard);
        }
      }
    }
  } else {
    /* Level 5: Ultimate challenge - zigzag with all types */
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < cols; c++) {
        // checkerboard indestructible frame
        if ((r === 0 || r === 8) && c % 2 === 0) {
          addBrick(r, c, BrickType.Indestructible);
        }
        // tough zigzag
        else if (r === 2 && c >= (r % 2 === 0 ? 0 : 1) && c % 3 === 0) {
          addBrick(r, c, BrickType.Tough);
        } else if (r === 5 && c % 3 === 1) {
          addBrick(r, c, BrickType.Tough);
        }
        // explosive clusters
        else if ((r === 3 || r === 4) && (c === 1 || c === 4 || c === 8)) {
          addBrick(r, c, BrickType.Explosive);
        }
        // fill the rest
        else if (!((r === 0 || r === 8) && c % 2 === 0)) {
          addBrick(r, c, BrickType.Standard);
        }
      }
    }
  }

  return bricks;
}

function countBreakable(bricks: Brick[]): number {
  return bricks.filter(b => b.type !== BrickType.Indestructible).length;
}

function initBall(cw: number, ch: number, speed: number): Ball {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 4);
  return {
    x: cw / 2,
    y: ch - PADDLE_Y_OFFSET - PADDLE_H - BALL_R - 2,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    r: BALL_R,
    fire: false,
  };
}

function clampSpeed(ball: Ball, maxSpeed: number) {
  const spd = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  if (spd > maxSpeed) {
    const scale = maxSpeed / spd;
    ball.dx *= scale;
    ball.dy *= scale;
  }
  // ensure minimum vertical speed so ball doesn't go purely horizontal
  if (Math.abs(ball.dy) < 1.0) {
    ball.dy = ball.dy < 0 ? -1.0 : 1.0;
  }
}

export default function BrickBreaker({ onBack, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const animRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dims, setDims] = useState({ w: 600, h: 500 });
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiLevel, setUiLevel] = useState(1);
  const [uiCombo, setUiCombo] = useState(0);
  const [uiActivePU, setUiActivePU] = useState<string | null>(null);
  const [uiActivePUColor, setUiActivePUColor] = useState<string | null>(null);
  const [, setUiPhase] = useState<'idle' | 'playing' | 'over' | 'won'>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const vfxRafRef = useRef(0);
  const pendingVfx = useRef<{particles: Particle[], pops: ScorePop[], shake: number}>({particles:[], pops:[], shake:0});
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;

  /* ── responsive sizing ── */
  useEffect(() => {
    const measure = () => {
      const w = Math.min(600, Math.floor(window.innerWidth * 0.92));
      const h = Math.floor(w * 0.85);
      setDims({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ── VFX animation loop ── */
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
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.1]);

  /* ── init game state ── */
  const initGame = useCallback(
    (level = 1, score = 0, lives = 3) => {
      const { w: cw, h: ch } = dims;
      const speed = BALL_BASE_SPEED + (level - 1) * 0.35;
      const bricks = createBricks(cw, level);
      const gs: GameState = {
        phase: 'playing',
        score,
        lives,
        level,
        balls: [initBall(cw, ch, speed)],
        bricks,
        powerUps: [],
        lasers: [],
        paddle: { x: cw / 2 - PADDLE_BASE_W / 2, w: PADDLE_BASE_W, h: PADDLE_H },
        wideTimer: 0,
        fireTimer: 0,
        laserTimer: 0,
        baseSpeed: speed,
        combo: 0,
        maxCombo: 0,
        totalBricksHit: 0,
        totalBricksInLevel: countBreakable(bricks),
        startTime: Date.now(),
        activePowerUp: null,
        activePowerUpColor: null,
        activePowerUpTimer: 0,
      };
      stateRef.current = gs;
      setUiScore(score);
      setUiLives(lives);
      setUiLevel(level);
      setUiCombo(0);
      setUiActivePU(null);
      setUiActivePUColor(null);
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
      if (e.key === ' ') {
        e.preventDefault();
        shootLaser();
      }
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

  /* ── shoot laser ── */
  const shootLaser = useCallback(() => {
    const gs = stateRef.current;
    if (!gs || gs.phase !== 'playing' || gs.laserTimer <= 0) return;
    const py = dims.h - PADDLE_Y_OFFSET - gs.paddle.h;
    gs.lasers.push(
      { x: gs.paddle.x + 6, y: py - LASER_H, dy: -LASER_SPEED, w: LASER_W, h: LASER_H },
      { x: gs.paddle.x + gs.paddle.w - 6, y: py - LASER_H, dy: -LASER_SPEED, w: LASER_W, h: LASER_H },
    );
    sfxClick();
  }, [dims]);

  /* ── destroy a brick ── */
  function destroyBrick(gs: GameState, brick: Brick, cw: number) {
    brick.alive = false;
    gs.totalBricksHit++;
    gs.combo++;
    if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;
    const multiplier = Math.min(Math.floor(gs.combo / 5) + 1, 5);
    const points = 10 * multiplier;
    gs.score += points;
    sfxScore();
    pendingVfx.current.particles.push(...burstParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 8));
    pendingVfx.current.pops.push(createScorePop(brick.x + brick.w / 2, brick.y, multiplier > 1 ? `+${points} x${multiplier}` : points));

    // explosive chain reaction
    if (brick.type === BrickType.Explosive) {
      pendingVfx.current.shake = Math.max(pendingVfx.current.shake, 8);
      pendingVfx.current.particles.push(...correctBurst(brick.x + brick.w / 2, brick.y + brick.h / 2));
      const cx = brick.x + brick.w / 2;
      const cy = brick.y + brick.h / 2;
      const blastR = brick.w * 1.8;
      for (const other of gs.bricks) {
        if (!other.alive || other === brick) continue;
        if (other.type === BrickType.Indestructible) continue;
        const ox = other.x + other.w / 2;
        const oy = other.y + other.h / 2;
        const dist = Math.sqrt((ox - cx) ** 2 + (oy - cy) ** 2);
        if (dist < blastR) {
          other.hp--;
          if (other.hp <= 0) {
            destroyBrick(gs, other, cw);
          }
        }
      }
    }

    // power-up drop
    if (Math.random() < PUP_CHANCE) {
      const types: PUpType[] = [PUpType.Multi, PUpType.Wide, PUpType.Fire, PUpType.Laser, PUpType.Life];
      const weights = [3, 3, 2, 2, 1]; // life is rarer
      const totalW = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalW;
      let chosen = types[0];
      for (let i = 0; i < types.length; i++) {
        r -= weights[i];
        if (r <= 0) { chosen = types[i]; break; }
      }
      gs.powerUps.push({
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h,
        dy: PUP_FALL_SPEED,
        type: chosen,
        r: PUP_R,
      });
    }
  }

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
        setUiCombo(gs.combo);
        setUiActivePU(gs.activePowerUp);
        setUiActivePUColor(gs.activePowerUpColor);
        if (gs.phase !== 'playing') setUiPhase(gs.phase);
      }
      if (pendingVfx.current.particles.length > 0 || pendingVfx.current.pops.length > 0 || pendingVfx.current.shake > 0) {
        setParticles(prev => [...prev, ...pendingVfx.current.particles]);
        setScorePops(prev => [...prev, ...pendingVfx.current.pops]);
        if (pendingVfx.current.shake > 0) setShakeIntensity(pendingVfx.current.shake);
        pendingVfx.current = {particles:[], pops:[], shake:0};
      }
      draw(ctx, gs, dims.w, dims.h);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [dims]);

  /* ── update logic ── */
  function update(gs: GameState, cw: number, ch: number) {
    const dt = 1;

    /* timers */
    if (gs.wideTimer > 0) {
      gs.wideTimer -= 1 / 60;
      gs.paddle.w = PADDLE_BASE_W * 1.6;
      if (gs.wideTimer <= 0) { gs.paddle.w = PADDLE_BASE_W; gs.paddle.x = Math.min(gs.paddle.x, cw - gs.paddle.w); }
    }
    if (gs.fireTimer > 0) {
      gs.fireTimer -= 1 / 60;
      for (const b of gs.balls) b.fire = gs.fireTimer > 0;
      if (gs.fireTimer <= 0) for (const b of gs.balls) b.fire = false;
    }
    if (gs.laserTimer > 0) {
      gs.laserTimer -= 1 / 60;
    }

    // track active power-up for HUD
    if (gs.wideTimer > 0) { gs.activePowerUp = 'WIDE'; gs.activePowerUpColor = PUP_COLORS[PUpType.Wide]; gs.activePowerUpTimer = gs.wideTimer; }
    else if (gs.fireTimer > 0) { gs.activePowerUp = 'FIRE'; gs.activePowerUpColor = PUP_COLORS[PUpType.Fire]; gs.activePowerUpTimer = gs.fireTimer; }
    else if (gs.laserTimer > 0) { gs.activePowerUp = 'LASER'; gs.activePowerUpColor = PUP_COLORS[PUpType.Laser]; gs.activePowerUpTimer = gs.laserTimer; }
    else { gs.activePowerUp = null; gs.activePowerUpColor = null; gs.activePowerUpTimer = 0; }

    const maxSpeed = gs.baseSpeed + 3;

    /* lasers */
    for (let i = gs.lasers.length - 1; i >= 0; i--) {
      const laser = gs.lasers[i];
      laser.y += laser.dy * dt;
      if (laser.y + laser.h < 0) { gs.lasers.splice(i, 1); continue; }

      // laser-brick collision
      let hit = false;
      for (const brick of gs.bricks) {
        if (!brick.alive) continue;
        if (laser.x + laser.w > brick.x && laser.x < brick.x + brick.w &&
            laser.y < brick.y + brick.h && laser.y + laser.h > brick.y) {
          if (brick.type === BrickType.Indestructible) { hit = true; break; }
          brick.hp--;
          if (brick.hp <= 0) destroyBrick(gs, brick, cw);
          else { sfxTap(); }
          hit = true;
          break;
        }
      }
      if (hit) gs.lasers.splice(i, 1);
    }

    /* balls */
    const deadBalls: number[] = [];
    for (let bi = 0; bi < gs.balls.length; bi++) {
      const b = gs.balls[bi];
      b.x += b.dx * dt;
      b.y += b.dy * dt;

      /* wall bounce */
      if (b.x - b.r < 0) { b.x = b.r; b.dx = Math.abs(b.dx); }
      if (b.x + b.r > cw) { b.x = cw - b.r; b.dx = -Math.abs(b.dx); }
      if (b.y - b.r < 0) { b.y = b.r; b.dy = Math.abs(b.dy); }

      /* paddle bounce */
      const py = ch - PADDLE_Y_OFFSET - gs.paddle.h;
      if (
        b.dy > 0 &&
        b.y + b.r >= py &&
        b.y + b.r <= py + gs.paddle.h + 8 &&
        b.x >= gs.paddle.x - 2 &&
        b.x <= gs.paddle.x + gs.paddle.w + 2
      ) {
        b.y = py - b.r;
        const hitPos = (b.x - gs.paddle.x) / gs.paddle.w; // 0..1
        const clamped = Math.max(0.05, Math.min(0.95, hitPos));
        const angle = -Math.PI / 2 + (clamped - 0.5) * (Math.PI * 0.75);
        const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        b.dx = Math.cos(angle) * spd;
        b.dy = Math.sin(angle) * spd;
        clampSpeed(b, maxSpeed);
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
          if (brick.type === BrickType.Indestructible) {
            // reflect off indestructible
            reflectBall(b, brick);
            sfxTap();
            break;
          }

          brick.hp--;
          if (brick.hp <= 0) {
            destroyBrick(gs, brick, cw);
          } else {
            // tough brick cracked
            brick.color = TOUGH_CRACKED;
            sfxTap();
            pendingVfx.current.particles.push(...burstParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, TOUGH_COLOR, 4));
          }

          if (!b.fire) {
            reflectBall(b, brick);
          }
          clampSpeed(b, maxSpeed);

          if (!b.fire) break; // one brick per frame unless fire
        }
      }
    }

    /* remove dead balls */
    for (let i = deadBalls.length - 1; i >= 0; i--) {
      gs.balls.splice(deadBalls[i], 1);
    }
    if (gs.balls.length === 0) {
      gs.combo = 0;
      gs.lives--;
      if (gs.lives <= 0) {
        sfxGameOver();
        pendingVfx.current.particles.push(...wrongBurst(cw / 2, ch / 2));
        pendingVfx.current.shake = 10;
        gs.phase = 'over';
        const breakable = gs.totalBricksInLevel;
        const cleared = gs.totalBricksHit;
        onGameEndRef.current?.({
          score: gs.score,
          accuracy: breakable > 0 ? Math.min(cleared / breakable, 1) : 1,
          level: gs.level,
          timeMs: Date.now() - gs.startTime,
        });
        return;
      }
      sfxWrong();
      pendingVfx.current.particles.push(...wrongBurst(cw / 2, ch - 20));
      pendingVfx.current.shake = 6;
      gs.balls.push(initBall(cw, ch, gs.baseSpeed));
      gs.wideTimer = 0;
      gs.fireTimer = 0;
      gs.laserTimer = 0;
      gs.paddle.w = PADDLE_BASE_W;
      gs.lasers = [];
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
        sfxClick();
        pendingVfx.current.pops.push(createScorePop(p.x, p.y, 50, PUP_COLORS[p.type]));
        pendingVfx.current.particles.push(...correctBurst(p.x, p.y));
        gs.score += 50;
        switch (p.type) {
          case PUpType.Wide:
            gs.wideTimer = 12;
            break;
          case PUpType.Multi:
            if (gs.balls.length > 0) {
              const src = gs.balls[0];
              const spd = Math.sqrt(src.dx * src.dx + src.dy * src.dy);
              for (let j = 0; j < 2; j++) {
                const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
                gs.balls.push({ x: src.x, y: src.y, dx: Math.cos(a) * spd, dy: Math.sin(a) * spd, r: BALL_R, fire: src.fire });
              }
            }
            break;
          case PUpType.Fire:
            gs.fireTimer = 8;
            for (const b of gs.balls) b.fire = true;
            break;
          case PUpType.Laser:
            gs.laserTimer = 10;
            break;
          case PUpType.Life:
            gs.lives = Math.min(gs.lives + 1, 9);
            pendingVfx.current.pops.push(createScorePop(p.x, p.y - 20, '+1 LIFE', '#ec4899'));
            break;
        }
        gs.powerUps.splice(i, 1);
        continue;
      }
      if (p.y - p.r > ch) {
        gs.powerUps.splice(i, 1);
      }
    }

    /* level clear — only breakable bricks count */
    const allBreakableGone = gs.bricks.every(b => !b.alive || b.type === BrickType.Indestructible);
    if (allBreakableGone) {
      const clearBonus = 200 * gs.level;
      gs.score += clearBonus;
      sfxLevelUp();
      pendingVfx.current.particles.push(...confettiBurst(cw / 2, ch / 2));
      pendingVfx.current.pops.push(createScorePop(cw / 2, ch / 2, `LEVEL CLEAR +${clearBonus}`, '#c9a96e'));
      if (gs.level >= MAX_LEVEL) {
        gs.phase = 'won';
        onGameEndRef.current?.({
          score: gs.score,
          accuracy: 1.0,
          level: gs.level,
          timeMs: Date.now() - gs.startTime,
        });
      } else {
        const next = gs.level + 1;
        const speed = BALL_BASE_SPEED + (next - 1) * 0.35;
        gs.level = next;
        gs.baseSpeed = speed;
        gs.balls = [initBall(cw, ch, speed)];
        gs.bricks = createBricks(cw, next);
        gs.powerUps = [];
        gs.lasers = [];
        gs.wideTimer = 0;
        gs.fireTimer = 0;
        gs.laserTimer = 0;
        gs.paddle.w = PADDLE_BASE_W;
        gs.combo = 0;
        gs.totalBricksInLevel += countBreakable(gs.bricks);
      }
    }
  }

  function reflectBall(b: Ball, brick: Brick) {
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
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3);
      ctx.fill();

      // indestructible: metallic shine line
      if (brick.type === BrickType.Indestructible) {
        ctx.strokeStyle = INDESTRUCTIBLE_HIGHLIGHT;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(brick.x + 3, brick.y + 3);
        ctx.lineTo(brick.x + brick.w - 3, brick.y + 3);
        ctx.stroke();
      }

      // tough cracked: draw crack lines
      if (brick.type === BrickType.Tough && brick.hp === 1) {
        ctx.strokeStyle = '#0008';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const cx = brick.x + brick.w / 2;
        const cy = brick.y + brick.h / 2;
        ctx.moveTo(cx - 6, cy - 4);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + 4, cy - 5);
        ctx.moveTo(cx - 2, cy);
        ctx.lineTo(cx + 3, cy + 4);
        ctx.stroke();
      }

      // explosive: glow dot
      if (brick.type === BrickType.Explosive) {
        ctx.fillStyle = EXPLOSIVE_GLOW;
        ctx.beginPath();
        ctx.arc(brick.x + brick.w / 2, brick.y + brick.h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* lasers */
    for (const laser of gs.lasers) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
    }

    /* paddle */
    const py = ch - PADDLE_Y_OFFSET - gs.paddle.h;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    roundRect(ctx, gs.paddle.x, py, gs.paddle.w, gs.paddle.h, 6);
    ctx.fill();

    // laser indicators on paddle
    if (gs.laserTimer > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(gs.paddle.x + 4, py + 2, 4, gs.paddle.h - 4);
      ctx.fillRect(gs.paddle.x + gs.paddle.w - 8, py + 2, 4, gs.paddle.h - 4);
    }

    /* balls */
    for (const b of gs.balls) {
      ctx.save();
      if (b.fire) {
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#f97316';
      } else {
        ctx.shadowColor = AMBER;
        ctx.shadowBlur = 10;
        ctx.fillStyle = AMBER;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // fire trail
      if (b.fire) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(b.x - b.dx * 0.5, b.y - b.dy * 0.5, b.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(b.x - b.dx, b.y - b.dy, b.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* power-ups */
    for (const p of gs.powerUps) {
      ctx.fillStyle = PUP_COLORS[p.type];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // border
      ctx.strokeStyle = '#fff4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      // label
      ctx.fillStyle = '#fff';
      ctx.font = '600 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PUP_LABELS[p.type], p.x, p.y + 1);
    }

    /* overlays */
    if (gs.phase === 'over') {
      drawOverlay(ctx, cw, ch, 'GAME OVER', `Score: ${gs.score}  |  Level ${gs.level}  |  Max Combo: ${gs.maxCombo}`, 'Click to restart');
    } else if (gs.phase === 'won') {
      drawOverlay(ctx, cw, ch, 'ALL LEVELS CLEARED', `Final Score: ${gs.score}  |  Max Combo: ${gs.maxCombo}`, 'Click to play again');
    }
  }

  function drawIdle(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, cw, ch);

    // draw some decorative bricks
    const cols = 10;
    const brickW = (cw - BRICK_PAD * (cols + 1)) / cols;
    const brickH = 16;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.globalAlpha = 0.2 + r * 0.1;
        ctx.fillStyle = ROW_COLORS[(r + c) % ROW_COLORS.length];
        ctx.beginPath();
        roundRect(ctx, BRICK_PAD + c * (brickW + BRICK_PAD), 20 + r * (brickH + BRICK_PAD), brickW, brickH, 3);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    drawOverlay(ctx, cw, ch, 'BRICK BREAKER', 'Mouse/touch to move  |  Click to shoot lasers', 'Click to Start');
  }

  function drawOverlay(
    ctx: CanvasRenderingContext2D,
    cw: number, ch: number,
    title: string, subtitle: string, action: string,
  ) {
    ctx.fillStyle = 'rgba(17,24,32,0.84)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = WHITE;
    ctx.font = '700 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, cw / 2, ch / 2 - 34);
    if (subtitle) {
      ctx.font = '400 14px sans-serif';
      ctx.fillStyle = MUTED;
      ctx.fillText(subtitle, cw / 2, ch / 2 + 6);
    }
    ctx.font = '600 15px sans-serif';
    ctx.fillStyle = AMBER;
    ctx.fillText(action, cw / 2, ch / 2 + 44);
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
      sfxTap();
      initGame();
    } else if (gs.phase === 'over' || gs.phase === 'won') {
      sfxTap();
      initGame();
    } else if (gs.phase === 'playing') {
      shootLaser();
    }
  }, [initGame, shootLaser]);

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
    padding: '8px 12px',
    gap: 8,
    borderBottom: `1px solid ${CARD_BORDER}`,
  };

  const backBtnStyle: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${CARD_BORDER}`,
    color: MUTED,
    borderRadius: 8,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'sans-serif',
  };

  const statStyle: React.CSSProperties = {
    color: WHITE,
    fontSize: 13,
    fontFamily: 'sans-serif',
    fontWeight: 600,
  };

  const labelStyle: React.CSSProperties = {
    color: MUTED,
    fontSize: 10,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    marginRight: 3,
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', padding: 12, position: 'relative' as const, overflow: 'hidden', ...screenShakeStyle(shakeIntensity) }}>
      <div style={cardStyle}>
        {/* header */}
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>
            Back
          </button>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <span style={statStyle}>
              <span style={labelStyle}>Score</span>
              {uiScore}
            </span>
            <span style={statStyle}>
              <span style={labelStyle}>Lvl</span>
              {uiLevel}/{MAX_LEVEL}
            </span>
            <span style={statStyle}>
              <span style={labelStyle}>Lives</span>
              {uiLives}
            </span>
            {uiCombo >= 3 && (
              <span style={{ ...statStyle, color: AMBER }}>
                <span style={labelStyle}>Combo</span>
                {uiCombo}
              </span>
            )}
            {uiActivePU && (
              <span style={{ ...statStyle, color: uiActivePUColor || AMBER, fontSize: 11 }}>
                {uiActivePU}
              </span>
            )}
          </div>
        </div>

        {/* canvas */}
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          style={{ display: 'block', cursor: 'none', touchAction: 'none' }}
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
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
