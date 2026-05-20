import { NextResponse } from 'next/server'
import { getHotspots } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const hotspots = await getHotspots()
    return NextResponse.json(hotspots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
