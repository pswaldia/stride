import { getRuns, getWeeklyMileage, getLatestTrainingLoad } from '@/lib/supabase/queries'
import { StatCard } from '@/components/ui/StatCard'
import { TrainingLoadMini } from '@/components/ui/TrainingLoadMini'
import { WeeklyMileageChart } from '@/components/charts/WeeklyMileageChart'
import { CalendarSection } from './CalendarSection'
import {
  IconRoad,
  IconClock,
  IconHeartRateMonitor,
  IconMountain,
} from '@tabler/icons-react'
import type { Run } from '@/types/database'

// ─── Week range helpers ───────────────────────────────────────────────────────

function mondayOf(d: Date): Date {
  const day = d.getDay()                      // 0=Sun
  const diff = day === 0 ? -6 : 1 - day       // offset to Monday
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

function isoDate(d: Date) { return d.toISOString().substring(0, 10) }

function weekRange(weeksAgo: number) {
  const now    = new Date()
  const monday = mondayOf(now)
  monday.setDate(monday.getDate() - weeksAgo * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: isoDate(monday), to: isoDate(sunday) }
}

// ─── Stats computation ────────────────────────────────────────────────────────

function weekStats(runs: Run[], from: string, to: string) {
  const filtered = runs.filter((r) => r.date >= from && r.date <= to)
  const withPace = filtered.filter((r) => r.avg_pace_s)
  const withHr   = filtered.filter((r) => r.avg_hr)
  return {
    distance_km: filtered.reduce((s, r) => s + r.distance_m, 0) / 1000,
    avg_pace_s:  withPace.length ? withPace.reduce((s, r) => s + r.avg_pace_s!, 0) / withPace.length : 0,
    avg_hr:      withHr.length   ? withHr.reduce((s, r) => s + r.avg_hr!, 0) / withHr.length : 0,
    elevation_m: filtered.reduce((s, r) => s + r.elevation_m, 0),
  }
}

function trendPct(curr: number, prev: number) {
  if (!prev || !curr) return null   // hide badge when either week has no data
  return { pct: Math.round(((curr - prev) / prev) * 100) }
}

function paceStr(s: number) {
  if (!s) return '—'
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const thisWeek = weekRange(0)
  const lastWeek = weekRange(1)

  const [allRuns, weeklyMileage, trainingLoad] = await Promise.all([
    getRuns({ limit: 500 }),
    getWeeklyMileage(8),
    getLatestTrainingLoad(),
  ])

  const curr = weekStats(allRuns, thisWeek.from, thisWeek.to)
  const prev = weekStats(allRuns, lastWeek.from, lastWeek.to)

  const stats = [
    {
      icon: <IconRoad size={13} />,
      label: 'This week',
      value: curr.distance_km.toFixed(1),
      unit: 'km',
      trend: trendPct(curr.distance_km, prev.distance_km),
    },
    {
      icon: <IconClock size={13} />,
      label: 'Avg pace',
      value: paceStr(curr.avg_pace_s),
      unit: '/km',
      // pace: lower is better — invert sign
      trend: (prev.avg_pace_s && curr.avg_pace_s)
        ? { pct: Math.round(((prev.avg_pace_s - curr.avg_pace_s) / prev.avg_pace_s) * 100) }
        : null,
    },
    {
      icon: <IconHeartRateMonitor size={13} />,
      label: 'Avg HR',
      value: curr.avg_hr ? String(Math.round(curr.avg_hr)) : '—',
      unit: 'bpm',
      trend: trendPct(curr.avg_hr, prev.avg_hr),
    },
    {
      icon: <IconMountain size={13} />,
      label: 'Elevation',
      value: String(curr.elevation_m),
      unit: 'm',
      trend: trendPct(curr.elevation_m, prev.elevation_m),
    },
  ]

  return (
    <div className="p-6 md:p-7 max-w-[1100px] space-y-5">

      <div>
        <h1 className="text-[18px] font-medium font-outfit text-[var(--text)]">Dashboard</h1>
        <p className="text-[12px] text-[var(--text3)] font-jakarta mt-0.5">Your training at a glance</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Calendar + run detail panel */}
      <CalendarSection runs={allRuns} />

      {/* Chart + training load side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <WeeklyMileageChart data={weeklyMileage} />
        </div>
        <div>
          <TrainingLoadMini load={trainingLoad} />
        </div>
      </div>

    </div>
  )
}
