import { supabase } from './kasuku-bridge'
import { loadWallet, saveWallet } from './tokens'

// ── Server-authoritative wallet ──────────────────────────────────────────────
// The local TokenWallet stays as an instant, offline mirror (and keeps the
// transaction history for the UI), but the AUTHORITATIVE balance lives in kg_wallet.
// Spends are funds-checked server-side (kg_wallet_spend), so a forged local balance
// can't buy shop items; earns are capped per call. Everything degrades to local-only
// when signed out or the functions aren't provisioned.

async function sessionUid(): Promise<string | null> {
  try { const { data } = await supabase.auth.getUser(); return data?.user?.id ?? null } catch { return null }
}

/** Read the authoritative balance, seeding it from the local balance on first use.
 *  Returns null if signed out / unavailable (caller keeps local-only). */
export async function reconcileWalletBalance(): Promise<number | null> {
  try {
    const uid = await sessionUid()
    if (!uid) return null
    const local = loadWallet()
    const { data, error } = await supabase.from('kg_wallet').select('balance').eq('id', uid).maybeSingle()
    if (error) return null
    let serverBal: number
    if (!data) {
      const { data: seeded, error: initErr } = await supabase.rpc('kg_wallet_init', { p_balance: Math.max(0, Math.round(local.balance) || 0) })
      if (initErr || seeded == null) return null
      serverBal = Number(seeded)
    } else {
      serverBal = Number(data.balance)
    }
    // Adopt the authoritative balance locally.
    if (Number.isFinite(serverBal) && serverBal !== local.balance) {
      saveWallet({ ...local, balance: serverBal })
    }
    return serverBal
  } catch { return null }
}

export type SpendResult = { ok: true; balance: number } | { ok: false; reason: 'insufficient' } | { ok: false; reason: 'offline' }

/** Funds-checked spend. When signed in, the server is authoritative: returns the new
 *  balance on success or 'insufficient'. When signed out, returns 'offline' so the
 *  caller can fall back to the local wallet. */
export async function serverSpend(amount: number, item: string): Promise<SpendResult> {
  try {
    if (!(await sessionUid())) return { ok: false, reason: 'offline' }
    const { data, error } = await supabase.rpc('kg_wallet_spend', { p_amount: Math.round(amount), p_item: item.slice(0, 120) })
    if (error || data == null) return { ok: false, reason: 'offline' }
    const bal = Number(data)
    if (bal < 0) return { ok: false, reason: 'insufficient' }
    // Keep the local mirror in step with the authoritative balance.
    const local = loadWallet()
    saveWallet({ ...local, balance: bal })
    return { ok: true, balance: bal }
  } catch { return { ok: false, reason: 'offline' } }
}
