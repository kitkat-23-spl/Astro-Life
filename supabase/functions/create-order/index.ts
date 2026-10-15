// Creates a Razorpay order for a credit pack and records it as 'created'.
// Called by a signed-in user from the Pricing page.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PACKS, cors, env, json } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  try {
    const url = env('SUPABASE_URL')
    const userClient = createClient(url, env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json(req, { error: 'Please sign in first.' }, 401)

    const { pack } = await req.json().catch(() => ({}))
    const p = PACKS[pack as string]
    if (!p) return json(req, { error: 'Unknown pack.' }, 400)

    const keyId = env('RAZORPAY_KEY_ID')
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${keyId}:${env('RAZORPAY_KEY_SECRET')}`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: p.paise, currency: 'INR', receipt: `al_${crypto.randomUUID().slice(0, 30)}`, notes: { user_id: user.id, pack } }),
    })
    const order = await res.json()
    if (!res.ok) return json(req, { error: 'The payment provider did not accept the order. Please try again.' }, 502)

    const admin = createClient(url, env('SUPABASE_SERVICE_ROLE_KEY'))
    const { error } = await admin.from('purchases').insert({ user_id: user.id, pack, credits: p.credits, amount_paise: p.paise, provider_order_id: order.id })
    if (error) return json(req, { error: 'Could not record the order.' }, 500)

    return json(req, { orderId: order.id, keyId, amount: p.paise, currency: 'INR', credits: p.credits, label: p.label, email: user.email })
  } catch (e) {
    return json(req, { error: (e as Error).message }, 500)
  }
})
