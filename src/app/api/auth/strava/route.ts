import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/strava/client'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/strava/callback`
  const url = getAuthorizationUrl(redirectUri)
  return NextResponse.redirect(url)
}
