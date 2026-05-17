export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  start_date_local: string
  distance: number           // metres
  moving_time: number        // seconds
  elapsed_time: number       // seconds
  total_elevation_gain: number
  average_speed: number      // m/s
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  map: {
    id: string
    summary_polyline: string
    resource_state: number
  }
  workout_type?: number      // 1 = race
  start_latlng: [number, number] | []
  end_latlng: [number, number] | []
  laps?: StravaLap[]
}

export interface StravaLap {
  id: number
  activity: { id: number }
  athlete: { id: number }
  average_speed: number
  distance: number
  elapsed_time: number
  end_index: number
  lap_index: number
  max_speed: number
  moving_time: number
  name: string
  pace_zone: number
  split: number
  start_date: string
  start_index: number
  total_elevation_gain: number
  average_heartrate?: number
  max_heartrate?: number
}

export interface StravaWebhookEvent {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number
  object_type: 'activity' | 'athlete'
  owner_id: number
  subscription_id: number
  updates?: Record<string, string>
}

export interface StravaWebhookVerification {
  'hub.mode': string
  'hub.challenge': string
  'hub.verify_token': string
}
