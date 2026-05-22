import type { Run, TrainingLoad } from '@/types/database'

// ─── Pure EWMA computation ────────────────────────────────────────────────────
//
// CTL (fitness)  = 42-day EWMA of daily TSS
// ATL (fatigue)  =  7-day EWMA of daily TSS
// TSB (form)     = CTL − ATL
//
// EWMA formula: value_today = value_yesterday + (tss_today − value_yesterday) / N
// Starting values: CTL = ATL = 0

type LoadRow = Omit<TrainingLoad, 'id' | 'updated_at'>

export function computeTrainingLoad(runs: Run[]): LoadRow[] {
  if (runs.length === 0) return []

  // Sort ascending by date (safe copy)
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date))

  // Build date → TSS sum map (multiple runs on same day are summed)
  const tssByDate = new Map<string, number>()
  for (const run of sorted) {
    const prev = tssByDate.get(run.date) ?? 0
    tssByDate.set(run.date, prev + (run.tss ?? 0))
  }

  // Date range: first run → today
  const startDate = sorted[0].date
  const todayStr  = new Date().toISOString().substring(0, 10)

  const result: LoadRow[] = []
  let ctl = 0
  let atl = 0

  // Walk every calendar day with no gaps
  const cursor = new Date(startDate + 'T00:00:00Z')
  const end    = new Date(todayStr  + 'T00:00:00Z')

  while (cursor <= end) {
    const dateStr = cursor.toISOString().substring(0, 10)
    const tss     = tssByDate.get(dateStr) ?? 0

    ctl = ctl + (tss - ctl) / 42
    atl = atl + (tss - atl) / 7

    result.push({
      date:      dateStr,
      daily_tss: tss,
      ctl:       round2(ctl),
      atl:       round2(atl),
      tsb:       round2(ctl - atl),
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return result
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
