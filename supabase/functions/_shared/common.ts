// Shared by the payment Edge Functions (Deno, deployed with the Supabase CLI).
// Prices live here, on the server: the browser only names a pack.

export const PACKS: Record<string, { credits: number; paise: number; label: string }> = {
  p1: { credits: 1, paise: 29900, label: '1 chart' },
  p2: { credits: 2, paise: 49900, label: '2 charts' },
  p3: { credits: 3, paise: 69900, label: '3 charts' },
  p5: { credits: 5, paise: 100000, label: '5 charts' },
}

/** CORS for the site's own origins (ALLOWED_ORIGINS, comma-separated). */
export function cors(req: Request): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const origin = req.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowed.length === 0 ? '*' : allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

export const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })

export function env(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing secret ${name}`)
  return v
}

/** Hex HMAC-SHA256, as Razorpay signs payments and webhooks. */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compares two strings in constant time. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
