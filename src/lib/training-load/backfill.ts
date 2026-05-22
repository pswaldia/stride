import { getRuns } from '@/lib/supabase/queries'
import { upsertTrainingLoadBatch } from '@/lib/supabase/queries'
import { computeTrainingLoad } from './compute'

export async function runTrainingLoadBackfill(): Promise<{ count: number }> {
  // Fetch all runs in chronological order
  const runs = await getRuns({ limit: 10000 })
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date))

  if (sorted.length === 0) return { count: 0 }

  // Compute the full CTL/ATL/TSB series
  const rows = computeTrainingLoad(sorted)

  // Upsert all rows — safe to re-run
  await upsertTrainingLoadBatch(rows)

  return { count: rows.length }
}
