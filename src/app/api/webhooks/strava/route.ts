import { NextRequest, NextResponse } from 'next/server'
import {
  fetchActivity,
  validateWebhookOwner,
  validateWebhookSubscription,
  validateVerifyToken,
} from '@/lib/strava/client'
import { transformActivity, transformLaps } from '@/lib/strava/transformer'
import { upsertRun, getRunByStravaId } from '@/lib/supabase/queries'
import { fetchWeatherForRun } from '@/lib/weather/client'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { StravaWebhookEvent } from '@/types/strava'

// ─── GET — Strava subscription verification ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token && validateVerifyToken(token)) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ─── POST — Strava activity event ────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: StravaWebhookEvent

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Guard 1: verify this event belongs to our athlete
  if (!validateWebhookOwner(body.owner_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Guard 2: verify this is our subscription
  if (!validateWebhookSubscription(body.subscription_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only process new run activities
  if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
    return NextResponse.json({ ok: true })
  }

  // Acknowledge immediately — process asynchronously
  processNewActivity(body.object_id).catch((err) => {
    console.error(`Failed to process activity ${body.object_id}:`, err)
  })

  return NextResponse.json({ ok: true })
}

// ─── Async processor ────────────────────────────────────────────────
async function processNewActivity(activityId: number): Promise<void> {
  // 1. Fetch full activity from Strava
  const activity = await fetchActivity(activityId)

  // Only process runs
  if (activity.type !== 'Run' && activity.sport_type !== 'Run') {
    console.log(`Skipping activity ${activityId} — type: ${activity.type}`)
    return
  }

  // Check if already exists
  const existing = await getRunByStravaId(activityId)
  if (existing) {
    console.log(`Activity ${activityId} already exists, skipping`)
    return
  }

  // 2. Transform and store the run
  const runData = transformActivity(activity)
  const run = await upsertRun(runData)

  // 3. Store laps if available
  const laps = transformLaps(activity)
  if (laps.length > 0) {
    await supabaseAdmin
      .from('laps')
      .insert(laps.map((lap) => ({ ...lap, run_id: run.id })))
  }

  // 4. Fetch and store weather
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

    // 5. Reverse geocode for city name
    await geocodeAndUpdateCity(run.id, startLat, startLng)
  }

  console.log(`✓ Processed activity ${activityId} — run ${run.id}`)
}

async function geocodeAndUpdateCity(
  runId: string,
  lat: number,
  lng: number
): Promise<void> {
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

    const city = feature.text ?? null
    const country = feature.context?.find((c: { id: string }) =>
      c.id.startsWith('country')
    )?.text ?? null

    await supabaseAdmin
      .from('runs')
      .update({ city, country })
      .eq('id', runId)
  } catch (err) {
    console.error('Geocoding failed:', err)
  }
}
