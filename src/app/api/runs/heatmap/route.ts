import { NextResponse } from 'next/server'
import { getHeatmapRuns } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const runs = await getHeatmapRuns()
    return NextResponse.json(runs)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
