import { createClient } from '@supabase/supabase-js'

// Shared Kasuku Supabase (identity bridge). The anon key is the public,
// RLS-guarded publishable key — safe to ship in the browser. Env overrides the
// default so a build without VITE_SUPABASE_* still works (fixes "Mtandao
// haujawashwa." at login when Vercel env isn't set).
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://ujokjnfdhtswomhgjkfp.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2tqbmZkaHRzd29taGdqa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDg5NjcsImV4cCI6MjA5NTkyNDk2N30.Iacm8WUH6kJvRgMvBNzQjLIylAxoIz4MF-CVwKfUeVo'

const supabase = createClient(url, key)

// Shared client for realtime (Live Rooms) — same identity/session as auth.
export { supabase }

export interface KasukuProfile {
  id: string
  handle: string
  name: string
  avatar_url: string | null
  bio: string | null
  cover: string | null
  verified: boolean
  verified_kind: string | null
  role: string | null
}

function userEmail(handle: string) { return `${handle}@users.kasuku.app` }
function cleanHandle(u: string) { return u.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') }

export async function signInWithKasuku(username: string, password: string): Promise<{ profile: KasukuProfile | null; error?: string }> {
  if (!supabase) return { profile: null, error: 'Network unavailable.' }
  const handle = cleanHandle(username)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail(handle), password,
  })
  if (error) return { profile: null, error: /invalid|credentials/i.test(error.message) ? 'Incorrect username or password.' : error.message }
  if (!data.user) return { profile: null, error: 'Sign-in failed.' }
  const profile = await fetchKasukuProfile(handle)
  return { profile }
}

export async function signUpWithKasuku(username: string, password: string, name: string): Promise<{ profile: KasukuProfile | null; error?: string }> {
  if (!supabase) return { profile: null, error: 'Network unavailable.' }
  const handle = cleanHandle(username)
  if (handle.length < 3) return { profile: null, error: 'Username must be at least 3 characters.' }
  if (password.length < 6) return { profile: null, error: 'Password must be at least 6 characters.' }
  const { data, error } = await supabase.auth.signUp({
    email: userEmail(handle), password,
    options: { data: { name: name.trim() || handle, handle } },
  })
  if (error) return { profile: null, error: /registered|already|exists/i.test(error.message) ? 'That username is taken.' : error.message }
  if (!data.session) return { profile: null, error: 'Sign-in failed.' }
  await supabase.from('profiles').update({ handle, name: name.trim() || handle }).eq('id', data.user!.id)
  const profile = await fetchKasukuProfile(handle)
  return { profile }
}

export async function fetchKasukuProfile(handle: string): Promise<KasukuProfile | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, handle, name, avatar_url, bio, cover, verified, verified_kind, role')
      .eq('handle', handle.toLowerCase())
      .single()
    if (error || !data) return null
    return data as KasukuProfile
  } catch {
    return null
  }
}

function mapVerifiedToMuhuri(kp: KasukuProfile): string | null {
  if (!kp.verified) return null
  switch (kp.verified_kind) {
    case 'founder': return 'founder'
    case 'admin': case 'moderator': return 'admin'
    case 'creator': return 'creator'
    default: return 'verified'
  }
}

export function syncKasukuToLocal(kp: KasukuProfile) {
  const existing = localStorage.getItem('kg_profile')
  if (!existing) return

  const profile = JSON.parse(existing)

  if (kp.name) profile.displayName = kp.name
  if (kp.avatar_url) profile.photoUrl = kp.avatar_url
  if (kp.cover) localStorage.setItem('kg_cover_color', kp.cover)

  const muhuri = mapVerifiedToMuhuri(kp)
  if (muhuri) profile.muhuri = muhuri

  localStorage.setItem('kg_profile', JSON.stringify(profile))
}
