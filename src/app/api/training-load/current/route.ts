import { NextResponse } from 'next/server'
import { getLatestTrainingLoad } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const data = await getLatestTrainingLoad()
    if (!data) return NextResponse.json(null)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
