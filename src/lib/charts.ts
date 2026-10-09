import type { BirthData } from '../astro/ephemeris'
import { supabase } from './supabase'

export interface SavedChart {
  id: string
  label: string
  birth: BirthData
  created_at: string
}

const MAX_LABEL = 80

/** Only the birth inputs are stored; the chart itself is recomputed on demand. */
export async function saveChart(label: string, birth: BirthData): Promise<SavedChart> {
  if (!supabase) throw new Error('Sign-in is not configured.')
  const { data, error } = await supabase
    .from('charts')
    .insert({ label: label.trim().slice(0, MAX_LABEL) || 'My chart', birth })
    .select('id, label, birth, created_at')
    .single()
  if (error) throw new Error(error.message)
  return data as SavedChart
}

export async function listCharts(): Promise<SavedChart[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('charts')
    .select('id, label, birth, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as SavedChart[]
}

export async function deleteChart(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('charts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Removes every chart owned by the signed-in user (RLS limits the delete to their rows). */
export async function deleteAllCharts(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('charts').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/**
 * Deletes the signed-in user's account: the Supabase user record (name, email,
 * Google link) and, by cascade, every saved chart. Needs the delete_my_account
 * function from supabase/migrations.
 */
export async function deleteAccount(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    throw new Error(error.code === 'PGRST202' ? 'Account deletion is not set up on the server yet. Your charts can still be deleted above.' : error.message)
  }
  // The session belonged to the deleted user; clear it on this device only.
  await supabase.auth.signOut({ scope: 'local' })
}
