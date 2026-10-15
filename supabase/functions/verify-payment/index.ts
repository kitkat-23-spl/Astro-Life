// Confirms a payment returned by Razorpay Checkout and adds the credits.
// The signature is HMAC-SHA256(order_id|payment_id) with the key secret.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { cors, env, hmacHex, json, safeEqual } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  try {
    const url = env('SUPABASE_URL')
    const userClient = createClient(url, env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json(req, { error: 'Please sign in first.' }, 401)

    const { orderId, paymentId, signature } = await req.json().catch(() => ({}))
    if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') return json(req, { error: 'Missing payment details.' }, 400)

    const expected = await hmacHex(env('RAZORPAY_KEY_SECRET'), `${orderId}|${paymentId}`)
    if (!safeEqual(expected, signature)) return json(req, { error: 'Payment could not be verified.' }, 400)

    const admin = createClient(url, env('SUPABASE_SERVICE_ROLE_KEY'))
    const { data, error } = await admin.from('purchases')
      .update({ status: 'paid', provider_payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq('provider_order_id', orderId).eq('user_id', user.id).eq('status', 'created')
      .select('credits')
    if (error) return json(req, { error: 'Could not record the payment.' }, 500)
    // Already marked paid (for example by the webhook) counts as success.
    return json(req, { ok: true, credits: data?.[0]?.credits ?? 0 })
  } catch (e) {
    return json(req, { error: (e as Error).message }, 500)
  }
})
