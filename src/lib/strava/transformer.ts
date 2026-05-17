import type { StravaActivity, StravaLap } from '@/types/strava'
import type { Run, RunType } from '@/types/database'

const DEFAULT_THRESHOLD_HR = 185

export function classifyRunType(
  activity: StravaActivity,
  thresholdHr: number = DEFAULT_THRESHOLD_HR
): RunType {
  if (activity.workout_type === 1) return 'race'

  const distanceM = activity.distance
  const avgHr = activity.average_heartrate

  if (distanceM >= 16000 && avgHr && avgHr < thresholdHr * 0.85) return 'long'

  const avgPaceSecPerKm = activity.average_speed > 0
    ? 1000 / activity.average_speed
    : null

  if (avgHr && avgHr > thresholdHr * 0.88) return 'tempo'

  // Estimate threshold pace as ~5:00/km (300s) if not set
  const thresholdPaceS = 300
  if (avgPaceSecPerKm && avgPaceSecPerKm < thresholdPaceS * 0.95) return 'tempo'

  return 'easy'
}

export function estimateTss(
  activity: StravaActivity,
  thresholdHr: number = DEFAULT_THRESHOLD_HR
): number {
  const avgHr = activity.average_heartrate
  const durationHours = activity.moving_time / 3600

  if (!avgHr) {
    // Fallback: estimate TSS from pace zones
    const paceSecPerKm = activity.average_speed > 0
      ? 1000 / activity.average_speed : 360
    const effortFactor = Math.min(paceSecPerKm > 360 ? 0.5 : 0.7, 1)
    return Math.round(durationHours * 60 * effortFactor)
  }

  // HR-based TSS estimation
  const intensityFactor = avgHr / thresholdHr
  const tss = durationHours * intensityFactor * intensityFactor * 100
  return Math.round(Math.min(tss, 400)) // cap at 400
}

export function transformActivity(
  activity: StravaActivity,
  thresholdHr?: number
): Omit<Run, 'id' | 'created_at' | 'updated_at'> {
  return {
    strava_id: activity.id,
    date: activity.start_date_local.substring(0, 10),
    started_at: activity.start_date,
    distance_m: Math.round(activity.distance),
    duration_s: activity.moving_time,
    avg_hr: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    max_hr: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
    avg_pace_s: activity.average_speed > 0
      ? Math.round(1000 / activity.average_speed)
      : null,
    elevation_m: Math.round(activity.total_elevation_gain),
    polyline: activity.map?.summary_polyline ?? null,
    city: null,     // populated after geocoding
    country: null,
    run_type: classifyRunType(activity, thresholdHr),
    tss: estimateTss(activity, thresholdHr),
    raw_json: activity as unknown as Record<string, unknown>,
  }
}

export function transformLaps(
  activity: StravaActivity
): Array<{ lap_index: number; distance_m: number; elapsed_s: number; avg_hr: number | null; avg_pace_s: number | null }> {
  if (!activity.laps) return []

  return activity.laps.map((lap: StravaLap) => ({
    lap_index: lap.lap_index,
    distance_m: Math.round(lap.distance),
    elapsed_s: lap.elapsed_time,
    avg_hr: lap.average_heartrate ? Math.round(lap.average_heartrate) : null,
    avg_pace_s: lap.average_speed > 0 ? Math.round(1000 / lap.average_speed) : null,
  }))
}
