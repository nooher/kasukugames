/**
 * /play?invite=<game>&from=<name>&u=<handle>  →  dynamic Open Graph card.
 *
 * WhatsApp/Facebook/Twitter scrapers don't run JS, so the invite link must
 * return server-rendered OG tags showing the SENDER's profile (name + photo)
 * instead of the generic KasukuGames card. Real browsers are bounced straight
 * into the app (/?invite=…&from=…), where the invite modal takes over.
 */
const SUPA = 'https://ujokjnfdhtswomhgjkfp.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2tqbmZkaHRzd29taGdqa2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDg5NjcsImV4cCI6MjA5NTkyNDk2N30.Iacm8WUH6kJvRgMvBNzQjLIylAxoIz4MF-CVwKfUeVo'
const FALLBACK_IMG = 'https://games.kasuku.tz/icon-512.png'

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// Full-res uploads can be several MB — too big for WhatsApp to fetch as a
// preview thumbnail. Serve a 600px, quality-75 render (~90KB) for Supabase
// storage images; leave any other URL untouched.
function ogSized(u: string) {
  if (u.includes('/storage/v1/object/public/')) {
    return u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=600&height=600&resize=cover&quality=75'
  }
  return u
}

export default async function handler(
  req: { query?: Record<string, string | string[]> },
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { send: (b: string) => void } },
) {
  const q = req.query || {}
  const pick = (k: string) => { const v = q[k]; return (Array.isArray(v) ? v[0] : v) || '' }
  const invite = pick('invite')
  const from = pick('from') || 'A friend'
  const handle = pick('u').toLowerCase().replace(/[^a-z0-9_]/g, '')
  const rel = pick('rel').trim().toLowerCase().replace(/[^a-z]/g, '')
  const liveGame = pick('g').trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  const room = pick('room').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const isLive = !!room || pick('live') === '1'

  let name = from
  let pic = FALLBACK_IMG
  if (handle) {
    try {
      const r = await fetch(`${SUPA}/rest/v1/profiles?handle=eq.${handle}&select=name,avatar_url&limit=1`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      })
      if (r.ok) {
        const rows = await r.json() as Array<{ name?: string; avatar_url?: string }>
        if (Array.isArray(rows) && rows[0]) {
          if (rows[0].name) name = rows[0].name
          if (rows[0].avatar_url) pic = ogSized(rows[0].avatar_url)
        }
      }
    } catch { /* fall back to name + default image */ }
  }

  const title = isLive
    ? `🔴 ${name} is waiting for you — live game on KasukuGames`
    : `🎮 ${name} invited you to KasukuGames`
  const desc = isLive
    ? `Tap to join ${name} right now — play together live: spin the bottle, truth or dare & more. Free.`
    : `Tap to play with ${name} — 30 free games: brain training, party games, faith & fitness.`
  // Forward the sender handle (u), relationship (rel) and live-game id (g) so the app
  // can render the reciprocal greeting, seal the reciprocal People link, pre-seed the
  // two players, and route shared room links to the right live game.
  const target = room
    ? `/?room=${encodeURIComponent(room)}&live=1&from=${encodeURIComponent(from)}${liveGame ? `&g=${encodeURIComponent(liveGame)}` : ''}`
    : `/?invite=${encodeURIComponent(invite)}&from=${encodeURIComponent(from)}${handle ? `&u=${encodeURIComponent(handle)}` : ''}${rel ? `&rel=${encodeURIComponent(rel)}` : ''}`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  res.status(200).send(
`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="KasukuGames">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(pic)}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="${esc(name)} on KasukuGames">
<meta property="og:url" content="https://games.kasuku.tz/play">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(pic)}">
<title>${esc(title)}</title>
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head><body style="font-family:system-ui,sans-serif;background:#0b0f14;color:#f0f4f8;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center">
<div><p>Opening KasukuGames…</p><p><a style="color:#e0913f;font-weight:700" href="${esc(target)}">Tap here</a> if it doesn't open.</p></div>
</body></html>`)
}
