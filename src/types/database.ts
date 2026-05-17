export type RunType = 'easy' | 'tempo' | 'long' | 'race'
export type InsightType =
  | 'training_load_analysis'
  | 'race_predictor'
  | 'anomaly_detection'
  | 'weather_correlation'

export interface Run {
  id: string
  strava_id: number
  date: string
  started_at: string
  distance_m: number
  duration_s: number
  avg_hr: number | null
  max_hr: number | null
  avg_pace_s: number | null
  elevation_m: number
  polyline: string | null
  city: string | null
  country: string | null
  run_type: RunType | null
  tss: number | null
  raw_json: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Lap {
  id: string
  run_id: string
  lap_index: number
  distance_m: number
  elapsed_s: number
  avg_hr: number | null
  avg_pace_s: number | null
}

export interface Weather {
  id: string
  run_id: string
  temp_c: number | null
  feels_like_c: number | null
  humidity_pct: number | null
  wind_kph: number | null
  wind_dir_deg: number | null
  conditions: string | null
  weather_code: number | null
  fetched_at: string
}

export interface TrainingLoad {
  id: string
  date: string
  ctl: number
  atl: number
  tsb: number
  daily_tss: number
  updated_at: string
}

export interface AiInsight {
  id: string
  run_id: string | null
  insight_type: InsightType
  prompt_hash: string
  content: string
  model: string
  input_tokens: number | null
  output_tokens: number | null
  generated_at: string
}

export interface Settings {
  id: string
  race_date: string | null
  race_name: string | null
  race_distance_m: number
  threshold_hr: number | null
  threshold_pace_s: number | null
  unit_preference: 'km' | 'mi'
  strava_connected_at: string | null
  backfill_completed: boolean
  backfill_count: number
  updated_at: string
}

export interface RunWithWeather extends Run {
  weather: Weather | null
}

export interface RunWithLaps extends Run {
  laps: Lap[]
}
