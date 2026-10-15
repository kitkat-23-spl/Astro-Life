import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { BirthData } from '../astro/ephemeris'
import { useAuth } from './auth'
import { PAYWALL, birthKey, type PackId } from './paywall'
import { supabase } from './supabase'

export interface Credits { total: number; used: number; remaining: number }
export interface UnlockedChart { id: string; birth_key: string; label: string; birth: BirthData; created_at: string }

interface Entitlements {
  /** Null until loaded, or when signed out. */
  credits: Credits | null
  unlocked: UnlockedChart[]
  loading: boolean
  isUnlocked: (b: BirthData) => boolean
  unlock: (b: BirthData, label: string) => Promise<void>
  buy: (pack: PackId) => Promise<number>
  refresh: () => Promise<void>
}

const Ctx = createContext<Entitlements | null>(null)

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [credits, setCredits] = useState<Credits | null>(null)
  const [unlocked, setUnlocked] = useState<UnlockedChart[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!PAYWALL || !supabase || !user) { setCredits(null); setUnlocked([]); return }
    setLoading(true)
    try {
      const [c, u] = await Promise.all([
        supabase.rpc('chart_credits').single<Credits>(),
        supabase.from('unlocked_charts').select('id, birth_key, label, birth, created_at').order('created_at', { ascending: false }),
      ])
      if (!c.error && c.data) setCredits(c.data)
      if (!u.error && u.data) setUnlocked(u.data as UnlockedChart[])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const isUnlocked = useCallback((b: BirthData) => unlocked.some((u) => u.birth_key === birthKey(b)), [unlocked])

  const unlock = useCallback(async (b: BirthData, label: string) => {
    if (!supabase) throw new Error('Sign-in is not configured.')
    const { error } = await supabase.rpc('unlock_chart', { p_birth_key: birthKey(b), p_label: label, p_birth: b })
    if (error) throw new Error(error.message.includes('No chart credits') ? 'You have no chart credits left. Buy a pack to unlock this chart.' : error.message)
    await refresh()
  }, [refresh])

  const buy = useCallback(async (pack: PackId) => {
    if (!supabase || !user) throw new Error('Please sign in first.')
    const { data, error } = await supabase.functions.invoke<OrderResponse>('create-order', { body: { pack } })
    if (error || !data?.orderId) throw new Error(data?.error ?? 'Could not start the payment. Please try again.')
    await loadCheckout()
    const result = await openCheckout(data, user.email ?? undefined)
    const v = await supabase.functions.invoke<{ ok?: boolean; error?: string }>('verify-payment', {
      body: { orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature },
    })
    if (v.error || !v.data?.ok) throw new Error(v.data?.error ?? 'Payment received but not yet confirmed. It will appear shortly; refresh this page in a minute.')
    await refresh()
    return data.credits
  }, [user, refresh])

  return <Ctx.Provider value={{ credits, unlocked, loading, isUnlocked, unlock, buy, refresh }}>{children}</Ctx.Provider>
}

export function useEntitlements(): Entitlements {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEntitlements must be used inside EntitlementsProvider')
  return ctx
}

/* ------------------------------------------------------------------ */
/* Razorpay Checkout                                                    */
/* ------------------------------------------------------------------ */

interface OrderResponse { orderId: string; keyId: string; amount: number; currency: string; credits: number; label: string; error?: string }
interface CheckoutResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void }

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadCheckout(): Promise<void> {
  if ((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = CHECKOUT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'))
    document.head.appendChild(s)
  })
}

function openCheckout(order: OrderResponse, email?: string): Promise<CheckoutResult> {
  const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay
  return new Promise((resolve, reject) => {
    const rz = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Astro Life',
      description: `Chart credits: ${order.label}`,
      prefill: email ? { email } : undefined,
      theme: { color: '#4f46e5' },
      handler: (r: CheckoutResult) => resolve(r),
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
    })
    rz.on('payment.failed', (r) => reject(new Error(r.error?.description ?? 'Payment failed.')))
    rz.open()
  })
}
