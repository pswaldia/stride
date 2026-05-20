import { NextResponse } from 'next/server'
import { getMapStats } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const stats = await getMapStats()
    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
