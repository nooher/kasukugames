import { supabase } from './kasuku-bridge'
import { loadProfile, saveProfile, type PlayerProfile } from './rewards'
import { loadWallet, saveWallet, type TokenWallet } from './tokens'

// ── Cloud-synced player data ─────────────────────────────────────────────────
// Player state (profile, wallet, records, purchases) lives in localStorage for
// offline use, but that means switching device / clearing cache wipes everything.
// This mirrors it to the kg_players table (keyed by auth.uid()) and reconciles on
// sign-in so progress follows the account across devices.
//
// Reconciliation is deliberately simple and safe for v1: whichever snapshot has more
// XP wins wholesale (ties broken by total_games, then wallet earned). One user rarely
// plays two devices at the same second, so this gives continuity without a stale
// device silently lowering progress. A truly authoritative economy/anti-cheat layer
// is a separate piece of work. Everything degrades gracefully to local-only if the
// user is signed out or the table isn't there yet.

const RECORDS_KEY = 'kg_records'
const PURCHASES_KEY = 'kg_purchases'

interface CloudRow {
  id: string
  handle: string | null
  xp: number
  total_games: number
  profile: PlayerProfile | null
  wallet: TokenWallet | null
  records: Record<string, unknown> | null
  purchases: unknown[] | null
  updated_at: string
}

export interface Snapshot {
  profile: PlayerProfile | null
  wallet: TokenWallet | null
  records: Record<string, unknown>
  purchases: unknown[]
  xp: number
  total_games: number
}

async function sessionUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id ?? null
  } catch { return null }
}

function readLocal(): Snapshot {
  const profile = loadProfile()
  const wallet = loadWallet()
  let records: Record<string, unknown> = {}
  let purchases: unknown[] = []
  try { records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}') } catch { /* ignore */ }
  try { purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]') } catch { /* ignore */ }
  return { profile, wallet, records, purchases, xp: profile?.xp ?? 0, total_games: profile?.totalGames ?? 0 }
}

function writeLocal(s: Snapshot) {
  if (s.profile) saveProfile(s.profile)
  if (s.wallet) saveWallet(s.wallet)
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(s.records || {})) } catch { /* ignore */ }
  try { localStorage.setItem(PURCHASES_KEY, JSON.stringify(s.purchases || [])) } catch { /* ignore */ }
}

// Higher XP wins; ties → more games, then more tokens earned, then whichever we were
// told to prefer (the server, for cross-device freshness).
function better(a: Snapshot, b: Snapshot, preferBOnTie: boolean): Snapshot {
  if (a.xp !== b.xp) return a.xp > b.xp ? a : b
  if (a.total_games !== b.total_games) return a.total_games > b.total_games ? a : b
  const ae = a.wallet?.totalEarned ?? 0, be = b.wallet?.totalEarned ?? 0
  if (ae !== be) return ae > be ? a : b
  return preferBOnTie ? b : a
}

function rowToSnapshot(r: CloudRow): Snapshot {
  return {
    profile: r.profile && Object.keys(r.profile).length ? r.profile : null,
    wallet: r.wallet && Object.keys(r.wallet).length ? r.wallet : null,
    records: r.records || {},
    purchases: r.purchases || [],
    xp: r.xp ?? r.profile?.xp ?? 0,
    total_games: r.total_games ?? r.profile?.totalGames ?? 0,
  }
}

async function pushSnapshot(uid: string, s: Snapshot): Promise<boolean> {
  try {
    const { error } = await supabase.from('kg_players').upsert({
      id: uid,
      handle: s.profile?.username ?? null,
      xp: s.xp,
      total_games: s.total_games,
      profile: s.profile ?? {},
      wallet: s.wallet ?? {},
      records: s.records ?? {},
      purchases: s.purchases ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    return !error
  } catch { return false }
}

// Call once after sign-in / session restore. Reconciles local vs cloud and returns the
// winning profile/wallet so the app can update its state; also writes the winner to
// localStorage and pushes it up. Returns null if signed out / table missing / no change.
export async function syncPlayerOnLogin(): Promise<{ profile: PlayerProfile | null; wallet: TokenWallet | null } | null> {
  const uid = await sessionUserId()
  if (!uid) return null
  const local = readLocal()
  try {
    const { data, error } = await supabase.from('kg_players').select('*').eq('id', uid).maybeSingle()
    if (error) { // table missing or transient — keep local, best-effort push
      await pushSnapshot(uid, local)
      return null
    }
    if (!data) { // first time on the cloud — migrate local up
      await pushSnapshot(uid, local)
      return null
    }
    const cloud = rowToSnapshot(data as CloudRow)
    const winner = better(local, cloud, /* preferBOnTie */ true)
    // Always keep the live session's identity (id/username) from the real profile.
    if (winner === cloud && local.profile && winner.profile) {
      winner.profile = { ...winner.profile, id: local.profile.id, username: local.profile.username }
    }
    writeLocal(winner)
    // Make sure both sides converge on the winner.
    await pushSnapshot(uid, winner)
    return { profile: winner.profile, wallet: winner.wallet }
  } catch {
    return null
  }
}

// Debounced background push for ongoing changes (xp, wallet, records, purchases).
let pushTimer: ReturnType<typeof setTimeout> | null = null
export function schedulePlayerPush(delayMs = 2500) {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    const uid = await sessionUserId()
    if (!uid) return
    await pushSnapshot(uid, readLocal())
  }, delayMs)
}

// Flush immediately (e.g. on tab hide) so nothing is lost if the debounce hasn't fired.
export async function flushPlayerPush() {
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null }
  const uid = await sessionUserId()
  if (!uid) return
  await pushSnapshot(uid, readLocal())
}
