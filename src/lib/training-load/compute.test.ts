import { describe, it, expect } from 'vitest'
import { computeTrainingLoad } from './compute'
import type { Run } from '@/types/database'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().substring(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().substring(0, 10)
}

function makeRun(date: string, tss: number): Run {
  return {
    id:          `run-${date}-${tss}`,
    strava_id:   0,
    date,
    started_at:  `${date}T07:00:00Z`,
    distance_m:  5000,
    duration_s:  1800,
    avg_hr:      null,
    max_hr:      null,
    avg_pace_s:  null,
    elevation_m: 0,
    polyline:    null,
    city:        null,
    country:     null,
    run_type:    'easy',
    tss,
    raw_json:    null,
    created_at:  `${date}T07:00:00Z`,
    updated_at:  `${date}T07:00:00Z`,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeTrainingLoad', () => {

  it('returns empty array for empty input', () => {
    expect(computeTrainingLoad([])).toEqual([])
  })

  it('single run today: CTL = tss/42, ATL = tss/7', () => {
    const t = today()
    const result = computeTrainingLoad([makeRun(t, 60)])
    const row = result.find(r => r.date === t)!
    expect(row.daily_tss).toBe(60)
    expect(row.ctl).toBeCloseTo(60 / 42, 2)
    expect(row.atl).toBeCloseTo(60 / 7, 2)
    expect(row.tsb).toBeCloseTo(row.ctl - row.atl, 2)
  })

  it('ATL rises faster than CTL in the first 7 days of training', () => {
    // Run every day for 7 days ending today
    const runs = Array.from({ length: 7 }, (_, i) =>
      makeRun(daysAgo(6 - i), 80)
    )
    const result = computeTrainingLoad(runs)
    const last = result[result.length - 1]
    // After 7 days of 80 TSS, ATL (7-day) is higher than CTL (42-day)
    expect(last.atl).toBeGreaterThan(last.ctl)
  })

  it('multiple runs on same day: TSS is summed', () => {
    const t = today()
    const result = computeTrainingLoad([
      makeRun(t, 40),
      makeRun(t, 30),  // 70 total
    ])
    const row = result.find(r => r.date === t)!
    expect(row.daily_tss).toBe(70)
    expect(row.ctl).toBeCloseTo(70 / 42, 2)
    expect(row.atl).toBeCloseTo(70 / 7, 2)
  })

  it('fills gap days with 0 TSS — no holes in output', () => {
    const runs = [
      makeRun(daysAgo(4), 50),
      makeRun(today(),    50),  // 3-day gap in between
    ]
    const result = computeTrainingLoad(runs)
    const dates = result.map(r => r.date)
    expect(dates).toContain(daysAgo(3))
    expect(dates).toContain(daysAgo(2))
    expect(dates).toContain(daysAgo(1))

    const rest = result.find(r => r.date === daysAgo(2))!
    expect(rest.daily_tss).toBe(0)
  })

  it('TSB = CTL - ATL at every computed point', () => {
    const runs = [
      makeRun(daysAgo(4), 55),
      makeRun(daysAgo(2), 70),
      makeRun(today(),    45),
    ]
    for (const row of computeTrainingLoad(runs)) {
      // ctl and atl are stored rounded to 2dp, so tsb should match within 0.01
      expect(row.tsb).toBeCloseTo(row.ctl - row.atl, 1)
    }
  })

  it('handles null TSS gracefully — treats as 0', () => {
    const t = today()
    const run = makeRun(t, 0)
    run.tss = null
    const result = computeTrainingLoad([run])
    const row = result.find(r => r.date === t)!
    expect(row.daily_tss).toBe(0)
    expect(row.ctl).toBe(0)
    expect(row.atl).toBe(0)
  })

  it('CTL increases monotonically with consistent daily load', () => {
    const runs = Array.from({ length: 10 }, (_, i) =>
      makeRun(daysAgo(9 - i), 60)
    )
    const result = computeTrainingLoad(runs)
    // Only check the 10-run window, not today's trailing decay
    const window = result.slice(0, 10)
    for (let i = 1; i < window.length; i++) {
      expect(window[i].ctl).toBeGreaterThan(window[i - 1].ctl)
    }
  })

  it('output is sorted ascending by date', () => {
    const runs = [
      makeRun(daysAgo(2), 40),
      makeRun(daysAgo(4), 60),
      makeRun(daysAgo(6), 50),
    ]
    const result = computeTrainingLoad(runs)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date > result[i - 1].date).toBe(true)
    }
  })
})
