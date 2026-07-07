import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sfxTap, sfxScore, sfxGameOver, sfxClick } from '../lib/sfx';
import {
  type Particle,
  type ScorePop,
  correctBurst,
  wrongBurst,
  confettiBurst,
  burstParticles,
  tickParticles,
  renderParticleStyle,
  createScorePop,
  tickScorePops,
  scorePopStyle,
  screenShakeStyle,
} from '../lib/vfx';

interface Props {
  onBack: () => void;
  onGameEnd?: (r: {
    score: number;
    accuracy: number;
    level: number;
    maxScore?: number;
    timeMs?: number;
  }) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

type PowerUpKind = 'speed' | 'slowmo' | 'double' | 'wallpass';

interface PowerUp {
  pos: Point;
  kind: PowerUpKind;
  spawnedAt: number;
}

interface ActivePowerUp {
  kind: PowerUpKind;
  endsAt: number;
}

const GRID_SIZE = 24;
const INITIAL_SPEED = 140;
const MIN_SPEED = 50;
const SPEED_PER_FOOD = 1.8;
const SWIPE_THRESHOLD = 30;
const FOOD_PER_LEVEL = 5;
const POWERUP_DURATION = 6000;
const POWERUP_SPAWN_INTERVAL = 8000;
const POWERUP_DESPAWN_TIME = 10000;

const COLORS = {
  bg: '#0f161e',
  gridLine: '#171f2a',
  gridDot: '#1c2636',
  snakeHead: '#00c97b',
  snakeBody: '#00a866',
  snakeBodyAlt: '#009058',
  snakeEye: '#0f161e',
  food: '#f59e0b',
  foodGlow: '#f59e0b33',
  obstacle: '#3d4a5c',
  obstacleBorder: '#4e5d72',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  cardBg: '#1a2230',
  cardBorder: '#1f2d3d',
  pauseOverlay: 'rgba(15,22,30,0.88)',
  // Power-up colors
  powerSpeed: '#e74c3c',
  powerSlowmo: '#3498db',
  powerDouble: '#f1c40f',
  powerWallpass: '#9b59b6',
};

const POWERUP_COLORS: Record<PowerUpKind, string> = {
  speed: COLORS.powerSpeed,
  slowmo: COLORS.powerSlowmo,
  double: COLORS.powerDouble,
  wallpass: COLORS.powerWallpass,
};

const POWERUP_LABELS: Record<PowerUpKind, string> = {
  speed: 'SPEED',
  slowmo: 'SLOW-MO',
  double: '2x PTS',
  wallpass: 'GHOST',
};

const POWERUP_SYMBOLS: Record<PowerUpKind, string> = {
  speed: '>>', // fast-forward
  slowmo: '||', // pause-like
  double: 'x2',
  wallpass: '~',  // phase
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
  } catch {
    /* noop */
  }
}

const opposite: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const deltas: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Generate obstacle layouts for each level
function generateObstacles(level: number, snakePositions: Set<string>, foodPos: Point): Point[] {
  if (level < 2) return [];
  const obstacles: Point[] = [];
  const occupied = new Set(snakePositions);
  occupied.add(`${foodPos.x},${foodPos.y}`);

  // Border danger zones (leave openings)
  const margin = 3;
  const count = Math.min((level - 1) * 3, 40);

  for (let i = 0; i < count; i++) {
    let tries = 0;
    while (tries < 50) {
      tries++;
      let x: number, y: number;
      const pattern = level % 4;

      if (pattern === 0) {
        // Random interior walls
        x = margin + Math.floor(Math.random() * (GRID_SIZE - margin * 2));
        y = margin + Math.floor(Math.random() * (GRID_SIZE - margin * 2));
      } else if (pattern === 1) {
        // Horizontal bars
        const barY = margin + Math.floor(Math.random() * (GRID_SIZE - margin * 2));
        const barStartX = margin + Math.floor(Math.random() * (GRID_SIZE - margin * 2 - 4));
        x = barStartX + Math.floor(Math.random() * 4);
        y = barY;
      } else if (pattern === 2) {
        // Cross pattern from center
        const center = Math.floor(GRID_SIZE / 2);
        if (Math.random() > 0.5) {
          x = center + Math.floor((Math.random() - 0.5) * (GRID_SIZE - margin * 2));
          y = center;
        } else {
          x = center;
          y = center + Math.floor((Math.random() - 0.5) * (GRID_SIZE - margin * 2));
        }
      } else {
        // Corner blocks
        const cornerX = Math.random() > 0.5 ? margin : GRID_SIZE - margin - 1;
        const cornerY = Math.random() > 0.5 ? margin : GRID_SIZE - margin - 1;
        x = cornerX + Math.floor((Math.random() - 0.5) * 4);
        y = cornerY + Math.floor((Math.random() - 0.5) * 4);
      }

      x = Math.max(0, Math.min(GRID_SIZE - 1, x));
      y = Math.max(0, Math.min(GRID_SIZE - 1, y));
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        occupied.add(key);
        obstacles.push({ x, y });
        break;
      }
    }
  }
  return obstacles;
}

export default function Snake({ onBack, onGameEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState(
    Math.min(520, Math.min(window.innerWidth - 32, window.innerHeight - 200))
  );

  // Game state refs
  const snake = useRef<Point[]>([]);
  const food = useRef<Point>({ x: 0, y: 0 });
  const dir = useRef<Direction>('RIGHT');
  const nextDir = useRef<Direction>('RIGHT');
  const inputQueue = useRef<Direction[]>([]);
  const baseSpeed = useRef(INITIAL_SPEED);
  const effectiveSpeed = useRef(INITIAL_SPEED);
  const score = useRef(0);
  const snakeLength = useRef(3);
  const running = useRef(false);
  const paused = useRef(false);
  const lastTick = useRef(0);
  const animFrame = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const startTime = useRef(0);
  const foodEaten = useRef(0);
  const level = useRef(1);
  const obstacles = useRef<Point[]>([]);
  const powerUp = useRef<PowerUp | null>(null);
  const activePowerUp = useRef<ActivePowerUp | null>(null);
  const lastPowerUpSpawn = useRef(0);
  const obstacleSet = useRef<Set<string>>(new Set());

  // UI state
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'over'>('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLength, setDisplayLength] = useState(3);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [displaySpeed, setDisplaySpeed] = useState(1);
  const [displayPowerUp, setDisplayPowerUp] = useState<string | null>(null);
  const [highScore, setHighScoreState] = useState(getHighScore);

  // VFX state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const vfxRafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingVfx = useRef<{
    particles: Particle[];
    pops: ScorePop[];
    shake: number;
  }>({ particles: [], pops: [], shake: 0 });

  // VFX animation loop
  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.1) return;
    const tick = () => {
      setParticles((prev) => tickParticles(prev));
      setScorePops((prev) => tickScorePops(prev));
      setShakeIntensity((prev) => prev * 0.85);
      vfxRafRef.current = requestAnimationFrame(tick);
    };
    vfxRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vfxRafRef.current);
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.1]);

  // Responsive canvas
  useEffect(() => {
    const onResize = () =>
      setCanvasSize(Math.min(520, Math.min(window.innerWidth - 32, window.innerHeight - 200)));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cellSize = canvasSize / GRID_SIZE;

  // Check if a cell is occupied by snake or obstacles
  const _isOccupied = useCallback((x: number, y: number): boolean => {
    if (obstacleSet.current.has(`${x},${y}`)) return true;
    return snake.current.some((s) => s.x === x && s.y === y);
  }, []); void _isOccupied;

  // Spawn food on an empty cell
  const spawnFood = useCallback(() => {
    const occupied = new Set(snake.current.map((p) => `${p.x},${p.y}`));
    obstacleSet.current.forEach((k) => occupied.add(k));
    if (powerUp.current) occupied.add(`${powerUp.current.pos.x},${powerUp.current.pos.y}`);
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

  // Spawn a power-up on an empty cell
  const spawnPowerUp = useCallback(
    (now: number) => {
      const occupied = new Set(snake.current.map((p) => `${p.x},${p.y}`));
      obstacleSet.current.forEach((k) => occupied.add(k));
      occupied.add(`${food.current.x},${food.current.y}`);
      const empty: Point[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
        }
      }
      if (empty.length === 0) return;
      const kinds: PowerUpKind[] = ['speed', 'slowmo', 'double', 'wallpass'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const pos = empty[Math.floor(Math.random() * empty.length)];
      powerUp.current = { pos, kind, spawnedAt: now };
    },
    []
  );

  // Recalculate effective speed considering power-ups
  const recalcSpeed = useCallback(() => {
    let spd = baseSpeed.current;
    if (activePowerUp.current) {
      if (activePowerUp.current.kind === 'speed') {
        spd = Math.max(35, spd * 0.55);
      } else if (activePowerUp.current.kind === 'slowmo') {
        spd = spd * 1.6;
      }
    }
    effectiveSpeed.current = spd;
  }, []);

  // Update obstacles for current level
  const updateObstacles = useCallback(() => {
    const snakeSet = new Set(snake.current.map((p) => `${p.x},${p.y}`));
    obstacles.current = generateObstacles(level.current, snakeSet, food.current);
    obstacleSet.current = new Set(obstacles.current.map((o) => `${o.x},${o.y}`));
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
    inputQueue.current = [];
    baseSpeed.current = INITIAL_SPEED;
    effectiveSpeed.current = INITIAL_SPEED;
    score.current = 0;
    snakeLength.current = 3;
    lastTick.current = 0;
    foodEaten.current = 0;
    level.current = 1;
    powerUp.current = null;
    activePowerUp.current = null;
    lastPowerUpSpawn.current = 0;
    obstacles.current = [];
    obstacleSet.current = new Set();
    paused.current = false;
    setDisplayScore(0);
    setDisplayLength(3);
    setDisplayLevel(1);
    setDisplaySpeed(1);
    setDisplayPowerUp(null);
    spawnFood();
  }, [spawnFood]);

  // Draw the game
  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const cs = cellSize;
      const size = canvasSize;

      // Background
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, size, size);

      // Grid dots (subtle)
      ctx.fillStyle = COLORS.gridDot;
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          ctx.beginPath();
          ctx.arc(x * cs + cs / 2, y * cs + cs / 2, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Obstacles
      for (const obs of obstacles.current) {
        ctx.fillStyle = COLORS.obstacle;
        ctx.fillRect(obs.x * cs + 1, obs.y * cs + 1, cs - 2, cs - 2);
        ctx.strokeStyle = COLORS.obstacleBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(obs.x * cs + 1.5, obs.y * cs + 1.5, cs - 3, cs - 3);
      }

      // Food glow
      const fx = food.current.x * cs + cs / 2;
      const fy = food.current.y * cs + cs / 2;
      ctx.fillStyle = COLORS.foodGlow;
      ctx.beginPath();
      ctx.arc(fx, fy, cs * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Food (pulsing)
      const pulse = 0.35 + Math.sin(now * 0.004) * 0.06;
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(fx, fy, cs * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Power-up on field
      if (powerUp.current) {
        const pu = powerUp.current;
        const px = pu.pos.x * cs + cs / 2;
        const py = pu.pos.y * cs + cs / 2;
        const puColor = POWERUP_COLORS[pu.kind];
        const age = now - pu.spawnedAt;
        const blinkRate = age > POWERUP_DESPAWN_TIME * 0.7 ? 0.015 : 0.003;
        const alpha = 0.6 + Math.sin(now * blinkRate) * 0.4;

        // Glow ring
        ctx.strokeStyle = puColor + '44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, cs * 0.55, 0, Math.PI * 2);
        ctx.stroke();

        // Diamond shape
        ctx.fillStyle = puColor;
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        const dSize = cs * 0.3;
        ctx.fillRect(-dSize, -dSize, dSize * 2, dSize * 2);
        ctx.restore();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${Math.max(8, cs * 0.32)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_SYMBOLS[pu.kind], px, py);
      }

      // Snake body (draw tail to head so head is on top)
      const wallPassActive =
        activePowerUp.current && activePowerUp.current.kind === 'wallpass' && activePowerUp.current.endsAt > now;

      for (let i = snake.current.length - 1; i >= 0; i--) {
        const seg = snake.current[i];
        const isHead = i === 0;

        if (isHead) {
          // Head
          ctx.fillStyle = COLORS.snakeHead;
          if (wallPassActive) {
            ctx.globalAlpha = 0.7 + Math.sin(now * 0.008) * 0.15;
          }
          const pad = 0.5;
          ctx.beginPath();
          ctx.roundRect(seg.x * cs + pad, seg.y * cs + pad, cs - pad * 2, cs - pad * 2, 5);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Eyes
          const hx = seg.x * cs + cs / 2;
          const hy = seg.y * cs + cs / 2;
          ctx.fillStyle = COLORS.snakeEye;
          const eyeOff = cs * 0.16;
          const eyeR = cs * 0.09;
          let e1x = hx,
            e1y = hy,
            e2x = hx,
            e2y = hy;
          const d = dir.current;
          if (d === 'RIGHT' || d === 'LEFT') {
            e1x = hx + (d === 'RIGHT' ? cs * 0.18 : -cs * 0.18);
            e2x = e1x;
            e1y = hy - eyeOff;
            e2y = hy + eyeOff;
          } else {
            e1y = hy + (d === 'DOWN' ? cs * 0.18 : -cs * 0.18);
            e2y = e1y;
            e1x = hx - eyeOff;
            e2x = hx + eyeOff;
          }
          ctx.beginPath();
          ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body segment with alternating shade
          ctx.fillStyle = i % 2 === 0 ? COLORS.snakeBody : COLORS.snakeBodyAlt;
          if (wallPassActive) {
            ctx.globalAlpha = 0.55 + Math.sin(now * 0.008 + i * 0.3) * 0.15;
          }
          const fade = Math.max(0.5, 1 - (i / snake.current.length) * 0.4);
          ctx.globalAlpha = (wallPassActive ? ctx.globalAlpha : 1) * fade;
          const pad = 1;
          ctx.beginPath();
          ctx.roundRect(seg.x * cs + pad, seg.y * cs + pad, cs - pad * 2, cs - pad * 2, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Active power-up indicator bar at top
      if (activePowerUp.current && activePowerUp.current.endsAt > now) {
        const remaining = activePowerUp.current.endsAt - now;
        const fraction = remaining / POWERUP_DURATION;
        const barColor = POWERUP_COLORS[activePowerUp.current.kind];
        ctx.fillStyle = barColor + '55';
        ctx.fillRect(0, 0, size, 3);
        ctx.fillStyle = barColor;
        ctx.fillRect(0, 0, size * fraction, 3);
      }

      // Border highlight
      ctx.strokeStyle = '#1f2d3d';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    },
    [canvasSize, cellSize]
  );

  // Flush pending VFX
  const flushVfx = useCallback(() => {
    if (
      pendingVfx.current.particles.length > 0 ||
      pendingVfx.current.pops.length > 0 ||
      pendingVfx.current.shake > 0
    ) {
      setParticles((prev) => [...prev, ...pendingVfx.current.particles]);
      setScorePops((prev) => [...prev, ...pendingVfx.current.pops]);
      if (pendingVfx.current.shake > 0) setShakeIntensity(pendingVfx.current.shake);
      pendingVfx.current = { particles: [], pops: [], shake: 0 };
    }
  }, []);

  // Handle game over
  const handleGameOver = useCallback(
    (now: number) => {
      running.current = false;
      sfxGameOver();
      pendingVfx.current.particles.push(...wrongBurst(canvasSize / 2, canvasSize / 2));
      pendingVfx.current.shake = 8;
      const finalScore = score.current;
      const hs = getHighScore();
      if (finalScore > hs) {
        setHighScore(finalScore);
        setHighScoreState(finalScore);
        pendingVfx.current.particles.push(...confettiBurst(canvasSize / 2, canvasSize / 2));
      }
      flushVfx();
      const elapsed = now - startTime.current;
      onGameEnd?.({
        score: finalScore,
        accuracy: 1.0,
        level: level.current,
        maxScore: Math.max(finalScore, hs),
        timeMs: elapsed,
      });
      setGameState('over');
      draw(now);
    },
    [canvasSize, draw, flushVfx, onGameEnd]
  );

  // Game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!running.current) return;
      if (paused.current) {
        animFrame.current = requestAnimationFrame(gameLoop);
        return;
      }

      const now = performance.now();

      // Check active power-up expiry
      if (activePowerUp.current && activePowerUp.current.endsAt <= now) {
        activePowerUp.current = null;
        recalcSpeed();
        setDisplayPowerUp(null);
      }

      // Check power-up despawn
      if (powerUp.current && now - powerUp.current.spawnedAt > POWERUP_DESPAWN_TIME) {
        powerUp.current = null;
      }

      // Spawn power-up periodically
      if (!powerUp.current && now - lastPowerUpSpawn.current > POWERUP_SPAWN_INTERVAL && foodEaten.current >= 2) {
        spawnPowerUp(now);
        lastPowerUpSpawn.current = now;
      }

      if (timestamp - lastTick.current >= effectiveSpeed.current) {
        lastTick.current = timestamp;

        // Process input queue
        if (inputQueue.current.length > 0) {
          const next = inputQueue.current.shift()!;
          if (next !== opposite[dir.current]) {
            nextDir.current = next;
          }
        }
        dir.current = nextDir.current;

        // Move
        const head = snake.current[0];
        const d = deltas[dir.current];
        let newX = head.x + d.x;
        let newY = head.y + d.y;

        const hasWallPass =
          activePowerUp.current &&
          activePowerUp.current.kind === 'wallpass' &&
          activePowerUp.current.endsAt > now;

        // Wall collision / wrap
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
          if (hasWallPass) {
            // Wrap around
            newX = (newX + GRID_SIZE) % GRID_SIZE;
            newY = (newY + GRID_SIZE) % GRID_SIZE;
          } else {
            handleGameOver(now);
            return;
          }
        }

        const newHead: Point = { x: newX, y: newY };

        // Obstacle collision
        if (obstacleSet.current.has(`${newX},${newY}`)) {
          if (hasWallPass) {
            // Phase through obstacles
          } else {
            handleGameOver(now);
            return;
          }
        }

        // Self collision (check all segments except the tail which will be removed)
        const willGrow =
          newHead.x === food.current.x && newHead.y === food.current.y;
        const bodyToCheck = willGrow
          ? snake.current
          : snake.current.slice(0, -1);
        if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          handleGameOver(now);
          return;
        }

        snake.current.unshift(newHead);

        // Eat food
        if (willGrow) {
          sfxScore();
          const pointsBase = 10 + (level.current - 1) * 2;
          const multiplier =
            activePowerUp.current && activePowerUp.current.kind === 'double' ? 2 : 1;
          const points = pointsBase * multiplier;
          score.current += points;
          snakeLength.current += 1;
          foodEaten.current += 1;

          // Progressive speed
          baseSpeed.current = Math.max(
            MIN_SPEED,
            INITIAL_SPEED - foodEaten.current * SPEED_PER_FOOD
          );
          recalcSpeed();

          // Level up
          const newLevel = Math.floor(foodEaten.current / FOOD_PER_LEVEL) + 1;
          if (newLevel > level.current) {
            level.current = newLevel;
            updateObstacles();
            setDisplayLevel(newLevel);
            // Level up VFX
            pendingVfx.current.particles.push(
              ...burstParticles(canvasSize / 2, canvasSize / 2, '#3498db', 20)
            );
            pendingVfx.current.pops.push(
              createScorePop(canvasSize / 2, canvasSize / 2 - 20, `LVL ${newLevel}`, '#3498db')
            );
          }

          setDisplayScore(score.current);
          setDisplayLength(snakeLength.current);
          setDisplaySpeed(
            Math.max(1, Math.round((1 - (baseSpeed.current - MIN_SPEED) / (INITIAL_SPEED - MIN_SPEED)) * 10))
          );
          spawnFood();

          // VFX
          const foodX = newHead.x * cellSize + cellSize / 2;
          const foodY = newHead.y * cellSize + cellSize / 2;
          pendingVfx.current.particles.push(...correctBurst(foodX, foodY));
          const popText = multiplier > 1 ? `+${points} (x2)` : `+${points}`;
          pendingVfx.current.pops.push(createScorePop(foodX, foodY, popText));
        } else {
          snake.current.pop();
        }

        // Collect power-up
        if (
          powerUp.current &&
          newHead.x === powerUp.current.pos.x &&
          newHead.y === powerUp.current.pos.y
        ) {
          sfxClick();
          const pu = powerUp.current;
          activePowerUp.current = { kind: pu.kind, endsAt: now + POWERUP_DURATION };
          setDisplayPowerUp(POWERUP_LABELS[pu.kind]);
          recalcSpeed();

          // VFX
          const puX = newHead.x * cellSize + cellSize / 2;
          const puY = newHead.y * cellSize + cellSize / 2;
          pendingVfx.current.particles.push(
            ...burstParticles(puX, puY, POWERUP_COLORS[pu.kind], 14)
          );
          pendingVfx.current.pops.push(
            createScorePop(puX, puY, POWERUP_LABELS[pu.kind], POWERUP_COLORS[pu.kind])
          );

          powerUp.current = null;
          lastPowerUpSpawn.current = now;
        }
      }

      flushVfx();
      draw(now);
      animFrame.current = requestAnimationFrame(gameLoop);
    },
    [
      draw,
      spawnFood,
      spawnPowerUp,
      recalcSpeed,
      handleGameOver,
      updateObstacles,
      flushVfx,
      canvasSize,
      cellSize,
    ]
  );

  // Start game
  const startGame = useCallback(() => {
    sfxTap();
    initGame();
    running.current = true;
    paused.current = false;
    startTime.current = performance.now();
    setGameState('playing');
    lastTick.current = performance.now();
    lastPowerUpSpawn.current = performance.now();
    animFrame.current = requestAnimationFrame(gameLoop);
  }, [initGame, gameLoop]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (!running.current) return;
    paused.current = !paused.current;
    if (paused.current) {
      setGameState('paused');
    } else {
      setGameState('playing');
      lastTick.current = performance.now();
    }
    sfxClick();
  }, []);

  // Draw initial state
  useEffect(() => {
    initGame();
    draw(performance.now());
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
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
      w: 'UP',
      s: 'DOWN',
      a: 'LEFT',
      d: 'RIGHT',
      W: 'UP',
      S: 'DOWN',
      A: 'LEFT',
      D: 'RIGHT',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Spacebar pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        } else if (gameState === 'start') {
          startGame();
        }
        return;
      }

      // Escape to go back or unpause
      if (e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'paused') {
          togglePause();
        }
        return;
      }

      const mapped = keyMap[e.key];
      if (!mapped) return;
      e.preventDefault();

      if (gameState === 'start') {
        startGame();
        return;
      }

      if (gameState === 'paused') return;

      if (running.current) {
        // Queue the input to handle fast successive presses
        const lastQueued =
          inputQueue.current.length > 0
            ? inputQueue.current[inputQueue.current.length - 1]
            : dir.current;
        if (mapped !== opposite[lastQueued] && mapped !== lastQueued) {
          inputQueue.current.push(mapped);
          // Keep queue short
          if (inputQueue.current.length > 3) {
            inputQueue.current = inputQueue.current.slice(-3);
          }
        }
        // Also set nextDir for immediate response if queue is first entry
        if (inputQueue.current.length === 1 && mapped !== opposite[dir.current]) {
          nextDir.current = mapped;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, startGame, togglePause]);

  // Touch / swipe controls
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      touchStart.current = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        // Tap
        if (gameState === 'start') {
          startGame();
        } else if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        }
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

      if (gameState === 'paused') return;

      if (running.current && swipeDir !== opposite[dir.current]) {
        nextDir.current = swipeDir;
        inputQueue.current.push(swipeDir);
      }
    },
    [gameState, startGame, togglePause]
  );

  const speedDisplay = displaySpeed || 1;

  const styles: Record<string, React.CSSProperties> = {
    card: {
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 14,
      padding: 14,
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      maxWidth: '100%',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: 8,
      flexWrap: 'wrap',
    },
    backBtn: {
      background: 'none',
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 8,
      color: COLORS.muted,
      fontSize: 13,
      padding: '3px 10px',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    },
    stat: {
      color: COLORS.muted,
      fontSize: 11,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      lineHeight: 1.2,
      minWidth: 36,
    },
    statValue: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: 600,
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
      background: COLORS.pauseOverlay,
      gap: 14,
    },
    overlayTitle: {
      color: COLORS.text,
      fontSize: 26,
      fontWeight: 700,
      margin: 0,
    },
    overlayText: {
      color: COLORS.muted,
      fontSize: 14,
      margin: 0,
      textAlign: 'center',
      lineHeight: 1.5,
      maxWidth: '80%',
    },
    playBtn: {
      background: COLORS.snakeHead,
      color: '#0f161e',
      border: 'none',
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 600,
      padding: '9px 28px',
      cursor: 'pointer',
    },
    finalScore: {
      color: COLORS.snakeHead,
      fontSize: 44,
      fontWeight: 600,
      margin: 0,
      lineHeight: 1,
    },
    powerUpBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.03em',
    },
  };

  // Active power-up badge color
  const puBadgeColor = displayPowerUp
    ? activePowerUp.current
      ? POWERUP_COLORS[activePowerUp.current.kind]
      : COLORS.muted
    : COLORS.muted;

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.card,
        position: 'relative' as const,
        overflow: 'hidden',
        ...screenShakeStyle(shakeIntensity),
      }}
    >
      {/* Header HUD */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          Back
        </button>
        <div style={styles.stat}>
          <span>SCORE</span>
          <span style={styles.statValue}>{displayScore}</span>
        </div>
        <div style={styles.stat}>
          <span>LEN</span>
          <span style={styles.statValue}>{displayLength}</span>
        </div>
        <div style={styles.stat}>
          <span>LVL</span>
          <span style={styles.statValue}>{displayLevel}</span>
        </div>
        <div style={styles.stat}>
          <span>SPD</span>
          <span style={styles.statValue}>{speedDisplay}</span>
        </div>
        <div style={styles.stat}>
          <span style={{ color: COLORS.food }}>BEST</span>
          <span style={{ ...styles.statValue, color: COLORS.food }}>{highScore}</span>
        </div>
      </div>

      {/* Active power-up bar */}
      {displayPowerUp && (
        <div
          style={{
            ...styles.powerUpBadge,
            background: puBadgeColor + '22',
            color: puBadgeColor,
            border: `1px solid ${puBadgeColor}44`,
          }}
        >
          {displayPowerUp} ACTIVE
        </div>
      )}

      {/* Canvas */}
      <div style={styles.canvasWrap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
              Arrow keys or swipe to move.
              <br />
              Spacebar to pause. Collect power-ups!
              <br />
              Every {FOOD_PER_LEVEL} food = new level with obstacles.
            </p>
            <button style={styles.playBtn} onClick={startGame}>
              Play
            </button>
          </div>
        )}

        {/* Paused overlay */}
        {gameState === 'paused' && (
          <div style={styles.overlay}>
            <p style={styles.overlayTitle}>Paused</p>
            <p style={styles.overlayText}>
              Press Space or tap to resume
            </p>
            <button style={styles.playBtn} onClick={togglePause}>
              Resume
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === 'over' && (
          <div style={styles.overlay}>
            <p style={{ ...styles.overlayText, fontSize: 13, letterSpacing: '0.1em' }}>
              GAME OVER
            </p>
            <p style={styles.finalScore}>{displayScore}</p>
            <div style={{ display: 'flex', gap: 16, color: COLORS.muted, fontSize: 13 }}>
              <span>Level {displayLevel}</span>
              <span>Length {displayLength}</span>
            </div>
            <p style={{ ...styles.overlayText, fontSize: 13 }}>
              {displayScore >= highScore && displayScore > 0 ? 'New high score!' : `Best: ${highScore}`}
            </p>
            <button style={styles.playBtn} onClick={startGame}>
              Play Again
            </button>
          </div>
        )}

        {/* VFX particles & score pops */}
        {particles.map((p) => (
          <div key={p.id} style={renderParticleStyle(p)} />
        ))}
        {scorePops.map((pop) => (
          <div key={pop.id} style={scorePopStyle(pop)}>
            {pop.text}
          </div>
        ))}
      </div>
    </div>
  );
}
