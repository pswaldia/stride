import { NextRequest, NextResponse } from 'next/server'
import { getTrainingLoadHistory } from '@/lib/supabase/queries'

export async function GET(req: NextRequest) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '120', 10)
    const data = await getTrainingLoadHistory(isNaN(days) ? 120 : days)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
