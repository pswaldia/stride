import type { StravaActivity, StravaTokens } from '@/types/strava'

const STRAVA_BASE = 'https://www.strava.com/api/v3'
const TOKEN_URL = 'https://www.strava.com/oauth/token'

// ─── Token management ────────────────────────────────────────────────

let cachedTokens: StravaTokens | null = null

function getStoredTokens(): StravaTokens | null {
  return {
    access_token: process.env.STRAVA_ACCESS_TOKEN ?? '',
    refresh_token: process.env.STRAVA_REFRESH_TOKEN ?? '',
    expires_at: parseInt(process.env.STRAVA_TOKEN_EXPIRES_AT ?? '0'),
    token_type: 'Bearer',
  }
}

async function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava token refresh failed: ${res.status} ${body}`)
  }

  return res.json()
}

async function getValidAccessToken(): Promise<string> {
  const tokens = cachedTokens ?? getStoredTokens()!
  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresIn = tokens.expires_at - nowSeconds

  // Refresh if expired or expiring within 5 minutes
  if (expiresIn < 300) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    cachedTokens = refreshed
    // In production: persist refreshed tokens to env/secrets store
    return refreshed.access_token
  }

  cachedTokens = tokens
  return tokens.access_token
}

// ─── API calls ───────────────────────────────────────────────────────

async function stravaFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getValidAccessToken()

  const res = await fetch(`${STRAVA_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava API error ${res.status} for ${path}: ${body}`)
  }

  return res.json()
}

export async function fetchActivity(activityId: number): Promise<StravaActivity> {
  return stravaFetch<StravaActivity>(`/activities/${activityId}?include_all_efforts=false`)
}

export async function fetchActivities(options: {
  page?: number
  perPage?: number
  before?: number
  after?: number
}): Promise<StravaActivity[]> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage ?? 100))
  if (options.before) params.set('before', String(options.before))
  if (options.after) params.set('after', String(options.after))

  return stravaFetch<StravaActivity[]>(`/athlete/activities?${params}`)
}

// ─── Webhook helpers ─────────────────────────────────────────────────

export function validateWebhookOwner(ownerId: number): boolean {
  return ownerId === parseInt(process.env.STRAVA_OWNER_ID ?? '0')
}

export function validateWebhookSubscription(subscriptionId: number): boolean {
  return subscriptionId === parseInt(process.env.STRAVA_SUBSCRIPTION_ID ?? '0')
}

export function validateVerifyToken(token: string): boolean {
  return token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
}

// ─── OAuth flow ──────────────────────────────────────────────────────

export function getAuthorizationUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read,activity:read_all',
  })
  return `https://www.strava.com/oauth/authorize?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<StravaTokens> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Strava OAuth exchange failed: ${res.status} ${body}`)
  }

  return res.json()
}
