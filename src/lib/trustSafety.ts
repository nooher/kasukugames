import { supabase } from './kasuku-bridge'

// ── Trust & safety ───────────────────────────────────────────────────────────
// Blocks (hide a user from your People / invites / live chat) and reports (flag a
// user, room, or message for moderation). Owner-scoped tables with RLS; everything
// degrades gracefully when signed out or the tables aren't provisioned.

export type ReportKind = 'user' | 'room' | 'message'

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Sexual or explicit content',
  'Spam or scam',
  'Threats or violence',
  'Impersonation',
  'Other',
] as const

async function myId(): Promise<string | null> {
  try { const { data } = await supabase.auth.getUser(); return data?.user?.id ?? null } catch { return null }
}

// Blocked users I've set — returned as a set of ids AND a set of handles so callers
// can filter by whichever they have.
export interface BlockSet { ids: Set<string>; handles: Set<string> }

export async function fetchBlocks(): Promise<BlockSet> {
  const empty = { ids: new Set<string>(), handles: new Set<string>() }
  try {
    const uid = await myId()
    if (!uid) return empty
    const { data } = await supabase.from('kg_blocks').select('blocked_id, blocked_handle').eq('blocker_id', uid)
    if (!Array.isArray(data)) return empty
    return {
      ids: new Set(data.map(r => r.blocked_id).filter(Boolean)),
      handles: new Set(data.map(r => (r.blocked_handle || '').toLowerCase()).filter(Boolean)),
    }
  } catch { return empty }
}

export async function blockUser(blockedId: string | null, blockedHandle?: string): Promise<boolean> {
  try {
    const uid = await myId()
    if (!uid) return false
    let id = blockedId
    const handle = (blockedHandle || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!id && handle) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle()
      id = prof?.id ?? null
    }
    if (!id || id === uid) return false
    const { error } = await supabase.from('kg_blocks').upsert(
      { blocker_id: uid, blocked_id: id, blocked_handle: handle || null, created_at: new Date().toISOString() },
      { onConflict: 'blocker_id,blocked_id' },
    )
    return !error
  } catch { return false }
}

export async function unblockUser(blockedId: string): Promise<boolean> {
  try {
    const uid = await myId()
    if (!uid) return false
    const { error } = await supabase.from('kg_blocks').delete().eq('blocker_id', uid).eq('blocked_id', blockedId)
    return !error
  } catch { return false }
}

export async function submitReport(r: {
  kind: ReportKind
  reason: string
  targetId?: string | null
  targetHandle?: string | null
  roomCode?: string | null
  detail?: string | null
}): Promise<boolean> {
  try {
    const uid = await myId()
    if (!uid) return false
    const { error } = await supabase.from('kg_reports').insert({
      reporter_id: uid,
      target_kind: r.kind,
      target_id: r.targetId ?? null,
      target_handle: (r.targetHandle || '').toLowerCase() || null,
      room_code: r.roomCode ?? null,
      reason: r.reason,
      detail: r.detail ?? null,
    })
    return !error
  } catch { return false }
}

// ── Content filter ───────────────────────────────────────────────────────────
// Lightweight masking for user-generated text (live-room chat, custom Truth-or-Dare
// prompts). Not a substitute for human moderation — it just keeps casual slurs and
// obvious profanity (English + common Swahili) out of shared surfaces.
const BADWORDS = [
  // English
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'bastard', 'slut', 'whore',
  'nigger', 'nigga', 'faggot', 'retard', 'rape',
  // Swahili
  'mavi', 'kuma', 'mboo', 'malaya', 'shoga', 'punda', 'mjinga', 'pumbavu', 'mshenzi',
]
const RE = new RegExp(`\\b(${BADWORDS.join('|')})\\b`, 'gi')

export function cleanText(text: string): string {
  return (text || '').replace(RE, m => m[0] + '*'.repeat(Math.max(1, m.length - 1)))
}

export function hasProfanity(text: string): boolean {
  RE.lastIndex = 0
  return RE.test(text || '')
}
