import { supabaseAdmin } from './client'
import type { Run, RunWithWeather, RunWithLaps } from '@/types/database'

export async function getRuns(options?: {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  runType?: string
}): Promise<Run[]> {
  let query = supabaseAdmin
    .from('runs')
    .select('*')
    .order('date', { ascending: false })

  if (options?.startDate) query = query.gte('date', options.startDate)
  if (options?.endDate) query = query.lte('date', options.endDate)
  if (options?.runType) query = query.eq('run_type', options.runType)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, (options.offset + (options.limit ?? 50)) - 1)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch runs: ${error.message}`)
  return data ?? []
}

export async function getRunById(id: string): Promise<RunWithWeather | null> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('*, weather(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch run: ${error.message}`)
  }
  return data
}

export async function getRunByStravaId(stravaId: number): Promise<Run | null> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('*')
    .eq('strava_id', stravaId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch run by Strava ID: ${error.message}`)
  }
  return data
}

export async function getRunWithLaps(id: string): Promise<RunWithLaps | null> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('*, laps(*)')
    .eq('id', id)
    .order('lap_index', { referencedTable: 'laps', ascending: true })
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch run with laps: ${error.message}`)
  }
  return data
}

export async function upsertRun(run: Omit<Run, 'id' | 'created_at' | 'updated_at'>): Promise<Run> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .upsert(run, { onConflict: 'strava_id' })
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert run: ${error.message}`)
  return data
}

export async function getRunsForHeatmap(): Promise<{ id: string; polyline: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('id, polyline')
    .not('polyline', 'is', null)
    .order('date', { ascending: false })

  if (error) throw new Error(`Failed to fetch runs for heatmap: ${error.message}`)
  return data ?? []
}

export async function getCityBreakdown(): Promise<
  { city: string; country: string; run_count: number; total_km: number }[]
> {
  const { data, error } = await supabaseAdmin.rpc('get_city_breakdown')
  if (error) throw new Error(`Failed to fetch city breakdown: ${error.message}`)
  return data ?? []
}

export async function getWeeklyMileage(weeks: number = 8): Promise<
  { week_start: string; total_km: number }[]
> {
  const { data, error } = await supabaseAdmin.rpc('get_weekly_mileage', { weeks_back: weeks })
  if (error) throw new Error(`Failed to fetch weekly mileage: ${error.message}`)
  return data ?? []
}

export async function getRunsInRange(from: string, to: string): Promise<Run[]> {
  return getRuns({ startDate: from, endDate: to, limit: 200 })
}

export async function getLatestTrainingLoad(): Promise<import('@/types/database').TrainingLoad | null> {
  const { data, error } = await supabaseAdmin
    .from('training_load')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch training load: ${error.message}`)
  }
  return data
}

export async function getRunWithDetails(
  id: string
): Promise<(RunWithWeather & RunWithLaps) | null> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('*, weather(*), laps(*)')
    .eq('id', id)
    .order('lap_index', { referencedTable: 'laps', ascending: true })
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch run details: ${error.message}`)
  }
  return data
}
