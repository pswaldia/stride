'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface WeekData { week_start: string; total_km: number }

interface WeeklyMileageChartProps { data: WeekData[] }

function weekLabel(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-3 py-2 text-[12px] shadow-sm">
      <div className="text-[var(--text3)] font-jakarta mb-0.5">{weekLabel(payload[0].payload.week_start)}</div>
      <div className="text-[var(--text)] font-medium font-outfit">{Number(payload[0].value).toFixed(1)} km</div>
    </div>
  )
}

export function WeeklyMileageChart({ data }: WeeklyMileageChartProps) {
  if (!data.length) return null

  const sorted = [...data].sort(
    (a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
  )
  const latestWeek = sorted[sorted.length - 1]?.week_start

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-medium font-outfit text-[var(--text)]">Weekly mileage</span>
        <span className="text-[11px] text-[var(--text3)] font-jakarta">Last 8 weeks</span>
      </div>
      <ResponsiveContainer width="100%" height={148}>
        <BarChart data={sorted} barSize={22} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="week_start"
            tickFormatter={weekLabel}
            tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-jakarta)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--font-jakarta)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface2)' }} />
          <Bar dataKey="total_km" radius={[3, 3, 0, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={entry.week_start}
                fill={entry.week_start === latestWeek ? 'var(--accent)' : 'var(--border2)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
