import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Dice5, Home, Building2, Coins, Crown, RotateCcw } from 'lucide-react';
import { sfxTap, sfxClick, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxScore } from '../lib/sfx';

/* ═══════════════════════════════════════════════════════════════════════
   Monopoly — "Mji Wangu"  ·  hot-seat 2–4 players, Tanzania-themed board.
   Buy properties, build houses & hotels, collect rent, bankrupt rivals.
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

const C = {
  obsidian: '#0b0f14', ink: '#111820', slate: '#1a2230', surface: '#151d2b',
  emerald: '#00c97b', teal: '#00b4d8', amber: '#f59e0b', rose: '#f43f5e',
  white: '#f0f4f8', muted: '#7a8ba0', dim: '#3d4f63', border: '#1f2d3d',
};

const GROUP_COLORS: Record<string, string> = {
  brown: '#8b5a2b', lblue: '#8ecae6', pink: '#e05780', orange: '#f77f00',
  red: '#e63946', yellow: '#f4d35e', green: '#2a9d8f', dblue: '#1d3557',
  rail: '#4a4e69', util: '#5f6c7b',
};

type SpaceType = 'go' | 'prop' | 'rail' | 'util' | 'chance' | 'chest' | 'tax' | 'jail' | 'gotojail' | 'parking';
interface Space {
  i: number; type: SpaceType; name: string;
  group?: string; price?: number; rent?: number[]; house?: number; tax?: number;
}

// Rent arrays: [base, 1 house, 2, 3, 4, hotel]
const BOARD: Space[] = [
  { i: 0, type: 'go', name: 'GO' },
  { i: 1, type: 'prop', name: 'Kariakoo', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], house: 50 },
  { i: 2, type: 'chest', name: 'Chest' },
  { i: 3, type: 'prop', name: 'Ilala', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], house: 50 },
  { i: 4, type: 'tax', name: 'Income Tax', tax: 200 },
  { i: 5, type: 'rail', name: 'Central Line', price: 200 },
  { i: 6, type: 'prop', name: 'Kinondoni', group: 'lblue', price: 100, rent: [6, 30, 90, 270, 400, 550], house: 50 },
  { i: 7, type: 'chance', name: 'Chance' },
  { i: 8, type: 'prop', name: 'Magomeni', group: 'lblue', price: 100, rent: [6, 30, 90, 270, 400, 550], house: 50 },
  { i: 9, type: 'prop', name: 'Ubungo', group: 'lblue', price: 120, rent: [8, 40, 100, 300, 450, 600], house: 50 },
  { i: 10, type: 'jail', name: 'JAIL' },
  { i: 11, type: 'prop', name: 'Temeke', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], house: 100 },
  { i: 12, type: 'util', name: 'TANESCO', price: 150 },
  { i: 13, type: 'prop', name: 'Mbagala', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], house: 100 },
  { i: 14, type: 'prop', name: "Chang'ombe", group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], house: 100 },
  { i: 15, type: 'rail', name: 'TAZARA', price: 200 },
  { i: 16, type: 'prop', name: 'Mikocheni', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], house: 100 },
  { i: 17, type: 'chest', name: 'Chest' },
  { i: 18, type: 'prop', name: 'Msasani', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], house: 100 },
  { i: 19, type: 'prop', name: 'Kijitonyama', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], house: 100 },
  { i: 20, type: 'parking', name: 'Free Parking' },
  { i: 21, type: 'prop', name: 'Masaki', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], house: 150 },
  { i: 22, type: 'chance', name: 'Chance' },
  { i: 23, type: 'prop', name: 'Oyster Bay', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], house: 150 },
  { i: 24, type: 'prop', name: 'Upanga', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], house: 150 },
  { i: 25, type: 'rail', name: 'SGR', price: 200 },
  { i: 26, type: 'prop', name: 'Mwanza', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], house: 150 },
  { i: 27, type: 'prop', name: 'Arusha', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], house: 150 },
  { i: 28, type: 'util', name: 'DAWASA', price: 150 },
  { i: 29, type: 'prop', name: 'Moshi', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], house: 150 },
  { i: 30, type: 'gotojail', name: 'Go to Jail' },
  { i: 31, type: 'prop', name: 'Dodoma', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], house: 200 },
  { i: 32, type: 'prop', name: 'Morogoro', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], house: 200 },
  { i: 33, type: 'chest', name: 'Chest' },
  { i: 34, type: 'prop', name: 'Mbeya', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], house: 200 },
  { i: 35, type: 'rail', name: 'Bandari', price: 200 },
  { i: 36, type: 'chance', name: 'Chance' },
  { i: 37, type: 'prop', name: 'Zanzibar', group: 'dblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], house: 200 },
  { i: 38, type: 'tax', name: 'Luxury Tax', tax: 100 },
  { i: 39, type: 'prop', name: 'Serengeti', group: 'dblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], house: 200 },
];

const GROUP_SIZE: Record<string, number> = { brown: 2, lblue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3, dblue: 2 };
const TOKENS = ['🦜', '🦁', '🐘', '🦒'];
const TOKEN_COLORS = [C.emerald, C.amber, C.teal, C.rose];

interface Card { text: string; act: (g: GameState, pid: number) => Partial<PlayerPatch> & { move?: number; toJail?: boolean; msg?: string }; }
interface PlayerPatch { cash?: number; }

const CHANCE: Card[] = [
  { text: 'Advance to GO — collect TSh 200.', act: () => ({ move: 0, msg: 'Moved to GO (+200)' }) },
  { text: 'Bank pays you a dividend of TSh 150.', act: () => ({ cash: 150, msg: '+TSh 150 dividend' }) },
  { text: 'Speeding fine — pay TSh 100.', act: () => ({ cash: -100, msg: '−TSh 100 fine' }) },
  { text: 'Go directly to JAIL.', act: () => ({ toJail: true, msg: 'Sent to Jela' }) },
  { text: 'Building repairs — pay TSh 120.', act: () => ({ cash: -120, msg: '−TSh 120 repairs' }) },
  { text: 'You won a talent show — collect TSh 200.', act: () => ({ cash: 200, msg: '+TSh 200 prize' }) },
];
const CHEST: Card[] = [
  { text: 'Harvest bonus — collect TSh 100.', act: () => ({ cash: 100, msg: '+TSh 100' }) },
  { text: 'Hospital fees — pay TSh 100.', act: () => ({ cash: -100, msg: '−TSh 100' }) },
  { text: 'Inheritance — collect TSh 200.', act: () => ({ cash: 200, msg: '+TSh 200' }) },
  { text: 'School fees — pay TSh 150.', act: () => ({ cash: -150, msg: '−TSh 150' }) },
  { text: 'Advance to GO — collect TSh 200.', act: () => ({ move: 0, msg: 'Moved to GO' }) },
  { text: 'Community award — collect TSh 100.', act: () => ({ cash: 100, msg: '+TSh 100 award' }) },
];

interface Player { id: number; name: string; pos: number; cash: number; jail: number; bankrupt: boolean; }
interface GameState { players: Player[]; owner: Record<number, number>; houses: Record<number, number>; }

/* perimeter position → 11×11 grid cell */
function cell(i: number): { r: number; c: number } {
  if (i <= 10) return { r: 11, c: 11 - i };
  if (i <= 20) return { r: 11 - (i - 10), c: 1 };
  if (i <= 30) return { r: 1, c: 1 + (i - 20) };
  return { r: 1 + (i - 30), c: 11 };
}

const money = (n: number) => 'TSh ' + n.toLocaleString();

export default function Monopoly({ onBack, onGameEnd }: Props) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [started, setStarted] = useState(false);
  const [g, setG] = useState<GameState>({ players: [], owner: {}, houses: {} });
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [rolled, setRolled] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [pending, setPending] = useState<null | { kind: 'buy'; space: Space } | { kind: 'card'; text: string }>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [doubles, setDoubles] = useState(0);

  const push = useCallback((m: string) => setLog(l => [m, ...l].slice(0, 6)), []);

  const start = () => {
    sfxLevelUp();
    const players: Player[] = Array.from({ length: numPlayers }, (_, id) => ({
      id, name: `${TOKENS[id]} Player ${id + 1}`, pos: 0, cash: 1500, jail: 0, bankrupt: false,
    }));
    setG({ players, owner: {}, houses: {} });
    setTurn(0); setDice(null); setRolled(false); setLog(['Game on — first to bankrupt the rest wins.']); setWinner(null); setDoubles(0);
    setStarted(true);
  };

  const cur = g.players[turn];

  const netWorth = useCallback((p: Player, st: GameState) => {
    let w = p.cash;
    for (const [sp, oid] of Object.entries(st.owner)) {
      if (oid === p.id) { const s = BOARD[+sp]; w += (s.price || 0) + (st.houses[+sp] || 0) * (s.house || 0); }
    }
    return w;
  }, []);

  const ownedInGroup = (st: GameState, pid: number, group: string) =>
    BOARD.filter(s => s.group === group && st.owner[s.i] === pid).length;

  const railsOwned = (st: GameState, pid: number) => BOARD.filter(s => s.type === 'rail' && st.owner[s.i] === pid).length;
  const utilsOwned = (st: GameState, pid: number) => BOARD.filter(s => s.type === 'util' && st.owner[s.i] === pid).length;

  const rentFor = (st: GameState, s: Space, roll: number): number => {
    const oid = st.owner[s.i];
    if (oid === undefined) return 0;
    if (s.type === 'rail') return [0, 25, 50, 100, 200][railsOwned(st, oid)];
    if (s.type === 'util') return roll * (utilsOwned(st, oid) === 2 ? 10 : 4);
    const h = st.houses[s.i] || 0;
    if (h > 0) return s.rent![h];
    // full monopoly with no houses → double base rent
    const full = ownedInGroup(st, oid, s.group!) === GROUP_SIZE[s.group!];
    return s.rent![0] * (full ? 2 : 1);
  };

  const checkWin = (st: GameState) => {
    const alive = st.players.filter(p => !p.bankrupt);
    if (alive.length === 1 && st.players.length > 1) {
      sfxGameOver();
      setWinner(alive[0]);
      onGameEnd?.({ score: Math.max(0, netWorth(alive[0], st)), accuracy: 1, level: 1, maxScore: 5000 });
      return true;
    }
    return false;
  };

  const settleLanding = (st: GameState, pid: number, roll: number): GameState => {
    const p = st.players[pid];
    const s = BOARD[p.pos];
    let next = st;
    if (s.type === 'prop' || s.type === 'rail' || s.type === 'util') {
      const oid = st.owner[s.i];
      if (oid === undefined) {
        setPending({ kind: 'buy', space: s });
      } else if (oid !== pid) {
        const rent = rentFor(st, s, roll);
        sfxWrong();
        const players = st.players.map(pl =>
          pl.id === pid ? { ...pl, cash: pl.cash - rent } : pl.id === oid ? { ...pl, cash: pl.cash + rent } : pl);
        push(`${p.name} paid ${money(rent)} rent to ${st.players[oid].name}`);
        next = { ...st, players };
      }
    } else if (s.type === 'tax') {
      sfxWrong();
      next = { ...st, players: st.players.map(pl => pl.id === pid ? { ...pl, cash: pl.cash - (s.tax || 0) } : pl) };
      push(`${p.name} paid ${money(s.tax || 0)} — ${s.name}`);
    } else if (s.type === 'chance' || s.type === 'chest') {
      const deck = s.type === 'chance' ? CHANCE : CHEST;
      const card = deck[Math.floor(Math.random() * deck.length)];
      const res = card.act(st, pid);
      setPending({ kind: 'card', text: card.text });
      let players = st.players.map(pl => pl.id === pid ? { ...pl, cash: pl.cash + (res.cash || 0) } : pl);
      if (res.toJail) players = players.map(pl => pl.id === pid ? { ...pl, pos: 10, jail: 3 } : pl);
      if (res.move !== undefined) {
        const passedGo = res.move < players[pid].pos;
        players = players.map(pl => pl.id === pid ? { ...pl, pos: res.move!, cash: pl.cash + (passedGo ? 200 : 0) } : pl);
      }
      push(`${p.name} — ${res.msg || card.text}`);
      next = { ...st, players };
    } else if (s.type === 'gotojail') {
      sfxWrong();
      next = { ...st, players: st.players.map(pl => pl.id === pid ? { ...pl, pos: 10, jail: 3 } : pl) };
      push(`${p.name} sent to Jela!`);
    }
    // bankruptcy
    next = { ...next, players: next.players.map(pl => (pl.cash < 0 && !pl.bankrupt) ? { ...pl, bankrupt: true, cash: 0 } : pl) };
    if (next.players[pid].bankrupt) {
      // release properties
      const owner = { ...next.owner }; const houses = { ...next.houses };
      for (const k of Object.keys(owner)) if (owner[+k] === pid) { delete owner[+k]; delete houses[+k]; }
      next = { ...next, owner, houses };
      push(`${p.name} is bankrupt — out of the game.`);
    }
    return next;
  };

  const roll = () => {
    if (rolled || !cur || cur.bankrupt) return;
    const d: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    setDice(d); sfxTap();
    const p = cur;
    // jail handling
    if (p.jail > 0) {
      if (d[0] === d[1]) { push(`${p.name} rolled doubles — out of Jela!`); }
      else {
        setG(st => ({ ...st, players: st.players.map(pl => pl.id === p.id ? { ...pl, jail: pl.jail - 1, cash: pl.jail === 1 ? pl.cash - 50 : pl.cash } : pl) }));
        setRolled(true);
        push(p.jail === 1 ? `${p.name} paid TSh 50 bail.` : `${p.name} stays in Jela.`);
        return;
      }
    }
    const total = d[0] + d[1];
    const isDouble = d[0] === d[1];
    setG(st => {
      const oldPos = st.players[p.id].pos;
      const newPos = (oldPos + total) % 40;
      const passedGo = newPos < oldPos;
      let next = { ...st, players: st.players.map(pl => pl.id === p.id ? { ...pl, pos: newPos, jail: 0, cash: pl.cash + (passedGo ? 200 : 0) } : pl) };
      if (passedGo) { sfxScore(); push(`${p.name} passed GO (+TSh 200)`); }
      next = settleLanding(next, p.id, total);
      checkWin(next);
      return next;
    });
    if (isDouble) { setDoubles(x => x + 1); }
    setRolled(true);
  };

  const buy = (yes: boolean) => {
    if (!pending || pending.kind !== 'buy' || !cur) return;
    const s = pending.space;
    if (yes && cur.cash >= (s.price || 0)) {
      sfxCorrect();
      setG(st => ({ ...st, owner: { ...st.owner, [s.i]: cur.id }, players: st.players.map(pl => pl.id === cur.id ? { ...pl, cash: pl.cash - (s.price || 0) } : pl) }));
      push(`${cur.name} bought ${s.name} for ${money(s.price || 0)}`);
    } else { sfxClick(); push(`${s.name} left unsold.`); }
    setPending(null);
  };

  const build = (spaceI: number) => {
    if (!cur) return;
    const s = BOARD[spaceI];
    setG(st => {
      if (st.owner[spaceI] !== cur.id) return st;
      if (ownedInGroup(st, cur.id, s.group!) !== GROUP_SIZE[s.group!]) return st;
      const h = st.houses[spaceI] || 0;
      if (h >= 5 || cur.cash < (s.house || 0)) return st;
      sfxLevelUp();
      push(`${cur.name} built on ${s.name} (${h + 1 === 5 ? 'Hotel' : 'House ' + (h + 1)})`);
      return { ...st, houses: { ...st.houses, [spaceI]: h + 1 }, players: st.players.map(pl => pl.id === cur.id ? { ...pl, cash: pl.cash - (s.house || 0) } : pl) };
    });
  };

  const endTurn = () => {
    if (pending) return;
    sfxClick();
    const isDouble = dice && dice[0] === dice[1];
    setDice(null); setRolled(false);
    if (isDouble && doubles < 3 && cur && !cur.bankrupt && cur.jail === 0) { push(`${cur.name} rolled doubles — roll again!`); return; }
    setDoubles(0);
    setTurn(t => {
      let n = t;
      for (let k = 0; k < g.players.length; k++) { n = (n + 1) % g.players.length; if (!g.players[n].bankrupt) break; }
      return n;
    });
  };

  const buildable = useMemo(() => {
    if (!cur) return [] as Space[];
    return BOARD.filter(s => s.type === 'prop' && g.owner[s.i] === cur.id && ownedInGroup(g, cur.id, s.group!) === GROUP_SIZE[s.group!] && (g.houses[s.i] || 0) < 5);
  }, [g, cur]);

  /* ── setup screen ── */
  if (!started) {
    return (
      <div style={wrap}>
        <Header onBack={onBack} title="Monopoly" sub="Mji Wangu" />
        <div style={{ maxWidth: 460, margin: '0 auto', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 54, marginBottom: 8 }}>🏙️</div>
          <h2 style={{ color: C.white, fontSize: 26, margin: '0 0 8px' }}>Build your empire</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Buy Tanzanian neighbourhoods, build houses & hotels, collect rent, and bankrupt your rivals. Pass GO to collect TSh 200. Hot-seat — pass the device each turn.
          </p>
          <p style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Players</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => { sfxTap(); setNumPlayers(n); }} style={{ ...pill, background: numPlayers === n ? C.emerald : C.surface, color: numPlayers === n ? C.obsidian : C.white, borderColor: numPlayers === n ? C.emerald : C.border }}>
                {n} {TOKENS.slice(0, n).join('')}
              </button>
            ))}
          </div>
          <button onClick={start} style={{ ...cta, width: '100%' }}><Dice5 size={18} /> Start game</button>
        </div>
      </div>
    );
  }

  /* ── winner screen ── */
  if (winner) {
    return (
      <div style={wrap}>
        <Header onBack={onBack} title="Monopoly" sub="Mji Wangu" />
        <div style={{ maxWidth: 420, margin: '0 auto', padding: 24, textAlign: 'center' }}>
          <Crown size={56} color={C.amber} style={{ margin: '12px auto' }} />
          <h2 style={{ color: C.white, fontSize: 28, margin: '0 0 4px' }}>{winner.name} wins!</h2>
          <p style={{ color: C.muted, marginBottom: 6 }}>Last tycoon standing.</p>
          <p style={{ color: C.emerald, fontSize: 22, fontWeight: 800, marginBottom: 26 }}>{money(netWorth(winner, g))} net worth</p>
          <button onClick={start} style={{ ...cta, width: '100%', marginBottom: 10 }}><RotateCcw size={18} /> Play again</button>
          <button onClick={onBack} style={{ ...ghost, width: '100%' }}>Back to games</button>
        </div>
      </div>
    );
  }

  /* ── board ── */
  return (
    <div style={wrap}>
      <Header onBack={onBack} title="Monopoly" sub="Mji Wangu" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4px 12px 24px' }}>
        {/* players bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {g.players.map(p => (
            <div key={p.id} style={{ flex: '1 1 120px', background: p.id === turn ? C.slate : C.ink, border: `1px solid ${p.id === turn ? TOKEN_COLORS[p.id] : C.border}`, borderRadius: 12, padding: '8px 10px', opacity: p.bankrupt ? 0.4 : 1 }}>
              <div style={{ fontSize: 13, color: C.white, fontWeight: 700 }}>{p.name}{p.jail > 0 ? ' 🔒' : ''}</div>
              <div style={{ fontSize: 13, color: p.cash < 200 ? C.rose : C.emerald, fontWeight: 800 }}>{p.bankrupt ? 'Bankrupt' : money(p.cash)}</div>
            </div>
          ))}
        </div>

        {/* the board grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, minmax(0,1fr))', gap: 2, aspectRatio: '1', background: C.border, border: `2px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          {BOARD.map(s => {
            const { r, c } = cell(s.i);
            const oid = g.owner[s.i];
            const here = g.players.filter(p => p.pos === s.i && !p.bankrupt);
            const gc = s.group ? GROUP_COLORS[s.group] : s.type === 'rail' ? GROUP_COLORS.rail : s.type === 'util' ? GROUP_COLORS.util : 'transparent';
            const h = g.houses[s.i] || 0;
            return (
              <div key={s.i} style={{ gridRow: r, gridColumn: c, background: C.ink, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, fontSize: 6.5, lineHeight: 1.05, padding: 1, borderTop: gc !== 'transparent' ? `3px solid ${gc}` : undefined, boxShadow: oid !== undefined ? `inset 0 0 0 1.5px ${TOKEN_COLORS[oid]}` : undefined }}>
                <span style={{ color: C.muted, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                {s.price ? <span style={{ color: C.dim }}>{s.price}</span> : null}
                {h > 0 && <span style={{ color: C.emerald, fontSize: 7 }}>{h === 5 ? '🏨' : '🏠'.repeat(h)}</span>}
                <div style={{ position: 'absolute', bottom: 1, right: 1, display: 'flex', gap: 1 }}>
                  {here.map(p => <span key={p.id} style={{ fontSize: 9 }}>{TOKENS[p.id]}</span>)}
                </div>
              </div>
            );
          })}
          {/* center panel */}
          <div style={{ gridRow: '2 / 11', gridColumn: '2 / 11', background: C.obsidian, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, letterSpacing: 2, textTransform: 'uppercase' }}>{cur?.name}'s turn</div>
            {dice && <div style={{ display: 'flex', gap: 10 }}>{dice.map((d, i) => <div key={i} style={{ width: 38, height: 38, borderRadius: 8, background: C.white, color: C.obsidian, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800 }}>{d}</div>)}</div>}
            {!rolled && <button onClick={roll} style={cta}><Dice5 size={18} /> Roll dice</button>}
            {rolled && !pending && <button onClick={endTurn} style={cta}>End turn</button>}
            {pending?.kind === 'buy' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: C.white, fontSize: 14, marginBottom: 8 }}>Buy <b>{pending.space.name}</b> for {money(pending.space.price || 0)}?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => buy(true)} style={{ ...cta, padding: '8px 16px' }}><Coins size={15} /> Buy</button>
                  <button onClick={() => buy(false)} style={{ ...ghost, padding: '8px 16px' }}>Pass</button>
                </div>
              </div>
            )}
            {pending?.kind === 'card' && (
              <div style={{ textAlign: 'center', maxWidth: 200 }}>
                <div style={{ color: C.amber, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Card</div>
                <div style={{ color: C.white, fontSize: 13, marginBottom: 10 }}>{pending.text}</div>
                <button onClick={() => setPending(null)} style={{ ...cta, padding: '8px 16px' }}>OK</button>
              </div>
            )}
          </div>
        </div>

        {/* build houses */}
        {buildable.length > 0 && !pending && (
          <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 12, marginBottom: 8 }}><Building2 size={14} /> Build on your monopolies</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {buildable.map(s => (
                <button key={s.i} onClick={() => build(s.i)} disabled={(cur?.cash || 0) < (s.house || 0)} style={{ ...pill, padding: '7px 12px', fontSize: 12, background: C.surface, color: C.white, borderColor: C.border, opacity: (cur?.cash || 0) < (s.house || 0) ? 0.4 : 1 }}>
                  <Home size={12} /> {s.name} · {money(s.house || 0)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* log */}
        <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          {log.map((l, i) => <div key={i} style={{ color: i === 0 ? C.white : C.dim, fontSize: 12, padding: '2px 0' }}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ── shared bits ── */
function Header({ onBack, title, sub }: { onBack: () => void; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.obsidian, zIndex: 5 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} /></button>
      <div><div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>{title}</div><div style={{ color: C.muted, fontSize: 11 }}>{sub}</div></div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '100%', background: C.obsidian, color: C.white, fontFamily: 'Inter, system-ui, sans-serif' };
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: C.emerald, color: C.obsidian, border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer' };
const ghost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.surface, color: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const pill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
