// Razorpay webhook: marks an order paid even if the buyer closed the tab
// before the browser could confirm it. Deploy with --no-verify-jwt; it is
// authenticated by the X-Razorpay-Signature header instead.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { env, hmacHex, safeEqual } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const body = await req.text()
  const signature = req.headers.get('X-Razorpay-Signature') ?? ''
  const expected = await hmacHex(env('RAZORPAY_WEBHOOK_SECRET'), body)
  if (!safeEqual(expected, signature)) return new Response('Bad signature', { status: 400 })

  const event = JSON.parse(body)
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const p = event.payload?.payment?.entity
    if (p?.order_id && p?.id) {
      const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
      await admin.from('purchases')
        .update({ status: 'paid', provider_payment_id: p.id, paid_at: new Date().toISOString() })
        .eq('provider_order_id', p.order_id).eq('amount_paise', p.amount).eq('status', 'created')
    }
  }
  if (event.event === 'refund.processed') {
    const r = event.payload?.refund?.entity
    if (r?.payment_id) {
      const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
      await admin.from('purchases').update({ status: 'refunded' }).eq('provider_payment_id', r.payment_id)
    }
  }
  return new Response('ok')
})
