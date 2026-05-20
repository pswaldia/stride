import { NextResponse } from 'next/server'
import { getCityBreakdown } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const cities = await getCityBreakdown()
    return NextResponse.json(cities)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
