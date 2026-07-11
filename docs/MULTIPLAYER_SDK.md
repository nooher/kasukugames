# KasukuGames Multiplayer SDK (`useLiveRoom`)

Real-time multiplayer for **any** game, over Supabase Realtime — no extra servers.
Extracted from the proven `LiveParty` implementation so new games don't re-invent
netcode. Source: [`src/lib/useLiveRoom.ts`](../src/lib/useLiveRoom.ts). Transport:
[`src/lib/liveRoom.ts`](../src/lib/liveRoom.ts).

## Model

- **Host-authoritative.** One player (the host) holds the authoritative game state and
  broadcasts it; guests render it and send *actions* back.
- **Automatic host migration.** The present player with the lowest id is host. If the
  host drops, the next player is promoted automatically and re-broadcasts state.
- **Presence roster.** `players` is the live list of who's in the room right now.
- **You write a reducer,** not networking: `(state, action, fromId) => nextState`.

## Usage

```tsx
import { useLiveRoom } from '../lib/useLiveRoom'

type S = { turn: string; scores: Record<string, number> }

function MyGame({ me, code, isHost, onExit }: Props) {
  const room = useLiveRoom<S>({
    code, me, isHost,
    initialState: { turn: '', scores: {} },
    // host-side only — applies a guest (or local) action to authoritative state
    reducer: (state, action, fromId) => {
      if (action.type === 'score') {
        return { ...state, scores: { ...state.scores, [fromId]: (state.scores[fromId] ?? 0) + 1 } }
      }
      return state
    },
    onReaction: (emoji) => spawnFloat(emoji),
  })

  // Everyone reads room.state (kept in sync). Anyone calls room.act(...) — it routes to
  // the host, applies through the reducer, and the new state fans back out.
  return (
    <>
      <div>{room.status} · {room.players.length} online · host: {String(room.isHost)}</div>
      <button onClick={() => room.act({ type: 'score' })}>+1</button>
      {room.isHost && <button onClick={() => room.setState({ turn: '', scores: {} })}>Reset</button>}
      <button onClick={() => { room.leave(); onExit() }}>Exit</button>
    </>
  )
}
```

### API

| Field | Who | What |
|---|---|---|
| `players` | all | live roster (`LivePlayer[]`, stable order) |
| `status` | all | `connecting \| connected \| error` |
| `isHost` | all | computed with migration |
| `state` | all | authoritative game state `S` |
| `setState(next)` | host | replace + broadcast state (no-op for guests) |
| `act(action)` | all | send an action to the host (host applies immediately) |
| `react(emoji)` / `chat(name,text)` | all | side channels (`onReaction`/`onChat`) |
| `send(t,d)` | all | raw broadcast escape hatch |
| `leave()` | all | disconnect |

## Porting an existing pass-and-play game to networked

Today CouplesQuiz, GuessWhat, NeverHaveIEver, SpinTheBottle, DraftChase are single-device
(pass-and-play). To make one truly networked:

1. **Model the shared state as one object `S`** (whose turn, current question index,
   per-player answers/scores, phase). Most games already have this as local `useState`.
2. **Replace local state with `room.state`;** move mutations into the `reducer`.
   - Host actions (start, next question, reveal) → `room.setState(...)`.
   - Guest actions (submit answer, vote, guess) → `room.act({ type, payload })`, handled
     in the reducer.
3. **Launch through the live-room path** (`setLive({ code, isHost, game })`) instead of
   `setActiveGame`, and add a render branch that mounts the game with `useLiveRoom`.
4. **Seed players from presence** (`room.players`) instead of the name-entry / add-players
   screen — the invite already knows who's playing (see the `duo` prop for the
   pass-and-play shortcut this replaces).

`LiveParty` is the full reference: it does exactly this for ~15 mini-games inline; the
hook is that pattern generalized so each game is ~100 lines of game logic + a reducer,
with zero networking code.

## Status

- ✅ SDK primitive shipped and type-safe; generalizes the production `LiveParty` netcode.
- ⏳ Porting the pass-and-play couples games onto it is the next incremental program
  (one game at a time, each independently shippable).
- ⚠️ Anti-cheat for live gameplay: the host broadcast is trusted. Server-authoritative
  match results (validated round outcomes) build on the anti-cheat RPCs already shipped
  for the leaderboards and are the companion workstream to this SDK.
