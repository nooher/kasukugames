import { supabase } from './kasuku-bridge'
import { RECIPROCAL, RELATION_META, type RelationType } from './connections'

// ── Reciprocal People ────────────────────────────────────────────────────────
// Server-backed relationships (table: kg_connections). One accepted row is visible
// to BOTH parties, so when someone you added accepts, you appear on each other's
// People automatically — each side seeing the other with the correct reciprocal
// label (you add her as your wife → she sees you as her husband).
//
// Every call degrades gracefully: if the table isn't created yet, or the user is
// signed out, these resolve to empty/false and the app keeps working on the local
// (WhatsApp/Instagram) connections alone.

export interface RelConnection {
  id: string
  otherId: string
  otherHandle: string
  otherName: string
  otherPhoto: string | null
  relation: RelationType     // as seen by ME (already flipped to the reciprocal if I'm the addressee)
  status: 'pending' | 'accepted' | 'declined'
  incoming: boolean          // they added me and it's awaiting MY response
  outgoing: boolean          // I added them and it's awaiting THEIR response
}

function cleanHandle(h: string) { return (h || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '') }

async function me(): Promise<{ id: string; handle: string } | null> {
  try {
    const { data } = await supabase.auth.getUser()
    const u = data?.user
    if (!u) return null
    const handle = (u.user_metadata as any)?.handle || ''
    return { id: u.id, handle: cleanHandle(handle) }
  } catch { return null }
}

// A adds B by handle, choosing what B is to A (relation). Idempotent: re-adding
// updates the relation and re-opens the request.
export async function sendRelationshipRequest(addresseeHandle: string, relation: RelationType): Promise<{ ok: boolean; error?: string }> {
  const m = await me()
  const h = cleanHandle(addresseeHandle)
  if (!m) return { ok: false, error: 'signed-out' }
  if (!h) return { ok: false, error: 'no-handle' }
  if (h === m.handle) return { ok: false, error: 'self' }
  try {
    const { data: prof } = await supabase.from('profiles').select('id, handle').eq('handle', h).single()
    if (!prof?.id) return { ok: false, error: 'not-found' }
    if (prof.id === m.id) return { ok: false, error: 'self' }
    const { error } = await supabase.from('kg_connections').upsert({
      requester_id: m.id, requester_handle: m.handle,
      addressee_id: prof.id, addressee_handle: prof.handle,
      relation, status: 'pending', updated_at: new Date().toISOString(),
    }, { onConflict: 'requester_id,addressee_id' })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'failed' }
  }
}

// The recipient of an external (WhatsApp/Instagram) invite link accepts it: create
// (or accept) the relationship from the SENDER's side. `relation` is the raw value
// the sender set — that they are addressing us as. Because we're the addressee, RLS
// lets us write an accepted row directly.
export async function acceptRelationshipFromLink(senderHandle: string, relation: RelationType): Promise<boolean> {
  const m = await me()
  const h = cleanHandle(senderHandle)
  if (!m || !h || h === m.handle) return false
  try {
    const { data: prof } = await supabase.from('profiles').select('id, handle').eq('handle', h).single()
    if (!prof?.id || prof.id === m.id) return false
    const { error } = await supabase.from('kg_connections').upsert({
      requester_id: prof.id, requester_handle: prof.handle,
      addressee_id: m.id, addressee_handle: m.handle,
      relation, status: 'accepted', updated_at: new Date().toISOString(),
    }, { onConflict: 'requester_id,addressee_id' })
    return !error
  } catch { return false }
}

export async function acceptRelationshipRequest(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('kg_connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  } catch { return false }
}

export async function declineRelationshipRequest(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('kg_connections')
      .update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  } catch { return false }
}

export async function removeRelationship(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('kg_connections').delete().eq('id', id)
    return !error
  } catch { return false }
}

// Everyone I'm connected to (or pending with), each already flipped to my side.
export async function fetchRelationships(): Promise<RelConnection[]> {
  const m = await me()
  if (!m) return []
  try {
    const { data: rows } = await supabase
      .from('kg_connections')
      .select('*')
      .or(`requester_id.eq.${m.id},addressee_id.eq.${m.id}`)
    if (!rows?.length) return []
    const otherIds = Array.from(new Set(rows.map((r: any) => (r.requester_id === m.id ? r.addressee_id : r.requester_id))))
    const { data: profs } = await supabase
      .from('profiles').select('id, handle, name, avatar_url').in('id', otherIds)
    const pmap = new Map((profs || []).map((p: any) => [p.id, p]))
    return rows
      .filter((r: any) => r.status !== 'declined')
      .map((r: any) => {
        const iAmRequester = r.requester_id === m.id
        const otherId = iAmRequester ? r.addressee_id : r.requester_id
        const p = pmap.get(otherId)
        // If I'm the addressee, the stored relation is what I am to THEM; flip it so
        // I see what THEY are to me.
        const relation: RelationType = (iAmRequester ? r.relation : (RECIPROCAL[r.relation as RelationType] ?? r.relation)) as RelationType
        return {
          id: r.id,
          otherId,
          otherHandle: (iAmRequester ? r.addressee_handle : r.requester_handle) || p?.handle || '',
          otherName: p?.name || p?.handle || (iAmRequester ? r.addressee_handle : r.requester_handle) || 'Someone',
          otherPhoto: p?.avatar_url ?? null,
          relation: RELATION_META[relation] ? relation : ('friend' as RelationType),
          status: r.status,
          incoming: !iAmRequester && r.status === 'pending',
          outgoing: iAmRequester && r.status === 'pending',
        }
      })
  } catch {
    return []
  }
}

// handle → relationship label, for relationship-aware presence notifications
// ("Your wife is online"). Only accepted relationships count.
export async function fetchRelationLabels(): Promise<Map<string, { name: string; label: string }>> {
  const map = new Map<string, { name: string; label: string }>()
  const rels = await fetchRelationships()
  for (const r of rels) {
    if (r.status === 'accepted' && r.otherHandle) {
      map.set(r.otherHandle.toLowerCase(), { name: r.otherName, label: RELATION_META[r.relation].label })
    }
  }
  return map
}
