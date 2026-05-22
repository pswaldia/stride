import { NextResponse } from 'next/server'
import { runTrainingLoadBackfill } from '@/lib/training-load/backfill'

export async function POST() {
  try {
    const { count } = await runTrainingLoadBackfill()
    return NextResponse.json({ count, message: `Computed and stored ${count} training load rows.` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
