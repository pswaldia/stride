import { fetchActivities } from './client'
import { transformActivity, transformLaps } from './transformer'
import { upsertRun, getRunByStravaId } from '@/lib/supabase/queries'
import { fetchWeatherForRun } from '@/lib/weather/client'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { StravaActivity } from '@/types/strava'

const PAGE_SIZE = 100   // Strava's maximum per page
const DELAY_MS  = 300   // polite delay between pages to avoid rate-limiting

export interface BackfillProgress {
  page: number
  fetched: number     // activities fetched from Strava this page
  inserted: number    // new runs written to DB (total so far)
  skipped: number     // already existed (total so far)
  errors: number      // failed inserts (total so far)
}

export interface BackfillResult {
  inserted: number
  skipped: number
  errors: number
  pages: number
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function runBackfill(
  onProgress?: (p: BackfillProgress) => void
): Promise<BackfillResult> {
  let page    = 1
  let inserted = 0
  let skipped  = 0
  let errors   = 0

  while (true) {
    const activities = await fetchActivities({ page, perPage: PAGE_SIZE })

    if (activities.length === 0) break   // no more pages

    onProgress?.({
      page,
      fetched: activities.length,
      inserted,
      skipped,
      errors,
    })

    for (const activity of activities) {
      // Only process runs
      if (activity.type !== 'Run' && activity.sport_type !== 'Run') continue

      try {
        const result = await processActivity(activity)
        if (result === 'skipped') skipped++
        else inserted++
      } catch (err) {
        errors++
        console.error(`Backfill error for activity ${activity.id}:`, err)
      }
    }

    // Stop if Strava returned fewer results than a full page
    if (activities.length < PAGE_SIZE) break

    page++
    await delay(DELAY_MS)
  }

  // Mark backfill complete in settings
  await supabaseAdmin
    .from('settings')
    .update({
      backfill_completed: true,
      backfill_count: inserted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', (await supabaseAdmin.from('settings').select('id').single()).data?.id)

  return { inserted, skipped, errors, pages: page }
}

// ─── Single activity processor ───────────────────────────────────────────────

async function processActivity(activity: StravaActivity): Promise<'inserted' | 'skipped'> {
  const existing = await getRunByStravaId(activity.id)
  if (existing) return 'skipped'

  // Transform and insert the run
  const runData = transformActivity(activity)
  const run = await upsertRun(runData)

  // Insert laps if present
  const laps = transformLaps(activity)
  if (laps.length > 0) {
    await supabaseAdmin
      .from('laps')
      .insert(laps.map((lap) => ({ ...lap, run_id: run.id })))
  }

  // Weather enrichment
  const startLat = activity.start_latlng?.[0]
  const startLng = activity.start_latlng?.[1]

  if (startLat && startLng) {
    const startDate = activity.start_date.substring(0, 10)
    const startHour = new Date(activity.start_date).getUTCHours()

    const weather = await fetchWeatherForRun(startLat, startLng, startDate, startHour)
    if (weather) {
      await supabaseAdmin
        .from('weather')
        .upsert({ ...weather, run_id: run.id }, { onConflict: 'run_id' })
    }

    // Reverse geocode for city / country
    await geocodeAndUpdateCity(run.id, startLat, startLng)
  }

  return 'inserted'
}

// ─── Geocoding ───────────────────────────────────────────────────────────────

async function geocodeAndUpdateCity(runId: string, lat: number, lng: number): Promise<void> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place&access_token=${token}`
    )
    if (!res.ok) return

    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return

    const city    = feature.text ?? null
    const country = feature.context?.find((c: { id: string }) => c.id.startsWith('country'))?.text ?? null

    await supabaseAdmin.from('runs').update({ city, country }).eq('id', runId)
  } catch (err) {
    console.error(`Geocoding failed for run ${runId}:`, err)
  }
}

// ─── Util ────────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
